---
{
"title": "Compute Group",
"language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

Compute Group is a mechanism for physical isolation between different workloads in a storage-compute separation architecture. The basic principle of Compute Group is illustrated in the diagram below:

![compute_group](/images/compute_group_workload_management.png)

- One or more BE nodes can form a Compute Group.

- BE nodes are stateless locally, with data stored on shared storage.

- Multiple Compute Groups access data through shared storage.

While maintaining the strong isolation benefits like Resource Group, Compute Group offer the following advantages:

- Lower costs: Due to the storage-compute separation architecture, data resides in shared storage, so the number of Compute Groups is no longer limited by the number of replicas. Users can create as many Compute Groups as needed without increasing storage costs.

- More flexibility: In a storage-compute separation architecture, data on BE nodes is cached, so adding a Compute Group does not require a cumbersome data migration process. The new Compute Group only needs to warm up its cache during queries.

- Better isolation: Data availability is handled by the shared storage layer, so the failure of a BE node within any Compute Group will not cause data loading failures as it would in a Resource Group.

:::caution Caution
Before 3.0.2, it was called Compute Cluster.
:::


## Viewing All Compute Groups

Use the `SHOW COMPUTE GROUPS` command to view all compute groups in the current repository. The returned results will display different content based on the user's permission level:

- Users with `ADMIN` privileges can view all compute groups
- Regular users can only view compute groups for which they have usage permissions (USAGE_PRIV)
- If a user doesn't have usage permissions for any compute groups, an empty result will be returned


```sql
SHOW COMPUTE GROUPS;
```

## Adding Compute Groups

Managing compute groups requires `OPERATOR` privilege, which controls node management permissions. For more details, please refer to [Privilege Management](../../sql-manual/sql-statements/account-management/GRANT-TO). By default, only the root account has the `OPERATOR` privilege, but it can be granted to other accounts using the `GRANT` command.
To add a BE and assign it to a compute group, use the [Add BE](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) command. For example:

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
