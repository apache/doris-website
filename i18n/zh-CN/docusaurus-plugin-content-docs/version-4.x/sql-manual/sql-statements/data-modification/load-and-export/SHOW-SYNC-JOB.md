---
{
    "title": "SHOW SYNC JOB",
    "language": "zh-CN",
    "description": "此语句用于显示所有数据库中的常驻数据同步作业状态。"
}
---

## 描述

此语句用于显示所有数据库中的常驻数据同步作业状态。

## 语法

```sql
SHOW SYNC JOB [FROM <db_name>]
```
## 可选参数
**1. `<db_name>`**
> 显示指定数据库下的所有数据同步作业状态。

## 权限控制  
执行此 SQL 命令的用户必须至少具有以下权限之一：  

| 权限                                                                 | 对象         | 说明                                      |  
|--------------------------------------------------------------------|------------|-----------------------------------------|  
| ADMIN_PRIV, SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV, SHOW_VIEW_PRIV | 数据库 `db_name` | 执行此操作需至少拥有上述权限中的一项。 |  

## 示例

1. 显示当前数据库的所有数据同步作业状态。

   ```sql
   SHOW SYNC JOB;
   ```

2. 显示 `test_db` 数据库下的所有数据同步作业状态。

   ```sql
   SHOW SYNC JOB FROM `test_db`;
   ```