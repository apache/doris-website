---
{
    "title": "로그 및 트레이스 검색",
    "sidebar_label": "검색",
    "language": "ko",
    "description": "Doris에서 Kibana Discover와 유사한 검색 환경을 구현하려면 어떻게 해야 할까요? 이 문서에서는 SQL과 Lucene의 두 가지 구문, 시간별 추이 차트, 컨텍스트 분석, 필드 값 분포, 클릭 한 번으로 로그와 트레이스를 연계하는 방법을 다룹니다.",
    "keywords": [
        "Doris 로그 검색",
        "Discover",
        "Lucene 구문",
        "SQL 쿼리",
        "필드 탐색기",
        "컨텍스트 분석",
        "로그와 트레이스 연계",
        "Doris App",
        "Grafana"
    ]
}
---

<!-- Knowledge type: capability definition + operational steps -->
<!-- Applicable scenario: observability platform / log and trace search -->

Discover 페이지는 고성능 로그 분석에 최적화된, Kibana Discover와 유사한 검색 및 분석 환경을 제공합니다.

주요 기능:

- **SQL**과 **Lucene** 쿼리 구문 모두 지원
- 클릭 한 번으로 로그에서 해당 트레이스로 이동
- 시간 범위, 필터 등을 대화형으로 선택
- 테이블 및 JSON 형식의 결과 보기 제공
- 특정 레코드의 주변 데이터를 확인하여 컨텍스트 분석
- 필드 값 분포 통계(상위 5개 값과 비율)



## Discover 페이지 개요 {#discover-page-overview}

