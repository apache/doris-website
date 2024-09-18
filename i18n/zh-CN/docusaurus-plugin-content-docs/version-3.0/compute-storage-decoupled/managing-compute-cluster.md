---
{
    "title": "计算集群操作",
    "language": "zh-CN"
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

在存算分离架构下，可以将一个或多个计算节点 (BE) 组成一个计算集群 (Compute Cluster)。本文档介绍如何使用计算集群，其中涉及的操作包括：

- 查看所有计算集群
- 计算集群授权
- 在用户级别绑定计算集群 (`default_cloud_cluster`) 以达到用户级别的隔离效果

:::info 备注

本文涉及的 `cluster` 均表示计算集群。

:::

## 查看所有计算集群

可通过 `show clusters` 查看当前仓库拥有的所有计算集群。

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

## 授予计算集群访问权限

使用 MySQL Client 创建一个新用户。

**语法**

```SQL
GRANT USAGE_PRIV ON CLUSTER {cluster_name} TO {user}
```

**示例**

```SQL
// 使用 Root 账号在 MySQL Client 中创建 Jack 用户
mysql CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin";
Query OK, 0 rows affected (0.01 sec)

mysql GRANT USAGE_PRIV ON CLUSTER regression_test_cluster_name0 TO jack;
Query OK, 0 rows affected (0.01 sec)

// 使用 Jack 登录 MySQL Client
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

若向 Jack 用户授权一个不存在的计算集群，系统不会报错，而会在执行相应的 `use @cluster` 时报错。

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

切换到 Jack 账号，执行 use @not_exist_cluster，将出现提示 not_exist_cluster 不存在的报错提示

mysql use information_schema@not_exist_cluster;
No connection. Trying to reconnect...
Connection id:    1
Current database: *** NONE ***

ERROR 5091 (42000): Cluster not_exist_cluster not exist
```

## 撤销计算集群访问权限

**语法**

```SQL
REVOKE USAGE_PRIV ON CLUSTER {cluster_name} FROM {user}
```

**示例**

```SQL
// 使用 Root 账号在 MySQL Client 中创建 Jack 用户
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

## 设置默认计算集群 

用户可从多个计算集群选择设置为默认计算集群。

**语法**

为当前用户设置默认计算集群：

```SQL
SET PROPERTY 'default_cloud_cluster' = '{clusterName}';
```

为其他用户设置默认计算集群（此操作需要 Admin 权限）：

```SQL
SET PROPERTY FOR {user} 'default_cloud_cluster' = '{clusterName}';
```

查看当前用户默认计算集群，返回结果中`default_cloud_cluster` 的值即为默认计算集群：

```SQL
SHOW PROPERTY;
```

查看其他用户默认计算集群，此操作需要当前用户具备相关权限，返回结果中`default_cloud_cluster` 的值即为默认计算集群：

```SQL
SHOW PROPERTY FOR {user};
```

查看当前仓库下所有可用的计算集群：

```SQL
SHOW CLUSTERS;
```

:::info 备注

- 若当前用户拥有 Admin 角色，例如：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`，则：
  - 可以为自身以及其他用户设置默认计算集群；
  - 可以查看自身以及其他用户的 `PROPERTY`。
- 若当前用户无 Admin 角色，例如：`CREATE USER jack1 IDENTIFIED BY '123456'`，则：
  - 可以为自身设置默认计算集群；
  - 可以查看自身的 `PROPERTY`；
  - 无法查看所有计算集群，因该操作需要 `GRANT ADMIN` 权限。
- 若当前用户未配置默认计算集群，现有系统在执行数据读写操作时将会触发错误。为解决这一问题，用户可通过执行 `use @cluster` 命令来指定当前 Context 所使用的计算集群，或者使用 `SET PROPERTY` 语句来设置默认计算集群。
- 若当前用户已配置默认计算集群，但随后该集群被删除，则在执行数据读写操作时同样会触发错误。用户可通过执行 `use @cluster` 命令来重新指定当前 Context 所使用的计算集群，或者利用 `SET PROPERTY` 语句来更新默认集群设置。

:::

**示例**

```SQL
// 设置当前用户的默认计算集群
mysql SET PROPERTY 'default_cloud_cluster' = 'regression_test_cluster_name0';
Query OK, 0 rows affected (0.02 sec)

// 展示当前用户的默认计算集群
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

// 使用 Root 账号在 MySQL Client 中创建 Jack 用户
mysql CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin";
Query OK, 0 rows affected (0.01 sec)

// 为 jack 用户设置默认计算集群
mysql SET PROPERTY FOR jack 'default_cloud_cluster' = 'regression_test_cluster_name1';
Query OK, 0 rows affected (0.00 sec)

// 查看其他用户的默认计算集群
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

若用户意图设置为默认计算集群的计算集群不存在，系统会报错并提示用户使用 `SHOW CLUSTERS` 命令来查看当前仓库下所有有效的计算集群。`SHOW CLUSTERS` 命令将返回一个结果集，其中：

- `Cluster` 列表示计算集群名称。
- `is_current` 列表示当前用户是否使用此计算集群。
- `Users` 列表示该计算集群被以下用户设置为默认计算集群。

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

## 默认计算集群的选择机制

当用户未明确设置默认计算集群时，系统将自动为用户选择一个具有 Active 后端且用户具有使用权限的计算集群。在特定会话中确定默认计算集群后，默认计算集群将在该会话期间保持不变，除非用户显式更改了默认设置。

在不同次的会话中，若发生以下情况，系统可能会自动更改用户的默认计算集群：

- 用户失去了在上次会话中所选择默认计算集群的使用权限
- 有集群被添加或移除
- 上次所选择的默认计算集群不再具有 Active 后端

其中，情况一和情况二必定会导致系统自动选择的默认计算集群更改，情况三可能会导致更改。

## 切换计算集群

用户可在存算分离架构中指定使用的数据库和计算集群。

**语法**

```SQL
USE { [catalog_name.]database_name[@cluster_name] | @cluster_name }
```

若数据库或计算集群名称包含是保留关键字，需用反引号将相应的名称 \``` 包围。

**示例**

指定使用数据库 `test_database`：

```SQL
USE test_database
或者
USE `test_database`
```

指定使用计算集群 `test_cluster`：

```SQL
USE @test_cluster
或者
USE @`test_cluster`
```

同时指定使用数据库 `test_database` 和计算集群 `test_cluster`

```
USE test_database@test_cluster
USE `test_database`@`test_cluster`
```
