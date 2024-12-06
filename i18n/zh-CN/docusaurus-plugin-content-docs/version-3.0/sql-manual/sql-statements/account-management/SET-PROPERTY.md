---
{
    "title": "SET PROPERTY",
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

## 描述

SET PROPERTY 语句用于设置用户属性，包括分配给用户的资源和导入集群设置。这里设置的用户属性是针对用户的，而不是针对 user_identity。例如，如果通过 CREATE USER 语句创建了两个用户 'jack'@'%' 和 'jack'@'192.%'，则使用 SET PROPERTY 语句只能针对用户 'jack'，而不是 'jack'@'%' 或 'jack'@'192.%'。

## 参数

### user

要设置属性的用户名。如果省略，则为当前用户设置属性。

### key

要设置的属性键。可用的键包括：

- `max_user_connections`：最大连接数。
- `max_query_instances`：用户同一时间点执行查询可以使用的 instance 个数。
- `sql_block_rules`：设置 SQL 阻止规则。设置后，该用户发送的查询如果匹配规则，则会被拒绝。
- `cpu_resource_limit`：限制查询的 CPU 资源。详见会话变量 `cpu_resource_limit` 的介绍。-1 表示未设置。
- `exec_mem_limit`：限制查询的内存使用。详见会话变量 `exec_mem_limit` 的介绍。-1 表示未设置。
- `resource_tags`：指定用户的资源标签权限。
- `query_timeout`：指定用户的查询超时。
- `default_workload_group`：指定用户的默认工作负载组。
- `default_compute_group`：指定用户的默认计算组。

注：如果未设置 `cpu_resource_limit` 和 `exec_mem_limit`，则默认使用会话变量中的值。

### value

为指定键设置的值。

## 示例

1. 设置用户 'jack' 的最大连接数为 1000：

   ```sql
   SET PROPERTY FOR 'jack' 'max_user_connections' = '1000';
   ```

2. 设置用户 'jack' 的最大查询实例数为 3000：

   ```sql
   SET PROPERTY FOR 'jack' 'max_query_instances' = '3000';
   ```

3. 为用户 'jack' 设置 SQL 阻止规则：

   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'rule1, rule2';
   ```

4. 设置用户 'jack' 的 CPU 资源限制：

   ```sql
   SET PROPERTY FOR 'jack' 'cpu_resource_limit' = '2';
   ```

5. 设置用户 'jack' 的资源标签权限：

   ```sql
   SET PROPERTY FOR 'jack' 'resource_tags.location' = 'group_a, group_b';
   ```

6. 设置用户 'jack' 的内存使用限制（以字节为单位）：

   ```sql
   SET PROPERTY FOR 'jack' 'exec_mem_limit' = '2147483648';
   ```

7. 设置用户 'jack' 的查询超时时间（以秒为单位）：

   ```sql
   SET PROPERTY FOR 'jack' 'query_timeout' = '500';
   ```

8. 设置用户 'jack' 的默认工作负载组：

   ```sql
   SET PROPERTY FOR 'jack' 'default_workload_group' = 'group1';
   ```

9. 设置用户 'jack' 的默认计算组：

   ```sql
   SET PROPERTY FOR 'jack' 'default_compute_group' = 'compute_group1';
   ```

## 相关命令

- [CREATE USER](./CREATE-USER.md)
- [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY)

## 关键词

    SET, PROPERTY, WORKLOAD GROUP, COMPUTE GROUP
