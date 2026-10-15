---
{
    "title": "MICROSECONDS_SUB",
    "language": "ja",
    "description": "DATETIME、TIMESTAMP_NS、TIMESTAMPTZ の値からマイクロ秒を減算し、入力と同じ日時型の値を返します。"
}
---

## 説明

`MICROSECONDS_SUB` 関数は、入力した日時値から指定されたマイクロ秒数を減算し、計算後の日時値を返します。この関数は `DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` をサポートします。

この関数は、単位に MICROSECOND を指定した場合の MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) と同じように動作します。

## 構文

```sql
MICROSECONDS_SUB(`<datetime_like_type>`, `<delta>`)
```

## パラメータ

| パラメータ    | 説明                                                                                     |
|--------------|-------------------------------------------------------------------------------------------------|
| `<datetime_like_type>` | 入力する日時値。型は `DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` のいずれかです。形式については、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[timestamp_ns の変換](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md)、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)を参照してください。 |
| `<delta>`    | 減算するマイクロ秒数。型は `BIGINT` です。1 秒は 1,000,000 マイクロ秒です。       |

## 戻り値

指定されたマイクロ秒数 `<delta>` を基準となる日時 `<datetime_like_type>` から減算した結果を返します。戻り値の型は最初の引数と同じです。

- TIMESTAMP_NS を入力した場合は TIMESTAMP_NS を返し、ナノ秒部分を保持します。

- `<delta>` が負の場合、対応するマイクロ秒数を基準日時に加算した場合と同じように動作します（つまり、`MICROSECONDS_SUB(basetime, -n)` は `MICROSECONDS_ADD(basetime, n)` と同等です）。
- 計算結果が `DATETIME` 型の有効範囲（`0000-01-01 00:00:00` から `9999-12-31 23:59:59.999999`）を超えると、例外が発生します。
- TIMESTAMP_NS の結果は、`1677-09-21 00:12:43.145224192` から `2262-04-11 23:47:16.854775807` の範囲内である必要があります。
- いずれかの引数が `NULL` の場合、この関数は `NULL` を返します。

## 例

```sql
-- Subtract microseconds
SELECT NOW(3) AS current_time, MICROSECONDS_SUB(NOW(3), 100000) AS after_sub;

+-------------------------+----------------------------+
| current_time            | after_sub                  |
+-------------------------+----------------------------+
| 2025-01-16 11:52:22.296 | 2025-01-16 11:52:22.196000 |
+-------------------------+----------------------------+

-- Negative delta (equivalent to addition)
mysql> SELECT MICROSECONDS_SUB('2023-10-01 12:00:00.200000', -300000) AS after_sub;
+----------------------------+
| after_sub                  |
+----------------------------+
| 2023-10-01 12:00:00.500000 |
+----------------------------+

-- TIMESTAMP_NS preserves the nanosecond part
SELECT MICROSECONDS_SUB(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1);
+-----------------------------------------------------------------------------------+
| MICROSECONDS_SUB(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1) |
+-----------------------------------------------------------------------------------+
| 2025-01-02 03:04:05.123455789                                                     |
+-----------------------------------------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MICROSECONDS_SUB(NULL, 1000), MICROSECONDS_SUB('2023-01-01', NULL) AS after_sub;
+------------------------------+----------------------------+
| microseconds_sub(NULL, 1000) | after_sub                  |
+------------------------------+----------------------------+
| NULL                         | NULL                       |
+------------------------------+----------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000000
SELECT MICROSECONDS_SUB('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_SUB('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-10-01 00:00:00.300000              |
+-----------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MICROSECONDS_SUB('2024-12-25 12:34:56.123+04:00', '765800');
+-------------------------------------------------------------+
| MICROSECONDS_SUB('2024-12-25 12:34:56.123+04:00', '765800') |
+-------------------------------------------------------------+
| 2024-12-25 16:34:55.357200+08:00                            |
+-------------------------------------------------------------+

-- Exceeds datetime range, throws an error
mysql> SELECT MICROSECONDS_SUB('0000-01-01 00:00:00.000000', 1000000) AS after_sub;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 0000-01-01 00:00:00, -1000000 
out of range

```
