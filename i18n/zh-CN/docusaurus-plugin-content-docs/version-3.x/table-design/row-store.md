---
{
    "title": "行列混存",
    "language": "zh-CN",
    "description": "Doris 行列混存功能在列存基础上增加行存，降低宽表点查场景的 IOPS 开销。"
}
---

## 概述

Doris 默认采用列式存储，每个列连续存储。列存在分析场景（聚合、过滤、排序等）表现优异，因为只需读取所需的列。但在点查场景（如 `SELECT *`）中需要读取所有列，每列一次 IO，在列数较多的宽表（如上百列）上 IOPS 会成为瓶颈。

为此，Doris 从 2.0.0 版本开始支持**行列混存**。在建表时开启行存后，系统会在存储时增加一个额外的列，将该行所有列拼接为紧凑二进制格式存储。点查时只需一次 IO 即可读取完整行数据，大幅降低 IOPS、提升查询延迟。

## 适用场景

以下场景推荐开启行存：

- **主键高并发点查**：在 Unique Key Merge-On-Write（MOW）表上，根据完整主键查找特定行。
- **宽表 `SELECT *` 查询**：在 Duplicate 表或 MOW 表上，仅返回少量行的 TOPN 查询。

如果业务以分析查询为主（聚合、对少数列的复杂过滤等），通常仅列存即可满足需求。

## 建表配置

通过 `CREATE TABLE` 的 `PROPERTIES` 设置行存相关参数：

| 参数 | 默认值 | 支持版本 | 说明 |
|------|--------|---------|------|
| `"store_row_column" = "true"` | `false` | 2.0+ | 对**所有列**开启行存。 |
| `"row_store_columns" = "col1,col2,..."` | 全部列 | 3.0+ | 仅对**指定列**开启行存。设置此参数时 `store_row_column` 隐式启用。相比全量行存可显著降低存储开销。 |
| `"row_store_page_size" = "16384"` | `16384`（16 KB） | 2.0+ | 行存 page 大小（字节）。page 是最小 IO 单元——即使只读一行也需产生一个 page 的 IO。 |

**`row_store_page_size` 调优建议：**

| 优化目标 | 建议 page_size | 权衡 |
|---------|---------------|------|
| 最佳点查性能 | 4096（4 KB）或更小 | 存储开销更高 |
| 均衡（默认） | 16384（16 KB） | — |
| 最小存储开销 | 65536（64 KB）或更大 | 点查延迟更高 |

## 行存命中条件

行存在以下两种场景中被触发，各有不同的前提条件。

### 场景一：主键高并发点查（Short-Circuit）

需要**同时满足**以下所有条件：

1. 表为 **Unique Key MOW 表**（`"enable_unique_key_merge_on_write" = "true"`）。
2. 已通过 `"store_row_column" = "true"` 或 `"row_store_columns" = "..."` 开启行存。
3. `WHERE` 子句包含**所有主键列的等值条件**，用 `AND` 连接。

查询示例：

```sql
-- 查询全部列
SELECT * FROM tbl WHERE k1 = 1 AND k2 = 2;

-- 查询部分列
SELECT v1, v2 FROM tbl WHERE k1 = 1 AND k2 = 2;
```

**部分列行存的处理：** 如果行存只包含部分列（如 `v1`），但查询还请求了不在行存中的列（如 `v2`），Doris 会从列存中读取缺失的列。行存中的列仍然高效读取，其余列执行正常的列存 IO。

**验证方法：** 对查询执行 `EXPLAIN`，检查输出中是否包含 `SHORT-CIRCUIT` 标记。详见 [高并发点查](../query-acceleration/high-concurrent-point-query)。

### 场景二：TOPN 延迟物化查询（Fetch Row Store）

需要**同时满足**以下所有条件：

1. 表为 **Duplicate 表**或 **Unique Key MOW 表**（`"enable_unique_key_merge_on_write" = "true"`）。
2. 必须对**所有列**开启行存（`"store_row_column" = "true"`）。
3. 查询满足 `SELECT * FROM tbl [WHERE ...] ORDER BY ... LIMIT N` 模式。
4. 必须是 `SELECT *`——不支持选择特定列。
5. 需要命中 TOPN 延迟物化优化。详见 [TOPN 查询优化](../query-acceleration/optimization-technology-principle/topn-optimization)。

**验证方法：** 对查询执行 `EXPLAIN`，检查输出中是否同时包含 `FETCH ROW STORE` 和 `OPT TWO PHASE` 标记。

## 使用示例

### 示例一：Unique Key MOW 表 + 部分列行存

创建一个 8 列的表，对其中 5 列开启行存，设置 `page_size` 为 4 KB 以获得最佳点查性能：

```sql
CREATE TABLE `tbl_point_query` (
    `k` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "row_store_columns" = "k,v1,v3,v5,v7",
    "row_store_page_size" = "4096"
);
```

执行点查：

```sql
SELECT k, v1, v3, v5, v7 FROM tbl_point_query WHERE k = 100;
```

对该语句执行 `EXPLAIN`，输出中应包含 `SHORT-CIRCUIT` 标记。更多用法详见 [高并发点查](../query-acceleration/high-concurrent-point-query)。

### 示例二：Duplicate 表 + 全量行存

创建一个 Duplicate 表，对所有列开启行存：

```sql
CREATE TABLE `tbl_duplicate` (
    `k` int(11) NULL,
    `v1` string NULL
) ENGINE=OLAP
DUPLICATE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "light_schema_change" = "true",
    "store_row_column" = "true",
    "row_store_page_size" = "4096"
);
```

:::note
Duplicate 表必须设置 `"store_row_column" = "true"`，不支持 `row_store_columns` 指定部分列——所有列均会存入行存。
:::

执行 TOPN 查询：

```sql
SELECT * FROM tbl_duplicate WHERE k < 10 ORDER BY k LIMIT 10;
```

对该语句执行 `EXPLAIN`，输出中应同时包含 `FETCH ROW STORE` 标记和 `OPT TWO PHASE` 标记。

## 注意事项

1. **存储开销：** 开启行存会增加磁盘使用量。根据数据特点，额外存储通常为原表大小的 2–10 倍。建议使用实际数据测试以评估影响。
2. **page_size 影响存储：** 较小的 `row_store_page_size` 可提升点查性能，但会增加存储开销。调优建议详见[建表配置](#建表配置)章节。
3. **不支持 ALTER：** 不支持通过 `ALTER TABLE` 修改 `store_row_column` 和 `row_store_columns` 属性。
