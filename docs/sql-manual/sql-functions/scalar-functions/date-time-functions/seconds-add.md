---
{
  "title": "SECONDS_ADD",
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

Adds a specified number of seconds to the given datetime and returns the calculated new datetime.

## Syntax

```sql
SECONDS_ADD(<datetime/date>, <nums>)
```

## Parameters

| Parameter | Description |
|-------------------|---------------|
| `<datetime/date>` | The datetime value to be calculated, of type `DATETIME` or `DATE` |
| `<nums>` | The number of seconds to add |

## Return Value

Returns the calculated new date.

The return value type is consistent with the input <datetime/date> type.

Special cases:

- When <datetime/date> input is NULL, returns NULL
- If the calculation result is out of range, SQL execution will report an error. In filter conditions, you can rewrite it as [`TIMESTAMPDIFF`](./timestampdiff)

## Examples

```sql
select seconds_add("2020-01-31 02:02:02", 1),seconds_add("2020-01-31", 1),seconds_add("2020-01-31", -1);
```

```text
+---------------------------------------+------------------------------+-------------------------------+
| seconds_add("2020-01-31 02:02:02", 1) | seconds_add("2020-01-31", 1) | seconds_add("2020-01-31", -1) |
+---------------------------------------+------------------------------+-------------------------------+
| 2020-01-31 02:03:02                   | 2020-01-31 00:01:00          | 2020-01-30 23:59:00           |
+---------------------------------------+------------------------------+-------------------------------+
```

```sql
select seconds_add("9999-12-31 12:00:00", 1000);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [E-218] Operation seconds_add of 9999-12-31 12:00:00, 1000 out of range
