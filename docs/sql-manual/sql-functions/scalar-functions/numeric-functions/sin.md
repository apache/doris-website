---
{
    "title": "SIN",
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

Calculate the sine of the parameter

## Syntax

```sql
SIN(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | floating point number, the radian value of the parameter to calculate |

## Return Value

The sine of the parameter `<a>`, expressed in radians.

## Examples

```sql
select sin(1);
```

```text
+------------------------+
| sin(cast(1 as DOUBLE)) |
+------------------------+
|     0.8414709848078965 |
+------------------------+
```

```sql
select sin(0);
```

```text
+------------------------+
| sin(cast(0 as DOUBLE)) |
+------------------------+
|                    0.0 |
+------------------------+
```

```sql
select sin(Pi());
```

```text
+------------------------------------+
| sin(pi())                          |
+------------------------------------+
| 0.00000000000000012246467991473532 |
+------------------------------------+
```
