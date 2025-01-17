---
{
    "title": "CHAR",
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

将每个参数解释为整数，并返回一个字符串，该字符串由这些整数的代码值给出的字符组成。特殊情况：

- 如果结果字符串对于给定字符集是非法的，相应的转换结果为 NULL 值。

- 大于 `255` 的参数将转换为多个结果字节。例如，`char(15049882)`等价于`char(229, 164, 154)`。


## 语法

```sql
char(INT <expr1> [ , INT <expr2> ... ] [USING charset_name])
```

## 参数

| 参数 | 说明                  |
| -- |---------------------|
| `<expr1>` | 需要被计算为字符的整数         |
| `charset_name` | 返回值的编码，目前只支持 `utf8` |

## 返回值

参数列表 expr1 对应字符组成的字符串。特殊情况：

- 如果结果字符串对于给定字符集是非法的，相应的转换结果为 NULL 值。

- 大于 `255` 的参数将转换为多个结果字节。例如，`char(15049882)`等价于`char(229, 164, 154)`。

## 举例

```sql
select char(68, 111, 114, 105, 115),char(15049882, 15179199, 14989469),char(255)
```

```text
+--------------------------------------+--------------------------------------------+-------------------+
| char('utf8', 68, 111, 114, 105, 115) | char('utf8', 15049882, 15179199, 14989469) | char('utf8', 255) |
+--------------------------------------+--------------------------------------------+-------------------+
| Doris                                | 多睿丝                                     | NULL              |
+--------------------------------------+--------------------------------------------+-------------------+
```