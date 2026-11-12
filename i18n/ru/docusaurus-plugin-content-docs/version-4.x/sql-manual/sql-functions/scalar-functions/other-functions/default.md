---
{
    "title": "DEFAULT",
    "language": "ru"
}
---

## Описание {#description}

Возвращает значение по умолчанию указанного столбца таблицы. Если у столбца нет значения по умолчанию, возникает ошибка.

Эта функция работает так же, как функция DEFAULT в MySQL.

## Синтаксис {#syntax}

```sql
DEFAULT(<column>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<column>` | Столбец, значение по умолчанию которого запрашивается. Допускаются только столбцы; в противном случае возникает ошибка. |

## Возвращаемое значение {#return-value}

Возвращает значение по умолчанию столбца с тем же типом, что и у столбца
- Если значение по умолчанию задано, возвращает это значение
- Если значение по умолчанию не задано и для столбца не установлено ограничение NOT NULL, возвращает NULL
- Если значение по умолчанию не задано и для столбца установлено ограничение NOT NULL, возникает ошибка

Особые случаи:
- В качестве аргумента допускаются только столбцы; если передана константа (включая NULL) или выражение, возникает ошибка
- Если в качестве аргумента передан столбец с автоинкрементом или вычисляемый столбец, возникает ошибка

[Параметры значений по умолчанию, поддерживаемые Doris](../../../sql-statements/table-and-view/table/CREATE-TABLE.md#column-default-value-related-parameters)

## Примеры {#examples}

1. Неагрегатные типы с константными значениями по умолчанию
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

2. Пример для агрегатных типов
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

3. Пример неконстантных значений по умолчанию (`CURRENT_TIMESTAMP`, `CURRENT_DATE`):
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

4. Константные значения
```sql
SELECT DEFAULT('hello');
-- ERROR 1105 (HY000): errCode = 2, detailMessage = 
-- mismatched input ''hello'' expecting {'{', '}', 'ACTIONS', 'AFTER', 'AGG_STATE', 'AGGREGATE', 'ALIAS', 'ANALYZED', 'ARRAY', 'AT', 'AUTHORS', 'AUTO_INCREMENT', 'ALWAYS', 'BACKENDS', 'BACKUP', 'BEGIN', 'BELONG', 'BIN', 'BITAND', 'BITMAP', 'BITMAP_EMPTY', 'BITMAP_UNION', 'BITOR', 'BITXOR', 'BLOB', 'BOOLEAN', 'BRANCH', 'BRIEF', 'BROKER', 'BUCKETS', 'BUILD', 'BUILTIN', 'CACHE', 'CACHED', 'CALL', 'CATALOG', 'CATALOGS', 'CHAIN', CHAR, 'CHARSET', 'CHECK', 'CLUSTER', 'CLUSTERS', 'COLLA

SELECT DEFAULT(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = 
-- mismatched input 'NULL' expecting {'{', '}', 'ACTIONS', 'AFTER', 'AGG_STATE', 'AGGREGATE', 'ALIAS', 'ANALYZED', 'ARRAY', 'AT', 'AUTHORS', 'AUTO_INCREMENT', 'ALWAYS', 'BACKENDS', 'BACKUP', 'BEGIN', 'BELONG', 'BIN', 'BITAND', 'BITMAP', 'BITMAP_EMPTY', 'BITMAP_UNION', 'BITOR', 'BITXOR', 'BLOB', 'BOOLEAN', 'BRANCH', 'BRIEF', 'BROKER', 'BUCKETS', 'BUILD', 'BUILTIN', 'CACHE', 'CACHED', 'CALL', 'CATALOG', 'CATALOGS', 'CHAIN', CHAR, 'CHARSET', 'CHECK', 'CLUSTER', 'CLUSTERS', 'COLLATIO
```

5. Столбец с автоинкрементом
```sql
CREATE TABLE test_auto_inc (
      id BIGINT NULL AUTO_INCREMENT,
      value BIGINT NOT NULL
) PROPERTIES ('replication_num' = '1' );

INSERT INTO test_auto_inc(value) VALUES (1), (2);
--ERROR 1105 (HY000): errCode = 2, detailMessage = Column 'id' has no default value and does not allow NULL or column is auto-increment
```

6. Вычисляемый столбец
```sql
CREATE TABLE test_gen_col (
    a INT,
    b INT AS (a + 10)
) PROPERTIES ('replication_num' = '1' );

SELECT DEFAULT(b) FROM test_gen_col;
-- ERROR 1105 (HY000): errCode = 2, detailMessage = DEFAULT cannot be used on generated column 'b'
```
