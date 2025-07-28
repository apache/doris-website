---
{
"title": "AES_DECRYPT",
"language": "en"
}
---

## Description

AES decryption function. This function behaves the same as the `AES_DECRYPT` function in MySQL. The default algorithm is `AES_128_ECB`, and the padding mode is `PKCS7`.

## Syntax

```sql
AES_DECRYPT( <str>, <key_str>[, <init_vector>][, <encryption_mode>])
```

## Parameters

| parameter           | description                                                                                                                                                                                         |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`             | The text to be decrypted                                                                                                                                                                                              |
| `<key_str>`         | is the key. Note that this key is not a hexadecimal encoding, but an encoded string representation. For example, for 128-bit key encryption, the length of `key_str` should be 16. If the key length is insufficient, use **zero padding** to make it complete. If the length exceeds, use circular XOR to find the final key. For example, if the 128-bit key used by the algorithm is `key`, then `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...` |
| `<init_vector>`     | It is the initial vector used in the algorithm. It is only effective under specific algorithms. If not specified, Doris uses the built-in vector                                                                                                                                                          |
| `<encryption_mode>` | For encryption algorithms, optional values ​​are given in variables                                                                                                                                                                                       |

## Return Value

If decryption is successful: Returns the decrypted data, usually a binary representation of the plaintext.

If decryption fails: Returns NULL.


## Examples

### Decryption successful

Using the default algorithm
```sql
set block_encryption_mode='';
select aes_decrypt(from_base64('wr2JEDVXzL9+2XtRhgIloA=='),'F3229A0B371ED2D9441B830D21A390C3');
```

```text
+--------------------------------------------------------------------------------+
| aes_decrypt(from_base64('wr2JEDVXzL9+2XtRhgIloA=='), '***', '', 'AES_128_ECB') |
+--------------------------------------------------------------------------------+
| text                                                                           |
+--------------------------------------------------------------------------------+
```

Use AES_256_CBC algorithm
```sql
set block_encryption_mode="AES_256_CBC";
select aes_decrypt(from_base64('3dym0E7/+1zbrLIaBVNHSw=='),'F3229A0B371ED2D9441B830D21A390C3');
```

```text
+--------------------------------------------------------------------------------+
| aes_decrypt(from_base64('3dym0E7/+1zbrLIaBVNHSw=='), '***', '', 'AES_256_CBC') |
+--------------------------------------------------------------------------------+
| text                                                                           |
+--------------------------------------------------------------------------------+
```

Use AES_256_CBC algorithm and set initial vector
```sql
select AES_DECRYPT(FROM_BASE64('tsmK1HzbpnEdR2//WhO+MA=='),'F3229A0B371ED2D9441B830D21A390C3', '0123456789');
```

```text
+------------------------------------------------------------------------------------------+
| aes_decrypt(from_base64('tsmK1HzbpnEdR2//WhO+MA=='), '***', '0123456789', 'AES_256_CBC') |
+------------------------------------------------------------------------------------------+
| text                                                                                     |
+------------------------------------------------------------------------------------------+
```

### Decryption failed

```sql
select AES_DECRYPT(FROM_BASE64('tsmK1H3zbpnEdR2//WhO+MA=='),'F3229A0B371ED2D9441B830D21A390C3', '0123456789');
```

```text
+-------------------------------------------------------------------------------------------+
| aes_decrypt(from_base64('tsmK1H3zbpnEdR2//WhO+MA=='), '***', '0123456789', 'AES_256_CBC') |
+-------------------------------------------------------------------------------------------+
| NULL                                                                                      |
+-------------------------------------------------------------------------------------------+
```