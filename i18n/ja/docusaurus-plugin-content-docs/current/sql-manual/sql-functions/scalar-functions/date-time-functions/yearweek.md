---
{
    "title": "YEARWEEK",
    "language": "ja",
    "description": "YEARWEEK 関数は、指定した日付の「年 + 週番号」の組み合わせを YYYYWW 形式で返します。例えば、202301 は 2023 年の第 1 週を表します。"
}
---

## 説明

YEARWEEK 関数は、指定した日付の「年 + 週番号」の組み合わせを返します（形式は YYYYWW。例えば、202301 は 2023 年の第 1 週を表します）。省略可能な mode パラメータで週の開始曜日と「最初の週」の判定基準を指定でき、デフォルトは mode=0 です。

週番号は mode の設定に応じて 1～53 になります。

mode パラメータの効果を次の表に示します。

| mode | 週の開始曜日 | 週番号の範囲 | 最初の週の定義 |
|:-----|:-------------|:-------------|:-------------|
| 0 | 日曜日 | 1-53 | その年の最初の日曜日を含む週 |
| 1 | 月曜日 | 1-53 | その年の日が 4 日以上含まれる最初の週 |
| 2 | 日曜日 | 1-53 | その年の最初の日曜日を含む週 |
| 3 | 月曜日 | 1-53 | その年の日が 4 日以上含まれる最初の週 |
| 4 | 日曜日 | 1-53 | その年の日が 4 日以上含まれる最初の週 |
| 5 | 月曜日 | 1-53 | その年の最初の月曜日を含む週 |
| 6 | 日曜日 | 1-53 | その年の日が 4 日以上含まれる最初の週 |
| 7 | 月曜日 | 1-53 | その年の最初の月曜日を含む週 |

この関数の動作は MySQL の [YEARWEEK 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_yearweek) と一致します。

## 構文

```sql
YEARWEEK(`<date_or_time_expr>`[, mode])
```

## 戻り値

YYYYWW 形式の INT 型の整数を返します（先頭の 4 桁が年、末尾の 2 桁が週番号）。例えば、202305 は 2023 年の第 5 週、202052 は 2020 年の第 52 週を表します。

- 指定した日付を含む週が前年に属する場合は、前年の年と週番号を返します（例えば、2021 年一月 1 日は 202052 を返す場合があります）。
- 指定した日付を含む週が翌年に属する場合は、翌年の年と第 1 週を返します（例えば、2024 年十二月 30 日は 202501 を返す場合があります）。
- 入力が NULL の場合は NULL を返します。

## 例

```sql
-- Default mode=0 (Sunday start, first week contains first Sunday)
-- 2021-01-01 is Friday, the first Sunday of the week is 2020-12-27, so it belongs to week 52 of 2020
SELECT YEARWEEK('2021-01-01') AS yearweek_mode0;
+----------------+
| yearweek_mode0 |
+----------------+
|         202052 |
+----------------+

-- mode=1 (Monday start, 4-day rule, consistent with WEEKOFYEAR)
SELECT YEARWEEK('2020-07-01', 1) AS yearweek_mode1;
+----------------+
| yearweek_mode1 |
+----------------+
|         202027 |
+----------------+

-- mode=1, cross-year week (2024-12-30 is Monday, the week has ≥4 days in 2025, belongs to week 1 of 2025)
SELECT YEARWEEK('2024-12-30', 1) AS cross_year_mode1;
+------------------+
| cross_year_mode1 |
+------------------+
|           202501 |
+------------------+

-- mode=5 (Monday start, first week contains first Monday)
-- 2023-01-02 is Monday (first Monday of the year), the week is week 1 of 2023
SELECT YEARWEEK('2023-01-02', 5) AS yearweek_mode5;
+----------------+
| yearweek_mode5 |
+----------------+
|         202301 |
+----------------+

-- Input DATE type
SELECT YEARWEEK('2023-12-25', 1) AS date_type_mode1;
+------------------+
| date_type_mode1  |
+------------------+
|           202352 |
+------------------+

-- Input NULL (returns NULL)
SELECT YEARWEEK(NULL) AS null_input;
+------------+
| null_input |
+------------+
|       NULL |
+------------+
```
