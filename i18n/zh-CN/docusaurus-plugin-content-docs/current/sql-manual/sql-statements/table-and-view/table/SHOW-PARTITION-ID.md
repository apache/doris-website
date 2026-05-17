---
{
    "title": "SHOW PARTITION ID",
    "language": "zh-CN",
    "description": "该语句用于根据 partition id 查找对应的 database name, table name, partition name"
}
---

## 描述

该语句用于根据 partition id 查找对应的 database name, table name, partition name

## 语法

```sql
SHOW PARTITION <partition_id>
```

## 必选参数

**1. `<partition_id>`**

> 分区 id

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限                  | 对象 | 说明 |
|---------------------|----|----|
| ADMIN_PRIV |    |    |

## 示例

1. 根据 partition id 查找对应的 database name, table name, partition name

    ```sql
    SHOW PARTITION 10002;
    ```
   



