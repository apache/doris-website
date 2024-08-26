---
{
    "title": "Global Memory Analysis",
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

GLobal Memory is Doris's globally shared memory, mainly including Cache and Metadata.

## Global Memory View Method

The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` displays all Memory Trackers of `type=global`.

![image](https://github.com/apache/doris/assets/13197424/e0b4a327-5bfb-4dfd-9e1e-bf58a482a456)

```
- Orphan: Collects memory that does not know where it belongs, and ideally it is expected to be equal to 0.
- DataPageCache\[size\](AllocByAllocator): The size of the data Page cache.
- IndexPageCache\[size\](AllocByAllocator): The size of the index cache of the data Page.
- PKIndexPageCache\[size\](AllocByAllocator): Primary key index of data Page.
- DetailsTrackerSet: Contains some memory that is not currently tracked accurately. These memories will not be counted in Global memory, including some Cache and metadata memory, etc. By default, only Memory Trackers with Peak Consumption not equal to 0 are displayed, mainly including the following:
- SegmentCache[size]: Caches the memory size of the opened Segment, such as index information.
- SchemaCache[number]: Caches the number of entries of Rowset Schema.
- TabletSchemaCache[number]: Caches the number of entries of Tablet Schema.
- TabletMeta(experimental): Memory size of all Tablet Schema.
- CreateTabletRRIdxCache[number]: Caches the number of entries of create tabelt index.
- PageNoCache: If page cache is turned off, this Memory Trakcer will track the sum of all page memory used by all Queries.
- IOBufBlockMemory: The total IOBuf memory used by BRPC.
- PointQueryLookupConnectionCache[number]: The number of cached Point Query Lookup Connection entries.
- AllMemTableMemory: The total Memtable memory of all loads cached in memory waiting to be flushed.
- MowTabletVersionCache[number]: The number of cached Mow Tablet Version entries.
- MowDeleteBitmapAggCache[size]: The cached Mow DeleteBitmap memory size.
- SegCompaction: The total memory allocated from `Doris Allocator` by all SegCompaction tasks.
- PointQueryExecutor: Some memory shared by all Point Queries.
- BlockCompression: Some memory used in the decompression process shared by all Queries.
- RowIdStorageReader: All Multiget Data requests use memory in RowIdStorageReader.
- SubcolumnsTree: Some memory used by Point Query in SubcolumnsTree.
- S3FileBuffer: Memory allocated by the File Buffer when reading S3.
```

Some of the Memory Tracker tags have suffixes, which mean:

- `[size]` means that the Cache Tracker records the memory size.

- `[number]` means that the Cache Tracker records the number of cached entries, which is usually because the memory cannot be accurately counted at present.

- `(AllocByAllocator)` means that the Tracker value is tracked by Doris Allocator.

- `(experimental)` means that this Memory Tracker is still experimental and the value may not be accurate.

## Global Memory occupies a lot

```
MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
```

The value of Global Memory Tracker `Label=global, Type=overview` is equal to the sum of all Memory Trackers with `Type=global` and `Parent Label != DetailsTrackerSet`, mainly including Cache and metadata, which are shared between different tasks.

### Cache analysis method

Refer to [Doris Cache Memory Analysis](./doris-cache-memory-analysis.md)

### Metadata analysis method

Refer to [Metadata Memory Analysis](./metadata-memory-analysis.md)

### Orphan analysis method

If the Orphan Memory Tracker value is too large, it means that the Memory Tracker statistics are missing. Refer to the analysis in [Memory Tracker Statistics Missing] in [Memory Tracker](./../memory-feature/memory-tracker.md).
