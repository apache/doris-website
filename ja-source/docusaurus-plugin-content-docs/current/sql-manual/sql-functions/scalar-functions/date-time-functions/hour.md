---
{
  "title": "時間",
  "language": "ja",
  "description": "HOUR関数は、日時または時刻式から時間部分を抽出します。この関数は複数の時刻型入力をサポートしており、"
}
---
## 説明

HOUR関数はdatetimeまたはtime式から時間部分を抽出します。この関数はDATE/DATETIMEとTIMEを含む複数の時間型入力をサポートし、対応する時間値を返します。

DATETIME（'2023-10-01 14:30:00'など）の場合、戻り値は0-23の範囲（24時間形式）です。
TIME型（'456:26:32'など）の場合、戻り値は24を超えることができ、[0,838]の範囲になります。

この関数はMySQLの[hour function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_hour)と一貫して動作します。

## 構文

```sql
HOUR(`<date_or_time_expr>`)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | datetime/date/time型をサポートする有効な日付式。Date型は対応する日付の開始時刻00:00:00に変換されます。具体的なdatetime/date/time形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)、[time conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください |

## 戻り値

入力式の時間部分を表す整数型（INT）を返します。
- DATETIMEの場合、0-23の整数を返します。
- DATE型の場合、0を返します。
- TIME型の場合、0から838の整数を返します（TIME型の範囲と一致）。絶対値を返します。
- 入力パラメータがNULLの場合、NULLを返します。

## 例

```sql
-- Extract hour from datetime (24-hour format)
select 
    hour('2018-12-31 23:59:59') as last_hour,
    hour('2023-01-01 00:00:00') as midnight,   
    hour('2023-10-01 12:30:45') as noon;     

+-----------+----------+------+
| last_hour | midnight | noon |
+-----------+----------+------+
|        23 |        0 |   12 |
+-----------+----------+------+

-- Extract hour from TIME type (supports over 24 or negative values)
select 
    hour(cast('14:30:00' as time)) as normal_hour,     
    hour(cast('25:00:00' as time)) as over_24,
    hour(cast('456:26:32' as time)) as large_hour,     
    hour(cast('-12:30:00' as time)) as negative_hour, 
    hour(cast('838:59:59' as time)) as max_hour,    
    hour(cast('-838:59:59' as time)) as min_hour;    

+-------------+---------+------------+---------------+----------+----------+
| normal_hour | over_24 | large_hour | negative_hour | max_hour | min_hour |
+-------------+---------+------------+---------------+----------+----------+
|          14 |      25 |        456 |            12 |      838 |      838 |
+-------------+---------+------------+---------------+----------+----------+

-- Extract hour from date type, returns 0
select hour("2022-12-12");
+--------------------+
| hour("2022-12-12") |
+--------------------+
|                  0 |
+--------------------+

-- Will not automatically convert input time string to time, returns NULL
select hour('14:30:00') as normal_hour;
+-------------+
| normal_hour |
+-------------+
|        NULL |
+-------------+

-- Input parameter is NULL, returns NULL
mysql> select hour(NULL);
+------------+
| hour(NULL) |
+------------+
|       NULL |
+------------+
```
