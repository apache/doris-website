---
{
    "title": "DROP STATS",
    "language": "zh-CN",
    "description": "删除指定表和列的统计信息。如果不指定列名，则删除所有列的统计信息。"
}
---

## 描述

删除指定表和列的统计信息。如果不指定列名，则删除所有列的统计信息。

## 语法

```sql
DROP STATS <table_name> [ <column_names> ]
```

其中：

```sql
column_names
  :
  (<column_name>, [ <column_name>... ])
```

## 必选参数

`<table_name>`: 表的标识符（即名称）

## 可选参数

`<column_names>`: 列标识符列表（即名称列表）

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| DROP_PRIV         | 表（Table）    |               |

## 示例

- 删除 table1 中所有列的统计信息

    ```sql
    DROP STATS table1
    ```

- 删除 table1 中 col1 和 col2 的统计信息

    ```sql
    DROP STATS table1 (col1, col2)
    ```