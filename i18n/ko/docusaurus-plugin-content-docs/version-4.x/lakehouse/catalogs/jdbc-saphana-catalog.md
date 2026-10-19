---
{
    "title": "SAP HANA JDBC Catalog",
    "language": "ko",
    "description": "Doris JDBC Catalog는 표준 JDBC 인터페이스를 통한 SAP HANA 데이터베이스 연결을 지원합니다."
}
---

Doris JDBC Catalog는 표준 JDBC 인터페이스를 통한 SAP HANA 데이터베이스 연결을 지원합니다. 이 문서에서는 SAP HANA 데이터베이스 연결을 구성하는 방법을 설명합니다.

JDBC Catalog에 대한 개요는 [JDBC Catalog 개요](./jdbc-catalog-overview.md)를 참조하세요.

## 사용 시 유의 사항 {#usage-notes}

SAP HANA 데이터베이스에 연결하려면 다음이 필요합니다.

* SAP HANA 2.0 이상.

* SAP HANA 데이터베이스용 JDBC 드라이버. [Maven Repository](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc)에서 다운로드할 수 있으며, ngdbc 2.4.51 이상 버전 사용을 권장합니다.

* 각 Doris FE 및 BE 노드와 SAP HANA 서버 간의 네트워크 연결. 기본 포트는 30015입니다.

## SAP HANA에 연결하기 {#connecting-to-sap-hana}

```sql
CREATE CATALOG saphana_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:sap://Hostname:Port/?optionalparameters',
    'driver_url' = 'ngdbc-2.4.51.jar',
    'driver_class' = 'com.sap.db.jdbc.Driver'
)
```

SAP HANA JDBC 드라이버에서 지원하는 JDBC URL 형식과 매개변수에 대한 자세한 내용은 [SAP HANA](https://help.sap.com/docs/)를 참조하세요.

## 계층 매핑 {#hierarchical-mapping}

SAP HANA를 매핑할 때 Doris의 데이터베이스는 SAP HANA에서 지정한 데이터베이스(`jdbc_url` 매개변수의 "DATABASE")에 속한 스키마에 해당합니다. Doris의 데이터베이스에 속한 테이블은 SAP HANA의 스키마에 속한 테이블에 해당합니다. 매핑 관계는 다음과 같습니다.

| Doris    | SAP HANA |
| -------- | -------- |
| Catalog  | 데이터베이스 |
| 데이터베이스 | 스키마   |
| 테이블    | 테이블    |

## 컬럼 타입 매핑 {#column-type-mapping}

| SAP HANA 타입      | Doris 타입                        | 설명                                                      |
| ------------------ | --------------------------------- | ------------------------------------------------------------ |
| boolean            | boolean                           |                                                              |
| tinyint            | tinyint                           |                                                              |
| smallint           | smallint                          |                                                              |
| integer            | int                               |                                                              |
| bigint             | bigint                            |                                                              |
| smalldecimal(P, S) | decimal(P, S) 또는 double 또는 string | 정밀도가 지정되지 않으면 double 타입을 사용합니다. 정밀도가 Doris에서 지원하는 최대 정밀도를 초과하면 string 타입을 사용합니다. |
| decimal(P, S)      | decimal(P, S) 또는 double 또는 string | 위와 동일합니다.                                               |
| real               | float                             |                                                              |
| double             | double                            |                                                              |
| date               | date                              |                                                              |
| time               | string                            |                                                              |
| timestamp(S)       | datetime(S)                       |                                                              |
| seconddate         | datetime(S)                       |                                                              |
| varchar            | string                            |                                                              |
| nvarchar           | string                            |                                                              |
| alphanum           | string                            |                                                              |
| shorttext          | string                            |                                                              |
| char(N)            | char(N)                           |                                                              |
| nchar(N)           | char(N)                           |                                                              |
| 기타              | UNSUPPORTED                       |                                                              |
