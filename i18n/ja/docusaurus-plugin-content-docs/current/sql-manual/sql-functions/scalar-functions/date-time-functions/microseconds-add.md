---
{
    "title": "MICROSECONDS_ADD",
    "language": "ja",
    "description": "DATETIME、TIMESTAMP_NS、TIMESTAMPTZ の値にマイクロ秒を加算し、入力と同じ時刻型の値を返します。"
}
---

## 説明

MICROSECONDS_ADD 関数は、入力した日時に指定されたマイクロ秒数を加算し、計算後の日時を返します。DATETIME、TIMESTAMP_NS、TIMESTAMPTZ に対応しています。

この関数は、単位に MICROSECOND を指定した場合の MySQL の [date_add 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) と同じ動作をします。

## 構文

```sql
MICROSECONDS_ADD(`<datetime_like_type>`, `<delta>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<datetime_like_type>` | 入力する日時値。型は DATETIME、TIMESTAMP_NS、TIMESTAMPTZ のいずれかです。形式については、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[timestamp_ns の変換](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md)、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)を参照してください。 |
| `<delta>` | 加算するマイクロ秒数。型は BIGINT です。1 秒は 1,000,000 マイクロ秒です。 |

## 戻り値

指定されたマイクロ秒数 `<delta>` を基準となる日時 `<datetime_like_type>` に加算した結果を返します。戻り値の型は最初の引数と同じです。
- 最初の引数が TIMESTAMPTZ の場合は、TIMESTAMPTZ を返します。
- 最初の引数が TIMESTAMP_NS の場合は、ナノ秒部分を保持した TIMESTAMP_NS を返します。
- 最初の引数が DATETIME の場合は、DATETIME を返します。

- `<delta>` が負の場合は、基準日時から対応するマイクロ秒数を減算します（つまり、MICROSECONDS_ADD(basetime, -n) は MICROSECONDS_SUB(basetime, n) と同等です）。
- 計算結果が DATETIME 型の有効範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59.999999）を超えると、例外が発生します。
- TIMESTAMP_NS の場合、結果は `1677-09-21 00:12:43.145224192` から `2262-04-11 23:47:16.854775807` の範囲内である必要があります。
- いずれかの引数が NULL の場合は、NULL を返します。

## 例

```sql
-- Add microseconds
SELECT NOW(3) AS current_time, MICROSECONDS_ADD(NOW(3), 100000000) AS after_add;

+-------------------------+----------------------------+
| current_time            | after_add                  |
+-------------------------+----------------------------+
| 2025-08-11 14:49:16.368 | 2025-08-11 14:50:56.368000 |
+-------------------------+----------------------------+

-- Add negative microseconds, equivalent to subtracting
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000', -300000) AS after_add;
+----------------------------+
| after_add                  |
+----------------------------+
| 2023-10-01 12:00:00.200000 |
+----------------------------+

-- TIMESTAMP_NS preserves the nanosecond part
SELECT MICROSECONDS_ADD(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1);
+-----------------------------------------------------------------------------------+
| MICROSECONDS_ADD(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1) |
+-----------------------------------------------------------------------------------+
| 2025-01-02 03:04:05.123457789                                                     |
+-----------------------------------------------------------------------------------+

-- Input type is date, time part defaults to 00:00:00.000000
SELECT MICROSECONDS_ADD('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_ADD('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-09-30 23:59:59.700000              |
+-----------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MICROSECONDS_ADD('2024-12-25 12:34:56.123+04:00', '765800');
+-------------------------------------------------------------+
| MICROSECONDS_ADD('2024-12-25 12:34:56.123+04:00', '765800') |
+-------------------------------------------------------------+
| 2024-12-25 16:34:56.888800+08:00                            |
+-------------------------------------------------------------+

-- Calculation result exceeds datetime range, throws error
SELECT MICROSECONDS_ADD('9999-12-31 23:59:59.999999', 2000000) AS after_add;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 9999-12-31 23:59:59.999999, 2000000 out of range

-- Any input parameter is NULL, returns NULL
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000', NULL);
+-----------------------------------------------------+
| MICROSECONDS_ADD('2023-10-01 12:00:00.500000',NULL) |
+-----------------------------------------------------+
| NULL                                                |
+-----------------------------------------------------+

```
