---
{
    "title": "TO_DATE",
    "language": "ja",
    "description": "この関数は CAST(<STRING> TO DATE) と同等です。"
}
---

## 説明

この関数は `CAST(<STRING> TO DATE)` と同等です。

TO_DATE 関数は、日時の値を DATE 型（年、月、日のみを含む YYYY-MM-DD 形式）に変換します。入力の時刻部分（時、分、秒、マイクロ秒）は自動的に無視され、日付部分のみが抽出されて変換されます。

## 構文
```sql
TO_DATE(`<datetime_value>`)
```

## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<datetime_value>` | `DATETIME` または `TIMESTAMP_NS` 型の値。時刻および小数秒の部分は無視されます。 |

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
