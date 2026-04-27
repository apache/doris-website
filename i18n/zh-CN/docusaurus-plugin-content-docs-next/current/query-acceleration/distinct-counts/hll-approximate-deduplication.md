---
{
    "title": "HLL 近似去重",
    "language": "zh-CN",
    "description": "在实际的业务场景中，随着业务数据量越来越大，数据去重的压力也随之增大，当数据达到一定规模之后，使用精准去重的成本也越来越高。HLL 的特点是具有非常优异的空间复杂度 O(mloglogn)，时间复杂度为 O(n)，并且计算结果的误差可控制在 1%—2% 左右，"
}
---

# HLL 近似去重

## 使用场景

在实际的业务场景中，随着业务数据量越来越大，数据去重的压力也随之增大，当数据达到一定规模之后，使用精准去重的成本也越来越高。HLL 的特点是具有非常优异的空间复杂度 O(mloglogn)，时间复杂度为 O(n)，并且计算结果的误差可控制在 1%—2% 左右，误差与数据集大小以及所采用的哈希函数有关。

在业务可以接受的情况下，通过近似算法来实现快速去重降低计算压力是一个非常好的方式。

## 什么是 HyperLogLog

它是 LogLog 算法的升级版，作用是能够提供不精确的去重计数。其数学基础为**伯努利试验**。

假设硬币拥有正反两面，一次的上抛至落下，最终出现正反面的概率都是 50%。一直抛硬币，直到它出现正面为止，我们记录为一次完整的实验。

那么对于多次的伯努利试验，假设这个多次为 n 次。就意味着出现了 n 次的正面。假设每次伯努利试验所经历了的抛掷次数为 k。第一次伯努利试验，次数设为 k1，以此类推，第 n 次对应的是 kn。

其中，对于这 n 次伯努利试验中，必然会有一个最大的抛掷次数 k，例如抛了 12 次才出现正面，那么称这个为 k_max，代表抛了最多的次数。

伯努利试验容易得出有以下结论：

- n 次伯努利过程的投掷次数都不大于 k_max。
- n 次伯努利过程，至少有一次投掷次数等于 k_max

最终结合极大似然估算的方法，发现在 n 和 k_max 中存在估算关联：n = 2 ^ k_max。**当我们只记录了 k_max 时，即可估算总共有多少条数据，也就是基数。**

## 使用 HLL 进行近似去重

### 创建表

1. 使用 HLL 去重的时候，需要在建表语句中将目标列类型设置成 HLL，聚合函数设置成 HLL_UNION
2. HLL 类型的列不能作为 Key 列使用
3. 用户不需要指定长度及默认值，长度根据数据聚合程度系统内控制

```SQL
create table test_hll(
        dt date,
        id int,
        name char(10),
        province char(10),
        os char(10),
        uv hll hll_union
)
Aggregate KEY (dt,id,name,province,os)
distributed by hash(id) buckets 10
PROPERTIES(
        "replication_num" = "1",
        "in_memory"="false"
);
```

### 导入数据

示例数据如下（test_hll.csv)，这里通过 Stream Load 导入

```SQL
2022-05-05,10001,测试 01,北京,windows 
2022-05-05,10002,测试 01,北京,linux 
2022-05-05,10003,测试 01,北京,macos 
2022-05-05,10004,测试 01,河北,windows 
2022-05-06,10001,测试 01,上海,windows 
2022-05-06,10002,测试 01,上海,linux 
2022-05-06,10003,测试 01,江苏,macos 
2022-05-06,10004,测试 01,陕西,windows
```

#### Stream load 导入

```SQL
curl --location-trusted -u root: -H "label:label_test_hll_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os,uv=hll_hash(id)" -T test_hll.csv http://fe_IP:8030/api/demo/test_hll/_stream_load
```

 导入结果如下

```SQL
# curl --location-trusted -u root: -H "label:label_test_hll_load"     -H "column_separator:,"     -H "columns:dt,id,name,province,os, pv=hll_hash(id)" -T test_hll.csv http://127.0.0.1:8030/api/demo/test_hll/_stream_load

{
    "TxnId": 693,
    "Label": "label_test_hll_load",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 8,
    "NumberLoadedRows": 8,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 320,
    "LoadTimeMs": 23,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9,
    "CommitAndPublishTimeMs": 11
}
```

#### 查询数据

HLL 列不允许直接查询原始值，只能通过 HLL 的聚合函数进行查询。

**求总的 UV**

```SQL
mysql> select HLL_UNION_AGG(uv) from test_hll;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
+---------------------+
1 row in set (0.00 sec)
```

   等价于：

```SQL
mysql> SELECT COUNT(DISTINCT uv) FROM test_hll;
+----------------------+
| count(DISTINCT `uv`) |
+----------------------+
|                    4 |
+----------------------+
1 row in set (0.01 sec)
```

**求每一天的 UV**

```SQL
mysql> select HLL_UNION_AGG(uv) from test_hll group by dt;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
|                   4 |
+---------------------+
2 rows in set (0.01 sec)
```

## 相关函数

**HLL_UNION_AGG(hll)**：此函数为聚合函数，用于计算满足条件的所有数据的基数估算

**HLL_CARDINALITY(hll)**：此函数用于计算单条 HLL 列的基数估算

**HLL_HASH(column_name)**：生成 HLL 列类型，用于 Insert 或导入的时候，导入的使用见上文

**HLL_EMPTY()**：生成空 HLL 列，用于 `insert` 或导入数据时补充默认值
