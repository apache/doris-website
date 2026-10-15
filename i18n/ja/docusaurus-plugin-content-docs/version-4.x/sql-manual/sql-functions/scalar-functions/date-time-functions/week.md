---
{
    "title": "WEEK",
    "language": "ja",
    "description": "WEEK 関数は、指定した日付の週番号を返します。デフォルトのモードは 0 です。"
}
---

## 説明

WEEK 関数は、指定した日付の週番号を返します。デフォルトのモードは 0 です。mode パラメータを使うと、週の開始曜日、週番号の範囲、年の最初の週を決める条件などを指定できます。

mode パラメータの動作を次の表に示します。

|モード |週の開始曜日 |週番号の範囲 |年の最初の週の定義                     |
|:----|:-----------------|:-----------------|:------------------------------------------------|
|0    |日曜日            |0-53             |その年の最初の日曜日を含む週 |
|1    |月曜日            |0-53             |その年に属する日が 4 日以上ある最初の週  |
|2    |日曜日            |1-53             |その年の最初の日曜日を含む週 |
|3    |月曜日            |1-53             |その年に属する日が 4 日以上ある最初の週  |
|4    |日曜日            |0-53             |その年に属する日が 4 日以上ある最初の週  |
|5    |月曜日            |0-53             |その年の最初の月曜日を含む週 |
|6    |日曜日            |1-53             |その年に属する日が 4 日以上ある最初の週  |
|7    |月曜日            |1-53             |その年の最初の月曜日を含む週 |


この関数の動作は、MySQL の [WEEK 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_week) と同じです。

## 構文
```sql
WEEK(`<date_or_time_expr>`)
WEEK(`<date_or_time_expr>`, `<mode>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力する日時値。DATE 型または DATETIME 型を指定できます。日時と日付の形式については、[日時変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[日付変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。|
| `<mode>` | 省略可能な INT 型の値。デフォルトは 0 です。`mode & 7` の結果により、上の表のモード 0-7 から計算規則が選ばれます。 |

## 戻り値
指定した日付の週番号を INT 型で返します。値の範囲は `<mode>` によって決まり、0-53 または 1-53 です。

- `<mode>` に 0-7 の範囲外の整数を指定した場合、下位三ビット（`mode & 7`）で計算モードが決まります。たとえば、8 はモード 0、9 はモード 1、-1 はモード 7 を選択します。
- いずれかのパラメータが NULL の場合は、NULL を返します。
- 年をまたぐ日付では、前年の最後の週番号を返すことがあります。たとえば、1 日（2023 年の元日）は、モードによっては第 52 週（2022 年）に属します。

## 例

範囲外のモードでは下位三ビットが使われます。たとえば、8 はモード 0 を選択します。

```sql
SELECT WEEK('2021-01-01', 8) AS mode_8,
       WEEK('2021-01-01', 0) AS mode_0,
       WEEK('2021-01-01', 7) AS mode_7;
```
```text
+--------+--------+--------+
| mode_8 | mode_0 | mode_7 |
+--------+--------+--------+
|      0 |      0 |     52 |
+--------+--------+--------+
```

```sql
-- 2020-01-01 is Wednesday, the first Sunday of the year is 2020-01-05, so it belongs to week 0
SELECT WEEK('2020-01-01') AS week_result;
+-------------+
| week_result |
+-------------+
|           0 |
+-------------+

-- 2020-07-01 is Wednesday, its week contains ≥4 days belonging to 2020, so it's week 27
SELECT WEEK('2020-07-01', 1) AS week_result;
+-------------+
| week_result |
+-------------+
|          27 |
+-------------+

-- Compare mode=0 and mode=3 (differences between different rules)
SELECT 
  WEEK('2023-01-01', 0) AS mode_0, 
  WEEK('2023-01-01', 3) AS mode_3;  
+--------+--------+
| mode_0 | mode_3 |
+--------+--------+
|      1 |     52 |
+--------+--------+

-- -1 & 7 = 7, so mode 7 is used
SELECT WEEK('2023-01-01', -1) AS week_result;
+-------------+
| week_result |
+-------------+
|          52 |
+-------------+

-- Input is DATETIME type (ignores time portion)
SELECT WEEK('2023-12-31 23:59:59', 3) AS week_result;
+-------------+
| week_result |
+-------------+
|          52 |  
+-------------+

-- Any parameter is NULL, result returns NULL
SELECT WEEK('2023-12-31 23:59:59', NULL), WEEK(NULL, 3);
+-----------------------------------+--------------+
| WEEK('2023-12-31 23:59:59', NULL) | WEEK(NULL,3) |
+-----------------------------------+--------------+
|                              NULL |         NULL |
+-----------------------------------+--------------+

-- Mode 7: weeks start on Monday and week 1 is the week containing the first Monday;
-- the first Monday of 2023 is Jan 2, so 2023-01-01 falls in the last week of 2022 (week 52)
SELECT WEEK('2023-01-01', 7) AS week_result;
+-------------+
| week_result |
+-------------+
|          52 |
+-------------+
```
