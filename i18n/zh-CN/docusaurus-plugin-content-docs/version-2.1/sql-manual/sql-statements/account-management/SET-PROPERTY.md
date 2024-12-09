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

 设置用户的属性，包括分配给用户的资源、导入 cluster 等

```sql
SET PROPERTY [FOR 'user'] 'key' = 'value' [, 'key' = 'value']
```

这里设置的用户属性，是针对 user 的，而不是 user_identity。即假设通过 CREATE USER 语句创建了两个用户 'jack'@'%' 和 'jack'@'192.%'，则使用 SET PROPERTY 语句，只能针对 jack 这个用户，而不是 'jack'@'%' 或 'jack'@'192.%'

key:

超级用户权限：

​        max_user_connections: 最大连接数。

​        max_query_instances: 用户同一时间点执行查询可以使用的 instance 个数。

​        sql_block_rules: 设置 sql block rules。设置后，该用户发送的查询如果匹配规则，则会被拒绝。

​        cpu_resource_limit: 限制查询的 cpu 资源。详见会话变量 `cpu_resource_limit` 的介绍。-1 表示未设置。

​        exec_mem_limit: 限制查询的内存使用。详见会话变量 `exec_mem_limit` 的介绍。-1 表示未设置。

​        resource_tags：指定用户的资源标签权限。

​        query_timeout：指定用户的查询超时权限。

    注：`cpu_resource_limit`, `exec_mem_limit` 两个属性如果未设置，则默认使用会话变量中值。

## 示例

1. 修改用户 jack 最大连接数为 1000
   
    ```sql
    SET PROPERTY FOR 'jack' 'max_user_connections' = '1000';
    ```

2. 修改用户 jack 的查询可用 instance 个数为 3000
   
    ```sql
    SET PROPERTY FOR 'jack' 'max_query_instances' = '3000';
    ```
    
3. 修改用户 jack 的 sql block rule
   
    ```sql
    SET PROPERTY FOR 'jack' 'sql_block_rules' = 'rule1, rule2';
    ```

4. 修改用户 jack 的 cpu 使用限制
    
    ```sql
    SET PROPERTY FOR 'jack' 'cpu_resource_limit' = '2';
    ```
    
5. 修改用户的资源标签权限
    
    ```sql
    SET PROPERTY FOR 'jack' 'resource_tags.location' = 'group_a, group_b';
    ```
    
6. 修改用户的查询内存使用限制，单位字节
    
    ```sql
    SET PROPERTY FOR 'jack' 'exec_mem_limit' = '2147483648';
    ```

7. 修改用户的查询超时限制，单位秒

    ```sql
    SET PROPERTY FOR 'jack' 'query_timeout' = '500';
    ```
    
## 关键词

    SET, PROPERTY

## 最佳实践

