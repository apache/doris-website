---
{
    "title": "MICROSECONDS_SUB",
    "language": "ja",
    "description": "MICROSECONDS_SUB 関数は、入力日時値から指定したマイクロ秒数を減算し、その結果の日時値を返します。"
}
---

## 説明

`MICROSECONDS_SUB` 関数は、入力日時値から指定したマイクロ秒数を減算し、その結果の日時値を返します。この関数は、マイクロ秒精度の `DATETIME` 型と `TIMESTAMPTZ` 型を処理できます。

この関数は、MICROSECOND を単位に指定した場合の MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) と同じように動作します。

## 構文

```sql
MICROSECONDS_SUB(`<datetime_like_type>`, `<delta>`)
```

## パラメータ

| パラメータ | 説明 |
|--------------|-------------------------------------------------------------------------------------------------|
| `<datetime_like_type>` | 入力する日時値。型は `DATETIME` または `TIMESTAMPTZ` です。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)および[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。 |
| `<delta>` | 減算するマイクロ秒数。型は `BIGINT` です。1 秒 = 1,000,000 マイクロ秒です。 |

## 戻り値

指定したマイクロ秒数 `<delta>` を基準時刻 `<datetime_like_type>` から減算した結果を返します。戻り値の型は最初の引数と同じです。

- `<delta>` が負の場合、基準時刻に対応するマイクロ秒数を加算した場合と同じように動作します（つまり、`MICROSECONDS_SUB(basetime, -n)` は `MICROSECONDS_ADD(basetime, n)` と同等です）。
- 計算結果が `DATETIME` 型の有効範囲（`0000-01-01 00:00:00` から `9999-12-31 23:59:59.999999` まで）を超えると、例外が発生します。
- いずれかの引数が `NULL` の場合、`NULL` を返します。

## 例

```sql
-- Subtract microseconds
SELECT NOW(3) AS current_time, MICROSECONDS_SUB(NOW(3), 100000) AS after_sub;

+-------------------------+----------------------------+
| current_time            | after_sub                  |
+-------------------------+----------------------------+
| 2025-01-16 11:52:22.296 | 2025-01-16 11:52:22.196000 |
+-------------------------+----------------------------+

-- Negative delta (equivalent to addition)
mysql> SELECT MICROSECONDS_SUB('2023-10-01 12:00:00.200000', -300000) AS after_sub;
+----------------------------+
| after_sub                  |
+----------------------------+
| 2023-10-01 12:00:00.500000 |
+----------------------------+

-- Any parameter is NULL, returns NULL
SELECT MICROSECONDS_SUB(NULL, 1000), MICROSECONDS_SUB('2023-01-01', NULL) AS after_sub;
+------------------------------+----------------------------+
| microseconds_sub(NULL, 1000) | after_sub                  |
+------------------------------+----------------------------+
| NULL                         | NULL                       |
+------------------------------+----------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000000
SELECT MICROSECONDS_SUB('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_SUB('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-10-01 00:00:00.300000              |
+-----------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MICROSECONDS_SUB('2024-12-25 12:34:56.123+04:00', '765800');
+-------------------------------------------------------------+
| MICROSECONDS_SUB('2024-12-25 12:34:56.123+04:00', '765800') |
+-------------------------------------------------------------+
| 2024-12-25 16:34:55.357200+08:00                            |
+-------------------------------------------------------------+

-- Exceeds datetime range, throws an error
mysql> SELECT MICROSECONDS_SUB('0000-01-01 00:00:00.000000', 1000000) AS after_sub;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 0000-01-01 00:00:00, -1000000 
out of range

```
