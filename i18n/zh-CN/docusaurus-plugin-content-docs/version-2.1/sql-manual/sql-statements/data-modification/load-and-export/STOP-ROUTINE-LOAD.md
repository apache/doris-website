---
{
    "title": "STOP ROUTINE LOAD",
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

该语法用于停止一个 Routine Load 作业。被停止的作业无法再重新运行，这与 PAUSE 命令不同。如果需要重新导入数据，需要创建新的导入作业。

## 语法

```sql
STOP ROUTINE LOAD FOR <job_name>;
```

## 必选参数

**1. `<job_name>`**

> 指定要停止的作业名称。可以是以下形式：
>
> - `<job_name>`: 停止当前数据库下指定名称的作业
> - `<db_name>.<job_name>`: 停止指定数据库下指定名称的作业

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV         | 表（Table）    | SHOW ROUTINE LOAD 需要对表有LOAD权限 |

## 注意事项

- 停止操作是不可逆的，被停止的作业无法通过 RESUME 命令重新启动
- 停止操作会立即生效，正在执行的任务会被中断
- 建议在停止作业前先通过 SHOW ROUTINE LOAD 命令检查作业状态
- 如果只是临时暂停作业，建议使用 PAUSE 命令

## 示例

- 停止名称为 test1 的例行导入作业。

   ```sql
   STOP ROUTINE LOAD FOR test1;
   ```

- 停止指定数据库下的例行导入作业。

   ```sql
   STOP ROUTINE LOAD FOR example_db.test1;
   ```
