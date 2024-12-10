---
{
    "title": "Managing Compute Groups",
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

In a compute-storage decoupled architecture, one or more compute nodes (BE) can be grouped into a Compute Group. This document describes how to use compute groups, including operations such as:

- Viewing all compute groups
- Granting compute group access
- Binding compute groups at the user level (`default_compute_group`) for user-level isolation

*Note*
In versions prior to 3.0.2, this was referred to as a Compute Cluster.

## Viewing All Compute Groups

You can view all compute groups owned by the current repository using `SHOW COMPUTE GROUPS`.

```sql
SHOW COMPUTE GROUPS;
```

## Adding Compute Groups

Using [Add BE ](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND.md) to add a BE into a compute group, for example:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050' PROPERTIES ("tag.compute_group_name" = "new_group");
```

The above sql will add `host:9050` to compute group `new_group`. The BE will be added to compute group `default_compute_group` if you omit PROPERTIES statement, for example:

```sql
ALTER SYSTEM ADD BACKEND 'host:9050';
```

## Granting Compute Group Access

```sql
GRANT USAGE_PRIV ON COMPUTE GROUP {compute_group_name} TO {user}
```

## Revoking Compute Group Access

```sql
REVOKE USAGE_PRIV ON COMPUTE GROUP {compute_group_name} FROM {user}
```

## Setting Default Compute Group 

To set the default compute group for the current user:

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

To view the default compute group of other users, this operation requires the current user to have relevant permissions, and the value of `default_compute_group` in the returned result is the default compute group:

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

## Default Compute Group Selection Mechanism

When a user has not explicitly set a default compute group, the system will automatically select a compute group with Active BE that the user has usage permissions for. Once the default compute group is determined in a specific session, it will remain unchanged during that session unless the user explicitly changes the default setting.

In different sessions, if the following situations occur, the system may automatically change the user's default compute group:

- The user has lost usage permissions for the default compute group selected in the last session
- A compute group has been added or removed
- The previously selected default compute group no longer has Active BE

Situations one and two will definitely lead to a change in the automatically selected default compute group, while situation three may lead to a change.

## Switching Compute Groups

Users can specify the database and compute group to use in a compute-storage decoupled architecture.

**Syntax**

```sql
USE { [catalog_name.]database_name[@compute_group_name] | @compute_group_name }
```

If the database or compute group name contains reserved keywords, the corresponding name must be enclosed in backticks ```.
 
## Scaling Compute Groups

You can scale compute groups by adding or removing BE using `ALTER SYSTEM ADD BACKEND` and `ALTER SYSTEM DECOMMISION BACKEND`.
