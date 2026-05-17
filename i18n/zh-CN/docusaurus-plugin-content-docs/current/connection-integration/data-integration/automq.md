---
{
    "title": "AutoMQ",
    "language": "zh-CN",
    "description": "使用 Apache Doris Routine Load 消费 AutoMQ Kafka 兼容 Topic 中的 JSON 数据，实现实时数据导入。"
}
---

[AutoMQ](https://github.com/AutoMQ/automq) 是基于云重新设计的云原生 Kafka。通过将存储分离至对象存储，在保持和 Apache Kafka 100% 兼容的前提下，为用户提供高达 10 倍的成本优势以及百倍的弹性优势。通过其创新的共享存储架构，在保证高吞吐、低延迟的性能指标下实现了秒级分区迁移、流量自平衡、秒级自动弹性等能力。

本文介绍如何使用 Apache Doris Routine Load 消费 AutoMQ Kafka 兼容 Topic 中的 JSON 数据，并将数据持续导入 Doris 表。

![AutoMQ Storage Architecture](/images/next/connection-integration/data-integration/automq-arch.jpg)

## 使用场景

当业务数据已经写入 AutoMQ，且希望在 Apache Doris 中持续分析这些实时数据时，可以使用 Routine Load 从 AutoMQ Topic 中消费数据。本文示例使用一个 JSON Topic 和一张 Doris 测试表，演示从准备数据到验证导入结果的完整流程。

整体流程如下：

1. 准备 Apache Doris 测试库和测试表。
2. 准备 AutoMQ 集群、Kafka 命令行工具和测试 Topic。
3. 向 AutoMQ Topic 写入 JSON 测试数据。
4. 在 Doris 中创建 Routine Load 导入作业。
5. 查询 Doris 表，验证数据是否导入成功。

## 前提条件

开始前，请确认以下环境已经准备完成。

| 准备项 | 说明 |
| --- | --- |
| Apache Doris 集群 | 确保已经有可用的 Apache Doris 集群。为了便于演示，本文参考 [快速开始](../../getting-started/quick-start) 文档在 Linux 上部署测试环境。 |
| AutoMQ 集群 | 参考 AutoMQ [官方部署文档](https://docs.automq.com/automq/deployment/deploy-multi-nodes-cluster-on-linux) 部署可用集群，并确保 AutoMQ 与 Apache Doris 之间网络连通。 |
| Kafka 命令行工具 | 从 [AutoMQ Releases](https://github.com/AutoMQ/automq/releases) 下载最新的 TGZ 包并解压。本文假设解压目录为 `$AUTOMQ_HOME`，并使用 `$AUTOMQ_HOME/bin` 下的工具命令创建 Topic 和生成测试数据。 |

## 准备 Doris 测试表

在 Doris 中创建库和测试表。后续示例默认在 `automq_db` 中执行。

```sql
CREATE DATABASE automq_db;
USE automq_db;

CREATE TABLE automq_db.users (
    id BIGINT NOT NULL,
    name STRING NOT NULL,
    timestamp STRING NULL,
    status STRING NULL
) DISTRIBUTED BY HASH(id) PROPERTIES ("replication_num" = "1");
```

## 准备 AutoMQ Topic 和测试数据

本文使用以下示例参数。执行命令时，请将示例地址替换为实际 AutoMQ Bootstrap Server 地址。

| 参数 | 示例值 | 说明 |
| --- | --- | --- |
| AutoMQ Bootstrap Server | `127.0.0.1:9092` | AutoMQ 集群的访问地址。 |
| Topic | `example_topic` | 用于存放测试 JSON 数据的 Topic。 |
| AutoMQ 解压目录 | `$AUTOMQ_HOME` | AutoMQ TGZ 包的解压目录。 |

### 创建 Topic

使用 Apache Kafka 命令行工具创建 `example_topic`。

```shell
$AUTOMQ_HOME/bin/kafka-topics.sh \
    --create \
    --topic example_topic \
    --bootstrap-server 127.0.0.1:9092 \
    --partitions 1 \
    --replication-factor 1
```

创建完成后，使用以下命令验证 Topic 是否创建成功。

```shell
$AUTOMQ_HOME/bin/kafka-topics.sh \
    --describe \
    --topic example_topic \
    --bootstrap-server 127.0.0.1:9092
```

### 准备测试数据

测试数据使用 JSON 格式，字段需要和 Doris 表以及后续 Routine Load 中的 `jsonpaths` 对应。

```json
{
    "id": 1,
    "name": "测试用户",
    "timestamp": "2023-11-10T12:00:00",
    "status": "active"
}
```

### 写入测试数据

通过 Kafka 命令行工具或编程方式将测试数据写入 `example_topic`。下面是使用命令行工具写入数据的示例。

```shell
echo '{"id": 1, "name": "测试用户", "timestamp": "2023-11-10T12:00:00", "status": "active"}' | $AUTOMQ_HOME/bin/kafka-console-producer.sh \
    --bootstrap-server 127.0.0.1:9092 \
    --topic example_topic
```

使用以下命令查看刚写入的 Topic 数据。

```shell
$AUTOMQ_HOME/bin/kafka-console-consumer.sh \
    --bootstrap-server 127.0.0.1:9092 \
    --topic example_topic \
    --from-beginning
```

## 创建 Routine Load 导入作业

在 Apache Doris 命令行中创建 Routine Load 作业，用于持续消费 AutoMQ Topic 中的 JSON 数据。Routine Load 的详细参数说明，请参考 [Doris Routine Load](../../data-operate/import/import-way/routine-load-manual)。

```sql
CREATE ROUTINE LOAD automq_example_load ON users
COLUMNS(id, name, timestamp, status)
PROPERTIES
(
    "format" = "json",
    "jsonpaths" = "[\"$.id\",\"$.name\",\"$.timestamp\",\"$.status\"]"
)
FROM KAFKA
(
    "kafka_broker_list" = "127.0.0.1:9092",
    "kafka_topic" = "example_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

关键配置说明如下。

| 配置项 | 示例值 | 说明 |
| --- | --- | --- |
| `format` | `json` | 指定导入数据格式为 JSON。 |
| `jsonpaths` | `["$.id","$.name","$.timestamp","$.status"]` | 指定 JSON 字段与 Doris 表字段的映射关系。 |
| `kafka_broker_list` | `127.0.0.1:9092` | AutoMQ Bootstrap Server 地址。执行时请替换为实际地址。 |
| `kafka_topic` | `example_topic` | Routine Load 需要消费的 AutoMQ Topic。 |
| `property.kafka_default_offsets` | `OFFSET_BEGINNING` | 从 Topic 起始位置开始消费数据。 |

## 验证数据导入

首先检查 Routine Load 导入作业状态，确保任务正在运行中。

```sql
SHOW ROUTINE LOAD\G;
```

然后查询 Doris 表，确认测试数据已经导入。

```sql
SELECT * FROM users;
```

```text
+------+--------------+---------------------+--------+
| id   | name         | timestamp           | status |
+------+--------------+---------------------+--------+
|    1 | 测试用户     | 2023-11-10T12:00:00 | active |
+------+--------------+---------------------+--------+
1 row in set (0.01 sec)
```

## 注意事项

- 执行示例命令时，请将 `127.0.0.1:9092` 替换为实际 AutoMQ Bootstrap Server 地址。
- 测试 JSON 数据字段需要和 Doris 表字段、Routine Load `jsonpaths` 配置保持一致。
- 创建 Routine Load 作业前，请确认 Doris 能访问 AutoMQ 集群。
