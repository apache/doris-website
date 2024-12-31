---
{
"title": "ICEBERG_META",
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

## hudi_meta

### Name

hudi_meta

### description

hudi_meta table-valued-function(tvf), Use for read hudi metadata, operation history, timeline of table, instant state etc.

#### syntax

```sql
hudi_meta(
  "table" = "ctl.db.tbl", 
  "query_type" = "timeline"
  ...
  );
```

**parameter description**

Each parameter in hudi_meta tvf is a pair of `"key"="value"`.

Related parameters:
- `table`： (required) Use hudi table name the format `catlog.database.table`.
- `query_type`： (required) The type of hudi metadata. Only `timeline` is currently supported.

### Example

Read and access the hudi tabular metadata for timeline.

```sql
select * from hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");

```

Can be used with `desc function` :

```sql
desc function hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");
```

### Keywords

    hudi_meta, table-valued-function, tvf

### Best Prac

Inspect the hudi table timeline :

```sql
select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline");
+-------------------+--------+--------------------------+-----------+-----------------------+
| timestamp         | action | file_name                | state     | state_transition_time |
+-------------------+--------+--------------------------+-----------+-----------------------+
| 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
| 20240724195845718 | commit | 20240724195845718.commit | COMPLETED | 20240724195846653     |
| 20240724195848377 | commit | 20240724195848377.commit | COMPLETED | 20240724195849337     |
| 20240724195850799 | commit | 20240724195850799.commit | COMPLETED | 20240724195851676     |
+-------------------+--------+--------------------------+-----------+-----------------------+
```

Filtered by timestamp :

```sql
select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline") 
where timestamp = 20240724195843565;
+-------------------+--------+--------------------------+-----------+-----------------------+
| timestamp         | action | file_name                | state     | state_transition_time |
+-------------------+--------+--------------------------+-----------+-----------------------+
| 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
+-------------------+--------+--------------------------+-----------+-----------------------+
```
