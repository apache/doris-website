---
{
    "title": "SHOW CREATE LOAD",
    "language": "zh-CN",
    "description": "该语句用于展示导入作业的创建语句。"
}
---

## 描述

该语句用于展示导入作业的创建语句。

## 语法：

```sql
SHOW CREATE LOAD FOR <load_name>;
```

## 必选参数

**`<load_name>`**

> 例行导入作业名称

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| ADMIN/NODE_PRIV | 库（Database）    | 需要集群管理员权限 |

## 返回值

返回指定导入作业的创建语句。

## 举例

- 展示默认 db 下指定导入作业的创建语句

   ```sql
   SHOW CREATE LOAD for test_load
   ```

