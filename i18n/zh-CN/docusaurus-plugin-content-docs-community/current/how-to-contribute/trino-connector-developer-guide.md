---
{
    "title": "Trino Connector 开发指南",
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

## 背景

从 3.0 版本开始，Doris 支持对接 Trino Connector 插件。通过丰富的 Trino Connector 插件以及 Doris 的 `Trino-Connector` Catalog 功能可以让 Doris 支持更多的数据源。

Trino Connector 兼容框架的目的在于帮助 Doris 快速对接更多的数据源，以满足用户需求。
对于 Hive、Iceberg、Hudi、Paimon、JDBC 等数据源，我们仍然建议使用 Doris 内置的 Catalog 进行连接，以获得更好的性能、稳定性和兼容性。

本文主要介绍，如何在 Doris 中适配一个 Trino Connector 插件。

下面以 Trino 的 Kafka Connector 插件为例，详细介绍如何在 Doris 中适配 Trino 的 Kafka Connector 插件，然后通过 Doris 的 `Trino-Connector` Catalog 功能访问 Kafka 数据源。

> 注：Trino 是一款由 [Trino 软件基金会](https://trino.io/foundation) 提供的 Apache License 2.0 协议开源软件，详情可访问 [Trino 官网](https://trino.io/docs/current/)。

## Step 1：编译 Kafka Connector 插件

Trino 没有提供官方编译好的 Connector 插件，所以需要我们自己编译所需 Connector 插件。

> 注意：由于 Doris 当前使用 435版本的 `trino-main` 包，所以最好编译 435 版本的 Connector 插件。对于非 435 版本的 Connector 插件，可能会存在兼容性问题。如遇问题，欢迎向 Apache Doris 社区反馈。


1. 拉取 Trino 源码
`$ git clone https://github.com/trinodb/trino.git`
2. 将 Trino 切换到 435 版本
`$ git checkout 435`
3. 进入到 Kafka 插件源码目录
`$ cd trino/plugin/trino-kafka`
4. 编译 Kafka 插件
`$ mvn clean install -DskipTest`
5. 编译完成后，在 trino/plugin/trino-kafka/ 目录下会生成 target/trino-kafka-435 目录

> 注意：每一个 Connector 插件都是一个子目录，而不是一个 jar 包。

## Step 2：设置 Doris 的 fe.conf / be.conf

准备好 Kafka Connector 插件后，需要配置 Doris 的 fe.conf 、be.conf 从而使得 Doris 能够找到该插件。

我们将上述准备好的 `trino-kafka-435` 目录存放在 /path/to/connectors 目录下，然后我们配置：

1. fe.conf

    在 fe.conf 文件中配置 `trino_connector_plugin_dir=/path/to/connectors` （若fe.conf中没有配置 `trino_connector_plugin_dir` 属性，则默认使用 `${Doris_HOME}/fe/connectors` 目录）

2. be.conf

    在 be.conf 文件中配置 `trino_connector_plugin_dir=/path/to/connectors` （若 be.conf 中没有配置 `trino_connector_plugin_dir` 属性 ，则默认使用 `${Doris_HOME}/be/connectors` 目录）

> 注意：Doris 采用懒加载的方式加载 Trino Connector 插件，这意味着如果是第一次在 Doris 中使用 Trino-Connector Catalog 功能，是无需重启 FE / BE 节点的，Doris 会自动加载插件。但是插件只会加载一次，所以如果 `/path/to/connectors/` 目录下插件发生了变化，需要重启 FE / BE 节点，才可以加载变化后的插件。

## Step 3：使用 Trino-Connector Catalog 功能

完成前面两个步骤后，我们就可以在 Doris 中使用 Trino-Connector Catalog 功能了。

1. 首先让我们在 Doris 中创建一个 Trino-Connector Catalog：

    ```sql
    create catalog kafka_tpch properties (
        "type"="trino-connector",
        -- 下面这四个属性来源于 trino，与 trino 的 etc/catalog/kafka.properties 中的属性一致。但需要统一增加 "trino." 前缀
        "trino.connector.name"="kafka",
        "trino.kafka.table-names"="tpch.customer,tpch.orders,tpch.lineitem,tpch.part,tpch.partsupp,tpch.supplier,tpch.nation,tpch.region",
        "trino.kafka.nodes"="localhost:9092",
        "trino.kafka.table-description-dir" = "/mnt/datadisk1/fangtiewei"
    );
    ```

    解释：
    - `type` ：Catalog 类型，这里我们必须设置为 `trino-connector` 。
    - `trino.connector.name`、`trino.kafka.table-names`、`trino.kafka.nodes`、`trino.kafka.table-description-dir` 这四个属性都是来源于trino，参考：[Kafka connector](https://trino.io/docs/current/connector/kafka.html#configuration)

    不同的Connector插件应该设置不同的属性，可以参考trino官方文档：[Connectors](https://trino.io/docs/current/connector.html#connector--page-root)

2. 使用 Catalog

    当我们创建好 Trino-Connector Catalog后，在使用上与其他 Catalog 没有任何区别。通过 `switch kafka_tpch` 语句切换到该 Catalog ，然后就可以查询该 Kafka 数据源的数据了。

下面给出几个常用的 Connector 插件的 Doris trino-conenctor Catalog 配置

1. Hive

    ```sql
    create catalog emr_hive properties (
        "type"="trino-connector",
        "trino.connector.name"="hive",
        "trino.hive.metastore.uri"="thrift://ip:port",
        "trino.hive.config.resources"="/path/to/core-site.xml,/path/to/hdfs-site.xml"
    );
    ```

    > 使用 Hive 插件时需要注意：
    > - 需要在 JVM 参数里加上 Hadoop 的用户：-DHADOOP_USER_NAME=user，可以配置在 fe.conf / be.conf 文件的JAVA_OPTS_FOR_JDK_17 参数末尾，如 JAVA_OPTS_FOR_JDK_17="...-DHADOOP_USER_NAME=user"

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

    > 使用 Mysql 插件时需要注意：
    > - 遇到报错：Unknown or incorrect time zone: 'Asia/Shanghai' ， 需要在JVM启动参数处加上： -Duser.timezone=Etc/GMT-8。可以配置在 fe.conf / be.conf 文件的 JAVA_OPTS_FOR_JDK_17 参数末尾。

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
