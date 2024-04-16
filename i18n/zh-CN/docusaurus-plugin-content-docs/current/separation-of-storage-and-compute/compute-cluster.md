---
{
    "title": "存算分离计算集群",
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

存算分离架构下，可以将一个或多个计算节点 (BE) 组成一个 Compute Cluster (以下简称
Cluster).  本文档描述如何使用 cluster(如何创建 cluster 请参考[链接](../separation-of-storage-and-compute/deployment.md)):
1. 显示所有的 Cluster
2. 如何进行 Cluster 的授权
3. 如何在用户级别绑定 Cluster (`default_cloud_cluster`) 达到用户级别的隔离效果

## SHOW CLUSTERS

可以通过 `show clusters`，查看当前仓库拥有的所有计算集群。

```sql
mysql> show clusters;
+-------------------------------+------------+------------+
| cluster                       | is_current | users      |
+-------------------------------+------------+------------+
| regression_test_cluster_name0 | FALSE      | root, jack |
| regression_test_cluster_name5 | FALSE      |            |
+-------------------------------+------------+------------+
2 rows in set (0.01 sec)

mysql> SET PROPERTY 'default_cloud_cluster' = 'regression_test_cluster_name5';
Query OK, 0 rows affected (0.01 sec)
```

## GRANT CLUSTER 访问权限给用户

**1. 使用 MySQL Client 创建一个新用户**

**2. 语法**

```sql
GRANT USAGE_PRIV ON CLUSTER {cluster_name} TO {user}
```

**3. 示例**

```sql
// 使用root账号在mysql client中创建jack用户
mysql> CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin";
Query OK, 0 rows affected (0.01 sec)

mysql> GRANT USAGE_PRIV ON CLUSTER regression_test_cluster_name0 TO jack;
Query OK, 0 rows affected (0.01 sec)

// 使用jack登录mysql client
mysql> use d1@regression_test_cluster_name0;
Database changed

mysql> show grants for jack\G
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

mysql> select * from t1;
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

mysql> insert into t1 (id, name, score) values (8, "hhh", 30);
Query OK, 1 row affected (7.22 sec)
{'label':'insert_6f40c1713baf4d61_9c33c0962c68ab07', 'status':'VISIBLE', 'txnId':'5462662627547136'}

```


给 jack 用户 GRANT 一个不存在的 Cluster，不会报错。但是在 `use @cluster` 的时候会报错

```sql
mysql> GRANT USAGE_PRIV ON CLUSTER not_exist_cluster TO jack;
Query OK, 0 rows affected (0.05 sec)

mysql> show grants for jack\G
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

切换到jack账号, use @not_exist_cluster, 会报错提示not_exist_cluster不存在

mysql> use information_schema@not_exist_cluster;
No connection. Trying to reconnect...
Connection id:    1
Current database: *** NONE ***

ERROR 5091 (42000): Cluster not_exist_cluster not exist
```

## REVOKE 用户访问 Cluster 权限

**1. 语法**

```sql
REVOKE USAGE_PRIV ON CLUSTER {cluster_name} FROM {user}
```

**2. 示例**

```sql
// 使用root账号在mysql client中创建jack用户
mysql> REVOKE USAGE_PRIV ON CLUSTER regression_test_cluster_name0 FROM jack;
Query OK, 0 rows affected (0.01 sec)

mysql> show grants for jack\G
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

## 设置 default_cluster

**1. 语法**

为当前用户设置默认 Cluster

```sql
SET PROPERTY 'default_cloud_cluster' = '{clusterName}';
```

为其他用户设置默认 Cluster，注意需要有 Admin 权限

```sql
SET PROPERTY FOR {user} 'default_cloud_cluster' = '{clusterName}';
```

展示当前用户默认 Cluster，注意需要有，`default_cloud_cluster` 的 Value 既是默认 Cluster

```sql
SHOW PROPERTY;
```

展示其他用户默认 Cluster，主要当前用户要有相关权限，`default_cloud_cluster` 的 Value 既是默认 Cluster

```sql
SHOW PROPERTY FOR {user};
```

展示当前 Warehouse 下所有可用的 Clusters

```sql
SHOW CLUSTERS;
```

**2. 注意**

- 当前用户拥有 Admin Role，例如：`CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin"`;
   
   - 可以给自己设置 Default Cluster 和给其他用户设置 Default Cluster;
   
   - 可以 SHOW 自己的 PROPERTY 和其他用户的 PROPERTY;

- 当前用户不拥有 admin role，例如 CREATE USER jack1 IDENTIFIED BY '123456';

   - 可以给自己设置 Default Cluster

   - 可以 SHOW 自己的 PROPERTY

   - 不能 SHOW CLUSTERS，会提示需要 GRANT ADMIN 权限

- 若当前用户没有配置默认 Cluster，目前实现在读写数据的时候，会报错。可以使用 `use @cluster` 设置当前 Context 使用的 Cluster，也可以使用 SET PROPERTY 设置默认 Cluster

- 若当前用户配置了默认 Cluster，但是后面此 Cluster 被 Drop 掉了，读写数据会报错，可以使用 `use @cluster` 设置当前 Context 使用的 Cluster，也可以使用 SET PROPERTY 设置默认 Cluster

**3. 示例**

```sql
// 设置当前用户默认 Cluster
mysql> SET PROPERTY 'default_cloud_cluster' = 'regression_test_cluster_name0';
Query OK, 0 rows affected (0.02 sec)

// 展示当前用户的默认 Cluster
mysql> show PROPERTY;
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

// 使用 root 账号在 MySQL Client 中创建 jack 用户
mysql> CREATE USER jack IDENTIFIED BY '123456' DEFAULT ROLE "admin";
Query OK, 0 rows affected (0.01 sec)

// 给 jack 用户设置默认 Cluster
mysql> SET PROPERTY FOR jack 'default_cloud_cluster' = 'regression_test_cluster_name1';
Query OK, 0 rows affected (0.00 sec)

// 展示其他用户的默认 Cluster
mysql> show PROPERTY for jack;
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

若当前 Warehouse 下不存在将要设置的默认 Cluster 会报错，提示使用 SHOW CLUSTERS 展示当前 Warehouse 下所有有效的 Cluster Cluster 列表示 `clusterName`，`is_current` 列表示当前用户是否使用此 Cluster，Users 列表示这些用户设置默认 Cluster 为当前行的 Cluster

```sql
mysql> SET PROPERTY 'default_cloud_cluster' = 'not_exist_cluster';
ERROR 5091 (42000): errCode = 2, detailMessage = Cluster not_exist_cluster not exist, use SQL 'SHOW CLUSTERS' to get a valid cluster

mysql> show clusters;
+-------------------------------+------------+------------+
| cluster                       | is_current | users      |
+-------------------------------+------------+------------+
| regression_test_cluster_name0 | FALSE      | root, jack |
| regression_test_cluster_name5 | FALSE      |            |
+-------------------------------+------------+------------+
2 rows in set (0.01 sec)

mysql> SET PROPERTY 'default_cloud_cluster' = 'regression_test_cluster_name5';
Query OK, 0 rows affected (0.01 sec)
```

## 未设置 default_cluster，系统自动选择集群的规则

如果用户没有设置默认集群，则会找到一个有 active 后端并且有使用权限的集群。并且在同次会话中，系统选择的集群将一直保持不变。

对于不同次的会话，存在以下情况，可能导致系统自动选择的集群发生改变
* 用户失去了上次选择集群的使用权限

* 有集群被添加或者移除

* 上次选择的集群不存在 Active 的后端

其中，第一种和第二种情况一定会导致系统自动选择的集群发生改变，第三种情况可能会导致系统自动选择的集群发生改变。

## 切换 Cluster

在存算分离版本中，指定使用的数据库和计算集群

**1. 语法**

```sql
USE { [catalog_name.]database_name[@cluster_name] | @cluster_name }
```

:::info Note
如果 Database 名字或者 Cluster 名字是保留的关键字，需要用 Backtick
```
` `
```
括起来
:::

**2. 举例**

1. 指定使用该数据库 test_database

   ```sql
   USE test_database
   或者
   USE `test_database`
   ```

2. 指定使用该计算集群 test_cluster

   ```sql
   USE @test_cluster
   或者
   USE @`test_cluster`
   ```

3. 同时指定使用该数据库 test_database 和计算集群 test_cluster

   ```sql
   USE test_database@test_cluster
   USE `test_database`@`test_cluster`
   ```
