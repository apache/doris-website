---
{
    "title": "HLL 近似去重",
    "language": "zh-CN",
    "description": "如何用 HLL（HyperLogLog）在 Doris 中实现近似去重？误差 1%-2%，空间复杂度 O(mloglogn)，适合大规模 UV/基数统计。",
    "keywords": [
        "HLL",
        "HyperLogLog",
        "近似去重",
        "基数统计",
        "UV 统计",
        "HLL_UNION_AGG",
        "HLL_HASH"
    ]
}
---

<!-- 知识类型: 能力定义 / 操作步骤 -->
<!-- 适用场景: 大规模数据去重 / UV 统计 / 基数估算 -->

HLL（HyperLogLog）是一种基于概率算法的近似去重方案，在 1%-2% 误差范围内，以极低的空间和时间开销完成海量数据的基数（Distinct Count）统计。

## 使用场景

<!-- 知识类型: 架构选型决策 -->

随着业务数据量不断增大，精准去重的计算和存储成本随之飙升。当数据规模达到一定量级后，使用精准去重已不经济。

HLL 算法具备以下特性：

| 维度       | 表现                          |
| :--------- | :---------------------------- |
| 空间复杂度 | O(mloglogn)                   |
| 时间复杂度 | O(n)                          |
| 误差范围   | 约 1%-2%（与数据集与哈希函数有关） |

在业务可接受误差的前提下，使用 HLL 进行近似去重是降低计算压力、加速查询的有效方式。

- 适合谁用：数据量巨大、可接受 1%-2% 误差、追求查询性能与存储成本平衡的场景。
- 怎么用：建表时将列类型设为 `HLL`、聚合函数设为 `HLL_UNION`，导入时通过 `HLL_HASH()` 生成 HLL 值，查询时使用 `HLL_UNION_AGG()` 聚合。
- 常见用途：UV 统计、用户去重、独立设备数估算。

## 什么是 HyperLogLog

<!-- 知识类型: 原理说明 -->

HyperLogLog 是 LogLog 算法的升级版，用于提供不精确的基数（去重计数）估算，其数学基础为**伯努利试验**。

### 伯努利试验直观解释

- 假设硬币有正反两面，单次抛硬币得到正反面的概率各为 50%。
- 一直抛硬币直到出现正面，记录为一次完整试验。
- 重复进行 n 次试验，意味着出现了 n 次正面；记每次试验所抛掷的次数为 k，第 i 次试验记为 k_i。
- 在 n 次试验中，必然存在一个最大抛掷次数，记为 k_max（例如某次试验抛了 12 次才出现正面）。

### 由此得出的结论

- n 次伯努利试验的投掷次数都不大于 k_max。
- n 次伯努利试验中至少有一次投掷次数等于 k_max。

结合极大似然估算，可得到 n 与 k_max 的估算关系：**n = 2 ^ k_max**。

也就是说，**只要记录 k_max，即可估算总共有多少条数据，即基数**。这正是 HLL 算法的核心思想。

## 使用 HLL 进行近似去重

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 建表 -> 导入 -> 查询 -->

### 步骤 1：创建表

**目的**：创建一张支持 HLL 去重的聚合表。

**约束**：

1. 目标列类型需设为 `HLL`，聚合函数需设为 `HLL_UNION`。
2. HLL 类型的列不能作为 Key 列使用。
3. 用户不需要指定长度及默认值，HLL 列长度由系统根据数据聚合程度内部控制。

**示例**：

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

### 步骤 2：导入数据

**目的**：将原始明细数据通过 `HLL_HASH()` 转换为 HLL 列后写入表中。

**示例数据**（`test_hll.csv`）：

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

#### Stream Load 导入命令

```SQL
curl --location-trusted -u root: -H "label:label_test_hll_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os,uv=hll_hash(id)" -T test_hll.csv http://fe_IP:8030/api/demo/test_hll/_stream_load
```

#### 导入结果示例

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

### 步骤 3：查询数据

**目的**：通过 HLL 聚合函数获得近似去重结果。

> 注意：HLL 列不允许直接查询原始值，只能通过 HLL 的聚合函数进行查询。

#### 求总的 UV

```SQL
mysql> select HLL_UNION_AGG(uv) from test_hll;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
+---------------------+
1 row in set (0.00 sec)
```

等价写法：

```SQL
mysql> SELECT COUNT(DISTINCT uv) FROM test_hll;
+----------------------+
| count(DISTINCT `uv`) |
+----------------------+
|                    4 |
+----------------------+
1 row in set (0.01 sec)
```

#### 求每一天的 UV

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

<!-- 知识类型: 配置参数 / 函数清单 -->

| 函数                       | 用途                                                                 |
| :------------------------- | :------------------------------------------------------------------- |
| `HLL_UNION_AGG(hll)`       | 聚合函数，用于计算满足条件的所有数据的基数估算                        |
| `HLL_CARDINALITY(hll)`     | 计算单条 HLL 列的基数估算                                            |
| `HLL_HASH(column_name)`    | 生成 HLL 列类型，用于 Insert 或导入时（导入用法见上文）              |
| `HLL_EMPTY()`              | 生成空 HLL 列，用于 `insert` 或导入数据时补充默认值                  |
