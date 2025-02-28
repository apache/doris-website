---
{
    "title": "PAUSE ROUTINE LOAD",
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

This syntax is used to pause one or all Routine Load jobs. Paused jobs can be restarted using the RESUME command.

## Syntax

```sql
PAUSE [ALL] ROUTINE LOAD FOR <job_name>
```

## Required Parameters

**1. `<job_name>`**

> Specifies the name of the job to pause. If ALL is specified, job_name is not required.

## Optional Parameters

**1. `[ALL]`**

> Optional parameter. If ALL is specified, it indicates pausing all routine load jobs.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | SHOW ROUTINE LOAD requires LOAD privilege on the table |

## Notes

- After a job is paused, it can be restarted using the RESUME command
- The pause operation will not affect tasks that have already been dispatched to BE, these tasks will continue to complete

## Examples

- Pause a routine load job named test1.

   ```sql
   PAUSE ROUTINE LOAD FOR test1;
   ```

- Pause all routine load jobs.

   ```sql
   PAUSE ALL ROUTINE LOAD;
   ```