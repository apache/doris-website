---
{
    "title": "ISNAN",
    "language": "zh-CN",
    "description": "判断指定的值是否为 NaN（非数字）。"
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

判断指定的值是否为 NaN（非数字）。

## Syntax

```sql
ISNAN(<value>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<value>` | 要检查的值，DOUBLE 或 FLOAT 类型 |

## Return Value

如果值是 NaN，则返回 1，否则返回 0。
如果值为 NULL，则返回 NULL。

## Examples

```sql
SELECT isnan(1);
```

```text
+----------+
| isnan(1) |
+----------+
|        0 |
+----------+
```

```sql
SELECT cast('nan' as double),isnan(cast('nan' as double));
```

```text
+-----------------------+------------------------------+
| cast('nan' as double) | isnan(cast('nan' as double)) |
+-----------------------+------------------------------+
|                   NaN |                            1 |
+-----------------------+------------------------------+
```

```sql
SELECT isnan(NULL)
```

```text
+-------------+
| isnan(NULL) |
+-------------+
|        NULL |
+-------------+
```

