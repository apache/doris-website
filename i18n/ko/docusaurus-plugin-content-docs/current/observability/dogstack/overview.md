---
{
    "title": "DOG Stack 오픈 옵저버빌리티 개요",
    "sidebar_label": "개요",
    "language": "ko",
    "description": "DOG Stack은 Apache Doris, OpenTelemetry, Grafana를 기반으로 구축된 오픈 옵저버빌리티 솔루션입니다. 이 문서에서는 DOG Stack의 핵심 기능과 구성 요소, 전체 아키텍처를 소개합니다.",
    "keywords": [
        "DOG Stack",
        "Apache Doris",
        "OpenTelemetry",
        "Grafana",
        "Elasticsearch",
        "ELK",
        "오픈 소스 옵저버빌리티",
        "Doris App plugin",
        "로그",
        "트레이스",
        "메트릭"
    ]
}
---

<!-- Knowledge type: capability definition + architecture overview -->
<!-- Applicable scenario: observability platform / DOG Stack solution selection -->

**DOG Stack**은 **D**oris, **O**penTelemetry([Doris Exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter) 포함), **G**rafana([Doris App plugin](https://github.com/velodb/grafana-doris-app) 포함)를 기반으로 구축된 오픈 옵저버빌리티 솔루션입니다. 다음과 같은 특성을 갖추도록 설계되었습니다.

- **개방성**: 모든 구성 요소가 오픈 소스이므로 특정 공급업체에 종속되지 않습니다.
- **고성능**: 최대 수백 GB/s의 쓰기 처리량을 제공합니다. 수십억 건의 레코드에 대한 검색과 쿼리에 일 초 미만으로 응답합니다.
- **비용 효율성**: ELK 또는 Datadog에 비해 옵저버빌리티 비용을 50% 넘게, 많게는 80%까지 줄입니다.
- **확장성**: PB는 물론 EB 규모의 데이터도 손쉽게 처리합니다.

OpenTelemetry는 옵저버빌리티 데이터 수집 분야의 사실상 표준이며, Grafana는 옵저버빌리티 데이터 시각화 분야의 사실상 표준입니다. 따라서 Doris는 새로운 수집 도구와 시각화 도구를 별도로 만드는 대신, 이들을 기반으로 옵저버빌리티 솔루션을 구축하기로 했습니다. Doris는 옵저버빌리티 데이터의 효율적인 저장과 빠른 쿼리에 집중합니다.



## 기능 {#features}

DOG Stack은 OpenTelemetry와 Grafana를 기반으로 풍부한 기능을 제공합니다.

1. **다양한 옵저버빌리티 데이터 수집**
   1. OpenTelemetry SDK는 10개가 넘는 프로그래밍 언어로 작성된 애플리케이션에 바로 사용할 수 있는 계측 기능을 제공하며, 코드를 작성하지 않고도 계측할 수 있습니다.
   2. OpenTelemetry Collector는 로컬 파일, 호스트 메트릭, 컨테이너 메트릭을 수집합니다.
   3. Vector, Fluentbit, Node Exporter, Telegraf, Logstash, Filebeat 등 기존에 사용하던 수집 도구와 연동할 수 있습니다.
2. **Kibana를 뛰어넘는 검색 경험**
   1. Lucene 스타일의 검색 구문과 네이티브 SQL 구문을 모두 지원합니다.
   2. 클릭 한 번으로 로그와 트레이스의 연관 관계를 확인합니다.
   3. 상세 레코드를 테이블 또는 JSON 형식으로 조회합니다.
   4. 특정 로그나 트레이스가 발생한 시점의 전후 데이터를 조회합니다.
   5. 대화형으로 시간 범위와 필드를 선택하고 필드를 필터링합니다.
   6. 필드 값의 분포 통계를 제공합니다.
3. **Jaeger와 유사한 트레이스 분석 경험**
   1. 서비스 이름, 작업, 태그, 소요 시간 범위로 트레이스를 필터링합니다.
   2. 타임라인, 소요 시간, span 수를 기준으로 트레이스를 시각화합니다.
   3. 타임스탬프, 소요 시간, span 수를 기준으로 트레이스를 정렬합니다.
   4. 특정 트레이스를 워터폴 형태로 시각화합니다.
   5. 서비스 이름, span 이름, 태그, 소요 시간 범위로 트레이스 내의 span을 필터링합니다.
4. **대시보드**
   1. 선형 차트, 막대 차트, 원형 차트, 게이지, 히트맵, 히스토그램, 지리 지도 등 20개가 넘는 시각화 유형을 제공합니다.
   2. 시각적 빌더를 사용하거나 SQL을 직접 작성하여 대시보드를 구성합니다.
   3. Doris의 다중 테이블 조인을 활용하여 로그, 트레이스, 메트릭을 아우르는 대시보드를 구성합니다.
5. **알림**
   1. 건수, 합계, 비율 등의 메트릭에 대해 데이터 없음 / 오류, 임계값, 복합 임계값 등 여러 조건으로 알림 규칙을 설정합니다.
   2. 이메일, PagerDuty, Slack, Discord, Webhook 등 20개가 넘는 알림 채널을 제공합니다.
   3. 알림 템플릿으로 알림 메시지를 맞춤 설정하고, 형식을 지정하고, 재사용합니다.
6. **OpenTelemetry와 Grafana가 지원하는 다양한 추가 기능.**

아래는 Doris App plugin이 설치된 Grafana의 주요 기능을 간단히 살펴볼 수 있는 스크린샷입니다.

- 로그 검색

![로그 검색](https://cdnd.selectdb.com/images/upload/dogstack/overview_logs.png)

- 트레이스 분석

![트레이스 분석](https://cdnd.selectdb.com/images/upload/dogstack/overview_traces.png)

- 메트릭 대시보드

![메트릭 대시보드](https://cdnd.selectdb.com/images/upload/dogstack/overview_dashboard.png)



## 아키텍처 {#architecture}

![DOG Stack 아키텍처](https://cdnd.selectdb.com/images/upload/dogstack/dogstack_architecture.png)

DOG Stack은 다음 구성 요소로 이루어져 있습니다.

1. **데이터 수집 도구**: 로그, 트레이스, 메트릭 등의 텔레메트리 데이터를 수집합니다. OpenTelemetry는 두 종류의 수집 도구를 제공합니다. 하나는 10개 이상의 언어를 지원하는 OpenTelemetry SDK로, 애플리케이션과 AI 에이전트를 계측하는 데 사용하며 주로 트레이스 데이터를 수집합니다. 다른 하나는 OpenTelemetry Collector의 receiver로, 로컬 파일을 수집하는 filelog receiver, 호스트 메트릭(CPU, 메모리 등)을 수집하는 hostmetrics receiver, Kubernetes의 pod 메트릭을 수집하는 podmetrics receiver 등이 있습니다. Vector, Fluentbit, Node Exporter, Telegraf 등 다양한 타사 수집 도구도 OTLP와 기타 프로토콜을 통해 OpenTelemetry Collector로 데이터를 전송할 수 있습니다.
2. **OpenTelemetry Collector(Doris Exporter 포함)**: 수집 도구에서 텔레메트리 데이터를 받아 처리한 뒤, Doris Exporter를 통해 Doris에 영구 저장합니다. 일반적인 처리 단계에는 필터링, 변환, 정보 보강, 큐잉, 배치 처리가 포함됩니다.
3. **Doris**: OpenTelemetry Collector에서 텔레메트리 데이터를 받아 인덱스가 적용된 컬럼 지향 스토리지에 효율적으로 저장합니다. Doris는 inverted index, bloom filter index, zone map index 등 다양한 인덱스를 통해 매우 빠른 검색을 제공합니다. 또한 집계, 정렬, 조인과 같은 분석 쿼리에서도 뛰어난 네이티브 성능을 제공합니다.
4. **Grafana(Doris App plugin 포함)**: 로그, 트레이스, 메트릭을 위한 풍부하고 사용하기 쉬운 시각화 기능을 제공합니다. Doris App plugin은 Grafana의 강력한 기본 기능에 실용적인 기능을 더합니다. "탐색(Discover)" 기능은 Kibana 사용자에게 호평받는 뛰어난 검색 경험을 제공합니다. "트레이스(Traces)" 기능은 네이티브 트레이스 탐색을 지원하여 느린 트레이스처럼 조사할 만한 트레이스를 찾아내며, Jaeger 사용자에게 익숙한 경험을 제공합니다.
