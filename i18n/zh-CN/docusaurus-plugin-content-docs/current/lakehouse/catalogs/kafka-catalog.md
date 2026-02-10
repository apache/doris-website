---
{
    "title": "Kafka Catalog",
    "language": "zh-CN",
    "description": "Apache Doris Kafka Catalog 使用指南：通过 Trino Connector 框架连接 Kafka 数据流，实现 Kafka Topic 数据的查询和集成。支持 Schema Registry、多种数据格式，快速完成 Kafka 与 Doris 的数据集成。"
}
---

## 概述

Kafka Catalog 通过 [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) 兼容框架，使用 Trino Kafka Connector 来访问 Kafka Topic 数据。

:::note
- 该功能为实验功能，自 3.0.1 版本开始支持。
- 该功能不依赖 Trino 集群环境，仅使用 Trino 兼容插件。
:::

### 适用场景

| 场景     | 支持情况                              |
| -------- | ------------------------------------- |
| 数据集成 | 读取 Kafka Topic 数据并写入到 Doris 内表 |
| 数据写回 | 不支持                               |

### 版本兼容性

- **Doris 版本**：3.0.1 及以上
- **Trino Connector 版本**：435
- **Kafka 版本**：具体支持的版本请参考 [Trino 文档](https://trino.io/docs/435/connector/kafka.html)

## 快速开始

### 步骤 1：准备 Connector 插件

你可以选择以下两种方式之一来获取 Kafka Connector 插件：

**方式一：使用预编译包（推荐）**

直接在 [这里](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724) 找到对应的预编译的插件包并下载解压。

**方式二：手动编译**

如果需要自定义编译，按照以下步骤操作（需要 JDK 17）：

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kafka
mvn clean package -Dmaven.test.skip=true
```

完成编译后，会在 `trino/plugin/trino-kafka/target/` 下得到 `trino-kafka-435/` 目录。

### 步骤 2：部署插件

1. 将 `trino-kafka-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下（如果没有该目录，请手动创建）：

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kafka-435
   ...
   ```

   > 也可以通过修改 `fe.conf` 的 `trino_connector_plugin_dir` 配置自定义插件路径。如：`trino_connector_plugin_dir=/path/to/connectors/`

2. 重启所有 FE 和 BE 节点，以确保 Connector 被正确加载。

### 步骤 3：创建 Catalog

**基础配置**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broekr1>:<port1>,<broekr2>:<port2>',
    'trino.kafka.table-names' = 'test_db.topic_name',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**使用配置文件**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broekr1>:<port1>,<broekr2>:<port2>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**配置默认 Schema**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broekr1>:<port1>,<broekr2>:<port2>',
    'trino.kafka.default-schema' = 'default_db',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

### 步骤 4：查询数据

创建 Catalog 后，可以通过以下三种方式查询 Kafka Topic 数据：

```sql
-- 方式 1：切换到 Catalog 后查询
SWITCH kafka;
USE kafka_schema;
SELECT * FROM topic_name LIMIT 10;

-- 方式 2：使用两级路径
USE kafka.kafka_schema;
SELECT * FROM topic_name LIMIT 10;

-- 方式 3：使用全限定名
SELECT * FROM kafka.kafka_schema.topic_name LIMIT 10;
```

## Schema Registry 集成

Kafka Catalog 支持通过 Confluent Schema Registry 来自动获取 Topic 的 Schema 信息，避免手动定义表结构。

### 配置 Schema Registry

**基础认证**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broekr1>:<port1>',
    'trino.kafka.table-description-supplier' = 'CONFLUENT',
    'trino.kafka.confluent-schema-registry-url' = 'http://<schema-registry-host>:<schema-registry-port>',
    'trino.kafka.confluent-schema-registry-auth-type' = 'BASIC_AUTH',
    'trino.kafka.confluent-schema-registry.basic-auth.username' = 'admin',
    'trino.kafka.confluent-schema-registry.basic-auth.password' = 'admin123',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**完整配置示例**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broekr1>:<port1>',
    'trino.kafka.default-schema' = 'nrdp',
    'trino.kafka.table-description-supplier' = 'CONFLUENT',
    'trino.kafka.confluent-schema-registry-url' = 'http://<schema-registry-host>:<schema-registry-port>',
    'trino.kafka.confluent-schema-registry-auth-type' = 'BASIC_AUTH',
    'trino.kafka.confluent-schema-registry.basic-auth.username' = 'admin',
    'trino.kafka.confluent-schema-registry.basic-auth.password' = 'admin123',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties',
    'trino.kafka.confluent-schema-registry-subject-mapping' = 'nrdp.topic1:NRDP.topic1',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

### Schema Registry 参数说明

| 参数名称                                                          | 必填 | 默认值 | 说明                                           |
| ----------------------------------------------------------------- | ---- | ------ | ---------------------------------------------- |
| `trino.kafka.table-description-supplier`                          | 否   | -      | 设置为 `CONFLUENT` 启用 Schema Registry 支持   |
| `trino.kafka.confluent-schema-registry-url`                       | 是*  | -      | Schema Registry 服务地址                       |
| `trino.kafka.confluent-schema-registry-auth-type`                 | 否   | NONE   | 认证类型：NONE、BASIC_AUTH、BEARER            |
| `trino.kafka.confluent-schema-registry.basic-auth.username`       | 否   | -      | Basic Auth 用户名                              |
| `trino.kafka.confluent-schema-registry.basic-auth.password`       | 否   | -      | Basic Auth 密码                                |
| `trino.kafka.confluent-schema-registry-subject-mapping`           | 否   | -      | Subject 名称映射，格式：`<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>`。|

:::tip
使用 Schema Registry 时，Doris 会自动从 Schema Registry 获取 Topic 的 Schema 信息，无需手动创建表结构。
:::

### Subject 映射说明

某些情况下，Schema Registry 中注册的 Subject 名称可能和 Kafka 中的 Topic 名称不匹配，导致导致无法查询数据。此时需要通过 `confluent-schema-registry-subject-mapping` 手动指定映射关系。

```sql
-- 将 schema.topic 映射到 Schema Registry 中的 SCHEMA.topic Subject
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>'
```

其中 `db1` 和 `tbl1` 为在 Doris 中实际看到的 Database 和 Table 名称。`topic_name1` 为 Kafka 中实际的 Topic 名称（大小写敏感）。

多个映射可以用逗号分隔：

```sql
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>'
```

## 配置说明

### Catalog 配置参数

创建 Kafka Catalog 的基本语法如下：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- 必填，固定值
    'trino.connector.name' = 'kafka',    -- 必填，固定值
    {TrinoProperties},                   -- Trino Connector 相关属性
    {CommonProperties}                   -- 通用属性
);
```

#### TrinoProperties 参数

TrinoProperties 用于配置 Trino Kafka Connector 的专有属性，这些属性以 `trino.` 为前缀。常用参数包括：

| 参数名称                                      | 必填 | 默认值 | 说明                                                     |
| --------------------------------------------- | ---- | ------ | -------------------------------------------------------- |
| `trino.kafka.nodes`                           | 是   | -      | Kafka Broker 节点地址列表，格式：`host1:port1,host2:port2` |
| `trino.kafka.table-names`                     | 否   | -      | 要映射的 Topic 列表，格式：`schema.topic1,schema.topic2` |
| `trino.kafka.default-schema`                  | 否   | default| 默认 Schema 名称                                         |
| `trino.kafka.hide-internal-columns`           | 否   | true   | 是否隐藏 Kafka 内部列（如 `_partition_id`、`_partition_offset` 等） |
| `trino.kafka.config.resources`                | 否   | -      | Kafka 客户端配置文件路径                                 |
| `trino.kafka.table-description-supplier`      | 否   | -      | 表结构提供方式，设置为 `CONFLUENT` 使用 Schema Registry |
| `trino.kafka.confluent-schema-registry-url`   | 否   | -      | Schema Registry 服务地址                                 |

更多 Kafka Connector 配置参数请参考 [Trino 官方文档](https://trino.io/docs/435/connector/kafka.html)。

#### CommonProperties 参数

CommonProperties 用于配置 Catalog 的通用属性，例如元数据刷新策略、权限控制等。详细说明请参阅[数据目录概述](../catalog-overview.md)中「通用属性」部分。

### Kafka 客户端配置

当需要配置 Kafka 客户端的高级参数（如安全认证、SSL 等）时，可以通过配置文件方式指定。创建一个配置文件（例如 `kafka-client.properties`）：

```properties
# ============================================
# Kerberos/SASL 认证配置
# ============================================
sasl.mechanism=GSSAPI
sasl.kerberos.service.name=kafka

# JAAS 配置 - 使用 keytab 方式
sasl.jaas.config=com.sun.security.auth.module.Krb5LoginModule required \
    useKeyTab=true \
    storeKey=true \
    useTicketCache=false \
    serviceName="kafka" \
    keyTab="/opt/trino/security/keytabs/kafka.keytab" \
    principal="kafka@EXAMPLE.COM";

# ============================================
# Avro 反序列化器配置
# ============================================
key.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
value.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
```

然后在创建 Catalog 时指定该配置文件：

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broekr1>:<port1>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties'
);
```

## 数据类型映射

在使用 Kafka Catalog 时，数据类型会按照以下规则进行映射：

| Kafka/Avro Type   | Trino Type       | Doris Type       | 说明                                    |
| ----------------- | ---------------- | ---------------- | --------------------------------------- |
| boolean           | boolean          | boolean          |                                         |
| int               | integer          | int              |                                         |
| long              | bigint           | bigint           |                                         |
| float             | real             | float            |                                         |
| double            | double           | double           |                                         |
| bytes             | varbinary        | string           | 需要使用 `HEX(col)` 函数查询            |
| string            | varchar          | string           |                                         |
| array             | array            | array            |                                         |
| map               | map              | map              |                                         |
| record            | row              | struct           | 复杂嵌套结构                            |
| enum              | varchar          | string           |                                         |
| fixed             | varbinary        | string           |                                         |
| null              | -                | -                |                                         |

:::tip
- 对于 `bytes` 类型，如果需要以十六进制格式显示，请使用 `HEX()` 函数包裹列名。
- Kafka Catalog 支持的数据类型取决于所使用的序列化格式（JSON、Avro、Protobuf 等）和 Schema Registry 配置。
:::

## Kafka 内部列

Kafka Connector 提供了一些内部列，用于访问 Kafka 消息的元数据信息：

| 列名                  | 类型      | 说明                              |
| --------------------- | --------- | --------------------------------- |
| `_partition_id`       | bigint    | 消息所在的分区 ID                 |
| `_partition_offset`   | bigint    | 消息在分区中的偏移量              |
| `_message_timestamp`  | timestamp | 消息时间戳                        |
| `_key`                | varchar   | 消息的 Key                        |
| `_key_corrupt`        | boolean   | Key 是否损坏                      |
| `_key_length`         | bigint    | Key 的字节长度                    |
| `_message`            | varchar   | 消息的原始内容                    |
| `_message_corrupt`    | boolean   | 消息是否损坏                      |
| `_message_length`     | bigint    | 消息的字节长度                    |
| `_headers`            | map       | 消息头信息                        |

默认情况下，这些内部列是隐藏的。如果需要查询这些列，需要在创建 Catalog 时设置：

```sql
'trino.kafka.hide-internal-columns' = 'false'
```

查询示例：

```sql
SELECT 
    _partition_id,
    _partition_offset,
    _message_timestamp,
    *
FROM kafka.schema.topic_name
LIMIT 10;
```

## 使用限制

1. **只读访问**：Kafka Catalog 仅支持读取数据，不支持写入（INSERT、UPDATE、DELETE）操作。

2. **Table Names 配置**：当不使用 Schema Registry 时，需要通过 `trino.kafka.table-names` 参数显式指定要访问的 Topic 列表。

3. **Schema 定义**：
   - 使用 Schema Registry 时，Schema 信息自动从 Schema Registry 获取。
   - 不使用 Schema Registry 时，需要手动创建表定义或使用 Trino 的 Topic 描述文件。

4. **数据格式**：支持的数据格式取决于 Topic 使用的序列化方式（JSON、Avro、Protobuf 等），具体请参考 [Trino 官方文档](https://trino.io/docs/435/connector/kafka.html)。

5. **性能考虑**：
   - Kafka Catalog 会实时读取 Kafka 数据，大量数据查询可能影响性能。
   - 建议结合 `LIMIT` 子句或时间过滤条件限制扫描的数据量。

## 功能调试

可以参考 [这里](https://github.com/morningman/demo-env/tree/main/kafka) 快速构建 Kafka 环境机型功能验证。

## 参考资料

- [Trino Kafka Connector 官方文档](https://trino.io/docs/435/connector/kafka.html)
- [Trino Connector 开发指南](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/)
- [Confluent Schema Registry 文档](https://docs.confluent.io/platform/current/schema-registry/index.html)
