---
{
    "title": "SHOW DATABASE ID",
    "language": "zh-CN",
    "description": "该语句用于根据 database id 查找对应的 database name（仅管理员使用）"
}
---

### 描述

该语句用于根据 database id 查找对应的 database name（仅管理员使用）

## 语法

```sql
SHOW DATABASE <database_id>
```

## 必选参数

** 1. `<database_id>`**
>  数据库对应 id 号

## 返回结果


|  列 | 描述    |
|:--|:------|
| DbName |  数据库名称|

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象   | 说明            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | 整个集群 | 需要对整个集群具有管理权限 |

## 示例

- 根据 database id 查找对应的 database name
   
    ```sql
    SHOW DATABASE 10396;
    ```

    ```text
    +------------+
    | DbName     |
    +------------+
    | example_db |
    +------------+
    ```
