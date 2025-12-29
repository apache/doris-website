---
{
    "title": "SHOW WORKLOAD GROUPS",
    "language": "en",
    "description": "This statement is used to display the resource groups for which the current user has usagepriv privileges."
}
---

## Description

This statement is used to display the resource groups for which the current user has usage_priv privileges.

## Syntax

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```

## Usage Notes

This statement only does a simple display of workload groups, for a more complex display refer to tvf workload_groups().

## Examples

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

2. Show workload groups using pattern
    
    ```sql
    mysql> show workload groups like "normal%";
    +----------+--------+--------------------------+---------+
    | Id       | Name   | Item                     | Value   |
    +----------+--------+--------------------------+---------+
    | 10343386 | normal | cpu_share                | 10      |
    | 10343386 | normal | memory_limit             | 30%     |
    | 10343386 | normal | enable_memory_overcommit | true    |
    +----------+--------+--------------------------+---------+
    ```