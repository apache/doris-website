---
{
    "title": "WORKLOAD_GROUPS",
    "language": "en"
}
---

## `workload_groups`

### Name

workload_groups

:::caution
Deprecated. Since 2.1.1, this table function has been moved to the information_schema.workload_groups.
:::

### description

Table-Value-Function, generate a temporary table named `workload_groups`. This tvf is used to view information about workload groups for which current user has permission.

This function is used in `FROM` clauses.

#### syntax

`workload_groups()`

The table schema of `workload_groups()` tvf:
```
mysql> desc function workload_groups();
+-------+-------------+------+-------+---------+-------+
| Field | Type        | Null | Key   | Default | Extra |
+-------+-------------+------+-------+---------+-------+
| Id    | BIGINT      | No   | false | NULL    | NONE  |
| Name  | STRING      | No   | false | NULL    | NONE  |
| Item  | STRING      | No   | false | NULL    | NONE  |
| Value | STRING      | No   | false | NULL    | NONE  |
+-------+-------------+------+-------+---------+-------+
```

### example
```
mysql> select * from workload_groups()\G
+-------+--------+--------------+-------+
| Id    | Name   | Item         | Value |
+-------+--------+--------------+-------+
| 11001 | normal | memory_limit | 100%  |
| 11001 | normal | cpu_share    | 10    |
+-------+--------+--------------+-------+
```

### keywords

    workload_groups
