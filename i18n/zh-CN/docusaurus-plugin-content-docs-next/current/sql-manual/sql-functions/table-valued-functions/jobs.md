---
{
    "title": "JOBS",
    "language": "zh-CN",
    "description": "表函数，生成任务临时表，可以查看某个任务类型中的 job 信息。"
}
---

## 描述

表函数，生成任务临时表，可以查看某个任务类型中的 job 信息。

## 语法

```sql
JOBS(
    "type"="<type>"
)
```

## 必填参数 (Required Parameters)
| 字段名          | 描述                                                            |
|--------------|---------------------------------------------------------------|
| **`<type>`** | 任务的类型：<br/> `insert`：insert into 类型的任务。 <br/> `mv`：物化视图类型的任务。 |


## 返回值

- **`jobs("type"="insert")`** insert 类型的 job 返回值
    
    | 字段名             | 描述                           |
    |--------------------|--------------------------------|
    | Id                 | job id                        |
    | Name               | job 名称                       |
    | Definer            | job 定义者                     |
    | ExecuteType        | 执行类型                       |
    | RecurringStrategy  | 循环策略                       |
    | Status             | job 状态                       |
    | ExecuteSql         | 执行 SQL                       |
    | CreateTime         | job 创建时间                   |
    | SucceedTaskCount   | 成功任务数量                   |
    | FailedTaskCount    | 失败任务数量                   |
    | CanceledTaskCount  | 取消任务数量                   |
    | Comment            | job 注释                       |


- **`jobs("type"="mv")`** MV 类型的 job 返回值
    
    | 字段名              | 描述                                 |
    |---------------------|--------------------------------------|
    | Id                  | job id                               |
    | Name                | job 名称                              |
    | MvId                | 物化视图 id                           |
    | MvName              | 物化视图名称                         |
    | MvDatabaseId        | 物化视图所属 db id                    |
    | MvDatabaseName      | 物化视图所属 db 名称                   |
    | ExecuteType         | 执行类型                             |
    | RecurringStrategy   | 循环策略                             |
    | Status              | job 状态                              |
    | CreateTime          | task 创建时间                         |


## 示例

查看所有物化视图的 job

```sql
select * from jobs("type"="mv");
```
```text
+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+-------------+-------------------+---------+---------------------+
| Id    | Name             | MvId  | MvName                   | MvDatabaseId | MvDatabaseName                                         | ExecuteType | RecurringStrategy | Status  | CreateTime          |
+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+-------------+-------------------+---------+---------------------+
| 23369 | inner_mtmv_23363 | 23363 | range_date_up_union_mv1  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-08 18:19:10 |
| 23377 | inner_mtmv_23371 | 23371 | range_date_up_union_mv2  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-08 18:19:10 |
| 21794 | inner_mtmv_21788 | 21788 | test_tablet_type_mtmv_mv | 16016        | zd                                                     | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-08 12:26:06 |
| 19508 | inner_mtmv_19494 | 19494 | mv1                      | 16016        | zd                                                     | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-07 22:13:31 |
+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+-------------+-------------------+---------+---------------------+
```

查看所有 insert 任务的 job

```sql
select * from jobs("type"="insert");
```
```text
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| Id             | Name           | Definer | ExecuteType | RecurringStrategy                          | Status  | ExecuteSql                                                   | CreateTime          | SucceedTaskCount | FailedTaskCount | CanceledTaskCount | Comment |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| 78533940810334 | insert_tab_job | root    | RECURRING   | EVERY 10 MINUTE STARTS 2025-01-17 14:42:53 | RUNNING | INSERT INTO test.insert_tab SELECT * FROM test.example_table | 2025-01-17 14:32:53 | 0                | 0               | 0                 |         |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
```