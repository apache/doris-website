---
{
    "title": "FROM_MICROSECOND",
    "language": "ja",
    "description": "FROMMICROSECOND 関数は、Unix タイムスタンプ（マイクロ秒単位）を DATETIME 型の日時値に変換します。"
}
---

## 説明

FROM_MICROSECOND 関数は、Unix タイムスタンプ（マイクロ秒単位）を `DATETIME` 型の日時値に変換します。Unix タイムスタンプの基準時刻は 1970-01-01 00:00:00 UTC です。この関数は、入力されたマイクロ秒数を、その基準時刻から経過した日時に変換します。秒の小数部分も含め、マイクロ秒単位の精度で表します。

## 構文

```sql
FROM_MICROSECOND(<unix_timestamp>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<unix_timestamp>` | 入力する Unix タイムスタンプ。整数型（BIGINT）で、1970-01-01 00:00:00 UTC からの経過時間をマイクロ秒単位で表します。 |

## 戻り値

UTC の Unix タイムスタンプを現在のタイムゾーンの時刻に変換した結果を、DATETIME 型の値として返します。
- <unix_timestamp> が NULL の場合、NULL を返します。
- 入力した <unix_timestamp> を整数秒に換算できる場合、小数秒の桁数を持たない日時を返します。それ以外の場合は、小数秒の桁数を持つ日時を返します。
- <unix_timestamp> が 0 未満の場合、エラーを返します。
- 返される日時が最大時刻 9999-12-31 23:59:59 を超える場合、エラーを返します。

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
