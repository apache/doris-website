---
{
"title": "CANCEL TASK",
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
取消通过 [CREATE JOB](../../../sql-manual/sql-statements/job/CREATE-JOB) 语句创建生成的正在运行中任务

- 任务必须是通过 CREATE JOB 语句创建生成的任务
- 必须是正在运行中的任务
- 该函数自 2.1.0 版本支持。

##  语法

```sql
CANCEL TASK WHERE jobName = '<job_name>' AND taskId = '<task_id>';
```

## 必选参数

1. `<job_name>`:作业名称，字符串类型。 

2. `<task_id>`: 任务 ID，整型类型。可通过 tasks 表值函数查询。如：SELECT * FROM tasks('type'='insert')。详细信息请参阅“[task 表值函数](../../../sql-manual/sql-functions/table-valued-functions/tasks)”。

## 权限控制

执行此 SQL 命令的用户必须至少具有 ADMIN_PRIV 权限。

## 示例

取消一个 jobName 是 example，taskID 是 378912 的后台任务。

```sql
CANCEL TASK WHERE jobName='example' AND taskId=378912
```