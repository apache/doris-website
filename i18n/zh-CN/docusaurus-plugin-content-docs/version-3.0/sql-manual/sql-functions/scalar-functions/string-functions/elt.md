---
{
    "title": "ELT",
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

在指定的索引处返回一个字符串。特殊情况：

- 如果指定的索引处没有字符串，则返回 NULL。

## 语法

```sql
ELT ( <pos> , <str> [ , <str> ] )
```

## 参数

| 参数      | 说明         |
|---------|------------|
| `<pos>` | 指定的索引值     |
| `<str>` | 需要指定索引的字符串 |

## 返回值

参数 `<str>` 指定索引值的字符串。特殊情况：

- 如果指定的索引处没有字符串，则返回 NULL。

## 举例

```sql
SELECT ELT(1, 'aaa', 'bbb'),ELT(2, 'aaa', 'bbb'), ELT(0, 'aaa', 'bbb'),ELT(2, 'aaa', 'bbb')
```

```text
+----------------------+----------------------+----------------------+----------------------+
| elt(1, 'aaa', 'bbb') | elt(2, 'aaa', 'bbb') | elt(0, 'aaa', 'bbb') | elt(2, 'aaa', 'bbb') |
+----------------------+----------------------+----------------------+----------------------+
| aaa                  | bbb                  | NULL                 | bbb                  |
+----------------------+----------------------+----------------------+----------------------+
```