---
{
    "title": "FROM_ISO8601_DATE",
    "language": "ja",
    "description": "ISO8601 形式の日付式を DATE 型の日付式に変換します。ISO 8601 規格に準拠した日付文字列をサポートします。"
}
---

## 説明

ISO8601 形式の日付式を DATE 型の日付式に変換します。
ISO 8601 規格に準拠した日付文字列について、次の形式をサポートします。

- YYYY: 年のみ（その年の 1 月の初日を返します）
- YYYY-MM: 年と月（その月の 1 日を返します）
- YYYY-DDD: 年と通算日（DDD の範囲は 1～366。たとえば、0000-059 は 0000 年の 59 日目を表します）
- YYYY-WWW: 年と週番号（WWW の範囲は 1～53。その週の月曜日を返します）
- YYYY-WWW-D: 年、週番号、曜日（D の範囲は 1～7。1 は月曜日、7 は日曜日を表します）
- この形式では、ある年の最初の週にはその年の木曜日が含まれている必要があります。含まれない場合、その週は前年の週として数えます。

## 構文

```sql
from_iso8601_date(<dt>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date>` | ISO8601 形式の文字列型の日付 |

## 戻り値

解析した日付を表す YYYY-MM-DD 形式の DATE 型の値を返します。

- 入力形式が無効な場合は NULL を返します。
- 解析結果が有効な日時値でない場合は NULL を返します。
- 入力が NULL の場合は NULL を返します。

## 例

```sql
-- Parse different ISO 8601 formatted date strings
select 
    from_iso8601_date('2023') as year_only, 
    from_iso8601_date('2023-10') as year_month, 
    from_iso8601_date('2023-10-05') as full_date; 

+------------+------------+------------+
| year_only  | year_month | full_date  |
+------------+------------+------------+
| 2023-01-01 | 2023-10-01 | 2023-10-05 |
+------------+------------+------------+

-- Parse "year-day number" format
select 
    from_iso8601_date('2021-001') as day_1,  
    from_iso8601_date('2021-059') as day_59, 
    from_iso8601_date('2021-060') as day_60,  
    from_iso8601_date('2024-366') as day_366; 
+------------+------------+------------+------------+
| day_1      | day_59     | day_60     | day_366    |
+------------+------------+------------+------------+
| 0000-01-01 | 0000-02-28 | 0000-03-01 | 2024-12-31 |
+------------+------------+------------+------------+

-- Parse "YYYY-Www-D" format (each week starts with Monday), since 0522-01-01 is Thursday, dates before the first week will return year 0521
select from_iso8601_date('0522-W01-1') as week_1;
+------------+
| week_1     |
+------------+
| 0521-12-29 |
+------------+
1 row in set (0.02 sec)

select from_iso8601_date('0522-W01-4') as week_4;
+------------+
| week_4     |
+------------+
| 0522-01-01 |
+------------+

---YYYY-Www format, Monday of the first week is in year 521
select from_iso8601_date('0522-W01') as week_1;
+------------+
| week_1     |
+------------+
| 0521-12-29 |
+------------+

---invalid style, return NULL
select from_iso8601_date('2023-10-01T12:34:10');
+------------------------------------------+
| from_iso8601_date('2023-10-01T12:34:10') |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+

---invalid result value, return NULL
select from_iso8601_date('2024-400');
+-------------------------------+
| from_iso8601_date('2024-400') |
+-------------------------------+
| NULL                          |
+-------------------------------+

---input NULL
select from_iso8601_date(NULL);
+-------------------------+
| from_iso8601_date(NULL) |
+-------------------------+
| NULL                    |
+-------------------------+
```
