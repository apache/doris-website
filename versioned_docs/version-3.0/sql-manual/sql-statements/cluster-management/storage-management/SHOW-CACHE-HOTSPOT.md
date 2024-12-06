---
{
    "title": "SHOW CACHE HOTSPOT",
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

This statement is used to display the hotspot information of file cache.

## Syntax

```sql
   SHOW CACHE HOTSPOT '/[compute_group_name/table_name]';
```

## Parameters

1. compute_group_name : Name of compute group.
2. table_name : Name of table.

## Example

1. View the table creation statement of a table

    ```sql
    SHOW CACHE HOTSPOT '/';
    ```

## Related Commands

 - [WARMUP CACHE](../Database-Administration-Statements/WARM-UP-COMPUTE-GROUP.md)

## References

 - [MANAGING FILE CACHE](../../../compute-storage-decoupled/file-cache.md)

## Keywords

    SHOW, CACHE, HOTSPOT

