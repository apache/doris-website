---
{
  "title": "MINUTES_DIFF",
  "language": "ja",
  "description": "MINUTESDIFF関数は、2つのdatetime値間の分単位での差を計算します。"
}
---
## 説明

MINUTES_DIFF関数は、2つのdatetime値の間の分単位の差を計算します。結果は、終了時刻から開始時刻を減算して得られる分数です。この関数は、DATEおよびDATETIME（マイクロ秒精度を含む）タイプの処理をサポートしています。

## 構文

```sql
MINUTES_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```
## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr1>` | 終了時間。DATE型またはDATETIME型を指定できます。具体的なdatetime/date形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<date_or_time_expr2>` | 開始時間。DATE型またはDATETIME型を指定できます。具体的なdatetime/date形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## 戻り値

`<date_or_time_expr1>`と`<date_or_time_expr2>`の分単位の差を表すINT型の整数を返します（1時間 = 60分）。

- `<date_or_time_expr1>`が`<date_or_time_expr2>`より後の場合、正の数を返します。
- `<date_or_time_expr1>`が`<date_or_time_expr2>`より前の場合、負の数を返します。
- 計算では実際の差が考慮され、秒やマイクロ秒は無視されません。
- 入力がDATE型（年、月、日のみを含む）の場合、時刻部分はデフォルトで00:00:00となります。
- 入力datetimeにscale、秒、またはマイクロ秒部分が含まれ、それらが0以外の場合、計算時に無視されません。
- いずれかのパラメータがNULLの場合、NULLを返します。

## 例

```sql
-- Minute difference when end time is greater than start time
SELECT MINUTES_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

-- Includes scale, calculation does not ignore it
SELECT MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923');
+--------------------------------------------------------------------+
| MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923') |
+--------------------------------------------------------------------+
|                                                                -59 |
+--------------------------------------------------------------------+

-- End time is earlier than start time, returns negative number
SELECT MINUTES_DIFF('2023-07-13 21:50:00', '2023-07-13 22:00:00') AS result;
+--------+
| result |
+--------+
|    -10 |
+--------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTES_DIFF('2023-07-14', '2023-07-13') AS result;
+--------+
| result |
+--------+
|   1440 |
+--------+

-- Two times have different seconds, seconds are also calculated
SELECT MINUTES_DIFF('2023-07-13 22:30:59', '2023-07-13 22:31:01') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_DIFF(NULL, '2023-07-13 22:00:00'), MINUTES_DIFF('2023-07-13 22:00:00', NULL) AS result;
+-------------------------------------------+--------+
| MINUTES_DIFF(NULL, '2023-07-13 22:00:00') | result |
+-------------------------------------------+--------+
|                                      NULL |   NULL |
+-------------------------------------------+--------+
```
