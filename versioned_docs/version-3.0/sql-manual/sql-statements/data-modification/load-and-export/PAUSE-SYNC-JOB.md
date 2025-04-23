---
{
    "title": "PAUSE SYNC JOB",
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

Pause a running resident data synchronization job in a database identified by `job_name`. The suspended job will stop synchronizing data while retaining its latest consumption position until it is resumed by the user.

## Syntax

```sql
PAUSE SYNC JOB [<db>.]<job_name>
```

## Required Parameters

**1. `<job_name>`**

> Specifies the name of the synchronization job to be paused.  

## Optional Parameters
**1. `<db>`**
> If a database is specified using the `[<db>.]` prefix, the job is located in that database; otherwise, the current database is used.

## Access Control Requirements  

Any user or role can perform this operation.

## Example

1. Pause the data synchronization job named `job_name`.

   ```sql
   PAUSE SYNC JOB `job_name`;
   ```
