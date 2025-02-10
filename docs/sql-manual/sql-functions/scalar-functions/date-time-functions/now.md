---
{
  "title": "NOW",
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

The function retrieves the current system time and returns it as a datetime value (`DATETIME`). An optional precision
can be specified to adjust the number of digits in the fractional seconds part of the return value.

## Syntax

```sql
NOW([<precision>])
```

## Parameters

| Parameter     | Description                                                                                                                                                                                                                                                                                                                                                                                                 |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>` | Optional parameter specifying the precision of the fractional seconds part in the return value. The range is 0 to 6, and the default is 0 (no fractional seconds). <br/>Limited by the JDK implementation: if FE is built with JDK8, the precision supports up to milliseconds (3 fractional digits), and higher precision digits will be filled with 0. If higher precision is required, please use JDK11. |

## Return Value

- Returns the current system time as a DATETIME type.
- If the specified `<precision>` is out of range (e.g., negative or greater than 6), the function will return an error.

## Example

```sql
select NOW(), NOW(3), NOW(6);
```

```text
+---------------------+-------------------------+----------------------------+
| now()               | now(3)                  | now(6)                     |
+---------------------+-------------------------+----------------------------+
| 2025-01-23 11:08:35 | 2025-01-23 11:08:35.561 | 2025-01-23 11:08:35.562000 |
+---------------------+-------------------------+----------------------------+
```