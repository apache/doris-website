---
{
    "title": "How to access a new Trino Connector plugin",
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

# How to access a new Trino Connector plugin

## Background

Starting from version 3.0, Doris supports docking with the Trino Connector plugin. Through the rich Trino Connector plugin and Doris' Trino-Connector Catalog function, Doris can query more data sources.

The purpose of the Trino Connector compatibility framework is to help Doris quickly connect to more data sources to meet user needs.

For data sources such as Hive, Iceberg, Hudi, Paimon, and JDBC, we still recommend using the built-in catalog of Doris  for connection to achieve better performance, stability, and compatibility.

This article mainly introduces how to adapt a Trino Connector plugin in Doris.

The following takes Trino's kafka Connector plugin as an example to introduce in detail how to adapt Trino's kafka Connector plugin in Doris, and then access the kafka data source through the `Trino-Connector` catalog function of Doris.

> Note: Trino is an Apache License 2.0 protocol open source software provided by [Trino Software Foundation](https://trino.io/foundation). For details, please visit [Trino official website](https://trino.io/docs/current/).

## Step 1: Compile Kafka connector plugin

Trino does not provide officially compiled connector plugins, so we need to compile the required connector plugins ourselves.

> Note: Since Doris currently uses the 435 version of the `trino-main` package, it is best to compile the 435 version of the connector plugin. There may be compatibility issues with non-435 versions of the connector plugin. If you encounter any problems, please provide feedback to the Apache Doris community.

1. Clone Trino source code
`$ git clone https://github.com/trinodb/trino.git`
2. Switch Trino source code to version 435
`$ git checkout 435`
3. Enter the Kafka plugin source code directory
`$ cd trino/plugin/trino-kafka`
4. Compile the Kafka plugin
`$ mvn clean install -DskipTest`
5. After the compilation is completed, the target/trino-kafka-435 directory will be generated in the trino/plugin/trino-kafka/ directory.

> Note: Each connector plugin is a subdirectory, not a jar package.

## Step 2: Set up Doris's fe.conf / be.conf

After preparing the Kafka connector plug-in, you need to configure Doris's fe.conf and be.conf so that Doris can load the plug-in.

If we store the `trino-kafka-435` directory prepared above in the /path/to/connectors directory, and then we should configure:

1. fe.conf

    Configure `trino_connector_plugin_dir=/path/to/connectors` in the fe.conf file (if the `trino_connector_plugin_dir` attribute is not configured in fe.conf, the `${Doris_HOME}/fe/connectors` directory will be used by default).

2. be.conf

    Configure `trino_connector_plugin_dir=/path/to/connectors` in the be.conf file (if the `trino_connector_plugin_dir` attribute is not configured in be.conf, the `${Doris_HOME}/be/connectors` directory will be used by default).

> Note: Doris uses a lazy loading method to load the Trino Connector plug-in, which means that if it is the first time to use the Trino-Connector Catalog function in Doris, there is no need to restart the FE / BE node, Doris will automatically load the plug-in. However, the plug-in will only be loaded once, so if the plug-in in the `/path/to/connectors/` directory changes, you need to restart the FE / BE node before the changed plug-in can be loaded.

## Step 3: Using the Trino-Connector catalog feature

After completing the previous two steps, we can use the Trino-Connector Catalog function in Doris.

1. First let's create a Trino-Connector Catalog in Doris:

    ```sql
    create catalog kafka_tpch properties (
        "type"="trino-connector",
        -- The following four properties are derived from trino and are consistent with the properties in etc/catalog/kafka.properties of trino. But need to add "trino." prefix
        "trino.connector.name"="kafka",
        "trino.kafka.table-names"="tpch.customer,tpch.orders,tpch.lineitem,tpch.part,tpch.partsupp,tpch.supplier,tpch.nation,tpch.region",
        "trino.kafka.nodes"="localhost:9092",
        "trino.kafka.table-description-dir" = "/mnt/datadisk1/fangtiewei"
    );
    ```

    explain:
    - `type` ：The type of catalog, here we must set it to `trino-connector`.
    - `trino.connector.name`、`trino.kafka.table-names`、`trino.kafka.nodes`、`trino.kafka.table-description-dir` The following four properties are derived from trino, refer to: [Kafka connector](https://trino.io/docs/current/connector/kafka.html#configuration)

    Different Connector plug-ins should set different properties. You can refer to the official trino documentation: [Connectors](https://trino.io/docs/current/connector.html#connector--page-root)

2. Use catalog

    After we create the Trino-Connector catalog, there is no difference in use from other catalogs. Switch to the catalog through the `switch kafka_tpch` statement, and then you can query the data of the Kafka data source.

The following are the Doris Trino-Connector catalog configuration of several commonly used Connector plug-ins.

1. Hive

    ```sql
    create catalog emr_hive properties (
        "type"="trino-connector",
        "trino.connector.name"="hive",
        "trino.hive.metastore.uri"="thrift://ip:port",
        "trino.hive.config.resources"="/path/to/core-site.xml,/path/to/hdfs-site.xml"
    );
    ```

    > Note:
    > - You should add Hadoop's user name in the JVM parameters: -DHADOOP_USER_NAME=user, which can be configured at the end of the JAVA_OPTS_FOR_JDK_17 parameter in the fe.conf / be.conf file, such as JAVA_OPTS_FOR_JDK_17="...-DHADOOP_USER_NAME=user"

2. Mysql

    ```sql
    create catalog trino_mysql properties (
        "type"="trino-connector",
        "trino.connector.name"="mysql",
        "trino.connection-url" = "jdbc:mysql://ip:port",
        "trino.connection-user" = "user",
        "trino.connection-password" = "password"
    );
    ```

    > Note:
    > - When encountering the error: Unknown or incorrect time zone: 'Asia/Shanghai', you need to add: -Duser.timezone=Etc/GMT-8 to the JVM startup parameters, which can be configured at the end of the JAVA_OPTS_FOR_JDK_17 parameter in the fe.conf / be.conf file.

3. Kafka

    ```sql
    create catalog kafka properties (
        "type"="trino-connector",
        "trino.connector.name"="kafka",
        "trino.kafka.nodes"="localhost:9092",
        "trino.kafka.table-description-supplier"="CONFLUENT",
        "trino.kafka.confluent-schema-registry-url"="http://localhost:8081",
        "trino.kafka.hide-internal-columns" = "false"
    );
    ```

4. BigQuery

    ```sql
    create catalog bigquery_catalog properties (
        "type"="trino-connector",
        "trino.connector.name"="bigquery",
        "trino.bigquery.project-id"="steam-circlet-388406",
        "trino.bigquery.credentials-file"="/path/to/application_default_credentials.json"
    );
    ```

