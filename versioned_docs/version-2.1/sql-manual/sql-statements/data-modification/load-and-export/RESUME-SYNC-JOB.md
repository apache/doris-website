---
{
    "title": "RESUME SYNC JOB",
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

Resume a resident data synchronization job that has been suspended in a database by its `job_name`. Once resumed, the job continues to synchronize data starting from the latest position before the suspension.

## Syntax

```sql
RESUME SYNC JOB [<db>.]<job_name>
```

## Required Parameters

**1. `<job_name>`**

> Specifies the name of the data synchronization job to be resumed.  

## Optional Parameters
**1. `<db>`**
> If a database is specified using the `[<db>.]` prefix, the job is located in that database; otherwise, the current database is used.

## Access Control Requirements  

Any user or role can perform this operation.


## Examples

1. Resume the data synchronization job named `job_name`.

   ```sql
   RESUME SYNC JOB `job_name`;
   ```
