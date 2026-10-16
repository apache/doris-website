---
{
    "title": "SECONDS_SUB",
    "language": "ja",
    "description": "SECONDSSUB 関数は、指定した日時の値から指定した秒数を減算または加算し、計算後の日時の値を返します。"
}
---

## 説明

SECONDS_SUB 関数は、指定した日時の値から指定した秒数を減算または加算し、計算後の日時の値を返します。DATE、DATETIME、TIMESTAMPTZ 型を処理できます。負の値を指定すると、その絶対値に相当する秒数を加算します。

秒数の単位に SECOND を指定した場合、この関数の動作は [date_sub 関数](./date-sub) および MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) と同じです。

## 構文

```sql
SECONDS_SUB(<date_or_time_expr>, <seconds>)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ---- |
| `<date_or_time_expr>` | 必須。入力する日時の値。DATE、DATETIME、TIMESTAMPTZ 型を指定できます。形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<seconds>` | 必須。減算または加算する秒数。整数型（BIGINT）を指定できます。正の値は秒数の減算、負の値は秒数の加算を表します。 |

## 戻り値

基準となる日時 `<date_or_time_expr>` から指定した秒数 `<second>` を減算した値を返します。戻り値の型は、最初のパラメータの型によって決まります。

- 最初のパラメータが DATE または DATETIME 型の場合、DATETIME 型を返します。
- 最初のパラメータが TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型を返します。

特殊なケース：

- `<seconds>` が負の値の場合、基準となる日時にその絶対値に相当する秒数を加算します（SECONDS_SUB(date, -n) は SECONDS_ADD(date, n) と同じです）。
- 入力が DATE 型（年、月、日のみ）の場合、時刻部分はデフォルトで 00:00:00 になります。
- 計算結果が日付型の有効範囲を超えた場合、DATE 型では例外が発生します。
- いずれかのパラメータが NULL の場合、NULL を返します。

## 使用例

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
