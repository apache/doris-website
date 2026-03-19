---
{
  "title": "HOURS_SUB",
  "language": "ja",
  "description": "HOURSSUB関数は、入力された日付またはdatetime値から指定された時間数を減算し、計算された新しいdatetimeを返します。"
}
---
## 説明

HOURS_SUB関数は、入力された日付またはdatetime値から指定された時間数を減算し、計算された新しいdatetimeを返します。この関数は、DATE、DATETIME、およびTIMESTAMPTZ入力タイプの両方をサポートします。入力がDATEタイプ（年、月、日のみを含む）の場合、時刻部分はデフォルトで00:00:00になります。

この関数は、`HOUR`単位を使用する場合の[date_sub function](./date-sub)およびMySQLの[date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)と一致しています。

## 構文

```sql
HOURS_SUB(`<date_or_time_expr>`, `<hours>`)
```
## パラメータ

| パラメータ | 説明 |
| ---- | ---- |
| `<date_or_time_expr>` | date/datetime/timestamptz型をサポートする有効な日付式。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<hours>` | 減算する時間数、INT型 |

## 戻り値

基準時刻`<date_or_time_expr>`から指定された時間数`<hours>`を減算した値を返します。戻り値の型は第1パラメータの型によって決まります：
- 第1パラメータの型がDATE/DATETIMEの場合、戻り値の型はDATETIMEです。
- 第1パラメータの型がTIMESTAMPTZの場合、戻り値の型はTIMESTAMPTZです

特殊なケース：
- 計算結果がDATETIME型の有効範囲（0000-01-01 00:00:00から9999-12-31 23:59:59）を超える場合、エラーを返します。
- 入力パラメータがNULLの場合、NULLを返します。
- 入力時間数が負の値の場合、対応する時間数を加算した日時を返します。

## 例

```sql

-- Subtract positive hours
SELECT HOURS_SUB('2020-02-02 02:02:02', 1);
+------------------------------------------------------------+
| hours_sub(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 01:02:02                                        |
+------------------------------------------------------------+

-- Subtract hours from date type
select hours_sub('2023-10-01', 12);
+-----------------------------+
| hours_sub('2023-10-01', 12) |
+-----------------------------+
| 2023-09-30 12:00:00         |
+-----------------------------+

-- Input hours is negative, returns datetime plus hours
select hours_sub('2023-10-01 10:00:00', -3);
+--------------------------------------+
| hours_sub('2023-10-01 10:00:00', -3) |
+--------------------------------------+
| 2023-10-01 13:00:00                  |
+--------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT HOURS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| HOURS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-10 11:22:33.123+08:00                 |
+-----------------------------------------------+

-- Any parameter is NULL, return NULL
select hours_sub('2023-10-01 10:00:00', NULL);
+----------------------------------------+
| hours_sub('2023-10-01 10:00:00', NULL) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+

-- Exceeds datetime range, return NULL
mysql> select hours_sub('9999-12-31 12:00:00', -20);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 9999-12-31 12:00:00, 20 out of range

mysql> select hours_sub('0000-01-01 12:00:00', 20);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 0000-01-01 12:00:00, -20 out of range
```
