---
{
    "title": "WEEKS_ADD",
    "language": "ja",
    "description": "WEEKSADD 関数は、指定した日付または日時の値に週数を加算（または減算）します。"
}
---

## 説明

WEEKS_ADD 関数は、指定した日付または日時の値に週数を加算（または減算）し、調整後の日付または日時を返します。これは元の日付に七日単位で加算または減算することに相当します。この関数は、DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型の入力に対応しています。

この関数の動作は、MySQL で WEEK を単位として使用する [weeks_add 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-add) と同じです。

## 構文
```sql
WEEKS_ADD(`<datetime_or_date_expr>`, `<weeks_value>`)
```

## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<datetime_or_date_expr>` | 入力する日時の値。DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 型に対応します。具体的な形式については、[TIMESTAMPTZ 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。 |
| `<weeks_value>` | 加算または減算する週数を表す INT 型の整数。正の値は加算、負の値は減算を表します。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒部分が固定の九桁精度を持つ `TIMESTAMP_NS` 型の値を返します。計算結果は戻り値の型の範囲に照らして検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

指定した週数を加算した日時を返します。戻り値の型は、最初の引数の型によって決まります。

- 入力が DATE 型の場合、DATE 型の値を返します（年、月、日のみを調整します）。
- 入力が DATETIME 型の場合、DATETIME 型の値を返します（年、月、日を調整し、時、分、秒は変わりません）。
- 入力が TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型の値を返します（日付、時刻、タイムゾーンオフセットを含みます）。

特別なケース:
- `<weeks_value>` が負の値の場合、週数を減算します。
- いずれかの入力パラメータが NULL の場合、NULL を返します。
- 計算結果が日付型の有効範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59）を超える場合、エラーを返します。

## 使用例
```sql
-- DATETIME type add 1 week (basic functionality, hours, minutes, seconds remain unchanged)
SELECT WEEKS_ADD('2023-10-01 08:30:45', 1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-08 08:30:45 |
+---------------------+

-- DATETIME type subtract 1 week (negative weeks, cross-month)
SELECT WEEKS_ADD('2023-10-01 14:20:10', -1) AS subtract_1_week_datetime;
+--------------------------+
| subtract_1_week_datetime |
+--------------------------+
| 2023-09-24 14:20:10      |
+--------------------------+

-- DATE type add 2 weeks (only adjust date, no time portion)
SELECT WEEKS_ADD('2023-05-20', 2) AS add_2_week_date;
+-----------------+
| add_2_week_date |
+-----------------+
| 2023-06-03      |
+-----------------+

-- Cross-year addition (late December plus 1 week, to early January next year)
SELECT WEEKS_ADD('2023-12-25', 1) AS cross_year_add;
+----------------+
| cross_year_add |
+----------------+
| 2024-01-01     |
+----------------+

-- Input is NULL (returns NULL)
SELECT WEEKS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-17 12:22:33.123+08:00                 |
+-----------------------------------------------+
```
