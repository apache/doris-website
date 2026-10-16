---
{
    "title": "SECONDS_DIFF",
    "language": "ja",
    "description": "SECONDSDIFF 関数は二つの日時値の差を計算し、結果を秒単位で返します。"
}
---

## 説明

SECONDS_DIFF 関数は二つの日時値の差を計算し、結果を秒単位で返します。DATE 型と DATETIME 型を扱えます。入力が DATE 型の場合、時刻部分は 00:00:00 とみなされます。

## 構文

```sql
SECONDS_DIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr1>` | 必須。終了日時。DATE 型または DATETIME 型を指定できます。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 必須。開始日時。DATE 型または DATETIME 型を指定できます。 |

## 戻り値

日時値間の差を秒単位で表す BIGINT 型の値を返します。

- `<date_or_time_expr1>` が `<date_or_time_expr2>` より後の場合は、正の数を返します。
- `<date_or_time_expr1>` が `<date_or_time_expr2>` より前の場合は、負の数を返します。
- 両方の日時が等しい場合は、0 を返します。
- いずれかのパラメータが NULL の場合は、NULL を返します。
- 小数秒を含む日時では、小数部分の差も計算に含まれます。

## 使用例

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
