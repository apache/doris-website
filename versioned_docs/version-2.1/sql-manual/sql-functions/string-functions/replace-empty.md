---
{
    "title": "REPLACE_EMPTY",
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

## replace_empty
### description
#### Syntax

Since 2.1.5

`VARCHAR REPLACE_EMPTY (VARCHAR str, VARCHAR old, VARCHAR new)`

Replace all `old` substrings in `str` string with `new` string.

Unlike the `REPLACE()` function, when `old` is an empty string, the `new` string is inserted before each character of the `str` string and at the end of the `str` string.

Other than that, the other behaviors are exactly the same as the `REPLACE()` function.

This function is mainly used for compatibility with Presto and Trino, and its behavior is exactly the same as the `REPLACE()` function in Presto and Trino.

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
