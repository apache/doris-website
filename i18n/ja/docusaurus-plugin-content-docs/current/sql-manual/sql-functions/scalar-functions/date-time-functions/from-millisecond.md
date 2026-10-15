---
{
    "title": "FROM_MILLISECOND",
    "language": "ja",
    "description": "FROMMILLISECOND 関数は、Unix タイムスタンプ（ミリ秒単位）を DATETIME 型の日時値に変換します。"
}
---

## 説明

FROM_MILLISECOND 関数は、Unix タイムスタンプ（ミリ秒単位）を DATETIME 型の日時値に変換します。Unix タイムスタンプの基準時刻は 1970-01-01 00:00:00 UTC です。この関数は、入力されたミリ秒数を基準時刻からの経過時間として対応する日時に変換します（ミリ秒精度）。

## 構文

```sql
FROM_MILLISECOND(<millisecond>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<millisecond>` | 入力する Unix タイムスタンプ。整数型（BIGINT）で指定し、1970-01-01 00:00:00 UTC からの経過ミリ秒数を表します。 |

## 戻り値

入力された UTC の Unix タイムスタンプを現在のタイムゾーンの時刻に変換した結果を、DATETIME 型の値で返します。
- millisecond が NULL の場合、NULL を返します。
- millisecond が有効範囲を超える場合（変換後の日時が 9999-12-31 23:59:59 を超える場合）、エラーを返します。
- 入力されたミリ秒数を整数秒に変換できる場合、小数秒の桁を含まない日時を返します。それ以外の場合は、小数秒の桁を含む日時を返します。
- 負の値を入力した場合、エラーを返します。

## 使用例

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
