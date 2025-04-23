---
{
    "title": "routine_load_job",
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

## Overview

Used to view information about routine load jobs. This feature was introduced in version 3.0.5.

## Database

`information_schema`

## Table Information

| Column Name            | Type      | Description                                |
| :-------------------- | :-------- | :----------------------------------------- |
| JOB_ID                | text      | Job ID                                     |
| JOB_NAME              | text      | Job name                                   |
| CREATE_TIME           | text      | Job creation time                          |
| PAUSE_TIME            | text      | Job pause time                             |
| END_TIME              | text      | Job end time                               |
| DB_NAME               | text      | Database name                              |
| TABLE_NAME            | text      | Table name                                 |
| STATE                 | text      | Job status                                 |
| CURRENT_TASK_NUM      | text      | Current number of subtasks                 |
| JOB_PROPERTIES        | text      | Job property configurations                |
| DATA_SOURCE_PROPERTIES| text      | Data source property configurations        |
| CUSTOM_PROPERTIES     | text      | Custom property configurations             |
| STATISTIC            | text      | Job statistics information                 |
| PROGRESS             | text      | Job progress information                   |
| LAG                  | text      | Job delay information                      |
| REASON_OF_STATE_CHANGED| text     | Reason for job status change              |
| ERROR_LOG_URLS       | text      | Error log URLs                            |
| USER_NAME            | text      | Username                                   |
| CURRENT_ABORT_TASK_NUM| int       | Current number of failed tasks             |
| IS_ABNORMAL_PAUSE    | boolean   | Whether paused by system (non-user pause)  |