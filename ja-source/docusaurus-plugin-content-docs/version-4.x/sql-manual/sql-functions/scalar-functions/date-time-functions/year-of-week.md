---
{
  "title": "YEAR_OF_WEEK",
  "description": "YEAROFWEEK関数は、ISO 8601週暦標準に従って、指定された日付の週年（週の年）を返します。",
  "language": "ja"
}
---
## 説明

YEAR_OF_WEEK関数は、ISO 8601週カレンダー標準に従って、指定された日付の週年（week-year）を返します。通常の年とは異なり、ISO週年は週単位で計算され、年の最初の週は1月4日を含む週であり、その週はその年に属する日が少なくとも4日含まれている必要があります。

入力日付の年を単純に返す[year function](./year)とは異なり、YEAR_OF_WEEKはISO週カレンダー標準に従います。

詳細な情報については、[ISO Week Date](https://en.wikipedia.org/wiki/ISO_week_date)を参照してください。

## エイリアス

- `YOW`

## 構文

```sql
YEAR_OF_WEEK(`<date_or_time_expr>`)
YOW(`<date_or_time_expr>`)
```
## パラメータ

| Parameter | デスクリプション |
|-----------|-------------|
| `<date_or_time_expr>` | 入力する日時値。date/datetimeタイプをサポートします。datetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください|

## Return Value

SMALLINT型を返します。ISO 8601週暦標準に従って計算された週年を表します。

- 戻り値の範囲は通常1-9999です
- 入力がNULLの場合、NULLを返します
- 入力がDATETIME型の場合、日付部分のみを考慮し、時刻部分は無視します

## Examples

```sql
-- 2005-01-01 is Saturday, this week starts from 2004-12-27, contains more days in 2004, belongs to 2004
SELECT YEAR_OF_WEEK('2005-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2004 |
+------------+

-- Using alias YOW, same result
SELECT YOW('2005-01-01') AS yow_alias_result;
+------------------+
| yow_alias_result |
+------------------+
|             2004 |
+------------------+

-- 2005-01-03 is Monday, this week (2005-01-03 to 2005-01-09) is the first week of 2005
SELECT YEAR_OF_WEEK('2005-01-03') AS yow_result;
+------------+
| yow_result |
+------------+
|       2005 |
+------------+

-- 2023-01-01 is Sunday, this week starts from 2022-12-26, belongs to the last week of 2022
SELECT YEAR_OF_WEEK('2023-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2022 |
+------------+

-- 2023-01-02 is Monday, this week (2023-01-02 to 2023-01-08) is the first week of 2023
SELECT YEAR_OF_WEEK('2023-01-02') AS yow_result;
+------------+
| yow_result |
+------------+
|       2023 |
+------------+

-- DATETIME type input, ignoring time part
SELECT YEAR_OF_WEEK('2005-01-01 15:30:45') AS yow_datetime;
+--------------+
| yow_datetime |
+--------------+
|         2004 |
+--------------+

-- Cross-year boundary case: 2024-12-30 is Monday, belongs to the first week of 2025
SELECT YEAR_OF_WEEK('2024-12-30') AS yow_result;
+------------+
| yow_result |
+------------+
|       2025 |
+------------+

-- Input is NULL, returns NULL
SELECT YEAR_OF_WEEK(NULL) AS yow_null;
+----------+
| yow_null |
+----------+
|     NULL |
+----------+
```
