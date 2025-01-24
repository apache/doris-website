---
{
    "title": "FROM_ISO8601_DATE",
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

Converts an ISO8601 formatted date expression to a DATE type date expression.

## Syntax

```sql
from_iso8601_date(<dt>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<dt>` | An ISO8601 formatted date |

## Return Value

A DATE type date expression.

## Examples

```sql
SELECT from_iso8601_date('0000-01'),from_iso8601_date('0000-W01'),from_iso8601_date('0000-059');
```

```text
+------------------------------+-------------------------------+-------------------------------+
| from_iso8601_date('0000-01') | from_iso8601_date('0000-W01') | from_iso8601_date('0000-059') |
+------------------------------+-------------------------------+-------------------------------+
| 0000-01-01                   | 0000-01-03                    | 0000-02-28                    |
+------------------------------+-------------------------------+-------------------------------+
```