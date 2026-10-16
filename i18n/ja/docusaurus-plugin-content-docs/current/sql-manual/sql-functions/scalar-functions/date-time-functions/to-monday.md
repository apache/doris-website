---
{
    "title": "TO_MONDAY",
    "language": "ja",
    "description": "DATE、DATETIME、または TIMESTAMP_NS の値が属する週の月曜日を返します。"
}
---

## 説明

日付または日時を、その日付が属する週の月曜日に切り下げます。例外として、日付引数が 1970-01-01、1970-01-02、1970-01-03、1970-01-04 の場合は、1970-01-01 を返します。

## 構文

```sql
TO_MONDAY(`<date_or_time_expr>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<date_or_date_expr>` | 入力する日時の値。DATE、DATETIME、TIMESTAMP_NS 型をサポートします。日時と日付の形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

入力した日付が属する週の月曜日を表す DATE 型の値（形式: YYYY-MM-DD）を返します。

- 入力が 1970-01-01、1970-01-02、1970-01-03、1970-01-04 のいずれかの場合は、常に 1970-01-01 を返します。
- 入力が NULL の場合は、NULL を返します。

## 例

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
