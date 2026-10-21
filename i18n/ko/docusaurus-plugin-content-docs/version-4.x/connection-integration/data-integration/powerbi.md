---
{
    "title": "Power BI",
    "language": "ko",
    "description": "Power BI Desktop에서 Apache Doris에 연결하고, DirectQuery 또는 Import 모드를 구성하며, Doris 데이터를 기반으로 시각화 대시보드를 만드는 방법을 알아봅니다.",
    "keywords": [
        "Power BI Doris 연결",
        "Apache Doris Power BI",
        "Doris Power BI 커넥터",
        "Power BI DirectQuery Doris",
        "Power BI Import Doris"
    ]
}
---

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenario: Use Power BI Desktop to connect to Apache Doris and build visualization dashboards -->

Microsoft Power BI는 Apache Doris의 데이터를 쿼리할 수 있으며, 데이터를 메모리에 적재할 수도 있습니다. Power BI Desktop을 사용하면 Apache Doris 데이터 소스에 연결하여 보고서, 대시보드, 시각적 분석을 만들 수 있습니다.

이 문서에서는 사용자 작업 흐름에 따라 다음 작업을 수행하는 방법을 설명합니다.

| 사용 사례 | 사용자 목표 | 주요 작업 |
|----------|-----------|-----------------|
| 연결 환경 준비 | Power BI Desktop에서 Doris에 연결할 수 있도록 준비 | MySQL ODBC 드라이버와 Doris Power BI 커넥터 설치 |
| Doris 데이터 소스에 연결 | Power BI Desktop에서 Apache Doris 인스턴스에 접근 | Doris 데이터 소스, 데이터베이스, 인증 정보, 데이터 연결 모드 입력 |
| 쿼리 모드 선택 | 데이터 양과 분석 방식에 맞는 연결 모드 선택 | DirectQuery로 Doris를 직접 쿼리하거나 Import로 소량의 데이터를 Power BI에 적재 |
| 시각화 대시보드 만들기 | Doris의 TPC-H 데이터를 기반으로 분석 보고서 작성 | 테이블 관계를 만들고, 필드를 끌어다 놓아 대시보드를 생성하고 저장 |

## 연결 환경 준비 {#prepare-the-connection-environment}

<!-- Knowledge type: Pre-deployment check -->
<!-- Applicable scenario: Install Power BI Desktop and prepare Doris connection information -->

### Power BI Desktop 설치 {#install-power-bi-desktop}

