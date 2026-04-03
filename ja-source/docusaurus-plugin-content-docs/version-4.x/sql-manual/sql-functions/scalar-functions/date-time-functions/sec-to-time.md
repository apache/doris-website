---
{
  "title": "SEC_TO_TIME",
  "description": "SECTOTIME関数は、秒単位の数値をTIME型に変換します。戻り値の形式はHH:MM:SSまたはHH:MM:SS.ssssssです。",
  "language": "ja"
}
---
## 説明

SEC_TO_TIME関数は、秒単位の数値をTIME型に変換します。戻り値の形式はHH:MM:SSまたはHH:MM:SS.ssssssです。入力される秒数は、1日の開始点（00:00:00.000000）から計算された時間を表し、正負の秒数および1日を超える時間範囲をサポートしています。

この関数はMySQLの[sec_to_time function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_sec-to-time)と一致しています。

## 構文

```sql
SEC_TO_TIME(<seconds>)
```
## パラメータ

| Parameter   | デスクリプション                                                                                                                                                   |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<seconds>` | 必須。入力する秒数で、1日の開始時刻（00:00:00）からの経過秒数を表します。正または負の整数型をサポートします。 |

## Return Value

秒数から変換されたTIME型の値を返します。
- 入力秒数がTIME型の有効範囲（-838:59:59から838:59:59、対応する秒数範囲は-3023999から3023999）を超える場合、TIMEの最大値または最小値を返します
- 入力がNULLの場合、NULLを返します
- 入力が整数の場合、戻り値の形式はHH:MM:SSです。入力が浮動小数点数の場合、戻り値の形式はHH:MM:SS.ssssssです。

## Examples

```sql
-- Positive seconds (time within the day)
SELECT SEC_TO_TIME(59738) AS result;
+----------+
| result   |
+----------+
| 16:35:38 |
+----------+

-- Seconds exceeding one day (automatically converted to multiple hours)
SELECT SEC_TO_TIME(90061) AS result;
+----------+
| result   |
+----------+
| 25:01:01 |
+----------+

-- Negative seconds (time from previous day)
SELECT SEC_TO_TIME(-3600) AS result;
+----------+
| result   |
+----------+
| -01:00:00 |
+----------+

-- Zero seconds (start time)
SELECT SEC_TO_TIME(0) AS result;
+----------+
| result   |
+----------+
| 00:00:00 |
+----------+

-- Decimal seconds
SELECT SEC_TO_TIME(3661.9) AS result;
+-----------------+
| result          |
+-----------------+
| 01:01:01.900000 |
+-----------------+

-- Input is NULL (returns NULL)
SELECT SEC_TO_TIME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- If the input seconds exceed the valid range of TIME type (-838:59:59 to 838:59:59, corresponding to seconds range -3023999 to 3023999), returns TIME max or min value
 SELECT SEC_TO_TIME(30245000) AS result;
+-----------+
| result    |
+-----------+
| 838:59:59 |
+-----------+

SELECT SEC_TO_TIME(-30245000) AS result;
+------------+
| result     |
+------------+
| -838:59:59 |
+------------+
```
