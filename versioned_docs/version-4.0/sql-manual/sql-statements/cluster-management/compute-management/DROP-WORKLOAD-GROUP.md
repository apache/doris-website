---
{
    "title": "DROP WORKLOAD GROUP",
    "language": "en"
}
---

## Description

This statement is used to delete a workload group.

## Syntax

```sql
DROP WORKLOAD GROUP [IF EXISTS] '<rg_name>'
```

## Examples

1. Delete the workload group named g1:
    
    ```sql
    drop workload group if exists g1;
    ```