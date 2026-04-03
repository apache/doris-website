---
{
  "title": "MONTH",
  "description": "MONTH関数は、datetime値から月の値を抽出します。戻り値は1から12の範囲で、1年の12ヶ月を表します。",
  "language": "ja"
}
---
## 概要

MONTH関数は、datetime値から月の値を抽出します。戻り値は1から12の範囲で、1年の12ヶ月を表します。この関数はDATEおよびDATETIME型の処理をサポートしています。

この関数は、MONTHを単位として使用する場合、MySQLの[month function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_month)と一致しています。

## 構文

```sql
MONTH(`<date_or_time_expr>`)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力される日時値。date/datetime型をサポートします。特定の日時および日付形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## Return Value

TINYINT型の値を返し、月の値を表します：
- 範囲：1から12
- 1は1月、12は12月を表します
- 入力がNULLの場合、NULLを返します

## Examples

```sql
-- Extract month from DATE type
SELECT MONTH('1987-01-01') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Extract month from DATETIME type
SELECT MONTH('2023-07-13 22:28:18') AS result;
+--------+
| result |
+--------+
|      7 |
+--------+

-- Extract month from DATETIME with fractional seconds
SELECT MONTH('2023-12-05 10:15:30.456789') AS result;
+--------+
| result |
+--------+
|     12 |
+--------+

-- Returns NULL when input is NULL
SELECT MONTH(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
