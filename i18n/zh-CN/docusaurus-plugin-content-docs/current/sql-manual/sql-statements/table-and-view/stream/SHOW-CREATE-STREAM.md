---
{
    "title": "SHOW CREATE STREAM",
    "language": "zh-CN",
    "description": "该语句用于展示 Table Stream 的创建语句。"
}
---

## 描述

该语句用于展示 Table Stream 的创建语句，包括基表、注释和属性。

## 语法

```sql
SHOW CREATE STREAM [<db_name>.]<stream_name>
```

## 必选参数

**1. `<stream_name>`**
> Stream 名称。

## 可选参数

**1. `<db_name>`**
> Stream 所在的数据库，未指定时为当前数据库。

## 返回值

| 列 | 说明 |
|---|---|
| `Stream` | Stream 名称 |
| `Create Stream` | 创建语句 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| SHOW_PRIV | Stream | |

## 注意事项

对普通表执行该语句会报错并提示使用 `SHOW CREATE TABLE`。基表已被删除时，`ON TABLE` 后显示 `UNKNOWN`。

## 示例

```sql
SHOW CREATE STREAM orders_stream\G
```

```text
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```
