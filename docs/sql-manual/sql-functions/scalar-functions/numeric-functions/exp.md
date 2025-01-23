---
{
    "title": "EXP",
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

Returns `x` raised to the base `e`.

## Alias

- DEXP

## Syntax

```sql
EXP(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | independent variable |

## Return Value

Return a value of type double
- If the parameter has a null value, it returns NULL

## Example

```sql
select exp(2);
```

```text
+------------------+
| exp(2.0)         |
+------------------+
| 7.38905609893065 |
+------------------+
```

```
select exp(3.4);
```

```text
+--------------------+
| exp(3.4)           |
+--------------------+
| 29.964100047397011 |
+--------------------+
```
