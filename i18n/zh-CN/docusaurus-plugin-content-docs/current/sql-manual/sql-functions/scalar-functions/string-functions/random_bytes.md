---
{
    "title": "RANDOM_BYTES",
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

RANDOM_BYTES 函数用于生成指定长度的随机字节序列。

## 语法

```sql
random_bytes( <len> )
```

## 参数

| 参数      | 说明                               |
|---------|----------------------------------|
| `<len>` | 该参数指定生成的随机字节序列的长度，此值必需大于 0，否则会报错 |

## 返回值

返回一个指定长度的随机字节序列，并以十六进制编码。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL

## 举例

```sql
select random_bytes(7);
```

```text
+------------------+
| random_bytes(7)  |
+------------------+
| 0x869684a082ab4b |
+------------------+
```

```sql
select random_bytes(-1);
```

```text
(1105, 'errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]argument -1 of function random_bytes at row 0 was invalid.')
```
