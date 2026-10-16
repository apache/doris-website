---
{
    "title": "DATE_FORMAT",
    "language": "ja",
    "description": "DATEFORMAT 関数は、指定した書式文字列（format）に従って日付または時刻の値を文字列に変換します。"
}
---

## 説明

DATE_FORMAT 関数は、指定した書式文字列（`format`）に従って日付または時刻の値を文字列に変換します。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` の値をサポートし、指定した書式に従う文字列を返します。

この関数の動作は MySQL の [date_format 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-format) と同じです。

## 構文

```sql
DATE_FORMAT(<date_or_time_expr>, <format>)
```

## 引数

| 引数 | 説明 |
| -- | -- |
| `<date_or_time_expr>` | 有効な `DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` の値。日付と日時の具体的な書式については、[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[timestamp_ns の変換](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md)、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)を参照してください。 |
| `<format>` | 日付または時刻の出力書式を指定する `varchar` 型の値。 |

サポートする書式指定子は次のとおりです。

| 書式指定子 | 説明 |
|--------|-------------------------------------|
| %a     | 曜日名の省略形（3 文字） |
| %b     | 月名の省略形（3 文字） |
| %c     | 数値で表した月（0-12） |
| %D     | 英語の序数接尾辞を付けた月内の日（0th、1st、2nd、3rd、…） |
| %d     | 数値で表した月内の日（00-31） |
| %e     | 数値で表した月内の日（0-31） |
| %f     | マイクロ秒（000000-999999） |
| %n     | ナノ秒（000000000-999999999）。精度が低い型では、不足する桁をゼロで埋めます。 |
| %H     | 時（00-23） |
| %h     | 時（01-12） |
| %I     | 時（01-12） |
| %i     | 数値で表した分（00-59） |
| %j     | 年内の通算日（001-366） |
| %k     | 時（0-23） |
| %l     | 時（1-12） |
| %M     | 月名 |
| %m     | 数値で表した月（00-12） |
| %p     | AM または PM |
| %r     | 12 時間形式の時刻（hh:mm:ss の後に AM または PM が続く） |
| %S     | 秒（00-59） |
| %s     | 秒（00-59） |
| %T     | 24 時間形式の時刻（hh:mm:ss） |
| %U     | 週（00-53）。週の初日は日曜日で、[week](./week) のモード 0 に対応します。 |
| %u     | 週（00-53）。週の初日は月曜日で、[week](./week) のモード 1 に対応します。 |
| %V     | 週（01-53）。週の初日は日曜日で、[week](./week) のモード 2 に対応します。%X と組み合わせて使用します。 |
| %v     | 週（01-53）。週の初日は月曜日で、[week](./week) のモード 3 に対応します。%x と組み合わせて使用します。 |
| %W     | 曜日名の正式名称（Sunday-Saturday） |
| %w     | 曜日を表す数値（0 = 日曜日、6 = 土曜日） |
| %X     | 日曜日を週の初日とした年（4 桁）。%V と組み合わせて使用します。 |
| %x     | 月曜日を週の初日とした年（4 桁）。%v と組み合わせて使用します。 |
| %Y     | 年（4 桁） |
| %y     | 年（2 桁） |
| %%     | % 文字を表します。 |
| %**x** | 上記にない任意の **x** について、**x** 自体を表します。 |

次の三つの特別な書式も使用できます。

```text
yyyyMMdd --corresponds to standard format specifier：%Y%m%d
yyyy-MM-dd --corresponds to standard format specifier：%Y-%m-%d
yyyy-MM-dd HH:mm:ss --corresponds to standard format specifier：%Y-%m-%d %H:%i:%s
```

## 戻り値

書式を適用した日付の文字列を Varchar 型で返します。

特殊なケース:
- format が NULL の場合、NULL を返します。
- いずれかの引数が NULL の場合、NULL を返します。
- 入力値の長さが 128 文字を超える場合、エラーを返します。
- 出力の長さが 102 を超える場合、エラーを返します。

## 使用例

```sql
SELECT DATE_FORMAT(
    CAST('2024-02-29 12:34:56.123456789' AS TIMESTAMP_NS),
    '%Y-%m-%d %H:%i:%s.%n'
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 2024-02-29 12:34:56.123456789 |
+-------------------------------+
```

```sql
-- Output weekday name, month name, and 4-digit year
select date_format(cast('2009-10-04 22:23:00' as datetime), '%W %M %Y');

+------------------------------------------------------------------+
| date_format(cast('2009-10-04 22:23:00' as datetime), '%W %M %Y') |
+------------------------------------------------------------------+
| Sunday October 2009                                              |
+------------------------------------------------------------------+

-- Output time in 24-hour format (hour:minute:second)
select date_format('2007-10-04 22:23:00', '%H:%i:%s');

+------------------------------------------------+
| date_format('2007-10-04 22:23:00', '%H:%i:%s') |
+------------------------------------------------+
| 22:23:00                                       |
+------------------------------------------------+

-- Combine multiple format specifiers and plain characters
select date_format('1900-10-04 22:23:00', 'Day: %D, Year: %y, Month: %b, DayOfYear: %j');

+-----------------------------------------------------------------------------------+
| date_format('1900-10-04 22:23:00', 'Day: %D, Year: %y, Month: %b, DayOfYear: %j') |
+-----------------------------------------------------------------------------------+
| Day: 4th, Year: 00, Month: Oct, DayOfYear: 277                                    |
+-----------------------------------------------------------------------------------+

-- %X (year) used with %V (week number), where Sunday is the first day of the week
select date_format('1999-01-01 00:00:00', '%X-%V');

+---------------------------------------------+
| date_format('1999-01-01 00:00:00', '%X-%V') |
+---------------------------------------------+
| 1998-52                                     |
+---------------------------------------------+

-- Output the % character (escaped with %%)
select date_format(cast('2006-06-01' as date), '%%%d/%m');

+----------------------------------------------------+
| date_format(cast('2006-06-01' as date), '%%%d/%m') |
+----------------------------------------------------+
| %01/06                                             |
+----------------------------------------------------+

-- Special format yyyy-MM-dd HH:mm:ss
select date_format('2023-12-31 23:59:59', 'yyyy-MM-dd HH:mm:ss');
+-----------------------------------------------------------+
| date_format('2023-12-31 23:59:59', 'yyyy-MM-dd HH:mm:ss') |
+-----------------------------------------------------------+
| 2023-12-31 23:59:59                                       |
+-----------------------------------------------------------+

-- String that does not reference any time information
select date_format('2023-12-31 23:59:59', 'ghg');
+-------------------------------------------+
| date_format('2023-12-31 23:59:59', 'ghg') |
+-------------------------------------------+
| ghg                                       |
+-------------------------------------------+

-- Special format yyyyMMdd
select date_format('2023-12-31 23:59:59', 'yyyyMMdd');
+------------------------------------------------+
| date_format('2023-12-31 23:59:59', 'yyyyMMdd') |
+------------------------------------------------+
| 20231231                                       |
+------------------------------------------------+

-- Special format yyyy-MM-dd
select date_format('2023-12-31 23:59:59', 'yyyy-MM-dd');
+--------------------------------------------------+
| date_format('2023-12-31 23:59:59', 'yyyy-MM-dd') |
+--------------------------------------------------+
| 2023-12-31                                       |
+--------------------------------------------------+

-- Parameter is null
mysql> select date_format(NULL, '%Y-%m-%d');
+-------------------------------+
| date_format(NULL, '%Y-%m-%d') |
+-------------------------------+
| NULL                          |
+-------------------------------+

---Returns error if the result string exceeds the function's maximum length limit.
mysql> select date_format('2022-01-12',repeat('a',129));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation date_format of invalid or oversized format is invalid

---output length over 102 size,throw error
mysql> select date_format('2022-11-13 10:12:12',repeat('%h',52));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation date_format of 142335809712816128,%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h%h is invalid
```
