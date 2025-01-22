---
{
    "title": "ARRAY_REPEAT",
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

生成一个包含 n 个重复元素 T 的数组

## 语法

```sql
ARRAY_REPEAT(<T>, <n>)
```

## 参数

| 参数 | 说明   |
|--|------|
| `<n>` | 元数个数 |
| `<T>` | 指定元素 |

## 返回值

返回一个数组，包含 n 个重复的 T 元素。array_with_constant 与 array_repeat 功能相同，用来兼容 hive 语法格式。

## 举例

```sql
SELECT ARRAY_REPEAT("hello", 2),ARRAY_REPEAT(12345, 3);
```

```text
+--------------------------+------------------------+
| array_repeat('hello', 2) | array_repeat(12345, 3) |
+--------------------------+------------------------+
| ["hello", "hello"]       | [12345, 12345, 12345]  |
+--------------------------+------------------------+
```
