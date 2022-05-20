---
{
    "title": "Apache Doris storage layer design three reading process, Compaction process analysis",
    "description": "This article introduces in detail the internal implementation process of the Doris system during the data writing process, as well as the implementation process of Doris's conditional deletion of data and batch deletion by key.",
    "date": "2022-05-20",
    "metaTitle": "Apache Doris storage layer design three reading process, Compaction process analysis",
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

# Apache Doris storage layer design three reading process, Compaction process analysis

## 1 Overall introduction

Doris is an interactive SQL data warehouse based on MPP architecture, mainly used to solve near real-time reports and multi-dimensional analysis. The efficient import and query of Doris is inseparable from the sophisticated design of its storage structure.

This article mainly analyzes the implementation principle of the storage layer of the Doris BE module by reading the code of the Doris BE module, and expounds and decrypts the core technology behind the efficient writing and query capabilities of Doris. It includes Doris column storage design, index design, data read and write process, Compaction process and other functions.

This article introduces in detail the internal implementation process of the Doris system during the data writing process, as well as the implementation process of Doris's conditional deletion of data and batch deletion by key.

## 2 Read process

### 2.1 Overall reading process

The read process is the reverse process of writing, but the read process is relatively complicated, mainly because of a large number of read optimizations. The entire reading process is divided into two stages, one is the init process, and the other is the process of obtaining the next_block data block. The specific process is shown in the following figure:

![img](/images/blogs/storage/74F6DA700653418B9828E27EEAACA8ED.png)

The hierarchical relationship is as follows:

OlapScanner encapsulates the overall read operation of a tablet data;

Reader processes the read parameters, and provides differentiated processing for reading according to three different models;

CollectIterator contains multiple RowsetReaders in the tablet. These RowsetReaders have version order. CollectIterator merges these RowsetReaders into a unified Iterator function and provides a merged comparator;

RowsetReader is responsible for reading a Rowset;

RowwiseIterator provides an Iterator function for unified access to all Segments in a Rowset. The merge strategy here can use Merge or Union according to the data sorting;

SegmentIterator corresponds to the data read of a segment. The segment read will calculate the corresponding line number information read according to the query conditions and the index, seek to the corresponding page, and read the data. Among them, after filtering conditions, a bitmap will be generated for the accessible row information to record, BitmapRangeIterator is a separate iterator that can access this bitmap according to the range;

ColumnIterator provides an iterator for uniform access to a column's related data and indexes. ColumnReader, each IndexReader, etc. correspond to the reading of specific data and index information.

### 2.2 The main process of reading the Init stage

The execution flow of the initialization phase is as follows:

![img](/images/blogs/storage/61A2C6F0D26F4DECB3AEDF2A5F846790.png)

#### 2.2.1 OlapScanner query parameter construction

Find the RowsetReader that needs to be read according to the version specified by the query (depending on the rowset_graph version path map of version management to obtain the shortest path of the query version range);

1. Set the query information, including _tablet, read type reader_type=READER_QUERY, whether to aggregate, _version (from 0 to the specified version);

2. Set query condition information, including filter field and is_nulls field;

3. Set the return column information;

4. Set the key_ranges range of the query (the range array of keys, which can be filtered by short key index);

5. Initialize the Reader object.

#### 2.2.2 Reader's Init process

1. Initialize the conditions query condition object;

2. Initialize the bloomFilter column set (eq, in conditions, columns with bloomFilter added);

3. Initialize delete_handler. It includes all the deletion information existing in the tablet, including the version and the corresponding deletion condition array;

4. Initialize the columns that are passed to the lower layer to be read and returned, including the return value and the columns in the condition object;

5. Initialize the RowCusor row cursor object corresponding to the start key and end key of key_ranges;

6. Set up RowsetReader and CollectIterator for the constructed information. The Rowset object is initialized, and the RowsetReader is added to the CollectIterator;

7. Call CollectIterator to get the current row (actually the first row here), start the reading process here, and read it for the first time.

#### 2.2.3 Init process of RowsetReader

Build a SegmentIterator and filter out delete conditions in delete_handler that are smaller than the current Rowset version;

Build a RowwiseIterator (an aggregate iterator for SegmentIterator), and add the SegmentIterator to be read to the RowwiseIterator. When all segments are in overall order, the sequential reading method of union iterator is adopted, otherwise, the merge iterator method of merged reading is adopted.

#### 2.2.4 Init process of Segmentlterator

1. Initialize the ReadableBlock, which is used to read the object of the current Segment file, and actually read the file;

2. Initialize _row_bitmap to store the row number filtered by the index, using the bitmap structure;

3. Build a ColumnIterator, where only the columns need to be read;

If the Column has a BitmapIndex index, initialize the BitmapIndexIterator of each Column;

Filter data by SortkeyIndex index. When the query has key_ranges, obtain the row number range of the hit data through key_range. The steps are as follows: (1) According to the upper and lower keys of each key_range, find the corresponding row numbers upper_rowid and lower_rowid through the SortkeyIndex index of Segment, and then merge the obtained RowRanges into row_bitmap;

Filter data conditionally by various indexes. Conditions include query conditions and delete conditions to filter information.

- According to the query conditions, use the bitmap index to filter the columns that contain the bitmap index in the condition, and query the row number list with the existing data to intersect the row_bitmap. Because it is precise filtering, delete the filtering conditions from the Condition object.
- Use the BloomFilter index to filter data according to the equivalent (eq, in, is) conditions in the query conditions. Here, it will be judged whether the current condition can hit the Page, and the row number range of this Page will be intersected with the row_bitmap.
- Use ZoneMapIndex to filter data according to query conditions and deletion conditions, and find the pages that meet the conditions by intersecting the index of each Page in ZoneMap. The range of row numbers matched by the ZoneMapIndex index is intersected with row_bitmap.

Use row_bitmap to construct a BitmapRangerInterator iterator for subsequent reading of data.

### 2.3 The main process of reading the next stage

The execution flow of the next stage is as follows:

![img](/images/blogs/storage/9A6C9C92717B44D5967EF36578B01920.png)

#### 2.3.1 Reader reads next_row_with_aggregation

Read a line in advance when the reader reads, record as the current line. When next is called to return the result, the current row will be returned, and then the next row will be prefetched as the new current row.

The reading of the reader will be divided into three cases according to the type of the model

_dup_key_next_row reads (detailed data model), returns the current row, and then directly reads CollectorIterator to read next as the current row;

Under _agg_key_next_row reading (aggregation model), after taking CollectorIterator to read next, determine whether the next row is the same as the key of the current row, if it is the same, perform aggregation calculation, and read the next row in a loop; if not, return the current accumulated aggregation result, update the current row;

Under _unique_key_next_row reading (unique key model), the logic is the same as the _agg_key_next_row model, but there are some differences. Since the delete operation is supported, it will check whether the current row after aggregation is marked as a deleted row. If data is discarded for a deleted row, it will not be returned until a data is found that is not a deleted row.

#### 2.3.2 CollectIterator reads next

CollectIterator uses the heap data structure to maintain the set of RowsetReaders to be read. The comparison rules are as follows: According to the order of the keys of the current row of each RowsetReader, when the keys are the same, compare the version of the Rowset.

CollectIterator pops the previous largest RowsetReader from the heap;

Read the next new row for the RowsetReader just popped out as the current row of the RowsetReader and put it into the heap for comparison. During the reading process, the nextBlock of RowsetReader is called to read by RowBlock. (If the currently fetched block is a partially deleted page, the current row is also filtered according to the deletion condition.)

Get the current row of the RowsetReader at the top of the queue and return it as the current row.

#### 2.3.3 RowsetReader reads next

RowsetReader directly reads next_batch of RowwiseIterator;

RowwiseIterator integrates SegmentIterator. When the Segments in the Rowset are ordered as a whole, iteratively returns directly in the Union mode. When out of order, return by Merge. RowwiseIterator also returns the row data of the current largest SegmentIterator, and each time the next_batch of SegmentIterator is called to get the data.

#### 2.3.4 SegmentIterator reads next_batch

According to the BitmapRangerInterator constructed in the init phase, use next_range to take out a range_from, range_to of the line number to be read each time;

First read the data of the condition column from range_from to range_to row. The process is as follows:

Call the seek_to_ordinal of each columnIterator of the conditional column, and the current_rowid of the read position of each column is located to the cur_rowid of the SegmentIterator. Here is the alignment to the corresponding data page by binary check ordinal_index.

Read the data of the condition column. Do one more filter by condition (this time exact filter).

Then read the data of the unconditional column, put it into the Rowblock, and return to the Rowblock.

## 3 Compaction process

### 3.1 Overall Introduction of Compaction

Doris improves the performance of incrementally aggregated Rowset files through Compaction. In the version information of Rowset, two fields, first and second, are designed to represent the merged version range of Rowset. When the versions first and second of the unmerged cumulative rowset are equal. During Compaction, adjacent Rowsets will be merged to generate a new Rowset, and the first and second of the version information will also be merged into a larger version. On the other hand, the compaction process greatly reduces the number of rowset files and improves query efficiency.

![img](/images/blogs/storage/42A6FA7E0D8E457E9398CE3314427F5D.png)

As shown in the figure above, there are two types of Compaction tasks, base compaction and cumulative compaction. The cumulative_point is the key to dividing the two strategies.

It can be understood in this way that the right side of cumulative_point is the incremental Rowset that has never been merged, and the first and second versions of each Rowset are equal; the left side of cumulative_point is the merged Rowset, and the first version is not equal to the second version. The base compaction and cumulative compaction task processes are basically the same, and the difference is only in the logic of selecting the InputRowset to be merged.

### 3.2 Detailed process of Compaction

The overall process of Compaction merger is shown in the following figure:

![img](/images/blogs/storage/FA319E53B7D0444F986A8DBC8DF4273A.png)

#### 3.2.1 Calculate cumulative_point

Select the set of InputRowsets that need to be merged for compaction:

Base compaction selection conditions:

1. When there are more than 5 non-cumulative rowsets, merge all non-cumulative rowsets;

2. When the ratio of the base rowset whose version first is 0 and other non-cumulative disks is less than 10:3, merge all non-cumulative rowsets for merging;

3. In other cases, the merger will not be carried out.

Selection criteria for cumulative compaction:

1. The number of segments in the selected Rowset set needs to be greater than or equal to 5 and less than or equal to 1000 (configurable), and merge; 2.
2. When the number of output Rowsets is less than 5, but the deletion condition version is greater than the Rowset second version, merge (let the deleted Rowsets be merged in quickly);
3. When both the accumulated base compaction and cumulative compaction time are greater than 1 day, merge;
4. Other cases are not combined.

#### 3.2.2 Execute compaction

Compaction execution can basically be understood as a read process plus a write process. Here, the Reader will be turned on for the inputRowsets to be merged, and then the records will be read through next_row_with_aggregation. Write to the output RowsetWriter to produce a new OutputRowset. The version of this Rowset is the full range of the InputRowsets version.

#### 3.2.3 update cumulative_point

 Update cumulative_point and pass the OutputRowset produced by cumulative compaction to the subsequent base compaction process.

After Compaction, the aggregation key model and the unique key model scattered in different Rowsets but with the same key data are merged to achieve the effect of pre-computing. At the same time, the number of Rowset files is reduced, and the query efficiency is improved.

## 4 Summary

This article introduces the read-related process of the underlying storage layer of the Doris system in detail.

The reading process depends on the complete column storage implementation. For OLAP wide table scenarios (reading a large number of rows, a small number of columns), it can quickly scan and filter based on various index functions (including short key, bloom filter, zoon map, bitmap, etc. ), which can skip a large number of data scans, and optimizes such as delayed materialization, which can correspond to data analysis in various scenarios; the Compaction execution process is also optimized for different scenarios. Rowsets with similar data volumes can be combined for compaction, reducing IO operations and improving efficiency.