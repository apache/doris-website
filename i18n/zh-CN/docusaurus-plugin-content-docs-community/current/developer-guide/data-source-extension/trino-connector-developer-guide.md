---
title: Trino Connector 集成开发指南
language: zh-CN
description: 如何为 Apache Doris 集成 Trino Connector：编译、配置与 Kafka / Hive / MySQL / BigQuery 示例。
keywords:
    - Apache Doris Trino Connector
    - trino-connector Catalog
    - Trino 插件编译
    - trino_connector_plugin_dir
    - Kafka Connector
    - Hive Connector
    - MySQL Connector
    - BigQuery Connector
    - 数据源扩展
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

<!-- 知识类型: 扩展开发 -->
<!-- 适用场景: 数据源扩展 / Catalog 接入 -->

# Trino Connector 集成开发指南

本文面向需要为 Apache Doris 接入 Trino Connector 插件的开发者，介绍如何编译 Connector 插件、配置 FE / BE，以及创建并使用 `trino-connector` 类型的 Catalog。下文以 Kafka Connector 为主线，并给出 Hive / MySQL / BigQuery 等常用插件的配置范例。

## 内容导览

- [背景](#背景)：何时使用 Trino Connector 框架
- [Step 1 - 编译 Connector 插件](#step-1---编译-connector-插件)：以 Kafka 为例
- [Step 2 - 配置 FE / BE](#step-2---配置-fe--be)：插件目录与懒加载机制
- [Step 3 - 创建并使用 Catalog](#step-3---创建并使用-catalog)：`CREATE CATALOG` 与属性映射
- [常用 Connector 配置示例](#常用-connector-配置示例)：Hive / MySQL / Kafka / BigQuery
- [FAQ 与常见错误](#faq-与常见错误)

---

## 背景

<!-- 知识类型: 架构选型决策 -->

从 3.0 版本开始，Doris 支持对接 Trino Connector 插件。通过丰富的 Trino Connector 插件以及 Doris 的 `trino-connector` Catalog 功能，可以让 Doris 支持更多的数据源。

| 场景 | 推荐方案 |
|------|----------|
| Hive、Iceberg、Hudi、Paimon、JDBC 等主流数据源 | 优先使用 Doris **内置 Catalog**，性能、稳定性与兼容性更好 |
| Doris 暂未内置的其他数据源 | 使用 **Trino Connector 兼容框架**，快速接入更多数据源 |

> 注：Trino 是一款由 [Trino 软件基金会](https://trino.io/foundation) 提供的 Apache License 2.0 协议开源软件，详情可访问 [Trino 官网](https://trino.io/docs/current/)。

---

## Step 1 - 编译 Connector 插件

<!-- 知识类型: 操作步骤 -->

Trino 没有提供官方编译好的 Connector 插件，需要自行编译所需 Connector 插件。

> 注意：由于 Doris 当前使用 435 版本的 `trino-main` 包，所以最好编译 435 版本的 Connector 插件。非 435 版本的 Connector 插件可能存在兼容性问题。如遇问题，欢迎向 Apache Doris 社区反馈。

以 Kafka 插件为例：

```bash
# 1. 拉取 Trino 源码
git clone https://github.com/trinodb/trino.git

# 2. 切换到 435 版本
git checkout 435

# 3. 进入 Kafka 插件源码目录
cd trino/plugin/trino-kafka

# 4. 编译 Kafka 插件
mvn clean install -DskipTests
```

编译完成后，在 `trino/plugin/trino-kafka/` 目录下会生成 `target/trino-kafka-435` 目录。

> 注意：每一个 Connector 插件都是一个**子目录**，而不是一个 jar 包。

---

## Step 2 - 配置 FE / BE

<!-- 知识类型: 配置参数 -->

准备好 Kafka Connector 插件后，需要在 Doris 的 `fe.conf` 和 `be.conf` 中配置插件目录，使 Doris 能够找到该插件。

假设将上一步准备好的 `trino-kafka-435` 目录存放在 `/path/to/connectors` 下，则配置如下：

| 文件 | 配置项 | 默认值 |
|------|--------|--------|
| `fe.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/fe/connectors` |
| `be.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/be/connectors` |

> **懒加载机制**：Doris 采用懒加载方式加载 Trino Connector 插件。第一次使用 `trino-connector` Catalog 功能时**无需重启** FE / BE 节点，Doris 会自动加载插件。但插件只会加载一次，**插件目录内容发生变化后需要重启 FE / BE 节点**才能让变更生效。

---

## Step 3 - 创建并使用 Catalog

<!-- 知识类型: 操作步骤 -->

### 3.1 创建 Trino-Connector Catalog

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

属性说明：

| 属性 | 说明 |
|------|------|
| `type` | Catalog 类型，必须设置为 `trino-connector` |
| `trino.connector.name` | Trino Connector 的名称，例如 `kafka` |
| `trino.kafka.table-names` 等 | 这些属性来源于 Trino，统一加 `trino.` 前缀，参考 [Kafka connector](https://trino.io/docs/current/connector/kafka.html#configuration) |

不同的 Connector 插件需要设置不同的属性，可以参考 Trino 官方文档：[Connectors](https://trino.io/docs/current/connector.html#connector--page-root)。

### 3.2 使用 Catalog

创建好 Trino-Connector Catalog 后，在使用上与其他 Catalog 没有任何区别。通过 `switch kafka_tpch` 语句切换到该 Catalog，即可查询对应数据源的数据：

```sql
switch kafka_tpch;
show databases;
select * from tpch.customer limit 10;
```

---

## 常用 Connector 配置示例

### Hive

```sql
create catalog emr_hive properties (
    "type"="trino-connector",
    "trino.connector.name"="hive",
    "trino.hive.metastore.uri"="thrift://ip:port",
    "trino.hive.config.resources"="/path/to/core-site.xml,/path/to/hdfs-site.xml"
);
```

> 使用 Hive 插件时需要注意：
> - 需要在 JVM 参数里加上 Hadoop 用户：`-DHADOOP_USER_NAME=user`，可以配置在 `fe.conf` / `be.conf` 的 `JAVA_OPTS_FOR_JDK_17` 参数末尾，如 `JAVA_OPTS_FOR_JDK_17="...-DHADOOP_USER_NAME=user"`。

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

> 使用 MySQL 插件时需要注意：
> - 遇到报错 `Unknown or incorrect time zone: 'Asia/Shanghai'`，需要在 JVM 启动参数处加上 `-Duser.timezone=Etc/GMT-8`，可以配置在 `fe.conf` / `be.conf` 的 `JAVA_OPTS_FOR_JDK_17` 参数末尾。

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

## FAQ 与常见错误

<!-- 知识类型: 故障排查 -->

**Q: 修改了 `/path/to/connectors` 下的插件，为什么 Doris 没生效？**

A: Doris 采用懒加载，但插件只加载一次。修改插件后需要重启 FE / BE 节点。

**Q: 启动报错插件版本不兼容？**

A: 确认编译时切换到了 Trino `435` 分支，Doris 当前使用 `trino-main` 的 435 版本，其他版本可能存在兼容性问题。

**Q: 使用 Hive 插件查询报权限错误或访问 HDFS 失败？**

A: 检查 `JAVA_OPTS_FOR_JDK_17` 是否设置 `-DHADOOP_USER_NAME=user`，以及 `trino.hive.config.resources` 指向的 `core-site.xml` / `hdfs-site.xml` 是否可读。

**Q: MySQL 插件报 `Unknown or incorrect time zone: 'Asia/Shanghai'`？**

A: 在 `JAVA_OPTS_FOR_JDK_17` 末尾加上 `-Duser.timezone=Etc/GMT-8`。

**Q: Hive、Iceberg、Hudi 等数据源是否应该用 Trino Connector？**

A: 不推荐。Doris 内置 Catalog 在这些数据源上性能、稳定性和兼容性更好，Trino Connector 框架定位是补足 Doris 尚未内置的数据源。

