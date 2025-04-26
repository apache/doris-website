---
{
    "title": "RESUME ROUTINE LOAD",
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

该语法用于重启一个或所有被暂停的 Routine Load 作业。重启的作业，将继续从之前已消费的 offset 继续消费。

## 语法

```sql
RESUME [ALL] ROUTINE LOAD FOR <job_name>
```

## 必选参数

**1. `<job_name>`**

> 指定要重启的作业名称。如果指定了 ALL，则无需指定 job_name。

## 可选参数

**1. `[ALL]`**

> 可选参数。如果指定 ALL，则表示重启所有被暂停的例行导入作业。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV         | 表（Table）    | SHOW ROUTINE LOAD 需要对表有LOAD权限 |

## 注意事项

- 只能重启处于 PAUSED 状态的作业
- 重启后的作业会从上次消费的位置继续消费数据
- 如果作业被暂停时间过长，可能会因为 Kafka 数据过期导致重启失败

## 示例

- 重启名称为 test1 的例行导入作业。

   ```sql
   RESUME ROUTINE LOAD FOR test1;
   ```

- 重启所有例行导入作业。

   ```sql
   RESUME ALL ROUTINE LOAD;
   ```
