---
{
    "title": "TIMESTAMP",
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

The TIMESTAMP function has two uses:

1. Convert a datetime string to a DATETIME type
2. Combine two arguments into a DATETIME type

## Syntax

```sql
TIMESTAMP(string)
TIMESTAMP(date, time)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `string`      | A datetime string |
| `date`     | A date value, which can be a DATE type or a properly formatted date string |
| `time`     | A time value, which can be a TIME type or a properly formatted time string |

## Return Value

Returns a value of type DATETIME.

## Example

```sql
-- Convert a string to DATETIME
SELECT TIMESTAMP('2019-01-01 12:00:00');
```

```text
+------------------------------------+
| timestamp('2019-01-01 12:00:00')   |
+------------------------------------+
| 2019-01-01 12:00:00                |
+------------------------------------+
```

```sql
-- Combine date and time into DATETIME
SELECT TIMESTAMP('2019-01-01', '12:00:00');
```

```text
+----------------------------------------+
| timestamp('2019-01-01', '12:00:00')    |
+----------------------------------------+
| 2019-01-01 12:00:00                    |
+----------------------------------------+
```