이 문서는 Windows 컴퓨터에 Microsoft Power BI Desktop이 이미 설치되어 있다고 가정합니다. 아직 설치하지 않았다면 [Power BI Desktop 다운로드 페이지](https://www.microsoft.com/en-us/download/details.aspx?id=58494)에서 다운로드하여 설치할 수 있습니다.

Power BI Desktop을 최신 버전으로 업데이트하는 것을 권장합니다.

### Doris 연결 정보 준비 {#prepare-doris-connection-information}

Apache Doris에 연결하기 전에 다음 정보를 준비합니다.

| 매개변수 | 의미 | 예시 |
|-----------|---------|---------|
| **Doris 데이터 소스** | `host:port` 형식의 데이터베이스 연결 문자열 | `127.0.1.28:9030` |
| **데이터베이스** | 데이터베이스 이름 | `test_db` |
| **데이터 연결 모드** | `Import`와 `DirectQuery`를 포함하는 데이터 연결 모드 | `DirectQuery` |
| **SQL 문** | 데이터베이스를 반드시 포함해야 하는 SQL 문으로, `Import` 모드에서만 사용 가능 | `select * from database.table` |
| **사용자 이름** | 사용자 이름 | `admin` |
| **비밀번호** | 비밀번호 | `xxxxxx` |

## MySQL ODBC 드라이버 설치 {#install-the-mysql-odbc-driver}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Allow Power BI Desktop to connect to Doris through the MySQL ODBC driver -->

Power BI Desktop에서 Doris에 연결하려면 먼저 MySQL ODBC 드라이버를 설치해야 합니다.

### 드라이버 설치 {#install-the-driver}

1. [MySQL ODBC](https://downloads.mysql.com/archives/c-odbc/)를 다운로드하여 설치합니다.

2. 5.3 버전을 선택하고 설정합니다.

3. 다운로드한 `.msi` 설치 프로그램을 실행하고 설치 마법사의 안내에 따라 설치를 완료합니다.

![](/images/next/connection-integration/data-integration/powerbi/WYRLb9JmcoEHeuxr41Ec8yMQnff.png)

![](/images/next/connection-integration/data-integration/powerbi/LYh9bi780o3DaCxwF3BcuPrknlh.png)

![](/images/next/connection-integration/data-integration/powerbi/E1i7buBzHoquRCxT6VAc1FjCnNf.png)

설치가 완료되면 다음 화면이 표시됩니다.

![](/images/next/connection-integration/data-integration/powerbi/PURIbSCFhoara3xodBBc5xaNnjc.png)

### 드라이버 확인 {#verify-the-driver}

드라이버를 설치한 후 다음과 같이 설치 결과를 확인할 수 있습니다.

1. Windows 시작 메뉴에서 `ODBC`를 입력하고 **ODBC 데이터 원본(64비트)**을 선택합니다.

![](/images/next/connection-integration/data-integration/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

2. 드라이버 목록에 MySQL 드라이버가 표시되는지 확인합니다.

![](/images/next/connection-integration/data-integration/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

## Doris Power BI 커넥터 설치 {#install-the-doris-power-bi-connector}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Load the Doris custom connector in Power BI Desktop -->

현재 Power BI 사용자 지정 커넥터 인증 접수가 중단되어 있어 Doris에서 제공하는 사용자 지정 커넥터는 인증되지 않은 커넥터입니다. 인증되지 않은 커넥터를 사용하려면 [Power BI 사용자 지정 커넥터 구성 문서](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors)를 참고하여 다음 설정을 완료합니다.

### 커넥터 파일 배치 {#place-the-connector-file}

1. `power_bi_path`를 Windows 운영 체제의 Power BI Desktop 설치 디렉터리라고 가정합니다. 일반적으로 기본 경로는 다음과 같습니다.

    ```text
    power_bi_path = C:\Program Files\Power BI Desktop
    ```

2. [Doris.mez](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/PowerBI/latest/Doris.mez) 사용자 지정 커넥터 파일을 `%power_bi_path%\Custom Connectors folder` 경로에 넣습니다.

3. 위 경로가 없으면 필요에 따라 직접 생성합니다.

### 인증되지 않은 커넥터 로드 허용 {#allow-loading-uncertified-connectors}

1. Power BI Desktop에서 **파일**을 선택합니다.

![](/images/next/connection-integration/data-integration/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

2. **옵션 및 설정** > **옵션**을 선택합니다.

![](/images/next/connection-integration/data-integration/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

3. **옵션** 화면에서 **전역** > **보안**을 선택합니다. **데이터 확장**에서 **(권장하지 않음) 유효성 검사 또는 경고 없이 모든 확장 로드 허용**을 선택하여 인증되지 않은 커넥터에 대한 제한을 해제합니다.

![](/images/next/connection-integration/data-integration/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

4. **확인**을 선택한 다음 Power BI Desktop을 다시 시작합니다.

## Power BI Desktop에서 Doris에 연결 {#connect-to-doris-in-power-bi-desktop}

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenario: Select the Doris connector in Power BI Desktop and fill in connection information -->

드라이버와 커넥터를 설치하면 Power BI Desktop에서 Doris 커넥터를 찾아 Doris 데이터 소스를 생성할 수 있습니다.

### Doris 커넥터 찾기 {#find-the-doris-connector}

1. Power BI Desktop을 실행합니다.

2. Power BI Desktop 시작 화면에서 **새 보고서**를 클릭합니다. 로컬에 보고서가 이미 있다면 기존 보고서를 열 수도 있습니다.

![](/images/next/connection-integration/data-integration/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

3. **데이터 가져오기**를 클릭하고 팝업 창에서 Doris 데이터베이스를 선택합니다.

![](/images/next/connection-integration/data-integration/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### 연결 정보 입력 {#fill-in-connection-information}

Doris 커넥터를 선택한 후 Doris 인스턴스의 접속 정보를 입력합니다.

| 매개변수 | 필수 여부 | 설명 |
|-----------|----------|-------------|
| **Doris 데이터 소스** | 필수 | Doris 인스턴스의 도메인 이름, 주소 또는 `host:port` |
| **데이터베이스** | 필수 | Doris 데이터베이스 이름 |
| **SQL 문** | 선택 | 미리 실행할 SQL 문으로, `Import` 모드에서만 사용 가능 |
| **데이터 연결 모드** | 필수 | `DirectQuery` 또는 `Import` 선택 |

![](/images/next/connection-integration/data-integration/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

연결 모드 선택 시 권장 사항은 다음과 같습니다.

| 모드 | 적용 시나리오 | 설명 |
|------|---------------------|-------------|
| **DirectQuery** | Doris를 직접 쿼리할 때 권장 | Power BI가 전체 데이터 세트를 적재하지 않고 Doris에 직접 쿼리를 전송 |
| **Import** | 데이터 양이 적은 경우에 적합 | 전체 데이터 세트를 Power BI에 적재 |

:::note

Doris를 직접 쿼리하려면 `DirectQuery`를 선택하는 것을 권장합니다. 소량의 데이터만 사용하는 경우에는 `Import` 모드를 선택할 수 있습니다.

:::

### 사용자 이름과 비밀번호 입력 {#enter-user-name-and-password}

Doris 사용자 이름과 비밀번호를 지정합니다.

![](/images/next/connection-integration/data-integration/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### 테이블 스키마 적재 및 데이터 미리 보기 {#load-the-table-schema-and-preview-data}

탐색기 보기에서 데이터베이스와 테이블을 확인할 수 있습니다. 원하는 테이블을 선택하고 **데이터 적재**를 클릭하여 Apache Doris에서 테이블 스키마를 적재하고 데이터를 미리 봅니다.

![](/images/next/connection-integration/data-integration/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

가져오기가 완료되면 Power BI에서 Doris 데이터에 정상적으로 접근할 수 있습니다. 이제 필요한 통계 대시보드를 구성할 수 있습니다.

![](/images/next/connection-integration/data-integration/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

## Power BI에서 시각화 대시보드 만들기 {#build-a-visualization-dashboard-in-power-bi}

<!-- Knowledge type: Operation example -->
<!-- Applicable scenario: Use Doris TPC-H data to create an order revenue statistics dashboard in Power BI -->

이 예제에서는 TPC-H 데이터를 데이터 소스로 사용합니다. Doris TPC-H 데이터 소스를 구축하는 방법은 [Doris TPC-H 벤치마크 문서](../../lakehouse/best-practices/tpch.md)를 참고하세요.

지역별 주문 매출을 집계해야 한다고 가정해 보겠습니다. 다음 절차에 따라 대시보드를 만들 수 있습니다.

### 테이블 모델 관계 생성 {#create-table-model-relationships}

1. **모델 보기**를 클릭하여 테이블 모델 관계 설정 화면으로 이동합니다.

![](/images/next/connection-integration/data-integration/powerbi/V7PsbP3oKoJpLjxK5HdcPsnLnKf.png)

2. 필요에 따라 `customer`, `nation`, `orders`, `region`의 네 테이블을 같은 화면으로 끌어다 놓은 다음, 관련 필드를 끌어서 연결합니다.

![](/images/next/connection-integration/data-integration/powerbi/FZL5b2kJcoifIaxI7Eocpak7nvf.png)

![](/images/next/connection-integration/data-integration/powerbi/UxL2b1OV2or1LhxZjHsc0JG7ntb.png)

네 테이블 간의 관계는 다음과 같습니다.

| 원본 테이블 | 원본 필드 | 대상 테이블 | 대상 필드 |
|--------------|--------------|--------------|--------------|
| `customer` | `c_nationkey` | `nation` | `n_nationkey` |
| `customer` | `c_custkey` | `orders` | `o_custkey` |
| `nation` | `n_regionkey` | `region` | `r_regionkey` |

3. 관계 설정이 완료되면 다음과 같은 결과가 표시됩니다.

![](/images/next/connection-integration/data-integration/powerbi/LomhbQTPPoZr58xp8f3cxcTen8d.png)

### 주문 매출 대시보드 구성 {#configure-the-order-revenue-dashboard}

1. **보고서 보기** 작업 영역으로 돌아가 대시보드 만들기를 시작합니다.

2. `o_totalprice` 필드를 `orders` 테이블에서 대시보드로 끌어다 놓습니다.

![](/images/next/connection-integration/data-integration/powerbi/MB34bks6woK3mDx0eVccivKEngc.png)

3. `r_name` 필드를 `region` 테이블에서 X 열로 끌어다 놓습니다.

![](/images/next/connection-integration/data-integration/powerbi/JxpJbihDHoHGwixjWQScNyxvn4e.png)

4. 이제 대시보드에 원하는 내용이 표시됩니다.

![](/images/next/connection-integration/data-integration/powerbi/CfGWb6oaYoj4LyxpPIGcz3Binzb.png)

5. 작업 영역 왼쪽 위의 저장 버튼을 클릭하여 생성한 통계 대시보드를 로컬에 저장합니다.

![](/images/next/connection-integration/data-integration/powerbi/WozGbmqAOoP2mqxq2NmcJRFyntc.png)

이제 Power BI를 Apache Doris에 연결하고 데이터 분석과 시각화 대시보드 생성을 완료했습니다.
