---
{
    "title": "BIN",
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

将十进制数字转换为二进制文本。

## 语法

```sql
bin(<a>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<a>` | 需要转换的十进制值 |

## 返回值

参数 `<a>` 的二进制表示。当 `<a>` 为负数时，结果为其 64 位补码表示。

## 举例

```sql
select bin(0);
```

```text
+--------+
| bin(0) |
+--------+
| 0      |
+--------+
```

```sql
select bin(-1);
```

```text
+------------------------------------------------------------------+
| bin(-1)                                                          |
+------------------------------------------------------------------+
| 1111111111111111111111111111111111111111111111111111111111111111 |
+------------------------------------------------------------------+
```

```sql
select bin(123);
```

```text
+----------+
| bin(123) |
+----------+
| 1111011  |
+----------+
```
