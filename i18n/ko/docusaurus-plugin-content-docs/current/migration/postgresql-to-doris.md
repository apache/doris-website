---
{
    "title": "PostgreSQL에서 Doris로 마이그레이션",
    "language": "ko",
    "description": "JDBC로 PostgreSQL을 배치 마이그레이션하고 CDC, 타입 매핑 및 검증 방식을 선택합니다."
}
---

이 가이드에서는 PostgreSQL JDBC Catalog를 사용해 안정적인 스냅샷을 Doris 내부 테이블로 복사합니다. 일회성 또는 정기 배치 마이그레이션에 적합하며, 이후의 업데이트, 삭제 또는 DDL은 자동으로 반영하지 않습니다. 지속적 동기화가 필요하면 아래 CDC 옵션을 참고하세요.

## 사전 준비 {#prerequisites}

- `migration_source`라는 PostgreSQL 데이터베이스와 예제 테이블에 대한 SELECT 권한이 있는 소스 계정이 필요합니다.
- 모든 Doris FE/BE에서 소스에 연결할 수 있어야 합니다. `postgresql-42.5.6.jar`는 [PostgreSQL Catalog](../lakehouse/catalogs/jdbc-pg-catalog.md) 및 [드라이버 배포](../lakehouse/catalogs/jdbc-catalog-overview.md) 문서를 따라 설치하세요. 예제에서는 드라이버 파일 이름을 사용하므로, 모든 FE/BE 노드의 `jdbc_drivers_dir`에 Jar 파일이 있어야 합니다.
- Catalog/데이터베이스/테이블 생성, 외부 테이블 읽기, 대상 데이터 적재 권한이 있는 Doris 계정이 필요합니다. [권한 부여](../admin-manual/auth/authorization/internal.md)를 참고하세요.
- `migration_source`에서 소스 준비 작업을 실행하고, 빈 대상 테이블을 사용하세요. 예제의 호스트, 사용자 이름, 비밀번호를 실제 값으로 바꾸세요.

## 기본 사용법 {#basic-usage}

### 1. 소스 테이블 준비 {#1-prepare-the-source-table}

CREATE 및 INSERT 권한이 있는 계정으로 소스 데이터베이스에 다음 예제를 준비하세요. Catalog 연결에는 앞서 설명한 소스 읽기 계정을 사용합니다.

```sql
CREATE TABLE public.migration_demo (
    id BIGINT PRIMARY KEY,
    amount DECIMAL(12,2),
    note VARCHAR(100)
);
INSERT INTO public.migration_demo VALUES (1, 12.50, 'first'), (2, NULL, NULL);
```

결과: 2개의 행이 있는 테이블이 생성됩니다.

### 2. Doris에서 Catalog 생성 및 확인 {#2-create-and-inspect-the-catalog-in-doris}

```sql
CREATE CATALOG migration_pg PROPERTIES (
    'type' = 'jdbc',
    'user' = 'migration_reader',
    'password' = '<source_password>',
    'jdbc_url' = 'jdbc:postgresql://pg-host:5432/migration_source',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
DESC migration_pg.public.migration_demo;
```

외부 스키마에는 `id`, `amount`, `note`가 있어야 합니다. 대상을 생성하기 전에 실제로 매핑된 타입을 확인하세요.

