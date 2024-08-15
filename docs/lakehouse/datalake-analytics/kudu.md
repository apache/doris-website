---
{
    "title": "Kudu Catalog",
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

Kudu Catalog is compatible with the [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/) framework, using the Kudu Connector to access Kudu tables.

> This feature is supported starting from Doris version 3.0.1.

:::tip Note
This is an experimental feature.
:::

## Instructions for Use

1. Before accessing Kudu tables using the Trino Catalog, you must first compile the Trino Kudu plugin and place it in the specified directory. Refer to the following steps for detailed instructions.
2. The current Doris is compatible with the Trino 435 version plugin. Using a Trino plugin lower or higher than version 435 may cause compatibility issues.
3. Due to the Trino 435 version Kudu plugin not supporting the DATE type, it is recommended to use the Kudu plugin we provide.

## Compiling the Kudu Connector Plugin

> JDK version 17 is required.

```Plain Text
$ git clone https://github.com/apache/Doris-thirdparty.git
$ cd Doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-kudu
$ mvn clean package -Dmaven.test.skip=true
```

After compiling, you will find the `trino-kudu-435/` directory under `trino/plugin/trino-kudu/target/`.

You can also directly download our precompiled [trino-kudu-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-kudu-435-20240724.tar.gz) and extract it.

## Deploying the Kudu Connector

Place the `trino-kudu-435/` directory in the `connectors/` directory of all FE and BE deployment paths. (If it does not exist, you can create it manually).

```Plain Text
├── bin
├── conf
├── connectors
│   ├── trino-kudu-435
...
```

After deployment, it is recommended to restart the FE and BE nodes to ensure the Connector is correctly loaded.

## Creating the Kudu Catalog

```sql
create catalog kudu_catalog properties (  
    "type"="trino-connector",  
    "trino.connector.name"="kudu", 
    "trino.kudu.client.master-addresses"="ip1:port1,ip2:port2,ip3,port3", 
    "trino.kudu.authentication.type" = "NONE" 
);
```

Note: Properties prefixed with `trino.` are native Trino properties. For more information on Kudu properties, refer to the [Trino documentation](https://trino.io/docs/current/connector/kudu.html).

## Column Type Mapping

|Kudu|Trino|Doris|Description|
| ----- | ----- | ----- |----|
|BOOLEAN|BOOLEAN|BOOLEAN||
|INT8|TINYINT|TINYINT||
|INT16|SMALLINT|SMALLINT||
|INT32|INTEGER|INT||
|INT64|BIGINT|BIGINT||
|FLOAT|REAL|FLOAT||
|DOUBLE|DOUBLE|DOUBLE||
|BINARY|VARBINARY|STRING| Needs HEX(col) to display the same as Trino |
|STRING|VARCHAR|STRING||
|DECIMAL(p,s)|DECIMAL(p,s)|DECIMAL(p,s)||
|DATE|DATE|DATE||
|UNIXTIME_MICROS | TIMESTAMP(3) | DATETIME(3)| |
| VARCHAR | UNSUPPORTED|||
| UTF-8 encoded string| UNSUPPORTED|||

