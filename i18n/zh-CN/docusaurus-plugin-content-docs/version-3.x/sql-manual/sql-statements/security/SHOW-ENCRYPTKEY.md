---
{
    "title": "SHOW ENCRYPTKEY",
    "language": "zh-CN",
    "description": "查看数据库下所有的自定义的密钥。"
}
---

## 描述

查看数据库下所有的自定义的密钥。

## 语法

```sql
SHOW ENCRYPTKEYS [ { IN | FROM } <db> ] [ LIKE '<key_pattern>']
```

## 可选参数

**1. `<db>`**

> 要查询的数据库名字。比如：`db1.my_key`。


**2. `<key_pattern>`**

> 用来过滤密钥名称的参数。

## 返回值

| 列名                | 说明   |
|-------------------|------|
| EncryptKey Name   | 密钥名称 |
| EncryptKey String | 密钥的值 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object）          | 说明（Notes）                         |
|:--------------|:--------------------|:----------------------------------|
| `ADMIN_PRIV`  | 用户（User）或 角色（Role） | 需对目标用户或角色持有 `ADMIN_PRIV` 权限才能查看密钥 |

## 注意事项

- 如果用户指定了数据库，那么查看对应数据库的，否则直接查询当前会话所在数据库。

## 示例

- 查看当前会话所在数据库下所有的密钥

    ```sql
    SHOW ENCRYPTKEYS;
    ```
     ```text
    +-----------------+-------------------+
    | EncryptKey Name | EncryptKey String |
    +-----------------+-------------------+
    | testdb.test_key | ABCD123456789     |
    +-----------------+-------------------+
    ```

- 查看指定数据库下所有的密钥

    ```sql
    SHOW ENCRYPTKEYS FROM example_db ;
    ```
    ```text
    +---------------------+-------------------+
    | EncryptKey Name     | EncryptKey String |
    +---------------------+-------------------+
    | example_db.my_key   | ABCD123456789     |
    | example_db.test_key | ABCD123456789     |
    +---------------------+-------------------+
     ```

- 查看指定数据库下匹配指定密钥名称的密钥

    ```sql
    SHOW ENCRYPTKEYS FROM example_db LIKE "%my%";
    ```
    ```text
    +-------------------+-------------------+
    | EncryptKey Name   | EncryptKey String |
    +-------------------+-------------------+
    | example_db.my_key | ABCD123456789     |
    +-------------------+-------------------+
     ```


