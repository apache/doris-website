---
{
    "title": "Compute Group Management: Creation, Authorization, and Scaling",
    "sidebar_label": "Compute Group",
    "language": "en",
    "description": "In the storage-compute separation architecture, Compute Group provides physical workload isolation and supports creation, authorization, switching, and elastic scaling.",
    "keywords": ["Compute Group", "storage-compute separation", "compute cluster", "workload isolation", "elastic scaling", "workload management", "Compute Cluster", "BE management", "default compute group"]
}
---

<!-- Knowledge type: concept + procedure -->
<!-- Applicable scenario: workload isolation and resource management in the storage-compute separation architecture -->

**Compute Group** (called "Compute Cluster" in versions before 3.0.2) is the mechanism for physically isolating different workloads in the storage-compute separation architecture. One or more BE nodes form a Compute Group, and multiple Compute Groups access the same data through a shared storage layer.

![compute_group](/images/compute_group_workload_management.png)

**Key characteristics**:

- BE nodes are locally stateless, and data is stored on shared storage.
- Multiple Compute Groups share the same data without additional replicas.
- Adding or removing a Compute Group requires no data migration, only cache warm-up at query time.

Compared with Resource Group, Compute Group has the following advantages:

| Dimension | Compute Group | Resource Group |
|------|--------------|----------------|
| Storage cost | Data resides in shared storage. The number of Compute Groups is not limited by replica count, and cost does not increase with the number of groups. | Adding replicas means storage cost grows linearly. |
| Scaling flexibility | Adding a new Compute Group requires only cache warm-up, no data migration. | Adding a replica requires migrating a large amount of data. |
| Isolation completeness | The shared storage layer guarantees multiple replicas. A BE outage within a single Compute Group does not affect data loading. | A BE outage may cause data loading to fail. |

:::caution Note
In versions before 3.0.2, Compute Group is called Compute Cluster.
:::

## View Compute Groups

<!-- Knowledge type: procedure -->

View all Compute Groups under the current warehouse:

```sql
SHOW COMPUTE GROUPS;
```

## Add a Compute Group

<!-- Knowledge type: procedure -->

Use the [ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) command to add a BE node and specify the Compute Group it belongs to.

**Specify a Compute Group**:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

**Without specifying a Compute Group** (joins `default_compute_group` by default):

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

## Manage Compute Group Access Permissions

<!-- Knowledge type: procedure -->

### Grant access permission

Grant the usage permission of a specified Compute Group to a user:

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

### Revoke access permission

Revoke a user's usage permission on a specified Compute Group:

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## Set the Default Compute Group

<!-- Knowledge type: procedure -->
<!-- Applicable scenario: read/write errors when a user has not configured a default Compute Group -->

### Set and view the default Compute Group

| Operation | Command | Permission requirement |
|------|------|---------|
| Set the default Compute Group for the current user | `SET PROPERTY 'default_compute_group' = '{clusterName}';` | No additional permission required |
| Set the default Compute Group for another user | `SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';` | Requires Admin permission |
| View the default Compute Group of the current user | `SHOW PROPERTY;` | No additional permission required |
| View the default Compute Group of another user | `SHOW PROPERTY FOR {user};` | Requires the relevant view permission |

The value of the `default_compute_group` field in the returned result is the current default Compute Group.

### Permission description

**Admin user** (for example, `CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`):

- Can set the default Compute Group for themselves and for other users.
- Can view the `PROPERTY` of themselves and of other users.

**Regular user** (for example, `CREATE USER jack1 IDENTIFIED BY '123456'`):

- Can only set the default Compute Group for themselves.
- Can only view their own `PROPERTY`.
- Cannot execute `SHOW COMPUTE GROUPS` (the operation requires the `GRANT ADMIN` permission).

### FAQ

#### Q: An error occurs when performing data reads or writes
The current user has not configured a default Compute Group. Execute `use @cluster` to specify the Compute Group for the current session, or use `SET PROPERTY` to set a default value.

#### Q: A default Compute Group has been set, but reads and writes still report errors
The previously specified Compute Group has been deleted. Execute `use @cluster` to specify it again, or use `SET PROPERTY` to update the default setting.

## Automatic Selection of the Default Compute Group

<!-- Knowledge type: concept -->

When a user has not explicitly set a default Compute Group, the system automatically selects one that meets the following conditions:

- Has Active BE nodes.
- The current user has usage permission on it.

Within the same session, the default Compute Group remains unchanged. Across sessions, the following situations cause the system to re-select automatically:

| Trigger condition | Always changes |
|----------|------------|
| The user loses usage permission on the previously selected Compute Group | Always changes |
| A Compute Group is added or removed | Always changes |
| The previously selected Compute Group no longer has Active BE nodes | May change |

## Switch Compute Groups

<!-- Knowledge type: procedure -->

In the storage-compute separation architecture, you can specify the database and the Compute Group in the same statement:

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

If a database name or Compute Group name contains a reserved keyword, enclose the corresponding name with backticks (`` ` ``).

## Compute Group Scaling

<!-- Knowledge type: procedure -->
<!-- Applicable scenario: elastic scaling, workload adjustment -->

Use the addition or removal of BE nodes to elastically scale a Compute Group:

- **Scale out**: `ALTER SYSTEM ADD BACKEND` adds a new BE to the specified Compute Group.
- **Scale in**: `ALTER SYSTEM DECOMMISSION BACKEND` decommissions a BE from the Compute Group.

For detailed operations, see [Storage-compute separation operations](../../install/choosing-deployment-mode).
