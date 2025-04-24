---
{
    "title": "模式匹配操作符",
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

模式匹配操作符用于比较字符类型的数据。

## 操作符介绍

| 操作符                                  | 作用                                                         | 示例                          |
| --------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| <char1> [NOT] LIKE <char2>              | 如果 <char1> 与模式 <char2> [不]匹配，则为 TRUE。在 <char2> 中，字符 % 与任何零个或多个字符的字符串匹配（空值除外）。字符 _ 与任何单个字符匹配。如果通配符字符前面有转义字符，则将其视为文字字符。 | `SELECT 'ABCD' LIKE '%C_'`    |
| <char1> [NOT] {REGEXP \| RLIKE} <char2> | 如果 <char1> 与模式 <char2> [不]匹配，则为 TRUE。正则表达式的具体规则，请参考本文后续的 REGEXP 章节。 | `SELECT 'ABCD' REGEXP 'A.*D'` |

### LIKE

LIKE 条件指定一个涉及模式匹配的测试。等值比较运算符（=）将一个字符值精确匹配到另一个字符值，而 LIKE 条件则通过在第一个值中搜索第二个值指定的模式，将一个字符值的一部分与另一个字符值进行匹配。

语法如下：

```sql
<char1> [ NOT ] LIKE <char2>
```

其中：

- char1 是一个字符表达式（如字符列），称为搜索值。
- char2 是一个字符表达式，通常是一个字面量，称为模式。

所有字符表达式（char1、char2）都可以是 CHAR、VARCHAR 或 STRING 数据类型中的任何一种。如果它们不同，则 Doris 会将它们全部转换为 VARCHAR 或者 STRING。

模式中可以包含特殊的模式匹配字符：

- 模式中的下划线 (_) 与值中的一个字符完全匹配。
- 模式中的百分号 (%) 可以与值中的零个或多个字符匹配。模式 '%' 不能与 NULL 匹配。

### REGEXP（RLIKE）

REGEXP 与 LIKE 条件类似，不同之处在于 REGEXP 执行正则表达式匹配，而不是 LIKE 执行的简单模式匹配。此条件使用输入字符集定义的字符来评估字符串。

语法如下：

```sql
<char1> [ NOT ] { REGEXP | RLIKE } <char2>
```

其中：

- char1 是一个字符表达式（如字符列），称为搜索值。
- char2 是一个字符表达式，通常是一个字面量，称为模式。

所有字符表达式（char1、char2）都可以是 CHAR、VARCHAR 或 STRING 数据类型中的任何一种。如果它们不同，则 Doris 会将它们全部转换为 VARCHAR 或者 STRING。