---
{
    "title": "MASK",
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

MASK 函数主要作用是对数据进行屏蔽，以保护敏感信息，常用于数据脱敏场景。其行为默认是将输入的字符串中的大写字母转换为`X`，小写字母转换为`x`，数字转换为`n`。 

## 语法

```sql
MASK(<str> [, <upper> [, <lower> [, <number> ]]])
```

## 参数

| 参数         | 说明                                                                 |
|------------|--------------------------------------------------------------------|
| `<str>`    | 需要被脱敏的数据                                                           |
| `<upper>`  | 可选参数，替换大写字母字符，默认是`X`。如果输入多个字符串，则会取第一个字符，如果输入的是非 ASCII 字符，则会取第一个字节 |
| `<lower>`  | 可选参数，替换小写字母字符，默认是`x`。如果输入多个字符串，则会取第一个字符，如果输入的是非 ASCII 字符，则会取第一个字节 |
| `<number>` | 可选参数，替换数字字符，默认是`n`。如果输入多个字符串，则会取第一个字符，如果输入的是非 ASCII 字符，则会取第一个字节   |

## 返回值

返回字母和数字被替换后的字符串。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL
- 非字母和数字会原样返回

## 举例

```sql
select mask('abc123EFG');
```

```text
+-------------------+
| mask('abc123EFG') |
+-------------------+
| xxxnnnXXX         |
+-------------------+
```

```sql
select mask(null);
```

```text
+------------+
| mask(NULL) |
+------------+
| NULL       |
+------------+
```

```sql
select mask('abc123EFG', '*', '#', '$');
```

```text
+----------------------------------+
| mask('abc123EFG', '*', '#', '$') |
+----------------------------------+
| ###$$$***                        |
+----------------------------------+
```
