---
{
  "title": "週",
  "language": "ja",
  "description": "WEEK関数は、指定された日付の週番号を返します。デフォルトのモードは0です。"
}
---
## 説明

WEEK関数は、指定された日付の週番号をデフォルトのMode 0で返します。modeパラメータを通じて週計算ルールのカスタマイズをサポートします（週の最初の日が日曜日か月曜日か、週番号の範囲、最初の週を決定する基準など）。

modeパラメータの効果は以下の表に示されています：

```sql
|Mode |First day of week |Week number range |Definition of the first week                     |
|:----|:-----------------|:-----------------|:------------------------------------------------|
|0    |Sunday            |0-53             |The week containing the first Sunday of the year |
|1    |Monday            |0-53             |The first week with 4 or more days in this year  |
|2    |Sunday            |1-53             |The week containing the first Sunday of the year |
|3    |Monday            |1-53             |The first week with 4 or more days in this year  |
|4    |Sunday            |0-53             |The first week with 4 or more days in this year  |
|5    |Monday            |0-53             |The week containing the first Monday of the year |
|6    |Sunday            |1-53             |The first week with 4 or more days in this year  |
|7    |Monday            |1-53             |The week containing the first Monday of the year |
```
この関数は MySQL の [week function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_week) と一致しています。

## 構文

```sql
WEEK(`<date_or_time_expr>`)
WEEK(`<date_or_time_expr>`, `<mode>`)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<datetime_or_date>` | 入力datetime値、date/datetimeタイプをサポートします。datetimeとdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `mode` | 年の最初の週の計算方法を指定、タイプINT、範囲0-7 |

## 戻り値
INTタイプを返し、指定された日付の週番号を表します。具体的な範囲は`<mode>`によって決定されます（0-53または1-53）。

- `<mode>`が0-7以外の整数の場合、Mode 7を使用して計算が実行されます；
- いずれかのパラメータがNULLの場合、NULLを返します；
- 年をまたぐ日付は前年の最後の週を返す場合があります（例：2023年1月1日は一部のmodeにおいて2022年の52週に属します）。

## Examples

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

-- Input outside 0-7 range, processed as mode 7
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
```
