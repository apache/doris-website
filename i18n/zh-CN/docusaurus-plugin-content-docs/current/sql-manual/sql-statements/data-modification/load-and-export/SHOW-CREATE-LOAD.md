---
{
    "title": "SHOW CREATE LOAD",
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

该语句用于展示导入作业的创建语句。

## 语法：

```sql
SHOW CREATE LOAD FOR <load_name>;
```

## 必选参数

**`<load_name>`**

> 例行导入作业名称

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| ADMIN/NODE_PRIV | 库（Database）    | 需要集群管理员权限 |

## 返回值

返回指定导入作业的创建语句。

## 举例

- 展示默认 db 下指定导入作业的创建语句

   ```sql
   SHOW CREATE LOAD for test_load
   ```

