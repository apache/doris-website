---
{
    "title": "MaxCompute Catalog",
    "language": "en",
    "description": "Apache Doris MaxCompute Catalog supports federated queries on Alibaba Cloud MaxCompute data, enabling data integration and write-back for cross-source analytics without data migration."
}
---

[MaxCompute](https://help.aliyun.com/zh/maxcompute/) is an enterprise-level SaaS (Software as a Service) cloud data warehouse on Alibaba Cloud. Through the open storage SDK provided by MaxCompute, Doris can retrieve MaxCompute table information and perform queries and writes.

## Applicable Scenarios

| Scenario | Description |
| ---- | ------------------------------------------------------ |
| Data Integration | Read MaxCompute data and write to Doris internal tables. |
| Data Write-back | Using INSERT command to write data into MaxCompute Table. (Supported since version 4.1.0) |

## Usage Notes

1. Starting from version 2.1.7, MaxCompute Catalog is developed based on the [Open Storage SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1). Prior to this version, it was developed based on the Tunnel API.

2. There are certain limitations when using the Open Storage SDK. Please refer to the `Usage Limitations` section in this [document](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1).

3. Before Doris version 3.1.3, a Project in MaxCompute corresponds to a Database in Doris. In version 3.1.3, you can introduce the MaxCompute schema hierarchy through the `mc.enable.namespace.schema` parameter.

## Configuring Catalog

### Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'max_compute',
    {McRequiredProperties},
    {McOptionalProperties},
    {CommonProperties}
);
```

* `{McRequiredProperties}`

  | Property Name | Description | Supported Doris Version |
  | ------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------ |
  | `mc.default.project` | The name of the MaxCompute project to access. You can create and manage projects in the [MaxCompute Project List](https://maxcompute.console.aliyun.com/cn-beijing/project-list). | |
  | `mc.access_key` | AccessKey. You can create and manage it in the [Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak). | |
  | `mc.secret_key` | SecretKey. You can create and manage it in the [Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak). | |
  | `mc.region` | The region where MaxCompute is activated. You can find the corresponding Region from the Endpoint. | Before 2.1.7 (exclusive) |
  | `mc.endpoint` | The region where MaxCompute is activated. Please refer to the "How to Obtain Endpoint and Quota" section below for configuration. | 2.1.7 (inclusive) and later |

* `{McOptionalProperties}`

  | Property Name | Default Value | Description | Supported Doris Version |
  | -------------------------- | ------------- | -------------------------------------------------------------------------- | ------------ |
  | `mc.tunnel_endpoint` | None | Refer to "Custom Service Address" in the appendix. | Before 2.1.7 (exclusive) |
  | `mc.odps_endpoint` | None | Refer to "Custom Service Address" in the appendix. | Before 2.1.7 (exclusive) |
  | `mc.quota` | `pay-as-you-go` | Quota name. Please refer to the "How to Obtain Endpoint and Quota" section below for configuration. | 2.1.7 (inclusive) and later |
  | `mc.split_strategy` | `byte_size` | Sets the split partitioning method. Can be set to partition by byte size `byte_size` or by row count `row_count`. | 2.1.7 (inclusive) and later |
  | `mc.split_byte_size` | `268435456` | The file size each split reads, in bytes. Default is 256MB. Only effective when `"mc.split_strategy" = "byte_size"`. | 2.1.7 (inclusive) and later |
  | `mc.split_row_count` | `1048576` | Number of rows each split reads. Only effective when `"mc.split_strategy" = "row_count"`. | 2.1.7 (inclusive) and later |
  | `mc.split_cross_partition` | `false` | Whether the generated splits cross partitions. | 2.1.8 (inclusive) and later |
  | `mc.connect_timeout` | `10s` | Connection timeout for MaxCompute. | 2.1.8 (inclusive) and later |
  | `mc.read_timeout` | `120s` | Read timeout for MaxCompute. | 2.1.8 (inclusive) and later |
  | `mc.retry_count` | `4` | Number of retries after timeout. | 2.1.8 (inclusive) and later |
  | `mc.datetime_predicate_push_down` | `true` | Whether to allow predicate push-down for `timestamp/timestamp_ntz` types. Doris loses precision (9 -> 6) when syncing these two types. Therefore, if the original data precision is higher than 6 digits, predicate push-down may lead to inaccurate results. | 2.1.9/3.0.5 (inclusive) and later |
  | `mc.account_format` | `name` | The account systems of Alibaba Cloud International and China sites are inconsistent. For international site users, if you encounter errors like `user 'RAM$xxxxxx:xxxxx' is not a valid aliyun account`, you can set this parameter to `id`. | 3.0.9/3.1.1 (inclusive) and later |
  | `mc.enable.namespace.schema` | `false` | Whether to support MaxCompute schema hierarchy. See: https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operations | 3.1.3 (inclusive) and later |
  | `mc.max_field_size_bytes` | `8388608` (8 MB) | Maximum bytes allowed for a single field in a write session. When writing data that contains large string or binary fields, the write may fail if the field size exceeds this value. You can increase this value based on your actual data. | 4.1.0 (inclusive) and later |

  - `mc.max_field_size_bytes`

    MaxCompute allows a maximum of 8 MB per field by default. If the data being written contains large string or binary fields, the write may fail.

    To adjust this limit, first execute the following command in the MaxCompute console SQL editor:

    `setproject odps.sql.cfile2.field.maxsize=262144;`

    This adjusts the maximum bytes for a single field. The unit is KB and the maximum value is 262144.

    Then set `mc.max_field_size_bytes` to 262144 in the Doris catalog properties (this value must not exceed the MaxCompute setting).

* `{CommonProperties}`

    The CommonProperties section is used to fill in common properties. Please refer to the "Common Properties" section in [Catalog Overview](../catalog-overview.md).

## Metadata Cache {#meta-cache}

To improve the performance of accessing external data sources, Apache Doris caches MaxCompute metadata. Metadata includes table structure (Schema) and partition lists.

:::tip
For versions before Doris 4.1.x, metadata caching is mainly controlled globally by FE configuration items. For details, see [Metadata Cache](../meta-cache.md).
Starting from Doris 4.1.x, MaxCompute Catalog's external metadata cache is configured using the unified `meta.cache.*` keys.
:::

### Unified Property Model (4.1.x+) {#meta-cache-unified-model}

Each engine's cache entry uses a unified configuration key format: `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity}`.

| Property | Example | Meaning |
|---|---|---|
| `enable` | `true/false` | Whether to enable this cache module. |
| `ttl-second` | `600`, `0`, `-1` | `0` means disable cache (takes effect immediately, can be used to see the latest data); `-1` means never expire; other positive integers mean TTL in seconds based on access time. |
| `capacity` | `10000` | Maximum number of cache entries (by count). `0` means disable. |

**Effective Logic:** The module cache only takes effect when `enable=true`, `ttl-second != 0`, and `capacity > 0`.

### Cache Modules {#meta-cache-unified-modules}

MaxCompute Catalog includes the following cache modules:

| Module (`<entry>`) | Property Key Prefix | Cached Content and Impact |
|---|---|---|
| `schema` | `meta.cache.maxcompute.schema.` | Caches table structure. Impact: Visibility of table column information. If disabled, the latest Schema is pulled for each query. |
| `partition_values` | `meta.cache.maxcompute.partition_values.` | Caches partition value lists. Impact: Partition pruning and enumeration. If disabled, new external partitions can be seen in real-time. |

### Legacy Parameter Mapping and Conversion {#meta-cache-mapping}

In version 4.1.x and later, unified keys are recommended. The following is the mapping between legacy Catalog properties and 4.1.x+ unified keys:

| Legacy Property Key | 4.1.x+ Unified Key | Description |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.maxcompute.schema.ttl-second` | Expiration time of table structure cache |

