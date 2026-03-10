---
{
  "title": "FROM_MILLISECOND",
  "language": "ja",
  "description": "FROMMILLISECOND関数は、Unixタイムスタンプ（ミリ秒単位）をDATETIME型の日時値に変換するために使用されます。"
}
---
## 説明

FROM_MILLISECOND関数は、Unixタイムスタンプ（ミリ秒単位）をDATETIME型の日時値に変換するために使用されます。Unixタイムスタンプの基準時刻は1970-01-01 00:00:00 UTCであり、この関数は入力されたミリ秒を、その基準時刻以降の対応する具体的な日付と時刻に変換します（ミリ秒まで正確）。

## 構文

```sql
FROM_MILLISECOND(<millisecond>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<millisecond>` | 入力するUnixタイムスタンプ、整数型（BIGINT）、1970-01-01 00:00:00 UTCからのミリ秒数を表す。 |

## 戻り値

入力されたUTCタイムゾーンのunixタイムスタンプを現在のタイムゾーン時刻に変換した結果を表すDATETIME型の値を返す
- millisecondがNULLの場合、関数はNULLを返す。
- millisecondが有効範囲を超える場合（結果のdatetimeが9999-12-31 23:59:59を超える）、関数はエラーを返す。
- 入力されたmillisecondが整数秒に変換できる場合、結果はスケールなしのdatetimeを返す。変換できない場合、結果はスケール付きのdatetimeを返す
- 負の数を入力した場合、結果はエラーを返す

## 例

```sql

----Since the current machine is in East 8th timezone, the returned time is 8 hours ahead of UTC
SELECT FROM_MILLISECOND(0);
+-------------------------+
| FROM_MILLISECOND(0)     |
+-------------------------+
| 1970-01-01 08:00:00.000 |
+-------------------------+

-- Convert 1700000000000 milliseconds to datetime
SELECT FROM_MILLISECOND(1700000000000);

+---------------------------------+
| from_millisecond(1700000000000) |
+---------------------------------+
| 2023-11-15 06:13:20             |
+---------------------------------+

-- Timestamp contains non-zero milliseconds (1700000000 seconds + 123 milliseconds)
select from_millisecond(1700000000123) as dt_with_milli;

+----------------------------+
| dt_with_milli              |
+----------------------------+
| 2023-11-15 06:13:20.123000 |
+----------------------------+

---Input is NULL, result returns NULL
select from_millisecond(NULL);
+------------------------+
| from_millisecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

---Input is negative, result returns error
 select from_millisecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_millisecond of -1 out of range


--Result exceeds maximum date, returns error
select from_millisecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_millisecond of 999999999999999999 out of range
```
