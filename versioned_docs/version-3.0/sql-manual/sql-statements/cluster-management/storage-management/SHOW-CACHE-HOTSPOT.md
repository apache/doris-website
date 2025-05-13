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

This statement is used to display the hotspot information of the file cache.

:::info Note

Before version 3.0.4, you could use the `SHOW CACHE HOTSPOT` statement to query cache hotspot information statistics. Starting from version 3.0.4, the use of the `SHOW CACHE HOTSPOT` statement for cache hotspot information statistics is no longer supported. Please directly access the system table `__internal_schema.cloud_cache_hotspot` for queries. For detailed usage, refer to [MANAGING FILE CACHE](../../../../compute-storage-decoupled/file-cache). 



## Syntax


```sql
   SHOW CACHE HOTSPOT '/[<compute_group_name>/<db.table_name>]';
```

## Parameters

| Parameter Name	                  | Description                                                         |
|---------------------------|--------------------------------------------------------------|
| <compute_group_name>        | The name of the compute group.                                               |
| <table_name>                | The name of the table.                                                   |
## Examples

1. Display cache hot spot information for the entire system:

```sql
SHOW CACHE HOTSPOT '/';
```

2. Display cache hot spot information for a specific compute group my_compute_group:

```sql
SHOW CACHE HOTSPOT '/my_compute_group/';
```

## References


- [WARMUP CACHE](../storage-management/WARM-UP.md)
- [MANAGING FILE CACHE](../../../../compute-storage-decoupled/file-cache)
