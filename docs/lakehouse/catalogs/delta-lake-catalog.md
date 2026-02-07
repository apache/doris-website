---
{
    "title": "Delta Lake Catalog",
    "language": "en",
    "description": "Apache Doris Delta Lake Catalog User Guide: Connect to Delta Lake data lake through Trino Connector framework to query and integrate Delta Lake table data. Supports Hive Metastore, multiple data type mappings, and quick integration between Delta Lake and Doris."
}
---

## Overview

Delta Lake Catalog uses the [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/) compatibility framework with Trino Delta Lake Connector to access Delta Lake tables.

:::note
This is an experimental feature, supported since version 3.0.1.
:::

:::note
This feature does not depend on a Trino cluster environment, it only uses the Trino compatibility plugin.
:::

### Use Cases

| Scenario | Support Status |
| -------- | -------------- |
| Data Integration | Read Delta Lake data and write to Doris internal tables |
| Data Write-back | Not supported |

### Version Compatibility

- **Doris Version**: 3.0.1 and above
- **Trino Connector Version**: 435
- **Delta Lake Version**: For supported versions, please refer to [Trino Documentation](https://trino.io/docs/435/connector/delta-lake.html)

## Quick Start

### Step 1: Prepare Connector Plugin

You can obtain the Delta Lake Connector plugin using one of the following methods:

**Method 1: Use Pre-compiled Package (Recommended)**

Download the pre-compiled [trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz) and [hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz) and extract them.

**Method 2: Manual Compilation**

If you need custom compilation, follow these steps (requires JDK 17):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-delta-lake
mvn clean install -DskipTests
cd ../../lib/trino-hdfs
mvn clean install -DskipTests
```

After compilation, you'll get the `trino-delta-lake-435` directory under `trino/plugin/trino-delta-lake/target/`, and the `hdfs` directory under `trino/lib/trino-hdfs/target/`.

### Step 2: Deploy Plugin

1. Place the `trino-delta-lake-435/` directory under the `connectors/` directory of all FE and BE deployment paths (create the directory manually if it doesn't exist):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-delta-lake-435
   │           ├── hdfs
   ...
   ```

   > You can also customize the plugin path by modifying the `trino_connector_plugin_dir` configuration in `fe.conf`. For example: `trino_connector_plugin_dir=/path/to/connectors/`

2. Restart all FE and BE nodes to ensure the connector is loaded correctly.

### Step 3: Create Catalog

**Basic Configuration**

```sql
CREATE CATALOG delta_lake_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'delta_lake',
    'trino.hive.metastore' = 'thrift',
    'trino.hive.metastore.uri' = 'thrift://ip:port',
    'trino.hive.config.resources' = '/path/to/core-site.xml,/path/to/hdfs-site.xml'
);
```

**Configuration Description**

- `trino.hive.metastore`: Metadata service type, supports `thrift` (Hive Metastore), etc.
- `trino.hive.metastore.uri`: Hive Metastore service address
- `trino.hive.config.resources`: Hadoop configuration file path, multiple files separated by commas

For more configuration options, please refer to the "Configuration Description" section below or [Trino Official Documentation](https://trino.io/docs/435/connector/delta-lake.html).

### Step 4: Query Data

After creating the Catalog, you can query Delta Lake table data using one of the following three methods:

```sql
-- Method 1: Switch to Catalog then query
SWITCH delta_lake_catalog;
USE delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- Method 2: Use two-level path
USE delta_lake_catalog.delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM delta_lake_catalog.delta_lake_db.delta_lake_tbl LIMIT 10;
```

## Configuration Description

### Catalog Configuration Parameters

The basic syntax for creating a Delta Lake Catalog is as follows:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',            -- Required, fixed value
    'trino.connector.name' = 'delta_lake', -- Required, fixed value
    {TrinoProperties},                     -- Trino Connector related properties
    {CommonProperties}                     -- Common properties
);
```

#### TrinoProperties Parameters

TrinoProperties are used to configure Trino Delta Lake Connector specific properties, these properties are prefixed with `trino.`. Common parameters include:

| Parameter Name | Required | Default Value | Description |
| -------------- | -------- | ------------- | ----------- |
| `trino.hive.metastore` | Yes | - | Metadata service type, such as `thrift` |
| `trino.hive.metastore.uri` | Yes | - | Hive Metastore service address |
| `trino.hive.config.resources` | No | - | Hadoop configuration file path, multiple files separated by commas |
| `trino.delta.hide-non-delta-tables` | No | false | Whether to hide non-Delta Lake tables |

For more Delta Lake Connector configuration parameters, please refer to [Trino Official Documentation](https://trino.io/docs/435/connector/delta-lake.html).

#### CommonProperties Parameters

CommonProperties are used to configure common Catalog properties, such as metadata refresh policies, permission control, etc. For detailed information, please refer to the "Common Properties" section in [Catalog Overview](../catalog-overview.md).

## Data Type Mapping

When using Delta Lake Catalog, data types are mapped according to the following rules:

| Delta Lake Type | Trino Type | Doris Type | Notes |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | int | int | |
| byte | tinyint | tinyint | |
| short | smallint | smallint | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| decimal(P, S) | decimal(P, S) | decimal(P, S) | |
| string | varchar | string | |
| binary | varbinary | string | |
| date | date | date | |
| timestamp_ntz | timestamp(N) | datetime(N) | |
| timestamp | timestamp with time zone(N) | datetime(N) | |
| array | array | array | |
| map | map | map | |
| struct | row | struct | |