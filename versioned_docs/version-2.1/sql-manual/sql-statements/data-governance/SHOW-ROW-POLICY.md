---
{
    "title": "SHOW ROW POLICY",
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

## 描述（Description）

查看行安全策略。行安全策略的详细信息，请参阅“安全策略”章节

## 语法（Syntax）

```SQL
SHOW ROW POLICY [ FOR { <user_name> | ROLE <role_name> } ];
```

## 可选参数（Optional Parameters）

**<user_name>**

> 用户名称

**<role_name>**

> 角色名称

## 权限控制（Access Control Requirements）

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| ADMIN_PRIV        | 全局           |               |

## 示例（Examples）

1. 查看所有安全策略

```SQL
SHOW ROW POLICY;
```

1. 指定用户名查询

```SQL
SHOW ROW POLICY FOR user1;
```

1. 指定角色名查询

```SQL
SHOW ROW POLICY for role role1;
```