---
{
    "title": "SIGNBIT",
    "language": "zh-CN",
    "description": "判断给定浮点数的符号位是否为负。"
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

## Description

判断给定浮点数的符号位是否为负。

## Syntax

```sql
SIGNBIT(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | 要检查的浮点数参数 |

## Return Value

如果 `<a>` 的符号位为负（即 `<a>` 是负数），返回 true，否则返回 false。
特别的，对于浮点数的正负零，也可以区分。

## Examples

```sql
select signbit(-1.0);
```

```text
+-----------------------------+
| signbit(cast(-1 as DOUBLE)) |
+-----------------------------+
| true                        |
+-----------------------------+
```

```sql
select signbit(0.0);
```

```text
+----------------------------+
| signbit(cast(0 as DOUBLE)) |
+----------------------------+
| false                      |
+----------------------------+
```

```sql
select signbit(1.0);
```

```text
+----------------------------+
| signbit(cast(1 as DOUBLE)) |
+----------------------------+
| false                      |
+----------------------------+
```

```sql
select signbit(cast('+0.0' as double)) , signbit(cast('-0.0' as double));
```

```text
+---------------------------------+---------------------------------+
| signbit(cast('+0.0' as double)) | signbit(cast('-0.0' as double)) |
+---------------------------------+---------------------------------+
|                               0 |                               1 |
+---------------------------------+---------------------------------+
```