### Best Practices {#meta-cache-best-practices}

* **Real-time access to the latest data**: If you want each query to see the latest partition or schema changes for MaxCompute tables, you can set the `ttl-second` for `schema` or `partition_values` to `0`.
  ```sql
  -- Disable partition value cache to detect the latest partitions in MaxCompute tables
  ALTER CATALOG mc_ctl SET PROPERTIES ("meta.cache.maxcompute.partition_values.ttl-second" = "0");
  ```
* **Note**: `meta.cache.maxcompute.*` currently does not have a dedicated hot-reload hook. After changing the configuration, it is recommended to recreate the Catalog or restart FE to ensure it takes effect.

### Observability {#meta-cache-unified-observability}

Cache metrics can be observed through the `information_schema.catalog_meta_cache_statistics` system table:

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'mc_ctl' AND engine_name = 'maxcompute'
ORDER BY entry_name;
```

See the documentation for this system table: [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

### Supported MaxCompute Versions

Only the public cloud version of MaxCompute is supported. For private cloud version support, please contact Doris community support.

### Supported MaxCompute Tables

* Supports reading partitioned tables, clustered tables, and materialized views.

* Does not support reading MaxCompute external tables, logical views, or Delta Tables.

## Hierarchy Mapping

- When `mc.enable.namespace.schema` is false

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | N/A |
  | Database | Project |
  | Table | Table |

- When `mc.enable.namespace.schema` is true

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | Project |
  | Database | Schema |
  | Table | Table |

## Column Type Mapping

| MaxCompute Type | Doris Type | Comment |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| boolean | boolean | |
| tiny | tinyint | |
| tinyint | tinyint | |
| smallint | smallint | |
| int | int | |
| bigint | bigint | |
| float | float | |
| double | double | |
| decimal(P, S) | decimal(P, S) | 1 <= P <= 38, 0 <= scale <= 18 |
| char(N) | char(N) | |
| varchar(N) | varchar(N) | |
| string | string | |
| date | date | |
| datetime | datetime(3) | Fixed mapping to precision 3. You can specify the timezone via `SET [GLOBAL] time_zone = 'Asia/Shanghai'`. |
| timestamp_ntz | datetime(6) | MaxCompute's `timestamp_ntz` precision is 9, while Doris's DATETIME maximum precision is only 6, so the extra part is truncated when reading data. |
| timestamp | datetime(6) | Supported since 2.1.9/3.0.5. MaxCompute's `timestamp` precision is 9, while Doris's DATETIME maximum precision is only 6, so the extra part is truncated when reading data. |
| array | array | |
| map | map | |
| struct | struct | |
| other | UNSUPPORTED | |

## Basic Example

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'sk',
    'mc.secret_key' = 'ak',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.MaxCompute.aliyun-inc.com/api'
);
```

