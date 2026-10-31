---
{
    "title": "Kudu Catalog",
    "language": "en",
    "description": "Kudu Catalog uses the Trino Connector compatibility framework to access Kudu tables through the Kudu Connector."
}
---

Kudu Catalog uses the [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) compatibility framework to access Kudu tables through the Kudu Connector.

:::note
This feature is experimental and has been supported since version 3.0.1.
:::

## Application Scenarios

| Scenario       | Description                          |
| -------------- | ------------------------------------ |
| Data Integration | Read Kudu data and write it into Doris internal tables. |
| Data Writeback  | Not supported.                     |

## Environment Preparation

### Compile the Kudu Connector Plugin

> JDK 17 is required.

```shell
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-kudu
$ mvn clean package -Dmaven.test.skip=true
```

After compilation, the `trino/plugin/trino-kudu/target/` directory will contain the `trino-kudu-435` folder.

You can also directly download the precompiled [trino-kudu-435-20240724.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-kudu-435-20240724.tar.gz) and extract it.

### Deploy the Kudu Connector

Place the `trino-kudu-435/` directory into the `connectors/` directory of the deployment paths for all FE and BE nodes. (If the directory does not exist, you can create it manually.)

```text
├── bin
├── conf
├── connectors
│   ├── trino-kudu-435
...
```

After deployment, it is recommended to restart the FE and BE nodes to ensure the Connector is loaded correctly.

## Configuring Catalog

### Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector', -- required
    'trino.connector.name' = 'kudu', -- required
    {TrinoProperties},
    {CommonProperties}
);
```

* `{TrinoProperties}`

  The `TrinoProperties` section is used to specify properties that will be passed to the Trino Connector. These properties are prefixed with `trino.`. In theory, all properties supported by Trino are also supported here. For more information about Kudu properties, refer to the [Trino documentation](https://trino.io/docs/current/connector/kudu.html).

* `[CommonProperties]`

  The CommonProperties section is used to specify general properties. Please refer to the [Catalog Overview](../catalog-overview.md) under the "Common Properties" section.
  
### Supported Kudu Versions

For more information about Kudu, refer to the [Trino documentation](https://trino.io/docs/current/connector/kudu.html).

### Supported Metadata Services

For more information about Kudu, refer to the [Trino documentation](https://trino.io/docs/current/connector/kudu.html).

### Supported Storage Systems

For more information about Kudu, refer to the [Trino documentation](https://trino.io/docs/current/connector/kudu.html).

## Column Type Mapping

| Kudu Type        | Trino Type    | Doris Type    | Comment                                                                 |
| ---------------- | ------------- | ------------- | ----------------------------------------------------------------------- |
| boolean          | boolean       | boolean       |                                                                         |
| int8             | tinyint       | tinyint       |                                                                         |
| int16            | smallint      | smallint      |                                                                         |
| int32            | integer       | int           |                                                                         |
| int64            | bigint        | bigint        |                                                                         |
| float            | real          | float         |                                                                         |
| double           | double        | double        |                                                                         |
| decimal(P, S)    | decimal(P, S) | decimal(P, S) |                                                                         |
| binary           | varbinary     | string        | Requires using `HEX(col)` in queries to return results displayed the same as in Trino. |
| string           | varchar       | string        |                                                                         |
| date             | date          | date          |                                                                         |
| unixtime_micros  | timestamp(3)  | datetime(3)   |                                                                         |
| other            |   |       UNSUPPORTED        |                                                                         |

## Examples

```sql
CREATE CATALOG kudu_catalog PROPERTIES (  
    'type' = 'trino-connector',  
    'trino.connector.name' = 'kudu', 
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3,port3', 
    'trino.kudu.authentication.type' = 'NONE'
);
```

## Query Operations

After configuring the Catalog, you can query the table data in the Catalog using the following methods:

```sql
-- 1. switch to catalog, use database and query
SWITCH kudu_ctl;
USE kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- 2. use kudu database directly
USE kudu_ctl.kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM kudu_ctl.kudu_db.kudu_tbl LIMIT 10;
```


