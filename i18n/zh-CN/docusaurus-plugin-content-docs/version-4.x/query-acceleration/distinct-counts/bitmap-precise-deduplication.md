---
{
    "title": "BITMAP 精准去重",
    "language": "zh-CN",
    "description": "如何用 Bitmap 替代 COUNT DISTINCT 实现精确去重？本文介绍建表、导入与查询完整流程。",
    "keywords": [
        "BITMAP 精准去重",
        "COUNT DISTINCT 优化",
        "BITMAP_UNION",
        "bitmap_union_count",
        "Doris 去重加速",
        "RoaringBitmap"
    ]
}
---

<!-- 知识类型: 能力定义 / 操作步骤 -->
<!-- 适用场景: 大数据量精确去重 / 查询性能调优 -->

BITMAP 精准去重是一种利用位图数据结构替代 `COUNT DISTINCT`，在大数据量下实现高性能精确去重的能力。相比 `COUNT DISTINCT`，使用 Bitmap 进行精确去重具备以下优势：

- 提高查询速度
- 减少内存 / 磁盘占用

## COUNT DISTINCT 的实现

<!-- 知识类型: 背景原理 -->

传统的精确去重依赖 `count distinct` 实现。假设原始数据如下，需要对 `name` 列进行精确去重：

| id   | name |
| ---- | ---- |
| 1    | bob  |
| 2    | alex |
| 3    | jack |
| 4    | tom  |
| 5    | bob  |
| 6    | alex |

执行 `select count(distinct name) from t` 时，Doris 会按下图进行计算：先根据 `name` 列 `group by` 完成一阶段去重，shuffle 之后二阶段再次去重，最终计算 `count`。

![Count Distinct](/images/next/query-acceleration/count-distinct.jpg)

由于 `COUNT DISTINCT` 需要保存计算明细数据，并且需要进行 shuffle，当数据量增大时，查询会越来越慢。使用 Bitmap 精准去重，正是为了解决 `COUNT DISTINCT` 在大数据量场景下的性能问题。

### 使用场景

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 选型判断 -->

Bitmap 将明细数据映射为 bit 位，以放弃明细数据灵活性为代价，大幅提升计算效率。在以下场景中，可以考虑使用 Bitmap 进行精准去重：

| 场景 | 说明 |
| --- | --- |
| 查询加速 | Bitmap 利用位运算进行查询计算，性能表现良好 |
| 压缩存储 | 明细数据被压缩为一个 bit 位，磁盘和内存消耗都远低于明细数据 |

**使用限制**：

- Bitmap 仅支持对 `TINYINT`、`SMALLINT`、`INT` 和 `BIGINT` 类型的数据进行精准去重
- 如需对其他类型的数据进行精准去重，需要额外构建全局字典
- Bitmap 类型的列不能作为 Key 列使用

> Doris 使用 RoaringBitmap 实现 Bitmap 精准去重，原理与细节可参考 [RoaringBitmap](https://roaringbitmap.org/)。

## 使用 BITMAP 进行精确去重

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 建表 → 导入 → 查询 -->

整体流程分为三步：**建表 → 导入数据 → 查询数据**。

### 第一步：创建表

**目的**：将目标列声明为 Bitmap 类型，并配置聚合函数 `BITMAP_UNION`。

**注意事项**：

1. 使用 Bitmap 去重时，需在建表语句中将目标列类型设置为 `Bitmap`，聚合函数设置为 `BITMAP_UNION`
2. Bitmap 类型的列不能作为 Key 列使用

**示例**：创建聚合表 `test_bitmap`，其中 `id` 列表示访问用户 ID，`uv` 列类型为 `BITMAP`，使用聚合函数 `BITMAP_UNION` 来聚合数据。

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

### 第二步：导入数据

**目的**：通过 Stream Load 将原始明细数据导入，并在导入时通过 `to_bitmap(id)` 转换为 Bitmap 类型。

**示例数据**（`test_bitmap.csv`）：

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

**Stream Load 命令**：

```SQL
curl --location-trusted -u root: -H "label:label_test_bitmap_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os, uv=to_bitmap(id)" -T test_bitmap.csv http://fe_IP:8030/api/demo/test_bitmap/_stream_load
```

### 第三步：查询数据

**目的**：通过 `bitmap_union_count` 聚合函数读取 Bitmap 列的去重结果。

> Bitmap 列不允许直接查询原始值，只能通过 `bitmap_union_count` 聚合函数进行查询。

**场景一：求总的 UV**

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
mysql> SELECT COUNT(DISTINCT id) FROM test_bitmap;
+----------------------+
| count(DISTINCT `id`) |
+----------------------+
|                    4 |
+----------------------+
1 row in set (0.01 sec)
```

**场景二：求每一天的 UV**

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

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 常见问题 -->

**Q1：Bitmap 支持哪些数据类型的精准去重？**

仅支持 `TINYINT`、`SMALLINT`、`INT` 和 `BIGINT`。如需对字符串等其他类型去重，需要额外构建全局字典。

**Q2：Bitmap 列可以作为 Key 列吗？**

不可以。Bitmap 类型的列只能作为 Value 列使用，且必须配合聚合函数 `BITMAP_UNION`。

**Q3：为什么不能直接查询 Bitmap 列的原始值？**

Bitmap 是位图结构，不存储明细。需要通过 `bitmap_union_count` 等聚合函数读取去重结果。

**Q4：Bitmap 相比 COUNT DISTINCT 有什么优势？**

| 对比项 | COUNT DISTINCT | BITMAP 精准去重 |
| --- | --- | --- |
| 计算方式 | 保存明细 + shuffle 去重 | 位运算 |
| 查询速度 | 数据量大时变慢 | 显著更快 |
| 资源占用 | 明细数据占用大 | 磁盘 / 内存占用低 |
| 数据类型 | 任意类型 | 仅整型，需要全局字典支持其他类型 |
