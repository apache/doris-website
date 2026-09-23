---
{
    "title": "VARIANT_TYPE",
    "language": "en",
    "description": "VARIANT_TYPE returns the type name of a VARIANT value, such as object, array, string, bigint, or double, to help debug and analyze VARIANT data."
}
---

## Function

The `VARIANT_TYPE` function returns the type name of a `VARIANT` value.
It is typically used for debugging or analyzing the structure of `VARIANT` data, assisting in type determination and data processing. This page describes its behavior in Doris 5.0.0 and later.

## Syntax

```sql
VARIANT_TYPE(variant_value)
```

## Parameters

- `variant_value`: A value of type `VARIANT`. To get the type of a nested value, pass the path, for example `VARIANT_TYPE(v['a'])`.

## Return Value

Returns a `STRING` with the type name of the value itself. For an object or an array, it returns `object` or `array`; it does not list the types of the members.

| Result | Value |
| --- | --- |
| `object`, `array` | A JSON object or array |
| `string` | A string |
| `bool` | `true` or `false` |
| `tinyint`, `smallint`, `int`, `bigint` | An integer, reported with the smallest type that holds it |
| `decimal` | A decimal, including an integer too large for `BIGINT` and a `LARGEINT` value |
| `float`, `double` | A floating-point number |
| `date` | A date |
| `timestamp` | A timestamp with time zone |
| `timestamp_ntz` | A timestamp without time zone, such as a `DATETIME` or `TIMESTAMP_NS` value |
| `null` | A VARIANT `null` (JSON `null`) |
| `binary`, `time`, `uuid` | Values that neither JSON parsing nor CAST in Doris produces; they can come from VARIANT data written by other systems, such as Parquet files |

SQL `NULL` input returns SQL `NULL`.

## Notes

1. Use it to find the actual type of values in a `VARIANT` column. For values read from a table, the result reflects the stored value; for example, a `DATE` written outside a Schema Template path is stored as a string. See [What storage keeps](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps).
2. The result is the type of the value, not the storage type of the path: an integer read from a `BIGINT` path can be `tinyint`. To see the storage type of each subcolumn in a table, use `SET describe_extend_variant_column = true;` and `DESC`.
3. The function reads every row, so use `LIMIT` to restrict the number of rows in practice.

## Example

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
