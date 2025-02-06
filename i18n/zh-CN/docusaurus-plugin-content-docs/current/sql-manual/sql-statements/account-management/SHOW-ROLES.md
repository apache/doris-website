---
{
    "title": "SHOW ROLES",
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

SHOW ROLES 语句用于展示所有已创建的角色信息，包括角色名称，包含的用户以及权限。

## 语法

```SQL
SHOW ROLES
```

## 返回值

| 列名                   | 类型   | 说明              |
|-----------------------|--------|-------------------|
| Name                  | string | 角色名称           |
| Comment               | string | 注释              |
| Users                 | string | 包含的用户         |
| GlobalPrivs           | string | 全局权限           |
| CatalogPrivs          | string | Catalog权限       |
| DatabasePrivs         | string | 数据库权限         |
| TablePrivs            | string | 表权限            |
| ResourcePrivs         | string | 资源权限           |
| WorkloadGroupPrivs    | string | WorkloadGroup权限  |  

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明          |
|:------------|:------------|:--------------|
| GRANT_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 GRANT_PRIV 权限才能进行此操作 |

## 示例

- 查看已创建的角色

```SQL
SHOW ROLES
```

