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
COMPRESS(<uncompressed_str>)
```

## 参数

| 参数                | 说明            |
|--------------------|---------------|
| `<uncompressed_str>` | 未压缩的原串，参数类型是 varchar 或者 string   |

## 返回值

返回串与输入的 `uncompressed_str` 类型一致  

返回串是不可读的压缩字节流。  

特殊情况：
- `uncompressed_str` 输入为 empty string(`''`) 时，返回 empty string(`''`)

## 举例

``` sql
select uncompress(compress('abc'));
```
```text 
+-----------------------------+
| uncompress(compress('abc')) |
+-----------------------------+
| abc                         |
+-----------------------------+
```

```sql
select compress('');
```
```text 
+--------------+
| compress('') |
+--------------+
|              |
+--------------+
```