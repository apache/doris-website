---
{
  "title": "秒",
  "description": "SECOND関数は、指定されたdatetime値から秒の部分を抽出し、0から59までの整数結果を返します。",
  "language": "ja"
}
---
## 説明

SECOND関数は、指定されたdatetime値から秒の部分を抽出し、0から59までの整数結果を返します。この関数は、DATE、DATETIME、およびTIME型の処理をサポートしています。

この関数は、MySQLの[second function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_second)と一致しています。

## 構文

```sql
SECOND(<date_or_time_expr>)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力される日時の値。DATE、DATETIME、またはTIME型を指定できます。特定の日時/日付/時刻フォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)、[time conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |

## Return Value

入力された日時の秒の部分を表すINT型の値を返します：

- 範囲：0から59（両端を含む）
- 入力がDATE型の場合、0を返します（デフォルト時刻が00:00:00のため）
- 入力がNULLの場合、NULLを返します
- マイクロ秒部分は無視されます（例：12:34:56.789では56秒のみを抽出）

## Examples

```sql
-- Extract seconds from DATETIME
SELECT SECOND('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Input is TIME type
SELECT SECOND(cast('15:42:33' as time)) AS result;
+--------+
| result |
+--------+
|     33 |
+--------+

-- Input is DATE type (default seconds is 0)
SELECT SECOND('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Time with microseconds (ignores microseconds)
SELECT SECOND('2023-07-13 10:30:25.123456') AS result;
+--------+
| result |
+--------+
|     25 |
+--------+

-- Case where seconds is 0
SELECT SECOND('2024-01-01 00:00:00') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- When a string literal is valid for both datetime and time, prefer parsing it as time
SELECT SECOND("22:12:12");
+--------------------+
| SECOND("22:12:12") |
+--------------------+
|                 12 |
+--------------------+

-- Input is NULL (returns NULL)
SELECT SECOND(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
