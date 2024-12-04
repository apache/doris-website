---
{
    "title": "KILL ANALYZE JOB",
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

Stop the statistical information collection job that is being executed in the background.

## Syntax

```sql
KILL ANALYZE <job_id>
```
## Required Parameters

**<job_id>**

> Specifies the id of the job. You can obtain the job_id of the job by using SHOW ANALYZE. For detailed usage, please refer to the "SHOW ANALYZE" chapter.

## Optional Parameters

None

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege (Privilege) | Object (Object) | Notes (Notes) |
| --------------------- | --------------- | ------------- |
| SELECT_PRIV           | Table           |               |

## Usage Notes

Jobs that have already been executed cannot be stopped.

## Examples

Stop the statistical information job record with an id of 10036

```sql
kill analyze 10036
```