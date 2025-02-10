---
{
    "title": "QUARTER",
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
The function returns the quarter (1 to 4) of the given date. Each quarter includes three months:
- Q1: January to March
- Q2: April to June
- Q3: July to September
- Q4: October to December

## Syntax

```sql
QUARTER(<datetime>)
```

## Parameters

| Parameter    | Description                                              |
|--------------|----------------------------------------------------------|
| `<datetime>` | A valid DATE or DATETIME value to determine the quarter. |

## Return Value
- Returns an integer representing the quarter of the input date, ranging from 1 to 4.
- If the input is NULL, the function returns NULL.
- If the input is an invalid date (e.g., 0000-00-00), the function returns NULL.

## Example

```sql
SELECT QUARTER('2025-01-16'),QUARTER('2025-01-16 01:11:10');
```

```text
+-----------------------------------------+--------------------------------------------------+
| quarter(cast('2025-01-16' as DATETIME)) | quarter(cast('2025-01-16 01:11:10' as DATETIME)) |
+-----------------------------------------+--------------------------------------------------+
|                                       1 |                                                1 |
+-----------------------------------------+--------------------------------------------------+
```