---
{
    "title": "Doris Kafka Connector",
    "language": "ko",
    "description": "Doris Kafka Connector 릴리스 노트."
}
---

# Doris Kafka Connector {#doris-kafka-connector}

이 문서는 Doris Kafka Connector 릴리스 노트를 최신 버전부터 역순으로 나열합니다.

## 26.1.0 {#2610}

출처: [릴리스 노트 26.1.0](https://github.com/apache/doris-kafka-connector/issues/102)

### 기능 및 개선 사항 {#features-and-improvements}

- 데이터 적재 전에 매번 HTTP 프로브를 수행하지 않도록 사용 가능한 BE를 캐시했습니다. [#99](https://github.com/apache/doris-kafka-connector/pull/99)
- Doris에 대한 단방향 TLS 연결을 지원합니다. [#100](https://github.com/apache/doris-kafka-connector/pull/100)
- 결합된 쓰기 작업에서 최소 한 번의 쓰기를 보장하는 S3 TVF sink 모드를 지원합니다. [#101](https://github.com/apache/doris-kafka-connector/pull/101)

### 감사의 말 {#thanks}

- @diggle1
- @JNSimba

## 26.0.0 {#2600}

출처: [릴리스 노트 26.0.0](https://github.com/apache/doris-kafka-connector/issues/98)

### 기능 및 개선 사항 {#features-and-improvements-1}

- Stream Load에서 gzip 압축을 기본으로 활성화했습니다. [#95](https://github.com/apache/doris-kafka-connector/pull/95)
- 스키마 진화 중 연결을 제대로 재사용하지 않아 JDBC 연결이 급증하던 문제를 해결했습니다. [#94](https://github.com/apache/doris-kafka-connector/pull/94)
- Confluent 빌드 스크립트를 추가했습니다. [#86](https://github.com/apache/doris-kafka-connector/pull/86)
- `ConfigDef` 설정을 업데이트했습니다. [#85](https://github.com/apache/doris-kafka-connector/pull/85)

### 버그 수정 {#bug-fixes}

- `topic2table` 설정의 유효성 검사 문제를 해결했습니다. [#83](https://github.com/apache/doris-kafka-connector/pull/83)
- README의 웹사이트 문서 링크를 수정했습니다. [#84](https://github.com/apache/doris-kafka-connector/pull/84)

### 감사의 말 {#thanks-1}

- @JNSimba
- @rnb-tron

## 25.0.0 {#2500}

출처: [릴리스 노트 25.0.0](https://github.com/apache/doris-kafka-connector/issues/81)

### 기능 및 개선 사항 {#features-and-improvements-2}

- 비동기 combine flush를 지원합니다. [#74](https://github.com/apache/doris-kafka-connector/pull/74)
- 설정 기본값을 업데이트하고 combine flush 모드를 추가했습니다. [#73](https://github.com/apache/doris-kafka-connector/pull/73)
- 로그 수준을 debug로 변경했습니다. [#75](https://github.com/apache/doris-kafka-connector/pull/75)
- 여러 변환 체인을 위한 엔드투엔드 테스트를 추가했습니다. [#72](https://github.com/apache/doris-kafka-connector/pull/72)
- null 값에 대한 처리 동작을 추가했습니다. [#69](https://github.com/apache/doris-kafka-connector/pull/69)
- 토픽을 변경하는 SMT에 대한 검사를 추가했습니다. [#68](https://github.com/apache/doris-kafka-connector/pull/68)
- 재시도 전략을 추가했습니다. [#67](https://github.com/apache/doris-kafka-connector/pull/67)
- Debezium 업데이트, 삭제 및 Avro 변환 사례를 추가했습니다. [#65](https://github.com/apache/doris-kafka-connector/pull/65)
- Kafka Connect 변환을 위한 엔드투엔드 테스트 사례를 추가했습니다. [#64](https://github.com/apache/doris-kafka-connector/pull/64)
- label 트랜잭션 상태 쿼리를 비롯한 코드를 최적화했습니다. [#62](https://github.com/apache/doris-kafka-connector/pull/62)
- 스키마 변경 오류 메시지에 테이블 이름을 추가했습니다. [#61](https://github.com/apache/doris-kafka-connector/pull/61)
- 릴리스 스크립트를 추가했습니다. [#80](https://github.com/apache/doris-kafka-connector/pull/80)

### 버그 수정 {#bug-fixes-1}

- decimal 파싱 문제를 해결했습니다. [#70](https://github.com/apache/doris-kafka-connector/pull/70)
- 데이터 적재 재시도 시 `processedOffset`이 업데이트되지 않던 문제를 해결했습니다. [#79](https://github.com/apache/doris-kafka-connector/pull/79)
- 적절한 경우 스키마 API 응답을 무시하도록 했습니다. [#77](https://github.com/apache/doris-kafka-connector/pull/77)

### 감사의 말 {#thanks-2}

- @chuang-wang-pre
- @DongLiang-0
- @JNSimba
- @vinlee19
