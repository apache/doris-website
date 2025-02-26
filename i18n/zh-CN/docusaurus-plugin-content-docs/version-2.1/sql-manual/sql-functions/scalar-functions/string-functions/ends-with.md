---
{
    "title": "ENDS_WITH",
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

如果字符串以指定后缀结尾则返回 true，否则返回 false。特殊情况：

- 两个参数任意一个参数为 NULL，返回 NULL。

## 语法

```sql
ENDS_WITH ( <str> ,  <suffix> )
```

## 参数

| 参数       | 说明           |
|----------|--------------|
| `str`    | 指定需要判断的原始字符串 |
| `suffix` | 指定需要判断的结尾字符串 |

## 返回值

true 或者 false，类型为 `BOOLEAN`。特殊情况：

- 两个参数任意一个参数为 NULL，返回 NULL。

## 举例

```sql
SELECT ENDS_WITH("Hello doris", "doris"),ENDS_WITH("Hello doris", "Hello")
```

```text
+-----------------------------------+-----------------------------------+
| ends_with('Hello doris', 'doris') | ends_with('Hello doris', 'Hello') |
+-----------------------------------+-----------------------------------+
|                                 1 |                                 0 |
+-----------------------------------+-----------------------------------+
```
