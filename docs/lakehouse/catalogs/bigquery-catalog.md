---
{
    "title": "BigQuery Catalog",
    "language": "en",
    "description": "Learn how to configure and use BigQuery Catalog in Apache Doris to connect to Google BigQuery data warehouse. Implement BigQuery table data querying, data integration, and real-time analytics through the Trino Connector framework. Supports Google Cloud ADC authentication and various data type mappings (including complex types like ARRAY, MAP, STRUCT). Provides complete installation, deployment, configuration parameters, and usage examples to help users quickly achieve data interoperability between BigQuery and Doris."
}
---

## Overview

BigQuery Catalog uses the Trino BigQuery Connector to access BigQuery tables through the [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/) compatibility framework.

:::note
- This feature is experimental and supported since version 3.0.1.
:::

:::note
- This feature does not depend on a Trino cluster environment and only uses the Trino compatibility plugin.
:::

### Use Cases

| Scenario         | Support Status                                    |
| ---------------- | ------------------------------------------------- |
| Data Integration | Read BigQuery data and write to Doris internal tables |
| Data Write-back  | Not supported                                     |

### Version Compatibility

- **Doris Version**: 3.0.1 and above
- **Trino Connector Version**: 435
- **BigQuery Version**: For supported versions, please refer to [Trino Documentation](https://trino.io/docs/435/connector/bigquery.html)

## Quick Start

### Step 1: Prepare Connector Plugin

You can choose one of the following methods to obtain the BigQuery Connector plugin:

**Method 1: Use Pre-compiled Package (Recommended)**

Download and extract the pre-compiled plugin package directly from [here](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724).

**Method 2: Manual Compilation**

If you need custom compilation, follow these steps (requires JDK 17):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-bigquery
mvn clean install -DskipTest
```

After compilation, you will get the `trino-bigquery-435/` directory under `trino/plugin/trino-bigquery/target/`.

### Step 2: Deploy Plugin

1. Place the `trino-bigquery-435/` directory in the `connectors/` directory under the deployment path of all FE and BE nodes (create the directory manually if it doesn't exist):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-bigquery-435
   ...
   ```

   > You can also customize the plugin path by modifying the `trino_connector_plugin_dir` configuration in `fe.conf`. For example: `trino_connector_plugin_dir=/path/to/connectors/`

2. Restart all FE and BE nodes to ensure the Connector is properly loaded.

### Step 3: Prepare Google Cloud Authentication

Before creating the Catalog, you need to configure Google Cloud authentication. The recommended method is Application Default Credentials (ADC):

1. Install gcloud CLI: <https://cloud.google.com/sdk/docs/install>

2. Execute the following commands for initialization and authentication:

    ```shell
    gcloud init --console-only --skip-diagnostics
    gcloud auth login
    gcloud auth application-default login
    ```

3. After successful authentication, the ADC credential file will be generated at `~/.config/gcloud/application_default_credentials.json`.

### Step 4: Create Catalog

**Basic Configuration Example**

```sql
CREATE CATALOG bigquery_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'bigquery',
    'trino.bigquery.project-id' = 'your-bigquery-project-id',
    'trino.bigquery.credentials-file' = '/path/to/application_default_credentials.json'
);
```

### Step 5: Query Data

After creating the Catalog, you can query BigQuery table data in three ways:

```sql
-- Method 1: Query after switching to Catalog
SWITCH bigquery_catalog;
USE bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- Method 2: Use two-level path
USE bigquery_catalog.bigquery_db;
SELECT * FROM bigquery_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM bigquery_catalog.bigquery_db.bigquery_tbl LIMIT 10;
```

## Configuration

### Catalog Configuration Parameters

The basic syntax for creating a BigQuery Catalog is as follows:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',             -- Required, fixed value
    'trino.connector.name' = 'bigquery',    -- Required, fixed value
    {TrinoProperties},                      -- Trino Connector related properties
    {CommonProperties}                      -- Common properties
);
```

#### TrinoProperties Parameters

TrinoProperties are used to configure Trino BigQuery Connector-specific properties, prefixed with `trino.`. Common parameters include:

| Parameter Name                        | Required | Default | Description                                    |
| ------------------------------------- | -------- | ------- | ---------------------------------------------- |
| `trino.bigquery.project-id`           | Yes      | -       | BigQuery project ID                            |
| `trino.bigquery.credentials-file`     | Yes      | -       | Google Cloud credentials file path             |
| `trino.bigquery.views-enabled`        | No       | false   | Whether to enable view support                 |
| `trino.bigquery.arrow-serialization.enabled` | No       | true    | Whether to enable Arrow serialization for performance |

For more BigQuery Connector configuration parameters, please refer to the [Trino Official Documentation](https://trino.io/docs/435/connector/bigquery.html).

#### CommonProperties Parameters

CommonProperties are used to configure common Catalog properties, such as metadata refresh policies and access control. For detailed information, please refer to the "Common Properties" section in [Catalog Overview](../catalog-overview.md).

## Data Type Mapping

When using BigQuery Catalog, data types are mapped according to the following rules:

| BigQuery Type | Trino Type                      | Doris Type    |
| ------------- | ------------------------------- | ------------- |
| boolean       | boolean                         | boolean       |
| int64         | bigint                          | bigint        |
| float64       | double                          | double        |
| numeric       | decimal(P, S)                   | decimal(P, S) |
| bignumeric    | decimal(P, S)                   | decimal(P, S) |
| string        | varchar                         | string        |
| bytes         | varbinary                       | string        |
| date          | date                            | date          |
| datetime      | timestamp(6)                    | datetime(6)   |
| time          | time(6)                         | string        |
| timestamp     | timestamp with time zone(6)     | datetime(6)   |
| geography     | varchar                         | string        |
| array         | array                           | array         |
| map           | map                             | map           |
| struct        | row                             | struct        |