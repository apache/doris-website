---
{
"title": "CANCEL TASK",
"language": "en"
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
## Description

Cancel a running task created by the CREATE JOB statement.

- The task must be created by the CREATE JOB statement.
- It must be a running task.
- This function is supported from version 2.1.0.

## Syntax

```sql
CANCEL TASK WHERE jobName = '<job_name>' AND taskId = '<task_id>';
```
## Required Parameters

**<job_name>**

> The name of the job, of type string.

**<task_id>**

> The task ID, of integer type. It can be queried through the tasks table-valued function. For example: SELECT * FROM tasks('type'='insert'). For more information, please refer to "task table-valued function".

## Access Control Requirements

The user executing this SQL command must have at least ADMIN_PRIV privileges.

## Examples

Cancel a background task with jobName 'example' and taskId 378912.


```sql
CANCEL TASK WHERE jobName='example' AND taskId=378912
```