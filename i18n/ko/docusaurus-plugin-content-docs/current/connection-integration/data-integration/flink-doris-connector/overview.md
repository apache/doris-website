---
{
    "title": "Flink Doris Connector 개요",
    "language": "ko",
    "description": "Flink Doris Connector의 기능인 Doris 데이터 읽기, Doris changelog를 사용한 증분 읽기, Doris 데이터 쓰기, Lookup Join, 전체 데이터베이스 동기화와 버전 호환성 및 설치 방법을 설명합니다."
}
---

# Flink Doris Connector {#flink-doris-connector}

[Flink Doris Connector](https://github.com/apache/doris-flink-connector)는 Flink를 통해 Doris 클러스터에서 데이터를 읽고 쓰며, [Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/)와 통합되어 MySQL 등의 업스트림 데이터베이스 전체를 간편하게 동기화할 수 있습니다.

## 기능 {#capabilities}

| 기능 | 설명 | 주요 사용 사례 |
| --- | --- | --- |
| [Doris에서 데이터 읽기](./read.md) | FE를 거치지 않고 BE에서 병렬로 데이터를 읽으며, Thrift 및 Arrow Flight SQL 프로토콜 지원 | Doris 테이블을 Flink 작업의 입력으로 사용, 대량 데이터 내보내기 |
| [Doris Changelog를 사용한 증분 읽기](./incremental-read.md) | 테이블의 행 단위 변경 사항(삽입, 업데이트, 삭제)을 지속적으로 읽으며, 선택적으로 스냅샷부터 시작 가능. Connector 26.4.0+ 및 Doris 5.0.0+ 필요 | Doris 테이블의 변경 사항을 다운스트림 시스템에 실시간으로 동기화 |
| [Doris에 데이터 쓰기](./write.md) | Flink에서 데이터를 배치로 묶어 Stream Load를 통해 쓰며, 스트리밍 쓰기(Checkpoint 기반, Exactly-Once), 배치 쓰기, S3 TVF 쓰기 제공 | 실시간 데이터 수집, CDC 변경 사항 적재, 부분 컬럼 업데이트 |
| [Lookup Join](./lookup-join.md) | 업스트림 레코드를 배치로 묶어 Doris 차원 테이블을 비동기로 쿼리 | 스트림에 차원 데이터 보강 |
| [전체 데이터베이스 동기화](./cdc-sync.md) | Flink CDC와 통합되어 명령 하나로 MySQL, Oracle, PostgreSQL, SQLServer, DB2 또는 MongoDB 데이터베이스 전체를 동기화하며, 테이블 생성 및 DDL 동기화를 자동으로 수행 | 비즈니스 데이터베이스를 Doris에 실시간으로 동기화 |

모든 기능은 FlinkSQL을 통해 사용할 수 있으며, 읽기와 쓰기는 [DataStream API](./datastream-api.md)를 통해서도 사용할 수 있습니다. 연결 설정은 [연결 옵션 및 TLS](./connection.md)를, Doris와 Flink 타입 간의 대응 관계는 [데이터 타입 매핑](./data-type-mapping.md)을 참조하세요.

## 동작 원리 {#how-it-works}

![FlinkConnectorPrinciples-JDBC-Doris](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

- **읽기**: Connector는 FE에서 쿼리 계획의 Tablet 정보를 가져온 다음, BE에서 직접 병렬로 데이터를 읽습니다. 데이터가 FE를 거치지 않으므로 JDBC를 통해 단일 FE 노드에서 순차적으로 읽고 쓸 때 발생하는 병목 현상을 방지할 수 있습니다. [읽기 동작 원리](./read.md#how-it-works)를 참조하세요.
- **쓰기**: Flink 메모리에서 데이터를 배치로 묶은 다음, Stream Load를 통해 Doris에 대량으로 데이터를 적재합니다. 기본적으로 쓰기는 Flink Checkpoint에 맞춰 수행되며, 두 단계 커밋을 사용하여 Exactly-Once를 보장합니다. Checkpoint에 의존하지 않는 배치 쓰기 모드도 사용할 수 있습니다. [쓰기 모드](./write.md#write-modes)를 참조하세요.
- **Lookup Join**: 레코드마다 개별 포인트 쿼리를 실행하는 대신, 업스트림 레코드를 배치로 묶어 Doris 차원 테이블을 비동기로 쿼리합니다.
- **전체 데이터베이스 동기화**: Flink CDC로 업스트림 데이터베이스의 변경 사항을 읽고 Doris Sink를 통해 씁니다. Doris Sink는 대상 테이블을 생성하고 Schema Changes를 자동으로 동기화합니다.

## 버전 정보 {#version-notes}

| Connector 버전 | Flink 버전         | Doris 버전 | Java 버전   | Scala 버전 |
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

## 설치 {#installation}

Jar 패키지 방식과 Maven 의존성 방식을 모두 지원합니다.

### Jar 패키지 방식 {#jar-package-method}

[Doris 다운로드 페이지](https://doris.apache.org/download#doris-ecosystem)에서 해당 버전의 Flink Doris Connector Jar 패키지를 다운로드하여 Flink의 `classpath`에 복사합니다.

- **Standalone 모드**: Jar 파일을 `lib/` 디렉터리에 넣습니다.
- **Yarn 클러스터 모드**: Jar 파일을 배포 전 패키지에 포함합니다.

### Maven 의존성 방식 {#maven-dependency-method}

프로젝트의 `pom.xml`에 다음 의존성을 추가합니다.

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-${flink.version}</artifactId>
    <version>${connector.version}</version>
</dependency>
```

예시:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>flink-doris-connector-1.16</artifactId>
    <version>26.3.0</version>
</dependency>
```

## 다음 단계 {#next-steps}

- [빠른 시작](./quick-start.md)을 따라 FlinkSQL로 Doris 테이블을 읽고 써 보세요.
- 오류가 발생하면 먼저 [FAQ](./faq.md)를 확인하세요.
