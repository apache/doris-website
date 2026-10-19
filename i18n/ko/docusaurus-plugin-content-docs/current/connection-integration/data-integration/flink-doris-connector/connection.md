---
{
    "title": "연결 옵션 및 TLS",
    "language": "ko",
    "description": "Flink Doris Connector를 Doris에 연결하기 위한 일반 옵션과 HTTP, JDBC, Thrift 및 Arrow Flight SQL 연결에 TLS를 활성화하는 방법을 설명합니다."
}
---

# 연결 옵션 및 TLS {#connection-options-and-tls}

이 페이지에서는 Flink Doris Connector가 Doris에 연결할 때 사용하는 일반 옵션과 TLS를 활성화하는 방법을 설명합니다. 이 옵션은 Source, Sink, Lookup Join에 모두 적용됩니다.

## 일반 옵션 {#common-options}

| 키                            | 기본값        | 필수 여부 | 설명                                                                                  |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------- |
| fenodes                       | --            | Y        | Doris FE http 주소. 여러 주소를 쉼표로 구분하여 지정할 수 있습니다.                    |
| benodes                       | --            | N        | Doris BE http 주소. 여러 주소를 쉼표로 구분하여 지정할 수 있습니다.                    |
| jdbc-url                      | --            | N        | JDBC 연결 정보. 예: `jdbc:mysql://127.0.0.1:9030`                                      |
| table.identifier              | --            | Y        | Doris 테이블 이름. 예: `db.tbl`                                                       |
| username                      | --            | Y        | Doris에 접근하기 위한 사용자 이름                                                      |
| password                      | --            | Y        | Doris에 접근하기 위한 비밀번호                                                         |
| auto-redirect                 | TRUE          | N        | Stream Load 요청을 리디렉션할지 여부. 활성화하면 Stream Load가 FE를 통해 데이터를 기록하며 BE 정보를 명시적으로 가져오지 않습니다. |
| doris.request.retries         | 3             | N        | Doris에 요청을 보낼 때의 재시도 횟수                                                    |
| doris.request.connect.timeout | 30s           | N        | Doris에 요청을 보낼 때의 연결 시간 초과                                                 |
| doris.request.read.timeout    | 30s           | N        | Doris에 요청을 보낼 때의 읽기 시간 초과                                                 |
| doris.enable.tls              | FALSE         | N        | Doris HTTP, MySQL/JDBC, BE Thrift 및 Arrow Flight SQL 연결에 TLS를 활성화할지 여부. |
| doris.tls.ca-certificate-path | --            | N        | PEM 형식의 CA 인증서 체인에 대한 로컬 경로. 비어 있으면 Connector는 사용자 지정 CA를 로드하지 않고 해당 클라이언트의 기본 trust store를 사용합니다. |
| doris.tls.skip-hostname-verification | FALSE | N        | CA 검증은 유지하면서 서버 호스트 이름 검증을 건너뛸지 여부. |
| doris.tls.excluded-protocols  | --            | N        | TLS가 활성화되어 있어도 평문 연결을 유지할 프로토콜을 쉼표로 구분한 목록. 지원하는 값: `http`, `mysql`, `thrift`, `arrowflight`. |

## TLS 활성화 {#tls}

Connector는 Doris HTTP 및 Stream Load, MySQL/JDBC, BE Thrift, Arrow Flight SQL 연결에 TLS를 활성화할 수 있습니다. TLS는 기본적으로 비활성화되어 있으며, Connector는 Doris 서버 인증서를 검증합니다.

Doris Source, Sink 또는 Catalog 설정에 다음 옵션을 추가하세요.

```sql
'doris.enable.tls' = 'true',
'doris.tls.ca-certificate-path' = '/etc/doris-tls/ca-chain.pem'
```

`doris.tls.ca-certificate-path`로 CA 파일을 지정할 때는 PEM 인증서 체인을 사용하고, Doris에 연결하는 모든 Flink 프로세스가 로컬 파일 시스템에서 해당 파일을 읽을 수 있도록 하세요. 이 경로를 설정하지 않으면 Connector는 사용자 지정 CA를 로드하지 않고 해당 클라이언트의 기본 trust store를 사용합니다. 운영 환경에서는 호스트 이름 검증을 활성화된 상태로 유지하세요.

Doris 프로토콜 중 의도적으로 평문 연결을 유지하는 프로토콜이 있다면 해당 프로토콜만 제외하세요. 지원하는 값은 `http`, `mysql`, `thrift`, `arrowflight`입니다.

```sql
'doris.tls.excluded-protocols' = 'arrowflight'
```

Connector는 프로토콜을 자동 감지하거나 TLS 연결에 실패한 뒤 평문 연결로 전환하지 않습니다.

`doris.enable.tls`를 활성화하면 Connector는 `jdbc-url`을 수정하지 않고 JDBC 연결 속성을 통해 TLS 설정을 전달합니다. 따라서 `jdbc-url`에는 연결 주소만 지정하고, `sslMode`, `useSSL` 또는 trust store 설정과 같은 TLS 매개변수를 추가하지 마세요.

Arrow Flight SQL은 TLS를 지원하지만 호스트 이름 검증만 건너뛰는 기능은 지원하지 않습니다. `doris.tls.skip-hostname-verification`을 `true`로 설정한 경우 `arrowflight`를 `doris.tls.excluded-protocols`를 통해 제외하세요.

Flink 배포 모드에 따라 CA 파일을 배포하세요.

- **Standalone**: Doris에 연결하는 모든 JobManager, TaskManager 및 SQL Gateway 호스트의 동일한 경로에 파일을 배치하세요.
- **YARN**: `yarn.ship-files: /local/path/ca.pem`로 파일을 로컬화하고, `doris.tls.ca-certificate-path`를 컨테이너에 로컬화된 파일 이름(예: `ca.pem`)으로 설정하세요.
- **Kubernetes**: 관련 JobManager 및 TaskManager Pod의 동일한 경로에 ConfigMap 또는 Secret을 마운트하세요.
