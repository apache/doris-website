---
{
    "title": "RANDOM",
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

Returns a random number between 0 and 1, or returns the required random number according to the parameters.

- Note: All parameters must be constants.

## Alias

- RAND

## Syntax

```sql
RANDOM() -- Generates a random number between 0 and 1

RANDOM(<seed>) -- Generates a fixed sequence of random numbers between 0 and 1 based on the seed value

RANDOM(<a> , <b>) -- Generates a random number between a and b
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<seed>` | random number generator seed. Returns a fixed sequence of random numbers between 0 and 1. |
| `<a>` | The lower bound of a random number. |
| `<b>` | The upper bound of a random number. It must be less than the lower bound. |

## Return value

- If no parameters are passed: Returns a random number between 0 and 1.

- If a single parameter seed is passed: Returns a fixed sequence of random numbers between 0 and 1.

- If two parameters a and b are passed: Returns a random integer between a and b.

## Example

```sql
select random();
```

```text
+--------------------+
| random()           |
+--------------------+
| 0.8047437125910604 |
+--------------------+
```

```sql
select rand(1.2);
```

```text
+---------------------+
| rand(1)             |
+---------------------+
| 0.13387664401253274 |
+---------------------+
```

```sql
select rand(-20, -10);
```

```text
+------------------+
| random(-20, -10) |
+------------------+
|              -10 |
+------------------+
```
