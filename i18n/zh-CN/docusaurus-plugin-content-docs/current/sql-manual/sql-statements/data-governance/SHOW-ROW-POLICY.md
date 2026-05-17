---
{
    "title": "SHOW ROW POLICY",
    "language": "zh-CN",
    "description": "查看行安全策略。"
}
---

## 描述

查看行安全策略。

## 语法

```sql
SHOW ROW POLICY [ FOR { <user_name> | ROLE <role_name> } ];
```

## 可选参数

1. `<user_name>`: 用户名称

2. `<role_name>`:角色名称

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| ADMIN_PRIV        | 全局           |               |

## 示例

1. 查看所有安全策略

    ```sql
    SHOW ROW POLICY;
    ```

2. 指定用户名查询

    ```sql
    SHOW ROW POLICY FOR user1;
    ```

3. 指定角色名查询

    ```sql
    SHOW ROW POLICY for role role1;
    ```