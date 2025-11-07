---
{
    "title": "DROP-ENCRYPT-KEY",
    "language": "zh-CN"
}
---

## DROP-ENCRYPTKEY

### Name

DROP ENCRYPTKEY

## 描述

语法：

```sql
DROP ENCRYPTKEY key_name
```

参数说明：

- `key_name`: 要删除密钥的名字, 可以包含数据库的名字。比如：`db1.my_key`。

删除一个自定义密钥。密钥的名字完全一致才能够被删除。

执行此命令需要用户拥有 `ADMIN` 权限。

## 举例

1. 删除掉一个密钥

   ```sql
   DROP ENCRYPTKEY my_key;
   ```

### Keywords

    DROP, ENCRYPT, KEY

### Best Practice