If using a version before 2.1.7 (exclusive), please use the following statement. (It is recommended to upgrade to 2.1.8 or later)

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com'
);
```

With Schema support:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com',
    'mc.enable.namespace.schema' = 'true'
);
```

## Query Operations

### Basic Query

```sql
-- 1. switch to catalog, use database and query
SWITCH mc_ctl;
USE mc_ctl;
SELECT * FROM mc_tbl LIMIT 10;

-- 2. use mc database directly
USE mc_ctl.mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM mc_ctl.mc_db.mc_tbl LIMIT 10;
```

### Query Optimization

- LIMIT Query Optimization (Since 4.1.0)

    This parameter is only applicable to scenarios where `LIMIT 1` is frequently used to check whether data exists.

    When querying MaxCompute tables, if the query contains only partition column equality predicates (`=` or `IN`) with a `LIMIT` clause, you can enable the Session Variable `enable_mc_limit_split_optimization` to optimize the split generation strategy.

    When enabled, the system uses a `row_offset` strategy to read only the required number of rows, instead of generating splits for all data. This can reduce the split count from many to exactly one, significantly reducing query latency.

    This optimization applies to queries like:

    ```sql
    SELECT * FROM mc_tbl WHERE pt = 'value' LIMIT 100;
    SELECT * FROM mc_tbl WHERE pt IN ('v1', 'v2') LIMIT 100;
    ```

    To enable:

    ```sql
    SET enable_mc_limit_split_optimization = true;
    ```

    > This parameter is disabled by default. The optimization will not take effect when the query contains non-partition column filters, non-equality predicates (such as `>`, `<`, `!=`), or does not have a `LIMIT` clause.

