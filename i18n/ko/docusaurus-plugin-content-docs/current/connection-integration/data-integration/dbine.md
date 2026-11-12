---
{
    "title": "DBine",
    "language": "ko",
    "description": "무료 오픈 소스 데스크톱 데이터베이스 관리 도구 DBine의 Doris 연결 유형을 사용해 Apache Doris에 연결하고, 데이터베이스와 테이블을 탐색하며 SQL을 실행하는 방법을 알아봅니다."
}
---

<!-- Knowledge type: Scenario description -->
<!-- Applicable scenario: Use DBine to connect to and query Apache Doris -->

## 개요 {#overview}

[DBine](https://dbine.com)은 Windows, macOS, Linux에서 사용할 수 있는 무료 오픈 소스(Apache 2.0 라이선스) 데스크톱 데이터베이스 관리 도구입니다. 하나의 창에서 130개 이상의 데이터베이스와 클라우드 서비스를 다룰 수 있습니다. Apache Doris 연결 유형을 제공하며, MySQL 프로토콜을 통해 FE에 연결합니다.

이 문서를 읽고 나면 다음을 할 수 있습니다.

- DBine을 설치하고 Doris 연결을 생성합니다.
- 내부 Catalog의 데이터베이스, 테이블, 뷰, 컬럼을 탐색하고 Doris에서 SQL을 실행합니다.
- 조회 결과를 해석할 때 MySQL 서버와 어떤 차이가 있는지 파악합니다.

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Check the DBine and Doris connection requirements before connecting -->

- DBine이 설치되어 있어야 합니다. [릴리스 페이지](https://github.com/addlayer-io/dbine/releases)에서 다운로드하세요.
- DBine을 실행하는 컴퓨터에서 FE에 접근할 수 있어야 합니다. Doris 사용자에게 대상 데이터베이스와 테이블에 필요한 권한을 부여하세요.
- Doris 클러스터의 연결 정보가 준비되어 있어야 합니다. FE 호스트 주소, FE의 MySQL 프로토콜 포트(기본값 `9030`), 대상 데이터베이스, 사용자 이름, 비밀번호가 필요합니다.

## Doris에 연결하기 {#connect-to-doris}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create a Doris connection in DBine -->

### 1. 연결 추가 {#1-add-a-connection}

DBine에서 **새 연결**을 클릭하고 엔진 목록에서 **Apache Doris**를 선택합니다.

### 2. Doris 연결 설정 {#2-configure-the-doris-connection}

연결 양식에 다음 정보를 입력합니다.

| 필드 | 설명 |
| --- | --- |
| 서버 | Doris 클러스터의 FE 호스트 주소입니다. |
| 포트 | FE의 MySQL 프로토콜 포트입니다. 기본값은 `9030`입니다. |
| 데이터베이스 | Doris 클러스터의 내부 Catalog에 있는 대상 데이터베이스입니다. 선택 사항입니다. |
| 사용자 | Doris 클러스터의 사용자 이름입니다. |
| 비밀번호 | Doris 클러스터의 비밀번호입니다. |

TLS를 사용하는 클러스터라면 **SSL/TLS** 탭을 열고 **연결 암호화(TLS)**를 선택합니다.

### 3. 연결 테스트 및 저장 {#3-test-and-save-the-connection}

**연결 테스트**를 클릭해 연결을 확인한 다음 **저장하고 연결**을 클릭합니다. 연결 테스트 결과에 `Connection successful`이 표시되고 **탐색기**에 연결이 나타납니다.

![연결 설정](/images/next/connection-integration/data-integration/dbine/dbine-connection-form.png)

### 4. 탐색 및 쿼리 실행 {#4-browse-and-query}

**탐색기**에서 연결을 펼치면 Doris 데이터베이스가 표시됩니다. 데이터베이스를 펼치면 테이블, 뷰, 컬럼을 볼 수 있습니다. 데이터베이스를 마우스 오른쪽 버튼으로 클릭하고 **새 쿼리**를 선택해 SQL 편집기를 연 다음 **실행**을 클릭합니다. 예를 들면 다음과 같습니다.

```sql
SELECT @@version_comment AS doris_version;
```

```text
+--------------------------------------------+
| doris_version                              |
+--------------------------------------------+
| doris version doris-4.1.3-rc02-7126cf65d96 |
+--------------------------------------------+
```

![Doris 탐색 및 쿼리 실행](/images/next/connection-integration/data-integration/dbine/dbine-editor.png)

## 알려진 제한 사항 {#known-limitations}

아래 내용은 Doris 4.1.3(`apache/doris:all-in-one-4.1.3`)에서 확인했습니다.

| 영역 | 상태 | 상세 내용 |
| --- | --- | --- |
| 탐색 및 쿼리 | 정상 | 데이터베이스, 테이블, 뷰, 컬럼이 표시되며 사용자에게 부여된 권한으로 내부 Catalog를 쿼리합니다. 한 데이터베이스에 대한 `SELECT_PRIV` 권한을 부여받은 사용자는 `information_schema`, `mysql`과 함께 해당 데이터베이스를 볼 수 있습니다. |
| 실행 계획 | 정상 | `EXPLAIN`은 Doris의 Nereids 실행 계획을 텍스트로 반환합니다. |
| 서버 버전 | MySQL 버전 | 연결 테스트와 상태 표시줄에는 Doris가 `version()`을 통해 보고하는 MySQL 버전인 `5.7.99`가 표시됩니다. Doris 빌드를 확인하려면 `SELECT @@version_comment`를 실행하세요. |

DBine 사용법에 관한 자세한 내용은 [DBine 저장소](https://github.com/addlayer-io/dbine)를 참조하세요.
