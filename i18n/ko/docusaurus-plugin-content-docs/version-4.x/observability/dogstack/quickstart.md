---
{
    "title": "빠른 시작",
    "sidebar_label": "빠른 시작",
    "language": "ko",
    "description": "DOG Stack 관측 가능성 솔루션을 빠르게 체험하려면 어떻게 해야 할까요? 이 문서에서는 Docker Compose를 이용한 원클릭 배포 방법과 Doris App 플러그인, 로그 검색, 트레이스 분석, 대시보드, 알림 기능 전반을 안내합니다.",
    "keywords": [
        "DOG Stack 빠른 시작",
        "Docker Compose",
        "Doris App 플러그인",
        "Grafana",
        "OpenTelemetry",
        "로그 검색",
        "트레이스 분석",
        "대시보드",
        "알림"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability quick validation / DOG Stack onboarding -->

DOG Stack을 가장 쉽게 체험하는 방법은 [온라인 데모](https://observability-demo.velodb.io/)를 이용하는 것입니다. 별도로 배포할 필요가 없습니다. 직접 인스턴스를 실행하고 싶다면 Docker Compose로도 간편하게 시작할 수 있습니다.



## 배포 {#deployment}

```Bash
git clone https://github.com/ai-observe/ai-observe-stack.git
cd ai-observe/demo
docker compose up -d
```

이 명령을 실행하면 완전한 DOG Stack과 함께 10개 이상의 마이크로서비스로 구성된 데모 전자상거래 애플리케이션이 시작됩니다.

웹 브라우저에서 http://localhost:33000/grafana/plugins 페이지를 열고, `doris`를 검색한 다음 **Doris App** 항목을 클릭합니다.

![Doris App 플러그인](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_plugin.png)

이어서 **활성화** 버튼을 클릭하여 Doris App을 활성화합니다.

![Doris App 활성화](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_enable.png)

활성화하면 왼쪽 메뉴의 "더 많은 앱"에서 Doris App을 찾을 수 있습니다. "Doris App"을 클릭하여 기능을 살펴보세요.

![Doris App 항목](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_apps.png)



## 검색 {#search}

Doris App에서 데이터 소스로 `Doris`를, 데이터베이스로 `otel`을, 테이블로 `otel_logs`를 선택하면 데이터가 표시됩니다. Kibana 사용자라면 익숙하고 사용하기 쉬운 UI를 볼 수 있습니다.

![로그 데이터 소스](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_logs.png)

검색창에 `body:error`를 입력하여 본문 필드에 `error`라는 단어가 포함된 로그를 찾아보세요.

![본문 오류 검색](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_search.png)



## 트레이스 {#traces}

**Doris App** 메뉴에서 **트레이스**를 클릭하여 트레이스를 살펴보고 분석합니다.

데이터 소스로 `Doris`를, 데이터베이스로 `otel`을, 테이블로 `otel_traces`를 선택합니다. **트레이스 찾기** 버튼을 클릭하면 최신 트레이스 레코드 50개를 가져와 상단에는 차트로, 하단에는 목록으로 표시합니다. 왼쪽의 서비스, 작업, 태그, 소요 시간 필터를 사용해 보고, 트레이스 차트 아래에서 다양한 정렬 옵션도 선택해 보세요.

![트레이스 목록](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_traces.png)

특정 트레이스를 클릭하면 워터폴 시각화를 볼 수 있습니다. 워터폴 보기에서 **스팬 필터**를 사용하면 해당 트레이스 내의 스팬을 추가로 필터링할 수 있습니다.

![트레이스 워터폴](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_waterfall.png)

## 대시보드 {#dashboards}

왼쪽 메뉴에서 **대시보드**를 클릭하고, **Doris 데모**를 클릭한 다음, **Collector 자체 모니터링**을 클릭합니다. 그러면 OpenTelemetry Collector 자체의 호스트 메트릭을 보여 주는 아래 데모 대시보드가 표시됩니다.

![데모 대시보드](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_dashboard.png)



## 알림 {#alerting}

Doris에 실행하는 SQL 쿼리를 기반으로 알림 규칙을 만들 수 있습니다. **축소** 함수와 **임계값** 등의 알림 조건 매개변수를 지정합니다.

![알림 규칙](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_alert.png)
