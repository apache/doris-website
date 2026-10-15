---
{
    "title": "MINUTES_DIFF",
    "language": "ja",
    "description": "MINUTESDIFF 関数は、二つの日時の差を分単位で計算します。"
}
---

## 説明

MINUTES_DIFF 関数は、二つの日時の差を分単位で計算します。終了時刻から開始時刻を引いた分数を返します。この関数は DATE 型と DATETIME 型（マイクロ秒精度を含む）に対応しています。

## 構文

```sql
MINUTES_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr1>` | 終了時刻。DATE 型または DATETIME 型を指定できます。日時と日付の形式については、[DATETIME 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[DATE 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 開始時刻。DATE 型または DATETIME 型を指定できます。日時と日付の形式については、[DATETIME 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[DATE 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

`<date_or_time_expr1>` と `<date_or_time_expr2>` の差を分単位で表す整数（INT）を返します（1 時間 = 60 分）。

- `<date_or_time_expr1>` が `<date_or_time_expr2>` より後の場合は、正の値を返します。
- `<date_or_time_expr1>` が `<date_or_time_expr2>` より前の場合は、負の値を返します。
- 実際の時間差を計算し、秒やマイクロ秒を無視しません。
- DATE 型の値（年・月・日だけを含む）の時刻部分は、00:00:00 とみなします。
- 入力した日時の小数秒、秒、またはマイクロ秒の部分がゼロでない場合、計算時に無視しません。
- いずれかの引数が NULL の場合は、NULL を返します。

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
