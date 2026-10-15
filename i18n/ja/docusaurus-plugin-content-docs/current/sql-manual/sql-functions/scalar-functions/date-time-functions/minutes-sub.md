---
{
    "title": "MINUTES_SUB",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ の値から指定した分数を減算し、元の時間型を維持します。"
}
---

## 説明

MINUTES_SUB 関数は、入力した日時の値から指定した分数を減算し、計算後の日時を返します。この関数は DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型をサポートします。

MINUTE を単位として使用した場合、この関数の動作は Doris の [date_sub 関数](./date-sub) および MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) と同じです。

## 構文

```sql
MINUTES_SUB(`<date_or_time_expr>`, `<minutes>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日時の値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型を使用できます。日付と日時の具体的な形式については、[timestamptz 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。 |
| `<minutes>` | 減算する分数。BIGINT 型で、正または負の値を指定できます。 |

## 戻り値

`TIMESTAMP_NS` を入力すると、小数秒が固定の九桁精度の `TIMESTAMP_NS` を返します。結果は戻り値の型の有効範囲に対して検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

指定した分数 `<minutes>` を基準となる日時 `<datetime_like_type>` から減算した結果を返します。戻り値の型は最初のパラメータの型によって決まります。
- 最初のパラメータが TIMESTAMPTZ の場合は、TIMESTAMPTZ を返します。
- 最初のパラメータが DATETIME の場合は、DATETIME を返します。

特殊なケース:
- `<minutes>` が負の場合、基準となる日時に対応する分数を加算した場合と同じ結果になります（つまり、MINUTES_SUB(date, -n) は MINUTES_ADD(date, n) と同等です）。
- 入力が DATE 型（年、月、日のみ）の場合、時刻部分はデフォルトで 00:00:00 になります。
- 入力した日時にマイクロ秒が含まれる場合、分数を減算した後も元のマイクロ秒精度が維持されます（たとえば、'2023-01-01 00:01:00.123456' から 1 分を減算すると '2023-01-01 00:00:00.123456' になります）。
- 計算結果が DATETIME 型の有効範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59.999999）を超える場合は、例外が発生します。
- いずれかのパラメータが NULL の場合は、NULL を返します。

## 例

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
