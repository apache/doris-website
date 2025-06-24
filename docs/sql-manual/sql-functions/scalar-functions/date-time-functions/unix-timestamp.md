---
{
    "title": "UNIX_TIMESTAMP",
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

Converts a Date or Datetime type to a unix timestamp (the conversion is affected by the time zone). If there is no parameter, the current time is converted to a timestamp. For times before 1970-01-01 00:00:00 or after 2038-01-19 03:14:07, the function returns 0.

## Syntax

```sql
UNIX_TIMESTAMP (<date>[, <fmt>])
```

## Parameters

| Parameter | Description |
|--|--|
| `<date>` | The corresponding date value is Date or Datetime type |
| `<fmt>` | Specifies the output format of date/time. For the format, see[date_format](./date-format.md)the format specification of the function. |

## Return Value

Converts a Date or Datetime type to a Unix timestamp (the conversion is affected by the time zone). If there is no parameter, the current time is converted to a timestamp. For times before 1970-01-01 00:00:00 or after 2038-01-19 03:14:07, the function returns 0.

## Example

```sql
SELECT UNIX_TIMESTAMP(),UNIX_TIMESTAMP('2007-11-30'),UNIX_TIMESTAMP('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s');
```

```text
+------------------+-----------------------------------------------------+------------------------------------------------------------+
| unix_timestamp() | unix_timestamp(cast('2007-11-30' as DATETIMEV2(0))) | unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s') |
+------------------+-----------------------------------------------------+------------------------------------------------------------+
|       1742357008 |                                          1196352000 |                                          1196389819.000000 |
+------------------+-----------------------------------------------------+------------------------------------------------------------+
```
