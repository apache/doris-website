---
{
    "title": "TO_DAYS",
    "language": "ja",
    "description": "日付を、基準日からの通算日数を表す数値に変換する日付計算関数です。"
}
---

## 説明
指定した日付を、基準日（`0000-00-00`）からの通算日数を表す数値に変換する日付計算関数です。

この関数は MySQL の [TO_DAYS 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_to-days)と同じ動作をします。

## 構文

```sql
TO_DAYS(`<date_or_date_expr>`)
```

## パラメーター
| パラメーター | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力する日時の値。DATE、DATETIME、TIMESTAMP_NS 型をサポートします。日時と日付の形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と [DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

日数を表す BIGINT 型の値を返します。

## 例

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
