---
{
    "title": "TIMEDIFF",
    "language": "ja",
    "description": "TIMEDIFF 関数は二つの日時値の差を計算し、TIME 型の値として返します。"
}
---

## 説明

TIMEDIFF 関数は二つの日時値の差を計算し、TIME 型の値として返します。この関数は DATETIME 型と DATE 型を処理できます。入力が DATE 型の場合、時刻部分はデフォルトで 00:00:00 になります。

この関数の動作は、MySQL の [TIMEDIFF 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timediff) と同じです。

## 構文

```sql
TIMEDIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## 引数

| 引数 | 説明 |
|------|------|
| `<date_or_time_expr1>` | 終了時刻または終了日時。DATE 型または DATETIME 型の入力をサポートします。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 開始時刻または開始日時。DATE 型または DATETIME 型の入力をサポートします。 |

## 戻り値

二つの入力値の時間差を表す `TIME` 型の値を返します。

- `<end_datetime>` が `<start_datetime>` より後の場合、正の時間差を返します。
- `<end_datetime>` が `<start_datetime>` より前の場合、負の時間差を返します。
- `<end_datetime>` と `<start_datetime>` が等しい場合、`00:00:00` を返します。
- `<end_datetime>` または `<start_datetime>` が `NULL` の場合、`NULL` を返します。
- 時間差が整数秒でない場合、返される時刻には小数部が含まれます。
- 計算結果が時間の範囲 [-838:59:59, 838:59:59] を超える場合、エラーを返します。

## 例

```sql
-- Difference between two DATETIMEs (spanning days)
SELECT TIMEDIFF('2024-07-20 16:59:30', '2024-07-11 16:35:21') AS result;
+-----------+
| result    |
+-----------+
| 216:24:09 |
+-----------+

-- Difference between datetime and date (date defaults to 00:00:00)
SELECT TIMEDIFF('2023-10-05 15:45:00', '2023-10-05') AS result;
+-----------+
| result    |
+-----------+
| 15:45:00  |
+-----------+

-- End time earlier than start time (returns negative value)
SELECT TIMEDIFF('2023-01-01 09:00:00', '2023-01-01 10:30:00') AS result;
+------------+
| result     |
+------------+
| -01:30:00  |
+------------+

-- Time difference within the same date
SELECT TIMEDIFF('2023-12-31 23:59:59', '2023-12-31 23:59:50') AS result;
+-----------+
| result    |
+-----------+
| 00:00:09  |
+-----------+

-- Difference across years
SELECT TIMEDIFF('2024-01-01 00:00:01', '2023-12-31 23:59:59') AS result;
+-----------+
| result    |
+-----------+
| 00:00:02  |
+-----------+

-- When returned time is not an integer number of seconds, returns time with scale
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2023-07-13 12:34:50.123') AS result;
+--------------+
| result       |
+--------------+
| 00:00:06.666 |
+--------------+

-- Calculation result exceeds time size range, returns error
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2024-07-13 12:34:50.123') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]The function timediff result of 2023-07-13 12:34:56.789000, 2024-07-13 12:34:50.123000 is out of range

-- Any parameter is NULL (returns NULL)
SELECT TIMEDIFF(NULL, '2023-01-01 00:00:00'), TIMEDIFF('2023-01-01 00:00:00', NULL) AS result;
+---------------------------------------+--------+
| timediff(NULL, '2023-01-01 00:00:00') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+
```
