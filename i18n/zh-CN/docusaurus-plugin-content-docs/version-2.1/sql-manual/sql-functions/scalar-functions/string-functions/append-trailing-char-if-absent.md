---
{
    "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
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

用于在字符串末尾添加特定字符（如空格、特定符号等），如果该字符不存在于字符串的结尾时进行添加。函数的作用是确保字符串以特定字符结尾。

## 语法

```sql
APPEND_TRAILING_CHAR_IF_ABSENT ( <str> , <trailing_char> )
```

## 参数

| 参数                | 说明                          |
|-------------------|-----------------------------|
| `<str>`           | 需要判断的目标字符串                  |
| `<trailing_char>` | 需要添加到字符串末尾的字符（如果该字符不存在的话） |

## 返回值

参数 `<str>` 与 `<trailing_char>` 拼接后的字符串（如果 `<trailing_char>` 不存在于 `<str>` ） 

## 举例

``` sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('a','c'),APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'c'),APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'cd')
```

```text 
+------------------------------------------+-------------------------------------------+--------------------------------------------+
| append_trailing_char_if_absent('a', 'c') | append_trailing_char_if_absent('ac', 'c') | append_trailing_char_if_absent('ac', 'cd') |
+------------------------------------------+-------------------------------------------+--------------------------------------------+
| ac                                       | ac                                        | accd                                       |
+------------------------------------------+-------------------------------------------+--------------------------------------------+
```
