---
{
    "title": "성능 튜닝 개요",
    "language": "ko",
    "description": "Apache Doris 쿼리가 느릴 때는 어떻게 해야 할까요? 이 문서에서는 성능 튜닝의 전반적인 작업 흐름과 방법론, 도구 체계를 소개하여 느린 SQL을 빠르게 찾아내고 병목을 분석한 뒤 최적화를 적용할 수 있도록 돕습니다.",
    "keywords": ["Doris 성능 튜닝", "느린 쿼리", "느린 SQL 진단", "성능 병목 분석", "튜닝 방법론"]
}
---

<!-- Knowledge type: Concept + Process -->
<!-- Applicable scenario: First exposure to Doris performance tuning, need to build an overall understanding -->

쿼리 성능 튜닝은 데이터베이스 시스템의 여러 계층과 측면을 평가하고 최적화해야 하는 체계적인 작업입니다. 이 문서에서는 실무자의 관점에서 Apache Doris 성능 튜닝의 전반적인 작업 흐름과 방법론, 도구 체계를 소개합니다.

## 준비 체크리스트: 튜닝 시작 전 확인 사항 {#opening-checklist-confirm-before-you-start-tuning}

<!-- Knowledge type: Pre-check -->
<!-- Applicable scenario: Preparation before tuning work begins -->

구체적인 튜닝 작업에 들어가기 전에 다음 사항을 준비하고 확인하세요.

- 업무 시스템의 하드웨어 구성(CPU, 메모리, 디스크, 네트워크)을 이해하고 있습니다.
- Doris 클러스터의 규모(FE/BE 노드 수)를 확인했습니다.
- Doris 소프트웨어 버전과 해당 버전에서 지원하는 기능을 확인했습니다.
- "업무 처리 지연"과 "SQL 실행 지연"을 구분하고, 문제가 있는 SQL을 구체적으로 식별할 수 있습니다.
- 사용할 수 있는 진단 및 분석 도구에 익숙합니다.

## 1. 성능 튜닝 방법론 {#1-performance-tuning-methodology}

<!-- Knowledge type: Methodology -->
<!-- Applicable scenario: Build an overall understanding of tuning -->

성능 튜닝을 한 문장으로 정리하면 다음과 같습니다. **먼저 시스템을 이해하고, 느린 SQL을 찾은 다음, 도구로 병목을 파악하고, 마지막으로 최적화를 적용합니다.**

### 1.1 네 단계 튜닝 방법 {#11-the-four-step-tuning-method}

다음 테이블은 성능 튜닝의 핵심 작업 흐름을 요약한 것입니다.

| 단계 | 목표                          | 주요 작업                                                                 |
| ---- | ----------------------------- | --------------------------------------------------------------------------- |
| 1    | 시스템 이해                   | 하드웨어, 클러스터 규모, Doris 버전 및 버전별 기능 파악 |
| 2    | 문제가 있는 SQL 식별           | 진단 도구를 사용하여 느린 SQL을 효율적이고 신속하게 식별           |
| 3    | 성능 병목 분석                 | Doris 내장 도구와 일반 운영체제 도구를 사용하여 런타임 정보 수집 |
| 4    | 튜닝 적용                      | 병목 분석을 바탕으로 매개변수를 조정하고 SQL을 재작성하며, 인덱스 및 구체화된 뷰와 같은 최적화 적용 |

### 1.2 단계별 설명 {#12-description-of-each-step}

-   **1단계: 시스템 이해.** 업무 사용자와 DBA는 문제 분석의 방향이 빗나가지 않도록 사용 중인 데이터베이스 시스템을 전반적으로 이해해야 합니다.
-   **2단계: 느린 SQL 식별.** 성능 문제를 찾으려면 유용한 성능 진단 도구가 필요합니다. 문제가 있는 SQL을 신속하게 식별해야 후속 작업이 의미를 갖습니다.
-   **3단계: 병목 분석.** Doris 전용 도구(예: Profile, Explain)와 일반 운영체제 도구(예: top, iostat)를 함께 사용하여 병목이 어디에 있는지 파악합니다.
-   **4단계: 최적화 적용.** 상세한 런타임 정보와 보완 분석을 바탕으로 문제에 맞게 설정을 조정하거나 SQL을 재작성합니다.

## 2. Doris가 제공하는 튜닝 도구 {#2-the-tuning-toolset-provided-by-doris}

<!-- Knowledge type: Tool index -->
<!-- Applicable scenario: Choose the appropriate tool for tuning -->

Apache Doris는 튜닝 작업 흐름의 각 계층에 맞는 도구를 제공합니다. 다음 테이블은 상황별로 사용할 수 있는 도구를 정리한 것입니다.

| 도구 범주                           | 해결하는 문제                          | 관련 문서                     |
| --------------------------------------- | ------------------------------------------ | --------------------------------------- |
| 진단 도구                        | 느린 SQL과 문제가 있는 SQL을 신속하게 식별 | [진단 도구](./diagnostic-tools)  |
| 분석 도구                          | SQL 실행 세부 정보와 병목 분석 | [분석 도구](./analysis-tools)    |
| 튜닝 절차                          | 전체 과정을 다루는 튜닝 실무 가이드 | [튜닝 절차](./tuning-process)      |

## 3. 자주 묻는 질문과 흔한 오해 {#3-faq-and-common-misconceptions}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Common questions during tuning -->

**Q1: 성능 튜닝은 반드시 SQL 재작성부터 시작해야 하나요?**

반드시 그런 것은 아닙니다. 튜닝은 "시스템 이해 + 느린 SQL 식별"부터 시작해야 합니다. 이 두 단계를 건너뛰고 곧바로 SQL을 재작성하면 실제 병목을 놓치는 경우가 많습니다.

**Q2: Doris 내장 도구만으로 충분한가요?**

아닙니다. 일반 운영체제 도구(예: top, iostat, vmstat)는 CPU, IO, 메모리의 리소스 병목을 식별하는 데 도움이 되는 보조 도구로 활용됩니다.

**Q3: 튜닝은 DBA만의 업무인가요?**

아닙니다. 성능 튜닝에는 업무 사용자, DBA, 나아가 개발자의 협업이 필요합니다. 업무 사용자는 SQL의 의미를 이해하고, DBA는 클러스터와 데이터베이스의 특성을 이해합니다.

## 4. 다음 단계 {#4-next-steps}

-   느린 SQL 찾기: [진단 도구](./diagnostic-tools) 참조
-   실행 세부 정보 분석: [분석 도구](./analysis-tools) 참조
-   전체 과정 실습: [튜닝 절차](./tuning-process) 참조
