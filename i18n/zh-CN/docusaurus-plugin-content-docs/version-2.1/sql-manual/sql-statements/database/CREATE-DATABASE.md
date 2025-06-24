---
{
    "title": "CREATE DATABASE",
    "language": "zh-CN"
}
---

## 描述

该语句用于新建数据库（database）

## 语法

```sql
CREATE DATABASE [IF NOT EXISTS] <db_name>
    [PROPERTIES ("<key>"="<value>"[, ... ])];
```

## 必选参数

** 1. `<db_name>`**
>  数据库名称

## 可选参数

** 1. `<PROPERTIES>`**
>  该数据库的附加信息

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象    | 说明             |
|:-----------|:------|:---------------|
| CREATE_PRIV | 对应数据库 | 需要对对应数据库具有创建权限 |


## 注意事项

如果要为 db 下的 table 指定默认的副本分布策略，需要指定`<replication_allocation>`（table 的`<replication_allocation>`属性优先级会高于 db）:

  ```sql
  PROPERTIES (
    "replication_allocation" = "tag.location.default:3"
  )
  ```

## 示例

- 新建数据库 db_test

   ```sql
   CREATE DATABASE db_test;
   ```

- 新建数据库并设置默认的副本分布：

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"replication_allocation" = "tag.location.group_1:3"
   );
   ```
