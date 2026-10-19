---
{
    "title": "모니터링 및 알림",
    "language": "ko",
    "description": "Doris 모니터링 및 알림 시스템을 구축합니다. Prometheus로 FE/BE 메트릭을 수집하고, Grafana로 대시보드를 표시하며, Alertmanager로 알림을 구성합니다.",
    "keywords": [
        "Doris 모니터링",
        "Doris 알림",
        "Doris 대시보드",
        "Doris용 Prometheus 모니터링",
        "Grafana Doris 대시보드",
        "FE BE 메트릭",
        "/metrics 엔드포인트",
        "모니터링 아키텍처",
        "Alertmanager",
        "클러스터 모니터링",
        "메트릭 수집",
        "모니터링 설정"
    ]
}
---

이 문서는 Apache Doris 클러스터를 위한 전체 모니터링 시스템을 구축하는 방법을 설명합니다. Prometheus로 FE와 BE가 노출하는 메트릭을 수집하고, Grafana에서 공식 대시보드 템플릿으로 시각화하며, 추후 알림 연동을 위한 Alertmanager 구성 항목을 마련합니다.

> 참고: Kubernetes에 컴퓨팅-스토리지 분리형 Doris 클러스터를 배포하는 경우, 모니터링 설정 방법은 [Prometheus 및 Grafana 배포](../../install/deploy-on-kubernetes/separating-storage-compute/install-prometheus-and-grafana)를 참조하세요. 이 문서의 모니터링 아키텍처, 메트릭 형식, 대시보드 설명도 적용됩니다.

<!-- Knowledge type: Procedure / Deployment guide -->
<!-- Applicable scenarios: Setting up monitoring after cluster deployment / Troubleshooting and performance observation -->

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 클러스터 배포 후 모니터링 연동 | Doris 클러스터 배포를 마친 후 FE/BE 런타임 메트릭을 수집하고 차트로 표시해야 하는 경우입니다. |
| 여러 클러스터의 통합 관측 | 하나의 Prometheus + Grafana 구성에서 여러 Doris 클러스터를 동시에 모니터링합니다. |
| 문제 해결 및 성능 튜닝 | JVM, 쿼리, Backend 작업 대시보드로 비정상 노드와 병목 지점을 빠르게 찾습니다. |
| 알림 구성(예정) | 추후 Prometheus + Alertmanager를 기반으로 이메일, SMS 등의 알림 채널을 구성합니다. |

## 사전 요구 사항 {#prerequisites}

- Doris 클러스터가 배포되어 있고 FE와 BE 프로세스가 정상적으로 실행 중이어야 합니다.
- FE의 HTTP 포트(기본값 `8030`)와 BE의 Web Server 포트(기본값 `8040`)에 접근할 수 있어야 합니다.
- Prometheus와 Grafana를 실행할 서버가 있어야 하며, 이 서버에서 모든 FE/BE 노드에 네트워크로 연결할 수 있어야 합니다.
- Prometheus와 Grafana 공식 웹사이트에서 설치 패키지와 대시보드 템플릿을 다운로드할 수 있도록 외부 네트워크에 접근할 수 있어야 합니다.

## 대시보드 템플릿 다운로드 {#dashboard-template-download}

