---
{
    "title": "Oceanbase JDBC Catalog",
    "language": "ko",
    "description": "Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 OceanBase 데이터베이스 연결을 지원합니다."
}
---

Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 OceanBase 데이터베이스 연결을 지원합니다. 이 문서에서는 OceanBase 데이터베이스 연결을 구성하는 방법을 설명합니다.

JDBC Catalog에 대한 개요는 [JDBC Catalog 개요](./jdbc-catalog-overview.md)를 참조하세요.

## 사용 시 참고 사항 {#usage-notes}

OceanBase 데이터베이스에 연결하려면 다음이 필요합니다.

* OceanBase 3.1.0 이상

* OceanBase 데이터베이스용 JDBC 드라이버. [Maven Repository](https://mvnrepository.com/artifact/com.oceanbase/oceanbase-client)에서 OceanBase JDBC 드라이버의 최신 버전 또는 특정 버전을 다운로드할 수 있습니다. OceanBase Connector/J 2.4.8 이상을 사용하는 것이 좋습니다.

* Doris의 각 FE 및 BE 노드와 OceanBase 서버 간 네트워크 연결

## OceanBase 연결 {#connect-to-oceanbase}

```sql
CREATE CATALOG oceanbase_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:oceanbase://host:port/db',
    'driver_url' = 'oceanbase-client-2.4.8.jar',
    'driver_class' = 'com.oceanbase.jdbc.Driver'
)
```

`jdbc_url`은 OceanBase JDBC 드라이버에 전달할 연결 정보와 매개변수를 정의합니다. 지원되는 URL 매개변수는 [OceanBase JDBC 드라이버 설정](https://www.oceanbase.com/docs/common-oceanbase-connector-j-cn-1000000000517111)에서 확인할 수 있습니다.

## 스키마 호환성 {#schema-compatibility}

OceanBase Catalog를 생성할 때 Doris는 OceanBase가 MySQL 모드인지 Oracle 모드인지 자동으로 인식하여 메타데이터를 올바르게 해석합니다.

각 모드의 계층 매핑, 타입 매핑 및 쿼리 최적화는 MySQL 또는 Oracle 데이터베이스의 Catalog와 동일한 방식으로 처리됩니다. 다음 문서를 참조하세요.

* [MySQL Catalog](./jdbc-mysql-catalog.md)

* [Oracle Catalog](./jdbc-oracle-catalog.md)
