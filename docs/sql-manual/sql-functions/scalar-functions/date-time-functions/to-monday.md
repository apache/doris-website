---
{
    "title": "TO_MONDAY",
    "language": "en"
}
---

## Description

Rounds a date or datetime down to the nearest Monday. As a special case, the date parameters 1970-01-01, 1970-01-02, 1970-01-03, and 1970-01-04 return the date 1970-01-01.

## Syntax

```sql
TO_MONDAY(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_date_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns DATE type (format YYYY-MM-DD), representing the Monday of the week containing the input date.

- If input is any of 1970-01-01, 1970-01-02, 1970-01-03, 1970-01-04, always returns 1970-01-01;
- If input is NULL, returns NULL;

## Examples

```sql
-- 2022-09-10 is Saturday, returns the Monday of that week (2022-09-05)
SELECT TO_MONDAY('2022-09-10') AS result;
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
