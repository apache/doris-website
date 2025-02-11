---
{
    "title": "ARRAY_PUSHBACK",
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

将 value 添加到数组的尾部。

## 语法

```sql
ARRAY_PUSHBACK(<arr>, <value>)
```

## 参数

| 参数 | 说明 |
|--|---|
| `<arr>` | 对应数组 |
| `<value>` | 待添加的值 |

## 返回值

返回添加 value 后的数组

## 举例

```sql
SELECT ARRAY_PUSHBACK([1, 2], 3),ARRAY_PUSHBACK([3, 4], 6);
```

```text
+---------------------------+---------------------------+
| array_pushback([1, 2], 3) | array_pushback([3, 4], 6) |
+---------------------------+---------------------------+
| [1, 2, 3]                 | [3, 4, 6]                 |
+---------------------------+---------------------------+
```
