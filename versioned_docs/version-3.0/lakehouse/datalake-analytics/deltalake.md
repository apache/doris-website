---
{
    "title": "Delta Lake Catalog",
    "language": "en"
}
---

Delta Lake Catalog is compatible with the [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/), using the Delta Lake Connector to access Delta Lake tables.

> This feature is supported starting from Doris version 3.0.1.

:::tip Note
This is an experimental feature.
:::

## Instructions for Use

1. Before accessing Delta Lake tables with the Trino Catalog, you must first compile the Trino Delta Lake plugin and place it in the specified directory. Refer to the following steps for specific instructions.
2. The current Doris is compatible with the Trino 435 version plugin. Using a Trino plugin lower or higher than version 435 may cause compatibility issues.
3. Time Travel feature of Delta Lake is not supported at the moment.
4. Querying Delta Lake history information is not supported at the moment.

## Compiling the Delta Lake Connector Plugin

> JDK version 17 is required.

```Plain Text
$ git clone https://github.com/apache/Doris-thirdparty.git
$ cd Doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-delta-lake
$ mvn clean install -DskipTest
$ cd ../../lib/trino-hdfs
$ mvn clean install -DskipTest
```

After compiling, you will find the `trino-delta-lake-435` directory under `trino/plugin/trino-delta-lake/target/` and the `hdfs` directory under `trino/lib/trino-hdfs/target/`.

You can also directly download the precompiled [trino-delta-lake-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-delta-lake-435-20240724.tar.gz) and [hdfs.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-hdfs-435-20240724.tar.gz), then extract them.

## Deploying the Delta Lake Connector

Place the `trino-delta-lake-435/` directory in the `connectors/` directory of all FE and BE deployment paths(If it does not exist, you can create it manually) and extract `hdfs.tar.gz` into the `trino-delta-lake-435/` directory.

```Plain Text
├── bin
├── conf
├── connectors
│   ├── trino-delta-lake-435
│   │   ├── hdfs
...
```

After deployment, it is recommended to restart the FE and BE nodes to ensure the Connector is correctly loaded.

## Creating the Delta Lake Catalog

```sql
create catalog delta_lake_catalog properties ( 
    "type"="trino-connector", 
    "trino.connector.name"="delta_lake",
    "trino.hive.metastore"="thrift",
    "trino.hive.metastore.uri"= "thrift://ip:portrait ",
    "trino.hive.config.resources"="/path/to/core-site.xml,/path/to/hdfs-site.xml"
);
```

Note: Properties prefixed with `trino.` are native Trino properties. For more information about Delta Lake properties, refer to the [Trino documentation](https://trino.io/docs/current/connector/delta-lake.html).

## Column Type Mapping

|Delta Lake|Trino|Doris|
| ----- | ----- | ----- |
|BOOLEAN|BOOLEAN|BOOLEAN|
|INTEGER|INTEGER|INT|
|BYTE|TINYINT|TINYINT|
|SHORT|SMALLINT|SMALLINT|
|LONG|BIGINT|BIGINT|
|FLOAT|REAL|FLOAT|
|DOUBLE|DOUBLE|DOUBLE|
|DECIMAL(p,s)|DECIMAL(p,s)|DECIMAL(p,s)|
|STRING|VARCHAR|STRING|
|BINARY|VARBINARY|STRING|
|DATE|DATE|DATE|
|TIMESTAMPNTZ (TIMESTAMP\_NTZ)|TIMESTAMP(6)|DATETIME|
|TIMESTAMP|TIMESTAMP(3) WITH TIME ZONE|DATETIME|
|ARRAY|ARRAY|ARRAY|
|MAP|MAP|MAP|
|STRUCT|ROW|STRUCT|

