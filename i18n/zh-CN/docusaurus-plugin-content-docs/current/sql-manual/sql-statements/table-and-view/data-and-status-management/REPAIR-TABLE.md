---
{
    "title": "REPAIR TABLE",
    "language": "zh-CN",
    "description": "REPAIR TABLE 语句用于优先修复指定表或分区的副本。该语句具有以下功能："
}
---

## 描述

`REPAIR TABLE` 语句用于优先修复指定表或分区的副本。该语句具有以下功能：

- 可以修复整个表的所有副本
- 可以修复指定分区的副本
- 以高优先级进行副本修复
- 支持设置修复超时时间

## 语法

```sql
ADMIN REPAIR TABLE <table_name> [ PARTITION (<partition_name> [, ...]) ];
```

## 必选参数

**1. `<table_name>`**

> 指定需要修复的表名。
>
> 表名在其所在的数据库中必须唯一。

## 可选参数

**1. `PARTITION (<partition_name> [, ...])`**

> 指定需要修复的分区名称列表。
>
> 如果不指定此参数，则修复整个表的所有分区。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                           |
| :---------------- | :------------- | :-------------------------------------- |
| ADMIN             | 系统          | 用户必须拥有 ADMIN 权限才能执行该命令    |

## 注意事项

- 该语句仅表示系统会尝试以高优先级修复指定的副本，不保证一定能修复成功
- 默认超时时间为 14400 秒（4 小时）
- 超时后系统将不再以高优先级修复指定的副本
- 如果修复超时，需要重新执行该命令来继续修复
- 可以通过 `SHOW REPLICA STATUS` 命令查看修复进度
- 该命令不会影响系统的正常副本修复机制，仅提升指定表或分区的修复优先级

## 示例

- 修复整个表的副本：

    ```sql
    ADMIN REPAIR TABLE tbl1;
    ```

- 修复指定分区的副本：

    ```sql
    ADMIN REPAIR TABLE tbl1 PARTITION (p1, p2);
    ```

- 查看修复进度：

    ```sql
    SHOW REPLICA STATUS FROM tbl1;
    ```

