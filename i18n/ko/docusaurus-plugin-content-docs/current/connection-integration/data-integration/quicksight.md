---
{
    "title": "QuickSight",
    "language": "ko",
    "description": "Amazon QuickSight에서 MySQL 데이터 소스를 통해 Apache Doris에 연결하고, 직접 쿼리 방식의 데이터 세트를 구성한 후, TPC-H 데이터를 기반으로 시각화 대시보드를 만듭니다.",
    "keywords": [
        "QuickSight에서 Doris 연결",
        "Amazon QuickSight Apache Doris",
        "Doris 시각화 분석",
        "QuickSight 직접 쿼리"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: BI tool integration / Visualization analysis -->

QuickSight는 공식 MySQL 데이터 소스를 통해 Apache Doris에 연결할 수 있으며, **직접 쿼리** 모드와 **가져오기** 모드를 모두 지원합니다. 이 문서는 QuickSight에서 Doris 데이터를 분석하려는 사용자를 대상으로 합니다. 연결 준비, 데이터 세트 생성, TPC-H 데이터를 기반으로 여러 테이블을 연계한 시각화 대시보드를 만드는 과정을 설명합니다.

## 활용 시나리오 {#applicable-scenarios}

| 사용 사례 | 사용자 목표 | 결과 |
| --- | --- | --- |
| Doris 데이터 소스 연결 | QuickSight에서 공식 MySQL 데이터 소스를 통해 Apache Doris에 연결 | QuickSight에서 Doris 클러스터의 데이터에 접근할 수 있음 |
| 분석용 데이터 세트 생성 | Doris 테이블을 기반으로 QuickSight 데이터 세트 생성 | 이후 분석 및 시각화에 데이터 세트를 사용할 수 있음 |
| 여러 테이블을 연계한 대시보드 구성 | TPC-H의 `customer`, `nation`, `orders` 테이블을 연계하여 분석 | 국가별 및 주문 상태별 주문 건수를 집계하는 대시보드 생성 |

## 작업 흐름 {#workflow}

| 단계 | 목표 | 설명 |
| --- | --- | --- |
| 1단계 | 연결 준비 완료 | Doris 버전, 네트워크 연결, MySQL 호환 버전 확인 |
| 2단계 | QuickSight 데이터 소스 생성 | QuickSight의 공식 MySQL 커넥터를 사용하여 Apache Doris에 연결 |
| 3단계 | 데이터 세트 생성 | Doris 테이블을 선택하고 **직접 쿼리** 모드로 데이터 세트 생성 |
| 4단계 | 시각화 대시보드 구성 | 여러 데이터 세트를 추가하고 테이블 간 연계를 구성한 후 분석 대시보드 게시 |

## 사전 요구 사항 {#prerequisites}

설정을 시작하기 전에 다음 조건을 충족하는지 확인합니다.

| 요구 사항 | 세부 조건 |
| --- | --- |
| Doris 버전 | Apache Doris 3.1.2 이상 |
| 네트워크 연결 | AWS 서버에서 Doris 클러스터에 접근할 수 있도록 Doris 배포 환경에 맞게 VPC와 보안 그룹 구성 |
| MySQL 호환 버전 | Doris에 연결하는 MySQL 클라이언트에서 MySQL 호환 버전 지정 |

Doris에 연결하는 MySQL 클라이언트에서 다음 SQL을 실행하여 MySQL 호환 버전을 지정합니다.

```sql
SET GLOBAL version = '8.3.99';
```

다음 SQL을 실행하여 설정을 확인합니다.

```sql
mysql> show variables like "version";
+---------------+--------+---------------+---------+
| Variable_name | Value  | Default_Value | Changed |
+---------------+--------+---------------+---------+
| version       | 8.3.99 | 5.7.99        | 1       |
+---------------+--------+---------------+---------+
1 row in set (0.01 sec)
```

## QuickSight를 Apache Doris에 연결 {#connect-quicksight-to-apache-doris}

이 절에서는 QuickSight에서 Doris 데이터 소스를 생성하고 Doris 테이블을 기반으로 데이터 세트를 만드는 방법을 설명합니다.

### 1단계: 새 QuickSight 데이터 세트 생성 {#step-1-create-a-new-quicksight-dataset}

[QuickSight 콘솔](https://quicksight.aws.amazon.com/)로 이동하여 데이터 세트 페이지를 열고 **새 데이터 세트**를 클릭합니다.

![QuickSight 데이터 세트 페이지 열기](/images/next/connection-integration/data-integration/quicksight/Cm8EbaeoIoYDeAxGDR8cuSFhns1.png)

![새 QuickSight 데이터 세트 생성](/images/next/connection-integration/data-integration/quicksight/XngnbqKxhouZHIxgVYhcyta5n3f.png)

### 2단계: MySQL 커넥터 선택 {#step-2-select-the-mysql-connector}

QuickSight에 내장된 공식 MySQL 커넥터를 검색하여 선택합니다.

![QuickSight MySQL 커넥터 선택](/images/next/connection-integration/data-integration/quicksight/Pjf5bRheroLmtKxcZ2PcFYMkn7d.png)

### 3단계: Doris 연결 정보 입력 {#step-3-fill-in-the-doris-connection-information}

페이지에서 요구하는 Doris 연결 정보를 입력합니다. MySQL 인터페이스의 기본 포트는 `9030`입니다. 실제 포트는 Doris FE의 `query_port` 설정에 따라 결정됩니다.

![Doris 연결 정보 입력](/images/next/connection-integration/data-integration/quicksight/DlJobTycDoqhDOxdUtCcqZCxnkc.png)

### 4단계: Doris 테이블 및 쿼리 모드 선택 {#step-4-select-the-doris-table-and-query-mode}

목록에서 분석할 Doris 테이블을 선택합니다.

![Doris 테이블 선택](/images/next/connection-integration/data-integration/quicksight/LAFXbSSnwop5C7xn3kPcEcBZnmc.png)

**직접 쿼리** 모드를 선택하는 것이 좋습니다.

![직접 쿼리 모드 선택](/images/next/connection-integration/data-integration/quicksight/RN4fbtJU5o89gQxePQKcOGRBnyh.png)

**데이터 편집/미리 보기**를 클릭하면 여기에서 테이블 스키마를 확인하고, 사용자 지정 SQL을 조정하고, 데이터 세트를 수정할 수 있습니다.

![QuickSight 데이터 세트 미리 보기 및 편집](/images/next/connection-integration/data-integration/quicksight/DoVOMbQTxBrRBpx3Bbgn2gcUXLd.png)

### 5단계: 데이터 세트 게시 및 시각화 생성 {#step-5-publish-the-dataset-and-create-a-visualization}

데이터 세트 구성을 완료하면 데이터 세트를 게시하고 새 시각화를 만들 수 있습니다.

![QuickSight 데이터 세트 게시](/images/next/connection-integration/data-integration/quicksight/MXgObQbdDoLBVTxBrRBcUpx3n2g.png)

## QuickSight에서 시각화 구성 {#build-a-visualization-in-quicksight}

이 절에서는 TPC-H 데이터를 데이터 소스로 사용하여 QuickSight에서 여러 테이블을 연계한 시각화 대시보드를 만드는 방법을 보여 줍니다. Doris TPC-H 데이터 소스를 구축하는 방법은 [TPC-H 벤치마크 문서](../../lakehouse/best-practices/tpch.md)를 참조하세요.

이 예제의 목표는 국가별로 각 주문 상태에 해당하는 주문 건수를 집계하는 것입니다. Doris는 여러 테이블을 연계하는 시나리오에서 우수한 쿼리 성능을 제공하므로, 이 문서에서는 `customer`, `nation`, `orders` 테이블을 연계하여 분석합니다.

### 1단계: Doris 테이블을 기반으로 데이터 세트 생성 {#step-1-create-a-dataset-based-on-a-doris-table}

1. 앞서 생성한 데이터 소스를 사용하여 다음 테이블을 데이터 세트로 추가합니다.

    - `customer`
    - `nation`
    - `orders`

2. **데이터 세트 생성**을 클릭합니다.

    ![QuickSight 데이터 세트 생성](/images/next/connection-integration/data-integration/quicksight/LDeebS3RdoB6hPxcYkacV88VnMd.png)

3. 앞서 생성한 데이터 소스를 선택합니다.

    ![앞서 생성한 데이터 소스 선택](/images/next/connection-integration/data-integration/quicksight/LQlLb26gZoXOurxO3AJc0xCBnqd.png)

4. 필요한 테이블을 선택합니다.

    ![분석할 테이블 선택](/images/next/connection-integration/data-integration/quicksight/W7bDb42r4ovxr3xGDU0cRxmbnsf.png)

5. **직접 쿼리** 모드를 선택합니다.

    ![데이터 세트의 직접 쿼리 모드 선택](/images/next/connection-integration/data-integration/quicksight/Nllyb7GkJo8ToCxXSuDc4gNgnvg.png)

6. **시각화**를 클릭하여 데이터 소스를 생성하고, 같은 절차로 다른 테이블의 데이터 소스도 생성합니다.

### 2단계: 분석에 여러 데이터 세트 추가 {#step-2-add-multiple-datasets-to-the-analysis}

1. 대시보드 작성 작업 공간을 열고 현재 데이터 세트의 드롭다운을 클릭한 다음 **새 데이터 세트 추가**를 선택합니다.

    ![분석에 새 데이터 세트 추가](/images/next/connection-integration/data-integration/quicksight/D18HbY2PWoQvMOxlJTRcOfZenEh.png)

2. 사용할 데이터 세트를 모두 선택하고 **선택**을 클릭하여 현재 대시보드에 추가합니다.

    ![여러 데이터 세트 선택](/images/next/connection-integration/data-integration/quicksight/TzM6boK9No1wD0xBBeAcaJGcnDd.png)

### 3단계: 데이터 세트 간 연계 구성 {#step-3-configure-dataset-associations}

1. 데이터 세트를 추가한 후 `nation`의 작업 항목을 클릭하여 데이터 세트 편집 화면을 엽니다.

    ![nation 데이터 세트 편집 화면 열기](/images/next/connection-integration/data-integration/quicksight/Y0GpbCY0oo6xeYxfufAcPAC6n1e.png)

2. **데이터 추가**를 클릭하여 데이터 소스를 추가합니다.

    ![데이터 세트에 데이터 소스 추가](/images/next/connection-integration/data-integration/quicksight/ZNKgbdPivoM3y7xwr8kcZbWPn8c.png)

3. 세 테이블을 모두 추가한 후 연계 키를 구성합니다. 연계 관계는 다음과 같습니다.

    | 왼쪽 테이블 | 왼쪽 필드 | 오른쪽 테이블 | 오른쪽 필드 |
    | --- | --- | --- | --- |
    | `customer` | `c_nationkey` | `nation` | `n_nationkey` |
    | `customer` | `c_custkey` | `orders` | `o_custkey` |

    ![세 테이블 간 연계 구성](/images/next/connection-integration/data-integration/quicksight/HVNIbL0yDouA8axQmIocXFhFnmc.png)

4. 연계 구성을 완료하면 오른쪽 상단의 **저장 및 게시**를 클릭하여 게시합니다.

    ![연계된 데이터 세트 게시](/images/next/connection-integration/data-integration/quicksight/CD9pbqFIOouYFtxUrs9cMlyAnph.png)

### 4단계: 차트 구성 및 대시보드 게시 {#step-4-configure-charts-and-publish-the-dashboard}

1. 세 데이터 소스가 추가된 **분석** 화면으로 돌아가서 `n_name`을 클릭하여 국가 이름별 총 주문 건수를 집계하는 차트를 생성합니다.

    ![국가 이름별 총 주문 건수 집계](/images/next/connection-integration/data-integration/quicksight/D6Yrb7Igwo5520x3WBbcZ8T9n9f.png)

2. **값**에서 `o_orderkey`를 선택하고 **그룹/색상**에서 `o_orderstatus`를 선택하면 국가별 및 주문 상태별 주문 건수를 집계하는 대시보드가 만들어집니다.

    ![국가별 및 주문 상태별 주문 건수 집계](/images/next/connection-integration/data-integration/quicksight/Sl8nbfrszok2bexesfwcsNqbngc.png)

3. 오른쪽 상단의 **게시**를 클릭하여 대시보드 게시를 완료합니다.

## 결과 {#result}

이제 QuickSight를 Apache Doris에 연결하고 데이터 분석 및 시각화 대시보드를 성공적으로 구축했습니다.
