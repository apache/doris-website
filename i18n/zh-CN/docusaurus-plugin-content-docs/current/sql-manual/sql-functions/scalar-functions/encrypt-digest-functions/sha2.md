---
{
"title": "SHA2",
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

使用SHA2对信息进行摘要处理。

## 语法

```sql
SHA2( <str>, <digest_length>)
```

## 参数

| 参数      | 说明          |
|---------|-------------|
| `<str>` | 待加密的内容 |
| `<digest_length>` | 摘要长度，支持 224, 256, 384, 512 |


## 返回值
返回输入字符串的sha2值

## 示例

```SQL
select sha2('abc', 224), sha2('abc', 384), sha2(NULL, 512);
```

```text
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| sha2('abc', 224)                                         | sha2('abc', 384)                                                                                 | sha2(NULL, 512) |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
| 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7 | cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7 | NULL            |
+----------------------------------------------------------+--------------------------------------------------------------------------------------------------+-----------------+
```