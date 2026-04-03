---
{
  "title": "DATE | 日付時刻関数",
  "language": "ja",
  "description": "DATE関数は、datetime値（日付と時刻の両方を含む）から純粋な日付部分を抽出し、時刻情報を無視するために使用されます。",
  "sidebar_label": "DATE"
}
---
# DATE

## 説明

DATE関数は、datetime値（日付と時刻の両方を含む）から純粋な日付部分を抽出し、時刻情報を無視するために使用されます。この関数はDATETIME型をDATE型に変換し、年、月、日の情報のみを保持します。

この関数はMySQLの[date function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date)と一致しています。

## 構文

```sql
DATE(<date_or_time_part>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_part>` | datetime型の有効な日付式で、datetimeをサポートします。具体的なdatetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)を参照してください |

## 戻り値

入力が有効な場合、時刻部分を除いたDATE型の純粋な日付値（YYYY-MM-DD形式）を返します。
特殊なケース：
- 入力がNULLの場合、NULLを返します；

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
