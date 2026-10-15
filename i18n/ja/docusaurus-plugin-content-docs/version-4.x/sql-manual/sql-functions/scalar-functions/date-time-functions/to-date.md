---
{
    "title": "TO_DATE",
    "language": "ja",
    "description": "この関数は CAST(<STRING> TO DATE) と同等です。"
}
---

## 説明

この関数は `CAST(<STRING> TO DATE)` と同等です。

TO_DATE 関数は日時値を DATE 型（YYYY-MM-DD 形式の年、月、日のみを含む）に変換します。入力値の時刻部分（時、分、秒、マイクロ秒）を自動的に無視し、日付部分のみを抽出して変換します。

## 構文
```sql
TO_DATE(`<datetime_value>`)
```

## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<datetime_value>` | DATETIME 型の日時値。DATETIME 形式をサポートします。日時の形式については[日時型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。 |

## 戻り値

DATE 型の値を返します。入力が NULL の場合は NULL を返します。

## 例

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
