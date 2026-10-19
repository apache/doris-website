---
{
    "title": "LibreDB Studio",
    "language": "ko",
    "description": "MySQL 와이어 프로토콜로 LibreDB Studio를 Apache Doris에 연결하여 스키마를 탐색하고, 쿼리를 실행하고, 클러스터를 모니터링하는 방법과 현재 지원되지 않는 사항을 명확히 안내합니다."
}
---

<!-- Knowledge type: Scenario description -->
<!-- Applicable scenario: Use LibreDB Studio to connect to and query Apache Doris -->

## 개요 {#overview}

[LibreDB Studio](https://libredb.org)는 데스크톱 애플리케이션으로 설치하는 대신
브라우저에서 실행하는 오픈 소스(MIT 라이선스) SQL IDE입니다. Docker 이미지, Helm 차트,
또는 npm 패키지로 제공됩니다. 별도의 Doris 드라이버가 없으므로 MySQL
연결 유형을 사용해 MySQL 와이어 프로토콜로 Apache Doris에 연결합니다.

이 문서를 읽으면 다음 작업을 수행할 수 있습니다.

- LibreDB Studio를 실행하고 MySQL 연결 유형으로 Doris 연결을 생성합니다.
- 내부 Catalog의 데이터베이스와 테이블을 탐색하고 Doris에서 SQL을 실행합니다.
- 패널을 활용하기 전에 Doris가 제공하지 않는 측정값과 그 이유를 파악합니다.

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Check the LibreDB Studio and Doris connection requirements before connecting -->

- LibreDB Studio가 실행 중이어야 합니다. 가장 빠른 실행 방법은 Docker를 사용하는 것입니다.

```sh
docker run --name libredb-studio -p 3000:3000 ghcr.io/libredb/libredb-studio:latest
```

`http://localhost:3000`을 엽니다. 초기 관리자 비밀번호는 컨테이너 로그(`docker logs libredb-studio`)에 출력됩니다.

  Helm 차트와 npm 패키지(`npx @libredb/studio`)도 제공됩니다. 자세한 내용은
  [LibreDB Studio 저장소](https://github.com/libredb/libredb-studio)를 참조하세요.
- LibreDB Studio 서버/컨테이너에서 FE에 접근할 수 있어야 합니다. 컨테이너의 `localhost`는 해당 컨테이너 자체를 가리킵니다. Doris가 호스트에서 실행 중이면 컨테이너에서 접근할 수 있는 호스트 주소를 사용합니다. Doris 사용자에게 대상 데이터베이스와 테이블에 필요한 권한을 부여해야 합니다.
- Doris 클러스터 연결 정보를 준비해야 합니다. FE 호스트 주소, FE MySQL 프로토콜 포트
  (기본값 `9030`), 대상 데이터베이스, 사용자 이름, 비밀번호가 필요합니다.

## Doris에 연결하기 {#connect-to-doris}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create a Doris connection in LibreDB Studio -->

### 1. 연결 추가 {#1-add-a-connection}

브라우저에서 LibreDB Studio를 열고 로그인한 다음 **+** 버튼을 클릭해 새 연결을 추가합니다.

![연결 추가](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-add-connection.png)

### 2. Doris 연결 구성 {#2-configure-the-doris-connection}

연결 유형으로 **MySQL**을 선택하고 다음 항목을 입력합니다. Doris는 MySQL 와이어 프로토콜을 사용하므로
연결 유형 목록에 별도의 Doris 항목은 없습니다.

| 필드 | 설명 |
| --- | --- |
| 호스트 | Doris 클러스터의 FE 호스트 주소입니다. |
| 포트 | FE MySQL 프로토콜 포트로, 기본값은 `9030`입니다(MySQL의 `3306`과 다름). |
| 데이터베이스 | Doris 클러스터의 내부 Catalog에 있는 대상 데이터베이스입니다. |
| 사용자 | Doris 클러스터의 사용자 이름입니다. |
| 비밀번호 | Doris 클러스터의 비밀번호입니다. |

![연결 구성](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-connection-form.png)

### 3. 연결 테스트 및 설정 {#3-test-and-establish-the-connection}

**연결 테스트**를 클릭해 확인한 다음 **연결 설정**을 클릭해 저장합니다. 연결 테스트에서는
`Connected successfully`가 표시됩니다. 연결 설정을 한 번 클릭하면 연결이 저장되고,
헤더 배지에 **온라인**이 표시됩니다.

![연결 완료](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-connected.png)

### 4. 탐색 및 쿼리 실행 {#4-browse-and-query}

객체 탐색기에서 연결을 펼치면 Doris의 데이터베이스와 테이블을 볼 수 있습니다. SQL
편집기에서 내부 Catalog를 대상으로 쿼리를 실행합니다. 예를 들면 다음과 같습니다.

```sql
SELECT 1 AS connection_test;
```

```text
+-----------------+
| connection_test |
+-----------------+
|               1 |
+-----------------+
```

![Doris 탐색 및 쿼리 실행](/images/next/connection-integration/data-integration/libredb-studio/libredb-studio-editor.png)

## 알려진 제한 사항 {#known-limitations}

Apache Doris는 자체 연결 유형이 아닌 MySQL 연결 유형의 파생 연결 대상으로 처리되므로,
LibreDB Studio는 MySQL, MariaDB, TiDB와 동일한 코드 경로를 통해 Doris에 연결합니다. 아래 내용은 처음에 Doris 4.1.3에서 검증했습니다. dev와의 차이는 명시했으며, 표시되는 패널은 LibreDB Studio 버전에 따라서도 달라집니다.

| 영역 | 상태 | 상세 내용 |
| --- | --- | --- |
| 행 수 및 바이트 크기 | 정상 | Doris의 백그라운드 통계가 안정된 뒤에는 행 수와 바이트 크기 모두 Doris 자체의 `SHOW DATA` 출력과 정확히 일치했습니다. |
| 쿼리 취소 | 정상 | Doris 4.1.3 검증에서 `SELECT sleep(8)`을 취소했으며, LibreDB Studio에는 "Query Cancelled: Query execution was cancelled."가 표시되었습니다. |
| 권한 오류 | 정상 | 한 테이블에 대해서만 `SELECT_PRIV`를 부여받은 역할로 접속하면 객체 탐색기에 해당 테이블만 표시되었으며, 다른 테이블을 쿼리하면 Doris의 오류 메시지가 그대로 반환되었습니다. 아래에서는 구체적인 역할, 데이터베이스, 테이블 및 열 이름을 자리표시자로 바꿨습니다. `Permission denied: user ['role'@'%'] does not have privilege for [...] command on [internal].[db].[table].[column]`. |
| 개요 및 상태 패널 | 미제공 항목 표시 | 두 패널 모두 응답합니다. 개요에는 `@@version_comment`에서 읽은 실제 빌드가 표시됩니다. `version()`은 Doris가 클라이언트에 알리는 MySQL 버전을 반환하므로 사용하지 않습니다. Doris는 옵션 없는 `SHOW STATUS`에 행을 반환하지 않으며 `max_connections` 변수도 제공하지 않으므로, 서버 가동 시간과 연결 수에는 `N/A, not published`가 표시되며 `0`으로 표시되지 않습니다. |
| 인덱스 목록 | 버전에 따라 다름 | Doris 4.1.3은 비어 있는 `information_schema.statistics`를 반환합니다. dev 버전은 이 테이블을 통해 MySQL과 호환되는 기본 키, 고유 키 및 인덱스 메타데이터를 제공하므로 클라이언트에서 이를 조회할 수 있습니다. 사용하는 Doris 빌드의 동작을 확인하세요. |
| 외래 키 | 제약 조건을 강제하지 않음; 메타데이터는 버전에 따라 다름 | `ALTER TABLE ... ADD CONSTRAINT`로 선언하고 `SHOW CONSTRAINTS`로 조회합니다. Doris 4.1.3은 `information_schema.KEY_COLUMN_USAGE`에 외래 키를 노출하지 않으며, dev는 여기에 선언된 제약 조건 메타데이터를 제공합니다. 탐색기에 표시되는지는 Doris 빌드에 따라 달라집니다. Doris는 외래 키 제약 조건을 강제하지 않으므로 애플리케이션에서 데이터가 제약 조건을 충족하도록 보장해야 합니다. |
| 실행 계획 | 정상 | 실행 계획 버튼은 Doris 자체의 Nereids 실행 계획을 반환합니다. `EXPLAIN FORMAT='json'`은 Doris에서 구문 분석 오류(`mismatched input '='`)를 일으키므로, LibreDB Studio는 이 엔진에 일반 `EXPLAIN`을 전송합니다. |
| 유지 관리 작업 | 부분 지원 | `Analyze`는 실행됩니다. `Optimize`와 `Check`는 Doris 문법에 없는 구문이므로 구문 분석 오류로 거부됩니다. |
| 데이터 적재 직후의 테이블 | 일시적으로 영으로 표시 | 2000행의 데이터 적재 직후에는 테이블이 0행, 0 B로 표시되었으며, Doris의 백그라운드 통계에 반영된 약 일 분 후에 실제 행 수가 나타났습니다. 이는 Doris 자체의 반영 지연이며, 연결이 오래되어 발생하는 현상이 아닙니다. |

LibreDB Studio 사용에 대한 자세한 내용은
[LibreDB Studio 저장소](https://github.com/libredb/libredb-studio)를 참조하세요.
