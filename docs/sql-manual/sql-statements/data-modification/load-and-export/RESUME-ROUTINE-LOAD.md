---
{
    "title": "RESUME ROUTINE LOAD",
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

This syntax is used to restart one or all paused Routine Load jobs. The restarted job will continue consuming from the previously consumed offset.

## Syntax

```sql
RESUME [ALL] ROUTINE LOAD FOR <job_name>
```

## Required Parameters

**1. `<job_name>`**

> Specifies the name of the job to restart. If ALL is specified, job_name is not required.

## Optional Parameters

**1. `[ALL]`**

> Optional parameter. If ALL is specified, it indicates restarting all paused routine load jobs.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | SHOW ROUTINE LOAD requires LOAD privilege on the table |

## Notes

- Only jobs in PAUSED state can be restarted
- Restarted jobs will continue consuming data from the last consumed position
- If a job has been paused for too long, the restart may fail due to expired Kafka data

## Examples

- Restart a routine load job named test1.

   ```sql
   RESUME ROUTINE LOAD FOR test1;
   ```

- Restart all routine load jobs.

   ```sql
   RESUME ALL ROUTINE LOAD;
   ```