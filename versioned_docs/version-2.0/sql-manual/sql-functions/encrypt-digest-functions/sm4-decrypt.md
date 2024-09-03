---
{
"title": "SM4_DECRYPT",
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
#### Syntax

`VARCHAR SM4_DECRYPT(VARCHAR str, VARCHAR key_str[, VARCHAR init_vector][, VARCHAR encryption_mode])`

Returns the decrypted result, where:
- `str` is the text to be decrypted;
- `key_str` is the key;
- `init_vector` is the initial vector to be used in the algorithm, this is only valid for some algorithms, if not specified then Doris will use the built-in value;
- `encryption_mode` is the encryption algorithm, optionally available in [variables](../../../query/query-variables/variables)。

:::warning
Function with two arguments will ignore session variable `block_encryption_mode` and always use `SM4_128_ECB` to do decryption. This is different from the 1.2 version behavior and must be taken into account when upgrading or downgrading.
:::

### example

```sql
MySQL [(none)]> select SM4_DECRYPT(FROM_BASE64('aDjwRflBrDjhBZIOFNw3Tg=='),'F3229A0B371ED2D9441B830D21A390C3');
+------------------------------------------------------+
| sm4_decrypt(from_base64('aDjwRflBrDjhBZIOFNw3Tg==')) |
+------------------------------------------------------+
| text                                                 |
+------------------------------------------------------+
1 row in set (0.009 sec)

MySQL> set block_encryption_mode="SM4_128_CBC";
Query OK, 0 rows affected (0.006 sec)

MySQL > select SM4_DECRYPT(FROM_BASE64('G7yqOKfEyxdagboz6Qf01A=='),'F3229A0B371ED2D9441B830D21A390C3', '0123456789');
+--------------------------------------------------------------------------------------------------------+
| sm4_decrypt(from_base64('G7yqOKfEyxdagboz6Qf01A=='), 'F3229A0B371ED2D9441B830D21A390C3', '0123456789') |
+--------------------------------------------------------------------------------------------------------+
| text                                                                                                   |
+--------------------------------------------------------------------------------------------------------+
1 row in set (0.012 sec)
```

### keywords
    SM4_DECRYPT, SM4, DECRYPT
