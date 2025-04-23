---
{
    "title": "STOP ROUTINE LOAD",
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

This syntax is used to stop a Routine Load job. Unlike the PAUSE command, stopped jobs cannot be restarted. If you need to import data again, you'll need to create a new import job.

## Syntax

```sql
STOP ROUTINE LOAD FOR <job_name>;
```

## Required Parameters

**1. `<job_name>`**

> Specifies the name of the job to stop. It can be in the following formats:
>
> - `<job_name>`: Stop a job with the specified name in the current database
> - `<db_name>.<job_name>`: Stop a job with the specified name in the specified database

## Access Control Requirements

Users executing this SQL command must have at least the following permission:

| Privilege  | Object | Notes                                                    |
| :--------- | :----- | :------------------------------------------------------- |
| LOAD_PRIV  | Table  | SHOW ROUTINE LOAD requires LOAD permission on the table |

## Notes

- The stop operation is irreversible; stopped jobs cannot be restarted using the RESUME command
- The stop operation takes effect immediately, and running tasks will be interrupted
- It's recommended to check the job status using the SHOW ROUTINE LOAD command before stopping a job
- If you only want to temporarily pause a job, use the PAUSE command instead

## Examples

- Stop a routine load job named test1

   ```sql
   STOP ROUTINE LOAD FOR test1;
   ```

- Stop a routine load job in a specified database

   ```sql
   STOP ROUTINE LOAD FOR example_db.test1;
   ```