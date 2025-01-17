---
{
    "title": "MAKEDATE",
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

Returns a date based on the specified year and the day of the year (dayofyear).

Special cases:
- Returns NULL when `dayofyear` is less than or equal to 0.
- Automatically rolls over to the next year if `dayofyear` exceeds the number of days in the year.

## Syntax

```sql
MAKEDATE(<year>, <dayofyear>)
```

## Parameters

| Parameter   | Description                               |
|-------------|-------------------------------------------|
| year        | The specified year, of type INT          |
| dayofyear   | The day of the year (1-366), of type INT |

## Return Value

Returns a value of type DATE, constructed from the specified year and the given day of the year.

## Example

```sql
SELECT MAKEDATE(2021, 1), MAKEDATE(2021, 100), MAKEDATE(2021, 400);
```

```text
+-------------------+---------------------+---------------------+
| makedate(2021, 1) | makedate(2021, 100) | makedate(2021, 400) |
+-------------------+---------------------+---------------------+
| 2021-01-01        | 2021-04-10          | 2022-02-04          |
+-------------------+---------------------+---------------------+
```
