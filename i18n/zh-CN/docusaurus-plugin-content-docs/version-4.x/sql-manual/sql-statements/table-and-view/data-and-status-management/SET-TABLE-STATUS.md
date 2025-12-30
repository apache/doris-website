---
{
    "title": "SET TABLE STATUS",
    "language": "zh-CN",
    "description": "SET TABLE STATUS 语句用于手动设置 OLAP 表的状态。该语句具有以下功能："
}
---

## 描述

`SET TABLE STATUS` 语句用于手动设置 OLAP 表的状态。该语句具有以下功能：

- 仅支持 OLAP 表的状态设置
- 可以将表状态修改为指定的目标状态
- 用于解除因表状态导致的任务阻塞

**支持的状态**：

| 状态 | 说明 |
|------|------|
| NORMAL | 表示表处于正常状态 |
| ROLLUP | 表示表正在进行 ROLLUP 操作 |
| SCHEMA_CHANGE | 表示表正在进行 Schema 变更 |
| BACKUP | 表示表正在进行备份 |
| RESTORE | 表示表正在进行恢复 |
| WAITING_STABLE | 表示表正在等待稳定状态 |

## 语法

```sql
ADMIN SET TABLE <table_name> STATUS PROPERTIES ("<key>" = "<value>" [, ...]);
```

其中：

```sql
<key>
  : "state"

<value>
  : "NORMAL"
  | "ROLLUP"
  | "SCHEMA_CHANGE"
  | "BACKUP"
  | "RESTORE"
  | "WAITING_STABLE"
```

## 必选参数

**1. `<table_name>`**

> 指定要设置状态的表名。
>
> 表名在其所在的数据库中必须唯一。

**2. `PROPERTIES ("state" = "<value>")`**

> 指定表的目标状态。
>
> 必须设置 "state" 属性，且值必须是支持的状态之一。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                           |
| :---------------- | :------------- | :-------------------------------------- |
| ADMIN             | 系统          | 用户必须拥有 ADMIN 权限才能执行该命令    |

## 注意事项

- 此命令仅用于紧急故障修复，请谨慎操作
- 仅支持 OLAP 表，不支持其他类型的表
- 如果表已经处于目标状态，该命令将被忽略
- 不当的状态设置可能会导致系统异常，建议在技术支持指导下使用
- 修改状态后，建议及时观察系统运行情况

## 示例

- 将表状态设置为 NORMAL：

    ```sql
    ADMIN SET TABLE tbl1 STATUS PROPERTIES("state" = "NORMAL");
    ```

- 将表状态设置为 SCHEMA_CHANGE：

    ```sql
    ADMIN SET TABLE tbl2 STATUS PROPERTIES("state" = "SCHEMA_CHANGE");
    ```