![Discover 페이지 개요](https://cdnd.selectdb.com/images/upload/dogstack/search_overview.png)

Discover 페이지는 네 가지 핵심 영역으로 구성됩니다.

### 1. 쿼리 입력 영역(상단) {#1-query-input-area-top}

쿼리 범위와 검색문을 설정합니다. 다음 기능을 제공합니다.

- 데이터 소스 선택
- 시간 필드와 시간 범위 선택
- SQL 또는 Lucene 구문으로 검색 조건 입력

### 2. 시간별 추이 영역(중앙) {#2-time-trend-area-middle}

쿼리 결과의 시간별 분포를 보여 주는 히스토그램입니다. 다음 기능을 제공합니다.

- 조건에 일치하는 데이터의 시간별 추이를 빠르게 파악
- 드래그로 시간 구간을 선택하여 쿼리의 시간 범위 변경

### 3. 상세 데이터 영역(하단) {#3-detail-data-area-bottom}

쿼리 결과의 상세 레코드를 표시하고 관련 컨텍스트를 탐색할 수 있습니다. 다음 기능을 제공합니다.

- 조건에 일치하는 최신 레코드 표시. `trace_id`가 있으면 클릭하여 트레이스 상세 정보 확인
- 개별 로그를 펼쳐 모든 필드를 테이블 또는 JSON 형식으로 확인
- 테이블 형식 보기에서 대화형으로 필터 조건 구성
- 특정 레코드의 주변 데이터 확인

### 4. 필드 탐색기 영역(왼쪽) {#4-field-browser-area-left}

현재 테이블의 모든 필드를 표시하며, 필드별로 탐색할 수 있습니다.

다음 기능을 제공합니다.

- 오른쪽에 표시할 필드 선택. 기본적으로 모든 필드를 이어 붙인 `_source` 표시
- 필드 위에 마우스를 올려 **가장 자주 나타나는 상위 5개 값과 비율** 확인
- 값 옆의 "+" 또는 "-"를 클릭하여 대화형으로 필터 조건 구성. 구성한 조건은 상단 쿼리 입력창에 동기화됨



## 쿼리 입력 {#query-input}

쿼리 입력 영역의 드롭다운 메뉴에서 데이터 소스, 데이터베이스, 테이블, 시간 필드, 시간 범위를 선택합니다. 데이터 소스, 데이터베이스, 테이블의 기본값은 설정 페이지에서 변경할 수 있습니다. 기본 시간 필드는 테이블에서 처음으로 나타나는 `DATETIME` 또는 `DATE` 열입니다.

![쿼리 입력 예시](https://cdnd.selectdb.com/images/upload/dogstack/search_input.gif)

검색 입력창은 SQL과 Lucene 구문을 모두 지원합니다. Lucene 구문은 내부적으로 SQL `WHERE` 조건으로 변환됩니다. 지원되는 Lucene 구문과 Kibana, SQL 간의 대응 관계는 다음과 같습니다.

| 기능                          | Doris App Lucene 구문                                      | Kibana | SQL WHERE                                                    | 참고                                                        |
| -------------------------------- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 단일 필드 키워드 일치       | service_name:kafka                                           | 동일   | service_name MATCH 'kafka'                                   | 정확한 필드 일치, service_name MATCH_ANY 'kafka' 형태로 재작성됨 |
| 여러 필드 키워드 일치        | error                                                        | 동일   | (`service_name` MATCH 'error') OR  (`scope_name` MATCH 'error') | 모든 역색인 필드에서 전문 검색을 수행하며, 여러 필드에 대한 MATCH_ANY로 자동 재작성됨 |
| 단일 필드 구문 일치        | service_name:"kafka logs"                                    | 동일   | service_name MATCH_PHRASE 'kafka logs'                       | 필드 단위 구문 일치                                     |
| 여러 필드 구문 일치         | "kafka logs"                                                 | 동일   | `service_name` MATCH_PHRASE 'kafka logs')                    | 정확한 구문 일치, MATCH_PHRASE로 재작성됨                |
| 와일드카드                         | kaf*                                                         | 동일   | ((`service_name` MATCH_PHRASE_PREFIX 'kaf') OR (`scope_name` MATCH_PHRASE_PREFIX 'kaf')) | 접두사/접미사 와일드카드, MATCH_PHRASE_PREFIX로 재작성됨     |
| 숫자 / 시간 범위             | duration:[100 TO 500]                                        | 동일   | duration BETWEEN 100 AND 500                                 | SQL BETWEEN으로 변환됨                                    |
| 한쪽 경계가 없는 범위                  | duration:>500                                                | 동일   | duration > '500'                                             | SQL 비교식으로 변환됨                                 |
| 열린 / 닫힌 범위              | {100 TO 200}                                                 | 동일   |                                                              | 중괄호는 열린 구간을 나타냄                         |
| AND 조합                  | service_name:kafka AND status:failed                         | 동일   | (service_name MATCH 'kafka') AND  (status MATCH 'failed')    | 논리 AND                                                  |
| OR 조합                   | error OR warning                                             | 동일   |                                                              | 논리 OR                                                   |
| NOT 조합                  | NOT kafka  or  -kafka                                        | 동일   | NOT (service_name MATCH 'kafka')                             | 논리 NOT                                                  |
| 그룹화                         | (service_name:kafka OR service_name:zookeeper) AND status:failed | 동일   | ((service_name MATCH 'kafka') OR   (service_name MATCH 'zookeeper')) AND  (status MATCH 'failed') | 복잡한 논리 조합 지원                        |

Lucene 구문의 핵심 사항:

1. 기본 형식은 `field_name:match_condition`입니다.
2. `field_name:`는 단일 필드에 `match_condition`을 적용합니다. `field_name:`가 없으면 어느 필드에서든 일치하는 값이 있을 때 `match_condition`에 일치한 것으로 간주합니다(필드 간 OR 연산).
3. 텍스트 값에 대한 `match_condition`에는 세 가지 형식이 있습니다.
   1. 큰따옴표로 묶은 조건은 구문 일치를 나타냅니다. 모든 단어가 따옴표 안에 있는 순서대로 나타나야 합니다.
   2. 따옴표로 묶지 않은 조건은 키워드 일치를 나타냅니다. 단어 중 하나라도 일치하면 됩니다.
   3. `*`는 와일드카드를 나타냅니다.
4. 숫자와 날짜 값에 대한 `match_condition`에는 세 가지 형식이 있습니다.
   1. 단일 값은 같음 조건을 나타냅니다.
   2. `>`, `<`는 SQL과 마찬가지로 범위를 나타냅니다.
   3. 괄호는 구간을 나타냅니다. 대괄호는 닫힌 구간, 중괄호는 열린 구간을 나타냅니다.
5. SQL과 마찬가지로 여러 조건을 AND / OR / NOT으로 조합할 수 있습니다. 괄호로 그룹화 우선순위를 조정합니다.

SQL 구문의 핵심 사항:

1. `MATCH`와 `MATCH_ANY`는 Lucene의 키워드 일치에 해당합니다. 키워드 중 하나라도 일치하면 됩니다(OR 관계).
2. `MATCH_ALL`도 키워드 일치이지만, 모든 키워드가 일치해야 합니다(AND 관계).
3. `MATCH_PHRASE`는 Lucene의 구문 일치에 해당합니다. 모든 단어가 같은 순서로 나타나야 합니다.
4. 같음 및 범위 쿼리에는 표준 연산자인 `=`, `>`, `<`, `BETWEEN`을 사용합니다.
5. 여러 조건을 AND / OR / NOT으로 조합할 수 있으며, 괄호로 우선순위를 조정합니다.



## 시간별 추이 데이터 {#time-trend-data}

아래 그림에서 빨간색 상자 안이 시간별 추이 데이터 영역입니다. 조건에 일치하는 데이터의 개수와 시간별 추이를 빠르게 파악할 수 있습니다. 다음과 같은 조작을 지원합니다.

1. 막대 위에 마우스를 올리면 해당 시간 버킷의 시작 시간과 버킷 내에서 조건에 일치하는 데이터 개수를 확인할 수 있습니다.
2. 추이 차트에서 드래그로 구간을 선택하여 쿼리의 시간 범위를 변경할 수 있습니다.
3. 버킷 길이는 기본적으로 `Auto`이며, 전체 시간 범위에 따라 조정됩니다. 드롭다운에서 초, 분, 시간 등 다른 단위를 선택할 수도 있습니다.

![시간별 추이 예시](https://cdnd.selectdb.com/images/upload/dogstack/search_trend.gif)



## 상세 데이터 {#detail-data}

아래 그림에서 빨간색 상자 안이 상세 데이터 영역으로, 쿼리 조건에 일치하는 레코드를 표시합니다.

1. 레코드는 시간 필드를 기준으로 내림차순 정렬되어 최신 데이터가 먼저 표시됩니다. 각 페이지에는 50개의 레코드가 표시되며, 페이지를 넘겨 더 많은 레코드를 확인할 수 있습니다. 기본적으로 시간 필드와 `_source`라는 두 필드가 표시됩니다. `_source`는 모든 필드를 가상으로 이어 붙인 것으로, `key: value` 쌍으로 표시되며 읽기 쉽도록 키가 강조됩니다. 왼쪽 필드 탐색기에서 필드 이름 옆의 "+"를 클릭하여 오른쪽에 표시할 필드를 지정할 수 있습니다. 여러 필드를 추가할 수 있으며, 오른쪽의 "x"를 클릭하면 제거할 수 있습니다. 모든 필드를 제거하면 기본값인 `_source`가 다시 표시됩니다.

![상세 데이터 예시](https://cdnd.selectdb.com/images/upload/dogstack/search_detail.gif)

2. 맨 왼쪽의 "->" 화살표를 클릭하면 레코드의 상세 정보가 펼쳐집니다. **테이블**과 **JSON**이라는 두 가지 형식이 있습니다. 테이블 형식에서는 필드 옆의 "+" 또는 "-"를 클릭하여 `severity_text=INFO`와 같은 필터 조건을 대화형으로 추가할 수 있습니다.

![레코드 펼치기 예시](https://cdnd.selectdb.com/images/upload/dogstack/search_expand.gif)

3. 레코드를 펼친 후 **주변 항목**을 클릭하면 해당 레코드의 "컨텍스트", 즉 시간상 앞뒤에 있는 5개의 레코드를 확인할 수 있습니다. 이 기능은 주로 문제 분석 중 특정 로그 주변의 로그를 살펴보는 데 사용되므로, 시간 외의 다른 쿼리 필터 조건은 무시합니다. 그렇지 않으면 상세 데이터 테이블과 동일하게 동작하기 때문입니다. 주변 레코드를 5개보다 많이 조회하거나, 특정 호스트로 제한하는 등의 필터를 직접 추가할 수도 있습니다.

![컨텍스트 보기 예시](https://cdnd.selectdb.com/images/upload/dogstack/search_context.gif)

4. 레코드에 `trace_id` 필드가 있으면 관련 트레이스가 있는 것으로 인식합니다. 필드 값이 클릭 가능한 링크로 표시되며, 클릭하면 트레이스 워터폴 패널이 열려 로그와 트레이스를 연계하여 확인할 수 있습니다.

![로그와 트레이스 연계 예시](https://cdnd.selectdb.com/images/upload/dogstack/search_trace.gif)



## 필드 탐색기 {#field-browser}

왼쪽 필드 탐색기에서 현재 테이블의 필드를 살펴보고 값의 분포를 분석할 수 있습니다.

1. 필드 오른쪽의 "+"를 클릭하면 상세 데이터 테이블에 해당 필드가 추가됩니다.
2. 필드 이름을 클릭하면 가장 자주 나타나는 상위 5개 값을 확인할 수 있습니다. 값 옆의 "+" / "-"를 클릭하면 필터 조건을 동적으로 추가할 수 있습니다.

![필드 탐색기 예시](https://cdnd.selectdb.com/images/upload/dogstack/search_fields.gif)
