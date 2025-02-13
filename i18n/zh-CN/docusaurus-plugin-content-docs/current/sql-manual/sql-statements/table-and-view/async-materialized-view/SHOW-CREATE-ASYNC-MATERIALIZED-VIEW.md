---
{
    "title": "SHOW CREATE ASYNC MATERIALIZED VIEW",
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

查看物化视图创建语句。

## 语法

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name>
```

## 必选参数

**1. `<materialized_view_new_name>`**

> 物化视图名称

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                         |
| :---------------- | :------------- | :------------------------------------ |
| SHOW_PRIV         | 表（Table）    | 需要拥有当前物化视图的 SHOW_PRIV 权限 |

## 示例

1. 查看异步物化视图创建语句

    ```sql
    SHOW CREATE MATERIALIZED VIEW partition_mv;
    ```

2. 查看同步物化视图创建语句

    ```sql
    SHOW CREATE MATERIALIZED VIEW sync_agg_mv on lineitem;
    ```