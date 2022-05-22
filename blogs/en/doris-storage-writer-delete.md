---
{
    "title": "Apache Doris storage layer design two write process, delete process analysis",
    "description": "This article introduces in detail the internal implementation process of the Doris system during the data writing process, as well as the implementation process of Doris's conditional deletion of data and batch deletion by key.",
    "date": "2022-05-20",
    "metaTitle": "Apache Doris storage layer design two write process, delete process analysis",
    "isArticle": true,
    "language": "en",
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



## 1. Overall introduction

Doris is an interactive SQL data warehouse based on MPP architecture, mainly used to solve near real-time reporting and multidimensional analysis. Doris's efficient import and query are inseparable from the sophisticated design of its storage structure.

This article mainly analyzes the implementation principle of the storage layer of the Doris BE module by reading the code of the Doris BE module, and expounds and decrypts the core technology behind the efficient writing and query capabilities of Doris. It includes Doris column storage design, index design, data read and write process, Compaction process, version management of Tablet and Rowset, data backup and other functions.

This article introduces the storage layer structure of the Segment V2 version, including rich functions such as ordered storage, sparse index, prefix index, bitmap index, BloomFilter, etc., which can provide extremely fast query capabilities for various complex scenarios.

This article introduces in detail the internal implementation process of the Doris system during the data writing process, as well as the implementation process of Doris's conditional deletion of data and batch deletion by key

## 2 Glossary

- **FE:** Frontend, the front-end node of Doris. It is mainly responsible for receiving and returning client requests, metadata, cluster management, and query plan generation.
- **BE:** Backend, the backend node of Doris. Mainly responsible for data storage and management, query plan execution and other work.
- **Tablet:** Tablet is the actual physical storage unit of a table. A table is stored in units of Tablet in the distributed storage layer formed by BE after partitioning and bucketing. Each Tablet includes meta information and several a continuous RowSet.
- **Rowset: ** Rowset is the data set of a data change in the Tablet, and the data change includes data import, deletion, update, etc. Rowset records by version information. A version is generated for each change.
- **Version:** consists of two attributes, Start and End, and maintains the record information of data changes. Usually used to indicate the version range of Rowset, after a new import generates a Rowset with equal Start and End, and after Compaction generates a Rowset version with a range.
- **Segment:** Indicates the data segment in the Rowset. Multiple Segments form a Rowset.
- **Compaction:** The process of merging consecutive versions of Rowset is called Compaction, and the data is compressed during the merging process.

## 3 Write process

Doris supports various forms of data writing methods for different scenarios, including importing Broker Load from other storage sources, importing HTTP synchronous data into Stream Load, routine Routine Load import and Insert Into writing, etc. At the same time, the import process will involve FE module (mainly responsible for import plan generation and import task scheduling), BE module (mainly responsible for ETL and storage of data), and Broker module (providing Doris with the ability to read files in the remote storage system). Where the Broker module is only applied in imports of type Broker Load.

The following takes Stream Load writing as an example to describe the overall data writing process of Doris as shown in the following figure:

![img](/images/blogs/storage/04ebc864ee5fcc9f0e3c51347af5b8cf.png)

 The process is described as follows:

1. FE receives the user's write request and randomly selects BE as the Coordinator BE. Redirect the user's request to this BE.
2. The Coordinator BE is responsible for receiving the user's data write request, and at the same time requesting the FE to generate an execution plan and schedule and manage the import task LoadJob and import transaction.
3. The Coordinator BE schedules the execution of the import plan, and performs data verification and cleaning.
4. The data is written to the storage layer of the BE. In this process, it will be written to the memory first, and after a certain amount of data is filled, it will be written to the physical disk according to the data format of the storage layer.

This article mainly introduces the detailed process of writing data to the BE storage layer. The rest of the process is not described in detail.

### 3.1 Data distribution process

After the data is cleaned and filtered, the data will be sent to the BE nodes of the storage layer in batches through Open/AddBatch requests. Multiple LoadJob tasks are supported concurrently for concurrent write execution on a BE. LoadChannelMgr manages these tasks and distributes the data.

The data distribution and writing process is shown in the following figure:

![img](/images/blogs/storage/225e6c7dba4c85c30ab3d00c0519e24a.png)

1. Each time an import task LoadJob will create a LoadChannel to execute, LoadChannel maintains an imported channel, and LoadChannel can write data in batches until the import is complete.

2. LoadChannel will create a TabletsChannel to perform specific import operations. A TabletsChannel corresponds to multiple Tablets. In a batch data write operation, TabletsChannel distributes the data to the corresponding Tablet, and the DeltaWriter writes the data to the Tablet, and the real write operation begins.

### 3.2 DeltaWriter and Memtable

   DeltaWriter is mainly responsible for continuously receiving newly written batches of data and completing the data writing of a single Tablet. Since the new data can be incremental Delta parts, it is called DeltaWriter.

   DeltaWriter uses an LSM tree-like structure for data writing. The data is first written to the Memtable. When the Memtable data is full, it will asynchronously flush to generate a Segment for persistence, and at the same time generate a new Memtable to continue to receive new data for import. This flush operation is done by the MemtableFlushExecutor executor.

   In Memtable, the skip table structure is used to sort the data, and the sorting rule uses the order of the keys of the schema to compare the fields in turn. This ensures that the data written in each write segment is ordered. If the current model is a non-DUP model (AGG model and UNIQUE model), the data of the same key will also be aggregated.

### 3.3 Physical Write

#### 3.3.1 RowsetWriter module design

   Writing at the physical storage level is done by RowsetWriter. RowsetWriter is further divided into sub-modules such as SegmentWriter, ColumnWriter, PageBuilder, and IndexBuilder.

   1. RowsetWriter completes the writing of an import LoadJob task as a whole, and an import LoadJob task will generate a Rowset, and a Rowset represents the data version that is successfully imported once. In implementation, RowsetWriter is responsible for completing the writing of Rowset.
   2. SegmentWriter is responsible for implementing Segment writing. A Rowset can consist of multiple Segment files.
   3. ColumnWriter is included in SegmentWriter. The segment file is a complete column storage structure. Segment contains each column and related index data. The writing of each column is responsible for writing by ColumnWriter.
   4. In the file storage format, data and indexes are organized by Page, and ColumnWriter includes PageBuilder for generating data Page and IndexBuilder for generating index Page to complete the writing of Page.
   5. Finally, FileWritableBlock is responsible for reading and writing specific files. For the storage format of the file, please refer to the document "Introduction to Doris Storage Layer Design 1 - Analysis of Storage Structure Design".

#### 3.3.2 RowsetWriter writing process

The overall physical writing is shown in the following figure:

![img](/images/blogs/storage/8e136044dcc7b75df037a7a211006e9d.png)

Detailed description of the physical write process:

1. When a Memtable is full (the default is 100M), the data in the Memtable will be flushed to the disk, and the data in the Memtable will be ordered by key. It is then written to the RowsetWriter row by row.
2. The RowsetWriter also writes the data line by line to the SegmentWriter, and the RowsetWriter maintains the currently being written SegmentWriter and the list of file blocks to be written. Each time a segment is written, a file block will be added.
3. SegmentWriter writes data to each ColumnWriter row by row, and writes ShortKeyIndexBuilder at the same time. ShortKeyIndexBuilder is mainly responsible for generating the index Page of ShortKeyIndex. For the specific ShortKeyIndex index format, please refer to the document "Introduction to Doris Storage Layer Design 1 - Storage Structure Design Analysis".
4. ColumnWriter writes data into PageBuilder and each IndexBuilder respectively. PageBuilder is used to generate PageBuilder for ColumnData data. Each IndexBuilder includes (OrdinalIndexBuilder generates Page format of OrdinalIndex row number sparse index, ZoneMapIndexBuilder generates Page format of ZoneMapIndex index, BitMapIndexBuilder generates BitMapIndex index Page format, BloomFilterIndexBuilder generates the Page format of the BloomFilterIndex index). For details, refer to Doris Storage File Format Analysis.
5. After adding data, the RowsetWriter performs a flush operation.
6. The flush operation of SegmentWriter writes data and indexes to disk. The read and write to the disk is done by FileWritableBlock.
7. ColumnWriter writes the respective data and pages generated by the index to the file in sequence.
8. SegmentWriter generates SegmentFooter information, and SegmentFooter records the original data information of the Segment file. After completing the write operation, RowsetWriter will start a new SegmentWriter and write the next Memtable to the new Segment until the import is complete.

### 3.4 Posted by Rowset

When the data import is complete, DeltaWriter will publish the newly generated Rowset. The release is to set the Rowset of this version to the visible state, indicating that the imported data has become effective and can be queried. The version information indicates the order in which the Rowset takes effect. An import will generate a Rowset, and each time the import is successful, the version will be increased in order. The entire release process is as follows:

1. DeltaWriter counts the current RowsetMeta metadata information, including the number of rows, bytes, time, and segments.
2. Save to RowsetMeta and submit the import transaction to FE. The current import transaction is opened by FE to ensure that the data of each BE node is imported at the same time and takes effect at the same time.
3. After the FE is coordinated, the FE will issue a Publish task to make the imported Rowset version take effect. The release's effective version version information is specified in the task. Only then will the BE storage layer make this version of the Rowset visible.
4. Rowset is added to the Tablet of the BE storage layer for management.

## 4 delete process

At present, there are two implementations of Delete, a common delete type is DELETE, and the other is LOAD_DELETE.

### 4.1 DELETE execution flow

DELETE supports general deletion operations, and the implementation is relatively simple. In DELETE mode, there is no actual deletion of data, but data deletion conditions are recorded. Stored in Meta information. Delete conditions are incorporated into the Base version together when Base Compaction is performed. The Base version is the first Rowset data version of the Tablet from [0-x]. The specific process is as follows:

1. When deleting, the FE will directly issue the delete command and delete conditions.
2. BE starts an EngineBatchLoadTask task locally, generates a new version of Rowset, and records the deletion condition information. The Rowset of this deletion record is slightly different from that of the writing process. The Rowset only records the deletion condition information without actual data.
3. FE also publishes the effective version. The Rowset will be added to the Tablet and the TabletMeta information will be saved.

### 4.2 LOAD_DELETE execution flow

LOAD_DELETE supports the ability to delete data by importing the keys to be deleted in batches under the UNIQUE KEY model, which can support large-scale data deletion. The overall idea is to add a deletion status flag to the data record, and the deleted key will be compressed in the Compaction process. Compaction is mainly responsible for merging multiple Rowset versions, and the Compaction process will be described in detail in subsequent articles.

## 5 Summary

This article introduces the writing process and deletion process of the underlying storage layer of the Doris system in detail. It first describes the overall writing process of Doris, and then analyzes in detail the design of Doris's LSM-like storage structure, the data distribution and physical writing process in the memory part, the Rowset version release and other processes, and finally introduces the two supported by Doris. Data deletion method。