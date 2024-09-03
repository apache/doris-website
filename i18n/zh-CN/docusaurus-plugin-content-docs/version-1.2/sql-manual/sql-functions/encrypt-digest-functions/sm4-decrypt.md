---
{
"title": "SM4_DECRYPT",
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

`VARCHAR SM4_DECRYPT(VARCHAR str, VARCHAR key_str[, VARCHAR init_vector][, VARCHAR encryption_mode])`

返回解密后的结果，其中：
- `str` 为待解密文本；
- `key_str` 为密钥；
- `init_vector` 为算法中使用到的初始向量，仅在特定算法下生效，如不指定，则 Doris 使用内置向量；
- `encryption_mode` 为加密算法，可选值见于：[变量](../../../advanced/variables)。

:::warning
两参数版本，会无视 session variable `block_encryption_mode`，始终误用 `AES_128_ECB` 算法进行解密。因此强烈不推荐调用。
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
