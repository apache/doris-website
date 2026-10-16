---
{
    "title": "YEAR_OF_WEEK",
    "language": "ja",
    "description": "YEAROFWEEK 関数は、ISO 8601 の週暦に従って、指定した日付が属する週の年を返します。"
}
---

## 説明

YEAR_OF_WEEK 関数は、ISO 8601 の週暦に従って、指定した日付が属する週の年を返します。通常の暦年とは異なり、ISO 週暦の年は週単位で決まります。年の最初の週は、元日から数えて 4 日目を含む週であり、その週にはその年の日付が少なくとも 4 日含まれます。

入力した日付の暦年をそのまま返す [YEAR 関数](./year) とは異なり、YEAR_OF_WEEK は ISO 週暦に従います。

詳しくは、[ISO 週日付](https://en.wikipedia.org/wiki/ISO_week_date)を参照してください。

## 別名

- `YOW`

## 構文

```sql
YEAR_OF_WEEK(`<date_or_time_expr>`)
YOW(`<date_or_time_expr>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力する日時の値。DATE/DATETIME/TIMESTAMP_NS 型に対応します。日時と日付の形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

ISO 8601 の週暦に従って算出した週の年を SMALLINT 型で返します。

- 戻り値の範囲は通常 1-9999 です
- 入力が NULL の場合は NULL を返します
- 入力が DATETIME 型の場合は日付部分のみを考慮し、時刻部分を無視します

## 例

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
