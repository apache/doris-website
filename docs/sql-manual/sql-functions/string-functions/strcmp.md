---
{
    "title": "STRCMP",
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

## strcmp

### description

`TINYINT strcmp(VARCHAR str0, VARCHAR str1)`

The function compares two strings `str0` and `str1` in dictionary order.

The return value is as follows:

If `str0` and `str1` are the same string, return 0.
If `str0` is greater than `str1` in dictionary order, return 1.
If `str0` is less than `str1` in dictionary order, return -1.

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
