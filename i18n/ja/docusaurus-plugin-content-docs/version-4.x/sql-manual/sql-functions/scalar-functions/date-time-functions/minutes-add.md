---
{
    "title": "MINUTES_ADD",
    "language": "ja",
    "description": "MINUTESADD 関数は、入力した日付時刻の値に指定した分数を加算し、計算後の日付時刻の値を返します。"
}
---

## 説明

MINUTES_ADD 関数は、入力した日付時刻の値に指定した分数を加算し、計算後の日付時刻の値を返します。この関数は DATE、DATETIME、TIMESTAMPTZ 型を処理できます。

この関数は、単位に MINUTE を使用した場合、[date_add 関数](./date-add)および MySQL の [date_add 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add)と同じ動作をします。

## 構文

```sql
MINUTES_ADD(`<date_or_time_expr>`, `<minutes>`)
```

## 引数

| 引数 | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日付時刻の値。DATE、DATETIME、TIMESTAMPTZ 型を指定できます。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<minutes>` | 加算する分数。BIGINT 型です。 |

## 戻り値

指定した分数 `<minutes>` を基準時刻 `<datetime_like_type>` に加算した結果を返します。戻り値の型は第一引数の型によって異なります。
- 第一引数が TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型を返します。
- 第一引数が DATETIME 型の場合、DATETIME 型を返します。

特殊なケース:
- `<minutes>` が負の場合、基準時刻から対応する分数を減算する場合と同じ動作になります（つまり、MINUTES_ADD(date, -n) は MINUTES_SUB(date, n) と同等です）。
- 入力が DATE 型（年、月、日のみを含む）の場合、時刻部分のデフォルトは 00:00:00.
- 入力した日付時刻にマイクロ秒が含まれる場合、分を加算した後も元のマイクロ秒精度が維持されます（たとえば、'2023-01-01 00:00:00.123456' は '2023-01-01 00:01:00.123456' になります。1 分を加算した場合の結果です）。
- 計算結果が DATETIME 型の有効範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59.999999）を超える場合、例外が発生します。
- いずれかの引数が NULL の場合、NULL を返します。

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
