---
{
    "title": "VARIANT_TYPE",
    "language": "zh-CN",
    "description": "VARIANT_TYPE 函数返回 VARIANT 值的类型名称，例如 object、array、string、bigint、double。该函数通常用于调试或分析 VARIANT 数据的结构，辅助进行类型判断和数据处理。"
}
---

## 功能

`VARIANT_TYPE` 函数用于返回 `VARIANT` 值的类型名称。
该函数通常用于调试或分析 `VARIANT` 数据的结构，辅助进行类型判断和数据处理。本页描述的是 Doris 5.0.0 及之后版本中的行为。

## 语法

```sql
VARIANT_TYPE(variant_value)
```

## 参数

- `variant_value`：一个 `VARIANT` 类型的值。要查看嵌套值的类型，请传入路径，例如 `VARIANT_TYPE(v['a'])`。

## 返回值

返回一个 `STRING`，表示该值本身的类型名称。对于对象或数组，返回 `object` 或 `array`，不会列出其成员的类型。

| 结果 | 对应的值 |
| --- | --- |
| `object`、`array` | JSON 对象或数组 |
| `string` | 字符串 |
| `bool` | `true` 或 `false` |
| `tinyint`、`smallint`、`int`、`bigint` | 整数，按能容纳该值的最小类型报告 |
| `decimal` | 定点数，包括超出 `BIGINT` 范围的整数，以及不超过 38 位的 `LARGEINT` 值 |
| `float`、`double` | 浮点数 |
| `date` | 日期 |
| `timestamp` | 带时区的时间戳 |
| `timestamp_ntz` | 不带时区的时间戳，如 `DATETIME`、`TIMESTAMP_NS` 值 |
| `null` | VARIANT `null`（JSON `null`） |
| `binary`、`time`、`uuid` | Doris 的 JSON 解析和 CAST 都不会产生这些类型的值，它们可能来自其他系统写入的 VARIANT 数据，例如 Parquet 文件 |

输入为 SQL `NULL` 时返回 SQL `NULL`。

## 使用说明

1. 用于查看 `VARIANT` 列中值的实际类型。对于从表中读取的值，结果反映的是存储后的值，例如根值中的 `DATE` 会以字符串存储。参见[写入后值的规范化](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps)。
2. 结果是值的类型，而不是路径的存储类型：从 `BIGINT` 路径读出的整数可能是 `tinyint`。如需查看表中每个子列的存储类型，请使用 `SET describe_extend_variant_column = true;` 后执行 `DESC`。
3. 函数会读取每一行，实际使用中请用 `LIMIT` 限制行数。

## 示例

```SQL
CREATE TABLE variant_table(
    k INT,
    v VARIANT NULL
)
DUPLICATE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO variant_table VALUES
    (1, PARSE_TO_VARIANT('{"a": 10, "b": 1.2, "c": "ddddd"}')),
    (2, PARSE_TO_VARIANT('[1, 2]')),
    (3, NULL);

SELECT k,
       VARIANT_TYPE(v)      AS root_type,
       VARIANT_TYPE(v['a']) AS a_type,
       VARIANT_TYPE(v['b']) AS b_type,
       VARIANT_TYPE(v['c']) AS c_type
FROM variant_table
ORDER BY k;
```

```text
+------+-----------+---------+--------+--------+
| k    | root_type | a_type  | b_type | c_type |
+------+-----------+---------+--------+--------+
|    1 | object    | tinyint | double | string |
|    2 | array     | NULL    | NULL   | NULL   |
|    3 | NULL      | NULL    | NULL   | NULL   |
+------+-----------+---------+--------+--------+
```
