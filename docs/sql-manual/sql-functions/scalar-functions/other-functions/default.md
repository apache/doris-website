---
{
    "title": "DEFAULT",
    "language": "en"
}
---

## Description

Returns the default value of a specific column in the table. If the column has no default value, an error is thrown.

This function behaves consistently with the [DEFAULT function](https://dev.mysql.com/doc/refman/8.4/en/miscellaneous-functions.html#function_default) in MySQL.

## Syntax

```sql
DEFAULT(<column>)
```

## Parameters

| Parameter  | Description                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| `<column>` | The column for which to query the default value. Only columns are accepted; otherwise, an error is thrown. |

## Return Value

Constant default values(include `PI`, `E`):
- If a default value is set, returns the corresponding default value.
- If no default value is set and the column is not NOT NULL, returns NULL.
- If no default value is set and the column is NOT NULL, throws an error.

Non-constant default values (`CURRENT_TIMESTAMP`, `CURRENT_DATE`):
- If the column is not NOT NULL, returns NULL.
- If the column is NOT NULL, returns the minimum value of the corresponding type `0000-01-01 00:00:00` or `0000-01-01`.

Special Cases:
- If the input column is of an aggregate type (`HLL`, `BITMAP`, `QUANTILE_STATE`), throws an error.
- Input parameters are only allowed for columns. If the input is a constant (including NULL) or an expression, throws an error.

[Doris supported default value related parameters](https://doris.apache.org/docs/dev/sql-manual/sql-statements/table-and-view/table/CREATE-TABLE#column-default-value-related-parameters)

## Examples

1. Non-aggregate type constant default value example
```sql
-- setup
-- Columns without explicitly specified DEFAULT values accept only NULL as default
-- ARRAY type default values accept only `[]` and NULL
CREATE TABLE test_default_scalar (
    c_bool                   BOOLEAN                               NULL     DEFAULT 1,
    c_tinyint                TINYINT                               NULL     DEFAULT 7,
    c_smallint               SMALLINT                              NULL     DEFAULT 32000,
    c_int                    INT                                   NULL     DEFAULT 2147483647,
    c_bigint                 BIGINT                                NULL     DEFAULT 9223372036854775807,
    c_largeint               LARGEINT                              NULL     DEFAULT '170141183460469231731687303715884105727',
    c_float                  FLOAT                                 NULL     DEFAULT 3.125,
    c_double                 DOUBLE                                NULL     DEFAULT 2.718281828,
    c_decimal                DECIMAL(27, 9)                        NULL     DEFAULT '123456789.123456789',
    c_decimal_compact        DECIMAL(18, 4)                        NULL     DEFAULT '99999.1234',
    c_pi                     DOUBLE                                NULL     DEFAULT PI,
    c_e                      DOUBLE                                NULL     DEFAULT E,
    c_char                   CHAR(8)                               NULL     DEFAULT 'charDemo',
    c_varchar                VARCHAR(32)                           NULL     DEFAULT '',
    c_string                 STRING                                NULL     DEFAULT 'plain string',
    c_datetime               DATETIME                              NULL     DEFAULT '2025-10-25 11:22:33',
    c_date                   DATE                                  NULL     DEFAULT '2025-10-31',
    c_json                   JSON                                  NULL,
    c_ipv4                   IPV4                                  NULL     DEFAULT '192.168.1.1',
    c_ipv6                   IPV6                                  NULL     DEFAULT '2001:db8::1',
    c_array_int              ARRAY<INT>                            NULL     DEFAULT '[]',
    c_array_string           ARRAY<STRING>                         NULL,
    c_map_str_int            MAP<STRING, INT>                      NULL,
    c_struct                 STRUCT<f1:INT,f2:STRING,f3:BOOLEAN>   NULL,
    c_variant                VARIANT                               NULL
) PROPERTIES ( 'replication_num' = '1');

-- INSERT statements omitted in the example
SELECT
    DEFAULT(c_bool),
    DEFAULT(c_tinyint),
    DEFAULT(c_smallint),
    DEFAULT(c_int),
    DEFAULT(c_bigint),
    DEFAULT(c_largeint),
    DEFAULT(c_float),
    DEFAULT(c_double),
    DEFAULT(c_decimal),
    DEFAULT(c_decimal_compact),
    DEFAULT(c_pi),
    DEFAULT(c_e),
    DEFAULT(c_char),
    DEFAULT(c_varchar),
    DEFAULT(c_string),
    DEFAULT(c_datetime),
    DEFAULT(c_date),
    DEFAULT(c_json),
    DEFAULT(c_ipv4),
    DEFAULT(c_ipv6),
    DEFAULT(c_array_int),
    DEFAULT(c_array_string),
    DEFAULT(c_map_str_int),
    DEFAULT(c_struct),
    DEFAULT(c_variant)
FROM test_default_scalar
LIMIT 1;
```
```text
+-----------------+--------------------+---------------------+----------------+---------------------+-----------------------------------------+------------------+-------------------+---------------------+----------------------------+-------------------+-------------------+-----------------+--------------------+-------------------+---------------------+-----------------+-----------------+-----------------+-----------------+----------------------+-------------------------+------------------------+-------------------+--------------------+
| DEFAULT(c_bool) | DEFAULT(c_tinyint) | DEFAULT(c_smallint) | DEFAULT(c_int) | DEFAULT(c_bigint)   | DEFAULT(c_largeint)                     | DEFAULT(c_float) | DEFAULT(c_double) | DEFAULT(c_decimal)  | DEFAULT(c_decimal_compact) | DEFAULT(c_pi)     | DEFAULT(c_e)      | DEFAULT(c_char) | DEFAULT(c_varchar) | DEFAULT(c_string) | DEFAULT(c_datetime) | DEFAULT(c_date) | DEFAULT(c_json) | DEFAULT(c_ipv4) | DEFAULT(c_ipv6) | DEFAULT(c_array_int) | DEFAULT(c_array_string) | DEFAULT(c_map_str_int) | DEFAULT(c_struct) | DEFAULT(c_variant) |
+-----------------+--------------------+---------------------+----------------+---------------------+-----------------------------------------+------------------+-------------------+---------------------+----------------------------+-------------------+-------------------+-----------------+--------------------+-------------------+---------------------+-----------------+-----------------+-----------------+-----------------+----------------------+-------------------------+------------------------+-------------------+--------------------+
|               1 |                  7 |               32000 |     2147483647 | 9223372036854775807 | 170141183460469231731687303715884105727 |            3.125 |       2.718281828 | 123456789.123456789 |                 99999.1234 | 3.141592653589793 | 2.718281828459045 | charDemo        |                    | plain string      | 2025-10-25 11:22:33 | 2025-10-31      | NULL            | 192.168.1.1     | 2001:db8::1     | []                   | NULL                    | NULL                   | NULL              | NULL               |
+-----------------+--------------------+---------------------+----------------+---------------------+-----------------------------------------+------------------+-------------------+---------------------+----------------------------+-------------------+-------------------+-----------------+--------------------+-------------------+---------------------+-----------------+-----------------+-----------------+-----------------+----------------------+-------------------------+------------------------+-------------------+--------------------+
```

2. Aggregate type example
```sql
CREATE TABLE test_default_agg (
    k_id          INT             NOT NULL COMMENT '聚合键',
    bitmap_col    BITMAP          BITMAP_UNION,
    hll_col       HLL             HLL_UNION,
    quantile_col  QUANTILE_STATE QUANTILE_UNION
)AGGREGATE KEY(k_id)
PROPERTIES ( 'replication_num' = '1' );

SELECT
    default(bitmap_col),default(hll_col)
FROM test_default_agg
LIMIT 1;
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Agg type(HLL, BITMAP, QUANTILE_STATE) cannot be used for the DEFAULT function
```

3. Non-constant default value (`CURRENT_TIMESTAMP`, `CURRENT_DATE`) example:
```sql
CREATE TABLE test_non_const_default_value_t (
	null_dt     DATETIME NULL     DEFAULT CURRENT_TIMESTAMP,
    not_null_dt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    null_d      DATE     NULL     DEFAULT CURRENT_DATE,
    not_null_d  DATE     NOT NULL DEFAULT CURRENT_DATE
) PROPERTIES ( 'replication_num' = '1' );


SELECT
	DEFAULT(null_dt), DEFAULT(not_null_dt),
	DEFAULT(null_d), DEFAULT(not_null_d)
FROM test_non_const_default_value_t
LIMIT 1;
```
```text
+------------------+----------------------+-----------------+---------------------+
| DEFAULT(null_dt) | DEFAULT(not_null_dt) | DEFAULT(null_d) | DEFAULT(not_null_d) |
+------------------+----------------------+-----------------+---------------------+
| NULL             | 0000-01-01 00:00:00  | NULL            | 0000-01-01          |
+------------------+----------------------+-----------------+---------------------+
```

4. constant value
```sql
SELECT DEFAULT('hello');
-- ERROR 1105 (HY000): errCode = 2, detailMessage = DEFAULT function requires a column reference, not a constant or expression

SELECT DEFAULT(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = DEFAULT function requires a column reference, not a constant or expression
```