Doris는 두 가지 Grafana 대시보드 템플릿을 제공합니다. 클러스터의 스토리지 모드에 맞는 템플릿을 선택해 바로 가져오면 됩니다. 템플릿은 주기적으로 업데이트됩니다. 업데이트 절차는 [대시보드 업데이트](#dashboard-update)를 참조하세요.

| 스토리지 모드 | 대시보드 템플릿 | 참고 사항 |
| --- | --- | --- |
| Shared-nothing | [doris-grafana-dashboard.json](https://doris.apache.org/files/doris-grafana-dashboard.json) | 로컬 스토리지를 사용하는 기존 FE / BE 배포 방식입니다. 패널은 FE와 BE 컴포넌트를 다룹니다. |
| 컴퓨팅-스토리지 분리형(Compute-storage decoupled) | [doris-grafana-dashboard-cloud.json](https://doris.apache.org/files/doris-grafana-dashboard-cloud.json) | 패널은 FE, BE / Compute Group, Meta Service를 다룹니다. **Kubernetes 환경과 비 Kubernetes 환경에 배포된 컴퓨팅-스토리지 분리형 클러스터 모두에 적용됩니다**. |

커뮤니티의 더 나은 대시보드 기여를 환영합니다.

## 모니터링 아키텍처 개요 {#monitoring-architecture-overview}

Doris는 [Prometheus](https://prometheus.io/)와 [Grafana](https://grafana.com/)를 사용해 모니터링 데이터를 수집하고 표시합니다.

![컴포넌트](/images/dashboard_overview.png)

| 컴포넌트 | 역할 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Prometheus | 오픈 소스 시스템 모니터링 및 알림 도구 모음입니다. Pull 또는 Push 방식으로 메트릭을 수집해 자체 시계열 데이터베이스(TSDB)에 저장하며, 다차원 데이터 쿼리 언어를 제공합니다. |
| Grafana | 오픈 소스 데이터 분석 및 시각화 플랫폼입니다. Prometheus를 비롯한 여러 시계열 데이터 소스를 지원하며, 구성 가능한 대시보드에서 데이터를 차트로 표시합니다. |
| Alertmanager | 별도로 배포하는 Prometheus 알림 컴포넌트입니다. 이메일, SMS 등의 알림 정책을 구성할 수 있습니다. 이 문서에서는 다루지 않으므로 공식 문서를 참조하세요. |

> 참고: 이 문서는 Prometheus와 Grafana로 Doris 모니터링 데이터를 수집하고 표시하는 방법 중 하나를 소개합니다. 원칙적으로 Doris는 이러한 컴포넌트를 개발하거나 유지 관리하지 않습니다. 각 컴포넌트에 대한 자세한 내용은 해당 공식 문서를 참조하세요.

### 데이터 흐름도 {#data-flow-diagram}

![모니터링 아키텍처](/images/monitor_arch.png)

1. **Prometheus(노란색 영역)**: Prometheus Server는 Prometheus의 주 프로세스입니다. Pull 방식으로 Doris 노드의 모니터링 엔드포인트에 접근해 시계열 데이터를 TSDB에 저장합니다. TSDB는 Prometheus 프로세스에 포함되어 있으므로 별도로 배포할 필요가 없습니다. Prometheus는 [Push Gateway](https://github.com/prometheus/pushgateway) 모드도 지원합니다. 이 모드에서는 모니터링 대상 시스템이 모니터링 데이터를 Push Gateway로 전송하고, Prometheus Server가 Push Gateway에서 데이터를 가져옵니다.
2. **Alertmanager**: [Alertmanager](https://github.com/prometheus/alertmanager)는 Prometheus의 알림 컴포넌트이며 별도로 배포해야 합니다. 이 문서에서는 구성 방법을 제공하지 않으므로 공식 문서를 참조해 설정하세요. Alertmanager를 사용하면 알림 정책을 구성하고 이메일, SMS 등으로 알림을 받을 수 있습니다.
3. **Grafana(녹색 영역)**: Grafana Server는 Grafana의 주 프로세스입니다. 시작한 후 웹 페이지에서 데이터 소스 설정, 사용자 설정, 대시보드 작성 등을 수행할 수 있습니다. 최종 사용자도 이 페이지에서 모니터링 데이터를 확인합니다.

## 모니터링 데이터 형식 {#monitoring-data-format}

<!-- Knowledge type: Interface specification -->
<!-- Applicable scenarios: Understanding how Doris exposes metrics -->

Doris 모니터링 데이터는 Frontend와 Backend의 HTTP 엔드포인트를 통해 Key-Value 텍스트 형식으로 노출됩니다. 각 Key에는 구분을 위한 여러 Label을 지정할 수도 있습니다. 클러스터를 배포한 후 브라우저에서 다음 엔드포인트에 직접 접근하면 노드의 실시간 모니터링 데이터를 확인할 수 있습니다.

| 노드 유형 | 엔드포인트 |
| --------- | --------------------------------------- |
| Frontend | `fe_host:fe_http_port/metrics` |
| Backend | `be_host:be_web_server_port/metrics` |
| Broker | 제공되지 않음 |

엔드포인트에 접근하면 다음과 비슷한 결과가 표시됩니다. 아래는 FE 메트릭의 예입니다.

```text
# HELP  jvm_heap_size_bytes jvm heap stat
# TYPE  jvm_heap_size_bytes gauge
jvm_heap_size_bytes{type="max"} 8476557312
jvm_heap_size_bytes{type="committed"} 1007550464
jvm_heap_size_bytes{type="used"} 156375280
# HELP  jvm_non_heap_size_bytes jvm non heap stat
# TYPE  jvm_non_heap_size_bytes gauge
jvm_non_heap_size_bytes{type="committed"} 194379776
jvm_non_heap_size_bytes{type="used"} 188201864
# HELP  jvm_young_size_bytes jvm young mem pool stat
# TYPE  jvm_young_size_bytes gauge
jvm_young_size_bytes{type="used"} 40652376
jvm_young_size_bytes{type="peak_used"} 277938176
jvm_young_size_bytes{type="max"} 907345920
# HELP  jvm_old_size_bytes jvm old mem pool stat
# TYPE  jvm_old_size_bytes gauge
jvm_old_size_bytes{type="used"} 114633448
jvm_old_size_bytes{type="peak_used"} 114633448
jvm_old_size_bytes{type="max"} 7455834112
# HELP  jvm_gc jvm gc stat
# TYPE  jvm_gc gauge
<GarbageCollector>{type="count"} 247
<GarbageCollector>{type="time"} 860
# HELP  jvm_thread jvm thread stat
# TYPE  jvm_thread gauge
jvm_thread{type="count"} 162
jvm_thread{type="peak_count"} 205
jvm_thread{type="new_count"} 0
jvm_thread{type="runnable_count"} 48
jvm_thread{type="blocked_count"} 1
jvm_thread{type="waiting_count"} 41
jvm_thread{type="timed_waiting_count"} 72
jvm_thread{type="terminated_count"} 0
...
```

데이터는 [Prometheus 형식](https://prometheus.io/docs/practices/naming/)으로 표시됩니다. 한 항목을 예로 살펴보겠습니다.

```text
# HELP  jvm_heap_size_bytes jvm heap stat
# TYPE  jvm_heap_size_bytes gauge
jvm_heap_size_bytes{type="max"} 8476557312
jvm_heap_size_bytes{type="committed"} 1007550464
jvm_heap_size_bytes{type="used"} 156375280
```

각 필드의 의미는 다음과 같습니다.

1. `#`으로 시작하는 줄은 주석입니다. `HELP`는 메트릭에 대한 설명이며, `TYPE`은 메트릭의 데이터 유형을 나타냅니다. 이 예의 유형은 스칼라 값인 `Gauge`입니다. 다른 데이터 유형으로는 `Counter`와 `Histogram`이 있습니다. 자세한 내용은 [Prometheus 공식 문서](https://prometheus.io/docs/practices/instrumentation/#counter-vs.-gauge,-summary-vs.-histogram)를 참조하세요.
2. `jvm_heap_size_bytes`는 메트릭 이름(Key)입니다. `type="max"`는 이름이 `type`이고 값이 `max`인 Label입니다. 하나의 메트릭에 여러 Label을 지정할 수 있습니다.
3. 마지막 숫자 `8476557312`는 메트릭의 실제 값입니다.

## 모니터링 시스템 구축 {#setting-up-the-monitoring-system}

Doris를 배포한 후 다음 순서로 모니터링 시스템을 구축합니다.

1. Prometheus를 배포하고 FE와 BE의 `/metrics` 엔드포인트에서 메트릭을 수집하도록 구성합니다.
2. Grafana를 배포하고 Prometheus를 데이터 소스로 구성합니다.
3. Grafana에서 공식 Doris 대시보드 템플릿을 가져옵니다.
4. Grafana 페이지에서 대시보드를 확인하고 필요에 따라 조정합니다.

### Prometheus 배포 {#deploying-prometheus}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Setting up monitoring for the first time -->

#### 1. 다운로드 및 압축 해제 {#1-download-and-extract}

[Prometheus 공식 웹사이트](https://prometheus.io/download/)에서 최신 버전의 Prometheus를 다운로드합니다. 여기서는 `2.43.0-linux-amd64` 버전을 예로 사용합니다. 모니터링 서비스를 실행할 머신에서 다운로드한 tar 파일의 압축을 해제합니다.

#### 2. 구성 파일 작성 {#2-write-the-configuration-file}

구성 파일 `prometheus.yml`을 엽니다. 이 파일은 YAML 형식이므로 들여쓰기와 공백을 일관되게 사용해야 합니다. 여기서는 가장 간단한 정적 파일 방식으로 모니터링을 구성합니다. Prometheus는 노드 추가와 제거를 동적으로 감지할 수 있는 다양한 [서비스 검색](https://prometheus.io/docs/prometheus/latest/configuration/configuration/) 방식도 지원합니다.

구성 예시:

```yaml
# my global config
global:
  scrape_interval:     15s # Global scrape interval, default is 1m, set to 15s here
  evaluation_interval: 15s # Global rule evaluation interval, default is 1m, set to 15s here

# Alertmanager configuration
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      # - alertmanager:9093

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'DORIS_CLUSTER' # Each Doris cluster is called a job. You can give the job a name here as the name of the Doris cluster in the monitoring system.
    metrics_path: '/metrics' # Specify the RESTful API path for retrieving metrics. Combined with the host:port in targets below, Prometheus eventually scrapes metrics via host:port/metrics_path.
    static_configs: # Configure the target addresses of FE and BE separately. All FEs and BEs are written into their respective groups.
      - targets: ['fe_host1:8030', 'fe_host2:8030', 'fe_host3:8030']
        labels:
          group: fe # The fe group is configured here, containing 3 Frontends.

      - targets: ['be_host1:8040', 'be_host2:8040', 'be_host3:8040']
        labels:
          group: be # The be group is configured here, containing 3 Backends.

  - job_name: 'DORIS_CLUSTER_2' # You can monitor multiple Doris clusters in one Prometheus. Another Doris cluster configuration starts here. Configuration is the same as above; details omitted.
    metrics_path: '/metrics'
    static_configs:
      - targets: ['fe_host1:8030', 'fe_host2:8030', 'fe_host3:8030']
        labels:
          group: fe

      - targets: ['be_host1:8040', 'be_host2:8040', 'be_host3:8040']
        labels:
          group: be
```

주요 필드:

| 필드 | 설명 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `scrape_interval` | 전역 메트릭 수집 간격입니다. `15s`를 권장합니다. |
| `evaluation_interval` | 전역 규칙 평가 간격입니다. `15s`를 권장합니다. |
| `job_name` | 각 Doris 클러스터는 하나의 job에 대응하며, 이 이름은 모니터링 시스템에서 클러스터를 식별하는 데 사용됩니다. |
| `metrics_path` | 메트릭 엔드포인트 경로입니다. `/metrics`로 고정합니다. |
| `static_configs.targets` | FE/BE 노드의 `host:port` 목록입니다. FE의 기본 포트는 `8030`, BE의 기본 포트는 `8040`입니다. |
| `labels.group` | 노드 그룹 Label입니다. `fe`와 `be`를 권장합니다. |

#### 3. Prometheus 시작 {#3-start-prometheus}

다음 명령으로 Prometheus를 백그라운드에서 시작하고 웹 포트를 `8181`로 설정합니다.

```shell
nohup ./prometheus --web.listen-address="0.0.0.0:8181" &
```

Prometheus는 시작 직후 데이터를 수집하기 시작하며, 수집한 데이터는 `data` 디렉터리에 저장합니다.

#### 4. Prometheus 중지 {#4-stop-prometheus}

현재 Prometheus는 프로세스를 중지하는 공식적인 방법을 제공하지 않습니다. `kill -9`를 직접 사용할 수 있습니다. Prometheus를 서비스로 등록해 서비스 방식으로 시작하거나 중지할 수도 있습니다.

#### 5. Prometheus 접속 {#5-access-prometheus}

브라우저에서 `8181` 포트에 접속해 Prometheus 페이지를 엽니다. 탐색 모음에서 `Status`(상태) -> `Targets`(대상)를 클릭하면 job별로 그룹화된 모든 모니터링 대상 호스트 노드를 확인할 수 있습니다. 정상 상태에서는 모든 노드가 `UP`으로 표시되어야 하며, 이는 데이터 수집이 정상적으로 작동한다는 뜻입니다. `Endpoint`(엔드포인트)를 클릭하면 현재 모니터링 값을 확인할 수 있습니다.

노드 상태가 `UP`이 아니면 먼저 Doris의 `/metrics` 엔드포인트에 접근할 수 있는지 확인하세요([모니터링 데이터 형식](#monitoring-data-format) 참조). 또는 Prometheus 문서를 참조해 문제를 해결하세요.

고급 사용 방법은 Prometheus [공식 문서](https://prometheus.io/docs/introduction/overview/)를 참조하세요.

### Grafana 배포 {#deploying-grafana}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Setting up monitoring for the first time -->

#### 1. 다운로드 및 압축 해제 {#1-download-and-extract-1}

[Grafana 공식 웹사이트](https://grafana.com/grafana/download)에서 최신 버전의 Grafana를 다운로드합니다. 여기서는 `8.5.22.linux-amd64` 버전을 예로 사용합니다. 모니터링 서비스를 실행할 머신에서 다운로드한 tar 파일의 압축을 해제합니다.

#### 2. 구성 파일 작성 {#2-write-the-configuration-file-1}

구성 파일 `conf/defaults.ini`를 엽니다. 다음 구성 항목만 확인하고 나머지는 기본값을 사용합니다.

```ini
# Path to where grafana can store temp files, sessions, and the sqlite3 db (if that is used)
data = data

# Directory where grafana can store logs
logs = data/log

# Protocol (http, https, socket)
protocol = http

# The ip address to bind to, empty will bind to all interfaces
http_addr =

# The http port to use
http_port = 8182
```

#### 3. Grafana 시작 {#3-start-grafana}

다음 명령으로 Grafana를 백그라운드에서 시작합니다. 접속 포트는 위에서 구성한 `8182`입니다.

```shell
nohup ./bin/grafana-server &
```

#### 4. Grafana 중지 {#4-stop-grafana}

현재 Grafana는 프로세스를 중지하는 공식적인 방법을 제공하지 않습니다. `kill -9`를 직접 사용할 수 있습니다. Grafana를 서비스로 등록해 서비스 방식으로 시작하거나 중지할 수도 있습니다.

#### 5. Grafana 접속 {#5-access-grafana}

브라우저에서 `8182` 포트에 접속해 Grafana 페이지를 엽니다. 기본 사용자 이름과 비밀번호는 모두 `admin`입니다.

#### 6. 데이터 소스 구성 {#6-configure-the-data-source}

처음 로그인한 후 안내에 따라 데이터 소스를 구성합니다. 여기서 데이터 소스는 이전 단계에서 배포한 Prometheus 인스턴스입니다.

데이터 소스 구성의 설정 페이지는 다음과 같습니다.

| 필드 | 설명 |
| ------------- | ------------------------------------------------------------------------------------ |
| 이름(Name) | 데이터 소스의 사용자 지정 이름입니다. 예: `doris_monitor_data_source`. |
| 유형(Type) | `Prometheus`를 선택합니다. |
| URL | Prometheus의 웹 주소를 입력합니다. 예: `http://host:8181`. |
| 접근 방식(Access) | Grafana가 실행되는 서버를 통해 Prometheus에 접근하도록 `Server`(서버) 모드를 선택합니다. |
| 기타 옵션 | 기본값을 유지합니다. |

페이지 하단의 `Save & Test`(저장 및 테스트)를 클릭합니다. `Data source is working`(데이터 소스가 정상적으로 작동 중)이 표시되면 데이터 소스를 사용할 수 있습니다.

#### 7. 대시보드 가져오기 {#7-import-the-dashboard}

데이터 소스를 사용할 수 있는지 확인한 후 다음 단계에 따라 공식 Doris 대시보드 템플릿을 가져옵니다.

1. 왼쪽 탐색 모음에서 `+` 아이콘을 클릭해 대시보드 추가를 시작합니다.
2. 이 문서의 [대시보드 템플릿 다운로드](#dashboard-template-download)에서 제공하는 JSON 파일을 다운로드합니다.
3. 상단에서 `New dashboard`(새 대시보드) -> `Import dashboard`(대시보드 가져오기) -> `Upload .json File`(.json 파일 업로드)을 클릭하고 다운로드한 JSON 파일을 가져옵니다.
4. 가져온 후 대시보드 이름을 지정할 수 있습니다. 기본 이름은 `Doris Overview`(Doris 개요)입니다. 데이터 소스를 선택할 때는 앞서 생성한 `doris_monitor_data_source`를 선택합니다.
5. `Import`(가져오기)를 클릭하면 가져오기가 완료되고 Doris 대시보드가 표시됩니다.

고급 사용 방법은 Grafana [공식 문서](http://docs.grafana.org/)를 참조하세요.

## 대시보드 설명 {#dashboard-description}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenarios: Reading and using the dashboard -->

대시보드 내용은 버전 업데이트에 따라 달라질 수 있습니다. 이 문서의 내용이 최신 상태임을 보장하지는 않습니다.

### 상단 표시줄 {#top-bar}

![상단 표시줄](/images/dashboard_navibar.png)

| 요소 | 설명 |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| 왼쪽 상단 | 대시보드 이름입니다. |
| 오른쪽 상단 | 현재 모니터링 시간 범위입니다. 드롭다운에서 다른 시간 범위를 선택하고 자동 새로고침 간격을 지정할 수 있습니다. |
| `cluster_name` | Prometheus 구성 파일의 각 `job_name`에 대응하며 Doris 클러스터를 나타냅니다. 선택을 변경하면 아래 차트에 선택한 클러스터의 모니터링 정보가 표시됩니다. |
| `fe_master` | 해당 클러스터의 Master Frontend 노드입니다. |
| `fe_instance` | 해당 클러스터의 모든 Frontend 노드입니다. 선택을 변경하면 아래 차트에 선택한 Frontend의 모니터링 정보가 표시됩니다. |
| `be_instance` | 해당 클러스터의 모든 Backend 노드입니다. 선택을 변경하면 아래 차트에 선택한 Backend의 모니터링 정보가 표시됩니다. |
| `interval` | 변화율 관련 메트릭의 샘플링 간격입니다. 참고: 간격을 `15s`로 설정하면 일부 차트가 비어 있을 수 있습니다. |

### 행(Row) {#row}

![행](/images/dashboard_row.png)

Grafana에서 Row는 차트 그룹을 뜻합니다. 위 그림의 개요(Overview)와 클러스터 개요(Cluster Overview)가 그 예입니다. Row를 클릭하면 접을 수 있습니다. 현재 대시보드에는 다음 Row가 포함되어 있으며, 지속적으로 업데이트됩니다.

| 행 | 설명 |
| ------------------ | ------------------------------------------------- |
| 개요(Overview) | 모든 Doris 클러스터의 집계 뷰입니다. |
| 클러스터 개요(Cluster Overview) | 선택한 클러스터의 집계 뷰입니다. |
| 쿼리 통계(Query Statistic) | 선택한 클러스터의 쿼리 관련 모니터링 정보입니다. |
| FE JVM | 선택한 Frontend의 JVM 모니터링 정보입니다. |
| BE | 선택한 클러스터에 있는 Backend의 집계 뷰입니다. |
| BE 작업(BE Task) | 선택한 클러스터의 Backend 작업 정보입니다. |

### 차트 {#charts}

![차트](/images/dashboard_panel.png)

일반적인 차트에는 다음 요소가 포함됩니다.

1. 왼쪽 상단의 `i` 아이콘 위에 마우스를 올리면 차트 설명을 확인할 수 있습니다.
2. 차트 아래의 범례를 클릭하면 해당 메트릭만 표시됩니다. 다시 클릭하면 모든 메트릭이 다시 표시됩니다.
3. 차트 안에서 드래그해 시간 범위를 선택할 수 있습니다.
4. 제목의 `[]` 안에는 선택한 클러스터 이름이 표시됩니다.
5. 일부 값은 왼쪽 Y축에, 다른 값은 오른쪽 Y축에 대응합니다. 범례 끝의 `-right` 접미사로 구분할 수 있습니다.
6. 차트 이름 -> `Edit`(편집)을 클릭하면 차트를 편집할 수 있습니다.

## 대시보드 업데이트 {#dashboard-update}

공식 대시보드 템플릿이 업데이트되면 다음 단계에 따라 기존 대시보드를 덮어씁니다.

1. Grafana 왼쪽 표시줄에서 `+` 아이콘을 클릭한 후 `Dashboard`(대시보드)를 클릭합니다.
2. 왼쪽 상단의 `New dashboard`(새 대시보드)를 클릭한 후 오른쪽의 `Import dashboard`(대시보드 가져오기)를 클릭합니다.
3. `Upload .json File`(.json 파일 업로드)을 클릭하고 최신 템플릿 파일을 선택합니다.
4. 데이터 소스를 선택합니다.
5. `Import (Overwrite)`(가져오기 및 덮어쓰기)를 클릭해 템플릿 업데이트를 완료합니다.

## 자주 묻는 질문 {#faq}

### 질문: Prometheus의 `Targets`(대상)에서 노드 상태가 `DOWN`으로 표시됩니다. 어떻게 해야 하나요? {#q-a-node-status-in-prometheus-targets-is-down-what-should-i-do}

Prometheus 서버에서 FE/BE 노드로 네트워크 연결이 가능한지 확인하세요. 대상 주소와 포트가 올바른지, `/metrics` 엔드포인트에 직접 접근할 수 있는지 확인하세요.

### 질문: 브라우저에서 FE/BE의 `/metrics`에 접근할 수 없습니다. 어떻게 해야 하나요? {#q-the-browser-cannot-access-metrics-on-febe-what-should-i-do}

FE의 `http_port`(기본값 `8030`)와 BE의 `webserver_port`(기본값 `8040`)가 열려 있는지, 노드 프로세스가 정상적으로 실행 중인지 확인하세요.

### 질문: Grafana에 `Data source is not working`(데이터 소스가 작동하지 않음)이 표시됩니다. 어떻게 해야 하나요? {#q-grafana-shows-data-source-is-not-working-what-should-i-do}

Grafana 데이터 소스 URL이 Prometheus의 실제 수신 대기 주소와 일치하는지 확인하고, Grafana 서버에서 Prometheus에 네트워크로 접근할 수 있는지 확인하세요.

### 질문: 대시보드의 일부 차트가 비어 있습니다. 어떻게 해야 하나요? {#q-some-charts-in-the-dashboard-are-empty-what-should-i-do}

`interval`이 너무 작게 설정되어 있는지 확인하세요. 예를 들어 `15s`로 설정하면 변화율 유형의 차트에 데이터가 표시되지 않을 수 있습니다. Prometheus가 관련 job의 메트릭을 정상적으로 수집했는지도 확인하세요.

### 질문: YAML 구성 파일을 파싱하지 못합니다. 어떻게 해야 하나요? {#q-the-yaml-configuration-file-fails-to-parse-what-should-i-do}

YAML은 들여쓰기와 공백을 엄격하게 구분합니다. 들여쓰기에 Tab 문자를 사용했는지, 들여쓰기 수준이 일관되지 않은지 확인하세요.

### 질문: Broker 노드의 모니터링 데이터가 없습니다. 어떻게 해야 하나요? {#q-there-is-no-monitoring-data-for-broker-nodes-what-should-i-do}

현재 버전의 Broker는 `/metrics` 엔드포인트를 제공하지 않습니다.
