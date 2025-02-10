---
{
    "title": "REPLACE",
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

REPLACE 函数用于将字符串中的一部分字符替换为其他字符。

## 语法

```sql
REPLACE ( <str>, <old>, <new> )
```

## 参数

| 参数      | 说明                                      |
|---------|-----------------------------------------|
| `<str>` | 需要被替换的字符串                               |
| `<old>` | 需要被替换掉的子字符串，如果`<old>`不在`<str>`中，则不会进行替换 |
| `<new>` | 用于替换 `old` 的新子字符串                       |

## 返回值

返回替换掉子字符串后的新字符串。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL

## 举例

```sql
SELECT replace('hello world', 'world', 'universe');
```

```text
+---------------------------------------------+
| replace('hello world', 'world', 'universe') |
+---------------------------------------------+
| hello universe                              |
+---------------------------------------------+
```
