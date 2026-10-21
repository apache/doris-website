---
{
    "title": "DEFAULT",
    "language": "ko"
}
---

## 설명 {#description}

테이블의 특정 열에 설정된 기본값을 반환합니다. 열에 기본값이 없으면 오류가 발생합니다.

이 함수는 MySQL의 DEFAULT 함수와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
DEFAULT(<column>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<column>` | 기본값을 조회할 열입니다. 열만 허용되며, 그 외의 값을 입력하면 오류가 발생합니다. |

## 반환값 {#return-value}

열과 동일한 타입으로 열의 기본값을 반환합니다.
- 기본값이 설정되어 있으면 해당 기본값을 반환합니다.
- 기본값이 설정되어 있지 않고 열에 NOT NULL 제약 조건이 없으면 NULL을 반환합니다.
- 기본값이 설정되어 있지 않고 열에 NOT NULL 제약 조건이 있으면 오류가 발생합니다.

특수한 경우:
- 입력으로는 열만 허용됩니다. 상수(NULL 포함)나 표현식을 입력하면 오류가 발생합니다.
- 입력이 자동 증가 열이나 생성 열이면 오류가 발생합니다.

[Doris에서 지원하는 기본값 관련 매개변수](../../../sql-statements/table-and-view/table/CREATE-TABLE.md#column-default-value-related-parameters)

## 예제 {#examples}

1. 상수 기본값을 사용하는 비집계 타입
```sql
-- setup
-- Columns without an explicitly defined DEFAULT accept only NULL as the default value
-- ARRAY type default values only accept `[]` and NULL
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

2. 집계 타입 예제
```sql
CREATE TABLE test_default_agg (
    k_id          INT             NOT NULL COMMENT 'aggregation key',
    bitmap_col    BITMAP          BITMAP_UNION,
    hll_col       HLL             HLL_UNION,
    quantile_col  QUANTILE_STATE QUANTILE_UNION
) AGGREGATE KEY(k_id)
PROPERTIES ( 'replication_num' = '1' );

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

3. 비상수 기본값(`CURRENT_TIMESTAMP`, `CURRENT_DATE`) 예제:
```sql
CREATE TABLE test_default_time(
	tm DATETIME(5) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    dt DATE DEFAULT CURRENT_DATE
) PROPERTIES( 'replication_num' = '1' );

SELECT DEFAULT(tm), DEFAULT(dt) FROM test_default_time;
```
```text
+---------------------------+-------------+
| DEFAULT(tm)               | DEFAULT(dt) |
+---------------------------+-------------+
| 2026-01-23 17:32:10.90500 | 2026-01-23  |
+---------------------------+-------------+
```

4. 상수 값
```sql
SELECT DEFAULT('hello');
-- ERROR 1105 (HY000): errCode = 2, detailMessage = 
-- mismatched input ''hello'' expecting {'{', '}', 'ACTIONS', 'AFTER', 'AGG_STATE', 'AGGREGATE', 'ALIAS', 'ANALYZED', 'ARRAY', 'AT', 'AUTHORS', 'AUTO_INCREMENT', 'ALWAYS', 'BACKENDS', 'BACKUP', 'BEGIN', 'BELONG', 'BIN', 'BITAND', 'BITMAP', 'BITMAP_EMPTY', 'BITMAP_UNION', 'BITOR', 'BITXOR', 'BLOB', 'BOOLEAN', 'BRANCH', 'BRIEF', 'BROKER', 'BUCKETS', 'BUILD', 'BUILTIN', 'CACHE', 'CACHED', 'CALL', 'CATALOG', 'CATALOGS', 'CHAIN', CHAR, 'CHARSET', 'CHECK', 'CLUSTER', 'CLUSTERS', 'COLLA

SELECT DEFAULT(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = 
-- mismatched input 'NULL' expecting {'{', '}', 'ACTIONS', 'AFTER', 'AGG_STATE', 'AGGREGATE', 'ALIAS', 'ANALYZED', 'ARRAY', 'AT', 'AUTHORS', 'AUTO_INCREMENT', 'ALWAYS', 'BACKENDS', 'BACKUP', 'BEGIN', 'BELONG', 'BIN', 'BITAND', 'BITMAP', 'BITMAP_EMPTY', 'BITMAP_UNION', 'BITOR', 'BITXOR', 'BLOB', 'BOOLEAN', 'BRANCH', 'BRIEF', 'BROKER', 'BUCKETS', 'BUILD', 'BUILTIN', 'CACHE', 'CACHED', 'CALL', 'CATALOG', 'CATALOGS', 'CHAIN', CHAR, 'CHARSET', 'CHECK', 'CLUSTER', 'CLUSTERS', 'COLLATIO
```

5. 자동 증가 열
```sql
CREATE TABLE test_auto_inc (
      id BIGINT NULL AUTO_INCREMENT,
      value BIGINT NOT NULL
) PROPERTIES ('replication_num' = '1' );

INSERT INTO test_auto_inc(value) VALUES (1), (2);
--ERROR 1105 (HY000): errCode = 2, detailMessage = Column 'id' has no default value and does not allow NULL or column is auto-increment
```

6. 생성 열
```sql
CREATE TABLE test_gen_col (
    a INT,
    b INT AS (a + 10)
) PROPERTIES ('replication_num' = '1' );

SELECT DEFAULT(b) FROM test_gen_col;
-- ERROR 1105 (HY000): errCode = 2, detailMessage = DEFAULT cannot be used on generated column 'b'
```
