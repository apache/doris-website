---
title: Superset
description: 데이터 시각화와 대시보드 구축을 위해 Apache Superset 3.1에서 Apache Doris를 데이터 소스로 구성하는 방법을 알아봅니다. 설치 및 구성, 연결 절차, 시각화 예제, 자주 발생하는 문제 해결 방법을 다룹니다.
keywords:
  - Apache Superset을 Doris에 연결
  - Superset 데이터 소스 구성
  - Doris 시각화
  - BI 도구 통합
  - SQLAlchemy Doris 연결
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenario: Data visualization configuration / BI tool integration -->

[Apache Superset](https://superset.apache.org/)은 다양한 데이터 소스 연결, 여러 시각화 방식, 세분화된 사용자 권한 제어를 지원하는 오픈 소스 데이터 탐색 플랫폼입니다. 주요 기능으로는 셀프서비스 분석, 사용자 지정 대시보드, 분석 결과의 시각화 내보내기, 사용자/역할 권한 제어, 내장 SQL 편집기가 있습니다.

**이 문서의 목표**: Apache Superset 3.1에서 Apache Doris 데이터 소스를 구성하여 데이터 쿼리와 시각화를 지원합니다.

<!-- Knowledge type: Version requirements -->
| 구성 요소 | 권장 버전 | 참고 사항 |
|------|----------|------|
| Apache Superset | 3.1 이상 | Apache Doris 연결을 공식적으로 지원 |
| Apache Doris | 2.0.4 이상 | 권장 |
| Python | 3.9 / 3.10 / 3.11 | 안정적인 버전 사용 |
| pydoris | 1.1.0 | Doris Python 클라이언트 |

---

## 사전 요구 사항 {#prerequisites}

구성을 시작하기 전에 다음 준비를 완료하세요.

1. Apache Superset 3.1 이상을 설치합니다.

    [Superset 공식 설치 가이드](https://superset.apache.org/docs/installation/installing-superset-from-pypi)를 참조하세요.

2. Apache Doris Python 클라이언트를 설치합니다.

    ```bash
    pip install pydoris
    ```

3. 설치를 확인합니다.

    ```bash
    pip list | grep pydoris
    # Expected output:
    # pydoris                       1.1.0
    ```

---

## 1단계: Doris 데이터 소스 구성 {#step-1-configure-the-doris-data-source}

환경을 준비한 후 다음 단계에 따라 Superset에 Doris 데이터 소스를 추가합니다.

### 1. SQLAlchemy 연결 문자열 확인 {#1-get-the-sqlalchemy-connection-string}

Doris는 다음 SQLAlchemy URI 형식을 사용합니다.

```
doris://<username>:<password>@<host>:<port>/<Catalog>.<database>
```

**매개변수 설명:**

| 매개변수 | 의미 | 예시 |
|------|------|------|
| username | Doris 연결 사용자 이름 | testuser |
| password | 사용자 비밀번호 | xxxxxx |
| host | 데이터베이스 호스트 | 127.0.1.28 |
| port | 쿼리 포트 | 9030 |
| Catalog | Doris Catalog. 내부 테이블에는 `internal`을 사용하고, 외부 테이블을 통해 데이터 레이크를 쿼리할 때는 해당 Catalog를 지정합니다. | internal |
| database | 데이터베이스 이름 | tpch |

### 2. Superset에 데이터 소스 추가 {#2-add-a-data-source-in-superset}

1. Superset 웹 인터페이스를 열고 오른쪽 상단의 **설정**을 클릭한 다음 **데이터베이스 커넥터**를 클릭합니다.

    ![데이터베이스 커넥터 열기](/images/next/connection-integration/superset/02-superset-connect.png)

2. **+ 데이터베이스 추가**를 클릭하고 **데이터베이스 연결** 대화 상자에서 **Apache Doris**를 선택합니다.

    ![Apache Doris 선택](/images/next/connection-integration/superset/03-superset-choose-db.png)

3. 연결 세부 정보에 SQLAlchemy URI를 입력합니다. 연결 테스트가 통과하면 **연결**을 클릭합니다.

    ![연결 세부 정보 입력](/images/next/connection-integration/superset/04-superset-choose-test-connect.png)

4. 추가가 완료되면 인터페이스에 데이터 소스가 표시됩니다.

    ![추가 완료](/images/next/connection-integration/superset/05-superset-after-connect.png)

---

## 2단계: 시각화 차트 만들기 {#step-2-build-a-visualization-chart}

데이터 소스를 구성하면 데이터 시각화를 시작할 수 있습니다.

이 문서에서는 TPC-H 데이터셋을 예로 들어 배송 방식별 주문 금액의 시간에 따른 추이를 분석하는 방법을 설명합니다.

> **사전 요구 사항**: TPC-H 데이터셋이 Apache Doris에 데이터 적재되어 있어야 합니다. [TPC-H 데이터 구축 가이드](../../lakehouse/best-practices/tpch.md)를 참조하세요.

### 1. 데이터셋 만들기 {#1-create-a-dataset}

1. 왼쪽 탐색 모음에서 **데이터셋**을 클릭한 다음 **+ 데이터셋 추가**를 클릭합니다.

    ![데이터셋 추가](/images/next/connection-integration/superset/06-superset-add-dataset.png)

2. 다음 옵션을 설정한 후 오른쪽 하단의 **데이터셋 생성 및 차트 만들기**를 클릭합니다.

    - **데이터베이스**: Doris
    - **스키마**: tpch
    - **테이블**: lineitem

    ![데이터 테이블 선택](/images/next/connection-integration/superset/07-superset-add-db.png)

### 2. 사용자 지정 메트릭 추가 {#2-add-a-custom-metric}

1. 데이터셋 편집 페이지에서 **메트릭**을 클릭한 다음 **항목 추가**를 클릭하여 계산된 메트릭을 추가합니다.

    - **메트릭 키**: Revenue
    - **SQL 표현식**: `SUM(l_extendedprice * (1 - l_discount))`

    ![메트릭 추가](/images/next/connection-integration/superset/09-superset-metrics.png)

### 3. 차트 만들기 {#3-create-a-chart}

1. **차트** 페이지로 이동하여 **+ 차트 추가**를 클릭하고 데이터셋으로 **lineitem**을, 차트 유형으로 **꺾은선형 차트**를 선택합니다.

    ![차트 유형 선택](/images/next/connection-integration/superset/10-superset-add-chart.png)

2. 차트 매개변수를 설정합니다.

    - **l_shipdate**를 X축으로 드래그하고 시간 단위를 설정합니다.
    - **Revenue** 메트릭을 **메트릭** 영역으로 드래그합니다.
    - **l_shipmode** 열을 **차원** 영역으로 드래그합니다.

    ![차트 설정](/images/next/connection-integration/superset/11-superset-edit-chart.png)

3. **차트 업데이트**를 클릭하여 차트를 미리 봅니다. 확인이 끝나면 **저장**을 클릭하여 대시보드를 저장합니다.

    ![대시보드 저장](/images/next/connection-integration/superset/12-superset-edit-save-chart.png)

---

## 자주 묻는 질문과 팁 {#faq-and-tips}

<!-- Knowledge type: Troubleshooting / Best practices -->

### 사전 요구 사항 {#prerequisites-1}

- Superset 환경에 `pydoris`를 미리 설치해야 합니다. 설치하지 않으면 데이터베이스를 만들 때 Apache Doris 옵션을 선택할 수 없습니다.

### 성능 튜닝 {#performance-tuning}

| 최적화 항목 | 설명 |
|--------|------|
| 테이블 스키마 설계 | 실제 요구 사항에 맞게 Doris 데이터베이스와 테이블을 설계하고, 시간을 기준으로 파티셔닝과 버킷팅을 적용합니다. |
| 조건자 푸시다운 | 조건자 필터링과 전송되는 데이터양을 효과적으로 줄입니다. |
| 네트워크 보안 | VPC 사설 연결을 사용하여 공용 네트워크 접근에 따른 보안 위험을 방지합니다. |
| 권한 제어 | Doris 사용자 계정의 역할과 접근 권한을 세분화하고, 과도한 권한을 부여하지 않습니다. |

### 문제 해결 {#troubleshooting}

**질문: 데이터베이스를 추가할 때 Apache Doris가 옵션으로 표시되지 않습니다.**

답변: 새 환경에 `pydoris`가 설치되어 있는지 확인하세요. Superset은 실행 중에 Doris 드라이버를 감지해야 이 옵션을 표시합니다. 설치 후 Superset 서비스를 다시 시작해야 할 수 있습니다.

**질문: 연결 테스트가 실패합니다.**

답변: SQLAlchemy URI 형식이 올바른지 확인하고, Host와 Port에 접근할 수 있으며 사용자 이름과 비밀번호로 연결할 수 있는지 확인하세요. Doris BE 또는 MySQL Client를 사용하여 먼저 연결을 확인할 수 있습니다.
