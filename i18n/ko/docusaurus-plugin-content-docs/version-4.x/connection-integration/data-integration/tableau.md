---
{
    "title": "Tableau",
    "language": "ko",
    "description": "Tableau의 공식 MySQL 커넥터와 MySQL JDBC Driver를 통해 Apache Doris에 연결하여 데이터 소스 통합, 시각적 분석 및 대시보드 개발을 수행할 수 있습니다.",
    "keywords": [
        "Tableau",
        "Apache Doris",
        "BI",
        "데이터 시각화",
        "MySQL JDBC",
        "데이터 소스 통합"
    ],
    "sidebar_label": "Tableau"
}
---

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenario: Connect to Apache Doris in Tableau for data visualization and dashboard development -->

# Tableau {#tableau}

[Tableau](https://www.tableau.com/)는 널리 사용되는 비즈니스 인텔리전스(BI) 및 데이터 시각화 도구입니다. Apache Doris는 MySQL 프로토콜과 호환되므로 별도의 플러그인 없이 Tableau의 공식 **MySQL 커넥터**(MySQL JDBC Driver 기반)를 통해 직접 연결할 수 있습니다.

이 문서는 다음과 같은 일반적인 시나리오를 다룹니다.

- 기존 Apache Doris 클러스터를 사용하여 Tableau에서 데이터를 탐색하고 보고서를 개발하려는 경우
- Doris의 상세 데이터나 집계 결과를 Tableau 통합 문서의 데이터 소스로 사용해야 하는 경우
- Doris의 분석 결과를 Tableau 대시보드를 통해 게시하려는 경우

이 문서의 단계를 완료하면 다음 작업을 수행할 수 있습니다.

1. 로컬 환경에 Tableau Desktop과 MySQL JDBC 드라이버를 설치하고 구성합니다.
2. Tableau에서 Apache Doris로 연결되는 데이터 소스 연결을 생성합니다.
3. Doris 데이터 소스를 기반으로 Tableau에서 시각적 차트와 대시보드를 만듭니다.

## 사전 요구 사항 {#prerequisites}

시작하기 전에 다음 요구 사항이 충족되었는지 확인합니다.

| 항목              | 요구 사항                                                              |
| ----------------- | ----------------------------------------------------------------- |
| Apache Doris 클러스터 | 접근 가능하며 FE MySQL 프로토콜 포트(기본값 `9030`)가 열려 있어야 함                |
| 데이터베이스 계정        | 대상 데이터베이스에 대한 읽기 권한이 있어야 함                                          |
| Tableau Desktop   | 최신 버전 설치 필요([다운로드 페이지](https://www.tableau.com/products/desktop/download)) |
| MySQL JDBC Driver | 버전 8.3.0([다운로드 링크](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)) |

## 1단계: Tableau 및 JDBC 드라이버 설치 {#step-1-install-tableau-and-the-jdbc-driver}

1. [Tableau Desktop](https://www.tableau.com/products/desktop/download)을 다운로드하여 설치합니다.
2. [MySQL JDBC Driver 8.3.0](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)을 다운로드합니다.
3. JDBC 드라이버 jar 파일을 Tableau에서 지정한 디렉터리에 넣습니다.

    | 운영 체제 | 드라이버 경로                                                                  |
    | -------- | ----------------------------------------------------------------------------- |
    | macOS    | `~/Library/Tableau/Drivers`                                                   |
    | Windows  | `%tableau_path%\Drivers\` (기본값 `tableau_path = C:\Program Files\Tableau`) |

4. 드라이버가 적용되도록 Tableau Desktop을 다시 시작합니다.

## 2단계: Tableau에서 Apache Doris 데이터 소스 구성 {#step-2-configure-the-apache-doris-data-source-in-tableau}

드라이버를 설치한 후 Tableau에서 Doris에 연결하는 데이터 소스를 생성할 수 있습니다(이 예제에서는 `tpch` 데이터베이스 사용).

### 1. 연결 정보 준비 {#1-prepare-connection-information}

JDBC를 통해 Apache Doris에 연결하는 데 필요한 매개변수는 다음과 같습니다.

| 매개변수               | 설명                              | 예시                              |
| ------------------ | --------------------------------- | --------------------------------- |
| 서버             | Doris FE의 호스트 주소               | `127.0.0.1`                       |
| 포트               | Doris FE의 MySQL 프로토콜 포트        | `9030`                            |
| 데이터베이스           | 데이터베이스 이름                          | `tpch`                            |
| 사용자 이름           | 사용자 이름                            | `testuser`                        |
| 비밀번호           | 비밀번호                              | (계정에 맞게 입력)                   |
| 초기 SQL 문 | 연결이 설정된 후 자동으로 실행되는 초기화 SQL    | `select * from database.table`    |

### 2. 연결 생성 {#2-create-the-connection}

1. Tableau Desktop을 실행합니다. 이미 실행 중이라면 드라이버를 불러오도록 다시 시작합니다.
2. 왼쪽 메뉴의 **서버에 연결**에서 **자세히**를 클릭한 다음, 커넥터 목록에서 **MySQL**을 검색합니다.

    ![MySQL 커넥터 검색](/images/next/connection-integration/data-integration/tableau/QSrsbadm0oEiuHxyGv3clFhTnLh.png)

3. **MySQL**을 클릭하여 연결 구성 대화 상자를 엽니다.

    ![MySQL 연결 구성 대화 상자](/images/next/connection-integration/data-integration/tableau/DN47bCp5ZovHCmxH0DAc3fBonR3.png)

4. 대화 상자의 안내에 따라 이전 단계에서 준비한 연결 정보를 입력합니다.
5. **로그인**을 클릭합니다. 연결에 성공하면 새 Tableau 통합 문서가 열립니다.

    ![Tableau 통합 문서](/images/next/connection-integration/data-integration/tableau/LJK9bPMptoAGjGxzoCtcY8Agnye.png)

## 3단계: Tableau에서 시각화 만들기 {#step-3-build-visualizations-in-tableau}

다음 예제에서는 TPC-H 데이터 세트를 사용하여 Doris 데이터 소스를 기반으로 시각화를 만드는 방법을 보여 줍니다. TPC-H 데이터 구축 방법은 [TPC-H 벤치마크 문서](../../lakehouse/best-practices/tpch.md)를 참조하세요.

### 1. 데이터 테이블 조인 {#1-join-the-data-tables}

1. `customer` 및 `orders` 테이블을 통합 문서로 끌어 놓고, 아래 패널에서 조인 필드를 `Custkey`로 설정합니다.

    ![customer와 orders 조인](/images/next/connection-integration/data-integration/tableau/ZJuBbDBc5o2Gnyxhn7icv30xnXw.png)

2. `nation` 테이블을 통합 문서로 끌어 놓고, `customer`와의 조인 필드를 `Nationkey`로 설정합니다.

    ![nation과 customer 조인](/images/next/connection-integration/data-integration/tableau/GPXQbcNUnobHtLx5sIocMHAwn2d.png)

3. 세 테이블을 조인하면 분석에 사용할 데이터 소스가 준비됩니다. 통합 문서 하단의 `Sheet 1` 탭을 클릭하여 워크시트로 이동합니다.

    ![워크시트로 이동](/images/next/connection-integration/data-integration/tableau/FsHmbUOKIoFT5YxWmGecLArLnjd.png)

### 2. 시나리오 A: 연도별 고객 수 요약(꺾은선형 차트) {#2-scenario-a-annual-customer-count-summary-line-chart}

`OrderDate`(`orders`의 필드)를 `Columns`로 끌어 놓고, `customer(count)`(`customer`의 필드)를 `Rows`로 끌어 놓습니다. 그러면 Tableau가 꺾은선형 차트를 생성합니다.

![연도별 고객 수 꺾은선형 차트](/images/next/connection-integration/data-integration/tableau/I9SCbCFzoo7TgLx6BP1cHdtRnWc.png)

:::note
TPC-H 데이터 세트는 기본 규칙에 따라 스크립트로 생성되며, 실제 비즈니스 데이터가 아닙니다. 결과는 기능 시연과 연결 검증만을 위한 것입니다.
:::

### 3. 시나리오 B: 지역 및 연도별 평균 주문 금액 {#3-scenario-b-average-order-amount-by-region-and-year}

1. `New Worksheet`를 클릭하여 새 시트를 만듭니다.
2. `Name`(`nation`의 필드)을 `Rows`로 끌어 놓습니다.
3. `OrderDate`(`orders`의 필드)를 `Columns`로 끌어 놓습니다.

    이 시점에는 집계할 측정값을 지정하지 않았으므로 테이블에 `Abc` 자리 표시자 값이 표시됩니다.

4. `Totalprice`(`orders`의 필드)를 테이블 중앙으로 끌어 놓습니다. 기본 집계 방식은 `SUM`입니다.

    ![기본 SUM 집계](/images/next/connection-integration/data-integration/tableau/Am9IbyUo4o30DixVi2ccoZvKn8b.png)

5. `SUM`을 클릭하고 `Measure`를 `Average`로 변경합니다.

    ![평균으로 변경](/images/next/connection-integration/data-integration/tableau/AaFwbMOKTo86NaxU54mcVYs1nJd.png)

6. 같은 드롭다운 메뉴에서 `Format`을 선택한 다음, `Numbers`를 `Currency (Standard)`로 설정합니다.

    ![통화 형식으로 지정](/images/next/connection-integration/data-integration/tableau/ZmRDbjws9o5Ampx4YZYcS6Umnqf.png)

7. 최종 보고서는 예상 출력과 일치합니다.

    ![최종 보고서](/images/next/connection-integration/data-integration/tableau/MNb0bjoB2ozn4kxfKx9cVj2hnhb.png)

이제 Tableau를 Apache Doris에 연결하고 데이터 분석 및 시각화 대시보드를 성공적으로 구축했습니다.

## 모범 사례 {#best-practices}

### 성능 최적화 {#performance-optimization}

- **테이블 스키마를 신중하게 설계**: 쿼리 패턴에 맞춰 Doris 테이블의 파티셔닝과 버케팅을 설계하여 스캔하는 데이터양과 데이터 전송 비용을 줄입니다.
- **구체화된 뷰 사용**: 자주 실행되는 집계 쿼리의 경우 Doris에 구체화된 뷰를 생성하여 집계를 미리 계산하고 Tableau 대시보드의 응답 속도를 높입니다.
- **적절한 새로 고침 일정 설정**: 새로 고침 빈도와 컴퓨팅 리소스 사용량의 균형을 맞춰 클러스터 부하를 제어하면서 대시보드를 최신 상태로 유지합니다.

### 보안 구성 {#security-configuration}

- **네트워크 격리**: 공용 네트워크를 통해 Doris에 직접 접근하는 대신 VPC의 프라이빗 연결을 사용합니다.
- **접근 제어**: 보안 그룹을 통해 Doris 포트에 접근할 수 있는 출발지를 제한합니다.
- **전송 암호화**: SSL/TLS 암호화 연결을 활성화합니다.
- **최소 권한 원칙**: Doris 사용자 역할과 권한을 세밀하게 설정하여 과도한 권한 부여를 방지합니다.
