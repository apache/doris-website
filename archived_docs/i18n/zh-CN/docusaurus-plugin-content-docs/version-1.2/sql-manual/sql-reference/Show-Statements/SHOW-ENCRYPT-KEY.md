---
{
    "title": "SHOW-ENCRYPT-KEY",
    "language": "zh-CN"
}
---

## SHOW-ENCRYPT-KEY

### Name

SHOW ENCRYPTKEYS

## 描述

查看数据库下所有的自定义的密钥。如果用户指定了数据库，那么查看对应数据库的，否则直接查询当前会话所在数据库。

需要对这个数据库拥有 `ADMIN` 权限

语法：

```sql
SHOW ENCRYPTKEYS [IN|FROM db] [LIKE 'key_pattern']
```

参数

>`db`: 要查询的数据库名字
>`key_pattern`: 用来过滤密钥名称的参数

## 举例

 ```sql
    mysql> SHOW ENCRYPTKEYS;
    +-------------------+-------------------+
    | EncryptKey Name   | EncryptKey String |
    +-------------------+-------------------+
    | example_db.my_key | ABCD123456789     |
    +-------------------+-------------------+
    1 row in set (0.00 sec)

    mysql> SHOW ENCRYPTKEYS FROM example_db LIKE "%my%";
    +-------------------+-------------------+
    | EncryptKey Name   | EncryptKey String |
    +-------------------+-------------------+
    | example_db.my_key | ABCD123456789     |
    +-------------------+-------------------+
    1 row in set (0.00 sec)
 ```

### Keywords

    SHOW, ENCRYPT, KEY

### Best Practice

