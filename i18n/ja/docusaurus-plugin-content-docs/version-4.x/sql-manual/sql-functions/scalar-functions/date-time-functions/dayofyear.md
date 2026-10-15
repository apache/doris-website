---
{
    "title": "DAYOFYEAR",
    "language": "ja",
    "description": "DAYOFYEAR 関数は、日付または日時の式がその年の何日目に当たるかを計算します。"
}
---

## 説明

DAYOFYEAR 関数は、日付または日時の式がその年の何日目に当たるかを計算します。戻り値は、1（一月 1 日）から 366（うるう年の十二月 31 日）までの整数です。

この関数の動作は、MySQL の [dayofyear 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofyear) と同じです。

## 別名

- DOY

## 構文

```sql
DAYOFYEAR(<date_or_time_expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | DATE 型または DATETIME 型を使用できる有効な日付式。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

その年の何日目かを表す、1～366 の整数を SMALLINT 型で返します。

特殊なケース:

- <date_or_time_expr> が NULL の場合は、NULL を返します。
- うるう年の二月 29 日は、年の 60 日目として正しく計算されます。

## 例

```sql

---Extract the day number in the year from datetime type
select dayofyear('2007-02-03 00:00:00');

+----------------------------------+
| dayofyear('2007-02-03 00:00:00') |
+----------------------------------+
|                               34 |
+----------------------------------+

---Extract day number from date type
select dayofyear('2023-12-31');
+-------------------------+
| dayofyear('2023-12-31') |
+-------------------------+
|                     365 |
+-------------------------+


---Calculate day number in a leap year
select dayofyear('2024-12-31');
+-------------------------+
| dayofyear('2024-12-31') |
+-------------------------+
|                     366 |
+-------------------------+

---Input is NULL, returns NULL
select dayofyear(NULL);
+-----------------+
| dayofyear(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
