---
{
  "title": "TIME_TO_SEC",
  "language": "ja",
  "description": "TIMETOSEC関数は、入力された時間値を総秒数に変換します。"
}
---
## 説明

TIME_TO_SEC関数は、入力された時刻値を総秒数に変換します。この関数はTIME型とDATETIME型の処理をサポートします：入力がDATETIME型の場合、計算のために時刻部分（HH:MM:SS）を自動的に抽出します；入力が純粋な時刻値の場合、直接総秒数に変換します。

この関数は、MySQLの[time_to_sec function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_time-to-sec)と一貫した動作をします。

## 構文

```sql
TIME_TO_SEC(<date_or_time_expr>)
```
## パラメータ

| パラメータ             | 説明                                                                                                                                                                                                                                                                                                                                                     |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<date_or_time_expr>` | 必須。TIMEまたはDATETIMEをサポートします。入力がDATETIME型の場合、関数は計算のため時刻部分を抽出します。特定のdatetime/time形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください|

## 戻り値

入力された時刻値に対応する総秒数を表すINT型を返します。計算式：時間×3600 + 分×60 + 秒。

- datetime文字列を入力する場合、明示的にdatetime型に変換する必要があります。そうでなければ、デフォルトでtime型に変換され、NULLが返されます。
- 入力が負の時刻（-01:30:00など）の場合、対応する負の秒数（-5400など）を返します
- 入力がNULLの場合、NULLを返します
- マイクロ秒部分は無視されます（例：12:34:56.789は12:34:56としてのみ計算されます）

## 例

```sql
-- Pure time type
SELECT TIME_TO_SEC('16:32:18') AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- Process the DATETIME string and return NULL.
SELECT TIME_TO_SEC('2025-01-01 16:32:18') AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+

-- A datetime string needs to be explicitly converted to a datetime type.
SELECT TIME_TO_SEC(cast('2025-01-01 16:32:18' as datetime)) AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- Negative time conversion
SELECT TIME_TO_SEC('-02:30:00') AS result;
+--------+
| result |
+--------+
|  -9000 |
+--------+

-- Negative time with microseconds (ignore microseconds)
SELECT TIME_TO_SEC('-16:32:18.99') AS result;
+--------+
| result |
+--------+
| -59538 |
+--------+

-- Microsecond processing (ignore microseconds)
SELECT TIME_TO_SEC('10:15:30.123456') AS result;
+--------+
| result |
+--------+
|  36930 |
+--------+

-- Invalid time
SELECT TIME_TO_SEC('12:60:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Exceeds TIME range
SELECT TIME_TO_SEC('839:00:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Parameter is NULL
SELECT TIME_TO_SEC(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
