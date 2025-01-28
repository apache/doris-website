---
{
    "title": "COMPRESS",
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
COMPRESS 函数用于将字符串或值压缩成二进制数据，压缩后的数据可通过 `UNCOMPRESS` 函数解压还原。

## 语法

```sql
COMPRESS(<uncompresse_str>)
```

## 参数

| 参数                | 说明            |
|--------------------|---------------|
| `<uncompressed_str>` | 未压缩的原串 |

参数类型是varchar或者string

## 返回值
返回串与输入的 <uncompressed_str> 类型一致  
返回串的前十位是原串长度的十六进制形式, 例如: 0x01000000。后面的是压缩值。  
特殊情况：
- <uncompressed_str> 输入为 ‘’ 时，返回 '0x'

## 举例

``` sql
select compress('abc');
```
```text
+----------------------------------+
| compress('abc')                  |
+----------------------------------+
| 0x03000000789C4B4C4A0600024D0127 |
+----------------------------------+
```
```sql
select compress('');
```
```text 
+--------------+
| compress('') |
+--------------+
| 0x           |
+--------------+
```