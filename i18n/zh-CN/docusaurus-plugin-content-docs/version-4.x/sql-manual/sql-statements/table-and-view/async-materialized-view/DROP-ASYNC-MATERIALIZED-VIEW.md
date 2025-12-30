---
{
    "title": "DROP ASYNC MATERIALIZED VIEW",
    "language": "zh-CN",
    "description": "该语句用于删除异步物化视图。"
}
---

## 描述

该语句用于删除异步物化视图。

语法：

```sql
DROP MATERIALIZED VIEW (IF EXISTS)? mvName=multipartIdentifier
```


1. IF EXISTS:
        如果物化视图不存在，不要抛出错误。如果不声明此关键字，物化视图不存在则报错。

2. mv_name:
        待删除的物化视图的名称。必填项。

## 示例

1. 删除表物化视图 mv1

```sql
DROP MATERIALIZED VIEW mv1;
```
2.如果存在，删除指定 database 的物化视图

```sql
DROP MATERIALIZED VIEW IF EXISTS db1.mv1;
```

## 关键词

    DROP, ASYNC, MATERIALIZED, VIEW

### 最佳实践

