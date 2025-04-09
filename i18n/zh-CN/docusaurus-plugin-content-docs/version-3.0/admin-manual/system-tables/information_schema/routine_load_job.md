---
{
    "title": "routine_load_job",
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

## 概述

用于查看routine load导入作业的信息, 从3.0.5版本引入这个特性。

## 所属数据库

`information_schema`

## 表信息

| 列名                    | 类型      | 说明                                     |
| :--------------------- | :-------- | :-------------------------------------- |
| JOB_ID                 | text      | 作业 ID                                 |
| JOB_NAME               | text      | 作业名称                                |
| CREATE_TIME            | text      | 作业创建时间                             |
| PAUSE_TIME             | text      | 作业暂停时间                             |
| END_TIME               | text      | 作业结束时间                             |
| DB_NAME                | text      | 数据库名称                               |
| TABLE_NAME             | text      | 表名称                                  |
| STATE                  | text      | 作业状态                                |
| CURRENT_TASK_NUM       | text      | 当前子任务数量                           |
| JOB_PROPERTIES         | text      | 作业属性配置                             |
| DATA_SOURCE_PROPERTIES | text      | 数据源属性配置                           |
| CUSTOM_PROPERTIES      | text      | 自定义属性配置                           |
| STATISTIC             | text      | 作业统计信息                             |
| PROGRESS              | text      | 作业进度信息                             |
| LAG                   | text      | 作业延迟信息                             |
| REASON_OF_STATE_CHANGED| text      | 作业状态变更原因                         |
| ERROR_LOG_URLS        | text      | 错误日志 URL                            |
| USER_NAME             | text      | 用户名                                  |
| CURRENT_ABORT_TASK_NUM | int       | 当前失败的任务数量                       |
| IS_ABNORMAL_PAUSE     | boolean   | 是否非用户暂停                             |
