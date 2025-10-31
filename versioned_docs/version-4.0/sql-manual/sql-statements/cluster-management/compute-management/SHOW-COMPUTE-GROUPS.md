---
{
    "title": "SHOW COMPUTE GROUPS",
    "language": "en"
}
---

## Description

In the compute storage separation mode, display a list of compute groups that the current user has permissions to use.

## Syntax

```sql
SHOW COMPUTE GROUPS
```

## Return Value

Returns a list of compute groups that the current user has permissions for.

- Name - The name of the compute group
- IsCurrent - Whether the current user is using this compute group
- Users - Usernames that have set this compute group as their default compute group
- BackendNum - The number of backends this compute group has

## Example

Specify the use of the compute group named `compute_cluster`.

```sql
SHOW COMPUTE GROUPS;
```

The result is:

```sql
+-----------------+-----------+-------+------------+
| Name           | IsCurrent  | Users | BackendNum |
+-----------------+-----------+-------+------------+
| compute_cluster | TRUE      |       | 3          |
+-----------------+-----------+-------+------------+
```

## Usage Note

If the current user has no permissions for any compute group, `SHOW COMPUTE GROUPS` will return an empty list.