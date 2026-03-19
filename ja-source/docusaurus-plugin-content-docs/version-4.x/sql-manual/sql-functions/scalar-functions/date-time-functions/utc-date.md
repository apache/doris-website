---
{
  "title": "UTC_DATE",
  "description": "UTCDATE関数は、UTCタイムゾーンでの現在の日付を返します。",
  "language": "ja"
}
---
## デスクリプション
UTC_DATE関数は、UTCタイムゾーンでの現在の日付を返します。この関数はローカルタイムゾーンの影響を受けず、常にUTCタイムゾーンに基づいた現在の日付を返すため、異なるタイムゾーンシナリオ間での日付の一貫性を保証します。

この関数は、MySQLの[utc_date function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-date)と一貫した動作をします。

## Syntax

```sql
UTC_DATE()
```
## 戻り値
現在のUTC日付をDATE型で返します。

DATE型（形式：YYYY-MM-DD）を返します。戻り値に対して数値演算を実行する場合、型変換が実行され、[integer format](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-date)（形式：YYYYMMDD）が返されます。

## 例

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
