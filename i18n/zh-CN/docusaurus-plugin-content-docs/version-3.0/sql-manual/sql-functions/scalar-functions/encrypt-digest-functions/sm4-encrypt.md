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

## 描述

SM4 是一种国家标准的对称密钥加密算法，广泛应用于金融、通信、电子商务等领域。SM4_ENCRYPT 函数用于对数据进行 SM4 加密。默认采用 `SM4_128_ECB` 算法。

:::warning
截止 3.0.2，两参数版本，会无视 session variable `block_encryption_mode`，始终使用 `SM4_128_ECB` 算法进行加密。因此不推荐调用。

3.0.3 起，该行为恢复正常。
:::

## 语法

```sql
SM4_ENCRYPT( <str>, <key_str>[, <init_vector>][, <encryption_mode>])
```

## 参数

| 参数      | 说明 |
|---------| -- |
| `<str>` | 为待加密文本 |
| `<key_str>` | 为密钥。注意此密钥并非 16 进制编码，而是编码后的字符串表示。例如对于 128 位密钥加密，`key_str` 长度应为 16。如果密钥长度不足，使用**零填充**补齐。如果长度超出，使用循环异或的方式求出最终密钥。例如算法使用的 128 位密钥为 `key`，则 `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...` |
| `<init_vector>` | 为算法中使用到的初始向量，仅在特定算法下生效，如不指定，则 Doris 使用内置向量 |
| `<encryption_mode>` | 为加密算法，可选值见于变量 |

## 返回值

返回二进制的加密后的数据

## 示例

使用默认算法

```sql
set block_encryption_mode='';
select TO_BASE64(SM4_ENCRYPT('text','F3229A0B371ED2D9441B830D21A390C3'));
```

```text
+----------------------------------------------------------+
| to_base64(sm4_encrypt('text', '***', '', 'SM4_128_ECB')) |
+----------------------------------------------------------+
| aDjwRflBrDjhBZIOFNw3Tg==                                 |
+----------------------------------------------------------+
```

使用 SM4_128_CBC 算法

```sql
set block_encryption_mode="SM4_128_CBC";
select TO_BASE64(SM4_ENCRYPT('text','F3229A0B371ED2D9441B830D21A390C3'));
```

```text
+----------------------------------------------------------+
| to_base64(sm4_encrypt('text', '***', '', 'SM4_128_CBC')) |
+----------------------------------------------------------+
| FSYstvOmH2cXy7B/072Mug==                                 |
+----------------------------------------------------------+
```

使用 SM4_128_CBC 算法并设置初始向量

```sql
set block_encryption_mode="SM4_128_CBC";
select to_base64(SM4_ENCRYPT('text','F3229A0B371ED2D9441B830D21A390C3', '0123456789'));
```

```text
+--------------------------------------------------------------------+
| to_base64(sm4_encrypt('text', '***', '0123456789', 'SM4_128_CBC')) |
+--------------------------------------------------------------------+
| 1Y4NGIukSbv9OrkZnRD1bQ==                                           |
+--------------------------------------------------------------------+
```
