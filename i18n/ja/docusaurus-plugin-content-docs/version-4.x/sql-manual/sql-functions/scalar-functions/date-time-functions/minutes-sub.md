---
{
    "title": "MINUTES_SUB",
    "language": "ja",
    "description": "MINUTESSUB 関数は、入力した日時値から指定した分だけ差し引き、計算後の日時値を返します。"
}
---

## 説明

MINUTES_SUB 関数は、入力した日時値から指定した分だけ差し引き、計算後の日時値を返します。DATE、DATETIME、TIMESTAMPTZ 型の値を処理できます。

MINUTE を単位として使用した場合、この関数の動作は [date_sub 関数](./date-sub)および MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)と同じです。

## 構文

```sql
MINUTES_SUB(`<date_or_time_expr>`, `<minutes>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日時値。DATE、DATETIME、TIMESTAMPTZ 型を指定できます。具体的な日時や日付の形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<minutes>` | 差し引く時間の長さ（分単位）。BIGINT 型で、正または負の値を指定できます。 |

## 戻り値

指定した分数 `<minutes>` を基準日時 `<datetime_like_type>` から差し引いた結果を返します。戻り値の型は最初の引数の型に応じて変わります。
- 最初の引数が TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型を返します。
- 最初の引数が DATETIME 型の場合、DATETIME 型を返します。

特殊なケース:
- `<minutes>` が負の場合、基準日時に対応する分を加算した場合と同じ結果になります（つまり、MINUTES_SUB(date, -n) は MINUTES_ADD(date, n) と同じです）。
- 入力が DATE 型（年月日のみ）の場合、時刻部分は 00:00:00 になります。
- 入力日時にマイクロ秒が含まれる場合、分を差し引いても元のマイクロ秒の精度は維持されます（たとえば、'2023-01-01 00:01:00.123456' は '2023-01-01 00:00:00.123456' になります。差し引く時間は 1 分です）。
- 計算結果が DATETIME 型の有効範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59.999999）を超える場合、エラーが発生します。
- いずれかの引数が NULL の場合、NULL を返します。

## 使用例

```sql
-- Subtract minutes from DATETIME
SELECT MINUTES_SUB('2020-02-02 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 02:01:02 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_SUB('2023-07-13 22:38:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to addition)
SELECT MINUTES_SUB('2023-07-13 22:23:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:18 |
+---------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTES_SUB('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-12 23:30:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MINUTES_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| MINUTES_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:21:33.123+08:00                   |
+-------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_SUB(NULL, 10), MINUTES_SUB('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| MINUTES_SUB(NULL, 10) | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_add of 0000-01-01 00:00:00, -1 out of range
```
