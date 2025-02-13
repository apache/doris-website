---
{
    "title": "COS",
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

Calculate the cosine of the parameter

## Syntax

```sql
COS(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | floating point number, the radian value of the parameter to calculate |

## Return Value

The cosine of the parameter `<a>`, expressed in radians.

## Examples

```sql
select cos(1);
```

```text
+---------------------+
| cos(1.0)            |
+---------------------+
| 0.54030230586813977 |
+---------------------+
```

```sql
select cos(0);
```

```text
+------------------------+
| cos(cast(0 as DOUBLE)) |
+------------------------+
|                    1.0 |
+------------------------+
```

```sql
select cos(Pi());
```

```text
+-----------+
| cos(pi()) |
+-----------+
|        -1 |
+-----------+
```
