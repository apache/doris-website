---
{
    "title": "MASK_FIRST_N",
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

MASK_FIRST_N 函数主要作用是对数据的前 N 个字节进行屏蔽，以保护敏感信息，常用于数据脱敏场景。其行为是将前 N 个字节中的大写字母替换为`X`，小写字母替换为`x`，数字替换为`n`。

## 语法

```sql
MASK_FIRST_N( <str> [, <n> ])
```

## 参数

| 参数     | 说明                                     |
|--------|----------------------------------------|
| `<str>` | 需要被脱敏的数据                               |
| `<n>`  | 可选参数，限制只让前 N 个字节进行数据屏蔽，默认是对整个字符串进行数据屏蔽 |

## 返回值

返回前 N 个字节中，字母和数字被替换后的字符串。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL
- 非字母和数字会原样返回

## 举例

```sql
select mask_first_n("1234-5678-8765-4321", 4);
```

```text
+----------------------------------------+
| mask_first_n('1234-5678-8765-4321', 4) |
+----------------------------------------+
| nnnn-5678-8765-4321                    |
+----------------------------------------+
```

```sql
select mask_first_n("1234-5678-8765-4321", null);
```

```text
+-------------------------------------------+
| mask_first_n('1234-5678-8765-4321', NULL) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```
