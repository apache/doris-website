---
{
    "title": "LPAD",
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

返回 str 中长度为 len（从首字母开始算起）的字符串。

如果 len 大于 str 的长度，则在 str 的前面不断补充 pad 字符，直到该字符串的长度达到 len 为止。

如果 len 小于 str 的长度，该函数相当于截断 str 字符串，只返回长度为 len 的字符串。len 指的是字符长度而不是字节长度。 

特殊情况：

- 除包含 NULL 值外，如果 pad 为空，则返回值为空串。

## 语法

```sql
LPAD ( <str> , <len> , <pad>)
```

## 参数

| 参数      | 说明                           |
|---------|------------------------------|
| `<str>` | 需要被补充的字符串                    |
| `<len>` | 需要填充的字符串的长度，指的是字符长度而不是字节长度 |
| `<pad>` | 需要在原始字符串左边补充的字符串             |

## 返回值

填充后的字符串。特殊情况：

- 除包含 NULL 值外，如果 pad 为空，则返回值为空串。

## 举例

```sql
SELECT LPAD("hi", 5, "xy"),LPAD("hi", 1, "xy"),LPAD("", 0, "")
```

```text
+---------------------+---------------------+-----------------+
| lpad('hi', 5, 'xy') | lpad('hi', 1, 'xy') | lpad('', 0, '') |
+---------------------+---------------------+-----------------+
| xyxhi               | h                   |                 |
+---------------------+---------------------+-----------------+
```