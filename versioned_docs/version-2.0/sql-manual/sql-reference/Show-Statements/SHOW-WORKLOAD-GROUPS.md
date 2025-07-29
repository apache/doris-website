---
{
    "title": "SHOW-workload-GROUPS",
    "language": "en"
}
---

## SHOW-workload-GROUPS

### Name

SHOW workload GROUPS

 

### Description

This statement is used to display the resource groups for which the current user has usage_priv privileges.

grammar:

```sql
SHOW workload GROUPS;
```

Description:

This statement only does a simple display of workload groups, for a more complex display refer to tvf workload_groups().

### Example

1. Show all workload groups:
    
    ```sql
    mysql> show workload groups;
    +----------+--------+--------------------------+---------+
    | Id       | Name   | Item                     | Value   |
    +----------+--------+--------------------------+---------+
    | 10343386 | normal | cpu_share                | 10      |
    | 10343386 | normal | memory_limit             | 30%     |
    | 10343386 | normal | enable_memory_overcommit | true    |
    | 10352416 | g1     | memory_limit             | 20%     |
    | 10352416 | g1     | cpu_share                | 10      |
    +----------+--------+--------------------------+---------+
    ```

### Keywords

    SHOW, workload, GROUPS, GROUP

### Best Practice
