---
{
    "title": "XXHASH_64",
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

计算输入字符串的 64 位 xxhash 值

-注：经过测试 xxhash_64 的性能大约是 murmur_hash3_64 的 2 倍，所以在计算 hash 值时，更推荐使用`xxhash_64`，而不是`murmur_hash3_64`。

## 语法

```sql
XXHASH_64( <str> [ , <str> ... ] )
```

## 参数

| 参数      | 说明               |
|---------|------------------|
| `<str>` | 需要被计算 64 位 xxhash 的值 |

## 返回值

返回输入字符串的 64 位 xxhash 值。

## 举例

```sql
select xxhash_64(NULL), xxhash_64("hello"), xxhash_64("hello", "world");
```

```text
+-----------------+----------------------+-----------------------------+
| xxhash_64(NULL) | xxhash_64('hello')   | xxhash_64('hello', 'world') |
+-----------------+----------------------+-----------------------------+
|            NULL | -7685981735718036227 |         7001965798170371843 |
+-----------------+----------------------+-----------------------------+
```