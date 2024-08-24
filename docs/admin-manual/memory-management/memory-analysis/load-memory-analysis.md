---
{
    "title": "Load Memory Analysis",
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

Doris data import is divided into two stages: fragment reading and channel writing. The execution logic of fragment and query fragment is the same, but Stream Load usually has only Scan Operator. Channel mainly writes data to the temporary data structure Memtable, and then Delta Writer compresses the data and writes it to the file.

## Import memory view

If you see a large value of `Label=load, Type=overview` Memory Tracker anywhere, it means that the imported memory is used a lot.

```
MemTrackerLimiter Label=load, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

The memory imported by Doris is divided into two parts. The first part is the memory used by fragment execution, and the second part is the memory used in the construction and flushing process of MemTable.

The Memory Tracker with `Label=AllMemTableMemory, Parent Label=DetailsTrackerSet` found in the BE web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` is the memory used by all import tasks to construct and flush `MemTable` on this BE node. When the error process memory exceeds the limit or the available memory is insufficient, this Memory Tracker can also be found in the `Memory Tracker Summary` in the `be.INFO` log.

```
MemTracker Label=AllMemTableMemory, Parent Label=DetailsTrackerSet, Used=25.08 MB(26303456 B), Peak=25.08 MB(26303456 B)
```

## Import memory analysis

If the value of ``Label=AllMemTableMemory` is small, the main memory used by the import task is the execution fragment. The analysis method is the same as [Query Memory Analysis](./query-memory-analysis.md), so it will not be repeated here.

If the value of `Label=AllMemTableMemory` is large, MemTable may not be flushed in time. You can consider reducing the values ​​of `load_process_max_memory_limit_percent` and `load_process_soft_mem_limit_percent` in `be.conf`. This can make MemTable flush more frequently, so that fewer MemTables are cached in memory, but the number of files written will increase. If too many small files are written, the pressure of compaction will increase. If compaction is not timely, the metadata memory will increase, the query will slow down, and even the import will report an error after the number of files exceeds the limit.

During the import execution process, check the BE web page `/mem_tracker?type=load`. According to the values ​​of the two groups of memory trackers `Label=MemTableManualInsert` and `Label=MemTableHookFlush`, you can locate `LoadID` and `TabletID` with large `MemTable` memory usage.