### 3. 대상 생성 및 데이터 복사 {#3-create-the-target-and-copy-the-data}

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.pg_demo (
    id BIGINT NOT NULL,
    amount DECIMAL(12,2),
    note STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.pg_demo (id, amount, note)
SELECT id, amount, note FROM migration_pg.public.migration_demo;

SELECT id, amount, note FROM migration_target.pg_demo ORDER BY id;
```

```text
+------+--------+-------+
| id   | amount | note  |
+------+--------+-------+
|    1 |  12.50 | first |
|    2 |   NULL | NULL  |
+------+--------+-------+
```

로컬에서 검증하기 쉽도록 예제에서는 복제본 하나와 버킷 하나를 사용합니다. 프로덕션 테이블은 사용 가능한 BE와 신뢰성 요구 사항에 맞게 규모를 설정하세요. INSERT를 반복하면 중복 행이 추가됩니다.
## 연결 옵션 {#connection-options}

| 매개변수 | 타입 | 필수 여부 / 기본값 | 설명 |
| --- | --- | --- | --- |
| `type` | STRING | 필수, 기본값 없음 | `jdbc` 사용 |
| `user` / `password` | STRING | 필수, 기본값 없음 | 소스 데이터베이스 인증 정보 |
| `jdbc_url` | STRING | 필수, 기본값 없음 | 데이터베이스 이름을 포함한 소스 JDBC 연결 URL |
| `driver_url` | STRING | 필수, 기본값 없음 | 모든 FE/BE에서 접근할 수 있는 Jar 파일. 이 예제에서는 사전 설치된 파일의 이름을 사용 |
| `driver_class` | STRING | 필수, 기본값 없음 | 선택한 드라이버의 Java 클래스 |

연결 풀, 이름 매핑, 드라이버 위치 제어에 관한 내용은 [전체 JDBC 참조 문서](../lakehouse/catalogs/jdbc-catalog-overview.md)를 참고하세요.

## 타입 및 버전별 차이 {#data-type-mapping}

- JDBC는 PostgreSQL의 `json/jsonb`를 `STRING`으로 매핑하며, `VARIANT`로 자동 매핑하지 않습니다. 대상에서 다른 타입을 사용한다면 명시적으로 변환하고 검증하세요.
- Catalog는 PostgreSQL의 `time`, `timetz`, `interval`에 문자열 매핑을 사용합니다. 그렇다고 Doris에 TIME 타입이 없다는 뜻은 아닙니다.
- `numeric`은 유효한 정밀도가 없거나 지원되는 decimal 범위를 벗어나면 `STRING`으로 매핑될 수 있습니다. 수치 계산을 수행하기 전에 외부 타입을 확인하세요.
- 4.1 계열에서는 4.1.5부터 `timestamptz`가 `TIMESTAMPTZ`로, `bytea`가 `VARBINARY`로 매핑됩니다. 이전 버전의 매핑과 설정은 다릅니다. Dev는 현재 매핑을 사용합니다. 시간대, 정밀도, 바이너리 값의 바이트 단위 일치 여부를 검증하세요.
- 배열 차원 추론에는 소스 데이터가 필요하며, 사용할 수 있는 데이터가 없으면 지원되지 않는 타입이라는 결과가 나올 수 있습니다. [PostgreSQL 매핑 참조 문서](../lakehouse/catalogs/jdbc-pg-catalog.md)를 기준으로 각 컬럼을 검증하세요.

## 지속적 동기화 {#continuous-synchronization}

마이그레이션에서 초기 스냅샷을 전달하고 이후의 업데이트와 삭제를 반영해야 한다면 [Flink CDC 동기화](../connection-integration/data-integration/flink-doris-connector/cdc-sync.md)를 사용하세요. 개별적으로 제시된 최소 버전 조건을 조합하지 말고, 커넥터 참조 문서에서 서로 호환되는 Flink, CDC, Doris Connector 버전을 선택하세요.

<version since="dev">

</version>

Dev는 [네이티브 PostgreSQL CDC](../data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md)도 제공합니다. 테이블을 자동으로 생성하는 이 방식에는 소스 기본 키가 필요하며, 현재 at-least-once 시맨틱을 제공합니다. 로그 권한, 복제 리소스, 모니터링은 해당 참조 문서를 따르세요. 이 페이지의 JDBC 타입 매핑을 해당 방식에 적용하지 마세요.

## 검증 및 오류 {#validation-and-errors}

동일한 스냅샷과 한정된 범위에 대해 `COUNT(*)`, `COUNT(amount)`, `SUM(amount)`를 소스 `migration_pg.public.migration_demo`와 대상 `migration_target.pg_demo`에서 실행하세요. 이 예제에서는 각각 `2`, `1`, `12.50`이 반환되어야 합니다. 예제 값의 정확한 일치 여부, NULL, 정밀도, 시간대도 확인하세요. 전체 검증 및 전환 절차는 [마이그레이션 개요](./overview.md)를 참고하세요.

연결에 실패하면 모든 FE/BE 노드에서의 연결 가능 여부, 드라이버 파일, 소스 권한, 드라이버 위치 제한을 확인하세요. `DESC`로 확인하고 호환되지 않는 타입은 명시적으로 변환하세요. 가져오기에 실패한 경우 재시도하기 전에 어떤 범위가 기록되었는지 확인하세요. 전체 INSERT를 무작정 반복하지 마세요.

## 권장 사항 {#best-practices}

이 작은 테이블로 환경을 검증한 뒤, 더 큰 마이그레이션은 안정적인 키나 시간 범위를 기준으로 배치 처리하세요. 지속적 복제에는 업데이트, 삭제, 재처리를 처리할 수 있는 대상 모델이 필요합니다. 스냅샷 테이블과 지속적으로 동기화되는 미러 테이블을 별도로 설계하세요.
