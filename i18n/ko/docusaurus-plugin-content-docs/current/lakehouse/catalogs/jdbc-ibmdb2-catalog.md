---
{
    "title": "IBM Db2 JDBC Catalog",
    "language": "ko",
    "description": "Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 IBM Db2 데이터베이스에 연결할 수 있습니다."
}
---

Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 IBM Db2 데이터베이스에 연결할 수 있습니다. 이 문서에서는 IBM Db2 데이터베이스 연결을 구성하는 방법을 설명합니다.

JDBC Catalog에 대한 개요는 [JDBC Catalog 개요](./jdbc-catalog-overview.md)를 참조하세요.

## 사용 시 참고 사항 {#usage-notes}

IBM Db2 데이터베이스에 연결하려면 다음이 필요합니다.

* IBM Db2 11.5.x 이상

* IBM Db2 데이터베이스용 JDBC 드라이버. [Maven Repository](https://mvnrepository.com/artifact/com.ibm.db2/jcc)에서 IBM Db2 드라이버의 최신 버전 또는 지정한 버전을 다운로드할 수 있습니다. IBM db2 jcc 11.5.8.0 버전 사용을 권장합니다.

* 각 Doris FE 및 BE 노드와 IBM Db2 서버 간의 네트워크 연결. 기본 포트는 51000입니다.

## IBM Db2 연결 {#connecting-to-ibm-db2}

```sql
CREATE CATALOG db2_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'USERNAME',
    'password' = 'PASSWORD',
    'jdbc_url' = 'jdbc:db2://host:port/database',
    'driver_url' = 'jcc-11.5.8.0.jar',
    'driver_class' = 'com.ibm.db2.jcc.DB2Driver'
)
```

`jdbc_url`은 IBM Db2 드라이버에 전달할 연결 정보와 매개변수를 정의합니다. 지원되는 URL 매개변수는 [Db2 JDBC 드라이버 문서](https://www.ibm.com/docs/en/db2-big-sql/5.0?topic=drivers-jdbc-driver)에서 확인할 수 있습니다.

## 계층 매핑 {#hierarchical-mapping}

IBM Db2를 매핑할 때 Doris의 데이터베이스는 DB2에서 지정한 데이터베이스(`jdbc_url`의 "database" 매개변수) 아래의 Schema에 대응합니다. Doris 데이터베이스 아래의 테이블은 DB2의 Schema 아래의 테이블에 대응합니다. 매핑 관계는 다음과 같습니다.

| Doris    | IBM Db2  |
| -------- | -------- |
| Catalog  | 데이터베이스 |
| 데이터베이스 | Schema   |
| 테이블    | 테이블    |

## 컬럼 타입 매핑 {#column-type-mapping}

| IBM Db2 타입     | Doris 타입    | 설명 |
| ---------------- | ------------- | ------- |
| smallint         | smallint      |         |
| int              | int           |         |
| bigint           | bigint        |         |
| double           | double        |         |
| double precision | double        |         |
| float            | double        |         |
| real             | float         |         |
| decimal(P, S)    | decimal(P, S) |         |
| decfloat(P, S)   | decimal(P, S) |         |
| date             | date          |         |
| timestamp(S)     | datetime(S)   |         |
| char(N)          | char(N)       |         |
| varchar(N)       | varchar(N)    |         |
| long varchar(N)  | varchar(N)    |         |
| vargraphic       | string        |         |
| long vargraphic  | string        |         |
| time             | string        |         |
| clob             | string        |         |
| xml              | string        |         |
| BLOB | VARBINARY | 4.1.5부터 이 타입은 항상 `VARBINARY`로 매핑됩니다. `enable.mapping.varbinary` 속성은 호환성을 위해 유지되지만, `false`로 설정해도 더 이상 `STRING` 매핑으로 되돌아가지 않습니다. 이전 버전에서는 이 속성으로 기존 매핑을 선택할 수 있습니다. |
| 기타            | UNSUPPORTED   |         |

## 일반적인 문제 {#common-issues}

1. JDBC Catalog를 통해 IBM Db2 데이터를 읽을 때 `Invalid operation: result set is closed. ERRORCODE=-4470` 예외가 발생합니다.

    IBM Db2 Catalog를 생성할 때 jdbc\_url 연결 문자열에 연결 매개변수 `allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`를 추가하세요. 예: `jdbc:db2://host:port/database:allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`.

2. java.io.CharConversionException 발생

    이 문제는 문자 집합 문제로 인해 발생할 수 있습니다. `-Ddb2.jcc.charsetDecoderEncoder=3` 설정을 `JAVA_OPTS`에 추가하되, 해당 설정이 있는 파일은 `be.conf`입니다. 그런 다음 BE를 다시 시작하여 문제가 해결되는지 확인해 보세요. `1` 또는 `2` 같은 값으로도 시도해 볼 수 있습니다. 자세한 내용은 다음을 참조하세요: https://www.ibm.com/docs/en/content-collector/4.0.1?topic=manager-jdbc-throws-javaiocharconversionexception
