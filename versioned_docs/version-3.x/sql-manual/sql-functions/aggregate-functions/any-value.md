---
{
    "title": "ANY_VALUE",
    "language": "en",
    "description": "Returns any value from the expression or column in the group. If there is a non-NULL value, it returns any non-NULL value; otherwise, it returns NULL."
}
---

## Description

Returns any value from the expression or column in the group. If there is a non-NULL value, it returns any non-NULL value; otherwise, it returns NULL.

## Alias

- ANY

## Syntax

```sql
ANY_VALUE(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression to be aggregated. |

## Return Value

Returns any non-NULL value if a non-NULL value exists, otherwise returns NULL.

## Example

```sql
select id, any_value(name) from cost2 group by id;
```

```text
+------+-------------------+
| id   | any_value(`name`) |
+------+-------------------+
|    3 | jack              |
|    2 | jack              |
+------+-------------------+
```
