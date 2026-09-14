---
{
    "title": "DROP STREAM",
    "language": "zh-CN",
    "description": "该语句用于删除一个 Table Stream。"
}
---

## 描述

该语句用于删除一个 Table Stream。删除 Stream 不影响基表及其 Row Binlog。

## 语法

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE]
```

## 必选参数

**1. `<stream_name>`**
> 要删除的 Stream 名称。

## 可选参数

**1. `<db_name>`**
> Stream 所在的数据库，未指定时为当前数据库。

**2. `IF EXISTS`**
> 指定后，Stream 不存在时不报错。

**3. `FORCE`**
> 直接删除，不经过回收站。基表已被删除的 Stream 需要使用 `FORCE` 删除；存算分离模式下必须使用 `FORCE`。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| DROP_PRIV | Stream | |

## 注意事项

- 对 Stream 执行 `DROP TABLE` 会报错并提示使用 `DROP STREAM`。
- 存算分离模式下不带 `FORCE` 时报 `Cloud Table Stream only supports DROP STREAM ... FORCE`。
- Stream 被删除后，其消费位点一并删除；重新创建同名 Stream 会从创建时刻重新开始消费。

## 示例

```sql
DROP STREAM IF EXISTS orders_stream;
DROP STREAM orders_stream FORCE;
```
