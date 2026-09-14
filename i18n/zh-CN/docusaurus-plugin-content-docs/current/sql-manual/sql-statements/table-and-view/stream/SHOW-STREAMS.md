---
{
    "title": "SHOW STREAMS",
    "language": "zh-CN",
    "description": "该语句用于列出数据库中的 Table Stream。"
}
---

## 描述

该语句用于列出当前或指定数据库中的 Table Stream，只显示用户有 SHOW 权限的 Stream。Stream 的类型、基表、状态等详细信息可以查询 [information_schema.table_streams](../../../../admin-manual/system-tables/information_schema/table_streams)。

## 语法

```sql
SHOW STREAMS [{FROM | IN} <db_name>] [LIKE '<pattern>' | WHERE <expr>]
```

## 可选参数

**1. `<db_name>`**
> 数据库名，未指定时为当前数据库。

**2. `LIKE '<pattern>'`**
> 按名称模糊匹配，语法与 `SHOW TABLES LIKE` 相同。

**3. `WHERE <expr>`**
> 按条件过滤，语法与 `SHOW TABLES WHERE` 相同。

## 返回值

| 列 | 说明 |
|---|---|
| `Tables_in_<db_name>` | Stream 名称 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| SHOW_PRIV | Stream | 只列出有权限的 Stream |

## 示例

```sql
SHOW STREAMS;
```

```text
+----------------+
| Tables_in_demo |
+----------------+
| orders_stream  |
| events_stream  |
+----------------+
```

```sql
SHOW STREAMS FROM demo LIKE 'orders%';
```
