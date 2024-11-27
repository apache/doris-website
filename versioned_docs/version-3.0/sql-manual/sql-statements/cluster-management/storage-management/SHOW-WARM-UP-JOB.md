---
{
    "title": "SHOW WARM UP JOB",
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

The commands are used to display warm-up jobs in Doris.

## Syntax

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```

## Parameters

* id : id of the warm-up job.

## Example

1. View all warmup job

    ```sql
    SHOW WARM UP JOB;
    ```

2. View one warmup job with id = 13418

```sql
    SHOW WARM UP JOB WHERE id = 13418;
```

## Related Commands

 - [WARMUP COMPUTE GROUP](../Database-Administration-Statements/WARM-UP-COMPUTE-GROUP.md)

## References

 - [MANAGING FILE CACHE](../../../compute-storage-decoupled/file-cache.md)

## Keywords

    SHOW, CACHE, HOTSPOT, COMPUTE GROUP 

