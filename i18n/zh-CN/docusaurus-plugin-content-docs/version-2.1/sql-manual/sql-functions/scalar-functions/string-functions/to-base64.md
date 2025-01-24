---
{
    "title": "TO_BASE64",
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

TO_BASE64 函数用于将输入的字符串转换为 Base64 编码格式。Base64 编码可以将任意二进制数据转换成由 64 个字符组成的字符串。

## 语法

```sql
TO_BASE64(<str>)
```

## 参数
| 参数 | 说明                                        |
| ---- | ------------------------------------------- |
| `<str>` | 需要进行 Base64 编码的字符串。类型：VARCHAR |

## 返回值

返回 VARCHAR 类型，表示 Base64 编码后的字符串。

特殊情况：
- 如果输入为 NULL，返回 NULL
- 如果输入为空字符串，返回空字符串

## 示例

1. 单字符编码
```sql
SELECT to_base64('1');
```
```text
+----------------+
| to_base64('1') |
+----------------+
| MQ==           |
+----------------+
```

2. 多字符编码
```sql
SELECT to_base64('234');
```
```text
+------------------+
| to_base64('234') |
+------------------+
| MjM0             |
+------------------+
```
