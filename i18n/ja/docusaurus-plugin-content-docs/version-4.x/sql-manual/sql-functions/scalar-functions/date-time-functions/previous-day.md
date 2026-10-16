---
{
    "title": "PREVIOUS_DAY",
    "language": "ja",
    "description": "指定した日付より前で、指定した曜日に当たる最も近い日付を返します。"
}
---

## 説明

PREVIOUS_DAY 関数は、指定した日付より前で、指定した曜日に当たる最も近い日付を返します。たとえば、`PREVIOUS_DAY('2020-01-31', 'MONDAY')` は、2020-01-31 より前の最も近い月曜日を表します。この関数は DATE 型と DATETIME 型の入力を受け付け、時刻部分を無視して日付部分のみを基に計算します。

## 構文

```sql
PREVIOUS_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<date_or_time_expr>` | DATE 型と DATETIME 型に対応します。形式の詳細については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<day_of_week>` | 曜日を指定する文字列式です。 |

`<day_of_week>` には、次のいずれかの値を指定します（大文字と小文字は区別されません）。
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## 戻り値

基準日より前で `<day_of_week>` に一致する最も近い日付を DATE 型で返します。

特記事項:
- 基準日自体が指定した曜日の場合、基準日ではなく前週のその曜日を返します。
- `<date_or_time_expr>` が NULL の場合、NULL を返します。
- `<day_of_week>` に無効な値（例: 'ABC'）を指定した場合、例外が発生します。
- 入力が 0000-01-01 の場合、時刻部分の有無にかかわらず、その日付をそのまま返します。この日付が有効な最小日付であり、それより前の日付が存在しないためです。

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
