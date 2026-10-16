---
{
    "title": "WEEKOFYEAR",
    "language": "ja",
    "description": "WEEKOFYEAR 関数は、指定した日付がその年の何週目に当たるかを返します（範囲は 1～53）。週は月曜日に始まり、日曜日に終わります。"
}
---

## 説明
WEEKOFYEAR 関数は、指定した日付がその年の何週目に当たるかを返します（範囲は 1～53）。
週は月曜日に始まり、日曜日に終わります。
ある週に含まれる当年の日数が 4 日以上であれば、その週は当年の第 1 週とみなされます。それ以外の場合、その週は前年の最終週（第 52 週または第 53 週）に属します。

この関数は、MySQL の [weekofyear 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekofyear)と同じ動作をします。

## 構文

```sql
INT WEEKOFYEAR(`<date_or_time_expr>`)
```

## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力する日時の値。DATE 型と DATETIME 型をサポートします。日時と日付の形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

日付がその年の何週目に属するかを表す INT 型の週番号（範囲は 1～53）を返します。

- 1 月 1 日を含む週に、当年の日付が 4 日未満しかない場合（たとえば、元日が水曜日で、その週に含まれる当年の日付が 1 日から 3 日までの計 3 日しかない場合）、その週は前年に属し、当年の第 1 週は次の月曜日から始まります。
- 年末の週に含まれる当年の日数が合計 4 日未満の場合、その週は翌年の最初の週に属します。
- 入力が NULL の場合、NULL を返します。

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

-- The week 2021-12-27 (Monday) through 2022-01-02 (Sunday) only has 2 days
-- in 2022 (<4), so it belongs to the last week of 2021 (week 52)
SELECT WEEKOFYEAR('2022-01-02') AS week_20220102;
+---------------+
| week_20220102 |
+---------------+
|            52 |
+---------------+

-- 2023-12-25 (Monday) through 2023-12-31 (Sunday) has 7 days in 2023 (≥4),
-- so it belongs to week 52 of 2023
SELECT WEEKOFYEAR('2023-12-25') AS week_20231225;
+---------------+
| week_20231225 |
+---------------+
|            52 |
+---------------+

-- Pre-modern dates work too — the function does not validate a minimum year
SELECT weekofyear('1023-01-04');
+--------------------------+
| weekofyear('1023-01-04') |
+--------------------------+
|                        1 |
+--------------------------+

-- NULL input (returns NULL)
SELECT WEEKOFYEAR(NULL) AS week_null_input; 
+-----------------+
| week_null_input |
+-----------------+
|            NULL |
+-----------------+
```
