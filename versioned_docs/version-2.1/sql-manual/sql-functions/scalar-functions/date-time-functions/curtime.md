---
{
    "title": "CURTIME,CURRENT_TIME",
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

Retrieves the current time and returns it as a TIME type.

## Alias

- CURTIME
- CURRENT_TIME

## Syntax

```sql
CURTIME()
```

## Return Value

Returns the current time.

## Examples

```sql
mysql> select current_time();
```

```text
+----------------+
| current_time() |
+----------------+
| 15:25:47       |
+----------------+
```