---
{
    "title": "AES_ENCRYPT",
    "language": "en",
    "description": "AES encryption function. This function behaves the same as the AESENCRYPT function in MySQL. The default algorithm is AES128ECB,"
}
---

## Description

AES encryption function. This function behaves the same as the `AES_ENCRYPT` function in MySQL. The default algorithm is `AES_128_ECB`, and the padding mode is `PKCS7`.

The AES_ENCRYPT function does not use the passed key directly, but further processes it. The specific steps are as follows:
1. Determine the number of bytes of the key according to the encryption algorithm used. For example, if the AES_128_ECB algorithm is used, the number of bytes of the key is `128 / 8 = 16` (if the AES_256_ECB algorithm is used, the number of bytes of the key is `256 / 8 = 32`);
2. Then, for the key input by the user, the `i`th bit and the `16*k+i`th bit are XORed. If the key input by the user is less than 16 bits, 0 is added at the end.
3. Finally, use the newly generated key to encrypt;

## Syntax

```sql
AES_ENCRYPT( <str>, <key_str>[, <init_vector>][, <encryption_mode>])
```

## Parameters

| parameter           | description                                                                                                                                                                                         |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`             | The text to be encrypted                                                                                                                                                                                              |
| `<key_str>`         | is the key. Note that this key is not a hexadecimal encoding, but an encoded string representation. For example, for 128-bit key encryption, the length of `key_str` should be 16. If the key length is insufficient, use **zero padding** to make it complete. If the length exceeds, use circular XOR to find the final key. For example, if the 128-bit key used by the algorithm is `key`, then `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...` |
| `<init_vector>`     | It is the initial vector used in the algorithm. It is only effective under specific algorithms. If not specified, Doris uses the built-in vector                                                                                                                                                          |
| `<encryption_mode>` | For encryption algorithms, optional values ​​are given in variables                                                                                                                                                                                       |


## Return Value

Returns the encrypted binary data

## Examples

Using AES_128_ECB algorithm
```sql
set block_encryption_mode='';
select to_base64(aes_encrypt('text','F3229A0B371ED2D9441B830D21A390C3'));
```

```text
+----------------------------------------------------------+
| to_base64(aes_encrypt('text', '***', '', 'AES_128_ECB')) |
+----------------------------------------------------------+
| wr2JEDVXzL9+2XtRhgIloA==                                 |
+----------------------------------------------------------+
```

Use AES_256_CBC algorithm
```sql
set block_encryption_mode="AES_256_CBC";
select to_base64(aes_encrypt('text','F3229A0B371ED2D9441B830D21A390C3'));
```

```text
+----------------------------------------------------------+
| to_base64(aes_encrypt('text', '***', '', 'AES_256_CBC')) |
+----------------------------------------------------------+
| 3dym0E7/+1zbrLIaBVNHSw==                                 |
+----------------------------------------------------------+
```

Use AES_256_CBC algorithm and set initial vector
```sql
select to_base64(aes_encrypt('text','F3229A0B371ED2D9441B830D21A390C3', '0123456789'));
```

```text
+--------------------------------------------------------------------+
| to_base64(aes_encrypt('text', '***', '0123456789', 'AES_256_CBC')) |
+--------------------------------------------------------------------+
| tsmK1HzbpnEdR2//WhO+MA==                                           |
+--------------------------------------------------------------------+
```
