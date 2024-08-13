---
{
    "title": "内存管理特性",
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

这篇文档将介绍一些 Doris 在内存管理上的特性，帮助更好的分析内存问题。

Apache Doris 作为基于 MPP 架构的 OLAP 数据库，数据从磁盘加载到内存后，会在算子间流式传递并计算，在内存中存储计算的中间结果，这种方式减少了频繁的磁盘 I/O 操作，充分利用多机多核的并行计算能力，可在性能上呈现巨大优势。

在面临内存资源消耗巨大的复杂计算和大规模作业时，有效的内存分配、统计、管控对于系统的稳定性起着十分关键的作用——更快的内存分配速度将有效提升查询性能，通过对内存的分配、跟踪与限制可以保证不存在内存热点，及时准确地响应内存不足并尽可能规避 OOM 和查询失败，这一系列机制都将显著提高系统稳定性；同时更精确的内存统计，也是大查询落盘的基础。

## Doris 内存数据结构

查询执行过程中大块内存的分配主要使用 Arena、HashTable、PODArray 这三个数据结构管理。

### Arena

Arena 是一个内存池，维护一个内存块列表，并从中分配内存以响应 alloc 请求，从而减少从系统申请内存的次数以提升性能，内存块被称为 Chunk，在内存池的整个生命周期内存在，在析构时统一释放，这通常和查询生命周期相同，并支持内存对齐，主要用于保存 Shuffle 过程中序列化/反序列化数据、HashTable 中序列化 Key 等。

Chunk 初始 4096 字节，内部使用游标记录分配过的内存位置，如果当前 Chunk 剩余大小无法满足当前内存申请，则申请一个新的 Chunk 添加到列表中，为减少从系统申请内存的次数，在当前 Chunk 小于 128M 时，每次新申请的 Chunk 大小加倍，在当前 Chunk 大于 128M 时，新申请的 Chunk 大小在满足本次内存申请的前提下至多额外分配 128M，避免浪费过多内存，默认之前的 Chunk 不会再参与后续 alloc。

### HashTable

Doris 中的 HashTable 主要在 Hash Join、聚合、集合运算、窗口函数中应用，主要使用的 PartitionedHashTable 最多包含 16 个子 HashTable，支持两个 HashTable 的并行化合并，每个子 Hash Join 独立扩容，预期可减少总内存的使用，扩容期间的延迟也将被分摊。

在 HashTable 小于 8M 时将以 4 的倍数扩容，在 HashTable 大于 8M 时将以 2 的倍数扩容，在 HashTable 小于 2G 时扩容因子为 50%，即在 HashTable 被填充到 50% 时触发扩容，在 HashTable 大于 2G 后扩容因子被调整为 75%，为了避免浪费过多内存，在构建 HashTable 前通常会依据数据量预扩容。此外 Doris 为不同场景设计了不同的 HashTable，比如聚合场景使用 PHmap 优化并发性能。

### PODArray

PODArray 是一个 POD 类型的动态数组，与 std::vector 的区别在于不会初始化元素，支持部分 std::vector 的接口，同样支持内存对齐并以 2 的倍数扩容，PODArray 析构时不会调用每个元素的析构函数，而是直接释放掉整块内存，主要用于保存 String 等 Column 中的数据，此外在函数计算和表达式过滤中也被大量使用。

## Doris Allocator

![Memory Management Overview](/images/memory-management-overview.png)

Allocator 作为系统中大块内存申请的统一入口，从系统申请内存，并在申请过程中使用 MemTracker 跟踪内存申请和释放的大小，执行算子所需批量申请的大内存将交由不同的数据结构管理，并在合适的时机干预限制内存分配的过程，确保内存申请的高效可控。

早期 Apache Doris 内存分配的核心理念是尽可能接管系统内存自己管理，使用通用的全局缓存满足大内存申请的性能要求，并在 LRU Cache 中缓存 Data Page、Index Page、RowSet Segment、Segment Index 等数据。

随着 Doris 使用 Jemalloc 替换 TCMalloc，Jemalloc 的并发性能已足够优秀，所以不在 Doris 内部继续全面接管系统内存，转而针对内存热点位置的特点，使用多种内存数据结构并接入统一的系统内存接口，实现内存统一管理和局部的内存复用。

![Memory Allocator](/images/memory-allocator.png)

Allocator 作为 Arena、PODArray、HashTable 的统一内存接口，对大于 64M 的内存使用 MMAP 申请，并通过预取加速性能，对小于 4K 的内存直接 malloc/free 从系统申请，对大于 4K 小于 64M 的内存，使用一个通用的缓存 ChunkAllocator 加速，在 Benchmark 测试中这可带来 10% 的性能提升，ChunkAllocator 会优先从当前 Core 的 FreeList 中无锁的获取一个指定大小的 Chunk，若不存在则有锁的从其他 Core 的 FreeList 中获取，若仍不存在则从系统申请指定内存大小封装为 Chunk 后返回。

Allocator 使用通用内存分配器申请内存，在 Jemalloc 和 TCMalloc 的选择上，Doris 之前在高并发测试时 TCMalloc 中 CentralFreeList 的 Spin Lock 能占到查询总耗时的 40%，虽然关闭 aggressive memory decommit 能有效提升性能，但这会浪费非常多的内存，为此不得不单独用一个线程定期回收 TCMalloc 的缓存。Jemalloc 在高并发下性能优于 TCMalloc 且成熟稳定，在 Doris 1.2.2 版本中我们切换为 Jemalloc，调优后在大多数场景下性能和 TCMalloc 持平，并使用更少的内存，高并发场景的性能也有明显提升。

## 内存复用

Doris 在执行层做了大量内存复用，可见的内存热点基本都被屏蔽。比如对数据块 Block 的复用贯穿 Query 执行的始终；比如 Shuffle 的 Sender 端始终保持一个 Block 接收数据，一个 Block 在 RPC 传输中，两个 Block 交替使用；还有存储层在读一个 Tablet 时复用谓词列循环读数、过滤、拷贝到上层 Block、Clear；导入 Aggregate Key 表时缓存数据的 MemTable 到达一定大小预聚合收缩后继续写入等等。

此外 Doris 会在数据 Scan 开始前依据 Scanner 个数和线程数预分配一批 Free Block，每次调度 Scanner 时会从中获取一个 Block 并传递到存储层读取数据，读取完成后会将 Block 放到生产者队列中，供上层算子消费并进行后续计算，上层算子将数据拷走后会将 Block 重新放回 Free Block 中，用于下次 Scanner 调度，从而实现内存复用，数据 Scan 完成后 Free Block 会在之前预分配的线程统一释放，避免内存申请和释放不在同一个线程而导致的额外开销，Free Block 的个数一定程度上还控制着数据 Scan 的并发。

## 内存限制和水位线计算方法

- 进程内存上限 MemLimit = `be.conf/mem_limit * PhysicalMemory`, 默认系统总内存的 90%。

- 进程内存软限 SoftMemLimit = `be.conf/mem_limit * PhysicalMemory * be.conf/soft_mem_limit_frac`, 默认系统总内存的 81%。

- 系统剩余可用内存低水位线 LowWaterMark = `Max(a, b, c)`, 在 64G 内存的机器上 LowWaterMark 默认略小于 3.2 GB, 其中 `a = PhysicalMemory - MemLimit`; `b = PhysicalMemory * 0.05`; `c = be.conf/max_sys_mem_available_low_water_mark_bytes`, 默认 6.4 GB。

- 系统剩余可用内存警告水位线 WarningWaterMark = `2 * LowWaterMark` ，在 64G 内存的机器上 `WarningWaterMark` 默认略小于 6.4 GB。

## 内存 GC

Doris BE 会定时从系统获取进程的物理内存和系统当前剩余可用内存，并收集所有查询、导入、Compaction 任务 MemTracker 的快照，当 BE 进程内存超限或系统剩余可用内存不足时，Doris 将释放 Cache 和终止部分查询或导入来释放内存，这个过程由一个单独的 GC 线程定时执行。

![Memory GC](/images/memory-gc.png)


若 Doris BE 进程内存超过 SoftMemLimit（默认系统总内存的 81%）或系统剩余可用内存低于 Warning 水位线（通常不大于 3.2GB）时触发 Minor GC，此时查询会在 Allocator 分配内存时暂停，同时导入强制下刷缓存中的数据，并释放部分 Data Page Cache 以及过期的 Segment Cache 等，若释放的内存不足进程内存的 10%，若启用了查询内存超发，则从内存超发比例大的查询开始 Cancel，直到释放 10% 的进程内存或没有查询可被 Cancel，然后调低系统内存状态获取间隔和 GC 间隔，其他查询在发现剩余内存后将继续执行。

若 BE 进程内存超过 MemLimit（默认系统总内存的 90%）或系统剩余可用内存低于 Low 水位线（通常不大于 1.6GB）时触发 Full GC，此时除上述操作外，导入在强制下刷缓存数据时也将暂停，并释放全部 Data Page Cache 和大部分其他 Cache，如果释放的内存不足 20%，将开始按一定策略在所有查询和导入的 MemTracker 列表中查找，依次 Cancel 内存占用大的查询、内存超发比例大的导入、内存占用大的导入，直到释放 20% 的进程内存后，调高系统内存状态获取间隔和 GC 间隔，其他查询和导入也将继续执行，GC 的耗时通常在几百 us 到几十 ms 之间。

## 系统剩余可用内存计算

当错误信息中系统可用内存小于低水位线时，同样当作进程内存超限处理，其中系统可用内存的值来自于`/proc/meminfo`中的`MemAvailable`，当`MemAvailable`不足时继续内存申请可能返回 std::bad_alloc 或者导致 BE 进程 OOM，因为刷新进程内存统计和 BE 内存 GC 都具有一定的滞后性，所以预留小部分内存 buffer 作为低水位线，尽可能避免 OOM。

其中`MemAvailable`是操作系统综合考虑当前空闲的内存、buffer、cache、内存碎片等因素给出的一个在尽可能不触发 swap 的情况下可以提供给用户进程使用的内存总量，一个简单的计算公式：`MemAvailable = MemFree - LowWaterMark + (PageCache - min(PageCache / 2, LowWaterMark))`，和 cmd `free`看到的`available`值相同，具体可参考：

[why-is-memavailable-a-lot-less-than-memfreebufferscached](https://serverfault.com/questions/940196/why-is-memavailable-a-lot-less-than-memfreebufferscached)

[Linux MemAvailable](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=34e431b0ae398fc54ea69ff85ec700722c9da773)

低水位线默认最大 3.2G（2.1.5 之前默认 1.6G），根据 `MemTotal`、`vm/min_free_kbytes`、`confg::mem_limit`、`config::max_sys_mem_available_low_water_mark_bytes`共同算出，并避免浪费过多内存。其中`MemTotal`是系统总内存，取值同样来自`/proc/meminfo`；`vm/min_free_kbytes`是操作系统给内存 GC 过程预留的 buffer，取值通常在 0.4% 到 5% 之间，某些云服务器上`vm/min_free_kbytes`可能为 5%，这会导致直观上系统可用内存比真实值少；调大`config::max_sys_mem_available_low_water_mark_bytes`将在大于 64G 内存的机器上，为 Full GC 预留更多的内存 buffer，反之调小将尽可能充分使用内存。
