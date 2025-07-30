---
{
"title": "SHOW ALTER TABLE MATERIALIZED VIEW",
"language": "zh-CN"
}
---

## 描述

该命令用于查看通过 [CREATE-MATERIALIZED-VIEW](../../../sql-statements/table-and-view/materialized-view/CREATE-MATERIALIZED-VIEW.md) 语句提交的创建物化视图作业的执行情况。

> 该语句等同于 `SHOW ALTER TABLE ROLLUP`;

## 语法

```sql
SHOW ALTER TABLE MATERIALIZED VIEW
[FROM <database>]
[<where_clause>]
[ORDER BY <order_by_key> [, ...]]
[LIMIT <limit_rows> [ OFFSET <offset_rows>]]
```

## 可选参数

**1. `FROM <database>`**

> 查看指定数据库下的作业。如不指定，使用当前数据库。

**2. `<where_clause>`**

> 可以对结果列进行筛选，目前仅支持对以下列进行筛选：
- TableName：仅支持等值筛选。
- State：仅支持等值筛选。
- Createtime/FinishTime：支持 =，>=，<=，>，<，!=

**3. `ORDER BY`**

> 可以对结果集按任意列进行排序。

**4. `LIMIT <limit_rows> [ OFFSET <offset_rows>]`**

> 翻页查询。

## 返回值

| 列名                 | 说明           |
|--------------------|--------------|
| JobId               | 作业唯一 ID      |
| TableName               | 基表名称         |
| CreateTime        | 作业创建时间       |
| FinishTime           | 作业结束时间       |
| BaseIndexName          | 基表名称         |
| RollupIndexName            | 物化视图名称       |
| RollupId | 物化视图的唯一 ID   |
| TransactionId               | 见 State 字段说明 |
| State           | 作业状态。        |
| Msg          | 错误信息     |
| Progress          | 作业进度。这里的进度表示 `已完成的tablet数量/总tablet数量`。创建物化视图是按 tablet 粒度进行的    |
| Timeout          | 作业超时时间，单位秒     |

State 说明：
- PENDING：作业准备中。

- WAITING_TXN： 在正式开始产生物化视图数据前，会等待当前这个表上的正在运行的导入事务完成。而 `TransactionId` 字段就是当前正在等待的事务 ID。当这个 ID 之前的导入都完成后，就会实际开始作业。

- RUNNING：作业运行中。

- FINISHED：作业运行成功。

- CANCELLED：作业运行失败。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象    | 说明 |
|------------|-------|----|
| ALTER_PRIV | table |    |

## 示例

1. 查看数据库 example_db 下的物化视图作业

   ```sql
   SHOW ALTER TABLE MATERIALIZED VIEW FROM example_db;
   ```
