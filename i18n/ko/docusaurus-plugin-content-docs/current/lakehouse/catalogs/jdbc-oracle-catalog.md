---
{
    "title": "Oracle JDBC Catalog",
    "language": "ko",
    "description": "Apache Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 Oracle 데이터베이스에 연결할 수 있습니다."
}
---

Apache Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 Oracle 데이터베이스에 연결할 수 있습니다. 이 문서에서는 Oracle 데이터베이스 연결을 구성하는 방법을 설명합니다.

JDBC Catalog에 대한 개요는 [JDBC Catalog 개요](./jdbc-catalog-overview.md)를 참조하세요.

## 사용 시 유의 사항 {#usage-notes}

Oracle 데이터베이스에 연결하려면 다음이 필요합니다.

* Oracle 19c, 18c, 12c, 11g 또는 10g.

* Oracle 데이터베이스용 JDBC 드라이버. Ojdbc8 이상 버전의 Oracle JDBC 드라이버는 [Maven Repository](https://mvnrepository.com/artifact/com.oracle.database.jdbc)에서 다운로드할 수 있습니다.

* Apache Doris의 각 FE 및 BE 노드와 Oracle 서버 간 네트워크 연결. 기본 포트는 1521이며, Oracle RAC에서 ONS가 활성화된 경우 포트 6200도 필요합니다.

## Oracle 연결 {#connecting-to-oracle}

```sql
CREATE CATALOG oracle_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password'='pwd',
    'jdbc_url' = 'jdbc:oracle:thin:@example.net:1521:orcl',
    'driver_url' = 'ojdbc8.jar',
    'driver_class' = 'oracle.jdbc.driver.OracleDriver'
)
```

`jdbc_url`은 JDBC 드라이버에 전달할 연결 정보와 매개변수를 정의합니다. Oracle JDBC Thin 드라이버를 사용할 때 URL 구문은 Oracle 구성에 따라 달라질 수 있습니다. 예를 들어 Oracle SID에 연결하는 경우와 Oracle 서비스 이름으로 연결하는 경우의 연결 URL은 서로 다릅니다. 자세한 내용은 [Oracle Database JDBC 드라이버 문서](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/data-sources-and-URLs.html)를 참조하세요. 위 예제의 URL은 이름이 `orcl`인 Oracle SID에 연결합니다.

## 계층 매핑 {#hierarchical-mapping}

Oracle을 매핑할 때 Apache Doris의 데이터베이스는 Oracle의 사용자에 대응합니다. Apache Doris 데이터베이스에 속한 테이블은 해당 Oracle 사용자가 접근할 수 있는 테이블에 대응합니다. 매핑 관계는 다음과 같습니다:

| Doris    | Oracle   |
| -------- | -------- |
| Catalog  | 데이터베이스 |
| 데이터베이스 | 사용자     |
| 테이블    | 테이블    |

## 열 타입 매핑 {#column-type-mapping}

| Oracle 타입                           | Doris 타입                           | 설명                                                                                                         |
| ------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| number(P) / number(P, 0)              | tinyint/smallint/int/bigint/largeint | Doris는 P의 크기에 따라 해당 타입을 선택합니다: P < 3: TINYINT; P < 5: SMALLINT; P < 10: INT; P < 19: BIGINT; P > 19: LARGEINT |
| number(P, S), if (S > 0 && P > S) | decimal(P, S)                        |                                                                                                                 |
| number(P, S), if (S > 0 && P < S) | decimal(S, S)                        |                                                                                                                 |
| number(P, S), if (S < 0)          | tinyint/smallint/int/bigint/largeint | S < 0인 경우 Doris는 P를 다음 계산식의 값으로 설정한 후, 이어서 표시된 타입과 동일한 매핑을 수행합니다: `P + |S|`, and perform the same mapping as `number(P) / number(P, 0)`                                         |
| number                                |                                      | Doris는 현재 P와 S가 지정되지 않은 number 타입을 지원하지 않습니다                                                                                       |
| decimal(P, S)                         | decimal(P, S)                        |                                                                                                                 |
| float/real                            | double                               |                                                                                                                 |
| date                                  | date                                 |                                                                                                                 |
| timestamp                             | datetime(S)                          |                                                                                                                 |
| timestamp(s) with time zone / timestamp(s) with local time zone | TIMESTAMPTZ(S) | 4.1.5부터 이 타입은 항상 `TIMESTAMPTZ(S)`로 매핑됩니다. `enable.mapping.timestamp_tz` 속성은 호환성을 위해 유지되지만, `false`로 설정해도 더 이상 `DATETIME` 매핑으로 되돌아가지 않습니다. 정밀도는 6으로 제한되므로 이를 초과하는 정밀도는 손실됩니다. 이전 버전에서는 이 속성으로 기존 매핑을 선택할 수 있습니다. |
| char/nchar                            | string                               |                                                                                                                 |
| varchar2/nvarchar2                    | string                               |                                                                                                                 |
| long/raw/long raw/internal            | string                               |                                                                                                                 |
| BLOB | VARBINARY | 4.1.5부터 이 타입은 항상 `VARBINARY`로 매핑됩니다. `enable.mapping.varbinary` 속성은 호환성을 위해 유지되지만, `false`로 설정해도 더 이상 `STRING` 매핑으로 되돌아가지 않습니다. 이전 버전에서는 이 속성으로 기존 매핑을 선택할 수 있습니다. |
| 기타                                 | UNSUPPORTED                          |                                                                                                                 |

## 자주 발생하는 문제 {#common-issues}

1. `ONS configuration failed` 오류가 Oracle Catalog를 생성하거나 쿼리할 때 발생하는 경우

   be.conf의 JAVA\_OPTS에 -Doracle.jdbc.fanEnabled=false를 추가하고 드라이버를 <https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc8/19.23.0.0/ojdbc8-19.23.0.0.jar>로 업그레이드하세요.

2. `Non supported character set (add orai18n.jar in your classpath): ZHS16GBK` 예외가 Oracle Catalog를 생성하거나 쿼리할 때 발생하는 경우

   [orai18n.jar](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html)를 다운로드하여 각 FE 및 BE 아래의 `custom_lib/` 디렉터리에 넣고(디렉터리가 없으면 수동으로 생성), 각 FE 및 BE를 다시 시작하세요.
