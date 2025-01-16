---
{
    "title": "MICROSECOND",
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

Extracts the microsecond part from a datetime value. The returned range is from 0 to 999999.

## Syntax

```sql
INT MICROSECOND(DATETIMEV2 date)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| date      | The input datetime value, of type DATETIMEV2, with a precision greater than 0 |

## Return Value

Returns an INT type representing the microsecond value (0-999999).

## Example

```sql
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIMEV2(6))) AS microsecond;
```

```text
+-------------+
| microsecond |
+-------------+
|         123 |
+-------------+
```

## Keywords

    MICROSECOND
