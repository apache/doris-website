---
{
    "title": "字符串类型字面量",
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

字符串是一系列字节或字符，用单引号（'）或双引号（"）字符括起来。例如：

```sql
'a string'
"another string"
```

## 转义字符

在字符串中，除非启用了 NO_BACKSLASH_ESCAPES SQL 模式，否则某些序列具有特殊含义。这些序列均以反斜杠（\）开头，反斜杠称为转义字符。Doris 可以识别的转义字符列到下表中

| 转义字符 | 意义                                      |
| -------- | ----------------------------------------- |
| `\0`     | ASCII 字符 NUL（`X'00'`）                |
| `\'`     | 单引号（`'`）                            |
| `\"`     | 双引号（`"`）                            |
| `\b`     | 退格符                                    |
| `\n`     | 换行符                                    |
| `\r`     | 回车符                                    |
| `\t`     | 制表符                                    |
| `\Z`     | ASCII 26 (Control+Z)                      |
| `\\`     | 反斜杠（`\`）                             |
| `\%`     | 百分号 `%` 。详细信息参考表格后的注意事项 |
| `\_`     | 下划线 `_` 。详细信息参考表格后的注意事项 |

**注意事项**

> 1. 在模式匹配的上下文中，通常会将 `%` 和“”解释为通配符字符，但使用`\%`和 `\_` 序列可以搜索“%”和“”的字面量实例。有关详细信息，请参阅“模式匹配操作符”章节中对 LIKE 操作符的描述。如果在模式匹配的上下文之外使用 `\%` 或 `\_`，它们会被计算为字符串 `\%` 和 `\_`，而不是 `%` 和 `_`。
> 2. 表格以外的转义字符中的反斜杠会被直接忽略。例如`'\y'` 和 `'y'`是等价的。

## 在字符串字面量中使用引号

在字符串中包含引号字符有几种方法：

- 在以单引号（'）括起来的字符串中，单引号可以写作两个单引号（''）。
- 在以双引号（"）括起来的字符串中，双引号可以写作两个双引号（""）。
- 在引号字符前加上转义字符（`\`）。
- 在以双引号括起来的字符串中包含单引号时，无需进行特殊处理，也不必将单引号加倍或转义。同样地，在以单引号括起来的字符串中包含双引号时，也无需进行特殊处理。