---
{
    "title": "SHOW TABLE ID",
    "language": "zh-CN",
    "description": "该语句用于根据 table id 查找对应的 database name, table name。"
}
---

### 描述

该语句用于根据 table id 查找对应的 database name, table name。

## 语法

```sql
SHOW TABLE <table_id>
```

## 必选参数

**1. `<table_id>`**
> 需要查找 database name, table name 表的 `<table_id>`。

## 返回值

| 列名（Column）           | 类型（DataType） | 说明（Notes） |
|:---------------------|:-------------|:----------|
| DbName               | 字符串          | 数据库名称     |
| TableName            | 字符串          | 数据表名称     |
| DbId                 | 字符串          | 数据库 ID     |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV    | 数据表（table） | 目前仅支持 **ADMIN** 权限执行此操作 |

## 示例

 1. 根据 table id 查找对应的 database name, table name
     
    ```sql
    SHOW TABLE 2261121
    ```
    
    ```text
    +--------+------------+---------+
    | DbName | TableName  | DbId    |
    +--------+------------+---------+
    | demo   | test_table | 2261034 |
    +--------+------------+---------+
    ```


