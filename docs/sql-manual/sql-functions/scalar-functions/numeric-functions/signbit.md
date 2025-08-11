---
{
    "title": "SIGNBIT",
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

Determine whether the sign bit of the given floating-point number is set.

## Syntax

```sql
SIGNBIT(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | Floating-point number to check the sign bit for |

## Return Value

Returns true if the sign bit of `<a>` is set (i.e., `<a>` is negative), otherwise returns false.

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