---
{
    "title": "Iceberg JDBC Catalog",
    "language": "ko",
    "description": "이 문서는 JDBC 인터페이스로 Iceberg Catalog 메타데이터 서비스에 연결하고 접근할 때 지원되는 매개변수를 설명합니다."
}
---

이 문서는 `CREATE CATALOG` 문을 통해 JDBC 인터페이스로 Iceberg Catalog 메타데이터 서비스에 연결하고 접근할 때 지원되는 매개변수를 설명합니다.

:::tip 참고
이 기능은 실험적 기능이며, 4.1.0 버전부터 지원됩니다.
:::

## 매개변수 개요 {#parameter-overview}

| 속성 이름 | 설명 | 기본값 | 필수 여부 |
| --- | --- | --- | --- | 
| iceberg.jdbc.uri | JDBC 연결 URI를 지정합니다. | - | 예 |
| iceberg.jdbc.catalog_name | Iceberg JDBC 메타데이터 테이블의 `catalog_name` 격리 키를 지정합니다. 이 값은 Doris Catalog 이름과 달라도 됩니다. | - | 예 |
| iceberg.jdbc.user | JDBC 연결 사용자 이름 | - | 아니요 |
| iceberg.jdbc.password | JDBC 연결 비밀번호 | - | 아니요 |
| warehouse | Iceberg warehouse를 지정합니다. | - | 예 |
| iceberg.jdbc.init-catalog-tables | 처음 사용할 때 Catalog 관련 테이블 구조를 자동으로 초기화할지 여부 | `true` | 아니요 |
| iceberg.jdbc.schema-version | JDBC Catalog에서 사용하는 스키마 버전으로, `V0` 및 `V1`을 지원합니다. | `V0` | 아니요 |
| iceberg.jdbc.strict-mode | 메타데이터를 더 엄격하게 검증하는 엄격 모드를 활성화할지 여부 | `false` | 아니요 |
| iceberg.jdbc.driver_class | JDBC 드라이버 클래스 이름. 예: `org.postgresql.Driver`, `com.mysql.cj.jdbc.Driver` 등 | - | 아니요 |
| iceberg.jdbc.driver_url | JDBC 드라이버 JAR 파일 경로 | - | 아니요 |

> 참고:
>
> 1. Iceberg JDBC Catalog는 PostgreSQL, MySQL, SQLite 등 다양한 관계형 데이터베이스를 백엔드 저장소로 지원합니다.
>
> 2. JDBC 드라이버 JAR 파일에 접근할 수 있는지 확인하세요. `iceberg.jdbc.driver_url`로 드라이버 위치를 지정할 수 있습니다.
>
> 3. `iceberg.jdbc.catalog_name`은 데이터를 기록하는 측에서 사용하는 Iceberg JDBC Catalog 이름과 일치해야 합니다. 예를 들어 Spark에서 기록한 메타데이터의 경우 `spark_catalog`를 사용합니다.
>
> 4. `iceberg.jdbc.driver_url`을 지정하면 `iceberg.jdbc.driver_class`도 지정해야 합니다.

4.1.5부터 Catalog를 생성하거나 변경할 때 JDBC 드라이버 위치를 일관된 방식으로 검증합니다. URI 스킴이 없는 값은 `[A-Za-z0-9._-]+.jar`와 일치하는 파일 이름이어야 하며, 절대 경로에는 `file:///...`를 사용해야 합니다. URL 디코딩된 경로에는 상위 디렉터리를 나타내는 `..` 경로 구간이 포함되어서는 안 됩니다. 기존의 안전한 드라이버 경로 제한과 URL 허용 목록 제한도 계속 적용됩니다.

## 설정 예시 {#example-configurations}

### PostgreSQL을 메타데이터 저장소로 사용 {#postgresql-as-metadata-storage}

PostgreSQL 데이터베이스를 사용하여 Iceberg 메타데이터 저장:

```sql
CREATE CATALOG iceberg_jdbc_postgresql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.catalog_name' = 'iceberg_jdbc_postgresql',
    'iceberg.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg_user',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'org.postgresql.Driver',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### MySQL을 메타데이터 저장소로 사용 {#mysql-as-metadata-storage}

MySQL 데이터베이스를 사용하여 Iceberg 메타데이터 저장:

```sql
CREATE CATALOG iceberg_jdbc_mysql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.catalog_name' = 'iceberg_jdbc_mysql',
    'iceberg.jdbc.uri' = 'jdbc:mysql://127.0.0.1:3306/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg_user',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'com.mysql.cj.jdbc.Driver',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### SQLite를 메타데이터 저장소로 사용 {#sqlite-as-metadata-storage}

SQLite 데이터베이스를 사용하여 Iceberg 메타데이터 저장(테스트 환경에 적합):

```sql
CREATE CATALOG iceberg_jdbc_sqlite PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.catalog_name' = 'iceberg_jdbc_sqlite',
    'iceberg.jdbc.uri' = 'jdbc:sqlite:/tmp/iceberg_catalog.db',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'org.sqlite.JDBC',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
