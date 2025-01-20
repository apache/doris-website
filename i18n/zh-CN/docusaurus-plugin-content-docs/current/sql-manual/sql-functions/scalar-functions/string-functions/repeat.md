---
{
    "title": "REPEAT",
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

REPEAT 函数用于将一个字符串重复指定的次数。

## 语法

```sql
repeat( <str>, <count> )
```

## 参数

| 参数 | 说明                        |
| -- |---------------------------|
| `<str>` | 需要被重复的字符串                 |
| `<count>` | 重复的次数，必须为非负整数，小于 1 时将返回空串 |

<!-- 3.0 又删除了这个变量

:::tip
repeat 函数默认最多重复 10000 次，如果超过这个次数将会报错，可通过会话变量调整限制：
```sql
set repeat_max_num = 20000
```
:::

-->

## 返回值

返回重复指定的次数的字符串。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL

## 举例

```sql
SELECT repeat("a", 3);
```

```text
+----------------+
| repeat('a', 3) |
+----------------+
| aaa            |
+----------------+
```

```sql
SELECT repeat("a", -1);
```

```text
+-----------------+
| repeat('a', -1) |
+-----------------+
|                 |
+-----------------+
```
