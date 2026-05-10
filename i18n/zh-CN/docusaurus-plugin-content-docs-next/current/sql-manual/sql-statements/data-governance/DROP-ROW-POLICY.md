---
{
    "title": "DROP ROW POLICY",
    "language": "zh-CN",
    "description": "删除行安全策略。"
}
---

## 描述
删除行安全策略。

## 语法

```sql
DROP ROW POLICY <policy_name> on <table_name>
  [ FOR { <user_name> | ROLE <role_name> } ];
```

## 必选参数

1. `<policy_name>`:行安全策略名称

2. `<table_name>`:表名称

## 可选参数

1. `<user_name>`:用户名称

2. `<role_name>`:角色名称

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege）          | 对象（Object） | 说明（Notes） |
| :------------------------- | :------------- | :------------ |
| ADMIN_PRIV 或 *GRANT_PRIV* | 全局           |               |

## 示例

1. 删除 *db1.table1* 的 *policy1 行安全策略*

    ```sql
    DROP ROW POLICY policy1 ON db1.table1
    ```

2. 删除 db1.table1 作用于 user1 的 policy1 行安全策略

    ```sql
    DROP ROW POLICY policy1 ON db1.table1 FOR user1
    ```

3. 删除 db1.table1 作用于 role1 的 policy1 行安全策略

    ```sql
    DROP ROW POLICY policy1 ON db1.table1 FOR role role1
    ```