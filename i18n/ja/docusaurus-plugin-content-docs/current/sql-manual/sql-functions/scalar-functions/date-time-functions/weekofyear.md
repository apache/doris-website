---
{
    "title": "WEEKOFYEAR",
    "language": "ja",
    "description": "WEEKOFYEAR 関数は、指定した日付がその年の第何週に属するかを返します（範囲は 1～53）。週は月曜日に始まり、日曜日に終わります。"
}
---

## 説明
WEEKOFYEAR 関数は、指定した日付がその年の第何週に属するかを返します（範囲は 1～53）。
週は月曜日に始まり、日曜日に終わります。
ある週にその年の日が 4 日以上含まれる場合、その週はその年の第 1 週と見なされます。それ以外の場合、その週は前年の最終週（第 52 週または第 53 週）に属します。

この関数の動作は、MySQL の [weekofyear 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekofyear)と一致します。

## 構文

```sql
INT WEEKOFYEAR(`<date_or_time_expr>`)
```

## パラメータ
| パラメータ | 説明 |
|-----------|------|
| `<date_or_time_expr>` | 入力する日時の値。DATE、DATETIME、TIMESTAMP_NS 型をサポートします。日時と日付の形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

その日付が年内の第何週に属するかを示す、1～53 の INT 型の週番号を返します。

- 一月1日を含む週にその年の日が 4 日未満しかない場合（たとえば、一月1日が水曜日なら、その週に含まれるその年の日は一月1～3日の計 3 日だけです）、その週は前年に属し、その年の第 1 週は次の月曜日から始まります。
- 十二月末の週の日数が合計 4 日未満の場合、その週は翌年の最初の週に属します。
- 入力が NULL の場合は NULL を返します。

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
