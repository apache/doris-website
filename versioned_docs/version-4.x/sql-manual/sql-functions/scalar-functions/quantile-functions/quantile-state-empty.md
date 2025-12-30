---
{
    "title": "QUANTILE_STATE_EMPTY",
    "language": "en",
    "description": "Return an empty quantilestate type column."
}
---

## Description

Return an empty `quantile_state` type column.

## Syntax

```sql
QUANTILE_STATE_EMPTY()
```

## Return value

An empty `quantile_state` type column.

## Example

```sql
select quantile_percent(quantile_union(quantile_state_empty()), 0)
```

Result is 

```text
+-------------------------------------------------------------+
| quantile_percent(quantile_union(quantile_state_empty()), 0) |
+-------------------------------------------------------------+
|                                                        NULL |
+-------------------------------------------------------------+
```
