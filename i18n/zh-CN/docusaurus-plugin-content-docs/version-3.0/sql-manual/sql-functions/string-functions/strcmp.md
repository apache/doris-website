---
{
    "title": "STRCMP",
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

## strcmp

### description

`TINYINT strcmp(VARCHAR str0, VARCHAR str1)`

函数按照字典顺序比较两个字符串 `str0` 和 `str1`。

返回值如下：

如果 `str0` 和 `str1` 是相同的字符串，返回 0。
如果 `str0` 在字典顺序上大于 `str1`，返回 1。
如果 `str0` 在字典顺序上小于 `str1`，返回 -1。

### example

```sql
mysql> select strcmp("test", "test");
+------------------------+
| strcmp('test', 'test') |
+------------------------+
|                      0 |
+------------------------+
1 row in set (0.00 sec)

mysql> select strcmp("test1", "test");
+-------------------------+
| strcmp('test1', 'test') |
+-------------------------+
|                       1 |
+-------------------------+
1 row in set (0.02 sec)

mysql> select strcmp("test", "test1");
+-------------------------+
| strcmp('test', 'test1') |
+-------------------------+
|                      -1 |
+-------------------------+
1 row in set (0.00 sec)
```

### keywords
    STRCMP
