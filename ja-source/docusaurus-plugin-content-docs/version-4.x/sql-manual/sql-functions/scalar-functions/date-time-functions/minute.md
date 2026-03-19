---
{
  "title": "分",
  "description": "MINUTE関数は、入力されたdatetime値から分の要素を抽出し、0から59の範囲の整数を返します。",
  "language": "ja"
}
---
## 説明

MINUTE関数は、入力された日時値から分の要素を抽出し、0から59の範囲の整数を返します。この関数は、DATE、DATETIME、およびTIME型の処理をサポートしています。

この関数は、MySQLの[minute function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_minute)と互換性があります。

## 構文

```sql
MINUTE(`<date_or_time_expr>`)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力される日時の値で、DATE、DATETIME、またはTIME型を指定できます。具体的な日時/日付/時刻のフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)、[time conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |

## Return Value

入力された日時から分の値を表すINT型の整数を返します。範囲は0-59です。

- 入力がDATE型の場合（年、月、日のみを含む）、デフォルトの時刻部分は00:00:00となるため、0を返します。
- 入力がNULLの場合、NULLを返します。

## Examples

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
