---
{
  "title": "ADMIN CLEAN TRASH",
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

该语句用于清理 backend 内的垃圾数据。

## 语法

```sql
ADMIN CLEAN TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])];
```

## 可选参数

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

指定需要清理的 backend。如果不加 ON，默认清理所有 backend。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：


| 权限（Privilege）  | 对象（Object） | 说明（Notes）                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | 用户（User）或 角色（Role）  | 用户或者角色拥有 ADMIN_PRIV 权限才能进行 CLEAN TRASH 操作 |


## 示例

```sql
-- 清理所有 be 节点的垃圾数据。
ADMIN CLEAN TRASH;
```

```sql
-- 清理'192.168.0.1:9050'和'192.168.0.2:9050'的垃圾数据。
ADMIN CLEAN TRASH ON ("192.168.0.1:9050", "192.168.0.2:9050");
```