---
{
"title": "ALTER COLOCATE GROUP",
"language": "en"
}
---

## Description

This statement is used to modify the properties of a Colocation Group.

## Syntax

```sql
ALTER COLOCATE GROUP  [<database>.] <group_name>
SET (
    <property_list>
);
```
## Required Parameters

**1. `<group_name>`**

Specify the name of the colocate group to be modified.

**2.`<property_list>`**

`property_list` is a property of the `colocation group`, and currently only supports modifying `replication_num` and `replication_allocation`. After modifying these two properties of the `colocation group`, simultaneously change the properties `default.replication_allocation`, `dynamic.replication_allocation`, and replication_allocation of the existing partitions of the group's tables to be the same as it.

## Optional Parameters

**1. `<database>`**

Specify the database to which the `colocate group` to be modified belongs.

Note:
1. If the colocate group is global, that is, its name starts with __global__, then it does not belong to any Database

## Access Control Requirements
Requires `ADMIN` permissions.

## Examples

1. Modify the replica number of a global group, and set `"colocate_with" = "__global__foo"` when creating the table.

```sql
ALTER COLOCATE GROUP __global__foo
SET (
    "replication_num"="1"
    );
```

2. Modify the replica number of a non-global group, and set "colocate_with" = "bar" when creating the table, and the table belongs to Database example_db.
 ```sql 
ALTER COLOCATE GROUP example_db.bar
SET (
    "replication_num"="1"
    );
```
