---
{
  "title": "DATE_FORMAT",
  "language": "ja",
  "description": "DATEFORMAT関数は、指定されたフォーマット文字列（format）に従って、日付または時刻の値を文字列に変換するために使用されます。"
}
---
## 説明

DATE_FORMAT関数は、指定されたフォーマット文字列（`format`）に従って、日付または時刻の値を文字列に変換するために使用されます。この関数はDATE（日付のみ）およびDATETIME（日付と時刻）型のフォーマットをサポートし、出力結果は指定されたフォーマットに準拠した文字列になります。

この関数は、MySQLの[date_format function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-format)と一致しています。

## 構文

```sql
DATE_FORMAT(<date_or_time_expr>, <format>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | 有効な日付値で、datetime型またはdate型をサポートします。具体的なdatetimeおよびdate形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<format>` | 日付/時刻の出力形式を指定します。`varchar`型です |

サポートされている形式指定子：

| 形式指定子 | 説明                               |
|--------|-------------------------------------|
| %a     | 省略された曜日名（3文字）                          |
| %b     | 省略された月名（3文字）                           |
| %c     | 数値としての月（0-12）                           |
| %D     | 英語の序数接尾辞付きの日（0th, 1st, 2nd, 3rd, …） |
| %d     | 数値としての日（00-31）                |
| %e     | 数値としての日（0-31）                 |
| %f     | マイクロ秒（000000-999999）               |
| %H     | 時（00-23）                        |
| %h     | 時（01-12）                        |
| %I     | 時（01-12）                        |
| %i     | 数値としての分（00-59）                  |
| %j     | 年の通算日（001-366）                    |
| %k     | 時（0-23）                         |
| %l     | 時（1-12）                         |
| %M     | 月名                                |
| %m     | 数値としての月（00-12）                    |
| %p     | AMまたはPM                            |
| %r     | 12時間形式の時刻（hh:mm:ssの後にAMまたはPM） |
| %S     | 秒（00-59）                          |
| %s     | 秒（00-59）                          |
| %T     | 24時間形式の時刻（hh:mm:ss）           |
| %U     | 週（00-53）、日曜日が週の最初の日、[week](./week) mode 0   |
| %u     | 週（00-53）、月曜日が週の最初の日、[week](./week) mode 1   |
| %V     | 週（01-53）、日曜日が週の最初の日、[week](./week) mode 2、%Xと一緒に使用 |
| %v     | 週（01-53）、月曜日が週の最初の日、[week](./week) mode 3、%xと一緒に使用 |
| %W     | 完全な曜日名（Sunday-Saturday）    |
| %w     | 曜日（0 = 日曜日、6 = 土曜日）        |
| %X     | 年、日曜日が週の最初の日（4桁）、%Vと一緒に使用 |
| %x     | 年、月曜日が週の最初の日（4桁）、%vと一緒に使用 |
| %Y     | 年（4桁）                            |
| %y     | 年（2桁）                            |
| %%     | %文字を表します                         |
| %**x** | 上記にリストされていない任意の**x**については、**x**自体を表します |

3つの特別な形式も利用可能です：

```text
yyyyMMdd --corresponds to standard format specifier：%Y%m%d
yyyy-MM-dd --corresponds to standard format specifier：%Y-%m-%d
yyyy-MM-dd HH:mm:ss --corresponds to standard format specifier：%Y-%m-%d %H:%i:%s
```
## 戻り値

フォーマットされた日付文字列、型はVarcharです。

特殊なケース:
- formatがNULLの場合、NULLを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。
- 入力値が128文字を超える場合、エラーを返します。
- 出力長が102サイズを超える場合、エラーをスローします

## 例

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
