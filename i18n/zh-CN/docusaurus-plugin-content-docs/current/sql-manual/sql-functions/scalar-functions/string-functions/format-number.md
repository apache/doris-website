---
{
    "title": "FORMAT_NUMBER",
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

返回一个使用单位符号格式化的字符串。具体单位有："K", "M", "B", "T", "Q"

## 语法

```sql
FORMAT_NUMBER(<val>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<val>` | 需要被格式化带单位的数值 |

## 返回值

参数 val 的带单位符号格式化的字符串

## 举例

```sql
SELECT format_number(123456.0);
```

```text
+-----------------------------------------+
| format_number(cast(123456.0 as DOUBLE)) |
+-----------------------------------------+
| 123K                                    |
+-----------------------------------------+
```

```sql
SELECT format_number(1000000.00);
```

```text
+-------------------------------------------+
| format_number(cast(1000000.00 as DOUBLE)) |
+-------------------------------------------+
| 1M                                        |
+-------------------------------------------+
```

```sql
select format_number(-1000000000000000);
```

```text
+--------------------------------------------------+
| format_number(cast(-1000000000000000 as DOUBLE)) |
+--------------------------------------------------+
| -1Q                                              |
+--------------------------------------------------+
```
