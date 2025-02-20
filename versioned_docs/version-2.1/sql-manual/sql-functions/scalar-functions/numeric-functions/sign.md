---
{
    "title": "SIGN",
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

Returns the sign of `x`. Negative, zero or positive numbers correspond to -1, 0 or 1 respectively.

## Syntax

```sql
SIGN(x)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | independent variable |

## Return value

Returns an integer:

- If x > 0, it returns 1, representing a positive number.

- If x = 0, it returns 0, representing zero.

- If x < 0, it returns -1, representing a negative number.

- If x is NULL, it returns NULL.

## Example

```sql
select sign(3);
```

```text
+-------------------------+
| sign(cast(3 as DOUBLE)) |
+-------------------------+
|                       1 |
+-------------------------+
```

```sql
select sign(0);
```

```text
+-------------------------+
| sign(cast(0 as DOUBLE)) |
+-------------------------+
|                       0 |
+-------------------------+
```

```sql
select sign(-10.0);
```

```text
+-----------------------------+
| sign(cast(-10.0 as DOUBLE)) |
+-----------------------------+
|                          -1 |
+-----------------------------+
```

```sql
select sign(null);
```

```text
+------------+
| sign(NULL) |
+------------+
|       NULL |
+------------+
```
