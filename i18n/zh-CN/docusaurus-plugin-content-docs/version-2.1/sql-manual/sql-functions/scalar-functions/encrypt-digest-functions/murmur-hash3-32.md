---
{
    "title": "MURMUR_HASH3_32",
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

计算 32位murmur3 hash值

-注：在计算hash值时，更推荐使用`xxhash_32`，而不是`murmur_hash3_32`。

## 语法

```sql
MURMUR_HASH3_32( <str> [ , <str> ... ] )
```

## 参数

| 参数      | 说明 |
|---------| -- |
| `<str>` | 需要被计算32位murmur3 hash的值 |

## 返回值

返回输入字符串的32位murmur3 hash值。

-当参数为NULL时，返回NULL

## 示例

```sql
select murmur_hash3_32(null), murmur_hash3_32("hello"), murmur_hash3_32("hello", "world");
```

```text
+-----------------------+--------------------------+-----------------------------------+
| murmur_hash3_32(NULL) | murmur_hash3_32('hello') | murmur_hash3_32('hello', 'world') |
+-----------------------+--------------------------+-----------------------------------+
|                  NULL |               1321743225 |                         984713481 |
+-----------------------+--------------------------+-----------------------------------+
```