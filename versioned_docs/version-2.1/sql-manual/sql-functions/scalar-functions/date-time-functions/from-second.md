---
{
    "title": "FROM_SECOND",
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
The function converts a Unix timestamp (in seconds) into a `DATETIME` value.


## Syntax

```sql
FROM_SECOND(<unix_timestamp>)
```
## Parameters

| Parameter          | Description                                                                                            |
|--------------------|--------------------------------------------------------------------------------------------------------|
| `<unix_timestamp>` | Required. The Unix timestamp representing the number of seconds elapsed since 1970-01-01 00:00:00 UTC. |

## Return Value
- Returns a DATETIME value representing the date and time corresponding to the given Unix timestamp.
- If `<unix_timestamp>` is NULL, the function returns NULL.
- If `<unix_timestamp>` is out of valid range, the function returns an error.

## Example

```sql
SELECT FROM_SECOND(1700000000);
```

```text
+-------------------------+
| from_second(1700000000) |
+-------------------------+
| 2023-11-15 06:13:20     |
+-------------------------+
```