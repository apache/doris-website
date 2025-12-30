---
{
    "title": "CREATE ROW POLICY",
    "language": "zh-CN",
    "description": "创建行安全策略，Explain 可以查看改写后的执行计划。"
}
---

## 描述

创建行安全策略，Explain 可以查看改写后的执行计划。

## 语法

```sql
CREATE ROW POLICY [ IF NOT EXISTS ] <policy_name> 
ON <table_name> 
AS { RESTRICTIVE | PERMISSIVE } 
TO { <user_name> | ROLE <role_name> } 
USING (<filter>);
```

## 必选参数

1. `<policy_name>`: 行安全策略名称

2. `<table_name>`: 表名称

3. `<filter_type>`: RESTRICTIVE 将一组策略通过 AND 连接，PERMISSIVE 将一组策略通过 OR 连接

3. `<filter>`: 相当于查询语句的过滤条件，例如：id=1

## 可选参数

1. `<user_name>`: 用户名称，不允许对 root 和 admin 用户创建

2. `<role_name>`: 角色名称

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege）          | 对象（Object） | 说明（Notes） |
| :------------------------- | :------------- | :------------ |
| ADMIN_PRIV 或 *GRANT_PRIV* | 全局           |               |

## 示例

1. 创建一组行安全策略

    ```sql
    CREATE ROW POLICY test_row_policy_1 ON test.table1 
    AS RESTRICTIVE TO test USING (c1 = 'a');
    CREATE ROW POLICY test_row_policy_2 ON test.table1 
    AS RESTRICTIVE TO test USING (c2 = 'b');
    CREATE ROW POLICY test_row_policy_3 ON test.table1 
    AS PERMISSIVE TO test USING (c3 = 'c');
    CREATE ROW POLICY test_row_policy_3 ON test.table1 
    AS PERMISSIVE TO test USING (c4 = 'd');
    ```

    当我们执行对 table1 的查询时被改写后的 sql 为

   ```sql
   SELECT * FROM (SELECT * FROM table1 WHERE (c1 = 'a' AND c2 = 'b') AND (c3 = 'c' OR c4 = 'd'))
   ```