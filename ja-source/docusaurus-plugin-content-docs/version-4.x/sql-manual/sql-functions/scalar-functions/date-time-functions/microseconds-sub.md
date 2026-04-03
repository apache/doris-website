---
{
  "title": "MICROSECONDS_SUB",
  "description": "MICROSECONDSSUB関数は、入力されたdatetime値から指定されたマイクロ秒数を減算し、結果として得られる新しいdatetime値を返します。",
  "language": "ja"
}
---
## 概要

`MICROSECONDS_SUB`関数は、入力されたdatetime値から指定されたマイクロ秒数を減算し、結果として得られる新しいdatetime値を返します。この関数はマイクロ秒精度を持つ`DATETIME`型の処理をサポートします。

この関数は、MICROSECONDを単位として使用する場合のMySQLの[date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)と同じ動作をします。

## 構文

```sql
MICROSECONDS_SUB(`<datetime>`, `<delta>`)
```
## パラメータ

| Parameter    | デスクリプション                                                                                     |
|--------------|-------------------------------------------------------------------------------------------------|
| `<datetime>` | 入力する日時値。型は`DATETIME`です。具体的な日時フォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。 |
| `<delta>`    | 減算するマイクロ秒数。型は`BIGINT`です。1秒 = 1,000,000マイクロ秒です。       |

## Return Value

基準時刻から指定したマイクロ秒数を減算した結果を表す、`DATETIME`型の値を返します。

- `<delta>`が負の値の場合、この関数は基準時刻に対応するマイクロ秒数を加算するのと同じ動作をします（つまり、`MICROSECONDS_SUB(basetime, -n)`は`MICROSECONDS_ADD(basetime, n)`と同等です）。
- 計算結果が`DATETIME`型の有効範囲（`0000-01-01 00:00:00`から`9999-12-31 23:59:59.999999`）を超える場合、例外がスローされます。
- いずれかのパラメータが`NULL`の場合、この関数は`NULL`を返します。

## Examples

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

-- Exceeds datetime range, throws an error
mysql> SELECT MICROSECONDS_SUB('0000-01-01 00:00:00.000000', 1000000) AS after_sub;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 0000-01-01 00:00:00, -1000000 
out of range

```
