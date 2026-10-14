---
{
    "title": "PREVIOUS_DAY",
    "language": "ja",
    "description": "指定した日付より前で、対象の曜日に一致する直近の日付を返します。"
}
---

## 説明

PREVIOUS_DAY 関数は、指定した日付より前で、対象の曜日に一致する直近の日付を返します。たとえば、`PREVIOUS_DAY('2020-01-31', 'MONDAY')` は 2020-01-31 より前の直近の月曜日を表します。この関数は DATE、DATETIME、TIMESTAMP_NS 型の入力を受け付けます。時刻部分は無視され、日付部分のみを使用して計算します。

## 構文

```sql
PREVIOUS_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ---- |
| `<date_or_time_expr>` | DATE、DATETIME、TIMESTAMP_NS 型に対応します。具体的な形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<day_of_week>` | 対象の曜日を指定する文字列式。 |

`<day_of_week>` には次のいずれかの値を指定します（大文字と小文字は区別されません）。

- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## 戻り値

DATE 型の値を返します。基準日より前で、`<day_of_week>` に一致する直近の日付を表します。

特殊なケース：

- 基準日自体が対象の曜日に当たる場合は、当日ではなく前週の同じ曜日の日付を返します。
- `<date_or_time_expr>` が NULL の場合は、NULL を返します。
- `<day_of_week>` が無効な値（例：'ABC'）の場合は、例外が発生します。
- 入力が 0000-01-01 の場合は、時刻部分の有無にかかわらず、その日付をそのまま返します（この日付が有効な日付の最小値であり、それより前の日付が存在しないため）。

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
