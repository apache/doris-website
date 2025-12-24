---
{
    "title": "DROP DATABASE",
    "language": "zh-CN",
    "description": "该语句用于删除数据库（database）"
}
---

## 描述

该语句用于删除数据库（database）

## 语法    

```sql
DROP DATABASE [IF EXISTS] <db_name> [FORCE];
```

## 必选参数

** 1. `<db_name>`**
>  数据库名称

## 可选参数

** 1. `FORCE`**
>  强制删除，不走回收站

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象    | 说明             |
|:-----------|:------|:---------------|
| DROP_PRIV | 对应数据库 | 需要对对应数据库具有删除权限 |


## 注意事项

如果执行 DROP DATABASE FORCE，则系统不会检查该数据库是否存在未完成的事务，数据库将直接被删除并且不能被恢复，一般不建议执行此操作

## 示例

- 删除数据库 db_test
    
    ```sql
    DROP DATABASE db_test;
    ```
