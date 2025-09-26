---
{
    'title': 'Apache Doris 2.1.11 Released',
    'summary': 'Dear community members, the Apache Doris 3.0.6 version was officially released on Aug 15, 2025, this version introduces continuous upgrades and enhancements in Query Execution Engine and Query Optimizer.',
    'description': 'Dear community members, the Apache Doris 3.0.6 version was officially released on Aug 15, 2025, this version introduces continuous upgrades and enhancements in Query Execution Engine and Query Optimizer.',
    'date': '2025-08-15',
    'author': 'Apache Doris',
    'tags': ['Release Notes'],
    "image": '/images/2.1.11.jpg'
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



## Behavior Changes

- `time_series_max_tablet_version_num` controls the maximum number of versions for tables using the time - series compaction strategy. [#51371](https://github.com/apache/doris/pull/51371)
- Fixed the issue where the HDFS root_path did not take effect during hot - cold tiering. [#48441](https://github.com/apache/doris/pull/48441)
- In the new optimizer (Nereids), when the depth or width of an expression in a query exceeds the threshold limit, the query will not fall back to the old optimizer regardless of whether the fallback has started. [#52431](https://github.com/apache/doris/pull/52431)
- Unified the name checking rules for enabling or disabling unicode names. Now, the non - unicode name rules are a strict subset of the unicode name rules. [#53264](https://github.com/apache/doris/pull/53264)

## New Features

### Query Execution Engine

- Introduced the system table `routine_load_job` to view information about routine load jobs.[#48963](https://github.com/apache/doris/pull/48963)

### Query Optimizer

- Supported MySQL's GROUP BY roll - up syntax `GROUP BY ... WITH ROLLUP`. [#51978](https://github.com/apache/doris/pull/51978)

## Improvements

### Query Optimizer

- Optimized the performance of collecting statistical information on aggregate model tables and primary key model MOR tables. [#51675](https://github.com/apache/doris/pull/51675)

### Asynchronous Materialized View

- Optimized the planning performance of transparent rewriting. [#51309](https://github.com/apache/doris/pull/51309) 
- Optimized the refresh performance. [#51493](https://github.com/apache/doris/pull/51493)

## Bug Fixes

### Data Loading

- Fixed the problem that the display result of `show` did not meet expectations after altering the attributes of `routineload`. [#53038](https://github.com/apache/doris/pull/53038)

### Lakehouse Integration

- Fixed the issue of incorrect data reading for Iceberg equality delete in certain cases. [#51253](https://github.com/apache/doris/pull/51253)
- Fixed the error of Iceberg Hadoop Catalog in the Kerberos environment. [#50623](https://github.com/apache/doris/pull/50623) [#52149](https://github.com/apache/doris/pull/52149)
- Fixed the problem of failed transaction submission when writing to Iceberg tables in the Kerberos environment. [#51508](https://github.com/apache/doris/pull/51508)
- Fixed the error in transaction submission when writing to Iceberg tables. [#52716](https://github.com/apache/doris/pull/52716)
- Fixed the error when accessing Hudi tables in the Kerberos environment under certain circumstances. [#51713 ](https://github.com/apache/doris/pull/51713)
- SQL Server Catalog supports identifying IDENTITY column information. [#51285](https://github.com/apache/doris/pull/51285)
- Fixed the issue that Jdbc Catalog tables could not obtain row count information in some cases. [#50901](https://github.com/apache/doris/pull/50901)
- Optimized the decompression performance of ORC zlib in the x86 environment and fixed potential problems. [#51775](https://github.com/apache/doris/pull/51775)
- Added indicators related to Parquet/ORC condition filtering and delayed materialization in the Profile. [#51248](https://github.com/apache/doris/pull/51248)
- Optimized the reading performance of ORC Footer. [#51117](https://github.com/apache/doris/pull/51117)
- Fixed the problem that Table Valued Function could not read compressed JSON files. [#51983](https://github.com/apache/doris/pull/51983)
- Fixed the issue of inconsistent metadata caused by concurrent catalog refreshing in some cases. [#51787](https://github.com/apache/doris/pull/51787)

### Index

- Fixed the query error of the inverted index when processing IN predicates containing CAST operations to avoid returning incorrect query results. [#50860](https://github.com/apache/doris/pull/50860)
- Fixed the memory leak problem of the inverted index in abnormal execution situations. [#52747](https://github.com/apache/doris/pull/52747)

### Semi-structured Data Type

- Fixed the problem that some JSON functions returned incorrect results when dealing with null values.
- Fixed some bugs related to JSON functions. [#52543](https://github.com/apache/doris/pull/52543) [#51516](https://github.com/apache/doris/pull/51516) 

### Query Optimizer

- Fixed the issue that the query could not continue execution when parsing a string into a date failed. [#50900](https://github.com/apache/doris/pull/50900)
- Fixed the problem of incorrect constant folding results in individual scenarios. [#51738](https://github.com/apache/doris/pull/51738)
- Fixed the issue that individual array functions could not be planned normally when encountering null literals as input. [#50899](https://github.com/apache/doris/pull/50899)
- Fixed the problem that enabling local shuffle might lead to incorrect results in extreme scenarios. [#51313](https://github.com/apache/doris/pull/51313) [#52871 ](https://github.com/apache/doris/pull/52871)
- Fixed the issue that `replace view` might cause column information not to be visible when using `desc view`. [#52043](https://github.com/apache/doris/pull/52043) 
- Fixed the problem that the `prepare command` might not be executed correctly on non - master FE nodes. [#52265](https://github.com/apache/doris/pull/52265)

### Asynchronous Materialized View

- Fixed the problem that query failure might occur after transparent rewriting when the data type of the base table column changes. [#50730](https://github.com/apache/doris/pull/50730)
- Fixed the problem of incorrect partition compensation in transparent rewriting in individual scenarios. [#51899](https://github.com/apache/doris/pull/51899) [#52218](https://github.com/apache/doris/pull/52218)

### Query Execution Engine

- Fixed the problem that TopN calculation might core dump when encountering variant column types. [#52573](https://github.com/apache/doris/pull/52573) 
- Fixed the problem that the function `bitmap_from_base64` would core dump when inputting incorrect data. [#53018](https://github.com/apache/doris/pull/53018) 
- Fixed the problem of some incorrect results of the `bitmap_union` function when dealing with ultra - large amounts of data. [#52033](https://github.com/apache/doris/pull/52033)
- Fixed the calculation error of `multi_distinct_group_concat` when used in window functions. [#51875](https://github.com/apache/doris/pull/51875)
- Fixed the problem that the `array_map` function might core dump at extreme values. [#51618](https://github.com/apache/doris/pull/51618) [#50913](https://github.com/apache/doris/pull/50913)
- Fixed the problem of incorrect time zone handling. [#51454](https://github.com/apache/doris/pull/51454) 

### Others

- Fixed the inconsistent behavior of multi - statements between the master FE and non - master FE. [#52632](https://github.com/apache/doris/pull/52632)
- Fixed the error of prepared statements on non - master FE. [#48689](https://github.com/apache/doris/pull/48689)
- Fixed the problem that the rollup operation might cause CCR interruption. [#50830](https://github.com/apache/doris/pull/50830)