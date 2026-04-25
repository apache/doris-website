---
{
    "title": "Kafka Catalog",
    "language": "en",
    "description": "Apache Doris Kafka Catalog guide: Connect to Kafka data streams through Trino Connector framework to query and integrate Kafka Topic data. Supports Schema Registry, multiple data formats for quick Kafka and Doris data integration."
}
---

## Overview

Kafka Catalog uses the Trino Kafka Connector through the [Trino Connector](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/) compatibility framework to access Kafka Topic data.

:::note
- This is an experimental feature, supported since version 3.0.1.
- This feature does not depend on a Trino cluster environment; it only uses Trino-compatible plugins.
:::

### Use Cases

| Scenario | Support Status |
| -------- | -------------- |
| Data Integration | Read Kafka Topic data and write to Doris internal tables |
| Data Write-back | Not supported |

### Version Compatibility

- **Doris Version**: 3.0.1 and above
- **Trino Connector Version**: 435
- **Kafka Version**: For supported versions, please refer to [Trino Documentation](https://trino.io/docs/435/connector/kafka.html)

## Quick Start

### Step 1: Prepare Connector Plugin

You can obtain the Kafka Connector plugin using one of the following methods:

**Method 1: Use Pre-compiled Package (Recommended)**

Download and extract the pre-compiled plugin package from [here](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724).

**Method 2: Manual Compilation**

If you need custom compilation, follow these steps (requires JDK 17):

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kafka
mvn clean package -Dmaven.test.skip=true
```

After compilation, you will get the `trino-kafka-435/` directory under `trino/plugin/trino-kafka/target/`.

### Step 2: Deploy Plugin

1. Place the `trino-kafka-435/` directory in the `connectors/` directory of all FE and BE deployment paths (create the directory manually if it doesn't exist):

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kafka-435
   ...
   ```

   > You can also customize the plugin path by modifying the `trino_connector_plugin_dir` configuration in `fe.conf`. For example: `trino_connector_plugin_dir=/path/to/connectors/`

2. Restart all FE and BE nodes to ensure the connector is properly loaded.

### Step 3: Create Catalog

**Basic Configuration**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.table-names' = 'test_db.topic_name',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**Using Configuration File**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**Configure Default Schema**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.default-schema' = 'default_db',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

### Step 4: Query Data

After creating the catalog, you can query Kafka Topic data using one of three methods:

```sql
-- Method 1: Switch to catalog and query
SWITCH kafka;
USE kafka_schema;
SELECT * FROM topic_name LIMIT 10;

-- Method 2: Use two-level path
USE kafka.kafka_schema;
SELECT * FROM topic_name LIMIT 10;

-- Method 3: Use fully qualified name
SELECT * FROM kafka.kafka_schema.topic_name LIMIT 10;
```

## Schema Registry Integration

Kafka Catalog supports automatic schema retrieval through Confluent Schema Registry, eliminating the need to manually define table structures.

### Configure Schema Registry

**Basic Authentication**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.table-description-supplier' = 'CONFLUENT',
    'trino.kafka.confluent-schema-registry-url' = 'http://<schema-registry-host>:<schema-registry-port>',
    'trino.kafka.confluent-schema-registry-auth-type' = 'BASIC_AUTH',
    'trino.kafka.confluent-schema-registry.basic-auth.username' = 'admin',
    'trino.kafka.confluent-schema-registry.basic-auth.password' = 'admin123',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**Complete Configuration Example**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
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

### Schema Registry Parameters

| Parameter Name | Required | Default | Description |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.table-description-supplier` | No | - | Set to `CONFLUENT` to enable Schema Registry support |
| `trino.kafka.confluent-schema-registry-url` | Yes* | - | Schema Registry service address |
| `trino.kafka.confluent-schema-registry-auth-type` | No | NONE | Authentication type: NONE, BASIC_AUTH, BEARER |
| `trino.kafka.confluent-schema-registry.basic-auth.username` | No | - | Basic Auth username |
| `trino.kafka.confluent-schema-registry.basic-auth.password` | No | - | Basic Auth password |
| `trino.kafka.confluent-schema-registry-subject-mapping` | No | - | Subject name mapping, format: `<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>` |

:::tip
When using Schema Registry, Doris will automatically retrieve Topic schema information from Schema Registry, eliminating the need to manually create table structures.
:::

### Subject Mapping

In some cases, the Subject name registered in Schema Registry may not match the Topic name in Kafka, preventing data queries. In such cases, you need to manually specify the mapping relationship through `confluent-schema-registry-subject-mapping`.

```sql
-- Map schema.topic to SCHEMA.topic Subject in Schema Registry
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>'
```

Where `db1` and `tbl1` are the actual Database and Table names seen in Doris, and `topic_name1` is the actual Topic name in Kafka (case-sensitive).

Multiple mappings can be separated by commas:

```sql
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>'
```

## Configuration

### Catalog Configuration Parameters

The basic syntax for creating a Kafka Catalog is as follows:

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kafka',    -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```

#### TrinoProperties Parameters

TrinoProperties are used to configure Trino Kafka Connector-specific properties, which are prefixed with `trino.`. Common parameters include:

| Parameter Name | Required | Default | Description |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.nodes` | Yes | - | Kafka Broker node address list, format: `host1:port1,host2:port2` |
| `trino.kafka.table-names` | No | - | List of Topics to map, format: `schema.topic1,schema.topic2` |
| `trino.kafka.default-schema` | No | default | Default schema name |
| `trino.kafka.hide-internal-columns` | No | true | Whether to hide Kafka internal columns (such as `_partition_id`, `_partition_offset`, etc.) |
| `trino.kafka.config.resources` | No | - | Kafka client configuration file path |
| `trino.kafka.table-description-supplier` | No | - | Table structure provider, set to `CONFLUENT` to use Schema Registry |
| `trino.kafka.confluent-schema-registry-url` | No | - | Schema Registry service address |

For more Kafka Connector configuration parameters, please refer to [Trino Official Documentation](https://trino.io/docs/435/connector/kafka.html).

#### CommonProperties Parameters

CommonProperties are used to configure general catalog properties, such as metadata refresh policies and permission control. For detailed information, please refer to the "Common Properties" section in [Catalog Overview](../catalog-overview.md).

### Kafka Client Configuration

When you need to configure advanced Kafka client parameters (such as security authentication, SSL, etc.), you can specify them through a configuration file. Create a configuration file (e.g., `kafka-client.properties`):

```properties
# ============================================
# Kerberos/SASL Authentication Configuration
# ============================================
sasl.mechanism=GSSAPI
sasl.kerberos.service.name=kafka

# JAAS Configuration - Using keytab method
sasl.jaas.config=com.sun.security.auth.module.Krb5LoginModule required \
    useKeyTab=true \
    storeKey=true \
    useTicketCache=false \
    serviceName="kafka" \
    keyTab="/opt/trino/security/keytabs/kafka.keytab" \
    principal="kafka@EXAMPLE.COM";

# ============================================
# Avro Deserializer Configuration
# ============================================
key.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
value.deserializer=io.confluent.kafka.serializers.KafkaAvroDeserializer
```

Then specify the configuration file when creating the catalog:

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties'
);
```

## Data Type Mapping

When using Kafka Catalog, data types are mapped according to the following rules:

| Kafka/Avro Type | Trino Type | Doris Type | Notes |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | integer | int | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| bytes | varbinary | string | Use `HEX(col)` function to query |
| string | varchar | string | |
| array | array | array | |
| map | map | map | |
| record | row | struct | Complex nested structure |
| enum | varchar | string | |
| fixed | varbinary | string | |
| null | - | - | |

:::tip
- For `bytes` type, use the `HEX()` function to display in hexadecimal format.
- The data types supported by Kafka Catalog depend on the serialization format used (JSON, Avro, Protobuf, etc.) and Schema Registry configuration.
:::

## Kafka Internal Columns

Kafka Connector provides some internal columns to access metadata information of Kafka messages:

| Column Name | Type | Description |
| ----------- | ---- | ----------- |
| `_partition_id` | bigint | Partition ID where the message is located |
| `_partition_offset` | bigint | Message offset within the partition |
| `_message_timestamp` | timestamp | Message timestamp |
| `_key` | varchar | Message key |
| `_key_corrupt` | boolean | Whether the key is corrupted |
| `_key_length` | bigint | Key byte length |
| `_message` | varchar | Raw message content |
| `_message_corrupt` | boolean | Whether the message is corrupted |
| `_message_length` | bigint | Message byte length |
| `_headers` | map | Message header information |

By default, these internal columns are hidden. If you need to query these columns, set when creating the catalog:

```sql
'trino.kafka.hide-internal-columns' = 'false'
```

Query example:

```sql
SELECT 
    _partition_id,
    _partition_offset,
    _message_timestamp,
    *
FROM kafka.schema.topic_name
LIMIT 10;
```

## Limitations

1. **Read-only Access**: Kafka Catalog only supports reading data; write operations (INSERT, UPDATE, DELETE) are not supported.

2. **Table Names Configuration**: When not using Schema Registry, you need to explicitly specify the list of Topics to access through the `trino.kafka.table-names` parameter.

3. **Schema Definition**:
   - When using Schema Registry, schema information is automatically retrieved from Schema Registry.
   - When not using Schema Registry, you need to manually create table definitions or use Trino's Topic description files.

4. **Data Format**: Supported data formats depend on the serialization method used by the Topic (JSON, Avro, Protobuf, etc.). For details, please refer to [Trino Official Documentation](https://trino.io/docs/435/connector/kafka.html).

5. **Performance Considerations**:
   - Kafka Catalog reads Kafka data in real-time; querying large amounts of data may affect performance.
   - It is recommended to use the `LIMIT` clause or time filter conditions to limit the amount of data scanned.

## Feature Debugging

You can refer to [here](https://github.com/morningman/demo-env/tree/main/kafka) to quickly build a Kafka environment for feature verification.

## References

- [Trino Kafka Connector Official Documentation](https://trino.io/docs/435/connector/kafka.html)
- [Trino Connector Development Guide](https://doris.apache.org/community/how-to-contribute/trino-connector-developer-guide/)
- [Confluent Schema Registry Documentation](https://docs.confluent.io/platform/current/schema-registry/index.html)