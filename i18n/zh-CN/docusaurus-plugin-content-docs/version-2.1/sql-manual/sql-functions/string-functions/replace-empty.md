---
{
    "title": "REPLACE_EMPTY",
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

## replace_empty
### description
#### Syntax

自 2.1.5 版本支持。

`VARCHAR REPLACE_EMPTY (VARCHAR str, VARCHAR old, VARCHAR new)`

将 `str` 字符串中的 `old` 子串全部替换为 `new` 字符串。

和 `REPLACE()` 函数不同的是，当 `old` 为空字符串时，会将 `new` 字符串插入到 `str` 字符串的每个字符前，以及 `str` 字符串的最后。

除此之外，其他行为和 `REPLACE()` 函数完全一致。

该函数主要用于兼容 Presto、Trino，其行为了 Presto、Trino 中的 `REPLACE()` 函数完全一致。

### example

```
mysql> select replace_empty("http://www.baidu.com:9090", "9090", "");
+------------------------------------------------------+
| replace('http://www.baidu.com:9090', '9090', '') |
+------------------------------------------------------+
| http://www.baidu.com:                                |
+------------------------------------------------------+

mysql> select replace_empty("abc", '', 'xyz');
+---------------------------------+
| replace_empty('abc', '', 'xyz') |
+---------------------------------+
| xyzaxyzbxyzcxyz                 |
+---------------------------------+

mysql> select replace_empty("", "", "xyz");
+------------------------------+
| replace_empty('', '', 'xyz') |
+------------------------------+
| xyz                          |
+------------------------------+
```

### keywords

    REPLACE_EMPTY
