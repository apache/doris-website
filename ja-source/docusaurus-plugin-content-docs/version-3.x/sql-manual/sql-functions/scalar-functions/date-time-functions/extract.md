---
{
  "title": "EXTRACT",
  "description": "extract関数は、年、月、日、時、分、秒などの日付や時刻値の指定された部分を抽出するために使用されます。",
  "language": "ja"
}
---
## 説明

`extract`関数は、年、月、日、時、分、秒などの日付や時刻値の指定された部分を抽出するために使用されます。この関数は、計算、比較、または表示のためにdatetimeフィールドから特定の時間コンポーネントを抽出するのに一般的に使用されます。

## 構文

`EXTRACT(<unit> FROM <datetime>)`

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `unit` | DATETIMEから抽出する単位。使用可能な値は year、month、day、hour、minute、second、または microsecond です |
| `datetime` | 引数は有効な日付式です |

## 戻り値

戻り値は、抽出される単位に応じて、日付または時刻の抽出された部分（整数など）です。

## 例

```sql
select extract(year from '2022-09-22 17:01:30') as year,
extract(month from '2022-09-22 17:01:30') as month,
extract(day from '2022-09-22 17:01:30') as day,
extract(hour from '2022-09-22 17:01:30') as hour,
extract(minute from '2022-09-22 17:01:30') as minute,
extract(second from '2022-09-22 17:01:30') as second,
extract(microsecond from cast('2022-09-22 17:01:30.000123' as datetimev2(6))) as microsecond;
```
```text
+------+-------+------+------+--------+--------+-------------+
| year | month | day  | hour | minute | second | microsecond |
+------+-------+------+------+--------+--------+-------------+
| 2022 |     9 |   22 |   17 |      1 |     30 |         123 |
+------+-------+------+------+--------+--------+-------------+
```
