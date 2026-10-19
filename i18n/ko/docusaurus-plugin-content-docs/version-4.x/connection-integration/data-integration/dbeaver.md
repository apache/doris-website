---
{
    "title": "DBeaver",
    "language": "ko",
    "description": "Apache Doris 또는 MySQL 드라이버로 DBeaver를 Apache Doris에 연결하고, 내부 및 외부 카탈로그를 탐색하며 SQL 쿼리를 실행합니다."
}
---

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use DBeaver to connect to and manage Apache Doris databases -->

DBeaver는 개발자, 데이터베이스 관리자, 분석가 등 데이터를 다루는 모든 사용자를 위한 크로스 플랫폼 데이터베이스 도구입니다.

Apache Doris는 MySQL 프로토콜을 통해 쿼리를 수신합니다. DBeaver 26.1.1 이상에는 내부 및 외부 카탈로그에 쿼리를 실행할 수 있는 `Apache Doris` 데이터 소스가 포함되어 있습니다.

`Select your database` 창에 `Apache Doris`가 표시되지 않으면 MySQL 드라이버를 사용하세요. [MySQL 드라이버로 연결](#connect-with-the-mysql-driver)을 참조하세요.

## 사용 사례 {#use-cases}

- Apache Doris 카탈로그, 데이터베이스, 테이블, 뷰 및 기타 메타데이터를 탐색합니다.
- SQL 편집기에서 쿼리를 실행하고 데이터를 분석합니다.
- 하나의 도구에서 내부 및 외부 카탈로그를 관리합니다.
- 세션, 시스템 변수, 사용자 권한 등 런타임 정보를 확인합니다.

## 사전 요구 사항 {#prerequisites}

- [https://dbeaver.com](https://dbeaver.com)에서 DBeaver 26.1.1 이상을 설치합니다.
- Apache Doris 클러스터에 접속할 수 있어야 하며, FE 호스트 주소, MySQL 프로토콜 포트, 사용자 이름 및 비밀번호가 필요합니다.
- Doris 2.1.0 이상을 사용해야 `catalog.db` 형식으로 외부 카탈로그에 연결할 수 있습니다.

## DBeaver를 Doris에 연결 {#connect-dbeaver-to-doris}

### Apache Doris 드라이버로 연결(권장) {#connect-with-the-apache-doris-driver-recommended}

:::warning 버전 요구 사항
DBeaver 26.1.1 이상이 필요합니다.
:::

#### 1단계: 데이터베이스 연결 생성 {#step-1-create-a-database-connection}

DBeaver를 실행합니다.

왼쪽 상단의 더하기(`+`) 아이콘을 클릭하거나 메뉴 모음에서 `Database` > `New Database Connection`을 선택합니다. DBeaver에서 `Connect to a database` 창이 열립니다.

![데이터베이스 연결 생성](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-add-connection.jpg)

#### 2단계: Apache Doris 드라이버 선택 {#step-2-select-the-apache-doris-driver}

`Select your database` 창에서 `Apache Doris`를 검색하거나 선택한 다음 `Next`를 클릭합니다.

![Apache Doris 드라이버 선택](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-select-driver.jpg)

#### 3단계: Doris 연결 설정 {#step-3-configure-the-doris-connection}

`Main` 탭(`Apache Doris connection settings` 창)에서 다음 값을 입력합니다.

| 필드 | 설명 | 예시 |
|-------|-------------|---------|
| 호스트 | FE 호스트 이름 또는 IP 주소입니다. SSH 터널을 사용하는 경우 로컬 포워딩 주소를 입력합니다. | `127.0.0.1` |
| 포트 | FE MySQL 프로토콜 포트입니다. SSH 터널을 사용하는 경우 로컬 포워딩 포트를 입력합니다. | `9030` 또는 `19030` |
| 데이터베이스/스키마 | 선택 사항입니다. 연결할 데이터베이스입니다. 외부 카탈로그에 직접 연결하려면 `catalog.db` 형식을 사용합니다. | `example_db` 또는 `hive.example_db` |
| 사용자 이름 | Doris 클러스터의 사용자 이름입니다. | `admin` |
| 비밀번호 | Doris 클러스터의 비밀번호입니다. | - |

`Database/Schema` 값에 따라 DBeaver에서 여는 카탈로그와 데이터베이스가 결정됩니다.

- 비워 두면 연결 후 데이터베이스 탐색기에서 카탈로그와 데이터베이스를 탐색할 수 있습니다.
- 데이터베이스 이름을 입력하면 내부 카탈로그의 해당 데이터베이스가 열립니다.
- `catalog.db`를 입력하면 지정한 외부 카탈로그의 데이터베이스가 열립니다. DBeaver는 해당 카탈로그와 데이터베이스의 테이블을 표시합니다.

:::note
`catalog.db` 형식을 사용하려면 Doris 2.1.0 이상이 필요합니다.
:::

내부 카탈로그에 연결:

![내부 카탈로그에 연결](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-internal-catalog.jpg)

외부 카탈로그에 연결:

![외부 카탈로그에 연결](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-external-catalog.jpg)

DBeaver에 내장된 SSH 지원 기능을 사용하려면 오른쪽 상단의 `SSH, Proxy`를 클릭하고 터널을 설정합니다. 이미 로컬 포트 포워딩을 설정했다면 로컬 주소와 포트를 각각 `Host`와 `Port`에 입력합니다.

#### 4단계: 연결 테스트 및 저장 {#step-4-test-and-save-the-connection}

왼쪽 하단의 `Test Connection`을 클릭합니다.

DBeaver에서 연결 성공 메시지가 표시되면 `OK`를 클릭합니다.

`Finish`를 클릭하여 연결을 저장합니다.

![Apache Doris 드라이버 연결 테스트](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-test-connection.jpg)

#### 5단계: Doris 객체 탐색 {#step-5-browse-doris-objects}

새 데이터 소스가 데이터베이스 탐색기에 표시됩니다. 이를 펼치면 Doris 카탈로그, 데이터베이스, 테이블 및 뷰를 탐색할 수 있습니다.

![Doris 객체 탐색](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-navigator.jpg)

#### 드라이버 속성 설정 {#configure-driver-properties}

Apache Doris 드라이버는 MySQL Connector/J를 사용하여 FE MySQL 프로토콜 포트에 연결합니다. 기본 포트는 `9030`이고 기본 사용자는 `root`입니다. JDBC URL 템플릿은 다음과 같습니다.

```text
jdbc:mysql://{host}[:{port}]/[{database}]
```

드라이버 클래스는 다음과 같습니다.

```text
com.mysql.cj.jdbc.Driver
```

드라이버의 기본 설정은 다음과 같습니다.

```text
connectTimeout=20000
rewriteBatchedStatements=true
useSSL=false
enabledTLSProtocols=TLSv1.2,TLSv1.3
```

![Apache Doris 드라이버 속성 설정](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-driver-properties.jpg)

`useSSL=false`는 기본적으로 TLS/SSL을 비활성화합니다. FE MySQL 프로토콜 포트에 TLS가 활성화되어 있고 인증서 체인이 올바르게 설정되어 있다면 `Driver properties`에서 MySQL Connector/J의 SSL 속성을 설정합니다. 예를 들면 다음과 같습니다.

```text
useSSL=true
sslMode=REQUIRED
```

인증 기관을 검증하려면 Java 트러스트스토어를 설정합니다.

```text
sslMode=VERIFY_CA
trustCertificateKeyStoreUrl=file:/path/to/doris-truststore.jks
trustCertificateKeyStorePassword=<password>
```

서버 호스트 이름도 검증하려면 다음 설정을 사용합니다.

```text
sslMode=VERIFY_IDENTITY
```

`VERIFY_IDENTITY`를 사용하는 경우 DBeaver의 `Host` 값이 인증서의 SAN 또는 CN과 일치해야 합니다.

### MySQL 드라이버로 연결 {#connect-with-the-mysql-driver}

`Select your database` 창에 `Apache Doris`가 표시되지 않으면 MySQL 드라이버로 연결합니다.

#### 1단계: 데이터베이스 연결 생성 {#step-1-create-a-database-connection-1}

DBeaver를 실행합니다.

왼쪽 상단의 더하기(`+`) 아이콘을 클릭하거나 메뉴 모음에서 `Database` > `New Database Connection`을 선택합니다. DBeaver에서 `Connect to a database` 창이 열립니다.

![MySQL 데이터베이스 연결 생성](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-add-connection.jpg)

#### 2단계: MySQL 드라이버 선택 {#step-2-select-the-mysql-driver}

`Select your database` 창에서 `MySQL`을 선택합니다.

#### 3단계: Doris 연결 설정 {#step-3-configure-the-doris-connection-1}

`Main` 탭(`Connection Settings` 창)에서 다음 값을 입력합니다.

| 필드 | 설명 | 예시 |
|-------|-------------|---------|
| 서버 호스트 | FE 호스트 이름 또는 IP 주소입니다. | `127.0.0.1` |
| 포트 | FE MySQL 프로토콜 포트입니다. | `9030` |
| 데이터베이스 | 연결할 데이터베이스입니다. 외부 카탈로그에 직접 연결하려면 `catalog.db` 형식을 사용합니다. | `example_db` 또는 `hive.example_db` |
| 사용자 이름 | Doris 클러스터의 사용자 이름입니다. | `admin` |
| 비밀번호 | Doris 클러스터의 비밀번호입니다. | - |

`Database` 값에 따라 기본 카탈로그가 결정됩니다.

- 데이터베이스 이름을 입력하면 내부 카탈로그의 해당 데이터베이스가 열립니다.
- `catalog.db`를 입력하면 지정한 외부 카탈로그의 데이터베이스가 열립니다. DBeaver는 해당 카탈로그와 데이터베이스의 테이블을 표시합니다.

여러 카탈로그에 직접 접근해야 한다면 카탈로그별로 Doris 데이터 소스를 생성합니다.

:::note
`catalog.db` 형식을 사용하려면 Doris 2.1.0 이상이 필요합니다.
:::

내부 카탈로그에 연결:

![MySQL 드라이버로 내부 카탈로그에 연결](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-internal-catalog.jpg)

외부 카탈로그에 연결:

![MySQL 드라이버로 외부 카탈로그에 연결](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-external-catalog.jpg)

#### 4단계: 연결 테스트 및 저장 {#step-4-test-and-save-the-connection-1}

왼쪽 하단의 `Test Connection`을 클릭합니다.

DBeaver에서 연결 성공 메시지가 표시되면 `OK`를 클릭합니다.

![MySQL 드라이버 연결 테스트](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-test-connection.jpg)

`Finish`를 클릭하여 연결을 저장합니다.

#### 5단계: 데이터베이스 관리 {#step-5-manage-the-database}

새 데이터 소스가 데이터베이스 탐색기에 표시됩니다. 이 데이터 소스를 사용하여 데이터베이스에 연결하고 관리합니다.

![MySQL 드라이버로 데이터베이스 관리](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-navigator.jpg)

## 드라이버 선택 및 기능 지원 {#driver-selection-and-feature-support}

### 드라이버 선택 {#choose-a-driver}

Apache Doris 드라이버와 MySQL 드라이버는 모두 FE MySQL 프로토콜 포트를 통해 Doris에 연결합니다. 두 드라이버의 주요 차이점은 DBeaver에서 메타데이터를 모델링하는 방식, 탐색기에서 객체를 구성하는 방식, 제공하는 관리 기능입니다.

다음 기준에 따라 드라이버를 선택합니다.

| 사용 사례 | 권장 드라이버 |
|----------|--------------------|
| Doris에 연결하여 SQL을 실행하고 데이터베이스 및 테이블 탐색 | Apache Doris 드라이버 |
| 하나의 연결에서 내부 카탈로그와 여러 외부 카탈로그 탐색 | Apache Doris 드라이버 |
| 현재 DBeaver 버전에 Apache Doris 데이터 소스가 없음 | MySQL 드라이버 |
| 사용자, 세션 관리자 및 시스템 정보 보기 | MySQL 드라이버 |

내부 카탈로그만 사용하는 경우 두 드라이버 모두 Doris에 연결하여 SQL을 실행할 수 있습니다. 다만 Apache Doris 드라이버 사용을 권장합니다.

### 기능 비교 {#feature-comparison}

| 기능 | Apache Doris 드라이버 | MySQL 드라이버 |
|---------|---------------------|--------------|
| Doris 연결 및 SQL 실행 | 지원됨 | 지원됨 |
| 내부 카탈로그 탐색 | 지원됨 | 지원됨 |
| 하나의 연결에서 여러 카탈로그 탐색 | 지원됨 | 지원되지 않음 |
| 데이터베이스 탐색기에서 외부 카탈로그 탐색 | 지원됨 | 지원되지 않음 |
| `catalog.db`를 기본 SQL 컨텍스트로 사용 | 지원됨 | 지원됨 |
| 테이블, 뷰, 열 및 DDL 보기 | 지원됨 | 지원됨 |
| SQL 편집기 및 SQL 콘솔 | 지원됨 | 지원됨 |
| UI를 통한 데이터 조회 | 지원됨 | 지원됨 |
| UI를 통한 데이터 삽입 | 지원됨 | 지원됨 |
| 사용자, 세션 관리자 및 시스템 정보 보기 | 지원되지 않음 | 지원됨 |
| 도구 > 분석 | 지원되지 않음 | 지원됨 |
| 도구 > 테이블 비우기 | 지원되지 않음 | 지원됨 |

:::note 지원 범위

이 표는 허용 목록 방식으로 지원 기능을 정의합니다.

- 표에서 명시적으로 "지원됨"으로 표시된 기능만 이 문서의 지원 범위에 포함됩니다.
- 표에 나열되지 않은 DBeaver UI 작업 및 관리 기능은 지원되지 않습니다.
- MySQL 드라이버를 사용할 때 DBeaver 인터페이스에 MySQL 기능이 표시되더라도 Doris에서 해당 기능을 지원한다는 의미는 아닙니다.
- 사용자, 세션 관리자 및 시스템 정보는 읽기 전용입니다. DBeaver를 사용하여 사용자, 권한 또는 세션을 수정할 수 없습니다.
- `Analyse` 및 `Truncate` 지원은 MySQL 드라이버를 사용할 때 DBeaver 도구 메뉴에만 적용됩니다. Apache Doris 드라이버를 사용하는 경우 SQL 편집기에서 해당 Doris SQL 문을 실행합니다.

:::

### 주요 제한 사항 {#important-limitations}

두 드라이버 모두 다음 작업을 지원하지 않습니다.

- UI를 통한 기존 데이터 수정 또는 삭제.
- UI를 통한 테이블 생성.
- UI를 통한 열 추가 또는 수정.
- UI를 통한 인덱스 생성 또는 수정.
- UI를 통한 외래 키 또는 트리거 생성.
- UI를 통한 키 모델, 파티션, 버킷, 복제본 수 또는 테이블 속성 설정.
- 세션 상태, 전역 상태 또는 대시보드.
- 검사, 최적화, 복구 또는 데이터베이스 덤프.

Doris 테이블 스키마를 변경하거나 기존 데이터를 수정 또는 삭제하려면 SQL 편집기를 사용합니다.
