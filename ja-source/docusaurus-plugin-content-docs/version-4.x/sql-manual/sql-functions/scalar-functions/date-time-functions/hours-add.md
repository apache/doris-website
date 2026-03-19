---
{
  "title": "HOURS_ADD",
  "description": "HOURSADD関数は、入力された日付またはdatetime値に対して指定された時間数を加算または減算し、計算された新しいdatetimeを返します。",
  "language": "ja"
}
---
## デスクリプション

HOURS_ADD関数は、入力された日付またはdatetime値に対して指定された時間数を加算または減算し、計算された新しいdatetimeを返します。この関数はDATEとDATETIMEの両方の入力タイプをサポートします。入力がDATE型（年、月、日のみを含む）の場合、時間を加算する前に時刻部分をデフォルトで00:00:00に設定します。

この関数は、`HOUR`単位を使用する場合のMySQLの[date_add function](./date-add)および[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)と一貫性があります。

## Syntax

```sql
HOURS_ADD(`<date_or_time_expr>`, `<hours>`)
```
## パラメータ

| Parameter | デスクリプション |
| ---- | ---- |
| `<date_or_time_expr>` | date/datetime型をサポートする有効な日付式。具体的なdatetimeおよびdate形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<hours>` | 加算する時間数。整数（INT）型。正数または負数を指定可能：正数は指定した時間数を加算し、負数は指定した時間数を減算します（時間の減算と同等） |

## 戻り値

入力されたdatetimeから指定された時間数を加算または減算した後の時刻値を表すDATETIME型を返します。

- 計算結果がDATETIME型の有効範囲[0000-01-01 00:00:01, 9999-12-31 23:59:59]を超える場合、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。

## Examples

```sql

-- Add hours to datetime type
SELECT HOURS_ADD('2020-02-02 02:02:02', 1);
+------------------------------------------------------------+
| hours_add(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 03:02:02                                        |
+------------------------------------------------------------+

-- Add hours to date type (default time is 00:00:00)
SELECT HOURS_ADD('2020-02-02', 51);
+-----------------------------+
| HOURS_ADD('2020-02-02', 51) |
+-----------------------------+
| 2020-02-04 03:00:00         |
+-----------------------------+

-- Add negative hours (i.e., subtract hours)
select hours_add('2023-10-01 10:00:00', -3) ;
+--------------------------------------+
| hours_add('2023-10-01 10:00:00', -3) |
+--------------------------------------+
| 2023-10-01 07:00:00                  |
+--------------------------------------+

-- Input parameter is NULL, return NULL
select hours_add(null, 5) ;
+--------------------+
| hours_add(null, 5) |
+--------------------+
| NULL               |
+--------------------+

select hours_add('2023-10-01 10:00:00',NULL) ;
+---------------------------------------+
| hours_add('2023-10-01 10:00:00',NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

-- Exceeds datetime range
select hours_add('9999-12-31 23:59:59', 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 9999-12-31 23:59:59, 2 out of range

mysql> select hours_add('0000-01-01',-2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 0000-01-01 00:00:00, -2 out of range
```
