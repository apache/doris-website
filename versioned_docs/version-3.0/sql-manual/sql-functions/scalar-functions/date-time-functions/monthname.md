---
{
    "title": "MONTHNAME",
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

Returns the English name of the month corresponding to a given date. The returned value is the full English name of the month (from January to December).

## Syntax

```sql
MONTHNAME(<date>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`  | The input datetime value, which can be of type DATE, DATETIME, or DATETIMEV2 |

## Return Value

Returns a value of type VARCHAR representing the English name of the month:
- Possible return values: January, February, March, April, May, June, July, August, September, October, November, December
- If the input is NULL, the function returns NULL.
- The first letter of the return value is capitalized, and the remaining letters are in lowercase.

## Example

```sql
SELECT MONTHNAME('2008-02-03 00:00:00');
```

```text
+---------------------------------------------------------+
| monthname(cast('2008-02-03 00:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------+
| February                                                |
+---------------------------------------------------------+
```
