---
{
"title": "RESUME JOB",
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

将处于 PAUSED 状态的 JOB 恢复为 RUNNING 状态。RUNNING 状态的 JOB 将会根据既定的调度周期去执行。

## 语法

```sql
RESUME JOB where jobName = <jobname> ;
```
## 必选参数

**1. `<job_name>`**
> 恢复任务的作业名称。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV    | 数据库（DB）    | 目前仅支持 **ADMIN** 权限执行此操作 |

## 示例

- 恢复运行名称为 example 的 JOB。

   ```sql
   RESUME JOB where jobName= 'example';
   ```