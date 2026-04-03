---
{
  "title": "SECONDS_DIFF",
  "description": "SECONDSDIFF関数は2つのdatetime値の差を計算し、結果を秒単位で返します。",
  "language": "ja"
}
---
## 説明

SECONDS_DIFF関数は、2つのdatetime値の差分を計算し、結果を秒単位で返します。この関数はDATEおよびDATETIME型の処理をサポートしています。入力がDATE型の場合、その時刻部分はデフォルトで00:00:00になります。

## 構文

```sql
SECONDS_DIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<date_or_time_expr1>` | 必須。終了日時の値。DATE型またはDATETIME型を指定可能。具体的な日時/日付フォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照 |
| `<date_or_time_expr2>` | 必須。開始日時の値。DATE型またはDATETIME型を指定可能。 |

## Return Value

BIGINT型の値を返し、2つの日時値の秒単位での差を表します：

- `<date_or_time_expr1>`が`<date_or_time_expr2>`より後の場合、正の数を返します
- `<date_or_time_expr1>`が`<date_or_time_expr2>`より前の場合、負の数を返します
- 2つの時刻が等しい場合、0を返します
- いずれかのパラメータがNULLの場合、NULLを返します
- スケールを持つ時刻の場合、小数部の差も計算に含まれます

## Examples

```sql
--- Seconds difference within the same hour
SELECT SECONDS_DIFF('2025-01-23 12:35:56', '2025-01-23 12:34:56') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

--- End time is earlier than start time (returns negative number)
SELECT SECONDS_DIFF('2023-01-01 00:00:00', '2023-01-01 00:01:00') AS result;
+--------+
| result |
+--------+
|    -60 |
+--------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_DIFF('2023-01-02', '2023-01-01') AS result;  -- 1 day difference (86400 seconds)
+--------+
| result |
+--------+
|  86400 |
+--------+

--- Times with scale include fractional part difference in calculation
mysql> SELECT SECONDS_DIFF('2023-07-13 12:00:00', '2023-07-13 11:59:59.6') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Any parameter is NULL (returns NULL)
SELECT SECONDS_DIFF(NULL, '2023-07-13 10:30:25'), SECONDS_DIFF('2023-07-13 10:30:25', NULL) AS result;
+-------------------------------------------+--------+
| seconds_diff(NULL, '2023-07-13 10:30:25') | result |
+-------------------------------------------+--------+
| NULL                                      | NULL   |
+-------------------------------------------+--------+
```
