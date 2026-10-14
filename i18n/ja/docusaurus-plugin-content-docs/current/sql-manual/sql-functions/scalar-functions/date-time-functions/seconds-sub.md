---
{
    "title": "SECONDS_SUB",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ の値から秒数を減算または加算します。"
}
---

## 説明

SECONDS_SUB 関数は、指定された日時値から指定された秒数を引き、計算後の日時値を返します。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型に対応しています。負の数を指定した場合は、対応する秒数を加算するのと同じです。

秒を単位として使用する場合、この関数は [date_sub 関数](./date-sub) および MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) と同じ動作をします。

## 構文

```sql
SECONDS_SUB(<date_or_time_expr>, <seconds>)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 必須。入力する日時値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型を指定できます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<seconds>` | 必須。減算または加算する秒数。整数型（BIGINT）に対応しています。正の数を指定すると秒数を減算し、負の数を指定すると秒数を加算します。 |

## 戻り値

基準時刻 `<date_or_time_expr>` から指定された秒数 `<second>` を引いた値を返します。戻り値の型は最初の引数の型によって決まります。

- 最初の引数が `DATE` または `DATETIME` の場合、戻り値の型は `DATETIME` です。`TIMESTAMP_NS` の場合は `TIMESTAMP_NS` です。
- 最初の引数が TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型の値を返します。

特殊なケース：

- `<seconds>` が負の場合、基準時刻に対応する秒数を加算するのと同じ動作をします（つまり、SECONDS_SUB(date, -n) は SECONDS_ADD(date, n) と同じです）。
- 入力が DATE 型の場合（年、月、日のみを含む）、時刻部分はデフォルトで 00:00:00 になります。
- 計算結果が日付型の有効範囲を超えた場合（DATE 型では例外が発生します）。
- いずれかのパラメータが NULL の場合、NULL を返します。

## 例

```sql
--- Subtract seconds from DATETIME type
SELECT SECONDS_SUB('2025-01-23 12:34:56', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:26 |
+---------------------+

--- Add seconds to DATETIME type (using negative number)
SELECT SECONDS_SUB('2025-01-23 12:34:56', -30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:26 |
+---------------------+

--- Subtract seconds across minute boundary
SELECT SECONDS_SUB('2023-07-14 00:00:10', 15) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 23:59:55 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_SUB('2023-01-01', 3600) AS result;  -- Subtract 1 hour (3600 seconds)
+---------------------+
| result              |
+---------------------+
| 2022-12-31 23:00:00 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT SECONDS_SUB('2023-07-13 10:30:25.123456', 2) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 10:30:23.123456 |
+----------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT SECONDS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| SECONDS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:22:32.123+08:00                   |
+-------------------------------------------------+

--- Returns NULL when input is NULL
SELECT SECONDS_SUB(NULL, 30), SECONDS_SUB('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| seconds_sub(NULL, 30)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Calculation result exceeds date range
SELECT SECONDS_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 0000-01-01 00:00:00, -1 out of range
```
