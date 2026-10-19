---
{
    "title": "Kafka Catalog",
    "language": "ko",
    "description": "Apache Doris Kafka Catalog 가이드: Trino Connector 프레임워크를 통해 Kafka 데이터 스트림에 연결하여 Kafka Topic 데이터를 쿼리하고 통합합니다. Schema Registry와 다양한 데이터 형식을 지원하여 Kafka와 Doris 데이터를 빠르게 통합할 수 있습니다."
}
---

## 개요 {#overview}

Kafka Catalog는 [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/) 호환 프레임워크를 통해 Trino Kafka Connector를 사용하여 Kafka Topic 데이터에 접근합니다.

:::note
- 이 기능은 실험적 기능이며, 3.0.1 버전부터 지원됩니다.
- 이 기능은 Trino 클러스터 환경에 의존하지 않으며, Trino 호환 플러그인만 사용합니다.
:::

### 활용 사례 {#use-cases}

| 시나리오 | 지원 상태 |
| -------- | -------------- |
| 데이터 통합 | Kafka Topic 데이터를 읽어 Doris 내부 테이블에 쓰기 |
| 데이터 역방향 쓰기 | 지원되지 않음 |

### 버전 호환성 {#version-compatibility}

- **Doris 버전**: 3.0.1 이상
- **Trino Connector 버전**: 435
- **Kafka 버전**: 지원되는 버전은 [Trino 문서](https://trino.io/docs/435/connector/kafka.html)를 참조하세요.

## 빠른 시작 {#quick-start}

### 1단계: Connector 플러그인 준비 {#step-1-prepare-connector-plugin}

다음 방법 중 하나로 Kafka Connector 플러그인을 구할 수 있습니다.

**방법 1: 사전 컴파일된 패키지 사용(권장)**

[여기](https://github.com/apache/doris-thirdparty/releases/tag/trino-435-20240724)에서 사전 컴파일된 플러그인 패키지를 다운로드하고 압축을 풉니다.

**방법 2: 직접 컴파일**

사용자 지정 컴파일이 필요한 경우 다음 단계를 따르세요(JDK 17 필요).

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kafka
mvn clean package -Dmaven.test.skip=true
```

컴파일이 완료되면 `trino-kafka-435/` 디렉터리가 `trino/plugin/trino-kafka/target/` 아래에 생성됩니다.

### 2단계: 플러그인 배포 {#step-2-deploy-plugin}

1. `trino-kafka-435/` 디렉터리를 모든 FE 및 BE 배포 경로의 `connectors/` 디렉터리에 배치합니다(디렉터리가 없으면 직접 생성하세요).

   ```text
   ├── bin
   ├── conf
   ├── plugins
   │   ├── connectors
   │       ├── trino-kafka-435
   ...
   ```

   > `trino_connector_plugin_dir` 구성을 `fe.conf`에서 수정하여 플러그인 경로를 사용자 지정할 수도 있습니다. 예: `trino_connector_plugin_dir=/path/to/connectors/`

2. Connector가 올바르게 로드되도록 모든 FE 및 BE 노드를 다시 시작합니다.

### 3단계: Catalog 생성 {#step-3-create-catalog}

**기본 구성**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.table-names' = 'test_db.topic_name',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**구성 파일 사용**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

**기본 스키마 구성**

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>,<broker2>:<port2>',
    'trino.kafka.default-schema' = 'default_db',
    'trino.kafka.hide-internal-columns' = 'false'
);
```

### 4단계: 데이터 쿼리 {#step-4-query-data}

Catalog를 생성한 후 다음 세 가지 방법 중 하나로 Kafka Topic 데이터를 쿼리할 수 있습니다.

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

## Schema Registry 연동 {#schema-registry-integration}

Kafka Catalog는 Confluent Schema Registry를 통해 스키마를 자동으로 가져올 수 있으므로 테이블 구조를 수동으로 정의할 필요가 없습니다.

### Schema Registry 구성 {#configure-schema-registry}

**기본 인증**

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

**전체 구성 예제**

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

### Schema Registry 매개변수 {#schema-registry-parameters}

| 매개변수 이름 | 필수 여부 | 기본값 | 설명 |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.table-description-supplier` | 아니요 | - | `CONFLUENT`로 설정하면 Schema Registry 지원 활성화 |
| `trino.kafka.confluent-schema-registry-url` | 예* | - | Schema Registry 서비스 주소 |
| `trino.kafka.confluent-schema-registry-auth-type` | 아니요 | NONE | 인증 유형: NONE, BASIC_AUTH, BEARER |
| `trino.kafka.confluent-schema-registry.basic-auth.username` | 아니요 | - | Basic Auth 사용자 이름 |
| `trino.kafka.confluent-schema-registry.basic-auth.password` | 아니요 | - | Basic Auth 비밀번호 |
| `trino.kafka.confluent-schema-registry-subject-mapping` | 아니요 | - | Subject 이름 매핑. 형식: `<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>` |

:::tip
Schema Registry를 사용하면 Doris가 Schema Registry에서 Topic 스키마 정보를 자동으로 가져오므로 테이블 구조를 수동으로 생성할 필요가 없습니다.
:::

### Subject 매핑 {#subject-mapping}

경우에 따라 Schema Registry에 등록된 Subject 이름이 Kafka의 Topic 이름과 일치하지 않아 데이터를 쿼리하지 못할 수 있습니다. 이 경우 `confluent-schema-registry-subject-mapping`을 통해 매핑 관계를 직접 지정해야 합니다.

```sql
-- Map schema.topic to SCHEMA.topic Subject in Schema Registry
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>'
```

여기서 `db1`과 `tbl1`은 Doris에서 확인할 수 있는 실제 데이터베이스와 테이블 이름이며, `topic_name1`은 Kafka의 실제 Topic 이름입니다(대소문자 구분).

여러 매핑은 쉼표로 구분할 수 있습니다.

```sql
'trino.kafka.confluent-schema-registry-subject-mapping' = '<db1>.<tbl1>:<topic_name1>,<db2>.<tbl2>:<topic_name2>'
```

## 구성 {#configuration}

### Catalog 구성 매개변수 {#catalog-configuration-parameters}

Kafka Catalog를 생성하는 기본 구문은 다음과 같습니다.

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- Required, fixed value
    'trino.connector.name' = 'kafka',    -- Required, fixed value
    {TrinoProperties},                   -- Trino Connector related properties
    {CommonProperties}                   -- Common properties
);
```

#### TrinoProperties 매개변수 {#trinoproperties-parameters}

TrinoProperties는 Trino Kafka Connector 전용 속성을 구성하는 데 사용하며, 이러한 속성에는 `trino.` 접두사가 붙습니다. 주요 매개변수는 다음과 같습니다.

| 매개변수 이름 | 필수 여부 | 기본값 | 설명 |
| -------------- | -------- | ------- | ----------- |
| `trino.kafka.nodes` | 예 | - | Kafka Broker 노드 주소 목록. 형식: `host1:port1,host2:port2` |
| `trino.kafka.table-names` | 아니요 | - | 매핑할 Topic 목록. 형식: `schema.topic1,schema.topic2` |
| `trino.kafka.default-schema` | 아니요 | default | 기본 스키마 이름 |
| `trino.kafka.hide-internal-columns` | 아니요 | true | Kafka 내부 컬럼(예: `_partition_id`, `_partition_offset` 등)의 숨김 여부 |
| `trino.kafka.config.resources` | 아니요 | - | Kafka 클라이언트 구성 파일 경로 |
| `trino.kafka.table-description-supplier` | 아니요 | - | 테이블 구조 제공자. `CONFLUENT`로 설정하면 Schema Registry 사용 |
| `trino.kafka.confluent-schema-registry-url` | 아니요 | - | Schema Registry 서비스 주소 |

Kafka Connector의 추가 구성 매개변수는 [Trino 공식 문서](https://trino.io/docs/435/connector/kafka.html)를 참조하세요.

#### CommonProperties 매개변수 {#commonproperties-parameters}

CommonProperties는 메타데이터 새로 고침 정책 및 권한 제어와 같은 일반적인 Catalog 속성을 구성하는 데 사용합니다. 자세한 내용은 [Catalog 개요](../catalog-overview.md)의 "공통 속성" 절을 참조하세요.

### Kafka 클라이언트 구성 {#kafka-client-configuration}

Kafka 클라이언트의 고급 매개변수(예: 보안 인증, SSL 등)를 구성해야 하는 경우 구성 파일을 통해 지정할 수 있습니다. 구성 파일(예: `kafka-client.properties`)을 생성합니다.

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

그런 다음 Catalog를 생성할 때 구성 파일을 지정합니다.

```sql
CREATE CATALOG kafka PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kafka',
    'trino.kafka.nodes' = '<broker1>:<port1>',
    'trino.kafka.config.resources' = '/path/to/kafka-client.properties'
);
```

## 데이터 타입 매핑 {#data-type-mapping}

Kafka Catalog를 사용할 때 데이터 타입은 다음 규칙에 따라 매핑됩니다.

| Kafka/Avro 타입 | Trino 타입 | Doris 타입 | 참고 |
| --------------- | ---------- | ---------- | ----- |
| boolean | boolean | boolean | |
| int | integer | int | |
| long | bigint | bigint | |
| float | real | float | |
| double | double | double | |
| bytes | varbinary | string | `HEX(col)` 함수로 쿼리 |
| string | varchar | string | |
| array | array | array | |
| map | map | map | |
| record | row | struct | 복잡한 중첩 구조 |
| enum | varchar | string | |
| fixed | varbinary | string | |
| null | - | - | |

:::tip
- `bytes` 타입은 `HEX()` 함수를 사용하여 십육진수 형식으로 표시합니다.
- Kafka Catalog에서 지원하는 데이터 타입은 사용하는 직렬화 형식(JSON, Avro, Protobuf 등)과 Schema Registry 구성에 따라 달라집니다.
:::

## Kafka 내부 컬럼 {#kafka-internal-columns}

Kafka Connector는 Kafka 메시지의 메타데이터 정보에 접근할 수 있는 내부 컬럼을 제공합니다.

| 컬럼 이름 | 타입 | 설명 |
| ----------- | ---- | ----------- |
| `_partition_id` | bigint | 메시지가 위치한 파티션의 ID |
| `_partition_offset` | bigint | 파티션 내 메시지 오프셋 |
| `_message_timestamp` | timestamp | 메시지 타임스탬프 |
| `_key` | varchar | 메시지 키 |
| `_key_corrupt` | boolean | 키의 손상 여부 |
| `_key_length` | bigint | 키의 바이트 길이 |
| `_message` | varchar | 원시 메시지 내용 |
| `_message_corrupt` | boolean | 메시지의 손상 여부 |
| `_message_length` | bigint | 메시지의 바이트 길이 |
| `_headers` | map | 메시지 헤더 정보 |

이러한 내부 컬럼은 기본적으로 숨겨져 있습니다. 이 컬럼을 쿼리하려면 Catalog를 생성할 때 다음과 같이 설정합니다.

```sql
'trino.kafka.hide-internal-columns' = 'false'
```

쿼리 예제:

```sql
SELECT 
    _partition_id,
    _partition_offset,
    _message_timestamp,
    *
FROM kafka.schema.topic_name
LIMIT 10;
```

## 제한 사항 {#limitations}

1. **읽기 전용 접근**: Kafka Catalog는 데이터 읽기만 지원하며, 쓰기 작업(INSERT, UPDATE, DELETE)은 지원하지 않습니다.

2. **테이블 이름 구성**: Schema Registry를 사용하지 않는 경우 `trino.kafka.table-names` 매개변수로 접근할 Topic 목록을 명시적으로 지정해야 합니다.

3. **스키마 정의**:
   - Schema Registry를 사용하는 경우 Schema Registry에서 스키마 정보를 자동으로 가져옵니다.
   - Schema Registry를 사용하지 않는 경우 테이블 정의를 직접 생성하거나 Trino의 Topic 설명 파일을 사용해야 합니다.

4. **데이터 형식**: 지원되는 데이터 형식은 Topic에서 사용하는 직렬화 방식(JSON, Avro, Protobuf 등)에 따라 달라집니다. 자세한 내용은 [Trino 공식 문서](https://trino.io/docs/435/connector/kafka.html)를 참조하세요.

5. **성능 고려 사항**:
   - Kafka Catalog는 Kafka 데이터를 실시간으로 읽으므로 대량의 데이터를 쿼리하면 성능에 영향을 줄 수 있습니다.
   - 스캔하는 데이터 양을 제한하려면 `LIMIT` 절이나 시간 필터 조건을 사용하는 것이 좋습니다.

## 기능 디버깅 {#feature-debugging}

[여기](https://github.com/morningman/demo-env/tree/main/kafka)를 참조하여 기능 검증을 위한 Kafka 환경을 빠르게 구축할 수 있습니다.

## 참고 자료 {#references}

- [Trino Kafka Connector 공식 문서](https://trino.io/docs/435/connector/kafka.html)
- [Trino Connector 개발 가이드](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide/)
- [Confluent Schema Registry 문서](https://docs.confluent.io/platform/current/schema-registry/index.html)
