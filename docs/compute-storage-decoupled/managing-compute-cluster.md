---
{
    "title": "Managing Compute Groups",
    "language": "en"
}
---

In a compute-storage decoupled architecture, one or more compute nodes (BE) can be grouped into a Compute Group. This document describes how to use compute groups, including operations such as:

- Viewing all compute groups
- Granting compute group access
- Binding compute groups at the user level (`default_compute_group`) for user-level isolation

*Note*
In versions prior to 3.0.2, this was referred to as a Compute Cluster.

## Compute Group Usage Scenarios

In a multi-compute group architecture, you can group one or more stateless BE nodes into compute clusters. By using compute cluster specification statements (use @<compute_group_name>), you can allocate specific workloads to specific compute clusters, achieving physical isolation of multiple import and query workloads.

Assume there are two compute clusters: C1 and C2.

- **Read-Read Isolation**: Before initiating two large queries, use `use @c1` and `use @c2` respectively to ensure that the queries run on different compute nodes. This prevents resource contention (CPU, memory, etc.) when accessing the same dataset.

- **Read-Write Isolation**: Doris data imports consume substantial resources, especially in scenarios with large data volumes and high-frequency imports. To avoid resource contention between queries and imports, you can use `use @c1` and `use @c2` to specify that queries execute on C1 and imports on C2. Additionally, the C1 compute cluster can access newly imported data in the C2 compute cluster.

- **Write-Write Isolation**: Similar to read-write isolation, imports can also be isolated from each other. For example, when the system has both high-frequency small imports and large batch imports, batch imports typically take longer and have higher retry costs, while high-frequency small imports are quick with lower retry costs. To prevent small imports from interfering with batch imports, you can use `use @c1` and `use @c2` to specify small imports to execute on C1 and batch imports on C2.

## Default Compute Group Selection Mechanism

When a user has not explicitly [set a default compute group](#setting-default-compute-group), the system will automatically select a compute group with Active BE that the user has usage permissions for. Once the default compute group is determined in a specific session, it will remain unchanged during that session unless the user explicitly changes the default setting.

In different sessions, if the following situations occur, the system may automatically change the user's default compute group:

- The user has lost usage permissions for the default compute group selected in the last session
- A compute group has been added or removed
- The previously selected default compute group no longer has Alive BE

Situations one and two will definitely lead to a change in the automatically selected default compute group, while situation three may lead to a change.

## Viewing All Compute Groups

Use the `SHOW COMPUTE GROUPS` command to view all compute groups in the current repository. The returned results will display different content based on the user's permission level:

- Users with `ADMIN` privileges can view all compute groups
- Regular users can only view compute groups for which they have usage permissions (USAGE_PRIV)
- If a user doesn't have usage permissions for any compute groups, an empty result will be returned


```sql
SHOW COMPUTE GROUPS;
```

## Adding Compute Groups

Managing compute groups requires `OPERATOR` privilege, which controls node management permissions. For more details, please refer to [Privilege Management](../sql-manual/sql-statements/account-management/GRANT-TO). By default, only the root account has the `OPERATOR` privilege, but it can be granted to other accounts using the `GRANT` command.
To add a BE and assign it to a compute group, use the [Add BE](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) command. For example:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

The above sql will add `host:9050` to compute group `new_group`. The BE will be added to compute group `default_compute_group` if you omit PROPERTIES statement, for example:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

## Granting Compute Group Access
Prerequisite: The current operating user has' ADMIN 'permission, or the current user belongs to the admin role.

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user}
```

## Revoking Compute Group Access
Prerequisite: The current operating user has' ADMIN 'permission, or the current user belongs to the admin role.

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user}
```

## Setting Default Compute Group 

To set the default compute group for the current user(This operation requires the current user to already have permission to use the computing group):

```sql
SET PROPERTY 'default_compute_group' = '{clusterName}';
```

To set the default compute group for other users (this operation requires Admin privileges):

```sql
SET PROPERTY FOR {user} 'default_compute_group' = '{clusterName}';
```

To view the current user's default compute group, the value of `default_compute_group` in the returned result is the default compute group:

```sql
SHOW PROPERTY;
```

To view the default compute group of other users, This operation requires the current user to have admin privileges, and the value of `default_compute_group` in the returned result is the default compute group:

```sql
SHOW PROPERTY FOR {user};
```

To view all available compute groups in the current repository:

```sql
SHOW COMPUTE GROUPS;
```

:::info Note

- If the current user has an Admin role, for example: `CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`, then:
  - They can set the default compute group for themselves and other users;
  - They can view their own and other users' `PROPERTY`.
- If the current user does not have an Admin role, for example: `CREATE USER jack1 IDENTIFIED BY '123456'`, then:
  - They can set the default compute group for themselves;
  - They can view their own `PROPERTY`;
  - They cannot view all compute groups, as this operation requires `GRANT ADMIN` privileges.
