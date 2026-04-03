---
{
  "title": "前日",
  "language": "ja"
}
---
## 説明

PREVIOUS_DAY関数は、指定された日付より前にある、対象の曜日に一致する最初の日付を返します。例えば、`PREVIOUS_DAY('2020-01-31', 'MONDAY')`は2020-01-31より前の最初の月曜日を表します。この関数はDATE、DATETIME、およびTIMESTAMPTZ型をサポートし、入力の時刻部分を無視します（日付部分のみに基づいて計算します）。

## 構文

```sql
PREVIOUS_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```
## パラメータ

| パラメータ             | 説明                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<date_or_time_expr>` | DATE/DATETIMEタイプをサポートします。具体的な形式については、[TIMESTAMPTZ Conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME Conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE Conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<day_of_week>`       | 曜日を識別する文字列式です。                                                                                                                                                                                                                                                                                                        |

`<day_of_week>` は以下の値のいずれかである必要があります（大文字小文字は区別されません）：
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## 戻り値

基準日より前の `<day_of_week>` に一致する最初の日付を表すDATEタイプの値を返します。

特殊なケース：
- 基準日自体が対象の曜日である場合、前週の対象曜日を返します（現在の日付ではありません）。
- `<date_or_time_expr>` がNULLの場合、NULLを返します。
- `<day_of_week>` が無効な値（例：'ABC'）の場合、例外をスローします。
- 入力が0000-01-01の場合（時刻が含まれているかどうかに関係なく）、自分自身を返します（この日付は有効な最小日付であるため、それより前の日付は存在しません）。

## 例

```sql
--- The first Monday before the base date
SELECT PREVIOUS_DAY('2020-01-31', 'MONDAY') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- Including time part (time is ignored, calculation based on date only)
SELECT PREVIOUS_DAY('2020-01-31 02:02:02', 'MON') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- The base date itself is the target weekday (returns the previous one)
SELECT PREVIOUS_DAY('2023-07-17', 'MON') AS result;  -- 2023-07-17 is Monday
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+

--- Target weekday is an abbreviation (case-insensitive)
SELECT PREVIOUS_DAY('2023-07-13', 'WE') AS result;  -- 2023-07-13 is Thursday
+------------+
| result     |
+------------+
| 2023-07-12 |
+------------+

--- Input is NULL (returns NULL)
SELECT PREVIOUS_DAY(NULL, 'SUN') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- Invalid weekday identifier (throws an exception)
mysql> SELECT PREVIOUS_DAY('2023-07-13', 'ABC') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Function previous_day failed to parse weekday: ABC

--- Minimum date (returns itself)
SELECT PREVIOUS_DAY('0000-01-01 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 0000-01-01 |
+------------+
```
