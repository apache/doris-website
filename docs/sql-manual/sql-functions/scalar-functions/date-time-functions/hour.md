---
{
    "title": "HOUR",
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

Obtains the hour information from the given datetime.

## Syntax

```sql
INT HOUR(DATE date)
INT HOUR(TIME date)
INT HOUR(DATETIME date)
```

## Parameters

| Parameter | Description |
| -- | -- |
| date | The date to be calculated. |

## Return Value

Returns the hour information from the given date. The return value ranges from 0 to 23. When the parameter is of type TIME, the return value can be greater than 24.

## Examples

```sql
select hour('2018-12-31 23:59:59');
```

```text
+-----------------------------+
| hour('2018-12-31 23:59:59') |
+-----------------------------+
|                          23 |
+-----------------------------+
```

```sql
select cast(4562632 as time),hour(cast(4562632 as time)), minute(cast(4562632 as time)),second(cast(4562632 as time));
```

```text
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
| cast(4562632 as TIME) | hour(cast(4562632 as TIME)) | minute(cast(4562632 as TIME)) | second(cast(4562632 as TIME)) |
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
| 456:26:32             |                         456 |                            26 |                            32 |
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
```