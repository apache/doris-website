---
{
    "title": "BI 자주 묻는 질문",
    "language": "ko",
    "description": "일반적으로 이 문제는 Power BI에서 데이터 원본을 가져오는 중 시간 제한을 초과하여 발생합니다. 데이터 원본 서버와 데이터베이스를 입력할 때 고급 옵션을 클릭하세요."
}
---

## Power BI {#power-bi}

### Q1. JDBC를 사용하여 Desktop Power BI로 데이터를 가져오면 "Timeout expired. The timeout period elapsed prior to completion of the operation or the server is not responding" 오류가 발생합니다. {#q1-an-error-occurs-when-you-use-jdbc-to-pull-data-into--desktop-power-bi-timeout-expired-the-timeout-period-elapsed-prior-to-completion-of-the-operation-or-the-server-is-not-responding}

일반적으로 이 문제는 Power BI에서 데이터 원본을 가져오는 중 시간 제한을 초과하여 발생합니다. 데이터 원본 서버와 데이터베이스를 입력할 때 고급 옵션을 클릭하고, 시간 제한 값을 더 크게 설정하세요.

### Q2. 2.1.x 버전에서 JDBC를 사용하여 Power BI에 연결하면 "An error happened while reading data from the provider: the given key was not present in the dictionary" 오류가 발생합니다. {#q2-when-the-21x-version-uses-jdbc-to-connect-to-power-bi-an-error-occurs-an-error-happened-while-reading-data-from-the-provider-the-given-key-was-not-present-in-the-dictionary}

먼저 데이터베이스에서 "show collation"을 실행하세요. 일반적으로 utf8mb4_900_bin만 표시되며 charset은 utf8mb4입니다. 이 오류의 주된 원인은 Power BI에 연결할 때 ID 33을 찾아야 한다는 점입니다. 즉, 테이블에 ID가 33인 행이 필요하므로 2.1.5 이상 버전으로 업그레이드해야 합니다.

### Q3. Doris에 연결하면 "Reading data from the provider times error index and count must refer to the location within the string" 오류가 발생합니다. {#q3-connection-doris-times-error-reading-data-from-the-provider-times-error-index-and-count-must-refer-to-the-location-within-the-string}

이 문제는 연결 과정에서 전역 매개변수를 불러올 때 SQL의 열 이름과 값이 같기 때문에 발생합니다.

```
SELECT
@@max_allowed_packet  as max_allowed_packet, @@character_set_client ,@@character_set_connection ,
@@license,@@sql_mode ,@@lower_case_table_names , @@autocommit ;
```

현재 버전에서 새 옵티마이저를 비활성화하거나 2.0.7 또는 2.1.6 이상 버전으로 업그레이드하면 됩니다.

### Q4. 2.1.x 버전에서 JDBC로 연결하면 "Character set 'utf8mb3' is not supported by.net.Framework" 오류 메시지가 표시됩니다. {#q4-jdbc-connection-version-21x-error-message-character-set-utf8mb3-is-not-supported-bynetframework}

이 문제는 2.1.x 버전에서 자주 발생합니다. 이 문제가 발생하면 JDBC Driver를 8.0.32로 업그레이드해야 합니다.

## Tableau {#tableau}

### Q1. 2.0.x 버전에서 Tableau가 데이터 원본에 연결하지 못하고 오류 코드 37CE01A3을 표시합니다. {#q1-version-20x-reports-that-tableau-cannot-connect-to-the-data-source-with-error-code-37ce01a3}

현재 버전에서 새 옵티마이저를 비활성화하거나 2.0.7 이상 버전으로 업그레이드하세요.

### Q2. SSL 연결 오류:protocol version mismatch Failed to connect to the MySQL server {#q2-ssl-connection-error-version-mismatch-failed-to-connect-to-the-mysql-server}

이 오류는 Doris에서 SSL 인증이 활성화되어 있지만 연결 시 SSL 연결을 사용하지 않기 때문에 발생합니다. fe.conf에서 enable_ssl 변수를 비활성화해야 합니다.

### Q3. 연결 오류 Unsupported command(COM_STMT_PREPARED) {#q3-connection-error-unsupported-commandcom_stmt_prepared}

MySQL 드라이버 버전이 잘못 설치되어 있습니다. 대신 MySQL 5.1.x 연결 드라이버를 설치하세요.
