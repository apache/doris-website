---
{
    "title": "REVERSE",
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

REVERSE 函数用于将字符串中的字符顺序颠倒或将数组中的元素顺序颠倒。

## 语法

```sql
REVERSE( <seq> )
```

## 参数

| 参数      | 说明             |
|---------|----------------|
| `<seq>` | 需要被反转顺序的字符串或数组 |

## 返回值

返回反转顺序后的字符串或数组。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL

## 举例

```sql
SELECT reverse('hello');
```

```text
+------------------+
| REVERSE('hello') |
+------------------+
| olleh            |
+------------------+
```

```sql
SELECT reverse(['hello', 'world']);
```

```text
+-----------------------------+
| reverse(['hello', 'world']) |
+-----------------------------+
| ["world", "hello"]          |
+-----------------------------+
```
