---
{
    "title": "MONTHS_DIFF",
    "language": "ja",
    "description": "MONTHSDIFF 関数は、二つの日時値の間の整数の月差を計算します。"
}
---

## 説明

MONTHS_DIFF 関数は、二つの日時値の間の整数の月差を計算し、`<startdate>` を `<enddate>` から差し引いて得られる月数を返します。DATE、DATETIME、TIMESTAMP_NS 型に対応し、時刻部分（時、分、秒）を無視して、日付部分（年、月、日）のみを基に計算します。

## 構文

```sql
MONTHS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr1>` | 終了日。DATE/DATETIME/TIMESTAMP_NS 型に対応します。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 開始日。DATE/DATETIME/TIMESTAMP_NS 型に対応します。 |

## 戻り値

`<date_or_time_expr2>` を `<date_or_time_expr1>` から差し引いて得られる月数を BIGINT 型で返します。

基本の差 =（終了年 - 開始年）× 12 +（終了月 - 開始月）。
終了日の日の値 < 開始日の日の値の場合、最終結果 = 基本の差 - 1。
それ以外の場合、最終結果 = 基本の差。

- `<date_or_time_expr1>` が `<date_or_time_expr2>` より前の場合、負の値を返します（計算方法は同じで、符号のみが逆になります）。
- いずれかのパラメータが NULL の場合、NULL を返します。
- 実際に満了した月数の差があるかどうかを考慮します（日、時間なども含む）。

## 例

```sql
--- Year-month difference is 1, and end day < start day (result minus 1)
SELECT MONTHS_DIFF('2020-03-28', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Year-month difference is 1, and end day = start day
SELECT MONTHS_DIFF('2020-03-29', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Year-month difference is 1, and end day > start day
SELECT MONTHS_DIFF('2020-03-30', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- End date is earlier than start date (negative value logic is the same)
SELECT MONTHS_DIFF('2020-02-29', '2020-03-28') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

SELECT MONTHS_DIFF('2020-02-29', '2020-03-29') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

--- Same month (result is 0)
SELECT MONTHS_DIFF('2023-07-15', '2023-07-30') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--Takes into account whether there is an actual full month difference (including days, hours, etc.)
mysql> SELECT MONTHS_DIFF('2020-03-28', '2020-01-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

mysql> SELECT MONTHS_DIFF('2020-03-28 22:22:22', '2020-02-29 23:12:12') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Input is NULL (returns NULL)
SELECT MONTHS_DIFF(NULL, '2023-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
