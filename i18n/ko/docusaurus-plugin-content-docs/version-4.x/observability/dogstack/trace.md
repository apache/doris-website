---
{
    "title": "분산 트레이스 분석",
    "sidebar_label": "트레이스",
    "language": "ko",
    "description": "Doris App에서 분산 트레이스를 어떻게 분석할까요? 이 문서에서는 느린 요청과 비정상 호출을 찾는 데 도움이 되는 트레이스 산점도, 워터폴 뷰, 스팬 필터와 서비스, 작업, 태그, 소요 시간을 기준으로 한 다차원 필터링을 설명합니다.",
    "keywords": [
        "트레이스 분석",
        "분산 트레이싱",
        "스팬 필터",
        "워터폴 뷰",
        "Doris App",
        "Grafana",
        "OpenTelemetry",
        "느린 요청 분석"
    ]
}
---

<!-- Knowledge type: capability definition + operational steps -->
<!-- Applicable scenario: observability platform / distributed trace analysis -->

트레이스는 관측 가능성 데이터의 세 가지 핵심 요소 중 하나입니다. 요청의 전체 실행 과정을 추적하며, 각 서비스 내의 실행 구간인 스팬과 스팬 간 호출 관계로 구성됩니다. 트레이스는 분산 시스템에서 요청 성능과 이상 현상을 분석하는 데 필수적입니다.

**트레이스** 페이지에서 트레이스를 분석할 수 있습니다. 먼저 관심 있는 트레이스(예: 실행 시간이 긴 트레이스)를 찾은 다음, 특정 트레이스를 시각화하고 개별 스팬을 자세히 살펴볼 수 있습니다.

아래 그림과 같이 **트레이스** 페이지는 네 개의 영역으로 구성됩니다.

1. **데이터 선택 영역(상단)**: 트레이스 데이터 소스(데이터 소스, 데이터베이스, 테이블), 시간 필드, 시간 범위를 선택합니다.
2. **필터 영역(왼쪽)**: 서비스, 작업, 태그, 소요 시간을 기준으로 트레이스를 필터링합니다.
3. **트레이스 분포 영역(오른쪽 상단)**: 조건에 맞는 트레이스를 산점도로 표시합니다. X축은 트레이스 시작 시간, Y축은 트레이스 소요 시간이며, 버블 크기는 트레이스의 스팬 수를 나타냅니다. 산점도를 통해 실행 시간이 길거나 스팬 수가 많은 "큰" 트레이스를 빠르게 찾을 수 있습니다. 버블을 클릭하면 해당 트레이스의 세부 정보를 워터폴 차트로 볼 수 있습니다.
4. **트레이스 목록 영역(오른쪽 하단)**: 조건에 맞는 트레이스 목록을 표시하며, 서비스, 작업, trace_id, 트레이스 소요 시간, 스팬 수 등을 보여줍니다. 기본 정렬인 `Most Recent`는 시작 시간을 기준으로 최신 트레이스부터 내림차순으로 표시합니다. 정렬 방식을 변경하여 소요 시간이 가장 길거나 짧은 트레이스 또는 스팬 수가 가장 많거나 적은 트레이스부터 표시할 수 있습니다.

![트레이스 페이지 개요](https://cdnd.selectdb.com/images/upload/dogstack/trace_page.gif)

트레이스를 클릭하면 상세 정보가 담긴 트레이스 패널이 열리며, 여기에서 해당 트레이스의 스팬을 더 자세히 분석할 수 있습니다.

1. 트레이스의 호출 체인 미니맵과 워터폴 차트에서 각 스팬의 실행 구간과 호출 관계를 확인합니다.
2. 스팬을 클릭하여 시작 시간, 소요 시간, 스팬 속성과 리소스 속성을 비롯한 컨텍스트 정보를 확인합니다.
3. **스팬 필터**를 클릭하여 서비스 이름, 스팬 이름, 소요 시간, 태그 등을 기준으로 스팬을 필터링합니다.

![트레이스 패널 상세 정보](https://cdnd.selectdb.com/images/upload/dogstack/trace_panel.gif)



## 자주 사용하는 필터 예시 {#common-filter-examples}

### 서비스로 필터링 {#filter-by-service}

```
Service = frontend-web
```

지정한 서비스에서 생성된 트레이스를 빠르게 확인합니다.

![서비스로 필터링](https://cdnd.selectdb.com/images/upload/dogstack/trace_service.png)

### 작업으로 필터링 {#filter-by-operation}

```
Operation = HTTP POST
```

특정 엔드포인트나 요청 유형을 찾는 데 유용합니다.

![작업으로 필터링](https://cdnd.selectdb.com/images/upload/dogstack/trace_operation.png)

### 태그로 필터링 {#filter-by-tags}

```
upstream_cluster.name="flagservice"
```

**logfmt key=value** 구문을 사용하여 스팬 속성을 기준으로 필터링합니다.

![태그로 필터링](https://cdnd.selectdb.com/images/upload/dogstack/trace_tags.png)

### 소요 시간으로 필터링 {#filter-by-duration}

`Min Duration = 100ms ``Max Duration = 1.2s`

느린 요청을 빠르게 찾아냅니다.

![소요 시간으로 필터링](https://cdnd.selectdb.com/images/upload/dogstack/trace_duration.png)



## 정렬 및 페이지 나누기 {#sorting-and-pagination}

트레이스 목록은 다음과 같은 정렬 옵션을 지원합니다.

- 최신순
- 소요 시간이 긴 순 / 짧은 순
- 스팬 수가 많은 순 / 적은 순

페이지를 나누어 탐색하는 기능도 지원합니다.

![정렬 및 페이지 나누기](https://cdnd.selectdb.com/images/upload/dogstack/trace_sort.png)
