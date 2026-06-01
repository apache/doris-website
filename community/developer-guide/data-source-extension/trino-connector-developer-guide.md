---
title: Trino Connector Integration Developer Guide
language: en
description: "How to integrate Trino Connectors with Apache Doris: compilation, configuration, and Kafka / Hive / MySQL / BigQuery examples."
keywords:
    - Apache Doris Trino Connector
    - trino-connector Catalog
    - Trino plugin compilation
    - trino_connector_plugin_dir
    - Kafka Connector
    - Hive Connector
    - MySQL Connector
    - BigQuery Connector
    - data source extension
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

<!-- Knowledge type: Extension development -->
<!-- Applicable scenario: Data source extension / Catalog integration -->

# Trino Connector Integration Developer Guide

This document targets developers who need to integrate Trino Connector plugins with Apache Doris. It covers how to compile a Connector plugin, configure FE / BE, and create and use a `trino-connector` Catalog. The Kafka Connector is used as the main example, with additional configuration samples for common plugins such as Hive, MySQL, and BigQuery.

## Contents

- [Background](#background): when to use the Trino Connector framework
- [Step 1 - Compile the Connector plugin](#step-1---compile-the-connector-plugin): Kafka as an example
- [Step 2 - Configure FE / BE](#step-2---configure-fe--be): plugin directory and lazy-loading behavior
- [Step 3 - Create and use the Catalog](#step-3---create-and-use-the-catalog): `CREATE CATALOG` and property mapping
- [Common Connector configuration examples](#common-connector-configuration-examples): Hive / MySQL / Kafka / BigQuery
- [FAQ and common errors](#faq-and-common-errors)

---

## Background

<!-- Knowledge type: Architecture decision -->

Starting from version 3.0, Doris supports integration with Trino Connector plugins. With the rich ecosystem of Trino Connector plugins and the `trino-connector` Catalog feature in Doris, Doris can connect to more data sources.

| Scenario | Recommended approach |
|------|----------|
| Mainstream data sources such as Hive, Iceberg, Hudi, Paimon, JDBC | Use the Doris **built-in Catalog** first, for better performance, stability, and compatibility |
| Other data sources that Doris does not yet integrate | Use the **Trino Connector compatibility framework** to quickly connect to more data sources |

> Note: Trino is open-source software licensed under the Apache License 2.0, provided by the [Trino Software Foundation](https://trino.io/foundation). For more information, visit the [Trino official site](https://trino.io/docs/current/).

---

## Step 1 - Compile the Connector plugin

<!-- Knowledge type: Procedure -->

Trino does not provide officially compiled Connector plugins, so you need to compile the required Connector plugins yourself.

> Note: Doris currently uses the 435 version of the `trino-main` package, so it is best to compile the 435 version of the Connector plugin. Connector plugins of other versions may have compatibility issues. If you encounter problems, please report them to the Apache Doris community.

Take the Kafka plugin as an example:

```bash
# 1. Clone the Trino source code
git clone https://github.com/trinodb/trino.git

# 2. Check out version 435
git checkout 435

# 3. Enter the Kafka plugin source directory
cd trino/plugin/trino-kafka

# 4. Compile the Kafka plugin
mvn clean install -DskipTests
```

After compilation, a `target/trino-kafka-435` directory is generated under `trino/plugin/trino-kafka/`.

> Note: Each Connector plugin is a **subdirectory**, not a single jar file.

---

## Step 2 - Configure FE / BE

<!-- Knowledge type: Configuration parameters -->

After preparing the Kafka Connector plugin, you need to configure the plugin directory in `fe.conf` and `be.conf` so that Doris can locate the plugin.

Assuming the `trino-kafka-435` directory prepared in the previous step is placed under `/path/to/connectors`, configure as follows:

| File | Configuration item | Default value |
|------|--------|--------|
| `fe.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/fe/connectors` |
| `be.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/be/connectors` |

> **Lazy-loading behavior**: Doris loads Trino Connector plugins lazily. The first time you use the `trino-connector` Catalog feature, you do **not** need to restart FE / BE nodes; Doris loads the plugin automatically. However, plugins are loaded only once, so **after the plugin directory contents change, you must restart FE / BE nodes** for the changes to take effect.

---

## Step 3 - Create and use the Catalog

<!-- Knowledge type: Procedure -->

### 3.1 Create a Trino-Connector Catalog

```sql
create catalog kafka_tpch properties (
    "type"="trino-connector",
    -- The following four properties come from Trino and match the properties in Trino's etc/catalog/kafka.properties, but each must be prefixed with "trino."
    "trino.connector.name"="kafka",
    "trino.kafka.table-names"="tpch.customer,tpch.orders,tpch.lineitem,tpch.part,tpch.partsupp,tpch.supplier,tpch.nation,tpch.region",
    "trino.kafka.nodes"="localhost:9092",
    "trino.kafka.table-description-dir" = "/mnt/datadisk1/fangtiewei"
);
```

Property descriptions:

| Property | Description |
|------|------|
| `type` | Catalog type. Must be set to `trino-connector` |
| `trino.connector.name` | Name of the Trino Connector, for example `kafka` |
| `trino.kafka.table-names` and others | These properties come from Trino, all prefixed with `trino.`. See [Kafka connector](https://trino.io/docs/current/connector/kafka.html#configuration) |

Different Connector plugins require different properties. See the Trino official documentation: [Connectors](https://trino.io/docs/current/connector.html#connector--page-root).

### 3.2 Use the Catalog

Once the Trino-Connector Catalog is created, using it is no different from using any other Catalog. Switch to the Catalog with `switch kafka_tpch` and query data from the corresponding data source:

```sql
switch kafka_tpch;
show databases;
select * from tpch.customer limit 10;
```

---

## Common Connector configuration examples

### Hive

```sql
create catalog emr_hive properties (
    "type"="trino-connector",
    "trino.connector.name"="hive",
    "trino.hive.metastore.uri"="thrift://ip:port",
    "trino.hive.config.resources"="/path/to/core-site.xml,/path/to/hdfs-site.xml"
);
```

> Notes for the Hive plugin:
> - You must add the Hadoop user to the JVM parameters: `-DHADOOP_USER_NAME=user`. This can be appended to the `JAVA_OPTS_FOR_JDK_17` parameter in `fe.conf` / `be.conf`, for example `JAVA_OPTS_FOR_JDK_17="...-DHADOOP_USER_NAME=user"`.

### MySQL

```sql
create catalog trino_mysql properties (
    "type"="trino-connector",
    "trino.connector.name"="mysql",
    "trino.connection-url" = "jdbc:mysql://ip:port",
    "trino.connection-user" = "user",
    "trino.connection-password" = "password"
);
```

> Notes for the MySQL plugin:
> - If you see the error `Unknown or incorrect time zone: 'Asia/Shanghai'`, append `-Duser.timezone=Etc/GMT-8` to the JVM startup parameters. You can add it at the end of the `JAVA_OPTS_FOR_JDK_17` parameter in `fe.conf` / `be.conf`.

### Kafka

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

### BigQuery

```sql
create catalog bigquery_catalog properties (
    "type"="trino-connector",
    "trino.connector.name"="bigquery",
    "trino.bigquery.project-id"="steam-circlet-388406",
    "trino.bigquery.credentials-file"="/path/to/application_default_credentials.json"
);
```

---

## FAQ and common errors

<!-- Knowledge type: Troubleshooting -->

**Q: I modified a plugin under `/path/to/connectors`, why does Doris not pick up the change?**

A: Doris uses lazy loading, but plugins are loaded only once. After modifying a plugin, you must restart FE / BE nodes.

**Q: Startup reports a plugin version incompatibility error?**

A: Confirm that you checked out the Trino `435` branch when compiling. Doris currently uses version 435 of `trino-main`, and other versions may have compatibility issues.

**Q: Hive plugin queries report permission errors or fail to access HDFS?**

A: Check whether `JAVA_OPTS_FOR_JDK_17` has `-DHADOOP_USER_NAME=user` set, and whether the `core-site.xml` / `hdfs-site.xml` files referenced by `trino.hive.config.resources` are readable.

**Q: MySQL plugin reports `Unknown or incorrect time zone: 'Asia/Shanghai'`?**

A: Append `-Duser.timezone=Etc/GMT-8` to `JAVA_OPTS_FOR_JDK_17`.

**Q: Should I use Trino Connector for Hive, Iceberg, Hudi, and similar data sources?**

A: Not recommended. The Doris built-in Catalog offers better performance, stability, and compatibility for these data sources. The Trino Connector framework is positioned to fill gaps for data sources that Doris does not yet integrate.

