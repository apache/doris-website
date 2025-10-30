---
{
    "title": "DEFAULT",
    "language": "zh-CN"
}
---

## 描述

返回表中特定列的默认值。如果该列没有默认值，则会抛出错误。

该函数与 MySQL 中的 [DEFAULT 函数](https://dev.mysql.com/doc/refman/8.4/en/miscellaneous-functions.html#function_default) 行为一致

## 语法

```sql
DEFAULT(<column>)
```

## 参数

| 参数       | 说明                                           |
| ---------- | ---------------------------------------------- |
| `<column>` | 需要查询默认值的列。仅接受列，否则会抛出错误。 |

## 返回值

常量默认值：
- 若有设置默认值，则返回对应的默认值
- 若没有设置默认值，且列不为 NOT NULL， 则返回 NULL
- 若没有设置默认值，且列为 NOT NULL， 则抛出错误

非常量默认值(`CURRENT_TIMESTAMP`, `CURRENT_DATE`):
- 若该列不为 NOT NULL，则返回 NULL
- 若该列为 NOT NULL，则返回对应类型的最小值 `0000-01-01 00:00:00` 或 `0000-01-01`

[Doris 支持的默认值相关参数](https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-statements/table-and-view/table/CREATE-TABLE#%E5%88%97%E7%9A%84%E9%BB%98%E8%AE%A4%E5%80%BC%E7%9B%B8%E5%85%B3%E5%8F%82%E6%95%B0)

## 举例

1. 非聚合类型常量默认值举例
```sql
-- setup
-- 表中没有显示表明DEFAULT值的代表其默认值仅接受 NULL 值
-- ARRAY 类型的默认值仅接受 `[]` 和 NULL
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

-- 例中省略 INSERT 语句
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
+-----------------+--------------------+---------------------+----------------+---------------------+-----------------------------------------+------------------+-------------------+---------------------+----------------------------+-----------------+--------------------+-------------------+---------------------+-----------------+-----------------+-----------------+-----------------+----------------------+-------------------------+------------------------+-------------------+--------------------+
| DEFAULT(c_bool) | DEFAULT(c_tinyint) | DEFAULT(c_smallint) | DEFAULT(c_int) | DEFAULT(c_bigint)   | DEFAULT(c_largeint)                     | DEFAULT(c_float) | DEFAULT(c_double) | DEFAULT(c_decimal)  | DEFAULT(c_decimal_compact) | DEFAULT(c_char) | DEFAULT(c_varchar) | DEFAULT(c_string) | DEFAULT(c_datetime) | DEFAULT(c_date) | DEFAULT(c_json) | DEFAULT(c_ipv4) | DEFAULT(c_ipv6) | DEFAULT(c_array_int) | DEFAULT(c_array_string) | DEFAULT(c_map_str_int) | DEFAULT(c_struct) | DEFAULT(c_variant) |
+-----------------+--------------------+---------------------+----------------+---------------------+-----------------------------------------+------------------+-------------------+---------------------+----------------------------+-----------------+--------------------+-------------------+---------------------+-----------------+-----------------+-----------------+-----------------+----------------------+-------------------------+------------------------+-------------------+--------------------+
|               1 |                  7 |               32000 |     2147483647 | 9223372036854775807 | 170141183460469231731687303715884105727 |            3.125 |       2.718281828 | 123456789.123456789 |                 99999.1234 | charDemo        |                    | plain string      | 2025-10-25 11:22:33 | 2025-10-31      | NULL            | 192.168.1.1     | 2001:db8::1     | NULL                 | NULL                    | NULL                   | NULL              | NULL               |
+-----------------+--------------------+---------------------+----------------+---------------------+-----------------------------------------+------------------+-------------------+---------------------+----------------------------+-----------------+--------------------+-------------------+---------------------+-----------------+-----------------+-----------------+-----------------+----------------------+-------------------------+------------------------+-------------------+--------------------+
```

2. 聚合类型举例
```sql
CREATE TABLE test_default_agg (
    k_id          INT             NOT NULL COMMENT '聚合键',
    bitmap_col    BITMAP          BITMAP_UNION,
    hll_col       HLL             HLL_UNION,
    quantile_col  QUANTILE_STATE QUANTILE_UNION
)AGGREGATE KEY(k_id)
PROPERTIES ( 'replication_num' = '1' );

-- 由于QUANTILE_STATE类型是严格NOT NULL 且不允许有默认值的
-- 所以对于 DEFAULT 函数来说该列是非法的
SELECT
    default(bitmap_col),default(hll_col)
FROM test_default_agg
LIMIT 1;
```
```text
+---------------------+------------------+
| default(bitmap_col) | default(hll_col) |
+---------------------+------------------+
| NULL                | NULL             |
+---------------------+------------------+
```

```sql
SELECT DEFAULT(quantile_col) FROM test_default_agg LIMIT 1;
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Column 'quantile_col' is NOT NULL but has no default value
```

3. 非常量默认值(`CURRENT_TIMESTAMP`, `CURRENT_DATE`)举例：
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