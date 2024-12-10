---
{
    "title": "Hudi Catalog",
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

[Apache Doris & Hudi Quick Start](https://doris.apache.org/docs/gettingStarted/tutorials/doris-hudi)

## Usage

1. The query types supported by the Hudi table are as follows, and the Incremental Query will be supported in the future.

|  Table Type   | Supported Query types  |
|  ----  | ----  |
| Copy On Write  | Snapshot Query + Time Travel |
| Merge On Read  | Snapshot Queries + Read Optimized Queries + Time Travel |

2. Doris supports Hive Metastore(Including catalogs compatible with Hive MetaStore, like [AWS Glue](./hive.md)/[Alibaba DLF](./dlf.md)) Catalogs.

## Create Catalog

Same as creating Hive Catalogs. A simple example is provided here. See [Hive](./hive.md) for more information.

```sql
CREATE CATALOG hudi PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

Optional configuration parameters:

|name|description|default|
|---|---|---|
|use_hive_sync_partition|Use hms synchronized partition data|false|

## Column Type Mapping

Same as that in Hive Catalogs. See the relevant section in [Hive](./hive.md).

## Skip Merge
Spark will create the read optimize table with `_ro` suffix when generating hudi mor table. Doris will skip the log files when reading optimize table. Doris does not determine whether a table is read optimize by the `_ro` suffix instead of the hive inputformat. Users can observe whether the inputformat of the 'cow/mor/read optimize' table is the same through the `SHOW CREATE TABLE` command. In addition, Doris supports adding hoodie related configurations to catalog properties, which are compatible with [Spark Datasource Configs](https://hudi.apache.org/docs/configurations/#Read-Options), so users can add `hoodie.datasource.merge.type=skip_merge` in catalog properties to skip merge logs files.

## Query Optimization
Doris uses the parquet native reader to read the data files of the COW table, and uses the Java SDK (By calling hudi-bundle through JNI) to read the data files of the MOR table. In `upsert` scenario, there may still remains base files that have not been updated in the MOR table, which can be read through the parquet native reader. Users can view the execution plan of hudi scan through the [explain](../../query/query-analysis/query-analysis.md) command, where `hudiNativeReadSplits` indicates how many split files are read through the parquet native reader.
```
|0:VHUDI_SCAN_NODE                                                             |
|      table: minbatch_mor_rt                                                  |
|      predicates: `o_orderkey` = 100030752                                    |
|      inputSplitNum=810, totalFileSize=5645053056, scanRanges=810             |
|      partition=80/80                                                         |
|      numNodes=6                                                              |
|      hudiNativeReadSplits=717/810                                            |
```
Users can view the perfomace of Java SDK through [profile](../../admin-manual/fe/profile-action.md), for example:
```
-  HudiJniScanner:  0ns
  -  FillBlockTime:  31.29ms
  -  GetRecordReaderTime:  1m5s
  -  JavaScanTime:  35s991ms
  -  OpenScannerTime:  1m6s
```
1. `OpenScannerTime`: Time to create and initialize JNI reader
2. `JavaScanTime`: Time to read data by Java SDK
3. `FillBlockTime`: Time co convert Java column data into C++ column data
4. `GetRecordReaderTime`: Time to create and initialize Hudi Record Reader

## Time Travel

Supports reading snapshots specified in Hudi table.

Every write operation to the Hudi table will generate a new snapshot.

By default, query requests will only read the latest version of the snapshot.

You can use the `FOR TIME AS OF` statement, based on the time of the snapshot to read historical version data. Examples are as follows:

`SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07 17:20:37";`

`SELECT * FROM hudi_tbl FOR TIME AS OF "20221007172037";`

Hudi table does not support the `FOR VERSION AS OF` statement. Using this syntax to query the Hudi table will throw an error.

## Incremental Read

Incremental Read can query the data changed between startTime and endTime, and the returned result set is the final state of the data at endTime.

Doris provides `@incr` syntax support Incremental Read:
```
SELECT * from hudi_table@incr('beginTime'='xxx', ['endTime'='xxx'], ['hoodie.read.timeline.holes.resolution.policy'='FAIL'], ...);
```
`beginTime` is required, and the time format is consistent with the hudi official website [hudi_table_changes](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#incremental-query), and supports "earliest". `endTime` is optional, and the default is the latest commitTime. Compatible with [Spark Read Options](https://hudi.apache.org/docs/0.14.0/configurations#Read-Options).

To support Incremental Read, you need to enable the [new optimizer](../../query/nereids/nereids-new), which is enabled by default. By viewing the execution plan through `desc`, we can find that Doris converts `@incr` into `predicates` and pushes it down to `VHUDI_SCAN_NODE`:

```
| 0:VHUDI_SCAN_NODE(113) |
| table: lineitem_mor |
| predicates: (_hoodie_commit_time[#0] >= '20240311151019723'), (_hoodie_commit_time[#0] <= '20240311151606605') |
| inputSplitNum=1, totalFileSize=13099711, scanRanges=1 |
```
