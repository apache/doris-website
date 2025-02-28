---
{
    "title": "ATANH",
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

Returns the hyperbolic arc tangent of `x`, or `NULL` if `x` is not in the range `-1` to `1`(excluding `-1` and `1`).

## Syntax

```sql
ATANH(<x>)
```

## Parameters

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the hyperbolic arc tangent value is to be calculated |  

## Return Value  

The atanh value of parameter `x`. 

## Example

```sql
select atanh(1.0);
```

```sql
+------------+
| atanh(1.0) |
+------------+
|       NULL |
+------------+
```

```sql
select atanh(1.0);
```

```sql
+-------------+
| atanh(-1.0) |
+-------------+
|        NULL |
+-------------+
```

```sql
select atanh(1.0);
```

```sql
+------------+
| atanh(0.0) |
+------------+
|          0 |
+------------+
```

```sql
select atanh(1.0);
```

```sql
+--------------------+
| atanh(0.5)         |
+--------------------+
| 0.5493061443340548 |
+--------------------+
```
