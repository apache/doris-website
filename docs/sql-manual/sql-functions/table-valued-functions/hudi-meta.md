---
{
"title": "HUDI_META",
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

`hudi_meta` table-valued-function(tvf), using for read hudi metadata, operation history, timeline of table, instant state etc.

Supported since 3.1.0.

## Syntax

```sql
HUDI_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## Required Parameters
Each parameter in the `hudi_meta` table function (tvf) is a `"key"="value"` pair.

| Field        | Description                                                                                                                        |
|--------------|------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`    | The full table name, which must be specified in the format of `database_name.table_name` for the hudi table that you want to view. |
| `<query_type>` | The type of metadata you want to view. Currently, only `timeline` is supported.                                                    |


## Examples

- Read and access the hudi tabular metadata for timeline.

    ```sql
    select * from hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");
    ```

- Can be used with `desc function` :
    
    ```sql
    desc function hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");
    ```

- Inspect the hudi table timeline
    
    ```sql
    select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline");
    ```
    ```text
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | timestamp         | action | file_name                | state     | state_transition_time |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
    | 20240724195845718 | commit | 20240724195845718.commit | COMPLETED | 20240724195846653     |
    | 20240724195848377 | commit | 20240724195848377.commit | COMPLETED | 20240724195849337     |
    | 20240724195850799 | commit | 20240724195850799.commit | COMPLETED | 20240724195851676     |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    ```

- Filtered by timestamp

    ```sql
    select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline") where timestamp = 20240724195843565;
    ```
    ```text
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | timestamp         | action | file_name                | state     | state_transition_time |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    ```
