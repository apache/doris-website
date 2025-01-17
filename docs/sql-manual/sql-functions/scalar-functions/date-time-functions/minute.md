---
{
    "title": "MINUTE",
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

Extracts the minute part from a datetime value. The returned value ranges from 0 to 59.

## Syntax

```sql
MINUTE(<datetime>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| datetime  | The input datetime value, which can be of type DATE, DATETIME, DATETIMEV2, or TIME |

## Return Value

Returns an INT type representing the minute value, with a range of 0-59.

## Example

```sql
SELECT MINUTE('2018-12-31 23:59:59');
```

```text
+------------------------------------------------------+
| minute(cast('2018-12-31 23:59:59' as DATETIMEV2(0))) |
+------------------------------------------------------+
|                                                   59 |
+------------------------------------------------------+
```

**Note:**
- The input parameter can be of various time-related types.
- The returned value is always an integer between 0 and 59.
- If the input parameter is NULL, the function returns NULL.
