---
{
  "title": "WEEKS_DIFF",
  "description": "WEEKSDIFF関数は、2つの日付または時刻の値の間の完全な週数の差を計算します。",
  "language": "ja"
}
---
## 説明
WEEKS_DIFF関数は、2つの日付または時刻の値間の完全な週数の差を計算し、結果は終了時刻から開始時刻を引いた週数になります（7日を1週間として扱います）。この関数は、DATE、DATETIMEタイプおよび適切にフォーマットされた文字列の処理をサポートし、計算において完全な時刻差（時、分、秒を含む）を考慮します。

## 構文

```sql
WEEKS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```
## パラメータ
| Parameter | デスクリプション |
|-----------|-------------|
| `<date_or_time_expr1>` | より後の日付または日時で、date/datetime型をサポートします。datetimeおよびdate形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<date_or_time_expr2>` | より前の日付または日時で、date/datetime型をサポートします |

## 戻り値

INT型の整数を返し、`<date_or_time_expr1>`と`<date_or_time_expr2>`の間の完全な週の差を表します：

- `<date_or_time_expr1>`が`<date_or_time_expr2>`より後の場合、正の数を返します（総日数差÷7の整数部分）。
- `<date_or_time_expr1>`が`<date_or_time_expr2>`より前の場合、負の数を返します（同じ計算方法で、結果を反転）。
- 入力がDATE型の場合、時刻部分はデフォルトで00:00:00となります。
- 計算は完全な時間差（時、分、秒を含む）を考慮し、「完全な7日」の部分のみをカウントし、1週間未満の日数は無視します。
- いずれかのパラメータがNULLの場合、NULLを返します。
- 「完全な7日」の部分のみをカウントします。例えば、8日の差は1週間を返し、6日の差は0週間を返します。例として、'2023-10-08 00:00:00'と'2023-10-01 12:00:00'の差は6.5日で0週間を返し、'2023-10-08 12:00:00'と'2023-10-01 00:00:00'の差は7.5日で1週間を返します。

## 例

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
+------------+------------+
| null_input1 | null_input2 |
+------------+------------+
| NULL       | NULL       |
+------------+------------+
```
