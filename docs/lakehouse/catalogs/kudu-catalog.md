---
{
    "title": "Kudu Catalog",
    "language": "en",
    "description": "Apache Doris Kudu Catalog guide: Connect to Kudu database through Trino Connector framework to query and integrate Kudu table data. Supports Kerberos authentication, multiple data type mappings, and enables quick data integration between Kudu and Doris."
}
---

## Overview

Kudu Catalog accesses Kudu tables through the [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/) compatibility framework using Trino Kudu Connector.

:::note
- This is an experimental feature, supported since version 3.0.1.
:::

:::note
- This feature does not depend on a Trino cluster environment and only uses the Trino compatibility plugin.
:::

### Use Cases

| Scenario          | Support Status                                    |
| ----------------- | ------------------------------------------------- |
| Data Integration  | Read Kudu data and write to Doris internal tables |
| Data Write-back   | Not supported                                     |

### Version Compatibility

- **Doris Version**: 3.0.1 and above
- **Trino Connector Version**: 435
- **Kudu Version**: For supported versions, please refer to [Trino Documentation](https://trino.io/docs/435/connector/kudu.html)

## Quick Start

### Step 1: Prepare Connector Plugin

You can choose one of the following methods to obtain the Kudu Connector plugin:

**Method 1: Use Pre-compiled Package (Recommended)**

Download and extract the pre-compiled plugin package from [here](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724).

**Method 2: Manual Compilation**

If you need custom compilation, follow these steps (requires JDK 17):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kudu
mvn clean package -Dmaven.test.skip=true
```

After compilation, you will get the `trino-kudu-435/` directory in `trino/plugin/trino-kudu/target/`.

### Step 2: Deploy Plugin

1. Place the `trino-kudu-435/` directory under the `connectors/` directory of all FE and BE deployment paths (create the directory manually if it doesn't exist):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kudu-435
   ...
   ```

   > You can also customize the plugin path by modifying the `trino_connector_plugin_dir` configuration in `fe.conf`. For example: `trino_connector_plugin_dir=/path/to/connectors/`

2. Restart all FE and BE nodes to ensure the Connector is properly loaded.

### Step 3: Create Catalog

**Basic Configuration (Without Authentication)**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'NONE'
);
```

**Kerberos Authentication Configuration**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'KERBEROS',
    'trino.kudu.authentication.client.principal' = 'user@DOMAIN.COM',
    'trino.kudu.authentication.client.keytab' = '/path/to/kudu.keytab',
    'trino.kudu.authentication.config' = '/etc/krb5.conf',
    'trino.kudu.authentication.server.principal.primary' = 'kudu'
);
```

### Step 4: Query Data

After creating the Catalog, you can query Kudu table data using one of the following three methods:

```sql
-- Method 1: Query after switching to Catalog
SWITCH kudu_catalog;
USE kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- Method 2: Use two-level path
USE kudu_catalog.kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM kudu_catalog.kudu_db.kudu_tbl LIMIT 10;
```

## Configuration

### Catalog Configuration Parameters

The basic syntax for creating a Kudu Catalog is as follows:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kudu',     -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```

#### TrinoProperties Parameters

TrinoProperties are used to configure Trino Kudu Connector specific properties, prefixed with `trino.`. Common parameters include:

| Parameter Name                                        | Required | Default | Description                            |
| ----------------------------------------------------- | -------- | ------- | -------------------------------------- |
| `trino.kudu.client.master-addresses`                  | Yes      | -       | List of Kudu Master node addresses     |
| `trino.kudu.authentication.type`                      | No       | NONE    | Authentication type: NONE or KERBEROS  |
| `trino.kudu.authentication.client.principal`          | No       | -       | Kerberos client principal              |
| `trino.kudu.authentication.client.keytab`             | No       | -       | Kerberos keytab file path              |
| `trino.kudu.authentication.config`                    | No       | -       | Kerberos configuration file path       |
| `trino.kudu.authentication.server.principal.primary`  | No       | -       | Kudu server principal prefix           |

For more Kudu Connector configuration parameters, please refer to [Trino Official Documentation](https://trino.io/docs/435/connector/kudu.html).

#### CommonProperties Parameters

CommonProperties are used to configure general Catalog properties, such as metadata refresh policies, access control, etc. For detailed information, please refer to the "Common Properties" section in [Catalog Overview](../catalog-overview.md).

## Data Type Mapping

When using Kudu Catalog, data types are mapped according to the following rules:

| Kudu Type        | Trino Type    | Doris Type    | Notes                                                                                |
| ---------------- | ------------- | ------------- | ------------------------------------------------------------------------------------ |
| boolean          | boolean       | boolean       |                                                                                      |
| int8             | tinyint       | tinyint       |                                                                                      |
| int16            | smallint      | smallint      |                                                                                      |
| int32            | integer       | int           |                                                                                      |
| int64            | bigint        | bigint        |                                                                                      |
| float            | real          | float         |                                                                                      |
| double           | double        | double        |                                                                                      |
| decimal(P, S)    | decimal(P, S) | decimal(P, S) |                                                                                      |
| binary           | varbinary     | string        | Use `HEX(col)` function to query for display results consistent with Trino          |
| string           | varchar       | string        |                                                                                      |
| date             | date          | date          |                                                                                      |
| unixtime_micros  | timestamp(3)  | datetime(3)   |                                                                                      |
| other            | UNSUPPORTED   | -             | Unsupported type                                                                     |

:::tip
For `binary` type, if you need to display in hexadecimal format, use the `HEX()` function to wrap the column name, for example: `SELECT HEX(binary_col) FROM table`.
:::
