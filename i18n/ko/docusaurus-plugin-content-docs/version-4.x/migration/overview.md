---
{
    "title": "마이그레이션 개요",
    "language": "ko",
    "description": "마이그레이션 방식을 선택하고, 대상 테이블을 설계하고, 결과를 검증하세요."
}
---

Apache Doris는 외부 Catalog, CDC 도구 및 파일 데이터 적재를 통한 마이그레이션을 지원합니다. 테이블 데이터를 복사해도 소스의 트랜잭션, 인덱스, 제약 조건, 프로시저, 권한 또는 SQL 의미 체계가 마이그레이션되지는 않습니다. 일회성 스냅샷이 필요한지, 아니면 업데이트와 삭제를 지속적으로 반영해야 하는지 먼저 결정하세요.

## 마이그레이션 경로 {#migration-paths}

| 소스 | 일회성 또는 배치 마이그레이션 | 지속적인 동기화 |
| --- | --- | --- |
| [PostgreSQL](./postgresql-to-doris.md) | PostgreSQL JDBC Catalog + `INSERT INTO ... SELECT` | Flink CDC |
| [MySQL](./mysql-to-doris.md) | MySQL JDBC Catalog + `INSERT INTO ... SELECT` | Flink CDC |
| [Elasticsearch](./elasticsearch-to-doris.md) | ES Catalog + `INSERT INTO ... SELECT` | 변경 사항 캡처, 업데이트 및 삭제 처리를 별도로 설계 |
| [ClickHouse / Greenplum](./other-olap-to-doris.md) | 해당 JDBC Catalog 또는 파일 데이터 적재 | 소스 시스템에 따라 다름 |
| [Hive / Iceberg / Hudi](./other-olap-to-doris.md#data-lake) | 해당 레이크하우스 Catalog + `INSERT INTO ... SELECT` | 예약된 배치 또는 적절한 커넥터 |

Catalog를 사용하면 외부 데이터를 쿼리할 수 있습니다. Catalog를 생성해도 데이터가 Doris 내부 테이블로 복사되지는 않습니다. 배치 `INSERT INTO ... SELECT`는 이후의 업데이트나 삭제를 지속적으로 캡처하지 않습니다.

## 기본 작업 흐름 {#basic-workflow}

1. 모든 FE/BE에서의 연결 가능 여부, 드라이버 배포 상태, 소스 읽기 권한, Catalog/테이블 생성 및 데이터 적재에 필요한 Doris 권한을 확인하세요.
2. 안정적인 소스 스냅샷을 확보하거나 쓰기가 발생하지 않는 시간 구간을 마련하세요. 여러 테이블 또는 배치에 걸친 Catalog 쿼리가 자동으로 전역적으로 일관된 스냅샷을 구성하지는 않습니다.
3. `DESC catalog.database.table`로 실제 매핑을 확인하고 적절한 [데이터 모델](../table-design/data-model/intro.mdx)을 사용해 대상 테이블을 설계하세요. 소스의 키, 엔진 또는 인덱스를 그대로 복사하지 마세요.
4. 소규모 시험 마이그레이션을 완료하세요. MySQL 및 PostgreSQL 가이드에는 재현 가능한 테이블 설정, 데이터 가져오기 및 쿼리 결과가 포함되어 있습니다.
5. 범위가 한정된 키 또는 시간 구간별로 데이터를 가져오고, 완료된 구간과 CDC 위치를 기록하고, 결과를 검증한 다음 읽기 트래픽을 전환하세요.

## 설정 및 타입 {#configuration-and-types}

| 항목 | 확인 사항 |
| --- | --- |
| Catalog | 드라이버, 연결 주소, 인증 및 드라이버 위치 제어 설정. [JDBC Catalog](../lakehouse/catalogs/jdbc-catalog-overview.md) 또는 [ES Catalog](../lakehouse/catalogs/es-catalog.md) 참조 |
| 대상 테이블 | 키 모델, 파티션, 버킷, 복제본 및 업데이트 순서 |
| 타입 매핑 | 매핑은 데이터 가져오기 방식, 드라이버 및 Doris 버전에 따라 달라집니다. JDBC 매핑과 CDC 매핑은 다릅니다 |
| 시간 및 바이너리 데이터 | 시간대, 마이크로초 정밀도 및 바이트 보존 여부를 확인하세요. 일부 JDBC 매핑은 4.1.5에서 변경되었으므로 배포된 버전의 참조 문서를 사용하세요 |
| 증분 동기화 | 스냅샷과 로그 위치 간 전환, 기본 키, 재실행, 업데이트 및 삭제 |

## 검증 및 전환 {#validation-and-cutover}

동일한 소스 스냅샷과 한정된 범위에 대해 행 수, 고유 키, NULL 수, 숫자 합계 및 최솟값과 최댓값을 비교하세요. 타임스탬프, 소수, 바이너리 데이터, 배열 및 반정형 컬럼의 값을 샘플링하여 정확히 일치하는지 확인하세요. 행 수가 일치한다는 사실만으로 정확성이 입증되지는 않습니다.

지속적으로 동기화하는 경우 삽입, 업데이트, 삭제뿐 아니라 지연과 재시작 시 동작도 테스트하세요. 검증을 마친 후에만 애플리케이션의 읽기를 전환하고, 소스 데이터와 롤백 경로를 유지하세요.

## 오류 및 주의 사항 {#errors-and-caveats}

- 배치 INSERT를 반복하면 특히 Duplicate Key 테이블에서 행이 중복될 수 있습니다. 재개하기 전에 재실행 전략을 정의하세요. Unique Key 테이블은 소스에서 삭제된 행을 자동으로 제거하지 않습니다.
- 여러 배치를 실행하는 동안 소스가 변경되면 누락이나 중복이 발생할 수 있습니다. 일관된 스냅샷, 쓰기가 없는 시간 구간 또는 신뢰할 수 있는 CDC 전환 절차를 사용하세요.
- 지원되지 않는 타입, 대소문자 차이 또는 정밀도 변경이 있으면 `DESC`로 외부 테이블을 확인하고, 명시적으로 변환한 다음 다시 검증하세요. 호환되지 않는 컬럼을 별도의 안내 없이 생략하지 마세요.
- 동기식 INSERT, 비동기 데이터 적재 작업, Flink 및 Streaming Jobs는 서로 다른 상태 확인 인터페이스를 사용합니다. 모든 방식에서 `SHOW LOAD`에 의존하지 말고 해당 데이터 적재 참조 문서를 따르세요.

## 모범 사례 {#best-practices}

대표성 있는 소규모 테이블부터 시작한 다음, 측정된 데이터 양, 쿼리 부하 및 사용 가능한 리소스에 맞춰 배치 크기와 동시 실행 수를 조정하세요. 전환 전에 쿼리 결과와 업데이트 동작을 검증하고, 완료된 구간과 검증 기록을 보관하세요.
