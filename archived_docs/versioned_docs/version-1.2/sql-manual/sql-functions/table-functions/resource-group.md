---
{
    "title": "RESOURCE_GROUPS",
    "language": "en"
}
---

## `resource_groups`

### Name

<version since="dev">

resource_groups

</version>

### description

Table-Value-Function, generate a temporary table named `resource_groups`. This tvf is used to view informations about current resource groups.

This function is used in `FROM` clauses.

#### syntax

`resource_groups()`

The table schema of `resource_groups()` tvf:
```
mysql> desc function resource_groups();
+-------+-------------+------+-------+---------+-------+
| Field | Type        | Null | Key   | Default | Extra |
+-------+-------------+------+-------+---------+-------+
| Id    | BIGINT      | No   | false | NULL    | NONE  |
| Name  | VARCHAR(64) | No   | false | NULL    | NONE  |
| Item  | VARCHAR(64) | No   | false | NULL    | NONE  |
| Value | INT         | No   | false | NULL    | NONE  |
+-------+-------------+------+-------+---------+-------+
```

### example
```
mysql> select * from resource_groups()\G
+-------+------------+-----------+-------+
| Id    | Name       | Item      | Value |
+-------+------------+-----------+-------+
| 10076 | group_name | cpu_share |     1 |
| 10077 | group_test | cpu_share |    10 |
+-------+------------+-----------+-------+
```

### keywords

    resource_groups