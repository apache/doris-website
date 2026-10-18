---
{
    "title": "MySQL 보안 전송",
    "language": "ko",
    "description": "Apache Doris SSL/TLS 암호화 연결 구성 가이드: MySQL 클라이언트 보안 전송, 단방향 인증과 mTLS 상호 인증, 인증서 생성 및 구성 세부 정보."
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Data transport encryption / Client identity authentication / Security compliance -->

이 문서는 Apache Doris와 MySQL 클라이언트 간 통신에 SSL/TLS 암호화를 활성화하는 방법을 설명합니다. 빠른 활성화, 클라이언트 연결 방법, mTLS 상호 인증, 사용자 지정 인증서 구성, 인증서 생성을 다룹니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 방법 |
|------|----------|
| 일반 업무의 데이터 전송 암호화 | 단방향 인증 활성화(기본값) |
| 금융, 공공기관, 기업 등 규정 준수가 필요한 환경 | mTLS 상호 인증 활성화 |
| 기업 내부 CA에서 발급한 인증서 사용 | 사용자 지정 인증서 구성 |
| PoC 또는 개발 환경에서의 간단한 검증 용도 | Doris에 내장된 기본 인증서 사용 |

## 사전 요구 사항 {#prerequisites}

- Apache Doris 클러스터가 배포되어 정상적으로 실행 중이어야 합니다.
- MySQL 클라이언트 버전이 >= 5.7.11이어야 합니다(이전 클라이언트 버전은 SSL 매개변수 구문이 다릅니다).
- 현재 지원되는 TLS 프로토콜 버전: TLS 1.2 및 TLS 1.3
- FE 노드의 `conf/fe.conf`를 수정할 권한과 FE를 재시작할 운영 권한이 있어야 합니다.

## 절차 개요 {#process-overview}

1. FE 구성에서 SSL을 활성화합니다(더 높은 보안 수준이 필요하면 mTLS도 활성화합니다).
2. FE를 재시작하여 구성을 적용합니다.
3. MySQL 클라이언트에서 `--ssl-mode` 매개변수를 지정하여 암호화 연결을 시작합니다.
4. (선택 사항) 기본 인증서를 사용자 지정 인증서로 교체합니다.

## SSL 인증 모드 비교 {#ssl-authentication-mode-comparison}

<!-- Knowledge type: Architecture selection decision -->

Doris는 두 가지 SSL 인증 모드를 제공합니다. 보안 요구 사항에 따라 선택하세요.

| 인증 모드 | 설명 | 적용 시나리오 |
|----------|------|----------|
| 단방향 인증(기본값) | 서버 인증서만 검증 | 일반적인 보안 요구 사항이 있는 환경 |
| 상호 인증(mTLS) | 서버와 클라이언트 인증서를 모두 검증 | 높은 보안 수준이 필요한 환경 |

## 빠른 시작: SSL 암호화 연결 활성화 {#quick-start-enable-ssl-encrypted-connection}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: First-time SSL enablement / Quick verification with default certificates -->

Doris에는 기본 키와 인증서 파일이 포함되어 있어 추가 인증서를 생성하지 않고도 SSL을 활성화할 수 있습니다. 전체 절차는 다음 두 단계로 이루어집니다.

### 1단계: FE에서 SSL 활성화 {#step-1-enable-ssl-on-fe}

FE 구성 파일 `conf/fe.conf`에 다음 구성을 추가한 후 FE를 재시작합니다.

```properties
enable_ssl = true
```

### 2단계: MySQL 클라이언트로 연결 {#step-2-connect-using-the-mysql-client}

```shell
mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1
```

## 클라이언트 SSL 연결 모드 {#client-ssl-connection-modes}

<!-- Knowledge type: Configuration parameters -->

MySQL 클라이언트는 `--ssl-mode` 매개변수로 연결 동작을 제어합니다. 사용 가능한 모드는 다음과 같습니다.

| SSL 모드 | 설명 | 명령어 예시 |
|----------|------|----------|
| PREFERRED(기본값) | 먼저 SSL 연결을 시도하고, 실패하면 평문 연결로 전환 | `mysql -uroot -P9030 -h127.0.0.1` |
| DISABLE | SSL을 비활성화하고 평문 연결 사용 | `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1` |
| REQUIRED | SSL 연결 강제 | `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1` |
| VERIFY_CA | SSL 연결을 강제하고 서버 인증서의 CA 검증(mTLS 환경에서 사용) | [상호 인증(mTLS) 구성](#configure-mutual-authentication-mtls) 참조 |

:::note 참고
`--ssl-mode` 매개변수는 MySQL 5.7.11에서 도입되었습니다. 이보다 오래된 MySQL 클라이언트는 [MySQL 공식 문서](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html)를 참조하세요.
:::

## 상호 인증(mTLS) 구성 {#configure-mutual-authentication-mtls}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: High security requirements / Strong client identity verification -->

mTLS에서는 서버가 클라이언트의 신원을 확인하는 동시에 클라이언트도 서버 인증서를 검증합니다. 연결 주체의 신원을 엄격하게 확인해야 하는 환경에 적합합니다.

### 1단계: mTLS 활성화 {#step-1-enable-mtls}

FE 구성 파일 `conf/fe.conf`에 다음 구성을 추가한 후 FE를 재시작합니다.

```properties
enable_ssl = true
ssl_force_client_auth = true
```

### 2단계: 클라이언트에서 인증서로 연결 {#step-2-connect-from-the-client-using-certificates}

mTLS로 연결할 때는 클라이언트에서 CA 인증서, 클라이언트 인증서, 개인 키를 지정해야 합니다.

```shell
mysql --ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 \
    --tls-version=TLSv1.2 \
    --ssl-ca=/path/to/your/ca.pem \
    --ssl-cert=/path/to/your/client-cert.pem \
    --ssl-key=/path/to/your/client-key.pem
```

### 기본 클라이언트 인증서 {#default-client-certificates}

Doris는 `Doris/conf/mysql_ssl_default_certificate/client_certificate/` 디렉터리에 기본 클라이언트 인증서 파일을 제공합니다.

| 파일 이름 | 설명 |
|--------|------|
| `ca.pem` | CA 인증서 |
| `client-cert.pem` | 클라이언트 인증서 |
| `client-key.pem` | 클라이언트 개인 키 |

## 인증서 구성 세부 정보 {#certificate-configuration-details}

<!-- Knowledge type: Configuration parameters -->

Doris에서 SSL을 활성화하려면 CA 키와 인증서, 서버 측 키와 인증서를 구성해야 합니다. 상호 인증을 활성화하려면 클라이언트 측 키와 인증서도 구성해야 합니다.

### 기본 인증서 {#default-certificates}

Doris에는 바로 사용할 수 있는 기본 인증서 파일이 포함되어 있습니다.

| 인증서 유형 | 기본 경로 | 기본 비밀번호 |
|----------|----------|----------|
| CA 인증서 | `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12` | `doris` |
| 서버 측 인증서 | `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12` | `doris` |
| 클라이언트 측 인증서 | `Doris/fe/mysql_ssl_default_certificate/client_certificate/` | - |

### 사용자 지정 인증서 {#custom-certificates}

사용자 지정 인증서를 사용하려면 FE 구성 파일 `conf/fe.conf`에 다음 구성을 추가합니다.

**CA 인증서 구성**

```properties
mysql_ssl_default_ca_certificate = /path/to/your/ca_certificate.p12
mysql_ssl_default_ca_certificate_password = your_password
```

**서버 측 인증서 구성**

```properties
mysql_ssl_default_server_certificate = /path/to/your/server_certificate.p12
mysql_ssl_default_server_certificate_password = your_password
```

:::tip 팁
다른 인증서 형식을 지정하려면 `ssl_trust_store_type` 매개변수를 `conf/fe.conf`에서 변경하면 됩니다. 기본값은 `PKCS12`입니다.
:::

## 사용자 지정 인증서 생성 {#generate-custom-certificates}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Use enterprise CA / Replace default certificates with self-signed certificates -->

자체 인증서를 사용해야 한다면 OpenSSL로 생성할 수 있습니다. 전체 명령어는 [MySQL 공식 문서: SSL 인증서 생성](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html)을 참조하세요.

### 1단계: CA, 서버, 클라이언트의 키와 인증서 생성 {#step-1-generate-keys-and-certificates-for-ca-server-and-client}

```shell
# Generate the CA certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 \
    -key ca-key.pem -out ca.pem

# Generate the server-side certificate and sign it with the CA above
# server-cert.pem = public key, server-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Generate the client-side certificate and sign it with the CA above
# client-cert.pem = public key, client-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout client-key.pem -out client-req.pem
openssl rsa -in client-key.pem -out client-key.pem
openssl x509 -req -in client-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

### 2단계: 인증서 검증 {#step-2-verify-the-certificates}

```shell
openssl verify -CAfile ca.pem server-cert.pem client-cert.pem
```

### 3단계: PKCS#12 형식으로 패키징 {#step-3-package-as-pkcs12-format}

Doris에서 사용할 수 있도록 CA 키와 인증서, 서버 측 키와 인증서를 각각 PKCS#12(P12) 형식으로 묶습니다.

```shell
# Package the CA key and certificate
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# Package the server-side key and certificate
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```

:::info 추가 정보
OpenSSL로 자체 서명 인증서를 생성하는 방법에 대한 자세한 내용은 [IBM 공식 문서](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl)를 참조하세요.
:::

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: SSL connection failure / Certificate configuration errors -->

### 질문: 클라이언트에서 `--ssl-mode` 매개변수를 인식할 수 없다고 합니다. {#q-the-client-reports-that-the---ssl-mode-parameter-is-not-recognized}

MySQL 클라이언트 버전이 5.7.11보다 오래된 버전입니다. MySQL 클라이언트를 업그레이드하거나 MySQL Connector/J 문서에서 해당 버전의 연결 매개변수를 확인하세요.

### 질문: `enable_ssl=true`를 활성화한 후에도 클라이언트가 평문으로 연결됩니다. {#q-after-enabling-enable_ssltrue-the-client-still-connects-with-a-plain-connection}

클라이언트는 기본적으로 SSL 연결을 강제하지 않는 `PREFERRED` 모드를 사용합니다. 클라이언트에서 `--ssl-mode=REQUIRED` 또는 `VERIFY_CA`를 사용하세요.

### 질문: mTLS 모드에서 연결에 실패합니다. {#q-connection-fails-in-mtls-mode}

클라이언트 인증서, CA 인증서 또는 개인 키가 제공되지 않았거나 경로가 잘못되었습니다. `--ssl-ca`, `--ssl-cert`, `--ssl-key`가 모두 올바른 인증서 파일을 가리키는지 확인하세요.

### 질문: 사용자 지정 인증서를 불러오지 못합니다. {#q-custom-certificate-fails-to-load}

인증서 형식이 `ssl_trust_store_type`과 일치하지 않거나 비밀번호가 잘못되었습니다. 인증서가 PKCS12 형식인지 확인하거나, `ssl_trust_store_type`을 명시적으로 설정하고 비밀번호를 확인하세요.
