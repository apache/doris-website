---
{
  "title": "MONTHS_DIFF",
  "language": "ja",
  "description": "MONTHSDIFF関数は、2つのdatetime値間の整数月差を計算するために使用されます。"
}
---
## 説明

MONTHS_DIFF関数は、2つのdatetime値間の整数月差を計算するために使用され、`<enddate>`から`<startdate>`を減算して得られる月数として結果を返します。この関数はDATEおよびDATETIME型の処理をサポートし、日付部分（年、月、日）のみに基づいて計算し、時刻部分（時、分、秒）は無視します。

## 構文

```sql
MONTHS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```
## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr1>` | 終了日。date/datetimeタイプをサポートします。特定のdatetimeとdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 開始日。date/datetimeタイプをサポートします。 |

## 戻り値

`<date_or_time_expr1>`から`<date_or_time_expr2>`を減算して得られる月数をBIGINT型で返します。

基本差分 = (終了年 - 開始年) × 12 + (終了月 - 開始月);
終了日の日コンポーネント < 開始日の日コンポーネントの場合、最終結果 = 基本差分 - 1;
それ以外の場合、最終結果 = 基本差分。

- `<date_or_time_expr1>`が`<date_or_time_expr2>`より早い場合、負の値を返します（計算ロジックは同じで、符号のみが逆になります）;
- いずれかのパラメータがNULLの場合、NULLを返します;
- 実際の完全な月差分があるかどうかを考慮します（日、時間など含む）

## Examples

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
