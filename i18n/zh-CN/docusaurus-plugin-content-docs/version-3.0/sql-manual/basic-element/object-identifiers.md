---
{
    "title": "对象标识符",
    "language": "en"
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

每个数据库对象，例如表、列、索引，都有一个名称。在 SQL 语句中，这些名称被称作对象标识符。标识符可以加引号，也可以不加引号。如果标识符包含特殊字符或是保留关键字，则在每次引用时都必须使用反引号（`）。关于保留关键字的详细信息，请参阅[保留关键字](../basic-element/reserved-keywords.md)章节。

## 对象对标识符的限制

在 Doris 中，对象标识符可以通过变量 `enable_unicode_name_support` 控制，决定是否支持 unicode 字符。当开启 unicode 字符支持时，标识符中，可以使用 unicode 中任意语言的文字字符。但是不能使用标点，符号等其他字符。

在 Doris 中，不同的对象对于标识符有不同的限制，下面列举了不同对象的具体限制。

### 表名

| 模式               | 标识符限制                             |
| :----------------- | :------------------------------------- |
| 关闭  unicode 模式 | `^[a-zA-Z][a-zA-Z0-9-_]*$`             |
| 开启  unicode 模式 | `^[a-zA-Z\\p{L}][a-zA-Z0-9-_\\p{L}]*$` |

### 列名

| 模式               | 标识符限制                                                   |
| :----------------- | :----------------------------------------------------------- |
| 关闭  unicode 模式 | `^[.a-zA-Z0-9_+-/?@#$%^&*\"\\s,:]{1,256}$` |
| 开启  unicode 模式 | `^[.a-zA-Z0-9_+-/?@#$%^&*\"\\s,:\\p{L}]{1,256}$` |

### OUTFILE 文件名

| 模式               | 标识符限制                                   |
| :----------------- | :------------------------------------------- |
| 关闭  unicode 模式 | `^[_a-zA-Z][a-zA-Z0-9-_]{0,63}$`              |
| 开启  unicode 模式 | `^[_a-zA-Z\\p{L}][a-zA-Z0-9-_\\p{L}]{0,63}$` |

### 用户名

| 模式               | 标识符限制                              |
| :----------------- | :-------------------------------------- |
| 关闭  unicode 模式 | `^[a-zA-Z][a-zA-Z0-9.-_]*$`            |
| 开启  unicode 模式 | `^[a-zA-Z\\p{L}][a-zA-Z0-9.-_\\p{L}]*$` |

### LABEL 名

| 模式               | 标识符限制                      |
| :----------------- | :------------------------------ |
| 关闭  unicode 模式 | `^[-_A-Za-z0-9:]{1,N}$`，其中 `N` 的值取决于 FE 配置中的 `label_regex_length` 参数，默认值为 128。       |
| 开启  unicode 模式 | `^[-_A-Za-z0-9:\\p{L}]{1,N}$`，其中 N 的值取决于 FE 配置中的 label_regex_length 参数，默认值为 128。 |

### 其他

| 模式               | 标识符限制                                  |
| :----------------- | :------------------------------------------ |
| 关闭  unicode 模式 | `^[a-zA-Z][a-zA-Z0-9-_]{0,63}$`            |
| 开启  unicode 模式 | `^[a-zA-Z\\p{L}][a-zA-Z0-9-_\\p{L}]{0,63}$` |