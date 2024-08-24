---
{
    "title": "Metadata Memory Analysis",
    "language": "zh-CN"
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

The metadata of Doris BE in memory includes data structures such as `Tablet`, `Rowset`, `Segment`, `TabletSchema`, `ColumnReader`, `PrimaryKeyIndex`, and `BloomFilterIndex`. For more information about Doris BE metadata, refer to the document [Analysis of Doris Storage Structure Design](https://blog.csdn.net/ucanuup_/article/details/115004829).

## Metadata Viewing Method

Currently, Memory Tracker does not accurately count the metadata memory size of Doris BE. You can estimate the metadata memory size by viewing some counters in Doris BE Bvar and Doris BE Metrics, or use Heap Profile for further analysis.

### Doris BE Bvar

You can see some metadata-related indicators counted by Bvar on the web page `http://http://{be_host}:{brpc_port}/vars`.

```
- `doris_total_tablet_num`: The number of all tablets.
- `doris_total_rowset_num`: The number of all rowsets.
- `doris_total_segment_num`: The number of all open segments.
- `doris_total_tablet_schema_num`: The number of all tablet schemas.
- `tablet_schema_cache_count`: The number of cached tablet schemas.
- `tablet_meta_schema_columns_count`: The number of columns in all tablet schemas.
- `tablet_schema_cache_columns_count`: The number of cached columns in a tablet schema.
- `doris_column_reader_num`: The number of open column readers.
- `doris_column_reader_memory_bytes`: the number of bytes occupied by the opened Column Reader.
- `doris_ordinal_index_memory_bytes`: the number of bytes occupied by the opened Ordinal Index.
- `doris_zone_map_memory_bytes`: the number of bytes occupied by the opened ZoneMap Index.
- `doris_short_key_index_memory_bytes`: the number of bytes occupied by the opened Short Key Index.
- `doris_pk/index_reader_bytes`: the cumulative number of bytes occupied by the Primary Key Index Reader. This is not a real-time statistical value and is expected to be fixed.
- `doris_pk/index_reader_pages`: Same as above, the cumulative value of the statistics.
- `doris_pk/index_reader_cached_pages`: Same as above, the cumulative value of the statistics.
- `doris_pk/index_reader_pagindex_reader_pk_pageses`: Same as above, cumulative value of statistics.
- `doris_primary_key_index_memory_bytes`: Same as above, cumulative value of statistics.
```

### Doris BE Metrics

Web page `http://http://{be_host}:{be_web_server_port}/metrics` can see some metadata indicators in BE process memory monitoring (Metrics). Among them, Metadata Cache related indicators refer to [Doris Cache Memory Analysis](./doris-cache-memory-analysis.md).

```
- `doris_be_all_rowsets_num`: The number of all Rowsets.
- `doris_be_all_segments_num`: The number of all Segments.
```

### Use Heap Profile to analyze metadata memory

If the memory location cannot be accurately located using Doris BE Bvar and Metrics above, if the cluster can be easily restarted and the phenomenon can be reproduced, refer to [Heap Profile Memory Analysis](./heap-profile-memory-analysis.md) to analyze Metadata memory.

After the phenomenon is reproduced, if you see the `Tablet`, `Segment`, `TabletSchema`, and `ColumnReader` fields in the call stack with a large memory usage in Heap Profile, it can be basically confirmed that metadata occupies a large amount of memory.
