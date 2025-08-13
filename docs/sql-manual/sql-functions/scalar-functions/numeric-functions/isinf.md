---
{
    "title": "ISINF",
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

## Description

Determines whether the specified value is infinity.

## Syntax

```sql
ISINF(<value>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<value>` | The value to be checked, which must be a DOUBLE or FLOAT type |

## Return Value

Returns 1 if the value is infinity (positive or negative), otherwise returns 0.
If the value is NULL, returns NULL.

## Examples

```sql
SELECT isinf(1);
```

```text
+----------+
| isinf(1) |
+----------+
|        0 |
+----------+
```

```sql
SELECT cast('inf' as double),isinf(cast('inf' as double))
```

```text
+-----------------------+------------------------------+
| cast('inf' as double) | isinf(cast('inf' as double)) |
+-----------------------+------------------------------+
|              Infinity |                            1 |
+-----------------------+------------------------------+
```

```sql
SELECT isinf(NULL)
```

```text
+-------------+
| isinf(NULL) |
+-------------+
|        NULL |
+-------------+
```
