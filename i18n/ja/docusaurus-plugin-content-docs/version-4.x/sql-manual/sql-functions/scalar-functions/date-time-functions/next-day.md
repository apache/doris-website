---
{
  "title": "NEXT_DAY",
  "description": "NEXTDAY関数は、指定された日付の後で、対象の曜日に一致する最初の日付を返します。例えば、NEXTDAY('2020-01-31',",
  "language": "ja"
}
---
## 説明

NEXT_DAY関数は、指定された日付の後で、対象の曜日に一致する最初の日付を返します。例えば、NEXT_DAY('2020-01-31', 'MONDAY')は2020-01-31以降の最初の月曜日を返します。この関数はDATEとDATETIME型の処理をサポートし、入力の時刻部分は無視されます（計算は日付部分のみに基づいて行われます）。

この関数はOracleの[next_day function](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NEXT_DAY.html)と一致しています。

## 構文

```sql
NEXT_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<date_or_time_expr>` | date/datetime型をサポートします。特定のdatetimeおよびdate形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<day_of_week>` | 曜日を識別するために使用される文字列式で、string型です。 |

`<day_of_week>`は以下のいずれかの値である必要があります（大文字小文字を区別しません）:
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## Return Value

DATE型の値を返し、`<day_of_week>`に一致する基準日後の最初の日付を表します。

特殊なケース:
- 基準日自体が対象の曜日である場合、対象曜日の次の出現日を返します（現在の日付ではありません）;
- `<date_or_time_expr>`がNULLの場合、NULLを返します;
- `<day_of_week>`が無効な値（例：'ABC'）の場合、例外をスローします;
- 入力が9999-12-31の場合（時刻を含むかどうかに関係なく）、自身を返します（この日付は有効な最大日付であるため、それ以降の日付は存在しません）;

## Examples

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
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]ファンクション next_day failed to parse weekday: ABC

--- Maximum date (returns itself)
SELECT NEXT_DAY('9999-12-31 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 9999-12-31 |
+------------+
```
