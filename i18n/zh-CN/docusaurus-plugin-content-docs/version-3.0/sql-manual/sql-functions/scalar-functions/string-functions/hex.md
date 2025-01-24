---
{
    "title": "HEX",
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

如果输入参数是数字，返回十六进制值的字符串表示形式。

如果输入参数是字符串，则将每个字符转化为两个十六进制的字符，将转化后的所有字符拼接为字符串输出。


## 语法

```sql
HEX ( <str> )
```

## 参数

| 参数    | 说明           |
|-------|--------------|
| `<str>` | 输入参数是数字或者字符串 |

## 返回值

参数 `<str>` 的十六进制结果。

## 举例

输入参数是数字
```sql
SELECT HEX(12),HEX(-1)
```

```text
+---------+------------------+
| hex(12) | hex(-1)          |
+---------+------------------+
| C       | FFFFFFFFFFFFFFFF |
+---------+------------------+
```

输入参数是字符串

```sql
SELECT HEX('1'),HEX('@'),HEX('12')
```

```text
+----------+----------+-----------+
| hex('1') | hex('@') | hex('12') |
+----------+----------+-----------+
| 31       | 40       | 3132      |
+----------+----------+-----------+
```