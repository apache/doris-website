---
{
    "title": "UUID 数据类型",
    "sidebar_label": "UUID",
    "language": "zh-CN",
    "description": "原生 128 位 UUID 类型：输入格式、生成、类型转换、表设计与文件兼容性。"
}
---

## 描述

`UUID` 使用 16 字节存储 128 位通用唯一标识符，适用于需要紧凑存储、等值过滤、关联或排序的标识符。文本输出始终采用小写标准格式：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`。

## 语法和输入格式

```sql
UUID
```

| 属性 | 行为 |
| --- | --- |
| 存储 | 固定 16 字节；标准文本长度为 36 字符 |
| 标准格式输入 | 32 位十六进制数字，连字符位于 `8-4-4-4-12` 分组位置 |
| 紧凑格式输入 | 不带连字符的 32 位十六进制数字 |
| 大小写 | 接受大小写十六进制字母，输出统一为小写 |
| 取值范围 | `00000000-0000-0000-0000-000000000000` 至 `ffffffff-ffff-ffff-ffff-ffffffffffff` |
| 校验 | 检查文本格式，不要求特定的 UUID 版本或变体 |
| NULL | 可空列支持 NULL；全零 UUID 是有效值，与 `NULL` 不同 |
| 排序 | 按标准字节顺序进行无符号 128 位比较，等价于规范化后标准文本的字典序 |

## 基本用法

```sql
CREATE DATABASE IF NOT EXISTS uuid_demo;
USE uuid_demo;

