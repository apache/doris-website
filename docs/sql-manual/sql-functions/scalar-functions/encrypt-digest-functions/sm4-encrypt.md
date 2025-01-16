---
{
"title": "SM4_ENCRYPT",
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

## Description

SM4 is a national standard symmetric key encryption algorithm, widely used in finance, communications, e-commerce and other fields. The SM4_ENCRYPT function is used to encrypt data with SM4. The default algorithm is `SM4_128_ECB`.

## Syntax

```sql
SM4_ENCRYPT( <str>, <key_str>[, <init_vector>][, <encryption_mode>])
```

## Parameters

| parameter           | description                                                                                                                                                                                         |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`             | The text to be encrypted                                                                                                                                                                                              |
| `<key_str>`         | is the key. Note that this key is not a hexadecimal encoding, but an encoded string representation. For example, for 128-bit key encryption, the length of `key_str` should be 16. If the key length is insufficient, use **zero padding** to make it complete. If the length exceeds, use circular XOR to find the final key. For example, if the 128-bit key used by the algorithm is `key`, then `key[i] = key_str[i] ^ key_str[i+128] ^ key_str[i+256] ^ ...` |
| `<init_vector>`     | It is the initial vector used in the algorithm. It is only effective under specific algorithms. If not specified, Doris uses the built-in vector                                                                                                                                                          |
| `<encryption_mode>` | For encryption algorithms, optional values are given in variables                                                                                                                                                                                       |


## Return Value

Returns the encrypted binary data

## Examples

Using the default algorithm
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

Using SM4_128_CBC algorithm
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

Use the SM4_128_CBC algorithm and set the initial vector
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
