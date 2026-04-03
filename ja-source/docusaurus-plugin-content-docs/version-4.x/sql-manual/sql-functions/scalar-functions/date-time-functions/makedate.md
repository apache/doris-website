---
{
  "title": "MAKEDATE",
  "description": "MAKEDATE関数は、指定された年と年内の日数（dayofyear）に基づいて日付を構築し、返すために使用されます。",
  "language": "ja"
}
---
## 説明

MAKEDATE関数は、指定された年と年間通算日（`dayofyear`）に基づいて日付を構築し、返すために使用されます。この関数は、指定された年の最初の日に日数オフセットを加算することで結果を計算します。年の総日数を超える入力に対する自動調整をサポートしています。

この関数は、MySQLの[makedate function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_makedate)と同じ動作をします。

## 構文

```sql
MAKEDATE(`<year>`, `<day_of_year>`)
```
## パラメータ

| Parameter    | デスクリプション                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `year`       | 指定する年。INT型で、有効な範囲は0から9999です。          |
| `dayofyear`  | 年の日数（1-366）。INT型です。                                  |

## Return Value

入力された年と年の日数に基づいて計算された日付を表す`DATE`型の値を返します（形式`YYYY-MM-DD`）。

- `<day_of_year>`が0以下の場合、エラーが返されます。
- `<day_of_year>`が指定された年の総日数を超える場合（平年は365日、うるう年は366日）、関数は自動的に翌年以降に調整されます（例：平年である2021年の366日目は2022-01-01に調整されます）。
- 計算結果が有効な日付範囲（0000-01-01から9999-12-31）を超える場合、エラーが返されます。
- いずれかのパラメータが`NULL`の場合、関数は`NULL`を返します。

## Examples

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

--- パラメータ are NULL, returns NULL
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
