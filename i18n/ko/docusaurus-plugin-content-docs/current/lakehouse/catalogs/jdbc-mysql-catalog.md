---
{
    "title": "MySQL JDBC Catalog",
    "language": "ko",
    "description": "Doris JDBC Catalog는 표준 JDBC 인터페이스를 통한 MySQL 데이터베이스 연결을 지원합니다."
}
---

Doris JDBC Catalog는 표준 JDBC 인터페이스를 통한 MySQL 데이터베이스 연결을 지원합니다. 이 문서는 MySQL 데이터베이스 연결을 구성하는 방법을 설명합니다.

JDBC Catalog의 개요는 [JDBC Catalog 개요](./jdbc-catalog-overview.md)를 참조하세요.

## 사용 시 참고 사항 {#usage-notes}

MySQL 데이터베이스에 연결하려면 다음이 필요합니다:

* MySQL 5.7, 8.0 또는 그 이상 버전.

* MySQL용 JDBC 드라이버. [Maven 저장소](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j)에서 다운로드할 수 있습니다. MySQL Connector/J 8.0.31 이상 버전을 사용하는 것이 좋습니다.

* 각 Doris FE 및 BE 노드와 MySQL 서버 간의 네트워크 연결. 기본 포트는 3306입니다.

## MySQL에 연결하기 {#connecting-to-mysql}

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:mysql://host:3306',
    'driver_url' = 'mysql-connector-j-8.3.0.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
