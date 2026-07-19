---
{
    "title": "行列混存",
    "language": "zh-CN",
    "description": "Doris 行列混存（Row Store）在列存基础上叠加行存，将宽表点查的多次 IO 合并为一次，显著降低 IOPS 与查询延迟。"
}
---

<!-- 知识类型: 特性介绍 / 配置参数 -->
<!-- 适用场景: 宽表点查 / TOPN 查询性能调优 -->

**行列混存（Row Store）** 是 Doris 在列式存储基础上为同一行数据额外存储一份紧凑二进制行存的能力，使点查场景从「每列一次 IO」变为「一次 IO 读取整行」。该能力自 Doris 2.0.0 版本起支持。

Doris 默认采用列式存储，每个列连续存储。列存在分析场景（聚合、过滤、排序等）中表现优异，因为只需读取所需的列。但在点查场景（如 `SELECT *`）中需要读取所有列，每列一次 IO，在列数较多的宽表（如上百列）上 IOPS 会成为瓶颈。

开启行存后，系统在存储时增加一个额外的列，将该行所有列拼接为紧凑二进制格式存储。点查时只需一次 IO 即可读取完整行数据，大幅降低 IOPS、提升查询延迟。

## 适用场景

行列混存主要面向以下两类查询，可参考下表快速判断是否适合开启：

| 场景 | 典型查询模式 | 表模型要求 | 是否推荐 |
|------|-------------|-----------|---------|
| 主键高并发点查 | `SELECT ... FROM t WHERE pk1 = ? AND pk2 = ?` | Unique Key MOW 表 | 推荐 |
| 宽表 TOPN 查询 | `SELECT * FROM t [WHERE ...] ORDER BY ... LIMIT N` | Duplicate 表 / Unique Key MOW 表 | 推荐 |
| 分析查询 | 聚合、对少数列的复杂过滤等 | — | 不推荐（列存即可） |

下文按场景分别介绍触发条件、建表方式与查询示例。

## 场景一：主键高并发点查

适用于 Unique Key MOW 表上根据完整主键查找特定行的高并发场景。命中后查询走 Short-Circuit 路径，绕过常规执行链路。

### 触发条件

需**同时满足**以下所有条件：

1. 表为 Unique Key MOW 表（`"enable_unique_key_merge_on_write" = "true"`）。
2. 已通过 `"store_row_column" = "true"` 或 `"row_store_columns" = "..."` 开启行存。
3. `WHERE` 子句包含**所有主键列的等值条件**，并以 `AND` 连接。

### 建表示例

以下示例创建一张 8 列的表，仅对其中 5 列开启行存，并将 `page_size` 设为 4 KB 以获得最佳点查性能：

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

### 查询示例

```sql
-- 查询全部列
SELECT * FROM tbl_point_query WHERE k = 100;

-- 查询部分列
SELECT k, v1, v3, v5, v7 FROM tbl_point_query WHERE k = 100;
```

**部分列行存的处理：** 如果行存只包含部分列（如 `v1`），但查询请求了不在行存中的列（如 `v2`），Doris 会从列存中读取缺失的列。行存中的列仍然高效读取，其余列执行正常的列存 IO。

### 验证方法

对查询执行 `EXPLAIN`，输出中应包含 `SHORT-CIRCUIT` 标记。详见 [高并发点查](../query-acceleration/high-concurrent-point-query)。

## 场景二：TOPN 延迟物化查询

适用于 Duplicate 表或 Unique Key MOW 表上「排序后取少量行」的宽表 `SELECT *` 查询。命中后查询走 Fetch Row Store 路径，配合 TOPN 两阶段优化仅获取实际命中的行。

### 触发条件

需**同时满足**以下所有条件：

1. 表为 Duplicate 表，或 Unique Key MOW 表（`"enable_unique_key_merge_on_write" = "true"`）。
2. 必须对**所有列**开启行存（`"store_row_column" = "true"`）。
3. 查询符合 `SELECT * FROM tbl [WHERE ...] ORDER BY ... LIMIT N` 模式。
4. 必须是 `SELECT *`，不支持选择特定列。
5. 需命中 TOPN 延迟物化优化，详见 [TOPN 查询优化](../query-acceleration/optimization-technology-principle/topn-optimization)。

### 建表示例

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
Duplicate 表必须设置 `"store_row_column" = "true"`，不支持通过 `row_store_columns` 指定部分列——所有列均会存入行存。
:::

### 查询示例

```sql
SELECT * FROM tbl_duplicate WHERE k < 10 ORDER BY k LIMIT 10;
```

### 验证方法

对查询执行 `EXPLAIN`，输出中应同时包含 `FETCH ROW STORE` 标记和 `OPT TWO PHASE` 标记。

## 配置参数

通过 `CREATE TABLE` 的 `PROPERTIES` 设置以下参数：

| 参数 | 默认值 | 支持版本 | 说明 |
|------|--------|---------|------|
| `store_row_column` | `false` | 2.0+ | 设为 `true` 时对**所有列**开启行存。 |
| `row_store_columns` | 全部列 | 3.0+ | 仅对**指定列**开启行存，格式为 `"col1,col2,..."`。设置该参数时 `store_row_column` 隐式启用，相比全量行存可显著降低存储开销。 |
| `row_store_page_size` | `16384`（16 KB） | 2.0+ | 行存 page 大小（字节）。page 是最小 IO 单元——即使只读一行也需产生一个 page 的 IO。 |

### `row_store_page_size` 调优建议

`row_store_page_size` 直接影响点查性能与存储开销之间的权衡：

| 优化目标 | 建议值 | 权衡 |
|---------|--------|------|
| 最佳点查性能 | 4096（4 KB）或更小 | 存储开销更高 |
| 均衡（默认） | 16384（16 KB） | — |
| 最小存储开销 | 65536（64 KB）或更大 | 点查延迟更高 |

## 注意事项

1. **存储开销：** 开启行存会增加磁盘使用量。根据数据特点，额外存储通常为原表大小的 2–10 倍。建议使用实际数据测试以评估影响。
2. **page_size 影响存储：** 较小的 `row_store_page_size` 可提升点查性能，但会增加存储开销。调优建议详见[配置参数](#配置参数)章节。
3. **不支持 ALTER：** 不支持通过 `ALTER TABLE` 修改 `store_row_column` 与 `row_store_columns` 属性。
