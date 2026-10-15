---
{
    "title": "EXTRACT",
    "language": "ja",
    "description": "EXTRACT 関数は、日付または時刻の値から、年、月、週、日、時、分、秒などの指定した要素を抽出します。"
}
---

## 説明

`EXTRACT` 関数は、日付または時刻の値から、年、月、週、日、時、分、秒などの指定した要素を抽出します。この関数を使うと、日時の特定の部分を正確に取得できます。

この関数の動作は、MySQL の [extract 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_extract) と一致します。

## 構文

`EXTRACT(<unit> FROM <date_or_time_expr>)`

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<unit>` | 指定できる列挙値: YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND、YEAR_MONTH、DAY_HOUR、DAY_MINUTE、DAY_SECOND、DAY_MICROSECOND、HOUR_MINUTE、HOUR_SECOND、HOUR_MICROSECOND、MINUTE_SECOND、MINUTE_MICROSECOND、SECOND_MICROSECOND、DAYOFWEEK(DOW)、DAYOFYEAR(DOY) |
| `<datetime_or_time_expr>` | DATE/DATETIME 型の値、および日時形式の文字列を使用できる有効な日付式。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

日付または時刻から抽出した部分を返します。
- `YEAR`、[DAYOFWEEK(DOW)](./dayofweek.md)、[DAYOFYEAR(DOY)](./dayofyear.md) など、単一の単位を指定した場合、戻り値の型は INT です。
- `YEAR_MONTH` など、複合単位を指定した場合、戻り値の型は STRING です。

週の値は 0～53 の範囲で、次のように計算されます。

- 日曜日を週の最初の日とします。
- その年の最初の日曜日を含む週を第 1 週とします。
- 最初の日曜日より前の日付は第 0 週に属します。

単位が年、月、日、時、分、秒、マイクロ秒の場合、日時の対応する要素の値を返します。

単位が四半期の場合、一月から三月は 1、四月から六月は 2、七月から九月は 3、十月から十二月は 4 を返します。

特殊なケース:
- <date_or_time_expr> が NULL の場合、NULL を返します。
- <unit> がサポートされていない単位の場合、エラーを返します。

複合単位の戻り値の形式は次のとおりです。
| 時間単位            | 戻り値の形式                              |
| ------------------ | ----------------------------------------- |
| YEAR_MONTH         | 'YEARS-MONTHS'                            |
| DAY_HOUR           | 'DAYS HOURS'                              |
| DAY_MINUTE         | 'DAYS HOURS:MINUTES'                      |
| DAY_SECOND         | 'DAYS HOURS:MINUTES:SECONDS'              |
| DAY_MICROSECOND    | 'DAYS HOURS:MINUTES:SECONDS.MICROSECONDS' |
| HOUR_MINUTE        | 'HOURS:MINUTES'                           |
| HOUR_SECOND        | 'HOURS:MINUTES:SECONDS'                   |
| HOUR_MICROSECOND   | 'HOURS:MINUTES:SECONDS.MICROSECONDS'      |
| MINUTE_SECOND      | 'MINUTES:SECONDS'                         |
| MINUTE_MICROSECOND | 'MINUTES:SECONDS.MICROSECONDS'            |
| SECOND_MICROSECOND | 'SECONDS.MICROSECONDS'                    |

## 例

```sql
-- Extract year, month, day, hour, minute, second, microsecond time components from datetime
select extract(year from '2022-09-22 17:01:30') as year,
extract(month from '2022-09-22 17:01:30') as month,
extract(day from '2022-09-22 17:01:30') as day,
extract(hour from '2022-09-22 17:01:30') as hour,
extract(minute from '2022-09-22 17:01:30') as minute,
extract(second from '2022-09-22 17:01:30') as second,
extract(microsecond from cast('2022-09-22 17:01:30.000123' as datetime(6))) as microsecond;

+------+-------+------+------+--------+--------+-------------+
| year | month | day  | hour | minute | second | microsecond |
+------+-------+------+------+--------+--------+-------------+
| 2022 |     9 |   22 |   17 |      1 |     30 |         123 |
+------+-------+------+------+--------+--------+-------------+

-- Extract quarter from datetime
mysql> select extract(quarter from '2023-05-15') as quarter;
+---------+
| quarter |
+---------+
|       2 |
+---------+

-- Extract week number for the corresponding date. Since the first Sunday of 2024 is on January 7th, all dates before 01-07 return 0
select extract(week from '2024-01-06') as week;
+------+
| week |
+------+
|    0 |
+------+

-- January 7th is the first Sunday, returns 1
select extract(week from '2024-01-07') as week;
+------+
| week |
+------+
|    1 |
+------+

-- Under this rule, 2024 only has weeks 0-52
select extract(week from '2024-12-31') as week;
+------+
| week |
+------+
|   52 |
+------+

select extract(year_month from '2026-01-01 11:45:14.123456') as year_month,
       extract(day_hour from '2026-01-01 11:45:14.123456') as day_hour,
       extract(day_minute from '2026-01-01 11:45:14.123456') as day_minute,
       extract(day_second from '2026-01-01 11:45:14.123456') as day_second,
       extract(day_microsecond from '2026-01-01 11:45:14.123456') as day_microsecond,
       extract(hour_minute from '2026-01-01 11:45:14.123456') as hour_minute,
       extract(hour_second from '2026-01-01 11:45:14.123456') as hour_second,
       extract(hour_microsecond from '2026-01-01 11:45:14.123456') as hour_microsecond,
       extract(minute_second from '2026-01-01 11:45:14.123456') as minute_second,
       extract(minute_microsecond from '2026-01-01 11:45:14.123456') as minute_microsecond,
       extract(second_microsecond from '2026-01-01 11:45:14.123456') as second_microsecond;

+------------+----------+------------+-------------+--------------------+-------------+-------------+------------------+---------------+--------------------+--------------------+
| year_month | day_hour | day_minute | day_second  | day_microsecond    | hour_minute | hour_second | hour_microsecond | minute_second | minute_microsecond | second_microsecond |
+------------+----------+------------+-------------+--------------------+-------------+-------------+------------------+---------------+--------------------+--------------------+
| 2026-01    | 01 11    | 01 11:45   | 01 11:45:14 | 01 11:45:14.123456 | 11:45       | 11:45:14    | 11:45:14.123456  | 45:14         | 45:14.123456       | 14.123456          |
+------------+----------+------------+-------------+--------------------+-------------+-------------+------------------+---------------+--------------------+--------------------+

-- Input unit does not exist, reports error
select extract(uint from '2024-01-07') as week;

ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'uint'
```
