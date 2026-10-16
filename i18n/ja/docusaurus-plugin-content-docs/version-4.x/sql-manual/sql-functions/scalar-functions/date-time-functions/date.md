---
{
    "title": "DATE | 日付・時刻関数",
    "language": "ja",
    "description": "DATE 関数は、日付と時刻の両方を含む日時値から時刻情報を除き、日付部分だけを抽出します。",
    "sidebar_label": "DATE"
}
---

# DATE

## 説明

DATE 関数は、日付と時刻の両方を含む日時値から時刻情報を除き、日付部分だけを抽出します。この関数は DATETIME 型を DATE 型に変換し、年、月、日の情報だけを保持します。

この関数は MySQL の [DATE 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date) と同じ動作をします。

## 構文

```sql
DATE(<date_or_time_part>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_part>` | datetime 型の有効な日付式。datetime に対応します。日時と日付の具体的な形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください。 |

## 戻り値

入力が有効な場合、時刻部分を含まない DATE 型の日付値（YYYY-MM-DD 形式）を返します。
特殊な場合:
- 入力が NULL の場合は NULL を返します。

## 例

```sql
-- Extract the date part from a datetime
mysql> select date(cast('2010-12-02 19:28:30' as datetime));
+-----------------------------------------------+
| date(cast('2010-12-02 19:28:30' as datetime)) |
+-----------------------------------------------+
| 2010-12-02                                    |
+-----------------------------------------------+

-- Extract the date part from a date
mysql> select date(cast('2015-11-02' as date));
+----------------------------------+
| date(cast('2015-11-02' as date)) |
+----------------------------------+
| 2015-11-02                       |
+----------------------------------+

-- Input is NULL
mysql> select date(NULL);
+------------+
| date(NULL) |
+------------+
| NULL       |
+------------+

```
