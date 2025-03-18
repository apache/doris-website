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

查看异步物化视图创建语句。

## 语法

```sql
SHOW CREATE MATERIALIZED VIEW <materialized_view_name>
```

## 必选参数

**1. `<materialized_view_new_name>`**

> 物化视图名称

## 返回值

| 列名 | 说明   |
| -- |------|
| Materialized View | 物化视图名   |
| Create Materialized View | 物化视图创建语句 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象  | 说明                                                           |
| :---------------- | :------------- |:-------------------------------------------------------------|
| SELECT_PRIV/LOAD_PRIV/ALTER_PRIV/CREATE_PRIV/DROP_PRIV         | 表     |  |

## 示例（Examples）

1. 查看异步物化视图创建语句

    ```sql
    SHOW CREATE MATERIALIZED VIEW partition_mv;
    ```
