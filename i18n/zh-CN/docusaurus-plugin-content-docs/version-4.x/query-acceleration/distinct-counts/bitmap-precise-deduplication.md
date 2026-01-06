---
{
    "title": "BITMAP 精准去重",
    "language": "zh-CN",
    "description": "本文介绍如何通过 Bitmap 类型实现精确去重。"
}
---

# BITMAP 精准去重

本文介绍如何通过 Bitmap 类型实现精确去重。

Bitmap 是一种高效的位图索引技术，它通过 bit 位来表示对应的数据是否存在。Bitmap 特别适用于需要高效执行集合操作（如并集、交集等）的场景，并且在内存使用上非常节约。使用 Bitmap 进行精确去重相比 Count distinct 去重：

-  提高查询速度 
-  减少内存/磁盘占用

## Count Distinct 的实现

传统的精确去重依赖`count distinct`实现，表原始数据如下，假设要 name 列进行精确去重

| id   | name |
| ---- | ---- |
| 1    | bob  |
| 2    | alex |
| 3    | jack |
| 4    | tom  |
| 5    | bob  |
| 6    | alex |

Doris 在计算时`select count(distinct name) from t`。会按照下图进行计算，先根据 name 列 group by，计算一阶段去重，shuffle 之后二阶段进行去重，最终计算 count

```SQL
        Scan                              1st Group By                       2nd Group By                     Count 
  +---------------+                   +------------+                       +------------+                +------------+ 
  | id  | name    |                   |   name     |                       |   name     |                | count(name)| 
  +-----+---------+                   +------------+                       +------------+                +------------+ 
  |  1  |   bob   |  ---------------> |    bob     |                       |    bob     |    ------->    |     4      | 
  |  2  |   alex  |                   |    alex    |                       |    alex    |                +------------+ 
  |  5  |   bob   |                   +------------+                       |    jack    | 
  |  6  |   alex  |                                                        |    tom     | 
  +---------------+                                                        +------------+ 
                                                        ----------------> 
                                           
                                           
  +---------------+                   +------------+ 
  | id  | name    |                   |   name     | 
  +-----+---------+  ---------------> +------------+ 
  |  3  |  jack   |                   |    jack    | 
  |  4  |   tom   |                   |    tom     | 
  +-----+---------+                   +------------+
```

由于 Count Distinct 需要保存计算明细数据，并且需要进行 shuffle，当数据量增大时，查询也会越来越慢。用 Bitmap 来精确去重，可以解决 count distinct 在大量数据场景下的性能问题。

### 使用场景

在实际的业务场景中，当数据达到一定规模之后，通过 count distinct 去重的成本也越来越高。查询也会越来越慢。而使用 Bitmap 精确去重，就是为了解决 count distinct 在大量数据场景下的性能问题。Bitmap 将对应明细数据映射为 bit 位，放弃了明细数据的灵活性下，大幅度提升计算效率。所以在如下场景可以考虑利用 Bitmap 进行精确去重：

- 查询加速：Bitmap 利用位运算进行查询计算，性能表现良好
- 压缩存储：由于将明细数据压缩为了一个 bit 位，Bitmap 类型无论在磁盘还是内存上，资源消耗都远远低于明细数据

但 Bitmap 只能对 TINYINT，SMALLINT，INT 和 BIGINT 类型的数据进行精确去重。如想要使用 Bitmap 对其他类型的数据精确去重，则需要额外构建全局字典。Doris 使用了 RoaringBitmap 实现了 Bitmap 的精确去重，原理和细节可以参考[RoaringBitmap](https://roaringbitmap.org/)。

## 使用 BITMAP 进行精确去重

### 创建表

1. 使用 Bitmap 去重的时候，需要在建表语句中将目标列类型设置成 Bitmap，聚合函数设置成 BITMAP_UNION
2. Bitmap 类型的列不能作为 Key 列使用

创建一张聚合表 `test_bitmap`。其中`id`列表示访问用户的 ID，这里添加了`uv`列类型为 BITMAP，表示使用聚合函数 BITMAP_UNION 来聚合数据，

```SQL
create table test_bitmap(
        dt date,
        id int,
        name char(10),
        province char(10),
        os char(10),
        uv bitmap bitmap_union
)
Aggregate KEY (dt,id,name,province,os)
distributed by hash(id) buckets 10;
```

### 导入数据

示例数据如下（test_bitmap.csv），可以通过 Stream Load 导入。

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

**Stream load 导入**

```SQL
curl --location-trusted -u root: -H "label:label_test_bitmap_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os, uv=to_bitmap(id)" -T test_bitmap.csv http://fe_IP:8030/api/demo/test_bitmap/_stream_load
```

## 查询数据

Bitmap 列不允许直接查询原始值，只能通过 bitmap_union_count 的聚合函数进行查询。

**求总的 UV**

```SQL
mysql> select bitmap_union_count(uv) from test_bitmap;
+---------------------+
| bitmap_union_count(`uv`) |
+---------------------+
|                   4 |
+---------------------+
1 row in set (0.00 sec)
```

   等价于：

```SQL
mysql> SELECT COUNT(DISTINCT pv) FROM test_bitmap;
+----------------------+
| count(DISTINCT `uv`) |
+----------------------+
|                    4 |
+----------------------+
1 row in set (0.01 sec)
```

**求每一天的 UV**

```SQL
mysql> select bitmap_union_count(uv) from test_bitmap group by dt;
+---------------------+
| bitmap_union_count(`uv`) |
+---------------------+
|                   4 |
|                   4 |
+---------------------+
2 rows in set (0.01 sec)
```
