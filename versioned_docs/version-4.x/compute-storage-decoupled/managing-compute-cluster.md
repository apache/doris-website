---
{
    "title": "Compute Group Management: Create, Authorize, Switch, and Scale Operations Guide",
    "sidebar_label": "Manage Compute Groups",
    "language": "en",
    "description": "Describes all management operations for compute groups in a compute-storage decoupled architecture, including creation, permission granting, default group configuration, switching, and scaling.",
    "keywords": ["compute group", "Compute Group", "compute-storage decoupled", "compute group authorization", "compute group scaling", "read-write separation", "load balancing"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cluster management / Resource isolation / Load distribution -->

In a compute-storage decoupled architecture, one or more compute nodes (BE) can be grouped into a **compute group**. This document describes the complete set of management operations for compute groups, including viewing, adding, authorizing, setting the default group, switching, and scaling.

:::note Version Note
In versions before 3.0.2, compute groups were called **compute clusters**.
:::

## Compute Group Use Cases

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Multi-tenant isolation / Read-write separation / Load isolation -->

In a multi-compute-group architecture, you can use the `USE @<compute_group_name>` statement to route specific workloads to a designated compute group, achieving physical isolation across different workload types.

The following scenarios assume two compute groups, C1 and C2:

| Scenario | Description | How to Operate |
| :--- | :--- | :--- |
| **Read-read isolation** | Two large queries run on separate compute nodes, avoiding CPU/memory resource contention | Query 1 uses `USE @c1`; Query 2 uses `USE @c2` |
| **Read-write isolation** | Avoids resource contention between ingestion and queries; C1 can access data newly ingested in C2 | Queries use `USE @c1`; ingestion uses `USE @c2` |
| **Write-write isolation** | High-frequency small ingestion and large-batch ingestion run separately to avoid mutual interference | Small ingestion uses `USE @c1`; batch ingestion uses `USE @c2` |

## Default Compute Group Selection Mechanism

<!-- Knowledge type: System behavior description -->

When the user has not explicitly [set a default compute group](#set-the-default-compute-group), the system automatically selects a compute group that meets the following conditions:

- The compute group has at least one live compute node.
- The current user has the USAGE_PRIV permission on that compute group.

Within the same session, the default compute group remains unchanged unless the user explicitly changes it. Across sessions, the system may automatically switch the default compute group if any of the following conditions occur:

| Trigger Condition | Always Switches |
| :--- | :---: |
| The user loses USAGE_PRIV on the previously selected compute group | Yes |
| A compute group is added or removed | Yes |
| The previously selected compute group no longer has live compute nodes | Possibly |

## View All Compute Groups

<!-- Knowledge type: Operational steps -->

**Purpose**: View all compute groups in the current repository.

**Command**:

```sql
SHOW COMPUTE GROUPS;
```

**Description**: The returned results vary based on the user's permission level:

- Users with `ADMIN` permission can view all compute groups.
- Regular users can only view the compute groups for which they have `USAGE_PRIV` permission.
- If the user has no USAGE_PRIV on any compute group, the result is empty.

## Add a Compute Group

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cluster initialization / Adding compute resources -->

**Prerequisites**: The `OPERATOR` permission (node management permission) is required. By default, only the root account has this permission. You can grant it to other accounts using the `GRANT` command. See [Permission Management](../sql-manual/sql-statements/account-management/GRANT-TO) for details.

**Purpose**: Add a BE node and assign it to a compute group.

**Command (specify a compute group)**:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

**Command (use the default compute group)**: If no compute group is specified, the node joins `default_compute_group` by default:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

See the [ADD BACKEND SQL Reference](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) for details.

## Grant Compute Group Access

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Multi-user permission management -->

**Prerequisites**: The current user has `ADMIN` permission, or belongs to the admin role.

**Purpose**: Grant a specified user the USAGE_PRIV permission on a compute group.

**Command**:

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user};
```

## Revoke Compute Group Access

<!-- Knowledge type: Operational steps -->

**Prerequisites**: The current user has `ADMIN` permission, or belongs to the admin role.

**Purpose**: Revoke a specified user's USAGE_PRIV permission on a compute group.

**Command**:

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user};
```

## Set the Default Compute Group

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: User-level resource isolation -->

### Set for the Current User

**Prerequisites**: The current user already has USAGE_PRIV on the target compute group.

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```

### Set for Another User

**Prerequisites**: The current user has Admin permission.

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```

### View the Default Compute Group

View the default compute group for the current user. The value of `default_compute_group` in the result is the default compute group:

```sql
SHOW PROPERTY;
```

View the default compute group for another user (requires admin permission):

```sql
SHOW PROPERTY FOR {user};
```

### Permission Description

| User Role | Operable Scope |
| :--- | :--- |
| Admin user (e.g., `CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`) | Can set the default compute group for themselves and other users; can view the `PROPERTY` of themselves and other users |
| Regular user (e.g., `CREATE USER jack1 IDENTIFIED BY '123456'`) | Can only set the default compute group for themselves; can only view their own `PROPERTY`; cannot view all compute groups (requires `GRANT ADMIN` permission) |

:::caution Note

- If the current user has not configured a default compute group, an error is triggered when performing data read or write operations. Use the `USE @cluster` command to specify the compute group for the current session, or use the `SET PROPERTY` statement to set a default compute group.
- If the current user has configured a default compute group but that compute group is subsequently deleted, an error is also triggered when performing data read or write operations. Use the `USE @cluster` command to reassign a compute group, or use `SET PROPERTY` to update the default compute group setting.

:::

## Switch Compute Groups

<!-- Knowledge type: Operational steps -->

**Purpose**: Specify the database and compute group to use in the current session under a compute-storage decoupled architecture.

**Syntax**:

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

**Description**: If a database name or compute group name contains a reserved keyword, enclose the relevant name in backticks (`` ` ``).

## Scale Compute Groups

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Elastic scaling / Capacity planning -->

Use the following commands to add or remove BE nodes and scale a compute group:

- **Scale out**: `ALTER SYSTEM ADD BACKEND`
- **Scale in**: `ALTER SYSTEM DECOMMISSION BACKEND`

### Load Rebalancing After Scaling

Cloud Rebalance is the load balancing mechanism in Doris's compute-storage decoupled architecture. When BE nodes in a compute group are scaled (a node that has been offline for a long time is treated as a scale-in event), the system automatically rebalances the read and write traffic distribution across the cluster.

#### Balance Strategy Types

<!-- Knowledge type: Configuration parameters -->

:::caution Version Support

The `balance_type` feature is supported starting from **Doris 3.1.3** and **Doris 4.0.2**. Before these versions, only the FE global configuration `enable_cloud_warm_up_for_rebalance` was available to control whether warm-up tasks are executed during rebalance.

:::

The following example describes the three strategy types using a scale-out scenario:

| Strategy Type | Time Until New Node Is Ready | Performance Impact | Technical Principle | Applicable Scenarios |
| :--- | :---: | :---: | :--- | :--- |
| `without_warmup` | Fastest | Largest | FE directly updates the shard mapping; the first read/write has no file cache and must fetch data from S3 | Suitable when the new node must come online quickly and performance fluctuation is acceptable |
| `async_warmup` | Faster | Possible cache misses | A warm-up task is issued; the mapping is updated after the task succeeds or times out; the system tries to populate the file cache during the mapping switch, but some first reads may still miss | General purpose; acceptable performance |
| `sync_warmup` | Slower | Virtually no cache misses | A warm-up task is issued; FE modifies the mapping only after confirming the task is complete, ensuring cache migration is finished | Suitable when high performance is required after scaling and new nodes must have a populated file cache |

#### Configuration

##### Global Default Balance Type

Set the global default value in the FE configuration file (`fe.conf`):

```
cloud_warm_up_for_rebalance_type = "async_warmup"
```

##### Compute Group-Level Configuration

You can configure the balance type for each compute group individually:

```sql
ALTER COMPUTE GROUP cg1 PROPERTIES("balance_type"="async_warmup");
```

##### Configuration Priority Rules

1. If a compute group has no `balance_type` configured, the global default value `async_warmup` is used.
2. If a compute group has a `balance_type` configured, that group's configuration takes priority when rebalance is executed.

## Rename a Compute Group

<!-- Knowledge type: Operational steps -->

**Purpose**: Rename an existing compute group to a new name.

**Command**:

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>;
```

:::caution Note

After renaming, user permissions and default compute group settings associated with the original compute group name (`old_name`) are **not** automatically updated to the new name (`new_name`). An account with administrator privileges must manually re-grant permissions. This behavior is consistent with the MySQL permission system.

:::

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting / Permission issues / Performance tuning -->

### How Do I View and Modify the Global Rebalance Type?

- **View**:
    ```sql
    ADMIN SHOW FRONTEND CONFIG LIKE "cloud_warm_up_for_rebalance_type";
    ```
- **Modify** (takes effect without restarting FE):
    ```sql
    ADMIN SET FRONTEND CONFIG ("cloud_warm_up_for_rebalance_type" = "without_warmup");
    ```

### How Do I Query the Balance Type of a Compute Group?

Run `SHOW COMPUTE GROUPS;`. The `properties` column in the result contains the attributes of each compute group, where you can view the `balance_type` configuration.

### How Do I Determine Whether the Cluster Is in a Stable Tablet State?

**Method 1: Check via `SHOW BACKENDS`**

Check whether the tablet count across BE nodes is approximately balanced. Reference range:

```
(total tablets in cluster / number of BEs in Compute Group) × 0.95
~
(total tablets in cluster / number of BEs in Compute Group) × 1.05
```

Here 0.05 is the default value of the FE configuration item `cloud_rebalance_percent_threshold`. To make the tablet distribution across BE nodes more uniform, reduce this configuration value.

**Method 2: Observe via FE Metrics**

Check the `doris_fe_cloud_.*_balance_num` metrics series in the FE metrics. If the values remain unchanged for an extended period, the compute group has reached a balanced state. It is recommended to configure these metrics in your monitoring dashboard for continuous observation:

```bash
curl "http://feip:fe_http_port/metrics" | grep '_balance_num'
```

### What Should I Do If a "No Default Compute Group Configured" Error Occurs During Data Read/Write?

Resolve the issue using one of the following methods:

1. Use the `USE @cluster` command to temporarily specify the compute group for the current session.
2. Use `SET PROPERTY 'default_compute_group' = '{clusterName}'` to permanently set the default compute group.

### What Should I Do If an Error Occurs After the Default Compute Group Is Deleted?

After a compute group is deleted, users that depend on that compute group encounter errors during read/write operations. Resolution options:

1. Use the `USE @cluster` command to reassign a compute group for the current session.
2. Use `SET PROPERTY` to update the default compute group to another valid compute group.
