---
{
    "title": "SHOW LAST INSERT",
    "language": "zh-CN",
    "description": "该语法用于查看在当前 session 连接中，最近一次 insert 操作的结果"
}
---

## 描述

该语法用于查看在当前 session 连接中，最近一次 insert 操作的结果

语法：

```sql
SHOW LAST INSERT
```

返回结果示例：

```
    TransactionId: 64067
            Label: insert_ba8f33aea9544866-8ed77e2844d0cc9b
         Database: default_cluster:db1
            Table: t1
TransactionStatus: VISIBLE
       LoadedRows: 2
     FilteredRows: 0
```

说明：

* TransactionId：事务 id
* Label：insert 任务对应的 label
* Database：insert 对应的数据库
* Table：insert 对应的表
* TransactionStatus：事务状态
    * PREPARE：准备阶段
    * PRECOMMITTED：预提交阶段
    * COMMITTED：事务成功，但数据不可见
    * VISIBLE：事务成功且数据可见
    * ABORTED：事务失败
* LoadedRows：导入的行数
* FilteredRows：被过滤的行数

## 示例

## 关键词

    SHOW, LAST, INSERT

### 最佳实践

