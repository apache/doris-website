---
{
    "title": "SEC_TO_TIME",
    "language": "ja",
    "description": "SEC_TO_TIME 関数は、秒単位の数値を TIME 型に変換します。戻り値の形式は HH:MM:SS または HH:MM:SS.ssssss です。"
}
---

## 説明

SEC_TO_TIME 関数は、秒単位の数値を TIME 型に変換します。戻り値の形式は HH:MM:SS または HH:MM:SS.ssssss です。入力した秒数は、一日の開始時刻（00:00:00.000000）を起点とする時刻を表します。正と負の秒数、および一日を超える時間範囲をサポートします。

この関数は、MySQL の [sec_to_time 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_sec-to-time)と同じ動作をします。

## 構文

```sql
SEC_TO_TIME(<seconds>)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ---- |
| `<seconds>` | 必須。一日の開始時刻（00:00:00）からの秒数を表します。正または負の整数型をサポートします。 |

## 戻り値

秒数から変換した TIME 型の値を返します。
- 入力した秒数が TIME 型の有効範囲（-838:59:59 ～ 838:59:59、秒数では -3020399 ～ 3020399）を超える場合は、TIME 型の最大値または最小値を返します。
- 入力が NULL の場合は NULL を返します。
- 入力が整数の場合、戻り値の形式は HH:MM:SS です。入力が浮動小数点数の場合は HH:MM:SS.ssssss です。

## 例

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

--- If the input seconds exceed the valid range of TIME type (-838:59:59 to 838:59:59, corresponding to seconds range -3020399 to 3020399), returns TIME max or min value
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
