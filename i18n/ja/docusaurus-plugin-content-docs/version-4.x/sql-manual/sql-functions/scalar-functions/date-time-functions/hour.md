---
{
    "title": "HOUR",
    "language": "ja",
    "description": "HOUR 関数は日時または時刻の式から時部分を抽出します。この関数は複数の時刻型の入力に対応します。"
}
---

## 説明

HOUR 関数は日時または時刻の式から時部分を抽出します。DATE、DATETIME、TIME 型の入力に対応し、該当する時の値を返します。

DATETIME 型（例：'2023-10-01 14:30:00'）の場合、戻り値は 0～23 の範囲です（24 時間表記）。
TIME 型（例：'456:26:32'）の場合、戻り値は 24 を超えることがあり、0～838 の範囲です。

この関数の動作は、MySQL の [HOUR 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_hour) と同じです。

## 構文

```sql
HOUR(`<date_or_time_expr>`)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | DATETIME、DATE、TIME 型に対応する有効な日付式。DATE 型の値は、その日付の開始時刻である 00:00:00 に変換されます。各型の形式については、[DATETIME 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)、[TIME 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)を参照してください。 |

## 戻り値

入力式の時部分を表す整数型（INT）の値を返します。

- DATETIME 型の場合、0～23 の整数を返します。
- DATE 型の場合、0 を返します。
- TIME 型の場合、0～838 の整数を返します（TIME 型の範囲に対応）。負の値に対しても絶対値を返します。
- 入力パラメータが NULL の場合、NULL を返します。

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

select hour('14:30:00') as normal_hour;
+-------------+
| normal_hour |
+-------------+
|          14 |
+-------------+

-- Input parameter is NULL, returns NULL
mysql> select hour(NULL);
+------------+
| hour(NULL) |
+------------+
|       NULL |
+------------+
```
