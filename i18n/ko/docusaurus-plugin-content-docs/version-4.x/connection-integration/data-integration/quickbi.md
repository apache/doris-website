---
{
    "title": "Quick BI",
    "language": "ko",
    "description": "Quick BI에서 Apache Doris 데이터 소스에 연결하고, Doris 데이터셋을 만들고, 테이블, 차트, 지도 등의 구성 요소로 시각화 보고서를 작성하는 방법을 알아봅니다. BI 도구 통합 및 데이터 분석 시나리오에 적합합니다.",
    "keywords": [
        "Quick BI에서 Doris 연결",
        "Apache Doris Quick BI",
        "Doris 시각화 분석",
        "Quick BI 데이터 소스"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: BI tool integration / Visualization analysis -->

Quick BI는 데이터 웨어하우스를 기반으로 하는 비즈니스 인텔리전스 도구로, 기업이 시각화 분석 대시보드를 빠르게 구축할 수 있도록 지원합니다. Quick BI는 MySQL, Oracle, SQL Server, Apache Doris 등의 데이터베이스뿐 아니라 Excel, CSV, JSON 등의 파일 형식을 포함한 다양한 데이터 소스를 지원합니다. 테이블, 차트, 지도 등의 시각화 구성 요소를 제공하므로 사용자는 드래그 앤 드롭으로 데이터 시각화 분석을 수행할 수 있습니다.

이 문서에서는 Quick BI에서 Apache Doris 데이터 소스에 연결하고, 해당 Doris 데이터 소스를 기반으로 데이터셋을 만들어 이후 보고서 분석에 사용하는 방법을 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 사용자 목표 | 결과 |
| --- | --- | --- |
| Doris 데이터 소스 연결 | Quick BI 작업 공간에서 Apache Doris 데이터 소스 만들기 | Quick BI에서 Doris의 데이터에 접근 가능 |
| 분석 데이터셋 만들기 | 생성한 데이터 소스에서 Doris 테이블 선택 | 보고서 구성에 사용할 수 있는 데이터셋 생성 |
| 시각화 보고서 작성 | Quick BI 시각화 구성 요소로 Doris 데이터 분석 | 테이블, 차트, 지도 등의 구성 요소로 분석 결과 표시 |

## Quick BI 기능 개요 {#quick-bi-capability-overview}

| 기능 | 설명 |
| --- | --- |
| 데이터베이스 데이터 소스 | MySQL, Oracle, SQL Server, Apache Doris 등의 데이터베이스 지원 |
| 파일 데이터 소스 | Excel, CSV, JSON 등의 파일 형식 지원 |
| 시각화 구성 요소 | 테이블, 차트, 지도 등의 구성 요소 제공 |
| 분석 방식 | 드래그 앤 드롭을 통한 데이터 시각화 분석 지원 |

## 사전 요구 사항 {#prerequisites}

시작하기 전에 다음 사항을 확인하세요.

- Quick BI에 로그인한 상태이며 작업 공간을 만들 수 있어야 합니다.
- Apache Doris 연결 정보가 준비되어 있어야 합니다.
- 데이터셋 생성에 사용할 수 있는 데이터 테이블이 Doris에 있어야 합니다. 이 문서에서는 TPC-H 데이터셋을 예로 사용합니다.

## 절차 {#procedure}

| 단계 | 목표 | 설명 |
| --- | --- | --- |
| 1단계 | 작업 공간 만들기 | Quick BI에 로그인하고 데이터 소스와 데이터셋을 관리할 작업 공간 만들기 |
| 2단계 | Doris 데이터 소스 만들기 | 작업 공간에서 Apache Doris를 선택하고 Doris 연결 정보 입력 |
| 3단계 | 연결 결과 확인 | 연결에 성공하면 데이터 소스 목록에서 생성한 데이터 소스 확인 |
| 4단계 | 데이터셋 만들기 | Doris 데이터 소스를 기반으로 데이터셋을 만들어 이후 보고서 구성에 사용 |

### 1단계: Quick BI 작업 공간 만들기 {#step-1-create-a-quick-bi-workspace}

1. Quick BI에 로그인하고 작업 공간을 만듭니다.

2. 현재 작업 공간에서 데이터 소스 만들기를 클릭합니다.

    ![데이터 소스 만들기](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-1.png)

### 2단계: Doris 데이터 소스 만들기 {#step-2-create-a-doris-data-source}

데이터 소스 만들기 페이지에서 **Apache Doris**를 선택하고 해당 Doris 연결 정보를 입력합니다.

![Doris 연결 정보 입력](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-2.png)

### 3단계: 데이터 소스 연결 결과 확인 {#step-3-verify-the-data-source-connection-result}

연결에 성공하면 데이터 소스 목록에서 생성한 Doris 데이터 소스를 확인할 수 있습니다.

![데이터 소스 확인](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-3.png)

### 4단계: 데이터셋 만들기 및 보고서 구성 {#step-4-create-a-dataset-and-configure-a-report}

생성한 데이터 소스에서 데이터셋을 만듭니다. 이 문서에서는 TPC-H 데이터셋을 예로 사용합니다. 데이터셋을 만든 후 해당 보고서를 구성할 수 있습니다.

![Doris 데이터셋 만들기](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-4.png)

## 결과 {#result}

위 구성을 완료하면 Quick BI에서 생성한 Doris 데이터 소스를 통해 Doris 데이터에 접근하고 데이터셋을 기반으로 시각화 분석 보고서를 구성할 수 있습니다.
