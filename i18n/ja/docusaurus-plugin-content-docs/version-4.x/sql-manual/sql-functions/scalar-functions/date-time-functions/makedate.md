---
{
    "title": "MAKEDATE",
    "language": "ja",
    "description": "MAKEDATE 関数は、指定した年とその年の通算日（dayofyear）に基づいて日付を生成し、返します。"
}
---

## 説明

MAKEDATE 関数は、指定した年とその年の通算日（`dayofyear`）に基づいて日付を生成し、返します。指定した年の初日に日数のオフセットを加えて結果を計算します。入力した通算日がその年の日数を超える場合は、自動的に翌年以降に繰り越します。

この関数は、MySQL の [makedate 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_makedate)と同じ動作をします。

## 構文

```sql
MAKEDATE(`<year>`, `<day_of_year>`)
```

## パラメータ

| パラメータ | 説明 |
|--------------|-----------------------------------------------------------------------------|
| `year`       | 指定する年です。型は INT で、有効な範囲は 0 から 9999 です。 |
| `dayofyear`  | その年の通算日（1～366）です。型は INT です。 |

## 戻り値

入力した年と通算日から計算された日付を表す、`DATE` 型の値を返します（形式は `YYYY-MM-DD`）。

- `<day_of_year>` が 0 以下の場合、エラーを返します。
- `<day_of_year>` が指定した年の日数（平年は 365 日、閏年は 366 日）を超える場合、翌年以降に自動的に繰り越します（例えば、平年である 2021 年の 366 日目は 2022-01-01 になります）。
- 計算結果が有効な日付範囲（0000-01-01 から 9999-12-31）を超える場合、エラーを返します。
- いずれかのパラメータが `NULL` の場合、`NULL` を返します。

## 例

```sql
--- Calculate the Nth day of the year (Note: 2021 is a common year with 365 days, and the 365th day is December 31)
SELECT MAKEDATE(2021, 1), MAKEDATE(2021, 100), MAKEDATE(2021, 365);
+-------------------+---------------------+----------------------+
| makedate(2021, 1) | makedate(2021, 100) | makedate(2021, 365)  |
+-------------------+---------------------+----------------------+
| 2021-01-01        | 2021-04-10          | 2021-12-31           |
+-------------------+---------------------+----------------------+

--- Leap year handling: 2020 is a leap year (366 days)
SELECT MAKEDATE(2020, 366);
+----------------------+
| makedate(2020, 366)  |
+----------------------+
| 2020-12-31           |
+----------------------+

--- Days exceeding the total days of the year are automatically adjusted to the next year
SELECT MAKEDATE(2021, 366), MAKEDATE(2021, 400);
+----------------------+----------------------+
| makedate(2021, 366)  | makedate(2021, 400)  |
+----------------------+----------------------+
| 2022-01-01           | 2022-02-04           |
+----------------------+----------------------+

--- Non-positive day values return an error
SELECT MAKEDATE(2020, 0);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]The function makedate Argument value 2020, 0 must larger than zero ,and year between 1 and 9999

--- Parameters are NULL, returns NULL
SELECT MAKEDATE(NULL, 100), MAKEDATE(2023, NULL);
+---------------------+----------------------+
| makedate(NULL, 100) | makedate(2023, NULL) |
+---------------------+----------------------+
| NULL                | NULL                 |
+---------------------+----------------------+

--- Year exceeds the valid range
SELECT MAKEDATE(9999, 366);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation makedate of 9999, 366 out of range
```
