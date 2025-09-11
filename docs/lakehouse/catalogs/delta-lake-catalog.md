---
{
    "title": "Delta Lake Catalog",
    "language": "en"
}
---

Delta Lake Catalog uses the [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) compatibility framework to access Delta Lake tables through the Delta Lake Connector.

:::notice
This feature is experimental and has been supported since version 3.0.1.
:::

## Application Scenarios

| Scenario       | Description                          |
| -------------- | ------------------------------------ |
| Data Integration | Read Delta Lake data and write it into Doris internal tables. |
| Data Writeback  | Not supported.                     |

## Environment Preparation

### Compile the Delta Lake Connector Plugin

> JDK 17 is required.

```shell
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-delta-lake
$ mvn clean install -DskipTest
$ cd ../../lib/trino-hdfs
$ mvn clean install -DskipTest
```

After compiling, you will find the `trino-delta-lake-435` directory under `trino/plugin/trino-delta-lake/target/` and the `hdfs` directory under `trino/lib/trino-hdfs/target/`.

You can also directly download the precompiled [trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz) and [hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz), then extract them.

### Deploy the Delta Lake Connector

Place the `trino-delta-lake-435/` directory in the `connectors/` directory of all FE and BE deployment paths(If it does not exist, you can create it manually) and extract `hdfs.tar.gz` into the `trino-delta-lake-435/` directory.

```text
├── bin
├── conf
├── connectors
│   ├── trino-delta-lake-435
│   │   ├── hdfs
...
```

After deployment, it is recommended to restart the FE and BE nodes to ensure the Connector is loaded correctly.

## Configuring Catalog

### Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name
PROPERTIES (
    'type' = 'trino-connector', -- required
    'trino.connector.name' = 'delta_lake', -- required
    {TrinoProperties},
    {CommonProperties}
);
```

* `{TrinoProperties}`

  The TrinoProperties section is used to specify properties that will be passed to the Trino Connector. These properties use the `trino.` prefix. In theory, all properties supported by Trino are also supported here. For more information about Delta Lake, refer to the [Trino documentation](https://trino.io/docs/435/connector/delta-lake.html).

* `[CommonProperties]`

  The CommonProperties section is used to specify general properties. Please refer to the [Catalog Overview](../catalog-overview.md) under the "Common Properties" section.
  
### Supported Delta Lake Versions

For more information about Delta Lake, refer to the [Trino documentation](https://trino.io/docs/435/connector/delta-lake.html).

### Supported Metadata Services

For more information about Delta Lake, refer to the [Trino documentation](https://trino.io/docs/435/connector/delta-lake.html).

### Supported Storage Systems

For more information about Delta Lake, refer to the [Trino documentation](https://trino.io/docs/435/connector/delta-lake.html).

## Column Type Mapping

| Delta Lake Type | Trino Type                  | Doris Type    | Comment |
| --------------- | --------------------------- | ------------- | ------- |
| boolean         | boolean                     | boolean       |         |
| int             | int                         | int           |         |
| byte            | tinyint                     | tinyint       |         |
| short           | smallint                    | smallint      |         |
| long            | bigint                      | bigint        |         |
| float           | real                        | float         |         |
| double          | double                      | double        |         |
| decimal(P, S)   | decimal(P, S)               | decimal(P, S) |         |
| string          | varchar                     | string        |         |
| bianry          | varbinary                   | string        |         |
| date            | date                        | date          |         |
| timestamp\_ntz  | timestamp(N)                | datetime(N)   |         |
| timestamp       | timestamp with time zone(N) | datetime(N)   |         |
| array           | array                       | array         |         |
| map             | map                         | map           |         |
| struct          | row                         | struct        |         |

## Examples

```sql
CREATE CATALOG delta_lake_hms properties ( 
    'type' = 'trino-connector', 
    'trino.connector.name' = 'delta_lake',
    'trino.hive.metastore' = 'thrift',
    'trino.hive.metastore.uri'= 'thrift://ip:port',
    'trino.hive.config.resources'='/path/to/core-site.xml,/path/to/hdfs-site.xml'
);
```

## Query Operations

After configuring the Catalog, you can query the table data in the Catalog using the following methods:

```sql
-- 1. Switch to the catalog, use the database, and query
SWITCH delta_lake_ctl;
USE delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- 2. Use the Delta Lake database directly
USE delta_lake_ctl.delta_lake_db;
SELECT * FROM delta_lake_tbl LIMIT 10;

-- 3. Use the fully qualified name to query
SELECT * FROM delta_lake_ctl.delta_lake_db.delta_lake_tbl LIMIT 10;
```
