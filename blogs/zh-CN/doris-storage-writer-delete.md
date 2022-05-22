---
{
    "title": "Apache Doris 存储层设计(二)之写入流程、删除流程分析",
    "description": "文章详细介绍了数据写入过程中 Doris 系统内部实现流程，以及 Doris 对数据按条件删除和按 key 批量删除的实现流程.",
    "date": "2022-05-20",
    "metaTitle": "Apache Doris 存储层设计(二)之写入流程、删除流程分析",
    "isArticle": true,
    "language": "zh-CN",
    "author": "ApacheDoris",
    "layout": "Article",
    "sidebar": false
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



## 1. 整体介绍

Doris 是基于 MPP 架构的交互式 SQL 数据仓库，主要用于解决近实时的报表和多维分析。Doris 高效的导入、查询离不开其存储结构精巧的设计。

本文主要通过阅读 Doris BE 模块代码，详细分析了 Doris BE 模块存储层的实现原理，阐述和解密 Doris 高效的写入、查询能力背后的核心技术。其中包括 Doris 列存的设计、索引设计、数据读写流程、Compaction 流程、Tablet 和 Rowset 的版本管理、数据备份等功能。

文章介绍了 Segment V2 版本的存储层结构，包括了有序存储、稀疏索引、前缀索引、位图索引、BloomFilter 等丰富功能，可以应对各种复杂的场景提供极速的查询能力。

本文详细介绍了数据写入过程中 Doris 系统内部实现流程，以及 Doris 对数据按条件删除和按 key 批量删除的实现流程

## 2 名词解释

- **FE：** Frontend，即 Doris 的前端节点。主要负责接收和返回客户端请求、元数据以及集群管理、查询计划生成等工作。
- **BE：** Backend，即 Doris 的后端节点。主要负责数据存储与管理、查询计划执行等工作。
- **Tablet：** Tablet 是一张表实际的物理存储单元，一张表按照分区和分桶后在 BE 构成分布式存储层中以 Tablet 为单位进行存储，每个 Tablet 包括元信息及若干个连续的 RowSet。
- **Rowset：** Rowset 是 Tablet 中一次数据变更的数据集合，数据变更包括了数据导入、删除、更新等。Rowset 按版本信息进行记录。每次变更会生成一个版本。
- **Version：** 由 Start、End 两个属性构成，维护数据变更的记录信息。通常用来表示 Rowset 的版本范围，在一次新导入后生成一个 Start，End 相等的 Rowset，在 Compaction 后生成一个带范围的 Rowset 版本。
- **Segment：** 表示 Rowset 中的数据分段。多个 Segment 构成一个 Rowset。
- **Compaction：** 连续版本的 Rowset 合并的过程称为 Compaction，合并过程中会对数据进行压缩操作。

## 3 写入流程

Doris 针对不同场景支持了多种形式的数据写入方式，其中包括了从其他存储源导入 Broker Load、http 同步数据导入 Stream Load、例行的 Routine Load 导入和 Insert Into 写入等。同时导入流程会涉及 FE 模块（主要负责导入规划生成和导入任务的调度工作）、BE 模块（主要负责数据的 ETL 和存储）、Broker 模块（提供 Doris 读取远端存储系统中文件的能力）。其中 Broker 模块仅在 Broker Load 类型的导入中应用。

下面以 Stream Load 写入为例子，描述了 Doris 的整体的数据写入流程如下图所示：

![img](/images/blogs/storage/04ebc864ee5fcc9f0e3c51347af5b8cf.png)

 流程描述如下：

1. FE 接收用户的写入请求，并随机选出 BE 作为 Coordinator BE。将用户的请求重定向到这个 BE 上。
2. Coordinator BE 负责接收用户的数据写入请求，同时请求 FE 生成执行计划并对调度、管理导入任务 LoadJob 和导入事务。
3. Coordinator BE 调度执行导入计划，执行对数据校验、清理之后。
4. 数据写入到 BE 的存储层中。在这个过程中会先写入到内存中，写满一定数据后按照存储层的数据格式写入到物理磁盘上。

本文主要介绍数据写入到 BE 存储层的详细流程。其余流程不在详细描述。

### 3.1 数据分发流程

数据在经过清洗过滤后，会通过 Open/AddBatch 请求分批量的将数据发送给存储层的 BE 节点上。在一个 BE 上支持多个 LoadJob 任务同时并发写入执行。LoadChannelMgr 负责管理了这些任务，并对数据进行分发。

数据分发和写入过程如下图所示：

![img](/images/blogs/storage/225e6c7dba4c85c30ab3d00c0519e24a.png)



1. 每次导入任务 LoadJob 会建立一个 LoadChannel 来执行，LoadChannel 维护了一次导入的通道，LoadChannel 可以将数据分批量写入操作直到导入完成。
2. LoadChannel 会创建一个 TabletsChannel 执行具体的导入操作。一个 TabletsChannel 对应多个 Tablet。一次数据批量写入操作中，TabletsChannel 将数据分发给对应 Tablet，由 DeltaWriter 将数据写入到 Tablet，便开始了真正的写入操作。

### 3.2 DeltaWriter 与 Memtable

DeltaWriter 主要负责不断接收新写入的批量数据，完成单个 Tablet 的数据写入。由于新增的数据可以是增量 Delta 部分，因此叫做 DeltaWriter。

DeltaWriter 数据写入采用了类 LSM 树的结构，将数据先写到 Memtable 中，当 Memtable 数据写满后，会异步 flush 生成一个 Segment 进行持久化，同时生成一个新的 Memtable 继续接收新增数据导入，这个 flush 操作由 MemtableFlushExecutor 执行器完成。

Memtable 中采用了跳表的结构对数据进行排序，排序规则使用了按照 schema 的 key 的顺序依次对字段进行比较。这样保证了写入的每一个写入 Segment 中的数据是有序的。如果当前模型为非 DUP 模型（AGG 模型和 UNIQUE 模型）时，还会对相同 key 的数据进行聚合。

### 3.3 物理写入

#### 3.3.1 RowsetWriter 各个模块设计

在物理存储层面的写入，由 RowsetWriter 完成。RowsetWriter 中又分为 SegmentWriter、ColumnWriter、PageBuilder、IndexBuilder 等子模块。

1. 其中 RowsetWriter 从整体上完成一次导入 LoadJob 任务的写入，一次导入 LoadJob 任务会生成一个 Rowset，一个 Rowset 表示一次导入成功生效的数据版本。实现上由 RowsetWriter 负责完成 Rowset 的写入。
2. SegmentWriter 负责实现 Segment 的写入。一个 Rowset 可以由多个 Segment 文件组成。
3. ColumnWriter 被包含在 SegmentWriter 中，Segment 的文件是完全的列存储结构，Segment 中包含了各个列和相关的索引数据，每个列的写入由 ColumnWriter 负责写入。
4. 在文件存储格式中，数据和索引都是按 Page 进行组织，ColumnWriter 中又包含了生成数据 Page 的 PageBuilder 和生成索引 Page 的 IndexBuilder 来完成 Page 的写入。
5. 最后，FileWritableBlock 来负责具体的文件的读写。文件的存储格式可以参见《Doris 存储层设计介绍 1——存储结构设计解析》文档。

#### 3.3.2 RowsetWriter 写入流程

整体的物理写入的如下图所示：

![img](/images/blogs/storage/8e136044dcc7b75df037a7a211006e9d.png)

物理写入流程的详细描述：

1. 当一个 Memtable 写满时(默认为 100M)，将 Memtable 的数据会 flush 到磁盘上，这时 Memtable 内的数据是按 key 有序的。然后逐行写入到 RowsetWriter 中。
2. RowsetWriter 将数据同样逐行写入到 SegmentWriter 中，RowsetWriter 会维护当前正在写入的 SegmentWriter 以及要写入的文件块列表。每完成写入一个 Segment 会增加一个文件块对应。
3. SegmentWriter 将数据按行写入到各个 ColumnWriter 的中，同时写入 ShortKeyIndexBuilder。ShortKeyIndexBuilder 主要负责生成 ShortKeyIndex 的索引 Page 页。具体的 ShortKeyIndex 索引格式可以参见《Doris 存储层设计介绍 1——存储结构设计解析》文档。
4. ColumnWriter 将数据分别写入 PageBuilder 和各个 IndexBuilder，PageBuilder 用来生成 ColumnData 数据的 PageBuilder，各个 IndexBuilder 包括了（OrdinalIndexBuilder 生成 OrdinalIndex 行号稀疏索引的 Page 格式、ZoneMapIndexBuilder 生成 ZoneMapIndex 索引的 Page 格式、BitMapIndexBuilder 生成 BitMapIndex 索引的 Page 格式、BloomFilterIndexBuilder 生成 BloomFilterIndex 索引的 Page 格式）。具体参考 Doris 存储文件格式解析。
5. 添加完数据后，RowsetWriter 执行 flush 操作。
6. SegmentWriter 的 flush 操作，将数据和索引写入到磁盘。其中对磁盘的读写由 FileWritableBlock 完成。
7. ColumnWriter 将各自数据、索引生成的 Page 顺序写入到文件中。
8. SegmentWriter 生成 SegmentFooter 信息，SegmentFooter 记录了 Segment 文件的原数据信息。完成写入操作后，RowsetWriter 会再开启新的 SegmentWriter，将下一个 Memtable 写入新的 Segment，直到导入完成。

### 3.4 Rowset 发布

在数据导入完成时，DeltaWriter 会将新生成的 Rowset 进行发布。发布即将这个版本的 Rowset 设置为可见状态，表示导入数据已经生效能够被查询。而版本信息表示 Rowset 生效的次序，一次导入会生成一个 Rowset，每次导入成功会按序增加版本。整个发布过程如下：

1. DeltaWriter 统计当前 RowsetMeta 元数据信息，包括行数、字节数、时间、Segment 数量。
2. 保存到 RowsetMeta 中，向 FE 提交导入事务。当前导入事务由 FE 开启，用来保证一次导入在各个 BE 节点的数据的同时生效。
3. 在 FE 协调好之后，由 FE 统一下发 Publish 任务使导入的 Rowset 版本生效。任务中指定了发布的生效 version 版本信息。之后 BE 存储层才会将这个版本的 Rowset 设置为可见。
4. Rowset 加入到 BE 存储层的 Tablet 进行管理。

## 4 删除流程

目前 Delete 有两种实现，一种普通的删除类型为 DELETE，一种为 LOAD_DELETE。

### 4.1 DELETE 执行流程

DELETE 的支持一般的删除操作，实现较为简单，DELETE 模式下没有对数据进行实际删除操作，而是对数据删除条件进行了记录。存储在 Meta 信息中。当执行 Base Compaction 时删除条件会一起被合入到 Base 版本中。Base 版本为 Tablet 从[0-x]的第一个 Rowset 数据版本。具体流程如下：

1. 删除时由 FE 直接下发删除命令和删除条件。
2. BE 在本地启动一个 EngineBatchLoadTask 任务，生成新版本的 Rowset，并记录删除条件信息。这个删除记录的 Rowset 与写入过程的略有不同，该 Rowset 仅记录了删除条件信息，没有实际的数据。
3. FE 同样发布生效版本。其中会将 Rowset 加入到 Tablet 中，保存 TabletMeta 信息。

### 4.2 LOAD_DELETE 执行流程

LOAD_DELETE 支持了在 UNIQUE KEY 模型下，实现了通过批量导入要删除的 key 对数据进行删除，能够支持大量数据删除能力。整体思路是在数据记录中加入删除状态标识，在 Compaction 流程中会对删除的 key 进行压缩。Compaction 主要负责将多个 Rowset 版本进行合并，Compaction 流程会在后续的文章中进行详细介绍。

## 5 总结

本文详细介绍了 Doris 系统底层存储层的写入流程、删除流程。首先对 Doris 整体的写入流程进行了描述，然后详细分析了 Doris 的类 LSM 存储结构的设计、内存部分数据分发和物理写入流程、Rowset 版本发布生效等流程，最后介绍了 Doris 支持的两种数据删除方式。