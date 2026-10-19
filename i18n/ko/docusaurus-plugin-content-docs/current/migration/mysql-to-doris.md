---
{
    "title": "MySQL에서 Doris로 마이그레이션",
    "language": "ko",
    "description": "JDBC로 MySQL 데이터를 배치 단위로 마이그레이션하고 CDC, 타입 매핑, 검증 방식을 선택합니다."
}
---

이 가이드에서는 MySQL JDBC Catalog를 사용하여 안정적인 스냅샷을 Doris 내부 테이블로 복사합니다. 이 방식은 일회성 또는 주기적인 배치 마이그레이션에 적합하며, 이후의 업데이트, 삭제 또는 DDL을 자동으로 반영하지 않습니다. 지속적인 동기화가 필요하면 아래의 CDC 옵션을 참조하세요.

## 사전 요구 사항 {#prerequisites}

- `migration_source`라는 MySQL 데이터베이스와 예제 테이블에 대한 SELECT 권한이 있는 소스 계정이 필요합니다.
- 모든 Doris FE/BE에서 소스에 연결할 수 있어야 합니다. `mysql-connector-j-8.3.0.jar`는 [MySQL Catalog](../lakehouse/catalogs/jdbc-mysql-catalog.md) 및 [드라이버 배포](../lakehouse/catalogs/jdbc-catalog-overview.md) 참조 문서에 따라 설치하세요. 이 예제는 드라이버 파일명을 사용하므로 모든 FE/BE 노드의 `jdbc_drivers_dir`에 Jar 파일이 있어야 합니다.
- Catalog, 데이터베이스, 테이블을 생성하고 외부 테이블을 읽으며 대상에 데이터 적재를 수행할 권한이 있는 Doris 계정이 필요합니다. [권한 관리](../admin-manual/auth/authorization/internal.md)를 참조하세요.
- `migration_source`에서 소스 환경을 준비하고, 비어 있는 대상 테이블을 사용하세요. 예제의 호스트, 사용자 이름, 비밀번호는 실제 값으로 바꾸세요.

## 기본 사용법 {#basic-usage}

### 1. 소스 테이블 준비 {#1-prepare-the-source-table}

CREATE 및 INSERT 권한이 있는 계정으로 소스 데이터베이스에 다음 예제를 준비하세요. Catalog 연결에는 위에서 설명한 소스 읽기 계정을 사용합니다.

```sql
CREATE TABLE migration_demo (
    id BIGINT PRIMARY KEY,
    amount DECIMAL(12,2),
    note VARCHAR(100)
);
INSERT INTO migration_demo VALUES (1, 12.50, 'first'), (2, NULL, NULL);
```

결과: 2개의 행이 있는 테이블이 생성됩니다.

### 2. Doris에서 Catalog 생성 및 확인 {#2-create-and-inspect-the-catalog-in-doris}

```sql
CREATE CATALOG migration_mysql PROPERTIES (
    'type' = 'jdbc',
    'user' = 'migration_reader',
    'password' = '<source_password>',
    'jdbc_url' = 'jdbc:mysql://mysql-host:3306/migration_source',
    'driver_url' = 'mysql-connector-j-8.3.0.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
DESC migration_mysql.migration_source.migration_demo;
```

외부 스키마에는 `id`, `amount`, `note`가 포함되어 있어야 합니다. 대상 테이블을 생성하기 전에 실제로 매핑된 타입을 확인하세요.

