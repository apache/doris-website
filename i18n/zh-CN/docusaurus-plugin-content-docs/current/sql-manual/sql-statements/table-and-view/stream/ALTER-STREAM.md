---
{
    "title": "ALTER STREAM",
    "language": "zh-CN",
    "description": "该语句用于修改 Table Stream 的注释。"
}
---

## 描述

该语句用于修改 Table Stream 的注释。Table Stream 的消费类型（`type`）和 `show_initial_rows` 属性创建后不能修改，需要删除后重建。

## 语法

```sql
ALTER STREAM [<db_name>.]<stream_name> { SET | MODIFY } COMMENT '<comment>'
```

## 必选参数

**1. `<stream_name>`**
> 要修改的 Stream 名称。

**2. `<comment>`**
> 新的注释。`SET COMMENT` 与 `MODIFY COMMENT` 等价。

## 可选参数

**1. `<db_name>`**
> Stream 所在的数据库，未指定时为当前数据库。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| ALTER_PRIV | Stream | |

## 注意事项

修改后的注释会体现在 `SHOW CREATE STREAM` 和 `information_schema.table_streams` 的 `STREAM_COMMENT` 列中。

## 示例

```sql
ALTER STREAM orders_stream SET COMMENT 'sync order changes to dwd';
ALTER STREAM orders_stream MODIFY COMMENT 'sync order changes to dwd, hourly';
```