- If the current user has not configured a default compute group, the existing system will trigger an error when performing data read/write operations. To resolve this issue, the user can execute the `use @cluster` command to specify the compute group used by the current context, or use the `SET PROPERTY` statement to set the default compute group.
- If the current user has configured a default compute group, but that cluster is subsequently deleted, an error will also be triggered during data read/write operations. The user can execute the `use @cluster` command to re-specify the compute group used by the current context, or use the `SET PROPERTY` statement to update the default cluster settings.

:::


## Switching Compute Groups

Users can specify the database and compute group to use in a compute-storage decoupled architecture.

**Syntax**

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

If the database or compute group name contains reserved keywords, the corresponding name must be enclosed in backticks ```.
 
## Scaling Compute Groups

You can scale compute groups by adding or removing BE using `ALTER SYSTEM ADD BACKEND` and `ALTER SYSTEM DECOMMISION BACKEND`.

### Load Rebalancing After Scaling

Cloud rebalance is a load balancing operation in Doris's compute-storage decoupled architecture. It is used to rebalance read and write traffic across the compute group after scaling (adding or removing) backend nodes in different Compute Groups. A node that has been offline for an extended period is considered as removed.

#### Balance Strategy Types

:::caution

The `balance_type` feature is supported starting from Doris 3.1.3 and Doris 4.0.2.  
Prior to these versions, only the FE global configuration `enable_cloud_warm_up_for_rebalance` was available to control whether warm up tasks are executed during rebalance.

:::

The following table describes three strategy types, using the example of adding nodes to a Compute Group:

| Type | Time to Service | Performance Fluctuation | Technical Principle | Use Cases |
| :--- | :---: | :---: | :-- | :-- |
  | `without_warmup` | Fastest | Highest fluctuation | FE directly modifies shard mapping; first read/write has no file cache and needs to fetch from S3 | Scenarios requiring quick node deployment with low sensitivity to performance jitter |
| `async_warmup` | Faster | Possible cache miss | Issues warm up tasks, modifies mapping after success or timeout; attempts to pull file cache to new BE during mapping switch, some scenarios may still miss on first read | General scenarios with acceptable performance |
| `sync_warmup` | Slower | Minimal cache miss | Issues warm up tasks, FE modifies mapping only after task completion, ensuring cache migration | Scenarios with extremely high performance requirements after scaling, requiring file cache to exist on new nodes |

#### User Interface

##### Global Default Balance Type

Set the global default value through FE configuration (fe.conf):

```
cloud_default_rebalance_type = "async_warmup"
```

##### Compute Group-Level Configuration

You can configure balance type for each Compute Group separately:

```sql
ALTER COMPUTE GROUP cg1 PROPERTIES("balance_type"="async_warmup");
```

##### Configuration Rules

1. If a Compute Group does not have `balance_type` configured, it uses the global default value `async_warmup`.
2. If a Compute Group has `balance_type` configured, that configuration takes priority during rebalance.

#### FAQ

##### How to View and Modify Global Rebalance Type?

- **View**: Execute `ADMIN SHOW FRONTEND CONFIG LIKE "cloud_default_rebalance_type";`
- **Modify**: Execute `ADMIN SET FRONTEND CONFIG ("cloud_warm_up_for_rebalance_type" = "without_warmup");` (takes effect without restarting FE)

##### How to Query Compute Group Balance Type?

Execute `SHOW COMPUTE GROUPS;`. The `properties` column in the result contains Compute Group attribute information, including the `balance_type` configuration.

##### How to Determine if the Cluster is in a Stable Tablet State?

1. **Check via `SHOW BACKENDS`**: Check if the tablet counts across BEs are close. Reference calculation range:  
   ```
   (Total tablets in cluster / Compute Group BE count) * 0.95 
   ~ 
   (Total tablets in cluster / Compute Group BE count) * 1.05
   ```  
   The value 0.05 is the default value of the FE configuration `cloud_rebalance_percent_threshold`. To make tablet distribution more uniform across BEs in the Compute Group, you can reduce this configuration value.

2. **Observe via FE Metrics**: Check the `doris_fe_cloud_.*_balance_num` series of metrics in FE metrics. If there is no change for an extended period, it indicates the Compute Group has reached a balanced state. It is recommended to configure these metrics on a monitoring dashboard for continuous observation and judgment.  
   ```bash
   curl "http://feip:fe_http_port/metrics" | grep '_balance_num'
   ```



## Renaming Compute Group

You can use the `ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>` command to rename an existing compute group. Please refer to the SQL Manual on [Renaming Compute Groups](../sql-manual/sql-statements/cluster-management/instance-management/ALTER-SYSTEM-RENAME-COMPUTE-GROUP).

Note
After renaming a compute group, users who had permissions for the old name (old_name) or had set the old name as the default compute group (default_compute_group) will not have their permissions automatically updated to the new name (new_name). Permissions need to be reset by an account with administrative privileges. This is consistent with the permission system of MySQL databases.