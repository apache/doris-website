---
{
  "title": "TO_DATE",
  "description": "この関数は CAST(<STRING> TO DATE) と同等です。",
  "language": "ja"
}
---
## 説明

この関数は`CAST(<STRING> TO DATE)`と同等です。

TO_DATE関数は、datetime値をDATE型（年、月、日のみを含み、YYYY-MM-DD形式）に変換するために使用されます。この関数は入力から時間部分（時、分、秒、マイクロ秒）を自動的に無視し、日付部分のみを抽出して変換を行います。

## 構文

```sql
TO_DATE(`<datetime_value>`)
```
## パラメータ
| Parameter | デスクリプション |
|-----------|-------------|
| `<datetime_value>` | DATETIME型のdatetime値。DATETIME形式をサポートします。datetime形式については[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください |

## Return Value

DATE型を返します。

## Examples

```sql
-- Extract the date part from datetime
select to_date("2020-02-02 00:00:00");

+--------------------------------+
| to_date('2020-02-02 00:00:00') |
+--------------------------------+
| 2020-02-02                     |
+--------------------------------+

-- Input date, returns itself
select to_date("2020-02-02");
+-----------------------+
| to_date("2020-02-02") |
+-----------------------+
| 2020-02-02            |
+-----------------------+

-- Input NULL, returns NULL
SELECT TO_DATE(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
