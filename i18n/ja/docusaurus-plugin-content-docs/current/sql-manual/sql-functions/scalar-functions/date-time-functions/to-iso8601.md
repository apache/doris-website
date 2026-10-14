---
{
    "title": "TO_ISO8601 | 日付・時刻関数",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ の値を ISO8601 形式の文字列に変換します。",
    "sidebar_label": "TO_ISO8601"
}
---

# TO_ISO8601

## 説明

`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` の値を ISO8601 形式の文字列に変換します。
返される ISO8601 形式の日時は YYYY-MM-DDTHH:MM:SS と表記され、T は日付と時刻の区切り文字です。

## 構文

```sql
TO_ISO8601(`<date_or_date_expr>`)
```

## 引数
| 引数 | 説明 |
|-----------|-------------|
| `<date_or_date_expr>` | 入力する日時の値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型をサポートします。各型の具体的な書式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

ISO8601 形式の日時を表す VARCHAR 型の文字列を返します。

- 入力が DATE の場合（例：'2023-10-05'）、YYYY-MM-DD 形式（日付のみ）で返します。
- 入力が DATETIME の場合（例：'2023-10-05 15:30:25'）、YYYY-MM-DDTHH:MM:SS.xxxxxx 形式で返します（日付と時刻は T で区切られ、xxxxxx はすべてゼロです。入力日時の小数秒は秒単位に丸められます）。
- 入力が TIMESTAMP_NS の場合、YYYY-MM-DDTHH:MM:SS.nnnnnnnnn 形式で返し、小数秒の九桁をすべて保持します。
- 入力が TIMESTAMPTZ の場合（例：'2023-10-05 15:30:25+03:00'）、YYYY-MM-DDTHH:MM:SS.xxxxxx±HH:MM 形式で返します（オフセットは、`time_zone` セッション変数に従って local_time に変換した後の値を反映します）。
- 入力が NULL の場合、NULL を返します。

## 使用例

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
