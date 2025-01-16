---
{
    "title": "FROM_DAYS",
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

Given a number of days, returns a DATE.

- Note: To maintain consistent behavior with MySQL, the date 0000-02-29 does not exist.

## Syntax

```sql
DATE FROM_DAYS(INT N)
```

## Parameters

| Parameter | Description |
| -- | -- |
| dt | Days |

## Return Value

Returns the date corresponding to the given number of days.

## Examples

```sql
select from_days(730669),from_days(5),from_days(59), from_days(60);
```

```text
+-------------------+--------------+---------------+---------------+
| from_days(730669) | from_days(5) | from_days(59) | from_days(60) |
+-------------------+--------------+---------------+---------------+
| 2000-07-03        | 0000-01-05   | 0000-02-28    | 0000-03-01    |
+-------------------+--------------+---------------+---------------+
```