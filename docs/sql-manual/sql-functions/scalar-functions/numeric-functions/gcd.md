---
{
    "title": "GCD",
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

Calculates the greatest common divisor (GCD) of two integers.

## Syntax

```sql
GCD(<a>, <b>)
```


## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | The first integer |
| `<b>` | The second integer |

## Return Value

Returns the greatest common divisor of `<a>` and `<b>`.

## Examples

```sql
select gcd(54, 24);
```

```text
+------------+
| gcd(54,24) |
+------------+
|          6 |
+------------+
```

```sql
select gcd(-17, 31);
```

```text
+-------------+
| gcd(17,31)  |
+-------------+
|           1 |
+-------------+
```

```sql
select gcd(0, 10);
```

```text
+-----------+
| gcd(0,10) |
+-----------+
|        10 |
+-----------+
```