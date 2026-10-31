---
{
    "title": "CANCEL REPAIR TABLE",
    "language": "zh-CN",
    "description": "CANCEL REPAIR TABLE 语句用于取消对指定表或分区的高优先级修复。该语句具有以下功能："
}
---

## 描述

`CANCEL REPAIR TABLE` 语句用于取消对指定表或分区的高优先级修复。该语句具有以下功能：

- 可以取消整个表的高优先级修复
- 可以取消指定分区的高优先级修复
- 不影响系统默认的副本修复机制

## 语法

```sql
ADMIN CANCEL REPAIR TABLE <table_name> [ PARTITION (<partition_name> [, ...]) ];
```

## 必选参数

**1. `<table_name>`**

> 指定要取消修复的表名。
>
> 表名在其所在的数据库中必须唯一。

## 可选参数

**1. `PARTITION (<partition_name> [, ...])`**

> 指定要取消修复的分区名称列表。
>
> 如果不指定此参数，则取消整个表的高优先级修复。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                           |
| :---------------- | :------------- | :-------------------------------------- |
| ADMIN             | 系统          | 用户必须拥有 ADMIN 权限才能执行该命令    |

## 注意事项

- 该语句仅取消高优先级修复，不会停止系统的默认副本修复机制
- 取消后，系统仍会以默认调度方式修复副本
- 如果需要重新设置高优先级修复，可以使用 `ADMIN REPAIR TABLE` 命令
- 该命令执行后立即生效

## 示例

- 取消整个表的高优先级修复：

    ```sql
    ADMIN CANCEL REPAIR TABLE tbl;
    ```

- 取消指定分区的高优先级修复：

    ```sql
    ADMIN CANCEL REPAIR TABLE tbl PARTITION(p1, p2);
    ```
