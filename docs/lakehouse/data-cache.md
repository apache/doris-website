---
{
    "title": "Data Cache",
    "language": "en",
    "description": "Data Cache accelerates subsequent queries of the same data by caching recently accessed data files from remote storage systems (HDFS or object "
}
---

Data Cache accelerates subsequent queries of the same data by caching recently accessed data files from remote storage systems (HDFS or object storage) to local disks. In scenarios where the same data is frequently accessed, Data Cache can avoid the overhead of repeated remote data access, improving the performance and stability of query analysis on hot data.

## Applicable Scenarios

The data cache function only works for queries on Hive, Iceberg, Hudi, and Paimon tables. It has no effect on internal table queries or non-file external table queries (such as JDBC, Elasticsearch).

Whether data caching can improve query efficiency depends on multiple factors. Below are the applicable scenarios for data caching:

* High-speed local disk

  It is recommended to use high-speed local disks, such as SSD or NVME media local disks, as the data cache directory. It is not recommended to use mechanical hard drives as the data cache directory. Essentially, the local disk's IO bandwidth and IOPS must be significantly higher than the network bandwidth and the source storage system's IO bandwidth and IOPS to bring noticeable performance improvements.

* Sufficient cache space size

  Data caching uses the LRU strategy as the cache eviction policy. If the queried data does not have a clear distinction between hot and cold, the cached data may be frequently updated and replaced, which may reduce query performance. It is recommended to enable data caching in scenarios where the query pattern has a clear distinction between hot and cold (e.g., most queries only access today's data and rarely access historical data), and the cache space is sufficient to store hot data.

* Unstable IO latency of remote storage

  This situation usually occurs on HDFS storage. In most enterprises, different business departments share the same HDFS, which may lead to very unstable IO latency during peak periods. In this case, if you need to ensure stable IO latency, it is recommended to enable data caching. However, the first two conditions should still be considered.

## Enabling Data Cache

The data cache function is disabled by default and needs to be enabled by setting relevant parameters in FE and BE.

### BE Configuration

First, configure the cache path information in `be.conf` and restart the BE node to make the configuration effective.

| Parameter            | Required | Description                              |
| ------------------- | --- | -------------------------------------- |
| `enable_file_cache` | Yes   | Whether to enable Data Cache, default is false               |
| `file_cache_path`   | Yes   | Configuration related to the cache directory, in JSON format.                      |
| `clear_file_cache`  | No   | Default is false. If true, the cache directory will be cleared when the BE node restarts. |

Example configuration of `file_cache_path`:

```sql
file_cache_path=[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]
```

`path` is the path where the cache is stored, and one or more paths can be configured. It is recommended to configure only one path per disk.

`total_size` is the upper limit of the cache space size, in bytes. When the cache space is exceeded, the LRU strategy will be used to evict cached data.

### FE Configuration

Enable Data Cache in a single session:

```sql
SET enable_file_cache = true;
```

Enable Data Cache globally:

```sql
SET GLOBAL enable_file_cache = true;
```

Note that if `enable_file_cache` is not enabled, the cache will not be used even if the BE is configured with a cache directory. Similarly, if the BE is not configured with a cache directory, the cache will not be used even if `enable_file_cache` is enabled.

## Cache Observability

### View Cache Hit Rate

Execute `set enable_profile=true` to open the session variable, and you can view the job's Profile on the `Queries` tab of the FE web page. The data cache-related metrics are as follows:

```sql
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

* `BytesScannedFromCache`: The amount of data read from the local cache.

* `BytesScannedFromRemote`: The amount of data read from the remote.

* `BytesWriteIntoCache`: The amount of data written into the cache.

* `LocalIOUseTimer`: The IO time of the local cache.

* `RemoteIOUseTimer`: The IO time of remote reading.

* `NumLocalIOTotal`: The number of IO operations on the local cache.

* `NumRemoteIOTotal`: The number of remote IO operations.

* `WriteCacheIOUseTimer`: The IO time of writing into the cache.

If `BytesScannedFromRemote` is 0, it means the cache is fully hit.

### Monitoring Metrics

Users can view cache statistics for each Backend node through the system table [`file_cache_statistics`](../admin-manual/system-tables/information_schema/file_cache_statistics).

## Cache Query Limit

> This feature is supported since version 4.0.3.

The Cache Query Limit feature allows users to limit the percentage of file cache that a single query can use. In scenarios where multiple users or complex queries share cache resources, a single large query might occupy too much cache space, causing other queries' hot data to be evicted. By setting a query limit, you can ensure fair resource usage and prevent cache thrashing.

The cache space occupied by a query refers to the total size of data populated into the cache due to cache misses. If the total size populated by the query reaches the quota limit, subsequent data populated by the query will replace the previously populated data based on the LRU algorithm.

### Configuration

This feature involves configuration on BE and FE, as well as session variable settings.

**1. BE Configuration**

- `enable_file_cache_query_limit`:
  - Type: Boolean
  - Default: `false`
  - Description: The master switch for the file cache query limit feature on the BE side. Only when enabled will the BE process the query limit parameters passed from the FE.

**2. FE Configuration**

- `file_cache_query_limit_max_percent`:
  - Type: Integer
  - Default: `100`
  - Description: The max query limit constraint used to validate the upper limit of session variables. It ensures that the query limit set by users does not exceed this value.

**3. Session Variables**

- `file_cache_query_limit_percent`:
  - Type: Integer (1-100)
  - Description: The file cache query limit percentage. It sets the maximum percentage of cache a query can use. This value is constrained by `file_cache_query_limit_max_percent`. It is recommended that the calculated cache quota is not less than 256MB. If it is lower than this value, the BE will print a warning in the log.

**Usage Example**

```sql
-- Set session variable to limit a query to use at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute query
SELECT * FROM large_table;
```

**Note:**
1. The value must be within the range [0, `file_cache_query_limit_max_percent`].

## Cache Warmup

Data Cache provides a cache "warmup" feature that allows preloading external data into the local cache of BE nodes, thereby improving cache hit rates and query performance for subsequent first-time queries.

> This feature is supported since version 4.0.2.

### Syntax

```sql
WARM UP SELECT <select_expr_list>
FROM <table_reference>
[WHERE <boolean_expression>]
```

Usage restrictions:

* Supported:

  * Single table queries (only one table_reference allowed)
  * Simple SELECT for specified columns
  * WHERE filtering (supports regular predicates)

* Not supported:

  * JOIN, UNION, subqueries, CTE
  * GROUP BY, HAVING, ORDER BY
  * LIMIT
  * INTO OUTFILE
  * Multi-table / complex query plans
  * Other complex syntax

### Examples

1. Warm up the entire table

  ```sql
  WARM UP SELECT * FROM hive_db.tpch100_parquet.lineitem;
  ```

2. Warm up partial columns by partition

  ```sql
  WARM UP SELECT l_orderkey, l_shipmode
  FROM hive_db.tpch100_parquet.lineitem
  WHERE dt = '2025-01-01';
  ```
3. Warm up partial columns by filter conditions

  ```sql
  WARM UP SELECT l_shipmode, l_linestatus
  FROM hive_db.tpch100_parquet.lineitem
  WHERE l_orderkey = 123456;
  ```

### Execution Results

After executing `WARM UP SELECT`, the FE dispatches tasks to each BE. The BE scans remote data and writes it to Data Cache.

The system directly returns scan and cache write statistics for each BE (Note: Statistics are generally accurate but may have some margin of error). For example:

```
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| BackendId     | ScanRows  | ScanBytes   | ScanBytesFromLocalStorage | ScanBytesFromRemoteStorage | BytesWriteIntoCache |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| 1755134092928 | 294744184 | 11821864798 | 538154009                 | 11283717130                | 11899799492         |
| 1755134092929 | 305293718 | 12244439301 | 560970435                 | 11683475207                | 12332861380         |
| TOTAL         | 600037902 | 24066304099 | 1099124444                | 22967192337                | 24232660872         |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
```

Field explanations:

* ScanRows: Number of rows scanned and read.
* ScanBytes: Amount of data scanned and read.
* ScanBytesFromLocalStorage: Amount of data scanned and read from local cache.
* ScanBytesFromRemoteStorage: Amount of data scanned and read from remote storage.
* BytesWriteIntoCache: Amount of data written to Data Cache during this warmup.

## Cache Admission Control

The cache admission control feature is disabled by default and needs to be enabled by setting relevant parameters in FE.

### FE Configuration

First, configure the cache admission rule information in `fe.conf` and restart the FE node to make the configuration effective.

| Parameter                                       | Required | Description                               |
| ----------------------------------------------- | -------- |-------------------------------------------|
| `enable_file_cache_admission_control`           | Yes      | Whether to enable cache admission control, default is false. |
| `file_cache_admission_control_json_dir`         | Yes      | The directory path for storing admission rules JSON files. All `.json` files in this directory will be automatically loaded, and any modifications will take effect dynamically. |

### JSON File Format
#### Field Description
| Field Name | Type | Description | Example |
|--------|------|-------------------------------|-----------------------|
| `id` | Long | Rule ID | `1` |
| `user_identity` | String | User identity (format: user@host, e.g., `%` matches all IPs), empty means matching all users | `"user@%"` |
| `catalog_name` | String | Catalog name, empty means matching all catalogs | `"catalog"` |
| `database_name` | String | Database name, empty means matching all databases | `"database"` |
| `table_name` | String | Table name, empty means matching all tables | `"table"` |
| `partition_pattern` | String | (Not implemented yet) Partition regular expression, empty means matching all partitions | |
| `rule_type` | Integer | Rule type: 0 - Deny cache, 1 - Allow cache | `0` |
| `enabled` | Boolean | Whether enabled: 0 - Disabled, 1 - Enabled | `1` |
| `created_time` | Long | Creation time (UNIX timestamp, seconds) | `1766557246` |
| `updated_time` | Long | Update time (UNIX timestamp, seconds) | `1766557246` |

#### JSON File Example
```json
[
  {
    "id": 1,
    "user_identity": "user@%",
    "catalog_name": "catalog",
    "database_name": "database",
    "table_name": "table",
    "partition_pattern": "",
    "rule_type": 0,
    "enabled": 1,
    "created_time": 1766557246,
    "updated_time": 1766557246
  },
  {
    "id": 2,
    "user_identity": "",
    "catalog_name": "catalog",
    "database_name": "",
    "table_name": "",
    "partition_pattern": "",
    "rule_type": 1,
    "enabled": 1,
    "created_time": 1766557246,
    "updated_time": 1766557246
  }
]
```
#### Import Rules from MySQL
An auxiliary script is provided in the `tools/export_mysql_rule_to_json.sh` path of the Doris source code repository to export cache admission rules already stored in a MySQL database into a JSON configuration file that complies with the above format.

### Rule Matching
#### Rule Scope Combinations
| user_identity | catalog_name | database_name | table_name | Rule Type |
|---------------|--------------|---------------|------------|------------------|
| Not empty | Empty | Empty | Empty | Global rule for specified user |
| Not empty | Not empty | Empty | Empty | Catalog-level rule for specified user |
| Not empty | Not empty | Not empty | Empty | Database-level rule for specified user |
| Not empty | Not empty | Not empty | Not empty | Table-level rule for specified user |
| Empty | Not empty | Empty | Empty | Catalog-level rule for all users |
| Empty | Not empty | Not empty | Empty | Database-level rule for all users |
| Empty | Not empty | Not empty | Not empty | Table-level rule for all users |

Description:
- "Empty" means the field is an empty string ("") or omitted in JSON (effect is the same as empty).
- "Not empty" means the field must be a explicitly specified string (e.g., "catalog").

The above seven combinations of fields constitute all valid rules. Any rules that do not comply with the hierarchical dependency are considered invalid, for example: Database is specified but Catalog is empty, or Table is specified but Database is empty.

#### Matching Principles
- **Exact Match First**: Match in order from specific to abstract by hierarchy (Table → Database → Catalog → Global), prioritizing the most precise rule level.
- **Security First**: Deny cache rules (blacklist) always take precedence over allow cache rules (whitelist) during matching, ensuring that decisions to deny access at the same level are identified first.
#### Matching Order
```text
1. Table-level rule
   a) Blacklist rule (rule_type=0)
   b) Whitelist rule (rule_type=1)
