---
{
  "title": "HOURS_ADD",
  "language": "ja",
  "description": "HOURSADD関数は、入力された日付またはdatetime値に対して指定された時間数を加算または減算し、計算された新しいdatetimeを返します。"
}
---
## 説明

HOURS_ADD関数は、入力された日付または日時値に対して指定された時間数を加算または減算し、計算された新しい日時を返します。この関数はDATE、DATETIME、TIMESTAMPTZの入力タイプをサポートしています。入力がDATEタイプ（年、月、日のみを含む）の場合、時間を加算する前に時刻部分をデフォルトの00:00:00に設定します。

この関数は、`HOUR`単位を使用する場合の[date_add function](./date-add)およびMySQLの[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)と一貫性があります。

## 構文

```sql
HOURS_ADD(`<date_or_time_expr>`, `<hours>`)
```
## パラメータ

| パラメータ | 説明 |
| ---- | ---- |
| `<date_or_time_expr>` | date/datetime/timestamptz型をサポートする有効な日付式。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<hours>` | 追加する時間数。整数(INT)型。正の値または負の値を指定可能：正の数は指定した時間数を追加し、負の数は指定した時間数を減算します（時間を引くことと同等） |

## 戻り値

基準時刻`<date_or_time_expr>`に指定した時間数`<hours>`を加算した値を返します。戻り値の型は最初のパラメータの型によって決定されます：
- 最初のパラメータの型がDATE/DATETIMEの場合、戻り値の型はDATETIMEです。
- 最初のパラメータの型がTIMESTAMPTZの場合、戻り値の型はTIMESTAMPTZです。

特殊なケース：
- 計算結果がDATETIME型の有効範囲[0000-01-01 00:00:01, 9999-12-31 23:59:59]を超える場合、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。

## 例

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

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT HOURS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| HOURS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-10 13:22:33.123+08:00                 |
+-----------------------------------------------+

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