## Write Operations

Starting from version 4.1.0, Doris supports write operations to MaxCompute tables. You can use standard INSERT statements to write data from other data sources directly to MaxCompute tables through Doris.

:::note
- This is an experimental feature, supported since version 4.1.0.
- Supports writing to both partitioned and non-partitioned tables.
- Does not support writing to clustered tables, transactional tables, Delta Tables, or external tables.
:::

### INSERT INTO

The INSERT operation appends data to the target table.

Example:

```sql
INSERT INTO mc_tbl values (val1, val2, val3, val4);
INSERT INTO mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO mc_tbl(col1, col2) values (val1, val2);
INSERT INTO mc_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");

-- Write to specified partition (you can specify only some partition columns, with remaining partitions written dynamically)
INSERT INTO mc_tbl PARTITION(ds='20250201') SELECT id, name FROM source_tbl;
INSERT INTO mc_tbl PARTITION(ds='20250101', region='bj') VALUES (1, 'v1'), (2, 'v2');
```

### INSERT OVERWRITE

INSERT OVERWRITE completely overwrites the existing data in the table with new data.

```sql
INSERT OVERWRITE TABLE mc_tbl VALUES(val1, val2, val3, val4);
INSERT OVERWRITE TABLE mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specified partition
INSERT OVERWRITE TABLE mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### CTAS

You can create a MaxCompute table and write data using the `CTAS` statement:

```sql
CREATE TABLE mc_tbl AS SELECT * FROM other_table;
```

## Database and Table Management

Starting from version 4.1.0, Doris supports creating and dropping MaxCompute databases and tables.

:::note
- This is an experimental feature, supported since version 4.1.0.
- Supports creating and dropping partitioned and non-partitioned tables.
- Does not support creating clustered tables, transactional tables, Delta Tables, or external tables.
:::

> This feature is only available when the `mc.enable.namespace.schema` property is set to `true`.

### Creating and Dropping Databases

You can switch to the corresponding Catalog using the `SWITCH` statement and execute the `CREATE DATABASE` statement:

```sql
SWITCH mc;
CREATE DATABASE [IF NOT EXISTS] mc_schema;
```

You can also create using the fully qualified name:

```sql
CREATE DATABASE [IF NOT EXISTS] mc.mc_schema;
```

Drop database:

```sql
DROP DATABASE [IF EXISTS] mc.mc_schema;
```

:::caution
For MaxCompute Database, after deletion, all tables under it will also be deleted.
:::

### Creating and Dropping Tables

* **Create**

  Doris supports creating partitioned or non-partitioned tables in MaxCompute.

  Example:

  ```sql
  CREATE TABLE mc_schema.mc_tbl1 (
      bool_col BOOLEAN,
      int_col INT,
      bigint_col BIGINT,
      float_col FLOAT,
      double_col DOUBLE,
      decimal_col DECIMAL(18,6),
      string_col STRING,
      varchar_col VARCHAR(200),
      char_col CHAR(50),
      date_col DATE,
      datetime_col DATETIME,
      arr_col ARRAY<STRING>,
      map_col MAP<STRING, STRING>,
      struct_col STRUCT<f1:STRING, f2:INT>
  );

  CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
  )
  PARTITION BY (ds, region)();
  ```

* **Drop**

  You can drop a MaxCompute table using the `DROP TABLE` statement. Currently, dropping a table will also delete the data, including partition data.

  Example:

  ```sql
  DROP TABLE [IF EXISTS] mc_tbl;
  ```

## FAQ

### How to Obtain Endpoint and Quota (Applicable for Doris 2.1.7 and Later)

1. If using exclusive resource groups for data transfer service

    Please refer to the "2. Authorization" section in the "Using Exclusive Data Service Resource Groups" chapter in this [document](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts) to enable the corresponding permissions. In the "Quota Management" list, view and copy the corresponding `QuotaName`, and specify `"mc.quota" = "QuotaName"`. At this point, you can choose either VPC or public network to access MaxCompute, but VPC has guaranteed bandwidth while public network bandwidth resources are limited.

2. If using pay-as-you-go

    Please refer to the "Using Open Storage (Pay-as-you-go)" section in this [document](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) to enable the Open Storage (Storage API) switch and grant permissions to the user corresponding to the AK and SK. In this case, `mc.quota` is the default value `pay-as-you-go`, and you do not need to specify this value additionally. With pay-as-you-go, you can only use VPC to access MaxCompute and cannot access via public network. Only prepaid users can access MaxCompute via public network.

3. Configure `mc.endpoint` according to the "Region Endpoint Reference Table" in the [Alibaba Cloud Endpoints documentation](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)

    Users accessing via VPC need to configure `mc.endpoint` according to the "VPC Network Endpoint" column in the "Regional Endpoint Reference Table (Alibaba Cloud VPC Network Connection Method)" table. Users accessing via public network can choose from the "Classic Network Endpoint" column in the "Regional Endpoint Reference Table (Alibaba Cloud Classic Network Connection Method)" table, or the "External Network Endpoint" column in the "Regional Endpoint Reference Table (External Network Connection Method)" table to configure `mc.endpoint`.

### Custom Service Address (Applicable for Versions Before Doris 2.1.7)

In versions before Doris 2.1.7, the Tunnel SDK is used to interact with MaxCompute, so the following two endpoint properties are required:

* `mc.odps_endpoint`: MaxCompute Endpoint, used to retrieve MaxCompute metadata (database and table information).

* `mc.tunnel_endpoint`: Tunnel Endpoint, used to read MaxCompute data.

By default, MaxCompute Catalog generates endpoints based on `mc.region` and `mc.public_access`.

The generated format is as follows:

| `mc.public_access` | `mc.odps_endpoint` | `mc.tunnel_endpoint` |
| ------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| false | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| true | `http://service.{mc.region}.maxcompute.aliyun.com/api` | `http://dt.{mc.region}.maxcompute.aliyun.com` |

