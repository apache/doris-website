---
{
  "title": "日",
  "language": "ja",
  "description": "DAY関数は、日付または時間の式から「日」の部分を抽出するために使用されます。"
}
---
## 説明

DAY関数は、日付または時間の式から「日」の部分を抽出し、1から31の範囲（月と年に依存）の整数値を返すために使用されます。

この関数は、MySQLの[day function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_day)と一貫して動作します。

## エイリアス

- dayofmonth

## 構文

```sql
DAY(<date_or_time_expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | date/datetimeタイプをサポートする有効な日付式。具体的なdatetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## 戻り値

日付の「日」の整数情報（1-31）を返します。

特殊なケース：

`dt`がNULLの場合、NULLを返します；

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
