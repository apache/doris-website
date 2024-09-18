---
{
    "title": "ARRAY_WITH_CONSTANT",
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

## array_with_constant

:::tip 提示
该功能自 Apache Doris  1.2 版本起支持
:::

array_with_constant
array_repeat



### description

#### Syntax

```sql
ARRAY<T> array_with_constant(n, T)
ARRAY<T> array_repeat(T, n)
```
返回一个数组，包含 n 个重复的 T 常量。array_repeat 与 array_with_constant 功能相同，用来兼容 hive 语法格式。

### example

```
mysql> select array_with_constant(2, "hello"), array_repeat("hello", 2);
+---------------------------------+--------------------------+
| array_with_constant(2, 'hello') | array_repeat('hello', 2) |
+---------------------------------+--------------------------+
| ['hello', 'hello']              | ['hello', 'hello']       |
+---------------------------------+--------------------------+
1 row in set (0.04 sec)

mysql> select array_with_constant(3, 12345), array_repeat(12345, 3);
+-------------------------------+------------------------+
| array_with_constant(3, 12345) | array_repeat(12345, 3) | 
+-------------------------------+------------------------+
| [12345, 12345, 12345]         | [12345, 12345, 12345]  |
+-------------------------------+------------------------+
1 row in set (0.01 sec)

mysql> select array_with_constant(3, null), array_repeat(null, 3);
+------------------------------+-----------------------+
| array_with_constant(3, NULL) | array_repeat(NULL, 3) |
+------------------------------+-----------------------+
| [NULL, NULL, NULL]           |  [NULL, NULL, NULL]   |
+------------------------------+-----------------------+
1 row in set (0.01 sec)

mysql> select array_with_constant(null, 3), array_repeat(3, null);
+------------------------------+-----------------------+
| array_with_constant(NULL, 3) | array_repeat(3, NULL) |
+------------------------------+-----------------------+
| []                           | []                    |
+------------------------------+-----------------------+
1 row in set (0.01 sec)

```

### keywords

ARRAY,WITH_CONSTANT,ARRAY_WITH_CONSTANT,ARRAY_REPEAT
