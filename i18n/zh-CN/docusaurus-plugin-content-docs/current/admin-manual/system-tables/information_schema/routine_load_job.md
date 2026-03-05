---
{
    "title": "routine_load_job",
    "language": "zh-CN",
    "description": "用于查看routine load导入作业的信息"
}
---

## 概述

用于查看routine load导入作业的信息

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
