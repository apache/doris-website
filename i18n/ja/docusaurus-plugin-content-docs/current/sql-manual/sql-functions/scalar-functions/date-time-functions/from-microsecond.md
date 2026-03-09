---
{
  "title": "FROM_MICROSECOND",
  "language": "ja",
  "description": "FROMMICROSECOND関数は、Unixタイムスタンプ（マイクロ秒単位）をDATETIME型の日時値に変換するために使用されます。"
}
---
## 説明

FROM_MICROSECOND関数は、Unixタイムスタンプ（マイクロ秒単位）を`DATETIME`型の日時値に変換するために使用されます。Unixタイムスタンプの基準時刻は1970-01-01 00:00:00 UTCであり、この関数は入力されたマイクロ秒を、その基準時刻以降の対応する特定の日付と時刻に変換します（秒の小数部分を含み、マイクロ秒まで正確です）。

## 構文

```sql
FROM_MICROSECOND(<unix_timestamp>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<unix_timestamp>` | 入力Unix タイムスタンプ、整数型（BIGINT）、1970-01-01 00:00:00 UTC からのマイクロ秒数を表す |

## 戻り値

UTCタイムゾーンのunixタイムスタンプを現在のタイムゾーン時刻に変換した結果を表すDATETIME型の値を返します
- <unix_timestamp>がNULLの場合、関数はNULLを返します。
- 入力<unix_timestamp>が整数秒に変換できる場合、結果はスケールなしのdatetimeを返します；変換できない場合、結果はスケールありのdatetimeを返します
- <unix_timestamp>が0未満の場合、エラーを返します
- 返されるdatetimeが最大時刻 9999-12-31 23:59:59 を超える場合、エラーを返します

## 例

```sql

-- Current machine is in East 8th timezone, so the returned time is 8 hours ahead of UTC
SELECT FROM_MICROSECOND(0);
+----------------------------+
| FROM_MICROSECOND(0)        |
+----------------------------+
| 1970-01-01 08:00:00.000000 |
+----------------------------+

-- Convert 1700000000000000 microseconds added to reference time to datetime
SELECT FROM_MICROSECOND(1700000000000000);

+------------------------------------+
| from_microsecond(1700000000000000) |
+------------------------------------+
| 2023-11-15 06:13:20                |
+------------------------------------+

-- Timestamp contains non-integer seconds (1700000000 seconds + 123456 microseconds)
select from_microsecond(1700000000123456) as dt_with_micro;

+----------------------------+
| dt_with_micro              |
+----------------------------+
| 2023-11-15 06:13:20.123456 |
+----------------------------+

-- Input negative number, returns error
 select from_microsecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of -1 out of range


-- Input NULL, returns NULL
select from_microsecond(NULL);
+------------------------+
| from_microsecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

-- Exceeds maximum time range 9999-12-31 23:59:59, returns error
select from_microsecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of 999999999999999999 out of range
```
