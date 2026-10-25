---
{
    "title": "Doris Flink Connector",
    "language": "ko",
    "description": "Doris Flink Connector 릴리스 노트."
}
---

# Doris Flink Connector {#doris-flink-connector}

이 문서는 Doris Flink Connector의 릴리스 노트를 최신 버전부터 나열합니다.

## 26.3.0 {#2630}

출처: [릴리스 노트 26.3.0](https://github.com/apache/doris-flink-connector/issues/699)

### 기능 및 개선 사항 {#features-and-improvements}

- Doris Source의 로깅과 오프셋 검증을 개선했습니다. [#692](https://github.com/apache/doris-flink-connector/pull/692)
- Flink 2.3 지원을 추가했습니다. [#696](https://github.com/apache/doris-flink-connector/pull/696)
- CDC TSO 처리와 S3 TVF 업로드 효율을 개선했습니다. [#694](https://github.com/apache/doris-flink-connector/pull/694)
- 가시성 확인 대기 시간이 초과되면 증분 읽기를 다시 시도하도록 했습니다. [#697](https://github.com/apache/doris-flink-connector/pull/697)
- S3 TVF 싱크에 IAM 역할과 gzip 압축 지원을 추가했습니다. [#698](https://github.com/apache/doris-flink-connector/pull/698)

### 감사의 말 {#thanks}

- @JNSimba

## 26.2.0 {#2620}

출처: [릴리스 노트 26.2.0](https://github.com/apache/doris-flink-connector/issues/691)

### 기능 및 개선 사항 {#features-and-improvements-1}

- Doris Source에서 스냅샷, 증분, 초기 스캔 모드를 지원합니다. [#679](https://github.com/apache/doris-flink-connector/pull/679)
- HTTP, MySQL/JDBC, Thrift, Arrow Flight SQL을 통한 Doris 단방향 TLS 연결을 지원합니다. [#686](https://github.com/apache/doris-flink-connector/pull/686)
- S3 TVF 싱크 쓰기 모드를 지원합니다. [#688](https://github.com/apache/doris-flink-connector/pull/688)
- Flink 2.x용 JDK 21 빌드와 CI 검증을 추가했습니다. [#678](https://github.com/apache/doris-flink-connector/pull/678)
- 표준 FLIP-33 싱크 지표인 `numRecordsSend`와 `numBytesSend`를 보고하도록 했습니다. [#681](https://github.com/apache/doris-flink-connector/pull/681)
- CDC 동기화에서 PostgreSQL `regclass` 타입을 지원합니다. [#658](https://github.com/apache/doris-flink-connector/pull/658)
- Doris 회귀 테스트 프로그램을 추가했습니다. [#687](https://github.com/apache/doris-flink-connector/pull/687)

### 버그 수정 {#bug-fixes}

- 대형 테이블의 초기 스냅샷에서 체크포인트 상태가 지나치게 커지는 문제를 수정했습니다. [#690](https://github.com/apache/doris-flink-connector/pull/690)
- `DorisWriter`가 잘못된 트랜잭션을 중단하는 문제를 수정했습니다. [#683](https://github.com/apache/doris-flink-connector/pull/683)
- `fullDocument`가 JSON 문자열로 반환될 때 MongoDB CDC 파싱에 발생하는 문제를 수정했습니다. [#671](https://github.com/apache/doris-flink-connector/pull/671)
- Doris `DATETIME` 및 `TIMESTAMPTZ` 타입의 Arrow 타임스탬프 변환 문제를 수정했습니다. [#676](https://github.com/apache/doris-flink-connector/pull/676)

### 감사의 말 {#thanks-1}

- @Cq-study
- @JNSimba
- @liujiwen-up
- @Sbaia
- @Tan-JiaLiang
- @ziyanTOP

## 26.1.1 {#2611}

출처: [릴리스 노트 26.1.1](https://github.com/apache/doris-flink-connector/issues/654)

### 버그 수정 {#bug-fixes-1}

- 압축을 활성화한 상태에서 배치 싱크를 장시간 실행하면 멈출 수 있는 문제를 수정했습니다. [#653](https://github.com/apache/doris-flink-connector/pull/653)

### 감사의 말 {#thanks-2}

- @addu390

## 26.1.0 {#2610}

출처: [릴리스 노트 26.1.0](https://github.com/apache/doris-flink-connector/issues/649)

### 기능 및 개선 사항 {#features-and-improvements-2}

- Stream Load에서 gzip 압축을 기본으로 활성화했습니다. [#648](https://github.com/apache/doris-flink-connector/pull/648)

### 감사의 말 {#thanks-3}

- @JNSimba

## 26.0.0 {#2600}

출처: [릴리스 노트 26.0.0](https://github.com/apache/doris-flink-connector/issues/637)

### 기능 및 개선 사항 {#features-and-improvements-3}

- Doris `DECIMAL256` 타입을 지원합니다. [#628](https://github.com/apache/doris-flink-connector/pull/628)
- `ArrayData`의 중첩 타입 필드를 지원합니다. [#606](https://github.com/apache/doris-flink-connector/pull/606)
- UTF-8 문자 집합 인코딩을 사용하는 HTTP 요청을 지원합니다. [#623](https://github.com/apache/doris-flink-connector/pull/623)
- Thrift의 최대 메시지 크기를 설정할 수 있도록 했습니다. [#593](https://github.com/apache/doris-flink-connector/pull/593)
- 불필요한 decimal 변환을 피하도록 MongoDB CDC 타입 추론을 최적화했습니다. [#596](https://github.com/apache/doris-flink-connector/pull/596)
- FE 호스트가 유효하지 않을 때 표시되는 오류 메시지를 개선했습니다. [#629](https://github.com/apache/doris-flink-connector/pull/629)
- Flink 2.x를 지원합니다. [#636](https://github.com/apache/doris-flink-connector/pull/636)

### 버그 수정 {#bug-fixes-2}

- 그룹 커밋 재시도 중 레이블 처리 문제를 수정했습니다. [#635](https://github.com/apache/doris-flink-connector/pull/635)
- 줄 구분자가 없는 타입에 대한 배치 Stream Load 처리 문제를 수정했습니다. [#619](https://github.com/apache/doris-flink-connector/pull/619)
- Doris 필드의 기본값이 빈 문자열일 때 DDL이 잘못 생성되는 문제를 수정했습니다. [#600](https://github.com/apache/doris-flink-connector/pull/600)
- Arrow Flight 읽기에 영향을 줄 수 있는 `BackendClient`의 오타를 수정했습니다. [#622](https://github.com/apache/doris-flink-connector/pull/622)

### 감사의 말 {#thanks-4}

- @QuakeWang
- @JNSimba
- @jqcc
- @potterhe
- @kwonder0926
- @gnehil
- @keytouch
- @AlexRiedler

## 25.1.0 {#2510}

출처: [릴리스 노트 25.1.0](https://github.com/apache/doris-flink-connector/issues/590)

### 기능 및 개선 사항 {#features-and-improvements-4}

- 샤딩 환경에서 새 동기화 테이블을 자동으로 생성하도록 했습니다. [#564](https://github.com/apache/doris-flink-connector/pull/564)
- Doris Source의 기본 읽기 경로로 Arrow Flight SQL을 사용하도록 했습니다. [#574](https://github.com/apache/doris-flink-connector/pull/574)
- 통합 테스트와 엔드투엔드 테스트 사례를 추가했습니다. [#569](https://github.com/apache/doris-flink-connector/pull/569) [#577](https://github.com/apache/doris-flink-connector/pull/577) [#580](https://github.com/apache/doris-flink-connector/pull/580)
- Doris 2.1.3 이상에서 IP 타입을 읽을 수 있도록 호환성을 추가했습니다. [#576](https://github.com/apache/doris-flink-connector/pull/576)
- 릴리스 스크립트를 추가했습니다. [#567](https://github.com/apache/doris-flink-connector/pull/567)
- 배치 모드의 재시도 간격을 늘렸습니다. [#579](https://github.com/apache/doris-flink-connector/pull/579)
- MongoDB CDC 동기화 시 새 테이블을 자동으로 생성하도록 했습니다. [#573](https://github.com/apache/doris-flink-connector/pull/573)
- 사용 예시를 추가했습니다. [#589](https://github.com/apache/doris-flink-connector/pull/589)

### 버그 수정 {#bug-fixes-3}

- Stream Load 스레드가 비정상 종료된 후 Flink 작업이 멈출 수 있는 문제를 수정했습니다. [#578](https://github.com/apache/doris-flink-connector/pull/578)
- PostgreSQL CDC 동기화의 타입 변환 문제를 수정했습니다. [#582](https://github.com/apache/doris-flink-connector/pull/582)
- MongoDB CDC 동기화에서 `_id`가 아닌 ObjectId 필드의 스키마 길이가 일치하지 않는 문제를 수정했습니다. [#588](https://github.com/apache/doris-flink-connector/pull/588)

### 감사의 말 {#thanks-5}

- @Aalron
- @JNSimba
- @kwonder0926
- @vinlee19

## 25.0.0 {#2500}

출처: [릴리스 노트 25.0.0](https://github.com/apache/doris-flink-connector/issues/562)

### 기능 및 개선 사항 {#features-and-improvements-5}

- Arrow Flight SQL을 통해 Catalog 테이블을 읽을 수 있도록 했습니다. [#530](https://github.com/apache/doris-flink-connector/pull/530)
- `INSERT OVERWRITE`를 지원합니다. [#544](https://github.com/apache/doris-flink-connector/pull/544)
- 부분 limit 푸시다운을 지원합니다. [#553](https://github.com/apache/doris-flink-connector/pull/553)
- 푸시다운 중 `doris.filter.query` 옵션을 연결하도록 했습니다. [#552](https://github.com/apache/doris-flink-connector/pull/552)
- 무시할 응답 필드를 설정할 수 있도록 해 FE API 변경 사항과의 호환성을 추가했습니다. [#549](https://github.com/apache/doris-flink-connector/pull/549)
- MongoDB CDC의 `sampleSize` 계산 로직을 최적화했습니다. [#542](https://github.com/apache/doris-flink-connector/pull/542)
- 실패한 MongoDB 스키마 변경 사항을 무시하도록 했습니다. [#537](https://github.com/apache/doris-flink-connector/pull/537)
- 룩업 쿼리와 Arrow Flight 쿼리에 접두사를 추가했습니다. [#531](https://github.com/apache/doris-flink-connector/pull/531) [#530](https://github.com/apache/doris-flink-connector/pull/530)

### 버그 수정 {#bug-fixes-4}

- 극단적인 경우 쓰기 오류가 체크포인트를 우회할 수 있는 문제를 수정했습니다. [#560](https://github.com/apache/doris-flink-connector/pull/560) [#555](https://github.com/apache/doris-flink-connector/pull/555)
- HTTP 오류가 발생하면 쓰기 작업이 멈출 수 있는 문제를 수정했습니다. [#539](https://github.com/apache/doris-flink-connector/pull/539)
- MongoDB 타임스탬프 및 배열 타입의 파싱 문제를 수정했습니다. [#547](https://github.com/apache/doris-flink-connector/pull/547)
- 많은 테이블을 동기화할 때 발생하는 ORA-12733 문제를 수정했습니다. [#532](https://github.com/apache/doris-flink-connector/pull/532)
- 타임스탬프 형식의 푸시다운 오류를 수정했습니다. [#528](https://github.com/apache/doris-flink-connector/pull/528)
- SQL 파서가 스키마 테이블 주석과 필드 타입을 부정확하게 파싱하는 문제를 수정했습니다. [#540](https://github.com/apache/doris-flink-connector/pull/540)
- `Transfer-Encoding` 헤더가 이미 존재한다는 오류를 수정했습니다. [#525](https://github.com/apache/doris-flink-connector/pull/525)
- 여러 데이터베이스를 동기화할 때 발생하는 NULL 포인터 예외를 수정했습니다. [#534](https://github.com/apache/doris-flink-connector/pull/534)

### 감사의 말 {#thanks-6}

- @awol2005ex
- @DongLiang-0
- @JNSimba
- @nativeCat
- @vinlee19
- @xuqinghuang
