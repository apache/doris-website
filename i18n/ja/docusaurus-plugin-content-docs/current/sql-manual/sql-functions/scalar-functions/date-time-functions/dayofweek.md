---
{
    "title": "DAYOFWEEK",
    "language": "ja",
    "description": "DAYOFWEEK 関数は、日付または時刻の式に対応する曜日の番号を、日曜日を 1 とする規則に従って返します。"
}
---

## 説明

DAYOFWEEK 関数は、日付または時刻の式に対応する曜日の番号を返します。日曜日が 1、月曜日が 2、…、土曜日が 7 です。

この関数の動作は、MySQL の [dayofweek 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofweek) と同じです。

## 別名

- DOW

## 構文

```sql
DAYOFWEEK(<date_or_time_expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | DATE/DATETIME/TIMESTAMP_NS 型をサポートする有効な日付式。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

日付に対応する曜日の番号を整数で返します（1～7。1 は日曜日、7 は土曜日）。

特殊なケース：

`<date_or_time_expr>` が NULL の場合は、NULL を返します。

## 例

```sql
---Calculate weekday index value for date type
select dayofweek('2019-06-25');

+----------------------------------+
| dayofweek('2019-06-25 00:00:00') |
+----------------------------------+
|                                3 |
+----------------------------------+

---Calculate weekday index value for datetime type
select dayofweek('2019-06-25 15:30:45');

+----------------------------------+
| dayofweek('2019-06-25 15:30:45') |
+----------------------------------+
|                                3 |
+----------------------------------+
---Index for Sunday
select dayofweek('2024-02-18');
+-------------------------+
| dayofweek('2024-02-18') |
+-------------------------+
|                       1 |
+-------------------------+

---Input datetime is NULL, returns NULL
select dayofweek(NULL);
+-----------------+
| dayofweek(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
