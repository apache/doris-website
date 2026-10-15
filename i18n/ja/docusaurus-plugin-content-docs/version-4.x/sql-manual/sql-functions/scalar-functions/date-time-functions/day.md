---
{
    "title": "DAY",
    "language": "ja",
    "description": "DAY 関数は、日付または時刻を表す式から「日」の部分を抽出します。"
}
---

## 説明

DAY 関数は、日付または時刻を表す式から「日」の部分を抽出し、1 から 31 までの整数値を返します（値は月と年によって異なります）。

この関数の動作は、MySQL の [day 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_day) と同じです。

## 別名

- dayofmonth

## 構文

```sql
DAY(<date_or_time_expr>)
```

## 引数

| 引数 | 説明 |
| -- | -- |
| `<date_or_time_expr>` | DATE 型または DATETIME 型に対応する有効な日付式。日時と日付の具体的な形式については、[日時変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

日付の「日」を表す整数（1～31）を返します。

特別なケース:

`dt` が NULL の場合は、NULL を返します。

## 例

```sql

--Extract day from DATE type
select day('1987-01-31');
+----------------------------+
| day('1987-01-31 00:00:00') |
+----------------------------+
|                         31 |
+----------------------------+

---Extract day from DATETIME type (ignoring time part)
select day('2023-07-13 22:28:18');
+----------------------------+
| day('2023-07-13 22:28:18') |
+----------------------------+
|                         13 |
+----------------------------+

---Input is NULL
select day(NULL);
+-----------+
| day(NULL) |
+-----------+
|      NULL |
+-----------+
```