2. Database-level rule
   a) Blacklist rule
   b) Whitelist rule
3. Catalog-level rule
   a) Blacklist rule
   b) Whitelist rule
4. Global rule (user_identity is empty)
   a) Blacklist rule
   b) Whitelist rule
5. Default rule (If no rules match, caching is denied by default, equivalent to a blacklist)
```
### Display of Cache Decision
You can view the cache admission decision details of a table via the `EXPLAIN` command, including: decision result, decision basis, and decision time cost.
```text
|   0:VHIVE_SCAN_NODE(74)                                                                                          |
|      table: test_file_cache_features.tpch1_parquet.lineitem                                                      |
|      inputSplitNum=10, totalFileSize=205792918, scanRanges=10                                                    |
|      partition=1/1                                                                                               |
|      cardinality=1469949, numNodes=1                                                                             |
|      pushdown agg=NONE                                                                                           |
|      file cache request ADMITTED: user_identity:root@%, reason:user table-level whitelist rule, cost:0.058215 ms |
|      limit: 1                                                                                                    |
```
Output field description:
- ADMITTED: Cache request is admitted (DENIED means rejected)
- user_identity: The user executing the query
- reason: The decision reason for hitting the rule. Common values include:
  - user table-level whitelist rule: Table-level whitelist rule for specified user (current example)
  - common table-level blacklist rule: Table-level blacklist rule for all users
  - Other similar rules, format: [scope] [rule level] [rule type] rule
- cost: Time cost of the decision process (milliseconds)

## Appendix

### Principle

Data caching caches accessed remote data to the local BE node. The original data file is split into Blocks based on the accessed IO size, and Blocks are stored in the local file `cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset`, with Block metadata saved in the BE node. When accessing the same remote file, doris checks whether the cache data of the file exists in the local cache and determines which data to read from the local Block and which data to pull from the remote based on the Block's offset and size, caching the newly pulled remote data. When the BE node restarts, it scans the `cache_path` directory to restore Block metadata. When the cache size reaches the upper limit, it cleans up long-unused Blocks according to the LRU principle.