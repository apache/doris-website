---
{
    "title": "CloudDM",
    "language": "ko",
    "description": "CloudDM을 사용하여 Apache Doris에 연결하고 Doris 데이터 소스를 관리할 수 있습니다. 데이터 접근, 마스킹, 시각적 편집 및 데이터베이스 CI/CD를 지원합니다."
}
---

## 개요 {#overview}

<!-- Knowledge type: Scenario description -->
<!-- Applicable scenario: Use CloudDM to connect to and manage Apache Doris data sources -->

Clougence에서 개발한 CloudDM은 팀과 개인 사용자를 위한 크로스 플랫폼 데이터베이스 도구입니다. 사용자가 규정을 준수하면서 데이터베이스를 안전하고 효율적으로 변경하고 관리할 수 있도록 지원합니다.

Apache Doris 환경에서 CloudDM은 Doris 기능에 맞춘 연동을 제공하며, 데이터 접근, 데이터 마스킹, 시각적 편집 및 데이터베이스 CI/CD를 지원합니다. 이 문서를 읽고 나면 다음 작업을 수행할 수 있습니다:

- CloudDM에서 Doris 데이터 소스를 추가합니다.
- Doris 인스턴스의 데이터 관리를 활성화하고 연결을 테스트합니다.
- CloudDM을 사용하여 Doris 데이터에 접근하고 관리합니다.

## 사전 준비 {#preparation}

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Check the CloudDM installation and verify the version before connecting to Doris -->

| 항목 | 요구 사항 |
|-------|------|
| CloudDM | CloudDM이 설치되어 있어야 합니다. [CloudDM 공식 웹사이트](https://www.cdmgr.com/)에서 다운로드하여 설치할 수 있습니다. |
| 검증된 버전 | 이 문서는 CloudDM 2.8.0.0 버전으로 검증했습니다. |

## Doris 데이터 소스에 연결 {#connect-to-a-doris-data-source}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create a Doris data source connection in CloudDM -->

### 1. Doris 데이터 소스 추가 {#1-add-a-doris-data-source}

1. CloudDM에 로그인합니다.
2. 탐색 모음에서 **데이터 소스 관리** > **데이터 소스 추가**를 클릭합니다.
3. Doris 데이터 소스를 선택합니다.

![데이터 소스 추가](/images/next/connection-integration/data-integration/clouddm/clouddm1-en.png)

### 2. 연결 정보 설정 {#2-configure-connection-information}

데이터 소스 추가 페이지에서 다음 연결 정보를 설정합니다:

| 항목 | 설명 |
|-------|------|
| 클라이언트 주소 | Doris 클러스터 서버의 FE 쿼리 포트입니다. 예: `hostID:9030`. |
| 계정 | Doris 클러스터에 로그인할 때 사용하는 사용자 이름입니다. 예: `admin`. |
| 비밀번호 | Doris 클러스터에 로그인할 때 사용하는 사용자의 비밀번호입니다. |

:::tip
Doris는 `internal catalog`와 `external catalog`로 나뉘며, CloudDM은 둘 다 동시에 관리할 수 있습니다.
:::

:::info 참고
Doris의 `external catalog`를 `catalog.db` 형식의 데이터베이스로 관리하려면 Doris 버전이 2.1.0 이상이어야 합니다.
:::

### 3. 데이터 관리 활성화 및 연결 테스트 {#3-enable-data-management-and-test-the-connection}

상단에서 **쿼리 설정** > **쿼리 구성**을 클릭하여 Doris 인스턴스의 데이터 관리를 활성화하고 연결을 테스트합니다.

![데이터 소스 활성화](/images/next/connection-integration/data-integration/clouddm/clouddm2-en.png)

### 4. Doris 데이터에 접근 {#4-access-doris-data}

데이터베이스 연결이 설정되면 왼쪽의 데이터베이스 연결 탐색 영역에서 연결된 데이터 소스를 확인하고, CloudDM을 통해 데이터베이스에 연결하여 관리할 수 있습니다.

![연결 설정](/images/next/connection-integration/data-integration/clouddm/clouddm3-en.png)

## 지원되는 Doris 관리 시나리오 {#supported-doris-management-scenarios}

<!-- Knowledge type: Feature support -->
<!-- Applicable scenario: Understand which Doris management capabilities CloudDM supports -->

CloudDM은 다음 두 가지 유형의 Doris 기능을 지원합니다:

| 시나리오 | 지원 기능 |
|---------|---------|
| 쿼리 클라이언트 | Doris의 데이터베이스 객체를 시각적으로 관리; 콘솔에서 SQL을 작성하여 Doris 작업 수행; 쿼리 결과 내보내기. |
| 팀 단위 사용 | 테이블 수준까지 세분화된 구문 단위 권한 부여; 티켓 승인; 데이터베이스 CI/CD; 민감한 데이터 마스킹; SQL 검토 규칙. |
