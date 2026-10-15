---
{
    "title": "FROM_SECOND",
    "language": "ja",
    "description": "FROM_SECOND 関数は Unix タイムスタンプ（秒単位）を DATETIME 型の日時値に変換します。"
}
---

## 説明

FROM_SECOND 関数は Unix タイムスタンプ（秒単位）を DATETIME 型の日時値に変換します。Unix タイムスタンプの基準時刻は 1970-01-01 00:00:00 UTC です。この関数は入力された秒数を、基準時刻からの経過時間に対応する日時に変換します（秒単位の精度）。

## 構文

```sql
FROM_SECOND(<unix_timestamp>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<unix_timestamp>` | 入力する Unix タイムスタンプ。整数型（BIGINT）で、1970-01-01 00:00:00 UTC からの秒数を表します。 |

## 戻り値

- 入力された UTC の Unix タイムスタンプを現在のタイムゾーンの日時に変換した、DATETIME 型の値を返します。
- <unix_timestamp> が NULL の場合、NULL を返します。
- <unix_timestamp> が有効な範囲を超える場合（変換結果の日時が 9999-12-31 23:59:59 を超える場合）、エラーを返します。
- 負の秒数を入力した場合、エラーを返します。

## 例

```sql

----Since the current machine is in East 8th timezone, the returned time is 8 hours ahead of UTC
 SELECT FROM_SECOND(0);
+---------------------+
| FROM_SECOND(0)      |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---Convert 1700000000 seconds to datetime
SELECT FROM_SECOND(1700000000);

+-------------------------+
| from_second(1700000000) |
+-------------------------+
| 2023-11-15 06:13:20     |
+-------------------------+

---Result exceeds maximum date range, returns error
select from_second(999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INTERNAL_ERROR]The function from_second Argument value is out of DateTime range

---Input parameter is NULL, returns NULL
select from_second(NULL);
+-------------------+
| from_second(NULL) |
+-------------------+
| NULL              |
+-------------------+

--Input parameter is negative, result returns error
 select from_second(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_second of -1 out of range
```
