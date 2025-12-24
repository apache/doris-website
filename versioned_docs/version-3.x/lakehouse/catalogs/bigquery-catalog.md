---
{
    "title": "BigQuery Catalog",
    "language": "en",
    "description": "BigQuery Catalog uses the Trino Connector compatibility framework to access BigQuery tables through the BigQuery Connector."
}
---

BigQuery Catalog uses the [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) compatibility framework to access BigQuery tables through the BigQuery Connector.

:::note
This feature is experimental and has been supported since version 3.0.1.
:::

## Application Scenarios

| Scenario       | Description                          |
| -------------- | ------------------------------------ |
| Data Integration | Read BigQuery data and write it into Doris internal tables. |
| Data Writeback  | Not supported.                     |

## Environment Preparation

### Compile the BigQuery Connector Plugin

> JDK 17 is required.

```shell
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-bigquery
$ mvn clean install -DskipTest
```

After compilation, the `trino/plugin/trino-bigquery/target/` directory will contain the `trino-bigquery-435` folder.

You can also directly download the precompiled [trino-bigquery-435-20240724.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-bigquery-435-20240724.tar.gz) and extract it.

### Deploy the BigQuery Connector

Place the `trino-bigquery-435/` directory into the `connectors/` directory of the deployment paths for all FE and BE nodes. (If the directory does not exist, you can create it manually.)

```text
├── bin
├── conf
├── connectors
│   ├── trino-bigquery-435
...
```

After deployment, it is recommended to restart the FE and BE nodes to ensure the Connector is loaded correctly.

## Configuring Catalog

### Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name
PROPERTIES (
    'type' = 'trino-connector', -- required
    'trino.connector.name' = 'bigquery', -- required
    {TrinoProperties},
    {CommonProperties}
);
```

* `{TrinoProperties}`

  The TrinoProperties section is used to specify properties that will be passed to the Trino Connector. These properties use the `trino.` prefix. In theory, all properties supported by Trino are also supported here. For more information about BigQuery, refer to the [Trino documentation](https://trino.io/docs/435/connector/bigquery.html).

* `[CommonProperties]`

  The CommonProperties section is used to specify general properties. Please refer to the [Catalog Overview](../catalog-overview.md) under the "Common Properties" section.
  
### Supported BigQuery Versions

For more information about BigQuery properties, refer to the [Trino documentation](https://trino.io/docs/current/connector/bigquery.html).

## Column Type Mapping

| BigQuery Type | Trino Type                  | Doris Type    |
| ------------- | --------------------------- | ------------- |
| boolean       | boolean                     | boolean       |
| int64         | bigint                      | bigint        |
| float64       | double                      | double        |
| numeric       | decimal(P, S)               | decimal(P, S) |
| bignumric     | decimal(P, S)               | decimal(P, S) |
| string        | varchar                     | string        |
| bytes         | varbinary                   | string        |
| date          | date                        | date          |
| datetime      | timestamp(6)                | datetime(6)   |
| time          | time(6)                     | string        |
| timestamp     | timestamp with time zone(6) | datetime(6)   |
| geography     | varchar                     | string        |
| array         | array                       | array         |
| map           | map                         | map           |
| struct        | row                         | struct        |

## Examples

```sql
CREATE CATALOG bigquery_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'bigquery',
    'trino.bigquery.project-id' = 'your-bigquery-project-id',
    'trino.bigquery.credentials-file' = '/path/to/application_default_credentials.json',
);
```

## Query Operations

After configuring the Catalog, you can query the table data in the Catalog using the following methods:

```sql
-- 1. switch to catalog, use database and query
SWITCH bigquery_ctl;
USE bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- 2. use bigquery database directly
USE bigquery_ctl.bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM bigquery_ctl.bigquery_db.bigquery_tbl LIMIT 10;
```

