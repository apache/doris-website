---
{
"title": "SM4_DECRYPT",
"language": "en"
}
---

### Description

SM4 is a China's national standard symmetric key encryption algorithm, widely used in finance, communications, e-commerce, and other fields. The SM4_DECRYPT function is used to decrypt data using the SM4 algorithm. By default, it uses the `SM4_128_ECB` algorithm.

### Syntax

```sql
VARCHAR SM4_DECRYPT(VARCHAR str, VARCHAR key_str [, VARCHAR init_vector [, VARCHAR encryption_mode]])
```

### Parameters

- `str` is the text to be decrypted;
- `key_str` is the key. Note that this key is not a hexadecimal encoding, but a string representation of the encoded key. For example, for 128-bit key encryption, `key_str` should be 16-length. If the key is not long enough, use **zero padding** to make it up. If it is longer than that, the final key is found using a cyclic xor method. For example, if the 128-bit key used by the algorithm finally is `key`, then `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...`
- `init_vector` is the initial vector to be used in the algorithm, this is only valid for some algorithms, if not specified then Doris will use the built-in value;
- `encryption_mode` is the encryption algorithm, optionally available in variable.

:::warning
Function with two arguments will ignore session variable `block_encryption_mode` and always use `SM4_128_ECB` to do decryption. This is different from the 1.2 version behavior and must be taken into account when upgrading or downgrading.
:::

### Example

```sql
set block_encryption_mode='';
select SM4_DECRYPT(FROM_BASE64('aDjwRflBrDjhBZIOFNw3Tg=='),'F3229A0B371ED2D9441B830D21A390C3');
```

```text
+--------------------------------------------------------------------------------+
| sm4_decrypt(from_base64('aDjwRflBrDjhBZIOFNw3Tg=='), '***', '', 'SM4_128_ECB') |
+--------------------------------------------------------------------------------+
| text                                                                           |
+--------------------------------------------------------------------------------+
```

```sql
select SM4_DECRYPT(FROM_BASE64('G7yqOKfEyxdagboz6Qf01A=='),'F3229A0B371ED2D9441B830D21A390C3', '0123456789');
```

```text
+--------------------------------------------------------------------------------------------------------+
| sm4_decrypt(from_base64('G7yqOKfEyxdagboz6Qf01A=='), 'F3229A0B371ED2D9441B830D21A390C3', '0123456789') |
+--------------------------------------------------------------------------------------------------------+
| text                                                                                                   |
+--------------------------------------------------------------------------------------------------------+
```
