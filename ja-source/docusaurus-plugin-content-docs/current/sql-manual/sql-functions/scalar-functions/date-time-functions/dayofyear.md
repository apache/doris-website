---
{
  "title": "DAYOFYEAR",
  "language": "ja",
  "description": "DAYOFYEAR関数は、日付または時刻式に対応する現在の年の日数を計算するために使用されます。つまり、"
}
---
## 説明

DAYOFYEAR関数は、日付または時刻式に対応する現在の年の日数を計算するために使用されます。つまり、その日付が年の何日目にあたるかを求めます。戻り値は1（1月1日）から366（うるう年の12月31日）までの範囲の整数です。

この関数はMySQLの[dayofyear function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofyear)と一貫した動作をします

## 別名

- DOY

## 構文

```sql
DAYOFYEAR(<date_or_time_expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | date/datetime型をサポートする有効な日付表現。具体的なdatetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## 戻り値

SMALLINT型で、現在の年の日数（1-366）を表す整数を返します。

特殊ケース：

- <date_or_time_expr>がNULLの場合、NULLを返します；
- うるう年の2月29日の場合、年の60日目として正しく計算されます。

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
