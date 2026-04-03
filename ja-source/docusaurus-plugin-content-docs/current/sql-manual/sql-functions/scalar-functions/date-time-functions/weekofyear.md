---
{
  "title": "WEEKOFYEAR",
  "language": "ja",
  "description": "WEEKOFYEAR関数は、年内の指定された日付の週番号（1-53の範囲）を返します。週は月曜日に始まり日曜日に終わります。"
}
---
## 概要
WEEKOFYEAR関数は、年内の指定された日付の週番号（範囲1-53）を返します。
週は月曜日に始まり日曜日に終わります。
年内において、週に現在の年の4日以上が含まれている場合、その週は現在の年の第1週とみなされます。そうでない場合、その週は前年の最終週に属します（週52または53の場合があります）。

この関数は、MySQLの[weekofyear function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekofyear)と一貫性があります。

## 構文

```sql
INT WEEKOFYEAR(`<date_or_time_expr>`)
```
## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<datetime_or_date>` | 入力datetime値、date/datetimeタイプをサポートします。datetimeとdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## 戻り値

INT型の週番号を返します。範囲は1-53で、その日付が年の何週目に属するかを表します。

- 1月1日を含む週が当年に4日未満しかない場合（例：1月1日が水曜日の場合、その週は当年に1月1-3日のみで、合計3日）、その週は前年に属し、当年の第1週は次の日曜日から始まります。
- 12月末の週が合計4日未満の場合、その週は翌年の第1週に属します
- NULLを入力するとNULLを返します

## 例

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
