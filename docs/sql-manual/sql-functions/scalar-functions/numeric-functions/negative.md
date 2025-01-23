---
{
    "title": "NEGATIVE",
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

Returns the negative value of the parameter x.

## Syntax

```sql
NEGATIVE(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<Number>`   | The independent variable supports the types `BIGINT, DOUBLE, and DECIMAL` |

## Return value

Returns an integer or a floating-point number. Special cases:

- If the parameter is NULL, return NULL.
- If the parameter is 0, return 0.

## Example

```sql
SELECT negative(-10);
```

```text
+---------------+
| negative(-10) |
+---------------+
|            10 |
+---------------+
```

```sql
SELECT negative(12);
```

```text
+--------------+
| negative(12) |
+--------------+
|          -12 |
+--------------+
```

```sql
SELECT negative(0);
```

```text
+-------------+
| negative(0) |
+-------------+
|           0 |
+-------------+
```

```sql
SELECT negative(null);
```

```text
+----------------+
| negative(NULL) |
+----------------+
|           NULL |
+----------------+
```