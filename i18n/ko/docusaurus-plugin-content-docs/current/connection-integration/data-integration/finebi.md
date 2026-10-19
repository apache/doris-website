---
{
    "title": "FineBI",
    "language": "ko",
    "description": "MySQL 프로토콜을 통해 FineBI를 Apache Doris에 연결하고 데이터 모델링, 테이블 가져오기, 시각화 분석에 필요한 전체 설정 절차를 완료합니다."
}
---

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: BI tool integration / Visualization analysis -->

FineBI는 데이터 처리, 애드혹 분석, 다차원 대시보드 등 다양한 기능을 제공하는 비즈니스 인텔리전스 제품입니다. 다양한 데이터 소스 연결과 여러 뷰를 활용한 테이블 분석 관리를 지원하며, Apache Doris의 내부 및 외부 데이터를 원활하게 모델링하고 시각화할 수 있습니다.

이 문서에서는 FineBI에서 Apache Doris 데이터 소스에 연결하고, 연결 설정부터 데이터 모델링까지 전체 과정을 수행하는 방법을 설명합니다.

## 활용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| --- | --- |
| BI 보고서 분석 | Doris의 비즈니스 데이터를 기반으로 대시보드와 보고서 작성 |
| 다차원 애드혹 분석 | FineBI의 다차원 분석 기능을 활용하여 Doris 데이터 탐색 |
| 내부 및 외부 데이터 모델링 | Doris 내부 테이블과 외부 테이블을 FineBI로 통합하여 가져오고 모델링 |

## 사전 요구 사항 {#prerequisites}

- FineBI 5.0 이상 버전이 설치되어 있어야 합니다. 다운로드 URL: [https://www.finebi.com/](https://www.finebi.com/)
- Apache Doris 클러스터가 배포되어 있어야 하며, 다음 연결 정보를 알고 있어야 합니다.
    - FE 호스트 IP 주소
    - FE 쿼리 포트(기본값: `9030`)
    - 접근 권한이 있는 사용자 이름과 비밀번호
    - 대상 데이터베이스 이름

## 절차 {#procedure}

### 1단계: FineBI에 로그인 {#step-1-log-in-to-finebi}

1. FineBI 로그인 계정을 생성하고 해당 계정으로 로그인합니다.

    ![로그인 페이지](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-1.png)

2. FineBI 정보 저장소로 내장 데이터베이스를 선택합니다. 외부 데이터베이스를 사용하려면 공식 문서를 참고하세요. [https://help.fanruan.com/finebi/doc-view-437.html](https://help.fanruan.com/finebi/doc-view-437.html)

    :::info 참고
    FanRuan BI 정보 저장소로 내장 데이터베이스를 선택하는 것이 좋습니다. 여기서 선택하는 데이터베이스 유형은 쿼리 분석에 사용할 대상 데이터베이스가 아니라, 모델과 대시보드 등 FineBI의 메타데이터를 저장하고 관리하는 데이터베이스입니다. FineBI는 이 데이터베이스에서 생성, 읽기, 수정, 삭제 작업을 수행해야 합니다.
    :::

    ![데이터베이스 선택](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-2.png)

### 2단계: Doris 데이터 연결 생성 {#step-2-create-a-doris-data-connection}

1. **관리 시스템**으로 이동하여 **데이터 연결** 아래의 **데이터베이스 연결**을 선택하고, 클릭하여 새 데이터베이스 연결을 생성합니다.

    ![데이터 연결](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-3.png)

2. 데이터베이스 연결 유형 선택 페이지에서 **MySQL**을 선택합니다.

    ![연결 선택](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-4.png)

3. Doris 데이터베이스 연결 정보를 입력합니다. 각 매개변수에 대한 설명은 다음과 같습니다.

    | 매개변수 | 설명 |
    | --- | --- |
    | 사용자 이름 | Doris 클러스터에 로그인할 때 사용하는 사용자 이름(예: `admin`) |
    | 비밀번호 | Doris 클러스터에 로그인할 때 사용하는 비밀번호 |
    | 호스트 | Doris 클러스터의 FE 호스트 IP 주소 |
    | 포트 | Doris 클러스터의 FE 쿼리 포트(예: `9030`) |
    | 인코딩 | Doris 클러스터에서 사용하는 인코딩 형식 |
    | 데이터베이스 이름 | Doris 클러스터의 대상 데이터베이스 |

    ![연결 정보](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-5.png)

4. **연결 테스트**를 클릭합니다. 연결 정보를 올바르게 입력했다면 연결 성공 메시지가 표시됩니다.

    ![연결 테스트](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-6.png)

### 3단계: 데이터 모델 생성 {#step-3-create-a-data-model}

1. **공용 데이터**에서 클릭하여 새 데이터 세트를 생성합니다. Doris 데이터 세트를 추가할 때는 **데이터베이스 테이블**을 선택합니다.

    ![새 데이터 세트](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-7.png)

2. 생성한 데이터베이스 연결에서 가져올 테이블을 선택합니다.

    ![테이블 선택](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-8.png)

3. 테이블을 가져온 후에는 가져온 테이블을 각각 새로 고쳐야 합니다. 새로 고침을 완료해야 분석 주제에서 해당 테이블을 데이터 분석에 사용할 수 있습니다.

    ![테이블 새로 고침](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-9.png)

4. 가져온 공용 데이터를 분석 주제에 추가하면 비즈니스 로직에 따라 대시보드 분석과 설정을 수행할 수 있습니다.

    ![데이터 분석](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-10.png)

## 자주 묻는 질문 {#faq}

**질문: 연결 테스트에 실패하면 어떻게 해결하나요?**

다음 사항을 순서대로 확인하세요.

- FineBI가 실행되는 호스트에서 Doris FE 노드의 IP와 쿼리 포트(기본값: `9030`)에 접근할 수 있는지 확인합니다.
- 로그인 사용자에게 대상 데이터베이스에 접근할 권한이 있는지 확인합니다.
- 연결 유형이 다른 데이터베이스 유형이 아닌 MySQL로 설정되어 있는지 확인합니다.

**질문: 테이블을 가져온 후 분석 주제에서 분석할 수 없는 이유는 무엇인가요?**

**공용 데이터**에서 가져온 테이블을 각각 새로 고쳐야 합니다. 새로 고침이 완료되면 분석 주제에서 해당 테이블을 사용할 수 있습니다.
