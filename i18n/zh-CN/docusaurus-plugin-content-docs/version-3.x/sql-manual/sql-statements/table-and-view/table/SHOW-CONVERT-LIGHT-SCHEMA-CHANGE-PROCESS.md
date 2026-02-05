---
{
    "title": "SHOW CONVERT LIGHT SCHEMA CHANGE PROCESS",
    "language": "zh-CN",
    "description": "用来查看将非 light schema change 的 olpa 表转换为 light schema change 表的情况。"
}
---

## 描述

用来查看将非 light schema change 的 olpa 表转换为 light schema change 表的情况。

## 语法

```sql
SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS [ FROM <db_name> ]
```

## 可选参数

**1. `FROM <db_name>`**
> FROM 子句中可以指定查询的 database 的名称。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV    | 数据库）       | 目前仅支持 **ADMIN** 权限执行此操作 |

## 注意事项

- 执行此语句需要开启配置 `enable_convert_light_weight_schema_change`。

## 示例

- 查看在 database test 上的转换情况

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS FROM test;
  ```

- 查看全局的转换情况

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS;
  ```
