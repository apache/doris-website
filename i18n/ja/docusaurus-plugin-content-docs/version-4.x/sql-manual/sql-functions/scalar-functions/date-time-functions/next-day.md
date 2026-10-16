---
{
    "title": "NEXT_DAY",
    "language": "ja",
    "description": "NEXTDAY 関数は、指定した日付より後で、指定した曜日に一致する最初の日付を返します。たとえば、NEXTDAY('2020-01-31',"
}
---

## 説明

NEXT_DAY 関数は、指定した日付より後で、指定した曜日に一致する最初の日付を返します。たとえば、NEXT_DAY('2020-01-31', 'MONDAY') は、2020-01-31 より後の最初の月曜日を返します。この関数は DATE 型と DATETIME 型に対応し、入力の時刻部分を無視します（計算には日付部分のみを使用します）。

この関数の動作は、Oracle の [next_day 関数](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NEXT_DAY.html)と一致します。

## 構文

```sql
NEXT_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ---- |
| `<date_or_time_expr>` | DATE 型と DATETIME 型をサポートします。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<day_of_week>` | 曜日を指定する文字列式です。 |

`<day_of_week>` には、次のいずれかの値を指定する必要があります（大文字と小文字は区別しません）。

- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## 戻り値

基準日より後で `<day_of_week>` に一致する最初の日付を、DATE 型の値として返します。

特殊なケース：

- 基準日自体が指定した曜日の場合は、その次に同じ曜日が来る日付を返します（基準日自体は返しません）。
- `<date_or_time_expr>` が NULL の場合は、NULL を返します。
- `<day_of_week>` が無効な値（例：'ABC'）の場合は、例外が発生します。
- 入力が 9999-12-31 の場合は、時刻部分の有無にかかわらず、その日付自体を返します（有効な日付の最大値であり、それ以降の日付が存在しないためです）。

## 例

```sql
-- First Monday after base date
SELECT NEXT_DAY('2020-01-31', 'MONDAY') AS result;
+------------+
| result     |
+------------+
| 2020-02-03 |
+------------+

-- Including time component (ignores time, uses only date for calculation)
SELECT NEXT_DAY('2020-01-31 02:02:02', 'MON') AS result;
+------------+
| result     |
+------------+
| 2020-02-03 |
+------------+

-- Base date itself is target day of week (returns next occurrence)
SELECT NEXT_DAY('2023-07-17', 'MON') AS result;  -- 2023-07-17 is Monday
+------------+
| result     |
+------------+
| 2023-07-24 |
+------------+

-- Target day of week as abbreviation (case insensitive)
SELECT NEXT_DAY('2023-07-13', 'FR') AS result;  -- 2023-07-13 is Thursday
+------------+
| result     |
+------------+
| 2023-07-14 |
+------------+

-- Input is NULL (returns NULL)
SELECT NEXT_DAY(NULL, 'SUN') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- Invalid weekday identifier (throws exception)
mysql> SELECT NEXT_DAY('2023-07-13', 'ABC') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Function next_day failed to parse weekday: ABC

--- Maximum date (returns itself)
SELECT NEXT_DAY('9999-12-31 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 9999-12-31 |
+------------+
``` 
