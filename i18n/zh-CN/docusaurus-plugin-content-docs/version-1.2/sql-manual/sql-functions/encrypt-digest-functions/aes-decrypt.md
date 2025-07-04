---
{
"title": "AES_DECRYPT",
"language": "zh-CN"
}
---

## 描述

AES 解密函数。该函数与 MySQL 中的 `AES_DECRYPT` 函数行为一致。默认采用 `AES_128_ECB` 算法，padding 模式为 `PKCS7`。底层使用 OpenSSL 库进行解密。

## 语法

`VARCHAR AES_DECRYPT(VARCHAR str, VARCHAR key_str[, VARCHAR init_vector][, VARCHAR encryption_mode])`

返回解密后的结果，其中：
- `str` 为待解密文本；
- `key_str` 为密钥。注意此密钥并非 16 进制编码，而是编码后的字符串表示。例如对于 128 位密钥加密，`key_str` 长度应为 16。如果密钥长度不足，使用**零填充**补齐。如果长度超出，使用循环异或的方式求出最终密钥。例如算法使用的 128 位密钥为 `key`，则 `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...`
- `init_vector` 为算法中使用到的初始向量，仅在特定算法下生效，如不指定，则 Doris 使用内置向量；
- `encryption_mode` 为加密算法，可选值见于：[变量](../../../advanced/variables)。

:::warning
两参数版本，会无视 session variable `block_encryption_mode`，始终使用 `AES_128_ECB` 算法进行解密。因此不推荐调用。
:::

## 举例

```sql
select aes_decrypt(from_base64('wr2JEDVXzL9+2XtRhgIloA=='),'F3229A0B371ED2D9441B830D21A390C3');
+------------------------------------------------------+
| aes_decrypt(from_base64('wr2JEDVXzL9+2XtRhgIloA==')) |
+------------------------------------------------------+
| text                                                 |
+------------------------------------------------------+
1 row in set (0.01 sec)
```

如果你想更换其他加密算法，可以

```sql
set block_encryption_mode="AES_256_CBC";

select AES_DECRYPT(FROM_BASE64('tsmK1HzbpnEdR2//WhO+MA=='),'F3229A0B371ED2D9441B830D21A390C3', '0123456789');
+---------------------------------------------------------------------------+
| aes_decrypt(from_base64('tsmK1HzbpnEdR2//WhO+MA=='), '***', '0123456789') |
+---------------------------------------------------------------------------+
| text                                                                      |
+---------------------------------------------------------------------------+
1 row in set (0.01 sec)
```

### Keywords
    AES_DECRYPT, AES, DECRYPT
