---
{
    "title": "CREATE ENCRYPTKEY",
    "language": "zh-CN",
    "description": "此语句创建一个自定义密钥。"
}
---

## 描述

此语句创建一个自定义密钥。

## 语法

```sql
CREATE ENCRYPTKEY <key_name> AS "<key_string>"
```

## 必选参数

**1. `<key_name>`**

> 要创建密钥的名字，可以包含数据库的名字。比如：`db1.my_key`。


**2. `<key_string>`**

> 要创建密钥的字符串。
> 如果 `key_name` 中包含了数据库名字，那么这个自定义密钥会创建在对应的数据库中，否则这个函数将会创建在当前会话所在的数据库。新密钥的名字不能够与对应数据库中已存在的密钥相同，否则会创建失败。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object）          | 说明（Notes）                            |
|:--------------|:--------------------|:-------------------------------------|
| `ADMIN_PRIV`  | 用户（User）或 角色（Role） | 需对目标用户或角色持有 `ADMIN_PRIV` 权限方可创建自定义密钥 |

## 示例

- 创建一个自定义密钥

    ```sql
    CREATE ENCRYPTKEY my_key AS "ABCD123456789";
    ```

- 在 testdb 数据库下创建一个自定义密钥

    ```sql
    CREATE ENCRYPTKEY testdb.test_key AS "ABCD123456789";
    ```

- 使用自定义密钥加密

  :::tip
  使用自定义密钥需在密钥前添加关键字 `KEY`/`key`，与 `key_name` 空格隔开。
  :::

    ```sql
   SELECT HEX(AES_ENCRYPT("Doris is Great", KEY my_key));
   ```
   ```text
    +------------------------------------------------+
    | hex(aes_encrypt('Doris is Great', key my_key)) |
    +------------------------------------------------+
    | D26DB38579D6A343350EDDC6F2AD47C6               |
    +------------------------------------------------+
   ```

- 使用自定义密钥解密

   ```sql
   SELECT AES_DECRYPT(UNHEX('D26DB38579D6A343350EDDC6F2AD47C6'), KEY my_key);
   ```
   ```text
   +------------------------------------------------- -------------------+
   | aes_decrypt(unhex('D26DB38579D6A343350EDDC6F2AD47C6'), key my_key)  |
   +------------------------------------------------- -------------------+
   | Doris is Great                                                      |
   +------------------------------------------------- -------------------+
   ```


