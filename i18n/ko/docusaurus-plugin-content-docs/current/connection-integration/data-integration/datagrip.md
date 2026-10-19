---
{
    "title": "DataGrip",
    "language": "ko",
    "description": "DataGrip의 MySQL 데이터 소스를 사용하여 Apache Doris에 연결하고, 내부 Catalog와 외부 Catalog를 구성하고, 연결을 확인하는 방법을 알아봅니다."
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Use DataGrip to connect to and query Apache Doris -->

## 적용 시나리오 {#applicable-scenario}

DataGrip은 JetBrains에서 제공하는 강력한 크로스 플랫폼 데이터베이스 도구로, 관계형 데이터베이스와 NoSQL 데이터베이스를 모두 지원합니다. Apache Doris는 MySQL 프로토콜과의 호환성이 높으므로, DataGrip의 MySQL 데이터 소스를 사용하여 Apache Doris에 연결하고 내부 Catalog와 외부 Catalog의 데이터를 쿼리할 수 있습니다.

이 문서를 읽고 나면 다음 작업을 수행할 수 있습니다.

- MySQL 데이터 소스를 사용하여 Doris 연결을 생성합니다.
- 내부 Catalog 또는 외부 Catalog의 연결 정보를 구성합니다.
- 연결을 확인하고 DataGrip에서 데이터베이스를 조회하고 관리합니다.

## 사전 요구 사항 {#prerequisites}

- DataGrip이 설치되어 있어야 합니다. 설치되어 있지 않다면 [DataGrip 공식 웹사이트](https://www.jetbrains.com/datagrip/)에서 다운로드하여 설치하세요.
- FE 호스트 IP 주소, FE 쿼리 포트, 대상 데이터베이스, 사용자 이름, 비밀번호를 포함한 Doris 클러스터 연결 정보가 준비되어 있어야 합니다.

:::info 버전 참고
이 문서의 절차는 DataGrip 2023.3.4에서 검증되었습니다.
:::

## Doris에 연결하기 {#connect-to-doris}

### 1. MySQL 데이터 소스 추가 {#1-add-a-mysql-data-source}

DataGrip을 실행하고 DataGrip 창 왼쪽 상단의 더하기(**+**) 아이콘을 클릭한 다음 MySQL 데이터 소스를 선택합니다.

![데이터 소스 추가](/images/datagrip1.png)

### 2. Doris 연결 구성 {#2-configure-the-doris-connection}

데이터 소스 및 드라이버 창의 일반 탭에서 Doris 연결 정보를 구성합니다.

| 구성 항목 | 설명 |
| --- | --- |
| 호스트 | Doris 클러스터의 FE 호스트 IP 주소입니다. |
| 포트 | Doris 클러스터의 FE 쿼리 포트입니다. 예: `9030`. |
| 데이터베이스 | Doris 클러스터의 대상 데이터베이스입니다. `catalog.db` 형식으로 Catalog를 지정할 수도 있습니다. |
| 사용자 | Doris 클러스터에 로그인할 사용자 이름입니다. 예: `admin`. |
| 비밀번호 | Doris 클러스터에 로그인할 비밀번호입니다. |

데이터베이스 필드를 사용하여 내부 Catalog와 외부 Catalog를 구분할 수 있습니다. DataGrip의 MySQL 데이터 소스로 여러 Doris 데이터 소스를 생성하면 Doris의 각 Catalog를 개별적으로 관리할 수 있습니다.

| 데이터베이스 입력 방법 | 기본 연결 대상 |
| --- | --- |
| 데이터베이스 이름만 입력 | 기본적으로 내부 Catalog에 연결합니다. |
| `catalog.db` 입력 | 기본적으로 데이터베이스 필드에 지정된 Catalog에 연결합니다. DataGrip에 표시되는 데이터베이스와 테이블도 연결된 Catalog에 속한 항목입니다. |

:::info 버전 참고
데이터베이스 필드에 `catalog.db` 형식을 사용하여 Doris 외부 Catalog를 관리하려면 Doris 버전 2.1.0 이상이 필요합니다.
:::

내부 Catalog 연결 예시는 다음과 같습니다.

![내부 Catalog에 연결](/images/datagrip2.png)

외부 Catalog 연결 예시는 다음과 같습니다.

![외부 Catalog에 연결](/images/datagrip3.png)

### 3. 데이터 소스 연결 테스트 {#3-test-the-data-source-connection}

연결 정보를 입력한 후 왼쪽 하단의 연결 테스트를 클릭하여 데이터베이스 연결 정보가 올바른지 확인합니다. DataGrip에 다음 대화 상자가 표시되면 연결 테스트가 성공한 것입니다. 그런 다음 오른쪽 하단의 확인을 클릭하여 연결 구성을 완료합니다.

![연결 테스트](/images/datagrip4.png)

### 4. 데이터베이스 연결 및 관리 {#4-connect-to-and-manage-the-database}

데이터베이스 연결이 설정되면 왼쪽 데이터베이스 연결 탐색 영역에서 생성한 데이터 소스 연결을 확인할 수 있으며, DataGrip을 통해 데이터베이스에 연결하고 관리할 수 있습니다.

![연결 설정](/images/datagrip5.png)

## 기능 지원 범위 {#feature-support-scope}

| 지원 상태 | 설명 |
| --- | --- |
| 기본 지원 | 대부분의 시각적 조회 작업과 SQL 콘솔에서 SQL을 작성하여 Doris를 조작하는 작업을 지원합니다. |
| 지원하지 않거나 검증되지 않음 | 데이터베이스 및 테이블 생성, 스키마 변경, 데이터 삽입, 업데이트 또는 삭제 등의 작업입니다. |