```

`jdbc_url`은 MySQL JDBC 드라이버에 전달할 연결 정보와 매개변수를 정의합니다. 지원되는 URL 매개변수는 [MySQL 개발자 가이드](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html)에서 확인할 수 있습니다.

### 연결 보안 {#connection-security}

데이터 소스에 전역적으로 신뢰되는 인증서를 설치하고 TLS를 구성한 경우, `jdbc_url` 속성에 설정된 JDBC 연결 문자열에 매개변수를 추가하여 클러스터와 데이터 소스 간에 TLS를 활성화할 수 있습니다.

예를 들어 `MySQL Connector/J 8.0`에서는 `sslMode` 매개변수를 사용하여 TLS로 연결을 보호합니다. 이 매개변수의 기본값은 PREFERRED이며, 서버에서 TLS를 활성화한 경우 연결을 보호할 수 있습니다. 이 매개변수를 REQUIRED로 설정할 수도 있으며, 이 경우 TLS 연결이 설정되지 않으면 연결이 실패합니다.

다음과 같이 `jdbc_url`에 sslMode 매개변수를 추가하여 구성할 수 있습니다:

```sql
'jdbc_url' = 'jdbc:mysql://host:3306/?sslMode=REQUIRED'
```

TLS 구성 옵션에 대한 자세한 내용은 [MySQL JDBC 보안 문서](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode)를 참조하세요.

## 계층 매핑 {#hierarchical-mapping}

MySQL에 매핑할 때 Doris의 데이터베이스는 MySQL의 데이터베이스에 대응합니다. Doris의 데이터베이스에 속한 테이블은 MySQL의 해당 데이터베이스에 속한 테이블에 대응합니다. 매핑 관계는 다음과 같습니다:

| Doris    | MySQL        |
| -------- | ------------ |
| Catalog  | MySQL 서버 |
| 데이터베이스 | 데이터베이스     |
| 테이블    | 테이블        |

## 컬럼 타입 매핑 {#column-type-mapping}

| MySQL 타입                           | Doris 타입                 | 설명                                                                        |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------ |
| boolean                              | tinyint                    |                                                                                |
| tinyint                              | tinyint                    |                                                                                |
| smallint                             | smallint                   |                                                                                |
| mediumint                            | int                        |                                                                                |
| int                                  | int                        |                                                                                |
| bigint                               | bigint                     |                                                                                |
| unsigned tinyint                     | smallint                   | Doris는 unsigned 데이터 타입을 지원하지 않으므로 unsigned 데이터 타입은 Doris에서 이에 대응하는 더 큰 데이터 타입에 매핑됩니다.             |
| unsigned mediumint                   | int                        | 위와 동일합니다.                                                                            |
| unsigned int                         | bigint                     | 위와 동일합니다.                                                                            |
| unsigned bigint                      | largeint                   | 위와 동일합니다.                                                                            |
| float                                | float                      |                                                                                |
| double                               | double                     |                                                                                |
| decimal(P, S)                        | decimal(P, S)              |                                                                                |
| unsigned decimal(P, S)               | decimal(P + 1, S) / string | Doris에서 지원하는 최대 정밀도를 초과하면 String으로 처리됩니다. 이 타입을 String에 매핑하면 쿼리만 지원하며 MySQL에 데이터를 쓸 수 없습니다. |
| date                                 | date                       |                                                                                |
| timestamp(S) | TIMESTAMPTZ(S) | 4.1.5부터 이 타입은 항상 `TIMESTAMPTZ(S)`에 매핑됩니다. `enable.mapping.timestamp_tz` 속성은 호환성을 위해 유지되며, 이 속성을 `false`로 설정해도 `DATETIME` 매핑으로 돌아가지 않습니다. 정밀도는 최대 6으로 제한되므로 이를 초과하는 정밀도는 손실됩니다. 이전 버전에서는 이 속성으로 기존 매핑을 선택할 수 있습니다. |
| datetime(S)                          | datetime(S)                |                                                                                |
| year                                 | smallint                   | Doris는 year 타입을 지원하지 않으므로 year 타입은 smallint에 매핑됩니다.                                       |
| time                                 | string                     | Doris는 time 타입을 지원하지 않으므로 time 타입은 string에 매핑됩니다.                                         |
| char                                 | char                       |                                                                                |
| varchar                              | varchar                    |                                                                                |
| json                                 | string                     | 읽기 성능과 연산 성능의 균형을 맞추기 위해 Doris는 json 타입을 string 타입에 매핑합니다.                                  |
| set                                  | string                     |                                                                                |
| enum                                 | string                     |                                                                                |
| bit                                  | boolean / string           | Doris는 bit 타입을 지원하지 않으므로 bit(1)은 boolean에 매핑되고, 그 외의 경우에는 string에 매핑됩니다.                |
| tinytext, text, mediumtext, longtext | string                     |                                                                                |
| blob, mediumblob, longblob, tinyblob, binary, varbinary | VARBINARY | 4.1.5부터 이 타입은 항상 `VARBINARY`에 매핑됩니다. `enable.mapping.varbinary` 속성은 호환성을 위해 유지되며, 이 속성을 `false`로 설정해도 `STRING` 매핑으로 돌아가지 않습니다. 이전 버전에서는 이 속성으로 기존 매핑을 선택할 수 있습니다. |
| 기타                                | UNSUPPORTED                |                                                                                |

## 부록 {#appendix}

### 시간대 문제 {#time-zone-issues}

JDBC Catalog를 통해 데이터에 접근할 때 BE의 JNI 부분은 JVM 시간대를 사용합니다. JVM 시간대의 기본값은 BE가 배포된 머신의 시간대이며, 이는 JDBC가 데이터를 읽을 때 시간대 변환에 영향을 줍니다. 시간대를 일관되게 유지하려면 `be.conf`의 `JAVA_OPTS`에서 JVM 시간대를 Doris 세션 변수 `time_zone`과 일치하도록 설정하는 것이 좋습니다.

MySQL의 timestamp 타입을 읽을 때는 JDBC URL에 `connectionTimeZone=LOCAL`과 `forceConnectionTimeZoneToSession=true` 매개변수를 추가하세요. 이 매개변수는 MySQL Connector/J 8 이상 버전에 적용되며, MySQL 서버의 시간대 대신 Doris BE JVM 시간대를 기준으로 시간을 읽도록 합니다.

## 자주 발생하는 문제 {#common-issues}

### 연결 예외 문제 해결 {#connection-exception-troubleshooting}

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.

  * 원인:

      * 네트워크 문제:

          * 네트워크가 불안정하거나 연결이 끊어졌을 수 있습니다.

          * 클라이언트와 서버 간의 네트워크 지연 시간이 길 수 있습니다.

      * MySQL 서버 설정

          * MySQL 서버에 `wait_timeout` 또는 `interactive_timeout`과 같은 연결 시간 초과 매개변수가 설정되어 있어 시간 초과로 연결이 닫힐 수 있습니다.

      * 방화벽 설정

          * 방화벽 규칙이 클라이언트와 서버 간의 통신을 차단할 수 있습니다.

      * 연결 풀 설정

          * 연결 풀의 `connection_pool_max_life_time` 설정으로 인해 연결이 닫히거나 회수되거나, 적시에 연결 유지 처리가 이루어지지 않을 수 있습니다.

      * 서버 리소스 문제

          * MySQL 서버에 새 연결 요청을 처리할 리소스가 부족할 수 있습니다.

      * 클라이언트 설정

          * 클라이언트의 JDBC 드라이버 설정이 잘못되었을 수 있습니다. 예를 들어 `autoReconnect` 매개변수를 설정하지 않았거나 잘못 설정한 경우입니다.

  * 해결 방법

      * 네트워크 연결 확인:

          * 클라이언트와 서버 간의 네트워크 연결이 안정적인지 확인하고, 긴 네트워크 지연 시간이 발생하지 않도록 합니다.

      * MySQL 서버 설정 확인:

          * MySQL 서버의 `wait_timeout` 및 `interactive_timeout` 매개변수를 검토하고 조정하여 적절한 값이 설정되어 있는지 확인합니다.

      * 방화벽 설정 확인:

          * 방화벽 규칙이 클라이언트와 서버 간의 통신을 허용하는지 확인합니다.

      * 연결 풀 설정 조정:

          * 연결 풀의 `connection_pool_max_life_time` 설정 매개변수를 검토하고 조정하여 MySQL의 `wait_timeout` 및 `interactive_timeout` 매개변수보다 작고, SQL의 최대 실행 시간보다 크도록 합니다.

      * 서버 리소스 모니터링:

          * MySQL 서버의 리소스 사용량을 모니터링하여 연결 요청을 처리할 리소스가 충분한지 확인합니다.

      * 클라이언트 설정 최적화:

          * 연결이 끊어진 후 자동으로 다시 연결할 수 있도록 `autoReconnect=true`와 같은 JDBC 드라이버 설정 매개변수가 올바른지 확인합니다.

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.

  * 원인: MySQL이 연결을 강제로 종료했거나 MySQL이 비정상 종료되었습니다.

  * 해결 방법: MySQL에 연결을 능동적으로 종료하는 메커니즘이 있는지, 또는 대용량 쿼리로 인해 MySQL이 비정상 종료되었는지 확인합니다.

### 기타 문제 {#other-issues}

1. MySQL에서 이모지를 읽고 쓸 때 문자가 깨지는 문제

   Doris가 MySQL을 쿼리할 때 MySQL의 기본 utf8 인코딩은 utf8mb3이며, 이 인코딩은 4바이트 인코딩이 필요한 이모지를 표현할 수 없습니다. 따라서 MySQL의 인코딩을 utf8mb4로 변경하여 4바이트 인코딩을 지원하도록 해야 합니다.

   다음과 같이 전역 설정을 변경할 수 있습니다.

   ```text
   Modify the my.ini file in the mysql directory (for Linux systems, it is the my.cnf file in the etc directory)
   [client]
   default-character-set=utf8mb4

   [mysql]
   Set mysql default character set
   default-character-set=utf8mb4

   [mysqld]
   Set mysql character set server
   character-set-server=utf8mb4
   collation-server=utf8mb4_unicode_ci
   init_connect='SET NAMES utf8mb4

   Modify the type of the corresponding table and column
   ALTER TABLE table_name MODIFY colum_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ALTER TABLE table_name CHARSET=utf8mb4;
   SET NAMES utf8mb4
   ```

2. MySQL DATE/DATETIME 타입을 읽을 때 예외가 발생하는 문제

   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed: 
   CAUSED BY: SQLException: Zero date value prohibited
   CAUSED BY: DataReadException: Zero date value prohibited
   ```

   JDBC는 기본적으로 유효하지 않은 DATE/DATETIME 값에 대해 예외를 발생시킵니다. 이 동작은 URL 매개변수 `zeroDateTimeBehavior`로 제어할 수 있습니다. 사용할 수 있는 값은 `exception`, `convertToNull`, `round`이며, 각각 예외 발생, `NULL` 값으로 변환, `"0001-01-01 00:00:00"`으로 변환을 의미합니다.

   `zeroDateTimeBehavior=convertToNull`을 Catalog 생성 시 `jdbc_url`의 JDBC 연결 문자열 끝에 추가해야 합니다. 예를 들면 `"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"`과 같습니다. 이 경우 JDBC는 0000-00-00 또는 0000-00-00 00:00:00을 null로 변환하고, Doris는 현재 Catalog의 모든 Date/DateTime 타입 컬럼을 nullable 타입으로 처리하므로 정상적으로 읽을 수 있습니다.

