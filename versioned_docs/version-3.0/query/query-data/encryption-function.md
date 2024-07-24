---
{
    "title": "Encrption and Masking Function ",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

Doris provides the following built-in encryption and masking functions. For detailed usage, please refer to the SQL manual.

## AES_ENCRYPT

An AES encryption function. 

This function behaves the same as the` AES_ENCRYPT` function in MySQL. It uses the AES_128_ECB algorithm by default, with PKCS7 padding mode. Encryption is performed using the OpenSSL library as the underlying mechanism. Reference: https://dev.mysql.com/doc/refman/8.0/en/encryption-functions.html#function_aes-decrypt

```sql
select to_base64(aes_encrypt('text','F3229A0B371ED2D9441B830D21A390C3'));

+--------------------------------+
| to_base64(aes_encrypt('text')) |
+--------------------------------+
| wr2JEDVXzL9+2XtRhgIloA==       |
+--------------------------------+
1 row in set (0.01 sec)
```

## AES_DECRYPT

An AES decryption function. This function behaves the same as the `AES_DECRYPT` function in MySQL. It uses the AES_128_ECB algorithm by default, with PKCS7 padding mode. Decryption is performed using the OpenSSL library as the underlying mechanism.

```sql
select aes_decrypt(from_base64('wr2JEDVXzL9+2XtRhgIloA=='),'F3229A0B371ED2D9441B830D21A390C3');
+------------------------------------------------------+
| aes_decrypt(from_base64('wr2JEDVXzL9+2XtRhgIloA==')) |
+------------------------------------------------------+
| text                                                 |
+------------------------------------------------------+
1 row in set (0.01 sec)
```

## MD5

Calculates the MD5 128-bit hash.

```sql
MySQL [(none)]> select md5("abc");
+----------------------------------+
| md5('abc')                       |
+----------------------------------+
| 900150983cd24fb0d6963f7d28e17f72 |
+----------------------------------+
1 row in set (0.013 sec)
```

## MD5SUM

Calculates the MD5 128-bit hash for multiple strings.

```sql
MySQL > select md5("abcd");
+----------------------------------+
| md5('abcd')                      |
+----------------------------------+
| e2fc714c4727ee9395f324cd2e7f331f |
+----------------------------------+
1 row in set (0.011 sec)

MySQL > select md5sum("ab","cd");
+----------------------------------+
| md5sum('ab', 'cd')               |
+----------------------------------+
| e2fc714c4727ee9395f324cd2e7f331f |
+----------------------------------+
1 row in set (0.008 sec)
```

## SM4_ENCRYPT

SM4 encryption function.

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

## SM3

Calculates the SM3 256-bit hash for multiple strings.

```sql
MySQL > select sm3("abcd");
+------------------------------------------------------------------+
| sm3('abcd')                                                      |
+------------------------------------------------------------------+
| 82ec580fe6d36ae4f81cae3c73f4a5b3b5a09c943172dc9053c69fd8e18dca1e |
+------------------------------------------------------------------+
1 row in set (0.009 sec)
```

## SM3SUM

Calculates the SM3 256-bit hash for multiple strings.

```sql
MySQL > select sm3("abcd");
+------------------------------------------------------------------+
| sm3('abcd')                                                      |
+------------------------------------------------------------------+
| 82ec580fe6d36ae4f81cae3c73f4a5b3b5a09c943172dc9053c69fd8e18dca1e |
+------------------------------------------------------------------+
1 row in set (0.009 sec)

MySQL > select sm3sum("ab","cd");
+------------------------------------------------------------------+
| sm3sum('ab', 'cd')                                               |
+------------------------------------------------------------------+
| 82ec580fe6d36ae4f81cae3c73f4a5b3b5a09c943172dc9053c69fd8e18dca1e |
+------------------------------------------------------------------+
1 row in set (0.009 sec)
```

## SHA

Calculates the SHA1 hash using the SHA1 algorithm.

## SHA2

Calculates the SHA2 hash using SHA2 algorithm.

```sql
mysql> select sha2('abc', 224);
+----------------------------------------------------------+
| sha2('abc', 224)                                         |
+----------------------------------------------------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 |
+----------------------------------------------------------+
1 row in set (0.13 sec)

mysql> select sha2('abc', 384);
+--------------------------------------------------------------------------------------------------+
| sha2('abc', 384)                                                                                 |
+--------------------------------------------------------------------------------------------------+
| cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7 |
+--------------------------------------------------------------------------------------------------+
1 row in set (0.13 sec)

mysql> select sha2(NULL, 512);
+-----------------+
| sha2(NULL, 512) |
+-----------------+
| NULL            |
+-----------------+
1 row in set (0.09 sec)
```

## DIGITAL_MASKING

An alias function with the original function being `CONCAT(LEFT(id,3),'****',RIGHT(id,4))`. Performs data masking on the input `digital_number` and returns the masked result. 

The `digital_number` is of type `BIGINT`.

```sql
mysql select digital_masking(13812345678);
+------------------------------+
| digital_masking(13812345678) |
+------------------------------+
| 138****5678                  |
+------------------------------+
```
