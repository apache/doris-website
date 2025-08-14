---
{
    "title": "VARIANT_TYPE",
    "language": "en"
}
---

## Function

The `VARIANT_TYPE` function returns the actual type of a `VARIANT` value.  
This function is typically used for debugging or analyzing the structure of `VARIANT` data, assisting in type determination and data processing.

## Syntax

```sql
VARIANT_TYPE(variant_value)
```

## Parameters

- `variant_value`: A value of type `VARIANT`.

## Return Value

- Returns a string representing the actual type of the `VARIANT` value.
    - The string follows the `{"key":"value"}` structure.
    - The key represents the subfield path, and the value represents the type.

## Notes

1. Used to find the actual type stored in a `VARIANT` column.  
2. For each row in the table, the subfields are read to obtain the type. In practice, use `LIMIT` to restrict the number of rows to avoid slow execution.

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

INSERT INTO variant_table VALUES(1, '{"a": 10, "b": 1.2, "c" : "ddddd"}'), (2, NULL);

SELECT VARIANT_TYPE(v) FROM variant_table;
+-------------------------------------------+
| VARIANT_TYPE(v)                           |
+-------------------------------------------+
| {"a":"tinyint","b":"double","c":"string"} |
| NULL                                      |
+-------------------------------------------+
```
