---
{
    "title": "SECONDS_ADD",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型の値に秒数を加算または減算します。"
}
---

## 説明

SECONDS_ADD 関数は、指定した日時値に指定した秒数を加算し、計算後の日時値を返します。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型に対応します。負の数を指定すると、その秒数を減算するのと同じ結果になります。

この関数は、単位に SECOND を指定した場合の [date_add 関数](./date-add) および MySQL の [date_add 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) と同じ動作をします。

## 構文

```sql
SECONDS_ADD(<date_or_time_expr>, <seconds>)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 必須。入力する日時値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型に対応します。各型の形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。 |
| `<seconds>` | 必須。加算または減算する秒数。整数型（BIGINT）に対応します。正の数は秒数の加算、負の数は秒数の減算を表します。 |

## 戻り値

基準日時 `<date_or_time_expr>` に指定した秒数 `<second>` を加算した結果を返します。戻り値の型は最初のパラメータの型によって決まります。

- 最初のパラメータが `DATE` または `DATETIME` の場合は `DATETIME`、`TIMESTAMP_NS` の場合は `TIMESTAMP_NS` を返します。
- 最初のパラメータが TIMESTAMPTZ の場合は TIMESTAMPTZ を返します。

特殊なケース:

- `<seconds>` が負の場合、基準日時から対応する秒数を減算した場合と同じ動作になります（つまり、SECONDS_ADD(date, -n) は SECONDS_SUB(date, n) と同じです）。
- 入力が DATE 型（年、月、日のみ）の場合、時刻部分はデフォルトで 00:00:00 になります。
- 計算結果が日付型の有効範囲（DATE 型: 0000-01-01 ～ 9999-12-31、DATETIME/TIMESTAMPTZ 型: 0000-01-01 00:00:00 ～ 9999-12-31 23:59:59.999999）を超える場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。

## 例

```sql
--- Add seconds to DATETIME type
SELECT SECONDS_ADD('2025-01-23 12:34:56', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:26 |
+---------------------+

--- Subtract seconds from DATETIME type (using negative number)
SELECT SECONDS_ADD('2025-01-23 12:34:56', -30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:26 |
+---------------------+

--- Add seconds across minute boundary
SELECT SECONDS_ADD('2023-07-13 23:59:50', 15) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-14 00:00:05 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_ADD('2023-01-01', 3600) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 01:00:00 |
+---------------------+

--- DATETIME with scale (preserves precision)
SELECT SECONDS_ADD('2023-07-13 10:30:25.123456', 2) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 10:30:27.123456 |
+----------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT SECONDS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| SECONDS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:22:34.123+08:00                   |
+-------------------------------------------------+

--- Returns NULL when input is NULL
SELECT SECONDS_ADD(NULL, 30), SECONDS_ADD('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| seconds_add(NULL, 30)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Calculation result exceeds date range
SELECT SECONDS_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 9999-12-31 23:59:59, 2 out of range

select seconds_add('0000-01-01 00:00:30',-31);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 0000-01-01 00:00:30, -31 out of range
```
