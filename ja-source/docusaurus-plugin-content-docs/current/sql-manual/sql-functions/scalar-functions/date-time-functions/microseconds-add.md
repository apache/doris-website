---
{
  "title": "MICROSECONDS_ADD",
  "language": "ja",
  "description": "MICROSECONDSADD関数は、入力されたdatetime値に指定されたマイクロ秒数を加算し、結果として得られる新しいdatetime値を返します。"
}
---
## 説明

MICROSECONDS_ADD関数は、入力されたdatetime値に指定されたマイクロ秒数を加算し、結果として得られる新しいdatetime値を返します。この関数は、マイクロ秒精度でDATETIMEまたはTIMESTAMPTZ型の処理をサポートします。

この関数は、MICROSECONDを単位として使用する場合、MySQLの[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)と同じ動作をします。

## 構文

```sql
MICROSECONDS_ADD(`<datetime_like_type>`, `<delta>`)
```
## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<datetime_like_type>` | 入力される日時値で、DATETIME または TIMESTAMPTZ 型です。フォーマットについては、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) を参照してください |
| `<delta>` | 追加するマイクロ秒数で、BIGINT 型です。1秒 = 1,000,000 マイクロ秒です。 |

## Return Value

基準時刻 `<datetime_like_type>` に指定されたマイクロ秒 `<delta>` を追加した結果を返します。戻り値の型は最初のパラメータの型と同じになります。
- 最初のパラメータが TIMESTAMPTZ の場合、TIMESTAMPTZ を返します。
- 最初のパラメータが DATETIME の場合、DATETIME を返します。

- `<delta>` が負の値の場合、この関数は基準時刻から対応するマイクロ秒を減算します（つまり、MICROSECONDS_ADD(basetime, -n) は MICROSECONDS_SUB(basetime, n) と同等です）。
- 計算結果が DATETIME 型の有効範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59.999999）を超える場合、例外がスローされます。
- いずれかのパラメータが NULL の場合、NULL を返します。

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

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MICROSECONDS_ADD('2024-12-25 12:34:56.123+04:00', '765800');
+-------------------------------------------------------------+
| MICROSECONDS_ADD('2024-12-25 12:34:56.123+04:00', '765800') |
+-------------------------------------------------------------+
| 2024-12-25 16:34:56.888800+08:00                            |
+-------------------------------------------------------------+

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
