---
{
"title": "SM4_ENCRYPT",
"language": "zh-CN"
}
---

## 描述
## 语法

`VARCHAR SM4_ENCRYPT(VARCHAR str, VARCHAR key_str[, VARCHAR init_vector][, VARCHAR encryption_mode])`

返回加密后的结果，其中：
- `str` 为待加密文本；
- `key_str` 为密钥。注意此密钥并非 16 进制编码，而是编码后的字符串表示。例如对于 128 位密钥加密，`key_str` 长度应为 16。如果密钥长度不足，使用**零填充**补齐。如果长度超出，使用循环异或的方式求出最终密钥。例如算法使用的 128 位密钥为 `key`，则 `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...`
- `init_vector` 为算法中使用到的初始向量，仅在特定算法下生效，如不指定，则 Doris 使用内置向量；
- `encryption_mode` 为加密算法，可选值见于：[变量](../../../advanced/variables)。

:::warning
两参数版本，会无视 session variable `block_encryption_mode`，始终误用 `AES_128_ECB` 算法进行加密。因此强烈不推荐调用。
:::

## 举例

```sql
MySQL > select TO_BASE64(SM4_ENCRYPT('text','F3229A0B371ED2D9441B830D21A390C3'));
+--------------------------------+
| to_base64(sm4_encrypt('text')) |
+--------------------------------+
| aDjwRflBrDjhBZIOFNw3Tg==       |
+--------------------------------+
1 row in set (0.010 sec)

MySQL > set block_encryption_mode="SM4_128_CBC";
Query OK, 0 rows affected (0.001 sec)

MySQL > select to_base64(SM4_ENCRYPT('text','F3229A0B371ED2D9441B830D21A390C3', '0123456789'));
+----------------------------------------------------------------------------------+
| to_base64(sm4_encrypt('text', 'F3229A0B371ED2D9441B830D21A390C3', '0123456789')) |
+----------------------------------------------------------------------------------+
| G7yqOKfEyxdagboz6Qf01A==                                                         |
+----------------------------------------------------------------------------------+
1 row in set (0.014 sec)
```

### Keywords
    SM4_ENCRYPT, SM4, ENCRYPT 
