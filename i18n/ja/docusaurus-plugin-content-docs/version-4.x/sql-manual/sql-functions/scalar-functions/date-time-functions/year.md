---
{
    "title": "YEAR",
    "language": "ja",
    "description": "YEAR 関数は指定した日付または時刻の値から年の部分を抽出し、整数として返します。"
}
---

## 説明
YEAR 関数は指定した日付または時刻の値から年の部分を抽出し、整数として返します。DATE 型と DATETIME 型を処理できます。

この関数の動作は MySQL の [YEAR 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_year) と同じです。

## 構文
```sql
YEAR(`<date_or_time_expr>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<date_or_time_expr>` | 年を抽出する日付または日時の値。DATE 型と DATETIME 型をサポートします。日付と日時の形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

日付または日時の年の部分を INT 型で返します。値の範囲は 0～9999 です。

- 入力パラメータが NULL の場合は、NULL を返します。

## 例

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
