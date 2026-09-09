---
{
    "title": "SHOW COMPUTE GROUPS",
    "language": "en",
    "description": "In the compute storage separation mode, display a list of compute groups that the current user has permissions to use."
}
---

## Description

Displays the list of compute groups that the current user has permissions to use.

- **Compute-storage decoupled mode**: returns the list of compute groups that the current user has permissions to use.
- **Compute-storage coupled mode**: supported since version 4.1.4. In this mode, the resource groups of the BEs (the `location` tag) are mapped to compute groups. Before 4.1.4, executing this statement in this mode reports `ERR_NOT_CLOUD_MODE`.

## Syntax

```sql
SHOW COMPUTE GROUPS
```

## Return Value

Returns a list of compute groups that the current user has permissions for. The returned columns differ between the two modes.

**Compute-storage decoupled mode:**

- Name - The name of the compute group
- IsCurrent - Whether the current user is using this compute group
- Users - Usernames that have set this compute group as their default compute group
- BackendNum - The number of backends this compute group has
- SubComputeGroups / Policy / Properties - Information about the virtual compute group

**Compute-storage coupled mode (4.1.4+):**

- Name - The name of the compute group, that is, the resource group (`location` tag) of the BEs
- BackendNum - The number of backends in this compute group

The results are sorted by compute group name.

## Example

Specify the use of the compute group named `compute_cluster`.

```sql
SHOW COMPUTE GROUPS;
```

The result is:

```sql
+-----------------+-----------+-------+------------+
| Name            | IsCurrent | Users | BackendNum |
+-----------------+-----------+-------+------------+
| compute_cluster | TRUE      |       | 3          |
+-----------------+-----------+-------+------------+
```

## Access Control Requirements

Since version 4.1.4, executing this statement in the compute-storage coupled mode **no longer requires the global `ADMIN_PRIV` or `NODE_PRIV`**, which is consistent with the compute-storage decoupled mode: the current user only sees the resource groups that its own compute group is allowed to use.

## Usage Note

- If the current user has no permissions for any compute group, `SHOW COMPUTE GROUPS` will return an empty list.
- In the compute-storage coupled mode, an empty result set is also returned when the compute group of the current session is `INVALID_COMPUTE_GROUP`.
- `SHOW CLUSTERS` is the equivalent statement. In the compute-storage coupled mode, its columns are named `cluster` and `backend_num`.
