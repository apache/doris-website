---
{
    "title": "Index Overview",
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

Indexes are used to help quickly filter or search for data. Currently, Doris supports two types of indexes: built-in smart indexes and user-created secondary indexes.

### Built-in smart indexes

- Sorted keys and prefix index: Apache Doris stores data in an ordered manner based on sorted keys. It creates a prefix index for every 1024 rows of data. The key in the index is the value of the sorted column in the first row of the current 1024-row group. If a query involves a sorted column, the system will find the first row of the relevant 1024-row group and start scanning from there.
- ZoneMap index: The ZoneMap index is automatically maintained index information for each column in the column-based storage format, including Min/Max values, etc. This type of index is transparent to users. These are segment and page-level indexes, the maximum and minimum values for each column within a page are recorded, and the maximum and minimum values for each column within a segment are also recorded. Therefore, in equivalence and range queries,  this Min/Max index can be used to narrow down the filtering range.

### User-created secondary indexes

- Bloom Filter Index
- N-Gram Bloom Filter Index
- Bitmap Index
- Inverted Index