---
{
  "title": "TO_MONDAY",
  "description": "日付またはdatetimeを最も近い月曜日まで切り下げます。特別なケースとして、日付パラメータ1970-01-01、1970-01-02、1970-01-03、",
  "language": "ja"
}
---
## 説明

日付または日時を最も近い月曜日まで切り下げます。特殊なケースとして、日付パラメータ1970-01-01、1970-01-02、1970-01-03、および1970-01-04は日付1970-01-01を返します。

## 構文

```sql
TO_MONDAY(`<date_or_time_expr>`)
```
## パラメータ

| Parameter | デスクリプション |
|-----------|-------------|
| `<date_or_date_expr>` | 入力datetime値、date/datetimeタイプをサポートします。datetimeとdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## Return Value

DATEタイプ（フォーマットYYYY-MM-DD）を返します。入力日付を含む週の月曜日を表します。

- 入力が1970-01-01、1970-01-02、1970-01-03、1970-01-04のいずれかの場合、常に1970-01-01を返します；
- 入力がNULLの場合、NULLを返します；

## Examples

```sql
-- 2022-09-10 is Saturday, returns the Monday of that week (2022-09-05)
SELECT TO_MONDAY('2022-09-10') AS result;
+------------+
| result     |
+------------+
| 2022-09-05 |
+------------+

-- input value of datetime type
SELECT TO_MONDAY('2022-09-10 12:22:15') AS result;
+------------+
| result     |
+------------+
| 2022-09-05 |
+------------+

-- Returns the Monday of the week for dates before 1970
SELECT TO_MONDAY('1022-09-10') AS result;
+------------+
| result     |
+------------+
| 1022-09-09 |
+------------+

-- Date that is already Monday: returns itself
SELECT TO_MONDAY('2023-10-09') AS result;  -- 2023-10-09 is Monday
+------------+
| result     |
+------------+
| 2023-10-09 |
+------------+

-- Special dates
SELECT TO_MONDAY('1970-01-02'),TO_MONDAY('1970-01-01'),TO_MONDAY('1970-01-03'),TO_MONDAY('1970-01-04');
+-------------------------+-------------------------+-------------------------+-------------------------+
| TO_MONDAY('1970-01-02') | TO_MONDAY('1970-01-01') | TO_MONDAY('1970-01-03') | TO_MONDAY('1970-01-04') |
+-------------------------+-------------------------+-------------------------+-------------------------+
| 1970-01-01              | 1970-01-01              | 1970-01-01              | 1970-01-01              |
+-------------------------+-------------------------+-------------------------+-------------------------+

-- Input NULL, returns NULL
SELECT TO_MONDAY(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
