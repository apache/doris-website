---
{
    "title": "Doris Spark Connector",
    "language": "ko",
    "description": "Doris Spark Connector 릴리스 노트."
}
---

# Doris Spark Connector {#doris-spark-connector}

이 문서는 Doris Spark Connector 릴리스 노트를 최신 버전부터 나열합니다.

## 26.1.0 {#2610}

출처: [Spark Doris Connector 26.1.0](https://github.com/apache/doris-spark-connector/issues/372)

### Spark Connector {#spark-connector}

#### 기능 및 개선 사항 {#features-and-improvements}

- Doris `ARRAY` 컬럼을 Spark `Array[String]`으로 제공하도록 지원합니다. [#362](https://github.com/apache/doris-spark-connector/pull/362)
- Spark 4.1을 지원합니다. [#365](https://github.com/apache/doris-spark-connector/pull/365)
- Doris에 대한 단방향 TLS 연결을 지원합니다. [#369](https://github.com/apache/doris-spark-connector/pull/369)
- Doris 회귀 테스트 프로그램을 추가했습니다. [#370](https://github.com/apache/doris-spark-connector/pull/370)
- S3 TVF 배치 싱크 모드를 지원합니다. [#371](https://github.com/apache/doris-spark-connector/pull/371)
- 기본 읽기 모드로 Arrow Flight SQL을 사용하고, 사용할 수 없으면 Thrift로 전환합니다. [#367](https://github.com/apache/doris-spark-connector/pull/367)

#### 버그 수정 {#bug-fixes}

- 클라우드 모드에서 지정된 컴퓨팅 그룹의 백엔드를 찾는 기능을 수정했습니다. [#361](https://github.com/apache/doris-spark-connector/pull/361)
- Doris `DATETIME` 및 `TIMESTAMPTZ` 타입에 대한 Arrow 타임스탬프 변환을 수정했습니다. [#366](https://github.com/apache/doris-spark-connector/pull/366)

### 감사의 말씀 {#thanks}

- @addu390
- @gnehil
- @JNSimba
- @LuciferYang

## 26.0.0 {#2600}

출처: [Spark Doris Connector 26.0.0](https://github.com/apache/doris-spark-connector/issues/358)

### Spark Connector {#spark-connector-1}

#### 기능 및 개선 사항 {#features-and-improvements-1}

- Stream Load 쓰기에 gzip 압축을 기본으로 활성화했습니다. [#356](https://github.com/apache/doris-spark-connector/pull/356)
- Arrow Flight 읽기에 대한 로그를 추가했습니다. [#354](https://github.com/apache/doris-spark-connector/pull/354)
- UTF-8 문자 집합 인코딩을 사용하는 HTTP 요청을 지원합니다. [#347](https://github.com/apache/doris-spark-connector/pull/347)

#### 버그 수정 {#bug-fixes-1}

- Spark 3.3, 3.4, 3.5의 컬럼 프로젝션 문제를 수정했습니다. [#353](https://github.com/apache/doris-spark-connector/pull/353)

### 감사의 말씀 {#thanks-1}

- @JNSimba
- @gnehil

## 25.2.0 {#2520}

출처: [Spark Doris Connector 25.2.0](https://github.com/apache/doris-spark-connector/issues/342)

### Spark Connector {#spark-connector-2}

#### 기능 및 개선 사항 {#features-and-improvements-2}

- Doris Flight SQL Reader에 FE 재시도 및 부하 분산 전략을 추가했습니다. [#318](https://github.com/apache/doris-spark-connector/pull/318)
- 프런트엔드와 백엔드에 대한 부하 분산 전략을 추가했습니다. [#329](https://github.com/apache/doris-spark-connector/pull/329)
- 스키마 없이 사용할 수 있는 옵션을 추가했습니다. [#332](https://github.com/apache/doris-spark-connector/pull/332)

#### 버그 수정 {#bug-fixes-2}

- SQL에서 `OR`를 사용할 때 필터 푸시다운에 발생하는 문제를 수정했습니다. [#317](https://github.com/apache/doris-spark-connector/pull/317)
- FE가 응답하지 않을 때 재시도가 멈출 수 있는 문제를 수정했습니다. [#331](https://github.com/apache/doris-spark-connector/pull/331)
- `accept_any_schema` 옵션 처리를 개선했습니다. [#326](https://github.com/apache/doris-spark-connector/pull/326)
- V2Expression 빌드 오류를 수정했습니다. [#339](https://github.com/apache/doris-spark-connector/pull/339)
- `doris.benodes`가 적용되지 않는 문제를 수정했습니다. [#346](https://github.com/apache/doris-spark-connector/pull/346)

### 감사의 말씀 {#thanks-2}

- @JNSimba
- @wanggx
- @wary

## 25.1.0 {#2510}

출처: [Spark Doris Connector 릴리스 노트 25.1.0](https://github.com/apache/doris-spark-connector/issues/319)

### Spark Connector {#spark-connector-3}

#### 기능 및 개선 사항 {#features-and-improvements-3}

- DataSource V2에서 덮어쓰기를 지원합니다. [#281](https://github.com/apache/doris-spark-connector/pull/281)
- `DECIMAL128` 타입 읽기를 지원합니다. [#290](https://github.com/apache/doris-spark-connector/pull/290)
- IP 데이터 타입 읽기에 대한 호환성을 추가했습니다. [#289](https://github.com/apache/doris-spark-connector/pull/289)
- BE Thrift 읽기 로그와 Stream Load 로그를 개선했습니다. [#279](https://github.com/apache/doris-spark-connector/pull/279) [#313](https://github.com/apache/doris-spark-connector/pull/313)
- Doris 소스 및 싱크 통합 테스트 케이스를 추가하고, CI에서 Spark 3.2, 3.4, 3.5도 검사하도록 했습니다. [#296](https://github.com/apache/doris-spark-connector/pull/296) [#297](https://github.com/apache/doris-spark-connector/pull/297) [#302](https://github.com/apache/doris-spark-connector/pull/302) [#312](https://github.com/apache/doris-spark-connector/pull/312)
- FE 노드 포트 검사를 강화하고 쓰기 성능을 개선했습니다. [#303](https://github.com/apache/doris-spark-connector/pull/303)
- 데이터 적재에 실패했을 때 적용할 재시도 간격을 추가했습니다. [#307](https://github.com/apache/doris-spark-connector/pull/307)
- FE 요청에 대한 코드 검사를 추가했습니다. [#309](https://github.com/apache/doris-spark-connector/pull/309)
- 리팩터링 후 사용하지 않는 코드를 제거했습니다. [#295](https://github.com/apache/doris-spark-connector/pull/295)

#### 버그 수정 {#bug-fixes-3}

- 필터의 `IN` 절에 대한 컴파일 문제를 수정했습니다. [#277](https://github.com/apache/doris-spark-connector/pull/277)
- 행 변환기와 스키마 변환기의 단위 테스트를 수정했습니다. [#278](https://github.com/apache/doris-spark-connector/pull/278)
- 빈 파티션의 트랜잭션을 커밋할 때 발생하는 NULL 포인터 예외를 수정했습니다. [#286](https://github.com/apache/doris-spark-connector/pull/286)
- 제거된 컬럼의 결과가 푸시다운되지 않는 문제를 수정했습니다. [#287](https://github.com/apache/doris-spark-connector/pull/287)
- 간격 설정 오류로 인한 성능 저하를 수정했습니다. [#294](https://github.com/apache/doris-spark-connector/pull/294)
- Spark가 `CASE WHEN` 표현식을 푸시다운할 때 발생하는 문제를 수정했습니다. [#300](https://github.com/apache/doris-spark-connector/pull/300)
- Stream Load가 예기치 않게 종료되면 데이터 적재 작업이 멈추는 문제를 수정했습니다. [#305](https://github.com/apache/doris-spark-connector/pull/305)
- UTF-8 인코딩이 푸시다운되면 쿼리가 실행되지 않는 문제를 수정했습니다. [#311](https://github.com/apache/doris-spark-connector/pull/311)
- `ArrowWriter`와 `ArrowUtil`의 이름 변경 충돌을 수정했습니다. [#315](https://github.com/apache/doris-spark-connector/pull/315)

### Spark Load {#spark-load}

#### 기능 및 개선 사항 {#features-and-improvements-4}

- 리소스에서 Hadoop 설정을 불러올 수 있도록 지원합니다. [#280](https://github.com/apache/doris-spark-connector/pull/280)

### 감사의 말씀 {#thanks-3}

- @aoyuEra
- @gnehil
- @JNSimba
- @IsmailTosunTnyl
- @qg-lin
- @vinlee19
- @wary

## 25.0.1 {#2501}

출처: [Spark Doris Connector 릴리스 노트 25.0.1](https://github.com/apache/doris-spark-connector/issues/276)

### Spark Connector {#spark-connector-4}

#### 기능 및 개선 사항 {#features-and-improvements-5}

- 어떤 스키마의 테이블이든 허용하도록 지원합니다. [#269](https://github.com/apache/doris-spark-connector/pull/269)
- Stream Load 응답에 대한 로그를 추가했습니다. [#271](https://github.com/apache/doris-spark-connector/pull/271)
- 로그 메시지를 개선했습니다. [#274](https://github.com/apache/doris-spark-connector/pull/274)
- 릴리스 스크립트를 추가했습니다. [#275](https://github.com/apache/doris-spark-connector/pull/275)

#### 버그 수정 {#bug-fixes-4}

- Arrow 형식으로 쓸 때 발생하는 문제를 수정했습니다. [#270](https://github.com/apache/doris-spark-connector/pull/270)
- 컬럼 가지치기 푸시다운으로 인해 발생하는 읽기 문제를 수정했습니다. [#273](https://github.com/apache/doris-spark-connector/pull/273)

### Spark Load {#spark-load-1}

#### 버그 수정 {#bug-fixes-5}

- 단위 테스트 케이스를 수정하고 CI 빌드 검사를 추가했습니다. [#272](https://github.com/apache/doris-spark-connector/pull/272)

### 감사의 말씀 {#thanks-4}

- @gnehil
- @JNSimba

## 25.0.0 {#2500}

출처: [Spark Doris Connector 릴리스 노트 25.0.0](https://github.com/apache/doris-spark-connector/issues/268)

### Spark Connector {#spark-connector-5}

#### 기능 및 개선 사항 {#features-and-improvements-6}

- Spark DataSource V2 API 푸시다운을 지원합니다. [#250](https://github.com/apache/doris-spark-connector/pull/250)
- Spark 3.2 이상에서 제한적인 limit 푸시다운을 지원합니다. [#257](https://github.com/apache/doris-spark-connector/pull/257)
- FE API 변경 사항에 대한 호환성을 추가했습니다. [#260](https://github.com/apache/doris-spark-connector/pull/260)
- Spark 3.3 이상에서 `CREATE TABLE` 문을 지원합니다. [#264](https://github.com/apache/doris-spark-connector/pull/264)

#### 버그 수정 {#bug-fixes-6}

- Spark Catalog가 JDBC 연결을 가져올 때 발생하는 드라이버 예외를 수정했습니다. [#251](https://github.com/apache/doris-spark-connector/pull/251)
- 날짜 타입을 읽을 때 발생하는 데이터 변환 예외를 수정했습니다. [#253](https://github.com/apache/doris-spark-connector/pull/253)
- MySQL 드라이버를 불러올 때 Arrow JDBC 드라이버도 불러오면서 발생하는 예외를 수정했습니다. [#254](https://github.com/apache/doris-spark-connector/pull/254)
- 스키마 컬럼 순서와 데이터 컬럼 순서가 일치하지 않는 문제를 수정했습니다. [#256](https://github.com/apache/doris-spark-connector/pull/256)
- Flight SQL을 통해 JSON 타입 데이터를 읽을 때 발생하는 예외를 수정했습니다. [#263](https://github.com/apache/doris-spark-connector/pull/263)
- `spark.sql.datetime.java8API.enabled`가 활성화된 상태에서 날짜 타입 데이터를 읽을 때 발생하는 예외를 수정했습니다. [#265](https://github.com/apache/doris-spark-connector/pull/265)

### Spark Load {#spark-load-2}

#### 기능 및 개선 사항 {#features-and-improvements-7}

- 객체 스토리지를 기반으로 한 작업 실행을 지원합니다. [#266](https://github.com/apache/doris-spark-connector/pull/266)

### 감사의 말씀 {#thanks-5}

- @gnehil
- @JNSimba
