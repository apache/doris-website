---
{
    "title": "SHOW PRIVILEGES",
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

`SHOW PRIVILEGES` 语句用于显示数据库系统中当前可用的权限列表。它帮助用户了解系统支持的权限类型以及每种权限的详细信息。

## 语法

```sql
SHOW PRIVILEGES
```

## 返回值

返回当前数据库系统中可用的权限列表。

## 权限控制

执行此 SQL 命令的用户不需要具有特定的权限来执行此命令。

## 示例

查看所有权限项

```sql
SHOW PRIVILEGES
```
  
```text
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Privilege   | Context                                               | Comment                                       |
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Node_priv   | GLOBAL                                                | Privilege for cluster node operations         |
| Admin_priv  | GLOBAL                                                | Privilege for admin user                      |
| Grant_priv  | GLOBAL,CATALOG,DATABASE,TABLE,RESOURCE,WORKLOAD GROUP | Privilege for granting privilege              |
| Select_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for select data in tables           |
| Load_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for loading data into tables        |
| Alter_priv  | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for alter database or table         |
| Create_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for creating database or table      |
| Drop_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for dropping database or table      |
| Usage_priv  | RESOURCE,WORKLOAD GROUP                               | Privilege for using resource or workloadGroup |
+-------------+-------------------------------------------------------+-----------------------------------------------+
```
