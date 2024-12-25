---
{
    "title": "Data Cache",
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

Data cache accelerates queries that read the same data by caching the data files of recently accessed from remote storage system (HDFS or Object Storage). In Ad Hoc scenarios where the same data is frequently accessed, Data cache can avoid repeated remote data access costs and improve the query analysis performance and stability of hot data.

## How it works

Data Cache caches the accessed remote data in the local BE node. The original data file will be divided into blocks according to the read IO size, and the block will be stored in file `cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset`, and save the block meta information in the BE node. When accessing the same remote file, doris will check whether the cached data of the file exists in the local cache, and according to the offset and size of the block, confirm which data is read from the local block, which data is pulled from the remote, and cache the new data pulled from the remote. When the BE node restarts, scan `cache_path` directory, recover the meta information of the block. When the cache size reaches the upper threshold, the blocks that have not been accessed for a long time shall be cleaned according to the LRU principle.

## Usage

Data cache is disabled by default. You need to set the relevant configuration in FE and BE to enable it.

### Configurations for FE

Enable Data cache for a given session:

```
SET enable_file_cache = true;
```

Enable Data cache globally:

```
SET GLOBAL enable_file_cache = true;
```

> The Data cache is only applicable to external queries for files (such as Hive, Hudi). It has no effect on internal table queries, or non-file external queries (such as JDBC, Elasticsearch), etc.

### Configurations for BE

Add settings to the BE node's configuration file `conf/be.conf`, and restart the BE node for the configuration to take effect.

|  Parameter | Required  | Description  |
|  ---  | ---  | --- |
| `enable_file_cache` | Yes | Whether to enable Data cache, default false |
| `file_cache_path` | Yes | Parameters about cache path, json format, for exmaple: `[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]`. `path` is the path to save cached data; `total_size` is the max size of cached data. |
| `clear_file_cache` | No | Whether to delete the previous cache data when the BE restarts, default false |

## Cache Observability

### Check whether a query hits cache

Execute `set enable_profile = true` to enable the session variable, and you can view the query profile in the Queris tab of FE's web page. The metrics related to Data cache are as follows:

```
-  FileCache:  0ns
    -  BytesScannedFromCache:  2.02  GB
    -  BytesScannedFromRemote:  0.00  
    -  BytesWriteIntoCache:  0.00  
    -  LocalIOUseTimer:  2s723ms
    -  NumLocalIOTotal:  444
    -  NumRemoteIOTotal:  0
    -  NumSkipCacheIOTotal:  0
    -  RemoteIOUseTimer:  0ns
    -  WriteCacheIOUseTimer:  0ns
```

- `BytesScannedFromCache`: The amount of data read from the local cache.
- `BytesScannedFromRemote`: The amount of data read from the remote end.
- `BytesWriteIntoCache`: The amount of data written to the cache.
- `LocalIOUseTimer`: Local cached IO time.
- `RemoteIOUseTimer`: IO time for remote reading.
- `NumLocalIOTotal`: The number of locally cached IOs.
- `NumRemoteIOTotal`: Number of remote IOs.
- `WriteCacheIOUseTimer`: IO time to write cache.

If `BytesScannedFromRemote` is 0, it means all caches are hit.

### Metrics

User can query system table [file_cache_statistics](../admin-manual/system-tables/information_schema/file_cache_statistics.md) to view the cache stats of each Backends.

