---
{
    "title": "SHOW ALTER TABLE MATERIALIZED VIEW",
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

查看同步物化视图构建任务状态。

由于创建同步物化视图是一个异步操作，用户在提交创建物化视图任务后，需要异步地通过命令查看同步物化视图构建状态。

## 语法

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM <database>
```

## 必选参数

**1. `<database>`**

> 同步物化视图的基表所属数据库

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象  | 说明                              |
| :---------------- | :------------- | :------------------------------------------- |
| ALTER_PRIV        | 表    | 需要拥有当前物化视图所属表的 ALTER_PRIV 权限 |

## 示例

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM doc_db;
```