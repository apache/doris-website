---
{
    "title": "ADMIN CHECK TABLET",
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

该语句用于对一组 tablet 执行指定的检查操作

## 语法

```sql
ADMIN CHECK TABLET ( <tablet_id> [,...] ) PROPERTIES("type" = "<type_value>")
```

## 必选参数

**1. `<tablet_id>`**

需要进行执行指定的检查操作的 tablet ID。

## 可选参数

**1. `<type_value>`**
目前只支持 `consistency`

* consistency:

  对 tablet 的副本数据一致性进行检查。该命令为异步命令，发送后，Doris 会开始执行对应 tablet 的一致性检查作业。

## 返回值

执行语句的最终的结果，将体现在`SHOW PROC "/cluster_health/tablet_health";` 结果中的 InconsistentNum 列。

| 列名              | 类型  | 说明              |
|-----------------|-----|-----------------|
| InconsistentNum | Int | 不一致的的 tablet 数量 |


## 权限控制

执行此 SQL 命令的用户必须至少拥有以下权限：

| 权限         | 对象       | 说明                                 |
|:-----------|:---------|:-----------------------------------|
| Admin_priv | Database | 执行数据库管理操作所需的权限，包括管理表、分区以及系统级命令等操作。 |

## 示例

- 对指定的一组 tablet 进行副本数据一致性检查

  ```sql
  admin check tablet (10000, 10001) PROPERTIES("type" = "consistency");
  ```

  ```text
  Query OK, 0 rows affected (0.00 sec)
  ```