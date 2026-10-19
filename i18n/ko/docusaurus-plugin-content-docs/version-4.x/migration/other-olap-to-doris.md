---
{
    "title": "다른 OLAP 시스템에서 Doris로 마이그레이션",
    "language": "ko",
    "description": "ClickHouse, Greenplum 및 레이크하우스 테이블의 마이그레이션 경로와 검증 방법을 선택합니다."
}
---

ClickHouse, Greenplum 및 레이크하우스 테이블은 각각에 해당하는 Catalog를 통해 Doris로 복사할 수 있습니다. 대상 모델을 선택하기 전에 스냅샷, 업데이트 및 집계의 동작 방식을 정의하세요. Doris가 원본 스토리지 엔진과 완전히 동등한 동작을 자동으로 제공하지는 않습니다.

## 마이그레이션 경로 및 사전 요구 사항 {#routes-and-prerequisites}

| 원본 | 연결 및 옵션 참조 문서 | 마이그레이션 전 확인 사항 |
| --- | --- | --- |
| ClickHouse | [ClickHouse JDBC Catalog](../lakehouse/catalogs/jdbc-clickhouse-catalog.md) | 드라이버, 부호 없는 정수, 날짜·시간 및 복합 타입 매핑 |
| Greenplum | [PostgreSQL JDBC Catalog](../lakehouse/catalogs/jdbc-pg-catalog.md) | 호환 드라이버, 실제 메타데이터 및 분산 내보내기의 일관성 |
| Hive | [Hive Catalog](../lakehouse/catalogs/hive-catalog.mdx) | Metastore, 파일 스토리지, 인증 및 파티션 |
| Iceberg | [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.mdx) | 메타데이터 서비스, 스토리지 권한 및 일관된 스냅샷 |
| Hudi | [Hudi Catalog](../lakehouse/catalogs/hudi-catalog.md) | 테이블 유형, 조회되는 뷰, 기반 파일 및 쿼리 제한 사항 |

모든 FE/BE에서 필요한 서비스, 드라이버 및 스토리지에 접근할 수 있어야 합니다. 해당 참조 문서에 따라 Catalog를 구성하고, 외부 테이블을 읽고 대상 테이블을 생성하고 데이터를 적재할 권한이 있는 Doris 계정을 사용하세요.

## ClickHouse {#clickhouse}

JDBC Catalog를 사용하고 `INSERT INTO ... SELECT`에 열을 명시하세요. 먼저 `DESC`를 실행하세요. 제안된 대상 설계는 실제 JDBC 매핑을 나타내는 것이 아닙니다. 예를 들어 Catalog는 ClickHouse의 `FixedString`이 CHAR로 직접 매핑된다고 보장하지 않습니다. 실제로 사용하는 드라이버와 Doris 버전에서 Map/Tuple 및 기타 복합 타입의 지원 여부를 테스트하세요.

`ReplacingMergeTree`, `CollapsingMergeTree` 및 집계 상태 테이블의 경우 최종적으로 조회되는 행, 버전 열, 삭제 마커 및 병합 규칙을 확정하세요. Doris Unique Key 테이블이 원본 엔진의 모든 동작 의미를 자동으로 재현하지는 않습니다. NULL 처리, 최댓값·최솟값이 같은 행의 처리, 배열 확장 및 JSON 문자열 추출과 관련된 SQL 차이를 테스트하세요.

## Greenplum {#greenplum}

[PostgreSQL 마이그레이션](./postgresql-to-doris.md)의 배치 워크플로를 따르되, 실제 Greenplum 매핑을 확인하세요. 병렬 내보내기와 SQL 배치는 일관된 원본 데이터 뷰를 공유해야 합니다. 동시 실행만으로는 테이블 간에 일관된 스냅샷이 보장되지 않습니다.

## 데이터 레이크 {#data-lake}

각각에 해당하는 Hive, Iceberg 및 Hudi Catalog를 사용하세요. 마이그레이션 중에는 사용할 Iceberg 스냅샷을 고정하세요. Hudi의 경우 어떤 뷰를 읽는지, 배포된 버전이 어떤 테이블 유형을 지원하는지 확인하세요. Catalog를 생성하면 외부 데이터에 접근할 수 있게 될 뿐이며, Doris에 복사본이 생성되지는 않습니다.

## 기본 사용법 {#basic-usage}

위에서 설명한 대로 `source_catalog`가 구성되어 있고, `analytics.migration_demo`에 `id BIGINT`와 `value DECIMAL(12,2)`가 포함되어 있으며, 원본 스냅샷이 고정되어 있다고 가정합니다. `DESC`로 이러한 타입을 확인한 다음 Doris에서 다음을 실행하세요.

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.olap_demo (
    id BIGINT,
    `value` DECIMAL(12,2)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.olap_demo (id, `value`)
SELECT id, `value` FROM source_catalog.analytics.migration_demo;

SELECT COUNT(*), SUM(`value`) FROM source_catalog.analytics.migration_demo;
SELECT COUNT(*), SUM(`value`) FROM migration_target.olap_demo;
```

예상 결과: 비어 있는 대상 테이블에 원본 스냅샷에서 선택한 두 열이 모두 적재되고, 두 검증 쿼리가 동일한 행 수와 합계를 반환합니다. 복제본 하나와 버킷 하나는 예시일 뿐입니다. 운영 테이블의 규모는 리소스와 안정성 요구에 맞게 설정하세요. 고정된 입력을 사용하는 전체 예제는 [MySQL](./mysql-to-doris.md) 또는 [PostgreSQL](./postgresql-to-doris.md)을 참조하세요.

## 기타 데이터 적재 방법 {#other-loading-methods}

직접 연결할 수 없다면 지원되는 형식의 파일로 내보낸 다음 [S3 Load](../data-operate/import/data-source/amazon-s3.md) 또는 [Broker Load](../data-operate/import/import-way/broker-load-manual.md)를 사용하세요. 가져오기 규모를 늘리기 전에 파일 형식, 인코딩, NULL 표현 방식, 정밀도 및 시간대를 확정하세요.

[Spark Connector](../connection-integration/data-integration/spark-doris-connector.md) 또는 [Flink Connector](../connection-integration/data-integration/flink-doris-connector.md)를 사용할 수도 있습니다. 배치 및 스트리밍 기능, 호환 버전, 동작 의미는 각 커넥터의 참조 문서를 따르세요.

## 오류 및 모범 사례 {#errors-and-best-practices}

배치 크기나 동시 실행 수를 늘리기 전에 범위가 제한된 샘플로 검증하세요. 지원되지 않는 타입은 명시적으로 변환하고, 열을 건너뛰는 대신 정밀도 손실을 확인하세요. Duplicate Key 대상 테이블에 INSERT를 반복하면 중복 행이 추가됩니다. 작업을 재개하기 전에 완료된 범위를 확정하세요. 전환 전에 [마이그레이션 개요](./overview.md)의 시스템 간 검증을 완료하고 원본 데이터와 롤백 경로를 유지하세요.
