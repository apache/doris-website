---
{
    "title": "WEEKS_DIFF",
    "language": "ja",
    "description": "WEEKSDIFF 関数は、二つの日付または日時の値の間にある完全な週数の差を計算します。"
}
---

## 説明
WEEKS_DIFF 関数は、二つの日付または日時の値の間にある完全な週数の差を計算します。結果は、終了日時から開始日時を引いた時間差を週数に換算した値です（7 日を 1 週間として扱います）。DATE 型、DATETIME 型、および適切な形式の文字列を処理でき、時、分、秒を含む時間差全体を計算に使用します。

## 構文

```sql
WEEKS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## パラメータ
| パラメータ | 説明 |
|-----------|------|
| `<date_or_time_expr1>` | 後の日時。DATE 型または DATETIME 型を指定できます。日時と日付の形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 前の日時。DATE 型または DATETIME 型を指定できます。 |

## 戻り値

`<date_or_time_expr1>` と `<date_or_time_expr2>` の間にある完全な週数の差を表す INT 型の整数を返します。

- `<date_or_time_expr1>` が `<date_or_time_expr2>` より後の場合、正の数を返します（日数の差を 7 で割った値の整数部分）。
- `<date_or_time_expr1>` が `<date_or_time_expr2>` より前の場合、負の数を返します（同じ方法で計算した値に負号を付けます）。
- DATE 型の入力では、時刻部分を 00:00:00 として扱います。
- 計算には時、分、秒を含む時間差全体を使用し、「丸 7 日」の部分だけを数えます。一週間に満たない日数は切り捨てます。
- いずれかのパラメータが NULL の場合、NULL を返します。
- 「丸 7 日」の部分だけを数えるため、差が 8 日なら 1 週間、6 日なら 0 週間を返します。たとえば、'2023-10-08 00:00:00' と '2023-10-01 12:00:00' の差は 6.5 日なので 0 週間を返し、'2023-10-08 12:00:00' と '2023-10-01 00:00:00' の差は 7.5 日なので 1 週間を返します。

## 使用例
```sql
-- Two DATE types differ by 8 weeks (56 days)
SELECT WEEKS_DIFF('2020-12-25', '2020-10-25') AS diff_date;
+-----------+
| diff_date |
+-----------+
|         8 |
+-----------+

-- DATETIME type with time portions (total 56 days difference, ignoring hour/minute/second differences)
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25 12:10:02') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             8 |
+---------------+

-- Mixed DATE and DATETIME calculation (DATE defaults to 00:00:00)
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25') AS diff_mixed;
+-------------+
| diff_mixed  |
+-------------+
|           8 |
+-------------+

-- Less than 1 week (6 days), returns 0
SELECT WEEKS_DIFF('2023-10-07', '2023-10-01') AS diff_6_days;
+-------------+
| diff_6_days |
+-------------+
|           0 |
+-------------+

-- More than 1 week (8 days), returns 1
SELECT WEEKS_DIFF('2023-10-09', '2023-10-01') AS diff_8_days;
+-------------+
| diff_8_days |
+-------------+
|           1 |
+-------------+

-- Time portion impact: 7.5 days difference (returns 1) vs 6.5 days (returns 0)
SELECT 
  WEEKS_DIFF('2023-10-08 12:00:00', '2023-10-01 00:00:00') AS diff_7_5d,
  WEEKS_DIFF('2023-10-08 00:00:00', '2023-10-01 12:00:00') AS diff_6_5d;
+-----------+-----------+
| diff_7_5d | diff_6_5d |
+-----------+-----------+
|         1 |         0 |
+-----------+-----------+

-- End time earlier than start time, returns negative number
SELECT WEEKS_DIFF('2023-10-01', '2023-10-08') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -1 |
+---------------+

-- Cross-year calculation (2023-12-25 to 2024-01-01 differs by 7 days, returns 1)
SELECT WEEKS_DIFF('2024-01-01', '2023-12-25') AS cross_year;
+------------+
| cross_year |
+------------+
|          1 |
+------------+

-- Any parameter is NULL (returns NULL)
SELECT 
  WEEKS_DIFF(NULL, '2023-10-01') AS null_input1,
  WEEKS_DIFF('2023-10-01', NULL) AS null_input2;
+-------------+-------------+
| null_input1 | null_input2 |
+-------------+-------------+
| NULL        | NULL        |
+-------------+-------------+
```
