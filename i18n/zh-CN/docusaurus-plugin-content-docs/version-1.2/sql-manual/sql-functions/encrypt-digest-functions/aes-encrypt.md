---
{
"title": "AES_ENCRYPT",
"language": "zh-CN"
}
---

## 描述

AES 加密函数。该函数与 MySQL 中的 `AES_ENCRYPT` 函数行为一致。默认采用 `AES_128_ECB` 算法，padding 模式为 `PKCS7`。底层使用 OpenSSL 库进行加密。
Reference: https://dev.mysql.com/doc/refman/8.0/en/encryption-functions.html#function_aes-decrypt

## 语法

`VARCHAR AES_ENCRYPT(VARCHAR str, VARCHAR key_str[, VARCHAR init_vector][, VARCHAR encryption_mode])`

返回加密后的结果，其中：
- `str` 为待加密文本；
- `key_str` 为密钥。注意此密钥并非 16 进制编码，而是编码后的字符串表示。例如对于 128 位密钥加密，`key_str` 长度应为 16。如果密钥长度不足，使用**零填充**补齐。如果长度超出，使用循环异或的方式求出最终密钥。例如算法使用的 128 位密钥为 `key`，则 `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...`
- `init_vector` 为算法中使用到的初始向量，仅在特定算法下生效，如不指定，则 Doris 使用内置向量；
- `encryption_mode` 为加密算法，可选值见于：[变量](../../../advanced/variables)。

:::warning
两参数版本，会无视 session variable `block_encryption_mode`，始终使用 `AES_128_ECB` 算法进行加密。因此不推荐调用。
:::

#### Remarks

AES_ENCRYPT 函数对于传入的密钥，并不是直接使用，而是会进一步做处理，具体步骤如下：
1. 根据使用的加密算法，确定密钥的字节数，比如使用 AES_128_ECB 算法，则密钥字节数为 `128 / 8 = 16`（如果使用 AES_256_ECB 算法，则密钥字节数为 `128 / 8 = 32`）；
2. 然后针对用户输入的密钥，第 `i` 位和第 `16*k+i` 位进行异或，如果用户输入的密钥不足 16 位，则后面补 0；
3. 最后，再使用新生成的密钥进行加密；

## 举例

```sql
select to_base64(aes_encrypt('text','F3229A0B371ED2D9441B830D21A390C3'));
+--------------------------------+
| to_base64(aes_encrypt('text')) |
+--------------------------------+
| wr2JEDVXzL9+2XtRhgIloA==       |
+--------------------------------+
1 row in set (0.01 sec)
```

如果你想更换其他加密算法，可以

```sql
set block_encryption_mode="AES_256_CBC";

select to_base64(aes_encrypt('text','F3229A0B371ED2D9441B830D21A390C3', '0123456789'));
+-----------------------------------------------------+
| to_base64(aes_encrypt('text', '***', '0123456789')) |
+-----------------------------------------------------+
| tsmK1HzbpnEdR2//WhO+MA==                            |
+-----------------------------------------------------+
1 row in set (0.01 sec)
```

### Keywords
    AES_ENCRYPT, AES, ENCRYPT
