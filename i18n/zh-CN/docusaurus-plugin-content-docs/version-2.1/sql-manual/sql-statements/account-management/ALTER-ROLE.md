---
{
    "title": "ALTER ROLE",
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

ALTER ROLE 语句用于修改一个角色的注释

## 语法

```sql
 ALTER ROLE <role_name> COMMENT <comment>;
```

## 必选参数

**<role_name>**

> 指定角色名称。

**<comment>**

> 指定角色注释。   

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明            |
|:------------|:------------|:--------------|
| ADMIN_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 ADMIN_PRIV 权限才能进行此操作 |

## 示例

- 修改一个角色的注释

```sql
ALTER ROLE role1 COMMENT "this is my first role";
```
