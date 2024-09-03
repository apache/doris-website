---
{
"title": "AES_DECRYPT",
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

### Description

AES decryption function. This function behaves like the `AES_DECRYPT` function in MySQL. By default, it uses the `AES_128_ECB` algorithm with `PKCS7` padding mode. The underlying decryption is done using the OpenSSL library.

#### Syntax

`VARCHAR AES_DECRYPT(VARCHAR str, VARCHAR key_str[, VARCHAR init_vector][, VARCHAR encryption_mode])`

Returns the decrypted result, where:
- `str` is the text to be decrypted;
- `key_str` is the key;
- `init_vector` is the initial vector to be used in the algorithm, this is only valid for some algorithms, if not specified then Doris will use the built-in value;
- `encryption_mode` is the encryption algorithm, optionally available in [variables](../../../advanced/variables)。

:::warning
Function with two arguments will ignore session variable `block_encryption_mode` and always use `AES_128_ECB` to do decryption. So it's not recommended to use it.
:::

### Example

```sql
select aes_decrypt(from_base64('wr2JEDVXzL9+2XtRhgIloA=='),'F3229A0B371ED2D9441B830D21A390C3');
+------------------------------------------------------+
| aes_decrypt(from_base64('wr2JEDVXzL9+2XtRhgIloA==')) |
+------------------------------------------------------+
| text                                                 |
+------------------------------------------------------+
1 row in set (0.01 sec)
```

If want to use other encryption algorithms, you can:

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