### 3. 대상 테이블 생성 및 데이터 복사 {#3-create-the-target-and-copy-the-data}

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.mysql_demo (
    id BIGINT NOT NULL,
    amount DECIMAL(12,2),
    note STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.mysql_demo (id, amount, note)
SELECT id, amount, note FROM migration_mysql.migration_source.migration_demo;

SELECT id, amount, note FROM migration_target.mysql_demo ORDER BY id;
```

```text
+------+--------+-------+
| id   | amount | note  |
+------+--------+-------+
|    1 |  12.50 | first |
|    2 |   NULL | NULL  |
+------+--------+-------+
```

로컬에서 검증하기 쉽도록 복제본과 버킷을 각각 하나씩 사용합니다. 운영 테이블은 사용 가능한 BE와 안정성 요구 사항에 맞게 구성하세요. INSERT를 반복 실행하면 중복 행이 추가됩니다.
## 연결 옵션 {#connection-options}

| 매개변수 | 타입 | 필수 여부 / 기본값 | 설명 |
| --- | --- | --- | --- |
| `type` | STRING | 필수, 기본값 없음 | `jdbc` 사용 |
| `user` / `password` | STRING | 필수, 기본값 없음 | 소스 데이터베이스 인증 정보 |
| `jdbc_url` | STRING | 필수, 기본값 없음 | 데이터베이스 이름을 포함한 소스 JDBC 연결 URL |
| `driver_url` | STRING | 필수, 기본값 없음 | 모든 FE/BE에서 접근할 수 있는 Jar 파일. 이 예제에서는 사전 설치된 파일명을 사용합니다 |
| `driver_class` | STRING | 필수, 기본값 없음 | 선택한 드라이버의 Java 클래스 |

연결 풀, 이름 매핑, 드라이버 위치 제어에 대해서는 [JDBC 전체 참조 문서](../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하세요.

## 타입 및 버전별 차이 {#data-type-mapping}

- 부호 없는 정수는 더 넓은 범위의 타입으로 변환하세요. 예를 들어 `INT UNSIGNED`는 `BIGINT`로, `BIGINT UNSIGNED`는 `LARGEINT`로 매핑됩니다. 대응하는 부호 있는 타입으로 그대로 복사하지 마세요.
- MySQL JDBC Catalog는 JSON을 `STRING`으로 매핑하며, 자동으로 `VARIANT`로 매핑하지 않습니다. `TIME`, `ENUM`, `SET`은 Catalog의 매핑 규칙을 따르세요. JDBC와 CDC가 반드시 같은 규칙을 사용하는 것은 아닙니다.
- `TINYINT(1)`의 JDBC 메타데이터는 드라이버 설정에 따라 달라집니다. 모든 TINYINT를 Boolean으로 간주하지 말고 `DESC`로 확인하세요.
- 4.1 시리즈에서는 4.1.5부터 `TIMESTAMP`에 `TIMESTAMPTZ`를 사용하고 바이너리 타입에 `VARBINARY`를 사용합니다. `DATETIME`은 시간대 정보가 없는 날짜 및 시간 타입으로 유지됩니다. 이전 버전은 매핑과 설정이 다릅니다. Dev는 현재 매핑을 사용합니다.
- 배치 INSERT는 기본 키 동작, AUTO_INCREMENT, 인덱스 또는 소스의 제약 조건을 복사하지 않습니다. 전체 규칙은 [MySQL 매핑 참조 문서](../lakehouse/catalogs/jdbc-mysql-catalog.md)를 참조하세요.

## 지속적 동기화 {#continuous-synchronization}

마이그레이션에서 초기 스냅샷을 전달한 뒤 이후의 업데이트와 삭제도 반영해야 한다면 [Flink CDC 동기화](../connection-integration/data-integration/flink-doris-connector/cdc-sync.md)를 사용하세요. 개별적으로 명시된 최소 버전 조건을 조합하지 말고, 커넥터 참조 문서에서 서로 호환되는 Flink, CDC, Doris Connector 버전을 선택하세요.

<version since="dev">

</version>

Dev는 [네이티브 MySQL CDC](../data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md)도 제공합니다. 테이블을 자동으로 생성하는 이 방식은 소스에 기본 키가 있어야 하며, 현재 at-least-once 시맨틱을 제공합니다. 로그 권한, 복제 리소스, 모니터링은 해당 참조 문서를 따르세요. 이 페이지의 JDBC 타입 매핑을 이 방식에 적용하지 마세요.

## 검증 및 오류 {#validation-and-errors}

동일한 스냅샷과 한정된 범위를 기준으로 `COUNT(*)`, `COUNT(amount)`, `SUM(amount)`를 소스 `migration_mysql.migration_source.migration_demo`와 대상 `migration_target.mysql_demo`에서 실행하세요. 이 예제에서는 각각 `2`, `1`, `12.50`이 반환되어야 합니다. 샘플 값이 정확히 일치하는지, NULL, 정밀도, 시간대도 확인하세요. 전체 검증 및 전환 절차는 [마이그레이션 개요](./overview.md)를 참조하세요.

연결에 실패하면 모든 FE/BE 노드에서의 연결 가능 여부, 드라이버 파일, 소스 권한, 드라이버 위치 제한을 확인하세요. `DESC`로 타입을 확인하고 호환되지 않는 타입은 명시적으로 변환하세요. 데이터 가져오기에 실패한 뒤에는 재시도하기 전에 어느 범위까지 기록되었는지 확인하세요. 전체 INSERT를 무작정 반복 실행하지 마세요.

## 모범 사례 {#best-practices}

이 작은 테이블로 환경을 검증한 다음, 더 큰 규모의 마이그레이션은 안정적인 키나 시간 범위를 기준으로 배치를 나누어 진행하세요. 지속적인 복제에는 업데이트, 삭제, 재처리를 처리할 수 있는 대상 모델이 필요합니다. 스냅샷 테이블과 지속적으로 동기화되는 미러 테이블은 별도로 설계하세요.