Users can also specify `mc.odps_endpoint` and `mc.tunnel_endpoint` individually to customize the service address, which is suitable for some privately deployed MaxCompute environments.

For configuring MaxCompute Endpoint and Tunnel Endpoint, please refer to [Endpoints for Different Regions and Network Connection Methods](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints).

### Resource Usage Control

Users can adjust the [table-level request concurrency](https://help.aliyun.com/zh/maxcompute/user-guide/data-transfer-service-quota-manage?spm=a2c4g.11186623.help-menu-search-27797.d_2) by adjusting the two Session Variables `parallel_pipeline_task_num` and `num_scanner_threads` to control resource consumption in the data transfer service. The corresponding concurrency equals `max(parallel_pipeline_task_num * be num * num_scanner_threads)`.

Note:

1. This method can only control the concurrent request count for a single table within a single Query, and cannot control resource usage across multiple SQL statements.

2. Reducing concurrency means increasing the Query execution time.

### Write Best Practices

- It is recommended to write to specified partitions whenever possible, e.g. `INSERT INTO mc_tbl PARTITION(ds='20250201')`. When no partition is specified, due to limitations of the MaxCompute Storage API, data for each partition must be written sequentially. As a result, the execution plan will sort data based on the partition columns, which can consume significant memory resources when the data volume is large and may cause the write to fail.

- When writing without specifying a partition, do not set `set enable_strict_consistency_dml=false`. This forcefully removes the sort node, causing partition data to be written out of order, which will ultimately result in an error from MaxCompute.

- Do not add a `LIMIT` clause. When a `LIMIT` clause is added, Doris will use only a single thread for writing to guarantee the write count. This can be used for small-scale testing, but if the `LIMIT` value is large, write performance will be poor.

### Write Error: `Data invalid: ODPS-0020041:StringOutOfMaxLength`

Refer to the description of `mc.max_field_size_bytes`.
