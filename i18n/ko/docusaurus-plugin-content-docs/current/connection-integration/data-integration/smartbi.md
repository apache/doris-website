---
{
    "title": "Smartbi",
    "language": "ko",
    "description": "Smartbi에서 Apache Doris 데이터 소스에 연결하고, 데이터 연결, 모델링, 시각적 분석을 수행하여 데이터 분석 보고서를 만드는 방법을 알아봅니다.",
    "keywords": [
        "Smartbi에서 Doris 연결",
        "Apache Doris Smartbi",
        "Doris 데이터 소스",
        "Smartbi 데이터 시각화"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: BI tool integration / Visual analysis -->

[Smartbi](https://www.smartbi.com.cn/)는 Oracle, SQL Server, MySQL, Apache Doris 등 다양한 데이터 소스에 연결하여 데이터 통합과 정제를 지원하는 소프트웨어 서비스 및 애플리케이션 커넥터 모음입니다.

이 문서에서는 Smartbi에서 Apache Doris 데이터 소스에 연결하는 방법과 Doris 데이터를 기반으로 모델링, 분석, 시각화를 수행하는 방법을 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 사용자 목표 | 결과 |
| --- | --- | --- |
| Doris 데이터 소스에 연결 | Smartbi에서 Doris 데이터 연결 생성 | Smartbi에서 Doris 데이터에 액세스 가능 |
| 분석 모델 구축 | Doris 데이터를 기반으로 관계형 모델을 생성하고, 데이터 분석 식을 작성하며, 데이터 간 관계 설정 | 고급 데이터 분석 및 시각화를 위한 기반 마련 |
| 시각화 보고서 작성 | Smartbi의 차트, 지리 지도, 대화형 대시보드, 사용자 지정 시각화 도구로 데이터 표현 | 데이터를 더욱 직관적이고 종합적으로 이해하고 표현 |

## Smartbi 기능 개요 {#smartbi-capabilities-overview}

| 기능 | 설명 |
| --- | --- |
| 데이터 소스 연결 | Oracle, SQL Server, MySQL, Apache Doris 등 다양한 데이터 소스 연결 지원 |
| 데이터 모델링 | 복잡한 관계형 모델 생성, 데이터 분석 식 작성, 데이터 간 관계 설정 지원 |
| 시각적 분석 | 차트, 지리 지도, 대화형 대시보드, 사용자 지정 시각화 도구 제공 |
| 데이터 표현 | 데이터를 더욱 직관적이고 종합적으로 이해하고 표현할 수 있도록 지원하여 데이터 분석의 효과와 효율 향상 |

## 사전 준비 {#prerequisites}

시작하기 전에 다음 사항을 준비했는지 확인하세요.

- Smartbi에 로그인할 수 있는 계정이 있어야 합니다.
- Apache Doris 데이터베이스의 연결 정보가 있어야 합니다.
- e-service 대시보드에서 설정할 보고서 정보를 정해 두어야 합니다.

## 절차 {#procedure}

| 단계 | 목표 | 설명 |
| --- | --- | --- |
| 1단계 | 데이터 연결 페이지 열기 | Smartbi에 로그인한 후 데이터 연결 메뉴 열기 |
| 2단계 | Doris 데이터베이스 선택 | 연결 가능한 데이터베이스 목록에서 Doris 선택 |
| 3단계 | 연결 정보 입력 | Doris 데이터베이스의 연결 정보 입력 |
| 4단계 | 연결 테스트 | 연결 정보가 올바른지 확인하고 연결 테스트 완료 |
| 5단계 | 보고서 구성 | 데이터 분석 모듈로 이동하여 e-service 대시보드에서 보고서 정보 설정 |

### 1단계: 데이터 연결 페이지 열기 {#step-1-open-the-data-connection-page}

Smartbi에 로그인한 후 데이터 연결을 클릭합니다.

![데이터 연결 페이지 열기](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-1.png)

### 2단계: Doris 데이터베이스 선택 {#step-2-select-the-doris-database}

데이터 연결 페이지에서 연결 가능한 데이터베이스 목록을 확인하고 Doris 데이터베이스를 선택합니다.

![Doris 데이터베이스 선택](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-2.png)

### 3단계: Doris 연결 정보 입력 {#step-3-fill-in-the-doris-connection-information}

Doris 데이터베이스를 선택한 후 Doris 데이터베이스의 연결 정보를 입력합니다.

![Doris 연결 정보 입력](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-3.png)

### 4단계: 연결 테스트 {#step-4-test-the-connection}

연결 정보가 올바르고 연결에 성공하면 페이지에 테스트를 통과했다는 메시지가 표시됩니다.

![연결 테스트 통과](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-4.png)

### 5단계: 데이터 분석 보고서 구성 {#step-5-configure-the-data-analysis-report}

연결에 성공하면 데이터 분석 모듈의 e-service 대시보드로 이동하여 필요에 맞게 보고서 정보를 설정합니다.

![데이터 분석 보고서 구성](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-5.png)

## 결과 {#result}

위 구성을 완료하면 Smartbi에서 생성된 Doris 데이터 연결을 통해 Doris 데이터에 액세스하고, 데이터 분석 모듈에서 필요한 보고서를 구성할 수 있습니다.
