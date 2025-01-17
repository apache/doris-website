---
{
    "title": "TRANSLATE",
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

TRANSLATE 函数用于字符串替换，将源字符串中的字符按照映射规则进行转换。它会将源字符串中出现在 from 字符串中的字符替换为 to 字符串中对应位置的字符。

## 语法

```sql
VARCHAR TRANSLATE(VARCHAR source, VARCHAR from, VARCHAR to)
```

## 参数
| 参数   | 说明                                  |
| ------ | ------------------------------------- |
| source | 需要进行转换的源字符串。类型：VARCHAR |
| from   | 要被替换的字符集合。类型：VARCHAR     |
| to     | 替换后的字符集合。类型：VARCHAR       |

## 返回值

返回 VARCHAR 类型，表示替换后的字符串。

特殊情况：
- 如果任意参数为 NULL，返回 NULL
- 如果 from 字符串中有重复字符，只使用第一次出现的位置
- 如果源字符不在 from 字符串中，该字符将保持不变
- 如果 from 字符串中字符的位置超出了 to 字符串的长度，对应的源字符将被删除
- 如果 from 和 to 都为空字符串，返回原字符串

## 示例

1. 基本字符替换
```sql
SELECT translate('abcd', 'a', 'z');
```
```text
+---------------------------+
| translate('abcd', 'a', 'z') |
+---------------------------+
| zbcd                      |
+---------------------------+
```

2. 多次替换相同字符
```sql
SELECT translate('abcda', 'a', 'z');
```
```text
+----------------------------+
| translate('abcda', 'a', 'z') |
+----------------------------+
| zbcdz                      |
+----------------------------+
```

3. 特殊字符替换
```sql
SELECT translate('Palhoça', 'ç', 'c');
```
```text
+--------------------------------+
| translate('Palhoça', 'ç', 'c') |
+--------------------------------+
| Palhoca                        |
+--------------------------------+
```

4. 字符删除（to 字符串为空）
```sql
SELECT translate('abcd', 'a', '');
```
```text
+----------------------------+
| translate('abcd', 'a', '') |
+----------------------------+
| bcd                        |
+----------------------------+
```

5. from 字符串中的重复字符
```sql
SELECT translate('abcd', 'aac', 'zq');
```
```text
+--------------------------------+
| translate('abcd', 'aac', 'zq') |
+--------------------------------+
| zbd                            |
+--------------------------------+
```