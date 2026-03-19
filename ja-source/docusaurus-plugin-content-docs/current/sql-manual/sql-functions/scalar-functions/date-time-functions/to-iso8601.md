---
{
  "title": "TO_ISO8601 | 日付時刻関数",
  "language": "ja",
  "description": "datetime値をISO8601形式の文字列に変換します。入力型DATETIME、DATE、TIMESTAMPTZをサポートします。",
  "sidebar_label": "TO_ISO8601"
}
---
# TO_ISO8601

## 説明

datetime値をISO8601形式の文字列に変換します。入力タイプDATETIME、DATE、TIMESTAMPTZをサポートしています。
返されるISO8601形式のdatetimeはYYYY-MM-DDTHH:MM:SSとして表現され、Tは日付と時刻の区切り文字です。

## 構文

```sql
TO_ISO8601(`<date_or_date_expr>`)
```
## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_date_expr>` | 入力datetime値、date/datetime/timestamptz型をサポートします。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## 戻り値

VARCHAR型を返し、ISO8601形式のdatetime文字列を表します。

- 入力がDATE（例：'2023-10-05'）の場合、YYYY-MM-DD形式（日付のみ）を返します
- 入力がDATETIME（例：'2023-10-05 15:30:25'）の場合、YYYY-MM-DDTHH:MM:SS.xxxxxx形式（日付と時刻がTで区切られ、xxxxxxはすべてゼロ、入力datetimeの小数秒は秒に丸められます）を返します
- 入力がTIMESTAMPTZ（例：'2023-10-05 15:30:25+03:00'）の場合、YYYY-MM-DDTHH:MM:SS.xxxxxx±HH:MM形式（オフセットはlocal_timeに変換後のセッション変数`time_zone`を反映します）を返します
- 入力がNULLの場合、NULLを返します

## 例

```sql
-- Convert DATE type (date only)
SELECT TO_ISO8601(CAST('2023-10-05' AS DATE)) AS date_result;
+--------------+
| date_result  |
+--------------+
| 2023-10-05   |
+--------------+

-- Convert DATETIME type (with hours, minutes, seconds)
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:45.000000 |
+----------------------------+

-- Input with fractional seconds, rounded to seconds
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45.956' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:46.000000 |
+----------------------------+

-- Input TIMESTAMPTZ, SET time_zone = '+08:00'
SELECT TO_ISO8601('2025-10-10 11:22:33+03:00');
+-----------------------------------------+
| TO_ISO8601('2025-10-10 11:22:33+03:00') |
+-----------------------------------------+
| 2025-10-10T16:22:33.000000+08:00        |
+-----------------------------------------+

-- Invalid date (returns NULL)
SELECT TO_ISO8601('2023-02-30') AS invalid_date;
+--------------+
| invalid_date |
+--------------+
| NULL         |
+--------------+

-- Input is NULL (returns NULL)
SELECT TO_ISO8601(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```
