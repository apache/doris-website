---
{
    "title": "UTC_DATE",
    "language": "ja",
    "description": "UTCDATE 関数は、UTC タイムゾーンの現在の日付を返します。"
}
---

## 説明

UTC_DATE 関数は、UTC タイムゾーンの現在の日付を返します。この関数はローカルタイムゾーンの影響を受けず、常に UTC タイムゾーンに基づく現在の日付を返すため、異なるタイムゾーンでも日付の一貫性を保てます。

この関数の動作は、MySQL の [utc_date 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-date)と同じです。

## 構文

```sql
UTC_DATE()
```

## 戻り値

現在の UTC 日付を DATE 型で返します。

戻り値は日付型で、形式は YYYY-MM-DD です。戻り値を数値演算に使用すると型変換が行われ、[整数形式](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-date)（形式: YYYYMMDD）で返されます。

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
