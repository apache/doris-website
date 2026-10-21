---
{
    "title": "SQL Server JDBC Catalog",
    "language": "ko",
    "description": "Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 SQL Server 데이터베이스에 연결할 수 있습니다."
}
---

Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 SQL Server 데이터베이스에 연결할 수 있습니다. 이 문서에서는 SQL Server 데이터베이스 연결을 구성하는 방법을 설명합니다.

JDBC Catalog에 대한 개요는 [JDBC Catalog 개요](./jdbc-catalog-overview.md)를 참조하세요.

## 사용 시 참고 사항 {#usage-notes}

SQL Server 데이터베이스에 연결하려면 다음이 필요합니다.

* SQL Server 2012 이상 또는 Azure SQL Database.

* SQL Server 데이터베이스용 JDBC 드라이버. [Maven Repository](https://mvnrepository.com/artifact/com.microsoft.sqlserver/mssql-jdbc)에서 최신 버전이나 특정 버전을 다운로드할 수 있습니다. SQL Server JDBC Driver 11.2.x 이상을 사용하는 것이 좋습니다.

* Doris의 각 FE 및 BE 노드와 SQL Server 서버 간의 네트워크 연결. 기본 포트는 1433입니다.

## SQL Server에 연결하기 {#connecting-to-sql-server}

```sql
CREATE CATALOG sqlserver_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwddd',
    'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false',
    'driver_url' = 'mssql-jdbc-11.2.3.jre8.jar',
    'driver_class' = 'com.microsoft.sqlserver.jdbc.SQLServerDriver'
)
```

`jdbc_url`은 SQL Server JDBC 드라이버에 전달할 연결 정보와 매개변수를 정의합니다. URL에서 지원하는 매개변수는 [SQL Server JDBC Driver 문서](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/building-the-connection-url?view=sql-server-ver16)에서 확인할 수 있습니다.

### 연결 보안 {#connection-security}

JDBC 드라이버와 커넥터는 자동으로 Transport Layer Security (TLS) 암호화와 인증서 검증을 사용합니다. 이를 위해 SQL Server 데이터베이스 호스트에 적절한 TLS 인증서를 구성해야 합니다.

필요한 구성을 아직 완료하지 않았다면 연결 문자열의 encrypt 속성을 사용하여 암호화를 비활성화할 수 있습니다.

```sql
'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false'
```

[SQL Server JDBC Driver 문서](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/using-ssl-encryption?view=sql-server-ver16)의 TLS 절에서는 `trustServerCertificate`, `hostNameInCertificate`, `trustStore`, `trustStorePassword` 등의 다른 매개변수를 자세히 설명합니다.

## 계층 매핑 {#hierarchical-mapping}

SQLServer를 매핑할 때 Doris의 데이터베이스는 SQL Server에서 지정한 데이터베이스의 스키마에 해당합니다(`<databaseName>`은 `jdbc_url`의 매개변수). Doris 데이터베이스의 테이블은 SQLServer 스키마의 테이블에 해당합니다. 매핑 관계는 다음과 같습니다.

| Doris    | SQL Server |
| -------- | ---------- |
| Catalog  | 데이터베이스   |
| 데이터베이스 | 스키마     |
| 테이블    | 테이블      |

## 열 타입 매핑 {#column-type-mapping}

| SQL Server 타입                        | Doris 타입    | 설명                                          |
| -------------------------------------- | ------------- | ------------------------------------------------ |
| bit                                    | boolean       |                                                  |
| tinyint                                | smallint      | SQLServer의 tinyint는 부호가 없으므로 Doris의 smallint로 매핑됩니다 |
| smallint                               | smallint      |                                                  |
| int                                    | int           |                                                  |
| bigint                                 | bigint        |                                                  |
| real                                   | float         |                                                  |
| float                                  | double        |                                                  |
| money                                  | decimal(19,4) |                                                  |
| smallmoney                             | decimal(10,4) |                                                  |
| decimal(P, S)/numeric(P, S)            | decimal(P, S) |                                                  |
| date                                   | date          |                                                  |
| datetime/datetime2/smalldatetime       | datetime(S)   |                                                  |
| char/varchar/text/nchar/nvarchar/ntext | string        |                                                  |
| time | string | |
| datetimeoffset | TIMESTAMPTZ(S) | 4.1.5부터 이 타입은 절대 시점의 의미를 보존하며, 정밀도는 최대 6입니다. |
| timestamp                              | string        | 바이너리 데이터를 십육진수로 표현하며, 실질적인 의미는 없습니다 |
| image/binary/varbinary | VARBINARY | 4.1.5부터 이 타입은 항상 `VARBINARY`로 매핑됩니다. `enable.mapping.varbinary` 속성은 호환성을 위해 유지되며, `false`로 설정해도 더 이상 `STRING` 매핑으로 돌아가지 않습니다. 이전 버전에서는 이 속성으로 기존 매핑을 선택할 수 있습니다. |
| 기타                                  | UNSUPPORTED   |                                                  |

## 일반적인 문제 {#common-issues}

1. SQL Server 연결 시 인증서 인증 예외 발생

   ```text
   SQLServerException: The driver could not establish a secure connection to SQL Server by using Secure Sockets Layer (SSL) encryption.
   Error: "sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
   unable to find valid certification path to requested target". ClientConnectionId:a92f3817-e8e6-4311-bc21-7c66
   ```

   Catalog를 생성할 때 JDBC 연결 문자열 끝에 `encrypt=false`를 추가할 수 있습니다. 예: `"jdbc_url" = "jdbc:sqlserver://127.0.0.1:1433;DataBaseName=doris_test;encrypt=false"`

2. SQL Server 연결 시 TLS 예외 발생

   ```text
   The server selected protocol version TLS10 is not accepted by client preferences [TLS13, TLS12]
   ```

   SQL Server와 JDBC 클라이언트 간에 TLS 프로토콜 버전이 일치하지 않기 때문입니다. 연결된 SQL Server는 TLS 1.0만 지원하지만, JDBC 클라이언트가 실행되는 JAVA 환경에서는 기본적으로 TLS 1.0이 비활성화되어 있습니다.

   해결 방법은 다음과 같습니다.

   1. SQL Server에서 TLS 1.2를 활성화합니다. [SQL Server TLS 1.2 지원](https://learn.microsoft.com/zh-cn/troubleshoot/sql/database-engine/connect/tls-1-2-support-microsoft-sql-server)을 참조하세요.

   2. JDK에서 TLS 1.0을 활성화합니다.

   ```shell
   vim ${JAVA_HOME}/lib/security/java.security
   # Find this section
   jdk.tls.disabledAlgorithms=SSLv3, TLSv1, TLSv1.1, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, 3DES_EDE_CBC, anon, NULL, \
   include jdk.disabled.namedCurves

   # Remove TLSv1, TLSv1.1, change it to the following
   jdk.tls.disabledAlgorithms=SSLv3, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, anon, NULL, \
   include jdk.disabled.namedCurves
   ```
