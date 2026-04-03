---
{
  "title": "年",
  "language": "ja",
  "description": "YEAR関数は、指定された日付または時刻の値から年の部分を抽出し、年を整数として返します。"
}
---
## 説明
YEAR関数は、指定された日付または時刻値から年の部分を抽出し、年を整数として返します。DATEおよびDATETIME型の処理をサポートしています。

この関数は、MySQLの[year function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_year)と一貫した動作をします。

## 構文

```sql
YEAR(`<date_or_time_expr>`)
```
## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | 年を抽出する datetime 値。date/datetime 型をサポートします。datetime および date 形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) および [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください |

## Return Value

date/datetime 型の年の部分を返します。INT 型、範囲は 0-9999 です。

- 入力パラメータが NULL の場合、NULL を返します

## Examples

```sql
-- Extract year from DATE type
SELECT YEAR('1987-01-01') AS year_date;
+-----------+
| year_date |
+-----------+
|      1987 |
+-----------+

-- Extract year from DATETIME type (ignoring hours, minutes, seconds)
SELECT YEAR('2024-05-20 14:30:25') AS year_datetime;
+---------------+
| year_datetime |
+---------------+
|          2024 |
+---------------+

-- Input is NULL (returns NULL)
SELECT YEAR(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```
