---
{
    "title": "PAUSE ROUTINE LOAD",
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

该语法用于暂停一个或所有 Routine Load 作业。被暂停的作业可以通过 RESUME 命令重新运行。

## 语法

```sql
PAUSE [ALL] ROUTINE LOAD FOR <job_name>
```

## 必选参数

**1. `<job_name>`**

> 指定要暂停的作业名称。如果指定了 ALL，则无需指定 job_name。

## 可选参数

**1. `[ALL]`**

> 可选参数。如果指定 ALL，则表示暂停所有例行导入作业。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV         | 表（Table）    | SHOW ROUTINE LOAD 需要对表有LOAD权限 |

## 注意事项

- 作业被暂停后，可以通过 RESUME 命令重新启动
- 暂停操作不会影响已经下发到 BE 的任务，这些任务会继续执行完成

## 示例

- 暂停名称为 test1 的例行导入作业。

   ```sql
   PAUSE ROUTINE LOAD FOR test1;
   ```

- 暂停所有例行导入作业。

   ```sql
   PAUSE ALL ROUTINE LOAD;
   ```
