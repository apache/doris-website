---
{
    "title": "CREATE ROLE",
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

CREATE ROLE 语句用于创建一个无权限的角色，后续可以通过 GRANT 命令赋予该角色权限。

## 语法

```sql
 CREATE ROLE <role_name> [<comment>];
```

## 必选参数

**<role_name>**：

> 指定角色名称。

## 可选参数

**<comment>**

> 指定角色注释。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明            |
|:------------|:------------|:--------------|
| ADMIN_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 ADMIN_PRIV 权限才能进行此操作 |

## 示例

- 创建一个角色

```sql
CREATE ROLE role1;
```

- 创建一个角色并添加注释
    
```sql
CREATE ROLE role2 COMMENT "this is my first role";
```
