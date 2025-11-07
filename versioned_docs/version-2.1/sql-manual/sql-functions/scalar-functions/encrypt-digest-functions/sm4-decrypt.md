---
{
"title": "SM4_DECRYPT",
"language": "en"
}
---

## Description

SM4 is a national standard symmetric key encryption algorithm, widely used in finance, communications, e-commerce and other fields. The SM4_DECRYPT function is used to decrypt data using SM4. The default algorithm is `SM4_128_ECB`.

:::warning
Until 2.1.6, function with two arguments will ignore session variable `block_encryption_mode` and always use `SM4_128_ECB` to do decryption.

Since 2.1.7, it works as expected.
:::

## Syntax

```sql
SM4_DECRYPT( <str>, <key_str>[, <init_vector>][, <encryption_mode>])
```

## Parameters

| parameter           | description                                                                                                                                                                                         |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`             | The text to be decrypted                                                                                                                                                                            |
| `<key_str>`         | is the key. Note that this key is not a hexadecimal encoding, but an encoded string representation. For example, for 128-bit key encryption, the length of `key_str` should be 16. If the key length is insufficient, use **zero padding** to make it complete. If the length exceeds, use circular XOR to find the final key. For example, if the 128-bit key used by the algorithm is `key`, then `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...` |
| `<init_vector>`     | It is the initial vector used in the algorithm. It is only effective under specific algorithms. If not specified, Doris uses the built-in vector                                                                                                                                                          |
| `<encryption_mode>` | For encryption algorithms, optional values are given in variables                                                                                                                                   |

## Return Value

If decryption is successful: Returns the decrypted data, usually a binary representation of the plaintext.

If decryption fails: Returns NULL.

## Examples

### Decryption successful

Using the default algorithm

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

Using SM4_128_CBC algorithm

```sql
set block_encryption_mode="SM4_128_CBC";
select SM4_DECRYPT(FROM_BASE64('FSYstvOmH2cXy7B/072Mug=='),'F3229A0B371ED2D9441B830D21A390C3');
```

```text
+--------------------------------------------------------------------------------+
| sm4_decrypt(from_base64('FSYstvOmH2cXy7B/072Mug=='), '***', '', 'SM4_128_CBC') |
+--------------------------------------------------------------------------------+
| text                                                                           |
+--------------------------------------------------------------------------------+
```

Use SM4_128_CBC algorithm and initial vector

```sql
select SM4_DECRYPT(FROM_BASE64('1Y4NGIukSbv9OrkZnRD1bQ=='),'F3229A0B371ED2D9441B830D21A390C3', '0123456789');
```

```text
+------------------------------------------------------------------------------------------+
| sm4_decrypt(from_base64('1Y4NGIukSbv9OrkZnRD1bQ=='), '***', '0123456789', 'SM4_128_CBC') |
+------------------------------------------------------------------------------------------+
| text                                                                                     |
+------------------------------------------------------------------------------------------+
```

### Decryption failed

```sql
set block_encryption_mode='';
select SM4_DECRYPT(FROM_BASE64('aDjwRflBrDjhBZIdOFNw3Tg=='),'F3229A0B371ED2D9441B830D21A390C3');
```

```text
+---------------------------------------------------------------------------------+
| sm4_decrypt(from_base64('aDjwRflBrDjhBZIdOFNw3Tg=='), '***', '', 'SM4_128_ECB') |
+---------------------------------------------------------------------------------+
| NULL                                                                            |
+---------------------------------------------------------------------------------+
```
