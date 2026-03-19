---
{
  "title": "FROM_ISO8601_DATE",
  "language": "ja",
  "description": "ISO8601形式の日付表現をDATE型の日付表現に変換します。ISO 8601標準に準拠した日付文字列は、"
}
---
## 説明

ISO8601形式の日付表現をDATE型の日付表現に変換します。
ISO 8601標準に準拠した日付文字列で、サポートされる形式は以下のとおりです：

- YYYY: 年のみ（その年の1月1日を返す）
- YYYY-MM: 年と月（その月の1日を返す）
- YYYY-DDD: 年 + 年間通算日（DDDの範囲は1-366、例：0000-059は0000年の59日目を表す）
- YYYY-WWW: 年 + 週番号（WWWの範囲は1-53、その週の月曜日を返す）
- YYYY-WWW-D: 年 + 週番号 + 曜日（Dの範囲は1-7、1は月曜日、7は日曜日を表す）
- この形式では、年の最初の週はその週の木曜日を含む必要があり、そうでなければ前年の週として数えられる

## 構文

```sql
from_iso8601_date(<dt>)
```
## パラメータ

| Parameter | Description |
| -- | -- |
| `<date>` | ISO8601形式の日付、文字列型 |

## 戻り値

YYYY-MM-DD形式のDATE型を返します。解析された特定の日付を表します。

- 入力形式が無効な場合、NULLを返します；
- 結果が有効なdatetime値でない場合、NULLを返します；
- 入力がNULLの場合、NULLを返します。

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

-- Parse "YYY-MMM-D" format (each week starts with Monday), since 0522-01-01 is Thursday, dates before the first week will return year 0521
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

---YYY-MMM format, Monday of the first week is in year 521
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
