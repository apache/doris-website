---
{
    "title": "EXPLODE_NUMBERS",
    "language": "en",
    "description": "The explodenumbers table function takes an integer n and expands all numbers within the range into multiple rows, each containing a single number."
}
---

## Description

The `explode_numbers` table function takes an integer n and expands all numbers within the range into multiple rows, each containing a single number. It is commonly used to generate a sequence of consecutive numbers and is often paired with LATERAL VIEW.

`explode_numbers_outer`, unlike `explode_numbers`, adds a NULL row when the table function generates zero rows.

## Syntax

```sql
EXPLODE_NUMBERS(<n>)
EXPLODE_NUMBERS_OUTER(<n>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<n>` | Integer type input |

## Return Value

Returns a sequence of [0, n).

- Does not return any rows when n is 0 or NULL.

## Examples

```sql
select e1 from (select 1 k1) as t lateral view explode_numbers(5) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
|    0 |
|    1 |
|    2 |
|    3 |
|    4 |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode_numbers(0) tmp1 as e1;
Empty set
```

```sql
select e1 from (select 1 k1) as t lateral view explode_numbers_outer(0) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
| NULL |
+------+
```