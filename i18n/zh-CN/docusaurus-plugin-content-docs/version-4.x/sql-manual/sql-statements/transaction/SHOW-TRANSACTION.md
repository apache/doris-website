---
{
    "title": "SHOW TRANSACTION",
    "language": "zh-CN",
    "description": "该语法用于查看指定 transaction id 或 label 的事务详情。"
}
---

## 描述

该语法用于查看指定 transaction id 或 label 的事务详情。

### 语法

```sql
SHOW TRANSACTION
[FROM <db_name>]
WHERE
[id = <transaction_id> | label = <label_name>];
```

## 必选参数
**1. `<transaction_id>`**

需要查看事务详情的 transaction id

**2. `<label_name>`**

需要查看事务详情的 label

## 可选参数

**1. `<db_name>`**

需要查看事务详情的 database


## 返回值

| Column name  | Description |
|---|---|
| TransactionId | 事务 id  | 
| Label | 导入任务对应的 label  | 
| Coordinator | 负责事务协调的节点  | 
| TransactionStatus | 事务状态  | 
| PREPARE | 准备阶段  | 
| COMMITTED | 事务成功，但数据不可见  | 
| VISIBLE | 事务成功且数据可见  | 
| ABORTED | 事务失败  | 
| LoadJobSourceType | 导入任务的类型  | 
| PrepareTime | 事务开始时间  | 
| CommitTime | 事务提交成功的时间  | 
| FinishTime | 数据可见的时间  | 
| Reason | 错误信息  | 
| ErrorReplicasCount | 有错误的副本数  | 
| ListenerId | 相关的导入作业的 id  | 
| TimeoutMs | 事务超时时间，单位毫秒  | 

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| LOAD_PRIV     | Database   |  |


## 示例

1. 查看 id 为 4005 的事务：

    ```sql
    SHOW TRANSACTION WHERE ID=4005;
    ```

2. 指定 db 中，查看 id 为 4005 的事务：

    ```sql
    SHOW TRANSACTION FROM db WHERE ID=4005;
    ```

3. 查看 label 为 label_name 的事务：

    ```sql
    SHOW TRANSACTION WHERE LABEL = 'label_name';
    ```
