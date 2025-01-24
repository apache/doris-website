---
{
    "title": "OVERLAY",
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

OVERLAY 函数用于将一个字符串替换另一个字符串中的一部分。

## 语法

```sql
OVERLAY(<str>, <pos>, <len>, <newstr>)
```

## 参数

| 参数 | 说明                                                          |
| -- |-------------------------------------------------------------|
| `<str>` | 需要被替换的字符串                                                   |
| `<pos>` | 需要被替换的字符串的起始位置，从 1 开始计数，如果输入的位置不在`<str>`的长度范围内，则不会进行替换      |
| `<len>` | 需要被替换的长度，当`<len>`小于 0 或超过字符串其余部分的长度范围时，则会从`<pos>`开始替换掉其余字符串 |
| `<newstr>` | 用于替换的新字符串                                                   |

## 返回值

返回从指定位置、用新字符串替换指定长度后的字符。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL
- `<pos>`如果不在`<str>`的长度范围内，则不会进行替换
- 当`<len>`小于 0 或超过字符串其余部分的长度范围时，则会从`<pos>`开始替换掉其余字符串

## 举例

```sql
select overlay('Quadratic', 3, 4, 'What');
```

```text
+------------------------------------+
| overlay('Quadratic', 3, 4, 'What') |
+------------------------------------+
| QuWhattic                          |
+------------------------------------+
```

```sql
select overlay('Quadratic', null, 4, 'What');
```

```text
+---------------------------------------+
| overlay('Quadratic', NULL, 4, 'What') |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+
```

```sql
select overlay('Quadratic', -1, 4, 'What');
```

```text
+-------------------------------------+
| overlay('Quadratic', -1, 4, 'What') |
+-------------------------------------+
| Quadratic                           |
+-------------------------------------+
```

```sql
select overlay('Quadratic', 2, -4, 'What');
```

```text
+-------------------------------------+
| overlay('Quadratic', 2, -4, 'What') |
+-------------------------------------+
| QWhat                               |
+-------------------------------------+
```
