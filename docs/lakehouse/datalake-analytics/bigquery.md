---
{
    "title": "BigQuery Catalog",
    "language": "zh-CN"
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

# BigQuery Catalog {#bigquery-catalog}

BigQuery Catalog is compatible with the [Trino Connector](../../../../docusaurus-plugin-content-docs-community/current/how-to-contribute/trino-connector-developer-guide.md) framework, using the BigQuery Connector to access BigQuery tables.

> This feature is supported starting from Doris version 3.0.1.

:::tip Note
This is an experimental feature.
:::

## Instructions for Use

1. Before accessing BigQuery tables using the Trino Catalog, you must first compile the Trino BigQuery plugin and place it in the specified directory. Refer to the following steps for detailed instructions.
2. The current Doris is compatible with the Trino 435 version plugin. If you use a Trino plugin lower or higher than version 435, compatibility issues may arise.

## Compiling the BigQuery Connector Plugin

> JDK version 17 is required.

```Plain Text
$ git clone https://github.com/apache/Doris-thirdparty.git
$ cd Doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-bigquery
$ mvn clean install -DskipTest
```

After compilation, you will find the `trino-bigquery-435/` directory under `trino/plugin/trino-bigquery/target/`.

You can also directly download our precompiled [trino-bigquery-435-20240724.tar.gz](https://github.com/apache/Doris-thirdparty/releases/download/trino-435-20240724/trino-bigquery-435-20240724.tar.gz) and extract it.

## Deploying the BigQuery Connector

Place the `trino-bigquery-435/` directory in the `connectors/` directory of all FE and BE deployment paths (create manually if not present).

```Plain Text
├── bin
├── conf
├── connectors
│   ├── trino-bigquery-435
...
```

After deployment, it is recommended to restart the FE and BE nodes to ensure the Connector is correctly loaded.

## Preparing Google Cloud ADC Authentication

1. Install gcloud CLI: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2. Run `gcloud init --console-only --skip-diagnostics`
3. Run `gcloud auth login`
4. Run `gcloud auth application-default login`

This step generates the ADC authentication file, and the generated JSON file is by default placed in `~/.config/gcloud/application_default_credentials.json`.

## Create BigQuery Catalog

```sql
create catalog bigquery_catalog properties (
    "type"="trino-connector",
    "trino.connector.name"="bigquery",
    "trino.bigquery.project-id"="your-bigquery-project-id",
    "trino.bigquery.credentials-file"="/path/to/application_default_credentials.json",
);
```

Where: Properties prefixed with `trino.` are native Trino properties. For more information about BigQuery properties, refer to the [Trino documentation](https://trino.io/docs/current/connector/bigquery.html).

## Column Type Mapping

|BigQuery|Trino|Doris|
| ----- | ----- | ----- |
|BOOLEAN|BOOLEAN|BOOLEAN|
|INT64|BIGINT|BIGINT|
|FLOAT64|DOUBLE|DOUBLE|
|NUMERIC|DECIMAL(p,s)|DECIMAL(p,s)|
|BIGNUMERIC|DECIMAL(P,S)|DECIMAL(p,s)|
|STRING|VARCHAR|STRING|
|BYTES|VARBINARY|STRING|
|DATE|DATE|DATE|
|DATETIME|TIMESTAMP(6)|DATETIME|
|TIME|TIME(6)|STRING|
|TIMESTAMP|TIMESTAMP(6) WITH TIME ZONE|DATETIME|
|GEOGRAPHY|VARCHAR|STRING|
|ARRAY|ARRAY|ARRAY|
|MAP|MAP|MAP|
|RECORD|ROW|STRUCT|


