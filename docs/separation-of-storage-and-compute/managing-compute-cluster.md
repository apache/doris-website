---
{
    "title": "Managing Compute Cluster",
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

In the compute-storage decoupled mode, users can organize one or more BE nodes into a compute cluster. This document introduces how to use the compute clusters. The main operations include:

- Show all compute clusters
- Grant compute clusters to users
- Bind a compute cluster to user (`default_cloud_cluster`) for user-level isolation

:::info

`cluster` in this document refers to compute clusters.

:::

## Show all compute clusters

Use the `show clusters` command to check all compute clusters under the current instance.

```SQL
> mysql show clusters;
+-------------------------------+------------+------------+
| cluster                       | is_current | users      |
+-------------------------------+------------+------------+
| regression_test_cluster_name0 | FALSE      | root, jack |
| regression_test_cluster_name5 | FALSE      |            |
+-------------------------------+------------+------------+
2 rows in set (0.01 sec)

mysql SET PROPERTY 'default_cloud_cluster' = 'regression_test_cluster_name5';
Query OK, 0 rows affected (0.01 sec)
```

## Grant compute cluster access privilege

Use the MySQL Client to create a new user.

**Syntax**

```SQL
GRANT USAGE_PRIV ON CLUSTER {cluster_name} TO {user}
```

**Example**

```SQL
// Use the root account to create a new Jack user in the MySQL Client.

mysql CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin";
Query OK, 0 rows affected (0.01 sec)

mysql GRANT USAGE_PRIV ON CLUSTER regression_test_cluster_name0 TO jack;
Query OK, 0 rows affected (0.01 sec)

// Log in to the MySQL Client via Jack.

mysql use d1@regression_test_cluster_name0;
Database changed

mysql show grants for jack\G
*************************** 1. row ***************************
 UserIdentity: 'jack'@'%'
     Password: Yes
  GlobalPrivs: Admin_priv  (false)
 CatalogPrivs: NULL
DatabasePrivs: internal.information_schema: Select_priv  (false)
   TablePrivs: NULL
ResourcePrivs: NULL
 CloudCluster: regression_test_cluster_name0: Usage_priv  (false)
   CloudStage: NULL
1 row in set (0.00 sec)

mysql select * from t1;
+------+------+-------+
| id   | name | score |
+------+------+-------+
|    1 | aaa  |    20 |
|    2 | bbb  |   320 |
|    3 | ccc  |    30 |
|    4 | ddd  |   120 |
|    5 | eee  |    30 |
|    6 | fff  |    30 |
|    7 | ggg  |    90 |
|    8 | hhh  |    30 |
+------+------+-------+
8 rows in set (12.70 sec)

mysql insert into t1 (id, name, score) values (8, "hhh", 30);
Query OK, 1 row affected (7.22 sec)
{'label':'insert_6f40c1713baf4d61_9c33c0962c68ab07', 'status':'VISIBLE', 'txnId':'5462662627547136'}
```

If you attempt to grant a Jack user the access privilege to a non-existent compute cluster, the system will not report an error. However, an error will be raised when the user attempts to execute the `use @cluster` command.

```SQL
mysql GRANT USAGE_PRIV ON CLUSTER not_exist_cluster TO jack;
Query OK, 0 rows affected (0.05 sec)

mysql show grants for jack\G
*************************** 1. row ***************************
 UserIdentity: 'jack'@'%'
     Password: Yes
  GlobalPrivs: Admin_priv  (false)
 CatalogPrivs: NULL
DatabasePrivs: internal.information_schema: Select_priv  (false)
   TablePrivs: NULL
ResourcePrivs: NULL
 CloudCluster: not_exist_cluster: Usage_priv  (false)
   CloudStage: NULL
1 row in set (0.00 sec)

Switch to the Jack account and execute use @not_exist_cluster, an error will be thrown.

mysql use information_schema@not_exist_cluster;
No connection. Trying to reconnect...
Connection id:    1
Current database: *** NONE ***

ERROR 5091 (42000): Cluster not_exist_cluster not exist
```

## Revoke compute cluster access privilege

**Syntax**

```SQL
REVOKE USAGE_PRIV ON CLUSTER {cluster_name} FROM {user}
```

**Example**

```SQL
// Use the root account to create a new Jack user in the MySQL Client.
mysql REVOKE USAGE_PRIV ON CLUSTER regression_test_cluster_name0 FROM jack;
Query OK, 0 rows affected (0.01 sec)

mysql show grants for jack\G
*************************** 1. row ***************************
 UserIdentity: 'jack'@'%'
     Password: Yes
  GlobalPrivs: Admin_priv  (false)
 CatalogPrivs: NULL
DatabasePrivs: internal.information_schema: Select_priv  (false)
   TablePrivs: NULL
ResourcePrivs: NULL
 CloudCluster: NULL
   CloudStage: NULL
1 row in set (0.01 sec)
```

## Set default compute cluster 

Users can set a compute cluster as the default compute cluster.

**Syntax**

Set the default compute cluster for the current user:

```SQL
SET PROPERTY 'default_cloud_cluster' = '{clusterName}';
```

Set the default compute cluster for other users (requiring Admin privileges):

```SQL
SET PROPERTY FOR {user} 'default_cloud_cluster' = '{clusterName}';
```

Check the default compute cluster of the current user. The value of `default_cloud_cluster` in the returned result will be the default compute cluster.

```SQL
SHOW PROPERTY;
```

Check the default compute clusters of other users (requiring Admin privileges). The value of `default_cloud_cluster`in the returned result will be the default compute cluster.

```SQL
SHOW PROPERTY FOR {user};
```

Check all available compute clusters under the current instance:

```SQL
SHOW CLUSTERS;
```

:::info

- If the current user has Admin privileges, (e.g. `CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`), then:
  - They can set the default compute cluster for themselves and other users;
  - They can view the `PROPERTY` for themselves and other users.
- If the current user does not have Admin privileges, (e.g. `CREATE USER jack1 IDENTIFIED BY '123456'`), then:
  - They can set the default compute cluster for themselves;
  - They can view their own PROPERTY;
  - They cannot view all compute clusters, as this operation requires the `GRANT ADMIN` privilege.
- If a default compute cluster is not set for the current user, the system will trigger an error when the user executes data read/write operations. To solve this, the user can execute the `use @cluster` command to specify the compute cluster for the current context, or use the `SET PROPERTY` statement to set the default compute cluster.
- If the current user has set a default compute cluster, but that cluster is later deleted, an error will also be triggered when executing data read/write operations. The user can execute the `use @cluster` command to re-specify the compute cluster for the current context, or use the `SET PROPERTY` statement to update the default compute cluster setting.

:::

**Example**

```SQL
// Set the default compute cluster for the current user
mysql SET PROPERTY 'default_cloud_cluster' = 'regression_test_cluster_name0';
Query OK, 0 rows affected (0.02 sec)

// Show the default compute cluster of the current user
mysql show PROPERTY;
+------------------------+-------------------------------+
| Key                    | Value                         |
+------------------------+-------------------------------+
| cpu_resource_limit     | -1                            |
| default_cloud_cluster  | regression_test_cluster_name0 |
| exec_mem_limit         | -1                            |
| load_mem_limit         | -1                            |
| max_query_instances    | -1                            |
| max_user_connections   | 100                           |
| quota.high             | 800                           |
| quota.low              | 100                           |
| quota.normal           | 400                           |
| resource.cpu_share     | 1000                          |
| resource.hdd_read_iops | 80                            |
| resource.hdd_read_mbps | 30                            |
| resource.io_share      | 1000                          |
| resource.ssd_read_iops | 1000                          |
| resource.ssd_read_mbps | 30                            |
| resource_tags          |                               |
| sql_block_rules        |                               |
+------------------------+-------------------------------+
17 rows in set (0.00 sec)

// Use the root account to create a new Jack user in the MySQL Client
mysql CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin";
Query OK, 0 rows affected (0.01 sec)

// Set the default compute cluster for a Jack user
mysql SET PROPERTY FOR jack 'default_cloud_cluster' = 'regression_test_cluster_name1';
Query OK, 0 rows affected (0.00 sec)

// Show the default compute clusters of other users
mysql show PROPERTY for jack;
+------------------------+-------------------------------+
| Key                    | Value                         |
+------------------------+-------------------------------+
| cpu_resource_limit     | -1                            |
| default_cloud_cluster  | regression_test_cluster_name1 |
| exec_mem_limit         | -1                            |
| load_mem_limit         | -1                            |
| max_query_instances    | -1                            |
| max_user_connections   | 100                           |
| quota.high             | 800                           |
| quota.low              | 100                           |
| quota.normal           | 400                           |
| resource.cpu_share     | 1000                          |
| resource.hdd_read_iops | 80                            |
| resource.hdd_read_mbps | 30                            |
| resource.io_share      | 1000                          |
| resource.ssd_read_iops | 1000                          |
| resource.ssd_read_mbps | 30                            |
| resource_tags          |                               |
| sql_block_rules        |                               |
+------------------------+-------------------------------+
17 rows in set (0.00 sec)
```

If the compute cluster that is about to be set as default does not exist, as the default, the system will return an error and prompt the user to use the `SHOW CLUSTERS` command to view all the valid compute clusters in the current warehouse.

The `SHOW CLUSTERS` command will return a result set, where:

- The `Cluster` column shows the name of the compute clusters.
- The `is_current` column indicates whether the current user is using that compute cluster.
- The `Users` column shows which users have set that compute cluster as their default.

```SQL
mysql SET PROPERTY 'default_cloud_cluster' = 'not_exist_cluster';
ERROR 5091 (42000): errCode = 2, detailMessage = Cluster not_exist_cluster not exist, use SQL 'SHOW CLUSTERS' to get a valid cluster

mysql show clusters;
+-------------------------------+------------+------------+
| cluster                       | is_current | users      |
+-------------------------------+------------+------------+
| regression_test_cluster_name0 | FALSE      | root, jack |
| regression_test_cluster_name5 | FALSE      |            |
+-------------------------------+------------+------------+
2 rows in set (0.01 sec)

mysql SET PROPERTY 'default_cloud_cluster' = 'regression_test_cluster_name5';
Query OK, 0 rows affected (0.01 sec)
```

## Default compute cluster selection mechanism

When the user has not explicitly set a default compute cluster, the system will automatically select a compute cluster which satifies the following conditions:

- The compute cluster has an active backend.
- The user has permission to use this compute cluster.

Once a default compute cluster is established for a specific session, it will remain the default throughout that session, unless the user explicitly changes the default setting.

In different sessions, the system may automatically change the user's default compute cluster if any of the following occur:

- The user loses permission to use the compute cluster that was previously selected as the default.
- Clusters have been added or removed.
- The previously selected default compute cluster no longer has an active backend.

Scenarios 1 and 2 will definitively trigger the system to automatically select a new default compute cluster, while scenario 3 may potentially lead to a change.

## Switch compute cluster

In a compute-storage decoupled architecture, the user can specify the database and compute cluster to be used.

**Syntax**

```SQL
USE { [catalog_name.]database_name[@cluster_name] | @cluster_name }
```

If the name of the database or compute cluster contains a reserved keyword, the respective name needs to be enclosed within backticks ```` to denote it as a quoted identifier.

**Example**

Use database `test_database`:

```SQL
USE test_database

USE `test_database`
```

Use compute cluster `test_cluster`:

```SQL
USE @test_cluster

USE @`test_cluster`
```

Use database `test_database` and compute cluster `test_cluster`:

```
USE test_database@test_cluster

USE `test_database`@`test_cluster`
```



