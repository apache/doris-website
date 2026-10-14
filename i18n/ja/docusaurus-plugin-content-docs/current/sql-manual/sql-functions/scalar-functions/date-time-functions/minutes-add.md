---
{
    "title": "MINUTES_ADD",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型の値に指定した分数を加算し、時間型を保持します。"
}
---

## 説明

MINUTES_ADD 関数は、入力した日時に指定した分数を加算し、計算後の新しい日時を返します。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型の値を処理できます。

分を単位として使用する場合、この関数の動作は [date_add 関数](./date-add) および MySQL の [date_add 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) と同じです。

## 構文

```sql
MINUTES_ADD(`<date_or_time_expr>`, `<minutes>`)
```

## パラメーター

| パラメーター | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日時の値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型を指定できます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<minutes>` | 加算する分数。型は BIGINT です。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒の精度が固定で九桁の `TIMESTAMP_NS` 型を返します。計算結果は戻り値の型の有効範囲内かどうか検証されます。`TIMESTAMP_NS` の有効範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

指定した分数 `<minutes>` を基準となる日時 `<datetime_like_type>` に加算した結果を返します。戻り値の型は最初のパラメーターの型に応じて決まります。
- 最初のパラメーターが TIMESTAMPTZ 型の場合は、TIMESTAMPTZ 型を返します。
- 最初のパラメーターが DATETIME 型の場合は、DATETIME 型を返します。

特殊なケース：
- `<minutes>` が負の場合、基準となる日時から対応する分数を減算した場合と同じ動作になります（つまり、MINUTES_ADD(date, -n) は MINUTES_SUB(date, n) と同じです）。
- 入力が DATE 型（年、月、日のみを含む）の場合、時刻部分はデフォルトで 00:00:00 になります。
- 入力日時にマイクロ秒が含まれる場合、分数を加算した後も元のマイクロ秒精度が保持されます（たとえば、'2023-01-01 00:00:00.123456' は '2023-01-01 00:01:00.123456' になります。これは 1 分を加算した結果です）。
- 計算結果が DATETIME 型の有効範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59.999999）を超える場合、例外が発生します。
- いずれかのパラメーターが NULL の場合は NULL を返します。

## 例

```sql
-- Add minutes to DATE type (default time 00:00:00)
SELECT MINUTES_ADD('2020-02-02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 00:01:00 |
+---------------------+

-- Add minutes to DATETIME
SELECT MINUTES_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:33:18 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_ADD('2023-07-13 22:28:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:38:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to subtraction)
SELECT MINUTES_ADD('2023-07-13 22:28:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:23:18 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MINUTES_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| MINUTES_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:23:33.123+08:00                   |
+-------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_ADD(NULL, 10), MINUTES_ADD('2023-07-13 22:28:18', NULL) AS result;
+-------------------------+--------+
| minutes_add(NULL, 10)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_add of 9999-12-31 23:59:59, 2 out of range
```
