---
{
    "title": "DROP ENCRYPTKEY",
    "language": "zh-CN",
    "description": "此语句用于删除一个自定义密钥。密钥的名字完全一致才能够被删除。"
}
---

## 描述

此语句用于删除一个自定义密钥。密钥的名字完全一致才能够被删除。

## 语法

```sql
DROP ENCRYPTKEY [IF EXISTS] <key_name>
```

## 必选参数

**1. `<key_name>`**

> 要删除密钥的名字，可以包含数据库的名字。比如：`db1.my_key`。

## 可选参数

**1. `[IF EXISTS]`**

> 如果密钥不存在，则不执行任何操作。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object）         | 说明（Notes）                          |
|:--------------|:-------------------|:-----------------------------------|
| `ADMIN_PRIV`  | 用户（User）或 角色（Role） | 用户或者角色拥有 `ADMIN_PRIV` 权限才能进行删除密钥操作 |

## 示例

- 删除掉一个密钥

    ```sql
    DROP ENCRYPTKEY my_key;
    ```

- 删除掉一个密钥，如果密钥不存在则不执行任何操作

    ```sql
    DROP ENCRYPTKEY IF EXISTS testdb.my_key;
    ```

