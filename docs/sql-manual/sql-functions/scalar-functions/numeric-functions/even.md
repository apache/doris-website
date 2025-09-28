---
{
    "title": "EVEN",
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

Round to next even number by rounding away from zero.

## Syntax

```sql
EVEN(<a>)
```


## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | A numeric expression to round to the next even integer |

## Return Value

Returns an even integer based on the following rules:

- If x > 0, round up to the closest even number.
- If x < 0, round down to the closest even number.
- If x is already an even number, return it directly.
- If x is NULL, returns NULL.

## Examples

```sql
select even(2.9);
```

```text
+----------+
| even(2.9) |
+----------+
|        4 |
+----------+
```

```sql
select even(-2.9);
```

```text
+-----------+
| even(-2.9) |
+-----------+
|       -4  |
+-----------+
```

```sql
select even(4);
```

```text
+--------+
| even(4) |
+--------+
|      4 |
+--------+
```

```sql
select even(NULL);
```

```text
+------------+
| even(NULL) |
+------------+
|       NULL |
+------------+
```