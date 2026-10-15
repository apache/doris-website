---
{
    "title": "TO_DAYS",
    "language": "ja",
    "description": "日付を通算日数に変換する日付計算関数"
}
---

## 説明
日付を通算日数に変換する日付計算関数です。基準日 (`0000-00-00`) から指定日までの通算日数を計算します。

この関数の動作は、MySQL の [to_days 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_to-days) と同じです。

## 構文

```sql
TO_DAYS(`<date_or_date_expr>`)
```

## パラメータ
| パラメータ | 説明 |
|-----------|------|
| `<date_or_time_expr>` | 入力する日時値。date/datetime 型に対応します。日時形式と日付形式については、[日時変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[日付変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

日数を表す BIGINT 型の値を返します。

## 使用例

```sql
-- Based on the date `0000-00-00`
select to_days('0000-01-01');
+-----------------------+
| to_days('0000-01-01') |
+-----------------------+
|                     1 |
+-----------------------+

--input date type
select to_days('2007-10-07');
+-----------------------+
| to_days('2007-10-07') |
+-----------------------+
|                733321 |
+-----------------------+

--input datetime type
select to_days('2007-10-07 10:03:09');
+--------------------------------+
| to_days('2007-10-07 10:03:09') |
+--------------------------------+
|                         733321 |
+--------------------------------+
```
