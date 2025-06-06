---
{
    "title": "SHOW CREATE ROUTINE LOAD",
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

This statement is used to display the creation statement of a routine load job.

The result shows the current consuming Kafka partitions and their corresponding offsets to be consumed. The result may not be a real-time consumption point, and should be based on the result of [show routine load](./SHOW-ROUTINE-LOAD.md).

## Syntax

```sql
SHOW [ALL] CREATE ROUTINE LOAD for <load_name>;
```

## Required Parameters

**1. `<load_name>`**

> The name of the routine load job

## Optional Parameters

**1. `[ALL]`**

> Optional parameter that represents retrieving all jobs, including historical jobs

## Access Control Requirements

Users executing this SQL command must have at least the following permission:

| Privilege  | Object | Notes                                                    |
| :--------- | :----- | :------------------------------------------------------- |
| LOAD_PRIV  | Table  | SHOW ROUTINE LOAD requires LOAD permission on the table |

## Examples

- Show the creation statement of a specified routine load job in the default database

   ```sql
   SHOW CREATE ROUTINE LOAD for test_load
   ```