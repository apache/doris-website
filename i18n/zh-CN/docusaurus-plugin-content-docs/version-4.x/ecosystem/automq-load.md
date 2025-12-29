---
{
    "title": "AutoMQ Load",
    "language": "zh-CN",
    "description": "AutoMQ 是基于云重新设计的云原生 Kafka。通过将存储分离至对象存储，在保持和 Apache Kafka 100% 兼容的前提下，为用户提供高达 10 倍的成本优势以及百倍的弹性优势。通过其创新的共享存储架构，"
}
---

[AutoMQ](https://github.com/AutoMQ/automq) 是基于云重新设计的云原生 Kafka。通过将存储分离至对象存储，在保持和 Apache Kafka 100% 兼容的前提下，为用户提供高达 10 倍的成本优势以及百倍的弹性优势。通过其创新的共享存储架构，在保证高吞吐、低延迟的性能指标下实现了秒级分区迁移、流量自平衡、秒级自动弹性等能力。

![AutoMQ Storage Architecture](/images/automq/automq_storage_architecture.png)

## 环境准备
### 准备 Apache Doris 和测试数据

确保当前已准备好可用的 Apache Doris 集群。为了便于演示，我们参考 [快速开始](../gettingStarted/quick-start) 文档在 Linux 上部署了一套测试用的 Apache Doris 环境。
创建库和测试表：
```
create database automq_db;
CREATE TABLE automq_db.users (
                                 id bigint NOT NULL,
                                 name string NOT NULL,
                                 timestamp string NULL,
                                 status string NULL

) DISTRIBUTED BY hash (id) PROPERTIES ('replication_num' = '1');
```
### 准备 Kafka 命令行工具

从 [AutoMQ Releases](https://github.com/AutoMQ/automq) 下载最新的 TGZ 包并解压。假设解压目录为 $AUTOMQ_HOME，在本文中将会使用 $AUTOMQ_HOME/bin 下的工具命令来创建主题和生成测试数据。

### 准备 AutoMQ 和测试数据

参考 AutoMQ [官方部署文档](https://docs.automq.com/docs/automq-opensource/EvqhwAkpriAomHklOUzcUtybn7g)部署一套可用的集群，确保 AutoMQ 与 Apache Doris 之间保持网络连通。
在 AutoMQ 中快速创建一个名为 example_topic 的主题，并向其中写入一条测试 JSON 数据，按照以下步骤操作。

**创建 Topic**

使用 Apache Kafka 命令行工具创建主题，需要确保当前拥有 Kafka 环境的访问权限并且 Kafka 服务正在运行。以下是创建主题的命令示例：
```
$AUTOMQ_HOME/bin/kafka-topics.sh --create --topic exampleto_topic --bootstrap-server 127.0.0.1:9092  --partitions 1 --replication-factor 1
```
在执行命令时，需要将 topic 和 bootstarp-server 替换为实际使用的 AutoMQ Bootstarp Server 地址。
创建完主题后，可以使用以下命令来验证主题是否已成功创建。
```
$AUTOMQ_HOME/bin/kafka-topics.sh --describe example_topic --bootstrap-server 127.0.0.1:9092
```
**生成测试数据**

生成一条 JSON 格式的测试数据，和前文的表需要对应。
```
{
  "id": 1,
  "name": "测试用户",
  "timestamp": "2023-11-10T12:00:00",
  "status": "active"
}
```
**写入测试数据**

通过 Kafka 的命令行工具或编程方式将测试数据写入到名为 example_topic 的主题中。下面是一个使用命令行工具的示例：
```
echo '{"id": 1, "name": "测试用户", "timestamp": "2023-11-10T12:00:00", "status": "active"}' | sh kafka-console-producer.sh --broker-list 127.0.0.1:9092 --topic example_topic
```
使用如下命令可以查看刚写入的 topic 数据：
```
sh $AUTOMQ_HOME/bin/kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092 --topic example_topic --from-beginning
```
> 注意：在执行命令时，需要将 topic 和 bootstarp-server 替换为实际使用的 AutoMQ Bootstarp Server 地址。

## 创建 Routine Load 导入作业

在 Apache Doris 的命令行中创建一个接收 JSON 数据的 Routine Load 作业，用来持续导入 AutoMQ Kafka topic 中的数据。具体 Routine Load 的参数说明请参考 [Doris Routine Load](https://doris.apache.org/zh-CN/docs/data-operate/import/routine-load-manual)。
```
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
> 注意：在执行命令时，需要将 kafka_broker_list 替换为实际使用的 AutoMQ Bootstarp Server 地址。

## 验证数据导入

首先，检查 Routine Load 导入作业的状态，确保任务正在运行中。
```
show routine load\G;
```
然后查询 Apache Doris 数据库中的相关表，可以看到数据已经被成功导入。
```
select * from users;
+------+--------------+---------------------+--------+
| id   | name         | timestamp           | status |
+------+--------------+---------------------+--------+
|    1 | 测试用户     | 2023-11-10T12:00:00 | active |
|    2 | 测试用户     | 2023-11-10T12:00:00 | active |
+------+--------------+---------------------+--------+
2 rows in set (0.01 sec)
```

