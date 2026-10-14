---
{
    "title": "DAY",
    "language": "ja",
    "description": "DAY 関数は、日付または時刻の式から「日」の部分を抽出します。"
}
---

## 説明

DAY 関数は、日付または時刻の式から「日」の部分を抽出し、月と年に応じて 1 から 31 までの整数を返します。

この関数は MySQL の [day 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_day) と同じ動作をします。

## エイリアス

- dayofmonth

## 構文

```sql
DAY(<date_or_time_expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | DATE/DATETIME/TIMESTAMP_NS 型に対応する有効な日付式。具体的な日時と日付の形式については、[日時変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

日付の「日」の部分を整数（1～31）で返します。

特別なケース：

`dt` が NULL の場合、NULL を返します。

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
