---
{
  "title": "議事録",
  "language": "ja",
  "description": "MINUTE関数は、入力されたdatetime値から分の要素を抽出し、0から59の範囲の整数を返します。"
}
---
## 説明

MINUTE関数は、入力されたdatetime値から分の構成要素を抽出し、0から59の範囲の整数を返します。この関数は、DATE、DATETIME、およびTIME型の処理をサポートしています。

この関数は、MySQLの[minute function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_minute)と一致しています。

## 構文

```sql
MINUTE(`<date_or_time_expr>`)
```
## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力のdatetime値で、DATE、DATETIME、またはTIME型を指定できます。特定のdatetime/date/time形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)、[time conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |

## 戻り値

入力datetimeから分の値を表すINT型の整数を返します。範囲は0-59です。

- 入力がDATE型（年、月、日のみを含む）の場合、デフォルトの時刻部分は00:00:00となるため、0を返します。
- 入力がNULLの場合、NULLを返します。

## 例

```sql
-- Extract minute from DATETIME
SELECT MINUTE('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Extract minute from DATETIME with microseconds (ignores microseconds)
SELECT MINUTE('2023-05-01 10:05:30.123456') AS result;
+--------+
| result |
+--------+
|      5 |
+--------+

-- Does not automatically convert string to time type, returns NULL
SELECT MINUTE('14:25:45') AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+

-- Extract minute from DATE type (default time 00:00:00)
SELECT MINUTE('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Input is NULL, returns NULL
SELECT MINUTE(NULL) AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+
```
