---
{
    "title": "LCM",
    "language": "en",
    "description": "<!-- Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
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

Calculates the least common multiple (LCM) of two integers. Note that the result may overflow.

## Syntax

```sql
LCM(<a>, <b>)
```


## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | The first integer |
| `<b>` | The second integer |

## Return Value

Returns the least common multiple of `<a>` and `<b>`.
If any input is NULL, returns NULL.

## Examples

```sql
select lcm(12, 18);
```

```text
+------------+
| lcm(12,18) |
+------------+
|         36 |
+------------+
```

```sql
select lcm(0, 10);
```

```text
+-----------+
| lcm(0,10) |
+-----------+
|         0 |
+-----------+
```

```sql
select lcm(-4, 6);
```

```text
+------------+
| lcm(-4,6)  |
+------------+
|          12|
+------------+
```

```sql
select lcm(-170141183460469231731687303715884105728, 3);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not convert to legacy literal: 510423550381407695195061911147652317184
```

```sql
select lcm(-4, NULL);
```

```text
+---------------+
| lcm(-4, NULL) |
+---------------+
|          NULL |
+---------------+
```