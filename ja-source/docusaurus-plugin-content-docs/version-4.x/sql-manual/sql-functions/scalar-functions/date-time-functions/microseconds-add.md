---
{
  "title": "MICROSECONDS_ADD",
  "description": "MICROSECONDSADD関数は、入力されたdatetime値に指定されたマイクロ秒数を加算し、結果として得られる新しいdatetime値を返します。",
  "language": "ja"
}
---
## 説明

MICROSECONDS_ADD関数は、入力されたdatetime値に指定されたマイクロ秒数を加算し、結果として得られる新しいdatetime値を返します。この関数は、マイクロ秒精度でのDATETIME型の処理をサポートします。

この関数は、MICROSECONDを単位として使用する場合、MySQLの[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)と同じ動作をします。

## 構文

```sql
MICROSECONDS_ADD(`<datetime>`, `<delta>`)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<datetime>` | DATETIME型の入力datetime値。datetime形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください |
| `<delta>` | 追加するマイクロ秒数、BIGINT型。1秒 = 1,000,000マイクロ秒。 |

## Return Value

DATETIME型の値を返します。これは、ベース時刻に指定されたマイクロ秒を追加した結果を表します（YYYY-MM-DD HH:MM:SS.ffffffの形式でフォーマットされ、小数部分の精度はdatetimeの精度と一致します）。

- `<delta>`が負の値の場合、関数はベース時刻から対応するマイクロ秒を減算します（つまり、MICROSECONDS_ADD(basetime, -n)はMICROSECONDS_SUB(basetime, n)と等価です）。
- 計算結果がDATETIME型の有効範囲（0000-01-01 00:00:00から9999-12-31 23:59:59.999999）を超える場合、例外がスローされます。
- いずれかのパラメータがNULLの場合、NULLを返します。

## Examples

```sql
-- Add microseconds
SELECT NOW(3) AS current_time, MICROSECONDS_ADD(NOW(3), 100000000) AS after_add;

+-------------------------+----------------------------+
| current_time            | after_add                  |
+-------------------------+----------------------------+
| 2025-08-11 14:49:16.368 | 2025-08-11 14:50:56.368000 |
+-------------------------+----------------------------+

-- Add negative microseconds, equivalent to subtracting
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000', -300000) AS after_add;
+----------------------------+
| after_add                  |
+----------------------------+
| 2023-10-01 12:00:00.200000 |
+----------------------------+

-- Input type is date, time part defaults to 00:00:00.000000
SELECT MICROSECONDS_ADD('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_ADD('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-09-30 23:59:59.700000              |
+-----------------------------------------+

-- Calculation result exceeds datetime range, throws error
SELECT MICROSECONDS_ADD('9999-12-31 23:59:59.999999', 2000000) AS after_add;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 9999-12-31 23:59:59.999999, 2000000 out of range

-- Any input parameter is NULL, returns NULL
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000', NULL);
+-----------------------------------------------------+
| MICROSECONDS_ADD('2023-10-01 12:00:00.500000',NULL) |
+-----------------------------------------------------+
| NULL                                                |
+-----------------------------------------------------+

```
