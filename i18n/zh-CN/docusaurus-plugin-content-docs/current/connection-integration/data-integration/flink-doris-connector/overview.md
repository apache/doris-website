---
{
    "title": "Flink Doris Connector 概述",
    "language": "zh-CN",
    "description": "Flink Doris Connector 能力总览：读取 Doris 数据、增量读取 Doris Binlog、写入 Doris 数据、Lookup Join 维表关联、整库同步，以及版本兼容和安装方式。"
}
---

# Flink Doris Connector

[Flink Doris Connector](https://github.com/apache/doris-flink-connector) 通过 Flink 实现对 Doris 集群的读写，并集成了 [Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/)，可便捷地完成上游 MySQL 等数据库的整库同步。

## 能力总览 {#capabilities}

| 能力 | 说明 | 典型场景 |
| --- | --- | --- |
| [读取 Doris 数据](./read.md) | 从 BE 并行读取，数据不经过 FE；支持 Thrift 和 Arrow Flight SQL 两种协议 | 以 Doris 表作为 Flink 作业的输入、批量导出 |
| [增量读取 Doris Binlog](./incremental-read.md) | 持续消费表的行级变更（insert、update、delete），可先读取快照再读取增量；需要 Connector 26.3.0+ 和 Doris 5.0.0+ | 将 Doris 表的变更实时同步到下游 |
| [写入 Doris 数据](./write.md) | 在 Flink 中攒批后通过 Stream Load 写入；提供流式写入（基于 Checkpoint，Exactly-Once）、攒批写入和 S3 TVF 写入三种模式 | 实时数据入库、CDC 变更落地、部分列更新 |
| [Lookup Join 维表关联](./lookup-join.md) | 将上游数据攒批后异步查询 Doris 维表 | 流数据打宽 |
| [整库同步](./cdc-sync.md) | 集成 Flink CDC，一条命令同步 MySQL、Oracle、PostgreSQL、SQLServer、DB2、MongoDB 整库，自动建表并同步 DDL | 业务库实时同步到 Doris |

以上能力均可通过 FlinkSQL 使用，读取和写入还提供 [DataStream API](./datastream-api.md)。连接参数和 TLS 见 [连接配置与 TLS](./connection.md)，Doris 与 Flink 的类型对应关系见 [数据类型映射](./data-type-mapping.md)。

## 工作原理 {#how-it-works}

![FlinkConnectorPrinciples-JDBC-Doris](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

- **读取**：Connector 先从 FE 获取查询计划中的 Tablet 信息，再直接从 BE 并行读取数据。数据不经过 FE，避免了 JDBC 方式在单个 FE 节点上串行读写的瓶颈。详见 [读取原理](./read.md#how-it-works)。
- **写入**：数据先在 Flink 内存中攒批，再通过 Stream Load 批量导入 Doris。默认跟随 Flink Checkpoint 以两阶段提交写入，保证 Exactly-Once；也可以使用不依赖 Checkpoint 的攒批写入。详见 [写入模式](./write.md#write-modes)。
- **Lookup Join**：将上游数据攒批后异步查询 Doris 维表，避免逐条点查。
- **整库同步**：通过 Flink CDC 读取上游数据库的变更，经 Doris Sink 写入，并自动创建目标表、同步 Schema Change。

## 版本说明 {#version-notes}

| Connector Version | Flink Version         | Doris Version | Java Version   | Scala Version |
| ----------------- | --------------------- | ------------- | -------------- | ------------- |
| 1.0.3             | 1.11,1.12,1.13,1.14   | 0.15+         | 8              | 2.11,2.12     |
| 1.1.1             | 1.14                  | 1.0+          | 8              | 2.11,2.12     |
| 1.2.1             | 1.15                  | 1.0+          | 8              | -             |
| 1.3.0             | 1.16                  | 1.0+          | 8              | -             |
| 1.4.0             | 1.15 - 1.17           | 1.0+          | 8              | -             |
| 1.5.2             | 1.15 - 1.18           | 1.0+          | 8              | -             |
| 1.6.1             | 1.15 - 1.19           | 1.0+          | 8              | -             |
| 24.0.1            | 1.15 - 1.20           | 1.0+          | 8              | -             |
| 24.1.0            | 1.15 - 1.20           | 1.0+          | 8              | -             |
| 25.0.0            | 1.15 - 1.20           | 1.0+          | 8              | -             |
| 25.1.0            | 1.15 - 1.20           | 1.0+          | 8              | -             |
| 26.0.0            | 1.15 - 1.20,2.0 - 2.2 | 1.0+          | 8(1.x),17(2.x) | -             |
| 26.1.1            | 1.15 - 1.20,2.0 - 2.2 | 1.0+          | 8(1.x),17(2.x) | -             |
| 26.2.0            | 1.15 - 1.20,2.0 - 2.2 | 1.0+          | 8(1.x),17(2.x) | -             |
| 26.3.0            | 1.15 - 1.20,2.0 - 2.3 | 1.0+          | 8(1.x),17(2.x) | -             |

## 安装方式 {#installation}

支持 Jar 包与 Maven 依赖两种方式。

### Jar 包方式

可在 [Doris 下载页](https://doris.apache.org/download#doris-ecosystem) 下载对应版本的 Flink Doris Connector Jar 包，将其复制到 Flink 的 `classpath` 中即可使用：

- **Standalone 模式**：将 Jar 文件放入 `lib/` 目录。
- **Yarn 集群模式**：将 Jar 文件放入预部署包中。

### Maven 依赖方式

在项目 `pom.xml` 中加入以下依赖：

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-${flink.version}</artifactId>
    <version>${connector.version}</version>
</dependency>
```

例如：

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-1.16</artifactId>
    <version>26.3.0</version>
</dependency>
```

## 下一步

- 按照 [快速开始](./quick-start.md) 用 FlinkSQL 完成一次 Doris 表的读写。
- 遇到报错先查 [常见问题](./faq.md)。
