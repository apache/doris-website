---
{
    "title": "ALTER ASYNC MATERIALIZED VIEW",
    "language": "zh-CN",
    "description": "该语句用于修改异步物化视图。"
}
---

## 描述

该语句用于修改异步物化视图。

#### 语法

```sql
ALTER MATERIALIZED VIEW mvName=multipartIdentifier ((RENAME newName=identifier)
       | (REFRESH (refreshMethod | refreshTrigger | refreshMethod refreshTrigger))
       | REPLACE WITH MATERIALIZED VIEW newName=identifier propertyClause?
       | (SET  LEFT_PAREN fileProperties=propertyItemList RIGHT_PAREN))
```

#### 说明

##### RENAME

用来更改物化视图的名字

例如：将 mv1 的名字改为 mv2

```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```

##### refreshMethod

同[创建异步物化视图](./CREATE-ASYNC-MATERIALIZED-VIEW)

不能通过 `ALTER MATERIALIZED VIEW` 把普通异步物化视图改为 `INCREMENTAL`，也不能把 IVM 改为其他默认刷新方式。如需切换，请重建物化视图。

##### refreshTrigger

同[创建异步物化视图](./CREATE-ASYNC-MATERIALIZED-VIEW)

##### SET

修改物化视图特有的 property

例如修改 mv1 的 grace_period 为 3000ms

```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

IVM 属性中，`ivm_use_full_keys` 只能在创建时设置，不能修改。`ivm_partition_window_limit` 可以修改；扩大窗口或移除限制后，下一次刷新需要执行 `COMPLETE` 重建基线。详见 [物化视图增量维护（IVM）](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#ivm-属性)。

##### REPLACE
```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
两个物化视图进行原子的替换操作

swap 默认为 TRUE

- 如果 swap 参数为 TRUE，相当于把物化视图 mv1 重命名为 mv2 , 同时把 mv2 重命名为 mv1
- 如果 swap 参数为 FALSE，相当于把 mv2 重命名为 mv1，原有的 mv1 被删除


例如想把 mv1 和 mv2 的名字互换
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```

例如想把 mv2 重命名为 mv1，并删除原先的 mv1
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```

## 关键词

    ALTER, ASYNC, MATERIALIZED, VIEW
