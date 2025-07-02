---
{
"title": "AES_ENCRYPT",
"language": "en"
}
---

### Description

AES encryption function. This function behaves like the `AES_ENCRYPT` function in MySQL. By default, it uses the `AES_128_ECB` algorithm with `PKCS7` padding mode. The underlying encryption is done using the OpenSSL library.
Reference: https://dev.mysql.com/doc/refman/8.0/en/encryption-functions.html#function_aes-decrypt

#### Syntax

`VARCHAR AES_ENCRYPT(VARCHAR str, VARCHAR key_str[, VARCHAR init_vector][, VARCHAR encryption_mode])`

Returns the encrypted result, where:
- `str` is the text to be encrypted;
- `key_str` is the key. Note that this key is not a hexadecimal encoding, but a string representation of the encoded key. For example, for 128-bit key encryption, `key_str` should be 16-length. If the key is not long enough, use **zero padding** to make it up. If it is longer than that, the final key is found using a cyclic xor method. For example, if the 128-bit key used by the algorithm finally is `key`, then `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...`
- `init_vector` is the initial vector to be used in the algorithm, this is only valid for some algorithms, if not specified then Doris will use the built-in value;
- `encryption_mode` is the encryption algorithm, optionally available in [variable](../../../advanced/variables)。

:::warning
Function with two arguments will ignore session variable `block_encryption_mode` and always use `AES_128_ECB` to do encryption. So it's not recommended to use it.
:::

#### Remarks

For the incoming key, the AES_ENCRYPT function not directly uses, but will further process it. The specific steps are as follows:
1. According to the encryption algorithm used, determine the number of bytes of the key, for example, if you use the AES_128_ECB algorithm, the number of bytes of the key is `128 / 8 = 16` (if you use the AES_256_ECB algorithm, the number of bytes of the key is `128 / 8 = 32`). 2;
2. then for the key entered by the user, bits `i` and `16*k+i` are used to perform an isomorphism, followed by a zero if the key entered by the user is less than 16 bits. 3. finally, the newly generated key is used to generate a new key;
3. finally, the newly generated key is used for encryption.

### Example

```sql
select to_base64(aes_encrypt('text','F3229A0B371ED2D9441B830D21A390C3'));
+--------------------------------+
| to_base64(aes_encrypt('text')) |
+--------------------------------+
| wr2JEDVXzL9+2XtRhgIloA==       |
+--------------------------------+
1 row in set (0.01 sec)
```

If want to use other encryption algorithms, you can:

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
