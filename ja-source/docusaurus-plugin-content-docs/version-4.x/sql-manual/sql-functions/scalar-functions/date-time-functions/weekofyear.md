---
{
  "title": "WEEKOFYEAR",
  "description": "WEEKOFYEAR関数は、年内の指定された日付の週番号を返します（範囲1-53）。週は月曜日に始まり日曜日に終わります。",
  "language": "ja"
}
---
## 説明
WEEKOFYEAR関数は、指定された日付の年内での週番号を返します（範囲は1-53）。
週は月曜日に始まり日曜日に終わります。
年内において、ある週が現在の年に4日以上含まれている場合、その週は現在の年の第1週とみなされます。そうでない場合、その週は前年の最終週に属します（52週目または53週目の場合があります）。

この関数は、MySQLの[weekofyear function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekofyear)と一致しています。

## 構文

```sql
INT WEEKOFYEAR(`<date_or_time_expr>`)
```
## パラメータ
| Parameter | デスクリプション |
|-----------|-------------|
| `<datetime_or_date>` | 入力のdatetime値で、date/datetimeタイプをサポートします。datetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## Return Value

INT型の週番号を返します。範囲は1-53で、その日付が年の何週目に属するかを表します。

- 1月1日を含む週が当年において4日未満の場合（例：1月1日が水曜日の場合、その週は当年において1月1-3日のみで、合計3日間）、その週は前年に属し、当年の第1週は次の日曜日から開始されます。
- 12月末の週の合計日数が4日未満の場合、その週は翌年の第1週に属します
- NULLを入力するとNULLを返します

## Examples

```sql
-- 2023-05-01 is Monday, belongs to week 18 of 2023
SELECT WEEKOFYEAR('2023-05-01') AS week_20230501; 
+---------------+
| week_20230501 |
+---------------+
|            18 |
+---------------+

-- The week from 2023-01-02 to 2023-01-08 contains 7 days in 2023 (≥4), belongs to week 1 of 2023
SELECT WEEKOFYEAR('2023-01-02') AS week_20230102;  
+---------------+
| week_20230102 |
+---------------+
|             1 |
+---------------+

-- 2024-01-01 (Monday) belongs to week 1 of 2024
SELECT WEEKOFYEAR('2024-01-01') AS week_20240101;
+---------------+
| week_20240101 |
+---------------+
|             1 |
+---------------+

-- NULL input (returns NULL)
SELECT WEEKOFYEAR(NULL) AS week_null_input; 
+-----------------+
| week_null_input |
+-----------------+
|            NULL |
+-----------------+
```
