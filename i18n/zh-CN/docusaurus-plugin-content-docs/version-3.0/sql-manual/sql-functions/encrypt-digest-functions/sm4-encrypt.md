---
{
"title": "SM4_ENCRYPT",
"language": "zh-CN"
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

`VARCHAR SM4_ENCRYPT(VARCHAR str, VARCHAR key_str[, VARCHAR init_vector][, VARCHAR encryption_mode])`

返回加密后的结果，其中：
- `str` 为待加密文本；
- `key_str` 为密钥。注意此密钥并非 16 进制编码，而是编码后的字符串表示。例如对于 128 位密钥加密，`key_str` 长度应为 16。如果密钥长度不足，使用**零填充**补齐。如果长度超出，使用循环异或的方式求出最终密钥。例如算法使用的 128 位密钥为 `key`，则 `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...`
- `init_vector` 为算法中使用到的初始向量，仅在特定算法下生效，如不指定，则 Doris 使用内置向量；
- `encryption_mode` 为加密算法，可选值见于：[变量](../../../query/query-variables/variables)。

:::warning
截止 3.0.2，两参数版本，会无视 session variable `block_encryption_mode`，始终使用 `SM4_128_ECB` 算法进行加密。因此不推荐调用。

3.0.3 起，该行为恢复正常。
:::

### Example

```sql
mysql> set block_encryption_mode='';
Query OK, 0 rows affected (0.11 sec)

mysql> select TO_BASE64(SM4_ENCRYPT('text','F3229A0B371ED2D9441B830D21A390C3'));
+----------------------------------------------------------+
| to_base64(sm4_encrypt('text', '***', '', 'SM4_128_ECB')) |
+----------------------------------------------------------+
| aDjwRflBrDjhBZIOFNw3Tg==                                 |
+----------------------------------------------------------+
1 row in set (0.15 sec)

mysql> set block_encryption_mode="SM4_128_CBC";
Query OK, 0 rows affected (0.10 sec)

mysql> select TO_BASE64(SM4_ENCRYPT('text','F3229A0B371ED2D9441B830D21A390C3')); --- since 3.0.3
+----------------------------------------------------------+
| to_base64(sm4_encrypt('text', '***', '', 'SM4_128_CBC')) |
+----------------------------------------------------------+
| FSYstvOmH2cXy7B/072Mug==                                 |
+----------------------------------------------------------+
1 row in set (0.14 sec)

MySQL > select to_base64(SM4_ENCRYPT('text','F3229A0B371ED2D9441B830D21A390C3', '0123456789'));
+----------------------------------------------------------------------------------+
| to_base64(sm4_encrypt('text', 'F3229A0B371ED2D9441B830D21A390C3', '0123456789')) |
+----------------------------------------------------------------------------------+
| G7yqOKfEyxdagboz6Qf01A==                                                         |
+----------------------------------------------------------------------------------+
1 row in set (0.014 sec)
```

### Keywords
    SM4_ENCRYPT, SM4, ENCRYPT 
