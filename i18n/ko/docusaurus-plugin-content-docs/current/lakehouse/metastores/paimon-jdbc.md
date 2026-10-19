---
{
    "title": "Paimon JDBC Catalog",
    "language": "ko",
    "description": "이 문서에서는 JDBC 인터페이스를 사용하여 Paimon Catalog 메타데이터 서비스에 연결하고 접근할 때 지원되는 매개변수를 설명합니다."
}
---

이 문서에서는 `CREATE CATALOG` 문을 통해 JDBC 인터페이스를 사용하여 Paimon Catalog 메타데이터 서비스에 연결하고 접근할 때 지원되는 매개변수를 설명합니다.

:::tip 참고
이 기능은 실험적 기능이며 4.1.0 버전부터 지원됩니다.
:::

## 매개변수 개요 {#parameter-overview}

| 속성 이름 | 설명 | 기본값 | 필수 여부 |
| --- | --- | --- | --- | 
| paimon.jdbc.uri | JDBC 연결 URI를 지정합니다 | - | 예 |
| paimon.jdbc.user | JDBC 연결 사용자 이름 | - | 예 |
| paimon.jdbc.password | JDBC 연결 비밀번호 | - | 예 |
| warehouse | Paimon warehouse를 지정합니다 | - | 예 |
| paimon.jdbc.driver_class | JDBC 드라이버 클래스 이름(예: `org.postgresql.Driver`, `com.mysql.cj.jdbc.Driver` 등) | - | 아니요 |
| paimon.jdbc.driver_url | JDBC 드라이버 JAR 파일 경로 | - | 아니요 |

> 참고:
>
> 1. Paimon JDBC Catalog는 PostgreSQL, MySQL 등 다양한 관계형 데이터베이스를 백엔드 저장소로 지원합니다.
>
> 2. JDBC 드라이버 JAR 파일에 접근할 수 있는지 확인하세요. 드라이버 위치는 `paimon.jdbc.driver_url`로 지정할 수 있습니다.

4.1.5부터는 Catalog를 생성하거나 변경할 때 JDBC 드라이버 위치를 일관된 방식으로 검증합니다. URI 스킴이 없는 값은 `[A-Za-z0-9._-]+.jar` 패턴과 일치하는 파일 이름이어야 합니다. 절대 경로에는 `file:///...`를 사용하세요. URL 디코딩된 경로에는 상위 디렉터리를 나타내는 `..` 세그먼트가 포함되어서는 안 됩니다. 드라이버 경로 보안 및 URL 허용 목록에 대한 기존 제한 사항도 계속 적용됩니다.

## 구성 예제 {#example-configurations}

### PostgreSQL을 메타데이터 저장소로 사용 {#postgresql-as-metadata-storage}

PostgreSQL 데이터베이스를 사용하여 Paimon 메타데이터를 저장하는 예제입니다.

```sql
CREATE CATALOG paimon_jdbc_postgresql PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'jdbc',
    'paimon.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/paimon_db',
    'paimon.jdbc.user' = 'paimon_user',
    'paimon.jdbc.password' = 'password',
    'paimon.jdbc.driver_class' = 'org.postgresql.Driver',
    'paimon.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### MySQL을 메타데이터 저장소로 사용 {#mysql-as-metadata-storage}

MySQL 데이터베이스를 사용하여 Paimon 메타데이터를 저장하는 예제입니다.

```sql
CREATE CATALOG paimon_jdbc_mysql PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'jdbc',
    'paimon.jdbc.uri' = 'jdbc:mysql://127.0.0.1:3306/paimon_db',
    'paimon.jdbc.user' = 'paimon_user',
    'paimon.jdbc.password' = 'password',
    'paimon.jdbc.driver_class' = 'com.mysql.cj.jdbc.Driver',
    'paimon.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