CREATE TABLE uuid_events (
    id INT NOT NULL,
    event_id UUID NULL,
    generated_id UUID NOT NULL DEFAULT UUID_V7()
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO uuid_events (id, event_id) VALUES
    (1, '550E8400E29B41D4A716446655440000'),
    (2, '00000000-0000-0000-0000-000000000000'),
    (3, NULL);

SELECT id, event_id, UUID_VERSION(generated_id) AS generated_version
FROM uuid_events ORDER BY id;
```

```text
+----+--------------------------------------+-------------------+
| id | event_id                             | generated_version |
+----+--------------------------------------+-------------------+
| 1  | 550e8400-e29b-41d4-a716-446655440000 | 7                 |
| 2  | 00000000-0000-0000-0000-000000000000 | 7                 |
| 3  | NULL                                 | 7                 |
+----+--------------------------------------+-------------------+
```

每个被省略的 `generated_id` 都会获得一个生成值，其具体文本随执行而变化。

```sql
SELECT id FROM uuid_events
WHERE event_id = CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID);
```

```text
+----+
| id |
+----+
| 1  |
+----+
```

## 函数和类型转换

| 函数 | 结果及用途 |
| --- | --- |
| [UUID_V4](../../sql-functions/scalar-functions/uuid-functions/uuid-v4.md) | 原生随机 UUID v4；别名为 `GENERATE_UUID_V4()` 和 `GENERATEUUIDV4()` |
| [UUID_V7](../../sql-functions/scalar-functions/uuid-functions/uuid-v7.md) | 包含毫秒时间戳的原生 UUID v7；别名为 `GENERATE_UUID_V7()` 和 `GENERATEUUIDV7()` |
| [UUID_VERSION](../../sql-functions/scalar-functions/uuid-functions/uuid-version.md) | 返回 `TINYINT` 类型的版本字段（0–15），不验证变体 |
| [TO_UUID_OR_NULL](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-null.md) | 解析文本；无效文本及 `NULL` 均返回 `NULL` |
| [TO_UUID_OR_ZERO](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero.md) | 解析文本；无效文本返回全零 UUID，`NULL` 仍返回 `NULL` |
| [TO_UUID_OR_DEFAULT](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-default.md) | 解析文本；无效文本或 `NULL` 使用指定的默认 UUID，未指定时使用全零 UUID |
| [UUID_V7_TO_DATETIME](../../sql-functions/scalar-functions/uuid-functions/uuid-v7-to-datetime.md) | 提取时间戳，返回所选时区的 `DATETIME(3)` |
| [DATETIME_TO_UUID_V7](../../sql-functions/scalar-functions/uuid-functions/datetime-to-uuid-v7.md) | 根据按会话时区解释的日期时间生成 UUID v7 |
| [UUID](../../sql-functions/scalar-functions/string-functions/uuid.md) | 现有函数，返回 `VARCHAR`，而非原生 UUID 类型 |

使用 `CAST(text AS UUID)` 解析文本，使用 `CAST(uuid AS STRING)` 获取标准文本。`enable_strict_cast = true` 时，无效文本报错；关闭时，无效文本返回 `NULL`。`TRY_CAST(text AS UUID)` 在两种模式下均对无效文本返回 `NULL`。UUID 与整数、浮点数、日期时间或 IP 类型之间不支持直接 CAST。隐式转换、VARIANT 和迁移规则详见 [UUID 类型转换](conversion/uuid-conversion.md)。

现有 `IS_UUID()` 接受一些原生解析器拒绝的文本，例如带花括号的标准 UUID。校验 UUID 列的输入时，请使用 `TO_UUID_OR_NULL()` 或 `TRY_CAST`。

## 表设计和限制

- UUID 列可作为 Duplicate、Unique 和 Aggregate 表的 Key 列、Hash 分桶列以及手动 RANGE 或 LIST 分区列。分区边界使用带引号的 UUID 文本。基于数值步长批量创建 RANGE 分区的方式不适用于 UUID。
- UUID 值支持比较、`IN`、排序、分组、关联、`MIN`、`MAX` 和 `COUNT(DISTINCT ...)`。UUID 不是数值类型，不支持算术运算以及 `SUM`、`AVG` 等数值聚合。
- Aggregate 表的 UUID Value 列支持 `MIN`、`MAX`、`REPLACE` 和 `REPLACE_IF_NOT_NULL`。
- UUID 可用作 ARRAY 元素、MAP 的键或值以及 STRUCT 字段；外层复杂类型的原有限制仍然适用。
- UUID 支持前缀索引、ZoneMap、BloomFilter 和倒排索引。倒排索引使用不带文本分词器的等值或范围检索。UUID 不支持 NGRAM_BF 或向量索引。
- UUID 不能作为 `AUTO_INCREMENT` 列或 Sequence 列。
- 建表时，UUID 列支持字面量默认值以及 `UUID_V4()` / `UUID_V7()` 动态默认值（包括别名）。
- `ALTER TABLE ADD COLUMN` 支持 UUID 字面量默认值，但拒绝 UUID 生成函数默认值，因为无法为已有行回填独立且持久的生成值。Schema Change 不支持将其他类型的列直接修改为 UUID，也不支持将 UUID 修改为其他类型。应新建列或表，在写入时转换。

## 导入、导出和客户端

CSV 输入使用 UUID 文本字段；JSON 输入使用 JSON 字符串或 `null`。标准格式和紧凑格式均可接受。需要显式选择默认值时，可将源字段按文本读取，在列映射中使用 `TO_UUID_OR_*` 函数。

| 接口或格式 | UUID 表示方式 |
| --- | --- |
| MySQL 协议 / Arrow Flight SQL | 标准文本；即使 Doris 列为 UUID，客户端也可能将结果类型显示为字符串 |
| CSV、JSON 和 Hive Text 输出 | 标准文本；JSON 将 UUID 表示为字符串 |
| 通用 `OUTFILE` / `EXPORT` 的 Parquet 或 ORC 输出 | UUID 值（包括嵌套的 UUID 元素）以标准字符串导出；自动推断 Schema 不会保留原生类型 |
| 原生 Parquet UUID 输入 | 支持带 UUID 逻辑标记的 `FIXED_LEN_BYTE_ARRAY(16)`，使用标准大端字节序。TVF 的 Schema 推断保留由 `enable_mapping_varbinary` 控制的 STRING / VARBINARY 映射；标准 STRING 可用 `CAST(value AS UUID)` 转换，原始 VARBINARY 可用 `CAST(HEX(value) AS UUID)` 转换 |
| Iceberg | Catalog 的 UUID 映射仍由 `enable.mapping.varbinary` 决定为 STRING / VARBINARY。两种映射均保留 16 字节原始值，使用 `CAST(HEX(value) AS UUID)` 转换为原生 UUID。向 Iceberg UUID 字段写入 Parquet 时保留 UUID 逻辑标记 |
| ClickHouse JDBC Catalog | 将 ClickHouse UUID 映射为 Doris 原生 UUID；此前文档中的发布版本映射为 STRING |
| Java UDF | SQL UUID 映射为 `java.util.UUID`，也支持出现在受支持的复杂类型内部 |

## 最佳实践

当标识符为 UUID，且需要 16 字节存储或 UUID 比较时，可使用原生类型。迁移前先规范化并校验现有字符串数据；如果需要保留原始文本拼写或存储非 UUID 标识符，应继续使用文本类型。随机标识符使用 `UUID_V4()`，需要近似时间局部性的标识符使用 `UUID_V7()`。事件时间过滤应使用独立的日期时间列：分布式 UUID v7 生成不提供全局序列或精确的事件时间戳。