3. MySQL Catalog 또는 다른 JDBC Catalog를 읽을 때 `failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader`와 같은 클래스 로딩 오류가 발생하는 문제

   이는 Catalog를 생성할 때 입력한 `driver_class`가 잘못되었기 때문이므로 올바른 값으로 수정해야 합니다. 예를 들어 위 오류는 대소문자 문제이며, `'driver_class' = 'com.mysql.cj.jdbc.Driver'`로 입력해야 합니다.

4. MySQL을 읽을 때 통신 링크 예외가 발생하는 문제

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: CommunicationsException: Communications link failure
      
  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: SSLHandshakeException
  ```

  be의 be.out 로그를 확인했을 때 다음 정보가 포함되어 있다면:

  ```
  WARN: Establishing SSL connection without server's identity verification is not recommended. 
  According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. 
  For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. 
  You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
  ```

  `useSSL=false`를 `jdbc_url`에 추가할 수 있습니다. 예를 들면 `'jdbc_url' = 'jdbc:mysql://127.0.0.1:3306/test?useSSL=false'`와 같습니다.

* MySQL에서 대량의 데이터를 쿼리할 때 쿼리가 성공하기도 하고 다음 오류가 발생하기도 하며, 오류가 발생하면 MySQL에 대한 모든 연결이 끊어지고 MySQL 서버에 연결할 수 없다가 잠시 후 MySQL이 정상 상태로 돌아오지만 이전 연결은 사라지는 경우:

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
  CAUSED BY: CommunicationsException: Communications link failure
  The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
  ```

  위 현상은 MySQL 서버 자체의 메모리 또는 CPU 리소스가 고갈되어 MySQL 서비스를 사용할 수 없을 때 발생할 수 있습니다. MySQL 서버의 메모리 또는 CPU 사양을 늘려 볼 수 있습니다.

