---
{
    "title": "Release 1.1.3",
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


In this release, Doris Team has fixed more than 80 issues or performance improvement since 1.1.2. This release is a bugfix release on 1.1 and all users are encouraged to upgrade to this release.
Translated with www.DeepL.com/Translator (free version)


# Features

- Support escape identifiers for sqlserver and postgresql in ODBC table.

- Could use Parquet as output file format.

# Improvements

- Optimize flush policy to avoid small segments. [#12706](https://github.com/apache/doris/pull/12706) [#12716](https://github.com/apache/doris/pull/12716)

- Refactor runtime filter to reduce the prepare time. [#13127](https://github.com/apache/doris/pull/13127)

- Lots of memory control related issues during query or load process. [#12682](https://github.com/apache/doris/pull/12682) [#12688](https://github.com/apache/doris/pull/12688) [#12708](https://github.com/apache/doris/pull/12708) [#12776](https://github.com/apache/doris/pull/12776) [#12782](https://github.com/apache/doris/pull/12782) [#12791](https://github.com/apache/doris/pull/12791) [#12794](https://github.com/apache/doris/pull/12794) [#12820](https://github.com/apache/doris/pull/12820) [#12932](https://github.com/apache/doris/pull/12932) [#12954](https://github.com/apache/doris/pull/12954) [#12951](https://github.com/apache/doris/pull/12951)

# BugFix

- Core dump on compaction with largeint. [#10094](https://github.com/apache/doris/pull/10094)

- Grouping sets cause be core or return wrong results. [#12313](https://github.com/apache/doris/pull/12313)

- PREAGGREGATION flag in orthogonal_bitmap_union_count operator is wrong. [#12581](https://github.com/apache/doris/pull/12581)

- Level1Iterator should release iterators in heap and it may cause memory leak. [#12592](https://github.com/apache/doris/pull/12592)

- Fix decommission failure with 2 BEs and existing colocation table. [#12644](https://github.com/apache/doris/pull/12644)

- BE may core dump because of stack-buffer-overflow when TBrokerOpenReaderResponse too large. [#12658](https://github.com/apache/doris/pull/12658)

- BE may OOM during load when error code -238 occurs. [#12666](https://github.com/apache/doris/pull/12666)

- Fix wrong child expression of lead function. [#12587](https://github.com/apache/doris/pull/12587)

- Fix intersect query failed in row storage code. [#12712](https://github.com/apache/doris/pull/12712)

- Fix wrong result produced by curdate()/current_date() function. [#12720](https://github.com/apache/doris/pull/12720)

- Fix lateral view explode_split with temp table bug. [#13643](https://github.com/apache/doris/pull/13643)

- Bucket shuffle join plan is wrong in two same table. [#12930](https://github.com/apache/doris/pull/12930)

- Fix bug that tablet version may be wrong when doing alter and load. [#13070](https://github.com/apache/doris/pull/13070)

- BE core when load data using broker with md5sum()/sm3sum(). [#13009](https://github.com/apache/doris/pull/13009)

# Behavior Changes

Disable PageCache and ChunkAllocator by default to reduce memory usage. User could enable this by `changing disable_storage_page_cache` and chunk_reserved_bytes_limit.


