---
{
  "title": "YEARWEEK",
  "language": "ja",
  "description": "YEARWEEK関数は、指定された日付の「年+週番号」の組み合わせを返すために使用されます（フォーマットYYYYWW、例："
}
---
## 説明

YEARWEEK関数は、指定された日付の「年 + 週番号」の組み合わせを返すために使用されます（形式YYYYWW、例：202301は2023年の第1週を表します）。この関数は、オプションパラメータmodeを通じて週の開始日と「第1週」を決定する基準を柔軟に定義し、デフォルトはmode=0です。

週番号は、mode設定に応じて1-53の範囲になります。

パラメータmodeの効果を以下の表に示します：

|Mode |週の最初の日      |週番号の範囲      |第1週の定義                                           |
|:----|:-----------------|:-----------------|:-----------------------------------------------------|
|0    |日曜日            |1-53              |年の最初の日曜日を含む週                              |
|1    |月曜日            |1-53              |年に4日以上ある最初の週                               |
|2    |日曜日            |1-53              |年の最初の日曜日を含む週                              |
|3    |月曜日            |1-53              |年に4日以上ある最初の週                               |
|4    |日曜日            |1-53              |年に4日以上ある最初の週                               |
|5    |月曜日            |1-53              |年の最初の月曜日を含む週                              |
|6    |日曜日            |1-53              |年に4日以上ある最初の週                               |
|7    |月曜日            |1-53              |年の最初の月曜日を含む週                              |

この関数は、MySQLの[yearweek function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_yearweek)と一致しています。

## 構文

```sql
YEARWEEK(`<date_or_time_expr>`[, mode])
```
## 戻り値

YYYYWW形式のINT型整数を返します（最初の4桁は年、最後の2桁は週番号）。例：202305は2023年の第5週、202052は2020年の第52週を表します。

- 日付を含む週が前年に属する場合、前年の年と週番号を返します（例：2021年1月1日は202052を返す可能性があります）。
- 日付を含む週が翌年に属する場合、翌年の年と週1を返します（例：2024年12月30日は202501を返す可能性があります）。
- 入力がNULLの場合、NULLを返します。

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
