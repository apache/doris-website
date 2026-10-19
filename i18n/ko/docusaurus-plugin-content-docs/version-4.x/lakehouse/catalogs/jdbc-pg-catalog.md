---
{
    "title": "PostgreSQL JDBC Catalog",
    "language": "ko",
    "description": "Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 PostgreSQL 데이터베이스에 연결할 수 있습니다."
}
---

Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 PostgreSQL 데이터베이스에 연결할 수 있습니다. 이 문서에서는 PostgreSQL 데이터베이스 연결을 구성하는 방법을 설명합니다.

JDBC Catalog에 대한 개요는 [JDBC Catalog 개요](./jdbc-catalog-overview.md)를 참고하세요.

## 사용 시 참고 사항 {#usage-notes}

PostgreSQL 데이터베이스에 연결하려면 다음이 필요합니다.

* PostgreSQL 11.x 이상

* PostgreSQL 데이터베이스용 JDBC 드라이버. [Maven 저장소](https://mvnrepository.com/artifact/org.postgresql/postgresql)에서 최신 버전이나 특정 버전을 다운로드할 수 있습니다. PostgreSQL JDBC Driver 버전 42.5.x 이상을 사용하는 것이 좋습니다.

* Doris의 각 FE 및 BE 노드와 PostgreSQL 서버 간의 네트워크 연결. 기본 포트는 5432입니다.

## PostgreSQL에 연결하기 {#connecting-to-postgresql}

```sql
CREATE CATALOG postgresql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:postgresql://host:5432/postgres',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
```

`jdbc_url`은 PostgreSQL JDBC 드라이버에 전달할 연결 정보와 매개변수를 정의합니다. 지원되는 URL 매개변수는 [PostgreSQL JDBC Driver 문서](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)에서 확인할 수 있습니다.

### 연결 보안 {#connection-security}

데이터 소스에 전역적으로 신뢰할 수 있는 인증서를 설치하고 TLS를 구성했다면, jdbc\_url 속성에 설정된 JDBC 연결 문자열에 매개변수를 추가하여 클러스터와 데이터 소스 간에 TLS를 활성화할 수 있습니다.

예를 들어 PostgreSQL JDBC 드라이버 버전 42에서는 jdbc\_url 구성 속성에 ssl=true 매개변수를 추가하여 TLS를 활성화할 수 있습니다.

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```

TLS 구성 옵션에 대한 자세한 내용은 [PostgreSQL JDBC Driver 문서](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)를 참고하세요.

## 계층 구조 매핑 {#hierarchical-mapping}

PostgreSQL을 매핑할 때 Doris의 데이터베이스는 PostgreSQL의 지정된 데이터베이스 아래에 있는 스키마에 해당합니다(예제의 `jdbc_url` 매개변수에서는 `postgres` 아래의 스키마). Doris 데이터베이스의 테이블은 PostgreSQL의 해당 스키마 아래에 있는 테이블에 해당합니다. 매핑 관계는 다음과 같습니다.

| Doris    | PostgreSQL |
| -------- | ---------- |
| Catalog  | 데이터베이스   |
| 데이터베이스 | 스키마     |
| 테이블    | 테이블      |

## 컬럼 유형 매핑 {#column-type-mapping}

| PostgreSQL 유형                         | Doris 유형             |                                                                 |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| boolean                                 | boolean                |                                                                 |
| smallint/int2                           | smallint               |                                                                 |
| integer/int4                            | int                    |                                                                 |
| bigint/int8                             | bigint                 |                                                                 |
| decimal/numeric                         | decimal(P, S) / string | 정밀도가 지정되지 않은 Numeric은 string 유형으로 매핑됩니다. 수치 연산을 하려면 decimal 유형으로 변환해야 하며, write-back은 지원하지 않습니다.    |
| real/float4                             | float                  |                                                                 |
| double                                  | double                 |                                                                 |
| smallserial                             | smallint               |                                                                 |
| serial                                  | int                    |                                                                 |
| bigserial                               | bigint                 |                                                                 |
| char(N)                                 | char(N)                |                                                                 |
| varchar/text                            | string                 |                                                                 |
| timestamp(S)              | datetime(S)            |                                                                 |
| timestamptz(S) | TIMESTAMPTZ(S) | 4.1.5부터 이 유형은 항상 `TIMESTAMPTZ(S)`로 매핑됩니다. `enable.mapping.timestamp_tz` 속성은 호환성을 위해 유지되지만, `false`로 설정해도 더 이상 `DATETIME` 매핑으로 되돌아가지 않습니다. 정밀도는 최대 6으로 제한되므로 이를 초과하는 정밀도는 손실됩니다. 이전 버전에서는 이 속성으로 기존 매핑을 선택할 수 있습니다. |
| date                                    | date                   |                                                                 |
| json/jsonb                              | string                 | 읽기 성능과 연산 성능 간의 균형을 위해 Doris는 JSON 유형을 STRING 유형으로 매핑합니다.                   |
| time                                    | string                 | Doris는 time 유형을 지원하지 않으므로 time 유형은 string으로 매핑됩니다.                          |
| interval                                | string                 |                                                                 |
| point/line/lseg/box/path/polygon/circle | string                 |                                                                 |
| cidr/inet/macaddr                       | string                 |                                                                 |
| uuid                                    | string                 |                                                                 |
| bit                                     | boolean / string       | Doris는 bit 유형을 지원하지 않습니다. bit(1)인 경우 boolean으로 매핑되고, 그 외에는 string으로 매핑됩니다. |
| bytea | VARBINARY | 4.1.5부터 이 유형은 항상 `VARBINARY`로 매핑됩니다. `enable.mapping.varbinary` 속성은 호환성을 위해 유지되지만, `false`로 설정해도 더 이상 `STRING` 매핑으로 되돌아가지 않습니다. 이전 버전에서는 이 속성으로 기존 매핑을 선택할 수 있습니다. |
| array                                   | array                  | 배열 유형의 매핑 방법은 아래 설명을 참고하세요. |
| 기타                                   | UNSUPPORTED            |                                                                 |

- 배열 유형

    PostgreSQL에서는 배열 유형을 다음과 같이 정의할 수 있습니다.

    ```
    col1 text[]
    col2 in4[][]
    ```

    하지만 PostgreSQL 메타데이터에서 배열의 차원 수를 직접 가져올 수는 없습니다. 예를 들어 `text[]`는 일차원 배열일 수도 있고 이차원 배열일 수도 있습니다. 배열의 차원 수는 데이터가 기록된 후에만 확인할 수 있습니다.

    Doris에서는 배열의 차원 수를 명시적으로 선언해야 합니다. 따라서 PostgreSQL의 해당 배열 컬럼에 데이터가 있어야만 Doris가 올바르게 매핑할 수 있습니다. 그렇지 않으면 해당 배열 컬럼은 `UNSUPPORTED`로 매핑됩니다.

## 부록 {#appendix}

### 시간대 문제 {#time-zone-issues}

Doris는 시간대가 포함된 timestamp 유형을 지원하지 않으므로, PostgreSQL에서 timestampz 유형을 읽을 때 이를 DATETIME 유형으로 매핑하고 로컬 시간대의 시간으로 변환합니다.

또한 JDBC 유형의 Catalog에서 데이터를 읽을 때 BE의 Java 부분은 JVM 시간대를 사용합니다. JVM 시간대의 기본값은 BE가 배포된 머신의 시간대이며, 이는 JDBC로 데이터를 읽을 때 시간대 변환에 영향을 줍니다.

시간대를 일관되게 유지하려면 `JAVA_OPTS`를 통해 `be.conf`에 설정하는 JVM 시간대를 Doris 세션의 `time_zone`과 동일하게 설정하는 것이 좋습니다.
