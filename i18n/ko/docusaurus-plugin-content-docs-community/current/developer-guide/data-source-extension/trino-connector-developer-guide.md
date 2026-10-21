---
title: Trino Connector 통합 개발자 가이드
language: ko
description: "Trino Connector를 Apache Doris와 통합하는 방법: 컴파일, 구성 및 Kafka / Hive / MySQL / BigQuery 예제."
keywords:
    - Apache Doris Trino Connector
    - trino-connector Catalog
    - Trino 플러그인 컴파일
    - trino_connector_plugin_dir
    - Kafka Connector
    - Hive Connector
    - MySQL Connector
    - BigQuery Connector
    - 데이터 소스 확장
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

# Trino Connector 통합 개발자 가이드 {#trino-connector-integration-developer-guide}

이 문서는 Trino Connector 플러그인을 Apache Doris와 통합해야 하는 개발자를 대상으로 합니다. Connector 플러그인을 컴파일하고, FE / BE를 구성하며, `trino-connector` Catalog를 생성하고 사용하는 방법을 설명합니다. Kafka Connector를 주요 예제로 사용하며, Hive, MySQL, BigQuery와 같이 자주 사용하는 플러그인의 구성 예제도 제공합니다.

## 목차 {#contents}

- [배경](#background): Trino Connector 프레임워크를 사용하는 경우
- [1단계 - Connector 플러그인 컴파일](#step-1---compile-the-connector-plugin): Kafka 예제
- [2단계 - FE / BE 구성](#step-2---configure-fe--be): 플러그인 디렉터리와 지연 로딩 동작
- [3단계 - Catalog 생성 및 사용](#step-3---create-and-use-the-catalog): `CREATE CATALOG`와 속성 매핑
- [자주 사용하는 Connector 구성 예제](#common-connector-configuration-examples): Hive / MySQL / Kafka / BigQuery
- [FAQ 및 일반적인 오류](#faq-and-common-errors)

---

## 배경 {#background}

<!-- Knowledge type: Architecture decision -->

Doris는 3.0 버전부터 Trino Connector 플러그인과의 통합을 지원합니다. Trino Connector의 풍부한 플러그인 생태계와 Doris의 `trino-connector` Catalog 기능을 활용하면 더 다양한 데이터 소스에 연결할 수 있습니다.

| 사용 시나리오 | 권장 방법 |
|------|----------|
| Hive, Iceberg, Hudi, Paimon, JDBC와 같은 주요 데이터 소스 | 성능, 안정성, 호환성이 더 우수한 Doris **내장 Catalog**를 우선 사용합니다 |
| Doris가 아직 통합하지 않은 기타 데이터 소스 | **Trino Connector 호환성 프레임워크**를 사용하여 더 다양한 데이터 소스에 빠르게 연결합니다 |

> 참고: Trino는 [Trino Software Foundation](https://trino.io/foundation)에서 제공하는 Apache License 2.0 기반의 오픈 소스 소프트웨어입니다. 자세한 내용은 [Trino 공식 사이트](https://trino.io/docs/current/)를 참조하세요.

---

## 1단계 - Connector 플러그인 컴파일 {#step-1---compile-the-connector-plugin}

<!-- Knowledge type: Procedure -->

Trino는 공식적으로 컴파일된 Connector 플러그인을 제공하지 않으므로, 필요한 Connector 플러그인을 직접 컴파일해야 합니다.

> 참고: Doris는 현재 `trino-main` 패키지의 435 버전을 사용하므로, Connector 플러그인도 435 버전으로 컴파일하는 것이 좋습니다. 다른 버전의 Connector 플러그인은 호환성 문제가 발생할 수 있습니다. 문제가 발생하면 Apache Doris 커뮤니티에 알려주세요.

Kafka 플러그인을 예로 들어 보겠습니다.

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

컴파일이 완료되면 `target/trino-kafka-435` 디렉터리가 `trino/plugin/trino-kafka/` 아래에 생성됩니다.

> 참고: 각 Connector 플러그인은 단일 jar 파일이 아닌 **하위 디렉터리**입니다.

---

## 2단계 - FE / BE 구성 {#step-2---configure-fe--be}

<!-- Knowledge type: Configuration parameters -->

Kafka Connector 플러그인을 준비한 후에는 `fe.conf`와 `be.conf`에 플러그인 디렉터리를 설정하여 Doris가 플러그인을 찾을 수 있도록 해야 합니다.

이전 단계에서 준비한 `trino-kafka-435` 디렉터리를 `/path/to/connectors` 아래에 배치했다고 가정하면, 다음과 같이 설정합니다.

| 파일 | 설정 항목 | 기본값 |
|------|--------|--------|
| `fe.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/fe/connectors` |
| `be.conf` | `trino_connector_plugin_dir=/path/to/connectors` | `${Doris_HOME}/be/connectors` |

> **지연 로딩 동작**: Doris는 Trino Connector 플러그인을 지연 로딩합니다. `trino-connector` Catalog 기능을 처음 사용할 때는 FE / BE 노드를 다시 시작할 필요가 **없습니다**. Doris가 플러그인을 자동으로 로드합니다. 다만 플러그인은 한 번만 로드되므로, **플러그인 디렉터리의 내용이 변경되면 FE / BE 노드를 다시 시작해야** 변경 사항이 적용됩니다.

---

## 3단계 - Catalog 생성 및 사용 {#step-3---create-and-use-the-catalog}

<!-- Knowledge type: Procedure -->

### 3.1 Trino-Connector Catalog 생성 {#31-create-a-trino-connector-catalog}

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

속성 설명:

| 속성 | 설명 |
|------|------|
| `type` | Catalog 유형입니다. 반드시 `trino-connector`로 설정해야 합니다 |
| `trino.connector.name` | Trino Connector의 이름입니다. 예: `kafka` |
| `trino.kafka.table-names` 등 | Trino에서 제공하는 속성으로, 모두 `trino.` 접두사를 붙입니다. [Kafka Connector](https://trino.io/docs/current/connector/kafka.html#configuration)를 참조하세요 |

Connector 플러그인마다 필요한 속성이 다릅니다. Trino 공식 문서의 [Connector 목록](https://trino.io/docs/current/connector.html#connector--page-root)을 참조하세요.

### 3.2 Catalog 사용 {#32-use-the-catalog}

Trino-Connector Catalog를 생성한 후에는 다른 Catalog와 동일한 방식으로 사용할 수 있습니다. `switch kafka_tpch`로 해당 Catalog로 전환한 다음, 연결된 데이터 소스의 데이터를 쿼리합니다.

```sql
switch kafka_tpch;
show databases;
select * from tpch.customer limit 10;
```

---

## 자주 사용하는 Connector 구성 예제 {#common-connector-configuration-examples}

### Hive {#hive}

```sql
create catalog emr_hive properties (
    "type"="trino-connector",
    "trino.connector.name"="hive",
    "trino.hive.metastore.uri"="thrift://ip:port",
    "trino.hive.config.resources"="/path/to/core-site.xml,/path/to/hdfs-site.xml"
);
```

> Hive 플러그인 사용 시 참고 사항:
> - JVM 매개변수에 Hadoop 사용자를 추가해야 합니다: `-DHADOOP_USER_NAME=user`. 이 설정은 `JAVA_OPTS_FOR_JDK_17` 매개변수에 추가할 수 있으며, 해당 매개변수는 `fe.conf` / `be.conf`에 있습니다. 예: `JAVA_OPTS_FOR_JDK_17="...-DHADOOP_USER_NAME=user"`.

### MySQL {#mysql}

```sql
create catalog trino_mysql properties (
    "type"="trino-connector",
    "trino.connector.name"="mysql",
    "trino.connection-url" = "jdbc:mysql://ip:port",
    "trino.connection-user" = "user",
    "trino.connection-password" = "password"
);
```

> MySQL 플러그인 사용 시 참고 사항:
> - `Unknown or incorrect time zone: 'Asia/Shanghai'` 오류가 발생하면 JVM 시작 매개변수에 `-Duser.timezone=Etc/GMT-8`을 추가하세요. `JAVA_OPTS_FOR_JDK_17` 매개변수의 끝에 추가하면 되며, 해당 매개변수는 `fe.conf` / `be.conf`에 있습니다.

### Kafka {#kafka}

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

### BigQuery {#bigquery}

```sql
create catalog bigquery_catalog properties (
    "type"="trino-connector",
    "trino.connector.name"="bigquery",
    "trino.bigquery.project-id"="steam-circlet-388406",
    "trino.bigquery.credentials-file"="/path/to/application_default_credentials.json"
);
```

---

## FAQ 및 일반적인 오류 {#faq-and-common-errors}

<!-- Knowledge type: Troubleshooting -->

**질문: `/path/to/connectors` 아래의 플러그인을 수정했는데, Doris에 변경 사항이 반영되지 않는 이유는 무엇인가요?**

답변: Doris는 지연 로딩을 사용하지만, 플러그인은 한 번만 로드됩니다. 플러그인을 수정한 후에는 FE / BE 노드를 다시 시작해야 합니다.

**질문: 시작 시 플러그인 버전 호환성 오류가 발생하면 어떻게 하나요?**

답변: 컴파일할 때 Trino의 `435` 브랜치를 체크아웃했는지 확인하세요. Doris는 현재 435 버전의 `trino-main`을 사용하며, 다른 버전은 호환성 문제가 발생할 수 있습니다.

**질문: Hive 플러그인으로 쿼리할 때 권한 오류가 발생하거나 HDFS에 접근할 수 없으면 어떻게 하나요?**

답변: `JAVA_OPTS_FOR_JDK_17`에 `-DHADOOP_USER_NAME=user`가 설정되어 있는지 확인하세요. 또한 `core-site.xml` / `hdfs-site.xml` 파일을 `trino.hive.config.resources`에 지정된 경로에서 읽을 수 있는지 확인하세요.

**질문: MySQL 플러그인에서 `Unknown or incorrect time zone: 'Asia/Shanghai'` 오류가 발생하면 어떻게 하나요?**

답변: `-Duser.timezone=Etc/GMT-8`을 `JAVA_OPTS_FOR_JDK_17`에 추가하세요.

**질문: Hive, Iceberg, Hudi 등의 데이터 소스에도 Trino Connector를 사용해야 하나요?**

답변: 권장하지 않습니다. 이러한 데이터 소스에는 Doris 내장 Catalog가 더 우수한 성능, 안정성, 호환성을 제공합니다. Trino Connector 프레임워크는 Doris가 아직 통합하지 않은 데이터 소스를 지원하는 용도로 설계되었습니다.
