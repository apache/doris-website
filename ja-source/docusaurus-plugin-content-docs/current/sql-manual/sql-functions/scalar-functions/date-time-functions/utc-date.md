---
{
  "title": "UTC_DATE",
  "language": "ja",
  "description": "UTCDATE関数は、UTCタイムゾーンの現在の日付を返します。"
}
---
## 説明
UTC_DATE関数は、UTCタイムゾーンでの現在の日付を返します。この関数はローカルタイムゾーンの影響を受けず、常にUTCタイムゾーンに基づいて現在の日付を返すため、異なるタイムゾーンシナリオ間での日付の一貫性を保証します。

この関数は、MySQLの[utc_date function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-date)と一貫した動作をします。

## 構文

```sql
UTC_DATE()
```
## 戻り値
現在のUTC日付を返します。型はDATEです。

DATE型を返します（フォーマット：YYYY-MM-DD）。戻り値に対して数値演算を実行する場合、型変換が実行され、[integer format](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-date)（フォーマット：YYYYMMDD）を返します。

## Examples

```sql
-- Assume the current local time is UTC+8 2025-10-27 10:55:35
SELECT UTC_DATE(), UTC_DATE() + 0;
```
```text
+------------+----------------+
| UTC_DATE() | UTC_DATE() + 0 |
+------------+----------------+
| 2025-10-27 |       20251027 |
+------------+----------------+
```
