---
{
  "title": "Apache Doris 存储层设计(三)之读取流程、Compaction流程分析",
  "description": "文章详细介绍了数据写入过程中 Doris 系统内部实现流程，以及 Doris 对数据按条件删除和按 key 批量删除的实现流程.",
  "date": "2022-05-20",
  "metaTitle": "Apache Doris 存储层设计(三)之读取流程、Compaction流程分析",
  "isArticle": true,
  "language": "zh-CN",
  "author": "ApacheDoris",
  "layout": "Article",
  "sidebar": false,
  "categories": "DorisInternals",
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

# Apache Doris 存储层设计(三)之读取流程、Compaction 流程分析

## 1 整体介绍

Doris 是基于 MPP 架构的交互式 SQL 数据仓库，主要用于解决近实时的报表和多维分析。Doris 高效的导入、查询离不开其存储结构精巧的设计。

本文主要通过阅读 Doris BE 模块代码，详细分析了 Doris BE 模块存储层的实现原理，阐述和解密 Doris 高效的写入、查询能力背后的核心技术。其中包括 Doris 列存的设计、索引设计、数据读写流程、Compaction 流程等功能。本文为第三篇《Doris 存储层设计介绍 3——读取本文详细介绍了数据写入过程中 Doris 系统内部实现流程，以及 Doris 对数据按条件删除和按 key 批量删除的实现流程。

## 2 读取流程

### 2.1 整体读取流程

读取流程为写入的逆过程，但读取流程相对复杂些，主要因为进行大量的读取优化。整个读取流程分为两个阶段，一个是 init 流程，一个是获取 next_block 数据块的过程。具体过程如下图所示：

![img](/images/blogs/storage/74F6DA700653418B9828E27EEAACA8ED.png)

层级关系如下：

OlapScanner 对一个 tablet 数据读取操作整体的封装；

Reader 对读取的参数进行处理，并提供了按三种不同模型读取的差异化处理；

CollectIterator 包含了 tablet 中多个 RowsetReader，这些 RowsetReader 有版本顺序，CollectIterator 将这些 RowsetReader 归并 Merge 成统一的 Iterator 功能，提供了归并的比较器；

RowsetReader 则负责了对一个 Rowset 的读取；

RowwiseIterator 提供了一个 Rowset 中所有 Segment 的统一访问的 Iterator 功能。这里的归并策略可以根据数据排序的情况采用 Merge 或 Union；

SegmentIterator 对应了一个 Segment 的数据读取，Segment 的读取会根据查询条件与索引进行计算找到读取的对应行号信息，seek 到对应的 page，对数据进行读取。其中，经过过滤条件后会对可访问的行信息生成 bitmap 来记录，BitmapRangeIterator 为单独实现的可以按照范围访问这个 bitmap 的迭代器；

ColumnIterator 提供了对列的相关数据和索引统一访问的迭代器。ColumnReader、各个 IndexReader 等对应了具体的数据和索引信息的读取。

### 2.2 读取 Init 阶段的主要流程

初始化阶段的执行流程如下：

![img](/images/blogs/storage/61A2C6F0D26F4DECB3AEDF2A5F846790.png)

#### 2.2.1 OlapScanner 查询参数构造

根据查询指定的 version 版本查找出需要读取的 RowsetReader（依赖于版本管理的 rowset_graph 版本路径图，取得查询 version 范围的最短路径）；

1. 设置查询信息，包括\_tablet、读取类型 reader_type=READER_QUERY、是否进行聚合、\_version（从 0 到指定版本）；

2. 设置查询条件信息，包括 filter 过滤字段、is_nulls 字段；

3. 设置返回列信息；

4. 设置查询的 key_ranges 范围（key 的范围数组，可以通过 short key index 进行过滤）；

5. 初始化 Reader 对象。

### 2.2.2 Reader 的 Init 流程

1. 初始化 conditions 查询条件对象；

2. 初始化 bloomFilter 列集合（eq、in 条件，添加了 bloomFilter 的列）；

3. 初始化 delete_handler。包括了 tablet 中存在的所有删除信息，其中包括了版本和对应的删除条件数组；

4. 初始化传递给下层要读取返回的列，包括了返回值和条件对象中的列；

5. 初始化 key_ranges 的 start key、end key 对应的 RowCusor 行游标对象等；

6. 构建的信息设置 RowsetReader、CollectIterator。Rowset 对象进行初始化，将 RowsetReader 加入到 CollectIterator 中；

7. 调用 CollectIterator 获取当前行（这里其实为第一行），这里开启读取流程，第一次读取。

#### 2.2.3 RowsetReader 的 Init 流程

构建 SegmentIterator 并过滤掉 delete_handler 中比当前 Rowset 版本小的删除条件；

构建 RowwiseIterator（对 SegmentIterator 的聚合 iterator），将要读取的 SegmentIterator 加入到 RowwiseIterator。当所有 Segment 为整体有序时采用 union iterator 顺序读取的方式，否则采用 merge iterator 归并读取的方式。

#### 2.2.4 Segmentlterator 的 Init 流程

1. 初始化 ReadableBlock，用来读取当前的 Segment 文件的对象，实际读取文件；

2. 初始化\_row_bitmap，用来存储通过索引过滤后的行号，使用 bitmap 结构；

3. 构建 ColumnIterator，这里仅是需要读取列；

如果 Column 有 BitmapIndex 索引，初始化每个 Column 的 BitmapIndexIterator；

通过 SortkeyIndex 索引过滤数据。当查询存在 key_ranges 时，通过 key_range 获取命中数据的行号范围。步骤如下：（1）根据每一个 key_range 的上、下 key，通过 Segment 的 SortkeyIndex 索引找到对应行号 upper_rowid，lower_rowid，然后将得到的 RowRanges 合并到 row_bitmap 中；

通过各种索引按条件过滤数据。条件包括查询条件和删除条件过滤信息。

- 按查询条件，对条件中含有 bitmap 索引的列，使用 bitmap 索引进行过滤，查询出存在数据的行号列表与 row_bitmap 求交。因为是精确过滤，将过滤的条件从 Condition 对象中删除。
- 按查询条件中的等值（eq，in，is）条件，使用 BloomFilter 索引过滤数据。这里会判断当前条件能否命中 Page，将这个 Page 的行号范围与 row_bitmap 求交。
- 按查询条件和删除条件，使用 ZoneMapIndex 过滤数据，与 ZoneMap 每个 Page 的索引求交，找到符合条件的 Page。ZoneMapIndex 索引匹配到的行号范围与 row_bitmap 求交。

使用 row_bitmap 构造 BitmapRangerInterator 迭代器，用于后续读取数据。

### 2.3 读取 next 阶段的主要流程

next 阶段的执行流程如下：

![img](/images/blogs/storage/9A6C9C92717B44D5967EF36578B01920.png)

#### 2.3.1 Reader 读取 next_row_with_aggregation

在 reader 读取时预先读取一行，记录为当前行。在被调用 next 返回结果时会返回当前行，然后再预先读取下一行作为新的当前行。

reader 的读取会根据模型的类型分为三种情况

\_dup_key_next_row 读取（明细数据模型）下，返回当前行，再直接读取 CollectorIterator 读取 next 作为当前行；

\_agg_key_next_row 读取（聚合模型）下，取 CollectorIterator 读取 next 之后，判断下一行是否与当前行的 key 相同，相同时则进行聚合计算，循环读取下一行；不相同则返回当前累计的聚合结果，更新当前行；

\_unique_key_next_row 读取（unique key 模型）下，与\_agg_key_next_row 模型方式逻辑相同，但存在一些差异。由于支持了删除操作，会查看聚合后的当前行是否标记为删除行。如果为删除行舍弃数据，直到找到一个不为删除行的数据才进行返回。

#### 2.3.2 CollectIterator 读取 next

CollectIterator 中使用 heap 数据结构维护了要读取 RowsetReader 集合，比较规则如下：按照各个 RowsetReader 当前行的 key 的顺序，当 key 相同时比较 Rowset 的版本。

CollectIterator 从 heap 中 pop 出上一个最大的 RowsetReader；

为刚 pop 出的 RowsetReader 再读取下一个新的 row 作为 RowsetReader 的当前行并再放入 heap 中进行比较。读取过程中调用 RowsetReader 的 nextBlock 按 RowBlock 读取。（如果当前取到的块是部分删除的 page，还要对当前行按删除条件对行进行过滤。）

取队列的 top 的 RowsetReader 的当前行，作为当前行返回。

#### 2.3.3 RowsetReader 读取 next

RowsetReader 直接读取了 RowwiseIterator 的 next_batch；

RowwiseIterator 整合了 SegmentIterator。当 Rowset 中的 Segment 整体有序时直接按 Union 方式迭代返回。当无序时按 Merge 归并方式返回。RowwiseIterator 同样返回了当前最大的 SegmentIterator 的行数据，每次会调用 SegmentIterator 的 next_batch 获取数据。

#### 2.3.4 SegmentIterator 读取 next_batch

根据 init 阶段构造的 BitmapRangerInterator，使用 next_range 每次取出要读取的行号的一个范围 range_from、range_to；

先读取条件列从 range_from 到 range_to 行的数据。过程如下：

调用有条件列各个 columnIterator 的 seek_to_ordinal，各个列的读取位置 current_rowid 定位到 SegmentIterator 的 cur_rowid。这里是通过二分查 ordinal_index 对齐到对应的 data page。

读出条件列的数据。按条件再进行一次过滤（这次是精确的过滤）。

再读取无条件列的数据，放入到 Rowblock 中，返回 Rowblock。

## 3 Compaction 流程

### 3.1 Compaction 整体介绍

Doris 通过 Compaction 将增量聚合 Rowset 文件提升性能，Rowset 的版本信息中设计了有两个字段 first、second 来表示 Rowset 合并后的版本范围。当未合并的 cumulative rowset 的版本 first 和 second 相等。Compaction 时相邻的 Rowset 会进行合并，生成一个新的 Rowset，版本信息的 first，second 也会进行合并，变成一个更大范围的版本。另一方面，compaction 流程大大减少 rowset 文件数量，提升查询效率。

![img](/images/blogs/storage/42A6FA7E0D8E457E9398CE3314427F5D.png)

如上图所示，Compaction 任务分为两种，base compaction 和 cumulative compaction。cumulative_point 是分割两种策略关键。

可以这样理解，cumulative_point 右边是从未合并过的增量 Rowset，其每个 Rowset 的 first 与 second 版本相等；cumulative_point 左边是合并过的 Rowset，first 版本与 second 版本不等。base compaction 和 cumulative compaction 任务流程基本一致，差异仅在选取要合并的 InputRowset 逻辑有所不同。

### 3.2 Compaction 详细流程

Compaction 合并整体流程如下图所示：

![img](/images/blogs/storage/FA319E53B7D0444F986A8DBC8DF4273A.png)

#### 3.2.1 计算 cumulative_point

选择 compaction 的需要合并的 InputRowsets 集合：

base compaction 选取条件：

1. 当存在大于 5 个的非 cumulative 的 rowset，将所有非 cumulative 的 rowset 进行合并；

2. 版本 first 为 0 的 base rowset 与其他非 cumulative 的磁盘比例小于 10:3 时，合并所有非 cumulative 的 rowset 进行合并；

3. 其他情况，不进行合并。

cumulative compaction 选取条件：

1. 选出 Rowset 集合的 segment 数量需要大于等于 5 并且小于等于 1000（可配置），进行合并； 2.
2. 当输出 Rowset 数量小于 5 时，但存在删除条件版本大于 Rowset second 版本时，进行合并（让删除的 Rowset 快速合并进来）；
3. 当累计的 base compaction 和 cumulative compaction 都时间大于 1 天时，进行合并；
4. 其他情况不合并。

#### 3.2.2 执行 compaction

Compaction 执行基本可以理解为读取流程加写入流程。这里会将待合并的 inputRowsets 开启 Reader，然后通过 next_row_with_aggregation 读取记录。写入到输出的 RowsetWriter 中，生产新的 OutputRowset，这个 Rowset 的版本为 InputRowsets 版本全集范围。

#### 3.2.3 更新 cumulative_point

更新 cumulative_point，将 cumulative compaction 的产出的 OutputRowset 交给后续的 base compaction 流程。

Compaction 后对于 aggregation key 模型和 unique key 模型分散在不同 Rowset 但相同 key 的数据进行合并，达到了预计算的效果。同时减少了 Rowset 文件数量，提升了查询效率。

## 4 总结

本文详细介绍了 Doris 系统底层存储层的读取相关流程。

读取流程依赖于完全的列存实现，对于 OLAP 的宽表场景（读取大量行，少量列）能够快速扫描，基于多种索引功能进行过滤（包括 short key、bloom filter、zoon map、bitmap 等），能够跳过大量的数据扫描，还进行了延迟物化等优化，可以对应多种场景的数据分析；Compaction 执行流程同样做了分场景的优化。能够保证数据量接近的 Rowset 结合进行 compact，减少 IO 操作提升效率。