* MySQL을 쿼리하는 중에 쿼리 결과가 MySQL 데이터베이스의 결과와 일치하지 않는 경우

  먼저 쿼리 필드에서 대소문자를 구분해야 하는 상황이 있는지 확인합니다. 예를 들어 테이블에 `"aaa"`와 `"AAA"`라는 두 값이 있는 `c_1` 필드가 있고, MySQL 데이터베이스 초기화 시 대소문자를 구분하도록 지정하지 않았다면, MySQL은 기본적으로 대소문자를 구분하지 않지만 Doris는 엄격하게 구분하므로 다음과 같은 상황이 발생합니다:

  ```text
  MySQL behavior:
  select count(c_1) from table where c_1 = "aaa"; Does not distinguish case, so the result is: 2

  Doris behavior:
  select count(c_1) from table where c_1 = "aaa"; Strictly distinguishes case, so the result is: 1
  ```

  위 현상이 발생하면 요구 사항에 따라 다음과 같이 조정해야 합니다:

  * MySQL 쿼리에 "BINARY" 키워드를 추가하여 대소문자 구분을 강제합니다: `select count(c_1) from table where BINARY c_1 = "aaa";`

  * 또는 MySQL에서 테이블을 생성할 때 지정합니다: `CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

  * 또는 MySQL 데이터베이스 초기화 시 대소문자를 구분하도록 collation 규칙을 지정합니다:

		```text
		[mysqld]
		character-set-server=utf8
		collation-server=utf8_bin
		[client]
		default-character-set=utf8
		[mysql]
		default-character-set=utf8
		```

* MySQL을 쿼리할 때 오랫동안 결과가 반환되지 않거나, 오랫동안 멈춘 상태에서 fe.warn.log에 쓰기 잠금 로그가 대량으로 기록되는 경우.

  URL에 socketTimeout을 추가해 볼 수 있습니다. 예: `jdbc:mysql://host:port/database?socketTimeout=30000`. 이렇게 하면 MySQL이 연결을 닫은 뒤에도 JDBC 클라이언트가 무한정 대기하는 것을 방지할 수 있습니다.

* MySQL Catalog를 사용하는 중에 FE의 JVM 메모리 사용량이나 스레드 수가 줄어들지 않고 계속 증가하며, 동시에 Forward to master connection timed out 오류가 발생할 수 있는 경우

  FE 스레드 스택을 `jstack fe_pid > fe.js`로 출력했을 때 `mysql-cj-abandoned-connection-cleanup` 스레드가 많이 나타나면 MySQL JDBC 드라이버에 문제가 있다는 의미입니다.

  다음과 같이 처리합니다:

  * MySQL JDBC 드라이버를 8.0.31 이상 버전으로 업그레이드합니다.

  * 매개변수 `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true`를 FE 및 BE conf 파일의 `JAVA_OPTS`에 추가하여 MySQL JDBC 드라이버의 연결 정리 기능을 비활성화하고 클러스터를 다시 시작합니다.

	참고: Doris 버전이 2.0.13 이상이거나 2.1.5 이상이면 Doris가 기본적으로 MySQL JDBC 드라이버의 연결 정리 기능을 이미 비활성화하므로 이 매개변수를 추가할 필요가 없습니다. MySQL JDBC 드라이버 버전만 교체하면 됩니다. 다만 이전에 누수된 스레드를 정리하려면 Doris 클러스터를 다시 시작해야 합니다.
