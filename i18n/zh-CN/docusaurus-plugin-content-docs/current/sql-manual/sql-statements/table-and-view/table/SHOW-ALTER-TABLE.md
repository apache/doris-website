---
{
    "title": "SHOW ALTER TABLE",
    "language": "zh-CN",
    "description": "该语句用于展示当前正在进行的各类修改任务的执行情况"
}
---

## 描述

该语句用于展示当前正在进行的各类修改任务的执行情况

```sql
SHOW ALTER [TABLE [COLUMN | ROLLUP] [FROM db_name]];
```

说明：

1. TABLE COLUMN：展示修改列的 ALTER 任务
2. 支持语法[WHERE TableName|CreateTime|FinishTime|State] [ORDER BY] [LIMIT]
3. TABLE ROLLUP：展示创建或删除 ROLLUP 的任务
4. 如果不指定 db_name，使用当前默认 db

## Result

*SHOW ALTER TABLE COLUMN*

| 字段名            | 描述                                                         |
|-----------------------|------------------------------------------------------------------|
| JobId                 | 每个 Schema Change 作业的唯一 ID。                          |
| TableName             | 对应 Schema Change 的基表的表名。 |
| CreateTime            | 作业创建时间。                                              |
| FinishedTime          | 作业完成时间。如果未完成，显示 "N/A"。      |
| IndexName             | 此修改中涉及的一个基表/同步物化视图的名称。        |
| IndexId               | 新基表/同步物化视图的 ID。                                      |
| OriginIndexId         | 此修改中涉及的一个基表/同步物化视图的 ID。                                      |
| SchemaVersion         | 以 M:N 的格式显示。M 代表 Schema Change 的版本，N 代表对应的 Hash 值。每次 Schema Change 都会增加版本。 |
| TransactionId         | 用于转换历史数据的事务 ID。                  |
| State                 | 作业的阶段。                                               |
|                       | - PENDING: 作业正在等待在队列中调度。        |
|                       | - WAITING_TXN: 等待分界事务 ID 前的导入任务完成。 |
|                       | - RUNNING: 正在进行历史数据转换。                |
|                       | - FINISHED: 作业成功完成。                            |
|                       | - CANCELLED: 作业失败。                                          |
| Msg                   | 如果作业失败，显示失败信息。                        |
| Progress              | 作业进度。仅在 RUNNING 状态下显示。进度以 M/N 的形式显示。N 是 Schema Change 中涉及的副本的总数。M 是已完成历史数据转换的副本数。 |
| Timeout                | 作业超时时间，以秒为单位。                                       |


## 示例

1. 展示默认 db 的所有修改列的任务执行情况

   ```sql
   SHOW ALTER TABLE COLUMN;
   ```

2. 展示某个表最近一次修改列的任务执行情况

   ```sql
   SHOW ALTER TABLE COLUMN WHERE TableName = "table1" ORDER BY CreateTime DESC LIMIT 1;
   ```

3. 展示指定 db 的创建或删除 ROLLUP 的任务执行情况

   ```sql
   SHOW ALTER TABLE ROLLUP FROM example_db;
   ```

## 关键词

    SHOW, ALTER

## 最佳实践
