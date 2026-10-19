---
{
    "title": "Kubernetes에 배포하기",
    "sidebar_label": "Kubernetes에 배포하기",
    "language": "ko",
    "description": "Kubernetes에 DOG Stack을 배포하고 클러스터의 컨테이너 로그, 메트릭, 이벤트를 수집하는 방법을 알아봅니다. 이 문서에서는 Helm을 사용하여 DOG Stack 백엔드(OpenTelemetry 게이트웨이, Apache Doris, Grafana)와 Kubernetes 수집기를 설치하고, 검증, 로그 파싱 규칙, 운영 환경 설정, 문제 해결 방법을 다룹니다.",
    "keywords": [
        "DOG Stack",
        "Kubernetes",
        "Helm",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "Kubernetes 로그 수집",
        "관측 가능성"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack Kubernetes deployment and cluster collection -->

이 문서에서는 Helm을 사용하여 Kubernetes에 DOG Stack을 배포하고, 클러스터의 컨테이너 로그, kubelet·노드·클러스터 메트릭, Kubernetes 이벤트를 수집하는 방법을 설명합니다. 단계를 모두 완료하면 Doris에서 데이터를 쿼리하고 Grafana 대시보드에서 확인할 수 있습니다. 단일 호스트에 배포하려면 [Docker Compose로 배포하기](./docker.md)를 참고하세요.

Kubernetes의 DOG Stack은 서로 독립적인 두 Helm 차트로 구성됩니다.

| 차트 | 역할 | 워크로드 |
| --- | --- | --- |
| `ai-observe-stack` | DOG Stack 백엔드입니다. 한 번 설치합니다. OTLP 데이터를 수신하여 Doris에 기록하고 Grafana에 표시합니다. 자체적으로 데이터를 수집하지는 않습니다. | OpenTelemetry 게이트웨이(StatefulSet), Doris App 플러그인이 포함된 Grafana(Deployment), 선택적으로 Doris Operator가 관리하는 Doris 클러스터 |
| `dog-k8s-collector` | Kubernetes 수집기입니다. 수집 대상 클러스터마다 한 번 설치하고 게이트웨이를 가리키도록 설정합니다. | agent(DaemonSet, 노드당 하나): 컨테이너 로그, kubelet 및 노드 메트릭, 노드 로컬 OTLP 진입점. cluster(Deployment, 클러스터당 하나): 클러스터 메트릭 및 Kubernetes 이벤트 |

데이터 흐름은 다음과 같습니다.

```text
applications (OTLP SDK) ───────┐
                               │ OTLP
dog-k8s-collector ─────────────┤
  agent   (DaemonSet)          │
  cluster (Deployment)         ▼
ai-observe-stack
  gateway  OpenTelemetry Collector  receives OTLP, writes Doris
  doris    Apache Doris             stores logs, metrics, traces
  grafana  Grafana + Doris App      shows them
```

두 차트 사이에는 Helm 종속성이 없으므로 각각 별도로 설치하고 업그레이드합니다. 여러 Kubernetes 클러스터에서 하나의 DOG Stack으로 데이터를 보낼 수 있으며, 클러스터 이름으로 각 클러스터를 구분합니다.

:::tip
DOG Stack이 이미 실행 중이라면(이 차트로 설치했거나, 다른 방식으로 배포했거나, 다른 클러스터에서 실행 중인 경우) [2단계: Kubernetes 수집기 설치](#step-2-install-the-kubernetes-collector)로 이동하세요. 해당 게이트웨이의 OTLP gRPC 주소만 있으면 됩니다.
:::

이 가이드는 AI Observe Stack 커밋 [`2c1fbee83170`](https://github.com/ai-observe/ai-observe-stack/tree/2c1fbee831701178c7dddba857e88130ef292949)을 기준으로 검증했습니다. 아래 체크아웃 명령은 이 리비전으로 고정하므로 이후 main 브랜치의 변경 사항이 매개변수에 영향을 주지 않습니다. 해당 Helm 차트 버전은 `0.2.0`이며 기본 Doris 이미지는 `4.0.3`을 사용합니다.

## 사전 요구 사항 {#prerequisites}

- Kubernetes 1.24 이상, Helm 3.8 이상이 필요하며, 클러스터에 접근할 수 있도록 `kubectl`이 구성되어 있어야 합니다.
- 클러스터 수준의 RBAC 권한이 필요합니다. 수집기는 ClusterRole과 ClusterRoleBinding을 생성합니다.
- 기본 게이트웨이 전송 큐에 사용할 PersistentVolume 프로비저너가 필요합니다. 외부 Doris를 사용하는 경우에도 필요합니다. 일회성 테스트에서는 대신 `gateway.persistence.enabled`를 비활성화할 수 있습니다. 이 경우 Pod가 교체되면 큐에 있는 데이터가 손실됩니다.
- 노드에서 `otel/opentelemetry-collector-contrib`, `otel/opentelemetry-collector-k8s`, `grafana/grafana`, `velodb/doris-app-plugin`, `busybox` 이미지를 가져올 수 있어야 합니다. 프라이빗 레지스트리를 사용하려면 `global.imagePullSecrets`를 `ai-observe-stack`에 설정하고 `imagePullSecrets`를 `dog-k8s-collector`에 설정한 다음, 이미지 매개변수가 미러를 가리키도록 설정합니다. `gateway.image.repository`, `grafana.image.repository`, `dorisPlugin.image.repository`, `global.helperImages.busybox` / `global.helperImages.curl`은 `ai-observe-stack`에서, `agent.image.repository`와 `cluster.image.repository`는 `dog-k8s-collector`에서 설정합니다.
- Doris는 다음 중 하나를 준비합니다.
  - Kubernetes 클러스터에서 FE 포트 9030(MySQL 프로토콜)과 8030(HTTP)에 접근할 수 있는 기존 Doris 클러스터와, 대상 데이터베이스 및 테이블 생성, 데이터 적재, Grafana 테이블 쿼리가 가능한 계정이 필요합니다. 게이트웨이는 Stream Load를 통해 데이터를 기록합니다. FE는 각 요청을 BE가 Doris에 등록한 주소(`SHOW BACKENDS`로 확인 가능)의 BE로 리디렉션하므로, 게이트웨이 Pod에서 이 BE 주소와 BE HTTP 포트(기본값 8040)에도 접근할 수 있어야 합니다.
  - 또는 차트가 Doris를 배포하도록 할 수 있습니다. 이 경우 PersistentVolume 프로비저너가 필요하며, FE와 BE 각각에 최소 2코어의 CPU와 4 GiB의 메모리가 필요합니다.

이 문서의 명령은 릴리스 이름과 네임스페이스로 각각 `dog`와 `dog`를 사용합니다. 아래 오브젝트 이름은 이 이름을 기준으로 생성됩니다. 다른 이름을 사용하는 경우 알맞게 바꾸세요.

| 오브젝트 | 이름 |
| --- | --- |
| 게이트웨이 StatefulSet 및 Service | `dog-ai-observe-stack-otel-gateway` |
| Grafana Deployment 및 Service | `dog-ai-observe-stack-grafana` |
| Grafana 관리자 Secret | `dog-ai-observe-stack-grafana-admin` |
| DorisCluster(차트가 Doris를 배포하는 경우) | `dog-ai-observe-stack-doris` |
| 수집기 agent DaemonSet | `dog-k8s-collector-agent` |
| 수집기 cluster Deployment | `dog-k8s-collector-cluster` |

## 차트 가져오기 {#get-the-charts}

저장소를 복제하고 차트 종속성을 다운로드합니다. Doris Operator 하위 차트가 차트의 종속성에 선언되어 있으므로, 기존 Doris에 연결하는 경우에도 이 단계가 필요합니다. `helm dependency update`를 사용하면 `helm repo add`를 실행할 필요가 없습니다.

```Bash
git clone https://github.com/ai-observe/ai-observe-stack.git
cd ai-observe-stack
git checkout 2c1fbee831701178c7dddba857e88130ef292949
cd helm-charts
helm dependency update ./ai-observe-stack
```

이후의 모든 명령은 `helm-charts` 디렉터리에서 실행합니다.

## 1단계: DOG Stack 백엔드 설치 {#step-1-install-the-dog-stack-backend}

Doris를 실행할 위치를 선택합니다.

| | 옵션 A: 기존 Doris 사용 | 옵션 B: 차트로 Doris 배포 |
| --- | --- | --- |
| 적합한 환경 | 기존 Doris 또는 SelectDB 클러스터가 있는 환경, 운영 환경 | Doris가 없는 테스트 및 개발 환경 |
| 데이터 위치 | 사용자의 Doris 클러스터 | Kubernetes 클러스터 내부의 PVC |

### 옵션 A: 기존 Doris 사용 {#option-a-use-an-existing-doris}

1. 네임스페이스를 생성하고 Doris 계정을 Secret에 저장합니다. Secret에는 `username`과 `password` 키가 있어야 합니다.

   ```Bash
   kubectl create namespace dog
   kubectl create secret generic doris-credentials -n dog \
     --from-literal=username='<DORIS_USER>' --from-literal=password='<DORIS_PASSWORD>'
   ```

2. values 파일 `dog-values.yaml`을 생성합니다.

   ```yaml
   doris:
     mode: external
     database: otel                  # the gateway creates this database and its tables
     external:
       host: <DORIS_FE_HOST>         # FE address reachable from the cluster
       port: 9030                    # MySQL protocol port
       feHttpPort: 8030              # HTTP port, used by Stream Load
       existingSecret: doris-credentials
     internal:
       operator:
         enabled: false              # do not install the Doris Operator
   ```

   저장소의 `examples/ai-observe-stack/minimal-external-doris.yaml`에서도 같은 파일을 확인할 수 있습니다.

3. 설치합니다.

   ```Bash
   helm install dog ./ai-observe-stack -n dog -f dog-values.yaml
   ```

### 옵션 B: 차트로 Doris 배포 {#option-b-the-chart-deploys-doris}

저장소는 두 가지 규모의 구성을 제공합니다.

- `examples/ai-observe-stack/dev.yaml`: FE 하나와 BE 하나, 영구 저장소 없음, 게이트웨이 하나, 디버그 출력 활성화. 테스트용으로만 사용합니다.
- `examples/ai-observe-stack/prod.yaml`: FE 세 개와 BE 세 개, 영구 저장소, 게이트웨이 세 개, Ingress. 운영 환경 구성의 출발점으로 사용할 수 있습니다. 사용하기 전에 환경별 설정을 조정하세요. 조정할 항목은 `storageClass`(AWS의 `gp3`로 설정되어 있음), Ingress 클래스, 호스트, TLS 발급자, Grafana 비밀번호(`CHANGE_ME`)입니다.

```Bash
cp examples/ai-observe-stack/dev.yaml dog-values.yaml
helm install dog ./ai-observe-stack -n dog --create-namespace -f dog-values.yaml
```

나중에 업그레이드할 때 사용할 수 있도록 `dog-values.yaml`을 보관하세요. 운영 환경에서는 대신 `prod.yaml`을 복사하고, 설치 전에 위에 나열한 환경별 설정을 조정하세요.

Doris FE와 BE가 이미지를 가져오고 초기화하는 데는 이 분에서 오 분 정도 걸립니다. 게이트웨이는 FE 포트 9030과 8030에 접근할 수 있고 최소 하나의 BE가 온라인 상태가 될 때까지 기다린 후 시작합니다.

:::caution
Doris Operator는 클러스터 범위에서 동작하며, 하나의 Kubernetes 클러스터에서는 하나만 실행할 수 있습니다. 같은 클러스터에 두 번째 DOG Stack을 설치할 때는 `doris.internal.operator.enabled: false`로 설정하세요.
:::

### 백엔드 검증 {#verify-the-backend}

설치가 완료되면 Helm은 NOTES를 출력합니다. 여기에는 게이트웨이의 OTLP gRPC 주소인 `dog-ai-observe-stack-otel-gateway.dog.svc:4317`이 포함되어 있습니다. 2단계에서 사용할 수 있도록 기록해 두세요.

1. Pod가 실행 중인지 확인합니다. 게이트웨이 Pod(기본 복제본 두 개를 사용하는 경우 `dog-ai-observe-stack-otel-gateway-0`과 `-1`, `dev.yaml`은 하나 실행), Grafana Pod, 옵션 B를 사용하는 경우 Doris FE 및 BE Pod가 모두 `Running` 상태여야 합니다.

   ```Bash
   kubectl get pods -n dog
   ```

2. 내장 파이프라인 테스트를 실행합니다. 이 테스트는 게이트웨이를 통해 로그 레코드를 보내고 Doris에 도착하는지 확인합니다.

   ```Bash
   helm test dog -n dog --logs
   ```

   출력은 `OK: record found in Doris`로 끝납니다.

3. Grafana 관리자 비밀번호를 가져옵니다(기본값 `admin`).

   ```Bash
   kubectl get secret -n dog dog-ai-observe-stack-grafana-admin -o jsonpath='{.data.admin-password}' | base64 -d; echo
   ```

4. Grafana에 접속합니다.

   ```Bash
   kubectl port-forward -n dog svc/dog-ai-observe-stack-grafana 3000:3000
   ```

   http://localhost:3000 을 열고 위에서 확인한 비밀번호로 `admin` 계정에 로그인합니다. 아직 게이트웨이로 데이터를 보내는 대상이 없으므로 이 시점에는 대시보드가 비어 있습니다.

## 2단계: Kubernetes 수집기 설치 {#step-2-install-the-kubernetes-collector}

1단계에서 설치한 백엔드는 데이터 수신만 담당합니다. 수집기는 Kubernetes 클러스터에서 데이터를 수집하여 게이트웨이로 보냅니다. 각 노드에서 agent가 모든 컨테이너의 stdout과 stderr를 읽고 kubelet 및 노드 메트릭을 수집하며, cluster 수집기는 클러스터 수준의 메트릭과 Kubernetes 이벤트를 수집합니다. 모든 레코드에는 Pod, 네임스페이스, 워크로드, 클러스터 이름이 포함됩니다. 수집기가 없으면 게이트웨이에 직접 OTLP를 보내는 애플리케이션의 데이터만 DOG Stack에 도달하며, 컨테이너 로그, 노드 및 클러스터 메트릭, 이벤트는 수집되지 않습니다. 관측할 Kubernetes 클러스터마다 수집기 릴리스를 하나씩 설치하세요.

수집 대상 클러스터에 네임스페이스를 준비합니다. 1단계를 건너뛴 경우에도 다음 멱등 명령을 실행하세요.

```Bash
kubectl create namespace dog --dry-run=client -o yaml | kubectl apply -f -
```

1. 수집 대상 클러스터에서 게이트웨이에 접근할 수 있는지 확인합니다. 주소를 실제 환경의 주소로 바꾸세요.

   ```Bash
   kubectl run -it --rm otlp-check --image=busybox:1.36 --restart=Never -- \
     sh -c 'sleep 2; nc -zv dog-ai-observe-stack-otel-gateway.dog.svc 4317'
   ```

   출력에 `open`이 있으면 게이트웨이에 접근할 수 있다는 뜻입니다. 게이트웨이 주소는 DOG Stack이 실행되는 위치에 따라 달라집니다.

   | DOG Stack 위치 | 게이트웨이 주소(`host:port` 형식, `http://` 제외) |
   | --- | --- |
   | 같은 클러스터에 이 차트로 설치한 경우 | `<release>-ai-observe-stack-otel-gateway.<namespace>.svc:4317` |
   | Doris exporter가 포함된 자체 OpenTelemetry Collector | 해당 수집기의 OTLP gRPC Service. 일반적으로 `<service>.<namespace>.svc:4317` |
   | 다른 Kubernetes 클러스터 | LoadBalancer(`gateway.service.type: LoadBalancer`) 또는 별도로 구성한 gRPC ingress를 통해 노출된 게이트웨이의 gRPC 주소. 이 차트의 Ingress는 OTLP/HTTP를 노출하며 OTLP/gRPC를 노출하지 않습니다. 선택한 포트는 클러스터 간에 접근할 수 있어야 합니다 |

2. agent는 root로 실행되며 노드의 `/var/log/pods`, `/`(읽기 전용), `/var/lib/otelcol`을 마운트합니다. 네임스페이스에서 `restricted` Pod Security Standard를 적용하고 있다면 제한을 완화합니다.

   ```Bash
   kubectl label namespace dog pod-security.kubernetes.io/enforce=privileged --overwrite
   ```

3. values 파일 `collector-values.yaml`을 생성합니다.

   ```yaml
   gateway:
     endpoint: dog-ai-observe-stack-otel-gateway.dog.svc:4317
   clusterName: my-cluster
   platform: generic
   ```

   | 매개변수 | 필수 여부 | 기본값 | 설명 |
   | --- | --- | --- | --- |
   | `gateway.endpoint` | 예 | 없음 | 게이트웨이의 OTLP gRPC 주소. `host:port` 형식입니다. |
   | `clusterName` | 아니요 | 릴리스 이름 | 클러스터를 구분하기 위해 모든 레코드에 `k8s.cluster.name`으로 기록됩니다. |
   | `platform` | 아니요 | `generic` | `generic`, `k3s`, `eks`, `gke`, `aks`, `ack`, `openshift` 중 하나입니다. 클라우드 리소스 감지기와 journald 유닛 이름을 선택합니다. 확실하지 않으면 `generic`을 사용하세요. |
   | `timezone` | 아니요 | `UTC` | 타임스탬프에 시간대가 없는 로그 행에 적용할 IANA 시간대입니다. 파싱 규칙에서 `timestamp.timezone`으로 재정의할 수 있습니다. |

4. 설치합니다.

   ```Bash
   helm install dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
   ```

수집기는 기본적으로 다음 수집 프리셋을 활성화합니다.

| 프리셋 | 기본값 | 수집 대상 | 실행 위치 |
| --- | --- | --- | --- |
| `logsCollection` | 켜짐 | 모든 네임스페이스에 있는 모든 컨테이너의 stdout 및 stderr | agent |
| `kubeletMetrics` | 켜짐 | 노드, Pod, 컨테이너, 볼륨의 CPU, 메모리, 네트워크, 파일 시스템 메트릭과 제한 대비 사용률 | agent |
| `hostMetrics` | 켜짐 | 노드의 CPU, 메모리, 부하, 디스크, 파일 시스템, 네트워크 | agent |
| `otlp` | 켜짐 | 애플리케이션 SDK용 노드 로컬 OTLP 진입점 | agent |
| `clusterMetrics` | 켜짐 | Deployment 가용성, 노드 조건, Pod 단계, 할당량 | cluster |
| `kubernetesEvents` | 켜짐 | Kubernetes 이벤트. 로그로 저장됨 | cluster |
| `prometheusScrape` | 꺼짐 | `prometheus.io/scrape` 어노테이션이 있는 Pod | agent |
| `journald` | 꺼짐 | 노드 저널. `journalctl`이 포함된 이미지 필요 | agent |

:::caution
`examples/ai-observe-stack/dev.yaml`은 게이트웨이의 디버그 출력을 활성화하며, 샘플링된 레코드를 게이트웨이 로그에 출력합니다. 수집기가 같은 클러스터에서 실행되는 경우 게이트웨이의 로그 파일을 제외하세요. 그렇지 않으면 모든 레코드가 다시 수집됩니다.

```yaml
logs:
  excludePaths:
    - /var/log/pods/dog_dog-ai-observe-stack-otel-gateway-*/*/*.log
```
:::

## 3단계: 수집 검증 {#step-3-verify-collection}

1. 수집기 Pod를 확인합니다. 노드마다 agent Pod가 하나씩 있고, cluster Pod는 하나 있습니다.

   ```Bash
   kubectl get pods -n dog -l app.kubernetes.io/instance=dog-k8s-collector -o wide
   ```

   ```text
   NAME                                         READY   STATUS    NODE
   dog-k8s-collector-agent-7x2kq                1/1     Running   node-1
   dog-k8s-collector-agent-p9m4c                1/1     Running   node-2
   dog-k8s-collector-cluster-6f5d9c8b7d-hq2xn   1/1     Running   node-1
   ```

2. agent에서 오류가 보고되지 않는지 확인합니다. 다음 명령은 아무것도 출력하지 않아야 합니다.

   ```Bash
   kubectl logs -n dog ds/dog-k8s-collector-agent | grep '"level":"error"'
   ```

3. Doris에서 데이터를 쿼리합니다. 옵션 A에서는 MySQL 클라이언트를 Doris FE의 포트 9030에 연결합니다. 옵션 B에서는 먼저 FE 포트를 포워딩한 다음 MySQL 클라이언트로 연결합니다.

   ```Bash
   kubectl port-forward -n dog svc/dog-ai-observe-stack-doris-fe-service 9030:9030
   mysql -h127.0.0.1 -P9030 -uroot
   ```

   ```sql
   SELECT service_name, count(*) AS records
   FROM otel.otel_logs
   WHERE timestamp > now() - interval 5 minute
     AND cast(resource_attributes['k8s.cluster.name'] as string) = 'my-cluster'
   GROUP BY 1 ORDER BY 2 DESC;
   ```

   첫 레코드는 agent가 시작된 후 30초 이내에 도착합니다. `service_name`은 Pod를 소유한 워크로드의 이름으로, Deployment, StatefulSet, DaemonSet, CronJob, Job 순서로 조회합니다. 독립 실행형 Pod의 경우 Pod 이름을 사용합니다. Kubernetes 이벤트는 `kubernetes-events`로 표시됩니다. 설치 이후에 기록된 로그 행만 수집하며, 노드에 이미 존재하는 로그 파일은 다시 읽지 않습니다.

4. Grafana를 열고 대시보드를 확인합니다.

   - **로그 탐색기**: 네임스페이스, 서비스, 심각도, 텍스트로 로그를 필터링합니다.
   - **Kubernetes 이벤트**: 경고 수, 주요 원인, 이벤트 테이블을 확인합니다.
   - **K8s 관측 가능성**: 노드와 Pod의 CPU 및 메모리를 확인합니다.
   - **수집기 자체 모니터링**: agent, cluster 수집기, 게이트웨이의 큐 길이, 실패, 거부를 확인합니다.

### 엔드투엔드 예제 {#end-to-end-example}

다음 Pod는 매초 JSON 로그 행을 하나씩 출력하며, 이를 통해 컨테이너 로그에서 Doris까지의 전체 경로를 검증할 수 있습니다.

```Bash
kubectl create namespace demo
kubectl run json-app -n demo --image=busybox:1.36 --restart=Never -- sh -c \
  'i=0; while true; do i=$((i+1)); echo "{\"time\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"info\",\"msg\":\"tick $i\"}"; sleep 1; done'
```

약 30초 후 Doris에서 쿼리합니다.

```sql
SELECT timestamp, severity_text, body, cast(resource_attributes['k8s.pod.name'] as string) AS pod
FROM otel.otel_logs
WHERE cast(resource_attributes['k8s.namespace.name'] as string) = 'demo'
ORDER BY timestamp DESC LIMIT 5;
```

`severity_text`가 `INFO`이고 `body`가 `tick 42`와 같은 행이 있으면 컨테이너 로그가 수집되고, JSON 행이 파싱되었으며, Kubernetes 메타데이터가 추가되었음을 알 수 있습니다. `kubectl delete namespace demo`로 정리합니다.

## 수집 구성 {#configure-collection}

수집 설정을 변경하려면 `collector-values.yaml`을 수정하고 다음 명령을 실행합니다.

```Bash
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

영향을 받는 agent 또는 cluster 수집기만 다시 시작됩니다. `agent.storage.enabled=true`로 설정하면 동일한 노드와 저장 경로에 파일 오프셋이 유지됩니다. 이로써 다시 읽는 양이 줄어들지만 정확히 한 번 전달되는 것을 보장하지는 않습니다. 재시도로 레코드가 중복될 수 있으며, 노드나 저장소 손실 또는 큐 용량 소진으로 데이터가 손실될 수 있습니다.

### 네임스페이스 및 컨테이너 선택 {#select-namespaces-and-containers}

```yaml
logs:
  namespaces:
    include: ["*"]                          # or a list, such as [shop, payment]
    exclude: [kube-system, monitoring]
  containers:
    exclude: [istio-proxy, linkerd-proxy]   # container names, excluded in every namespace
```

제외 설정은 포함 설정보다 우선합니다. 수집기 자체의 Pod는 수집 대상에 포함되지 않습니다.

### 로그 파싱 {#parse-logs}

- **JSON 로그**: `{`로 시작하는 행은 자동으로 파싱됩니다. `level` 또는 `severity`는 `severity_text`로, `message` 또는 `msg`는 `body`로 변환되며, 나머지 키는 `log_attributes`에 저장됩니다. 다른 필드 이름을 사용하려면 `logs.json.severityFields`와 `logs.json.messageFields`를 설정하세요.
- **일반적인 텍스트 형식**: 규칙에서 내장 프리셋을 사용합니다. `selector.container`는 Pod나 Deployment 이름이 아닌 컨테이너 이름과 일치시킵니다.

  ```yaml
  logs:
    rules:
      - name: shop-api
        selector: {namespace: "^shop$", container: "^api$"}
        preset: java-spring
  ```

  | 프리셋 | 형식 |
  | --- | --- |
  | `java-spring` | 스택 트레이스를 합친 Spring Boot 3 기본 콘솔 형식 |
  | `python-logging` | Python `logging.basicConfig` 기본 형식 |
  | `go-zap-console` | zap 콘솔 인코더 |
  | `glog` | C++ 및 Go glog |
  | `nginx-access`, `nginx-error` | nginx combined 액세스 로그 및 오류 로그 |
  | `mysql`, `postgres`, `redis` | 공식 이미지의 기본 형식 |
  | `doris-fe`, `doris-fe-audit`, `doris-be` | Apache Doris FE, FE 감사, BE 로그 |
  | `json-generic` | 한 줄 JSON |

  Doris FE는 런타임 로그와 감사 로그를 같은 컨테이너에 기록합니다. 둘 다 파싱하려면 동일한 선택자를 사용하는 규칙 두 개를 추가하고, 하나에는 `preset: doris-fe`를, 다른 하나에는 `preset: doris-fe-audit`를 지정합니다.

- **사용자 정의 형식**: 이름이 지정된 그룹인 `ts`(타임스탬프), `level`(심각도), `msg`(메시지)를 포함하는 정규 표현식을 작성합니다.

  ```yaml
  logs:
    rules:
      - name: shop-worker
        selector: {namespace: "^shop$", container: "^worker$"}
        regex: '^(?P<ts>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(?P<level>[a-z]+)\s+(?P<msg>(?s:.*))$'
        timestamp: {layout: "%Y-%m-%dT%H:%M:%S.%L%z"}
        severity: {field: level}
        multiline: {firstLinePattern: '^\d{4}-\d{2}-\d{2}T'}   # stack trace lines join the previous record
        drop: ['GET /healthz']                             # dropped on the node
  ```

  로그 행의 타임스탬프에 시간대가 없고 컨테이너가 UTC로 실행되지 않는 경우, `timezone`을 `timestamp`에 추가합니다. 예를 들어 `timestamp: {layout: "...", timezone: Asia/Shanghai}`로 설정합니다. 규칙은 순서대로 비교하며 처음 일치하는 규칙을 적용합니다. 각 레코드의 `dog.log.rule` 속성은 어떤 규칙으로 파싱되었는지 보여 줍니다.

  규칙을 배포하기 전에 저장소의 `hack/test-rule.sh`를 사용하여 샘플 로그로 테스트할 수 있습니다. helm, yq, Docker가 필요합니다.

  ```Bash
  kubectl logs -n shop -l app=worker -c worker --tail=30 > worker.log
  hack/test-rule.sh -f collector-values.yaml -n shop -c worker worker.log
  ```

### 애플리케이션에서 OTLP 수신 {#receive-otlp-from-applications}

OpenTelemetry SDK로 계측한 애플리케이션은 해당 노드의 agent에 트레이스, 메트릭, 로그를 보낼 수 있습니다. agent는 Pod, 네임스페이스, 워크로드 메타데이터를 추가합니다. 노드에 agent 포트를 노출합니다.

```yaml
presets:
  otlp:
    hostPortHttp: 4318
    hostPortGrpc: 4317
```

그런 다음 애플리케이션의 Pod 템플릿에서 엔드포인트를 설정합니다.

```yaml
env:
  - name: HOST_IP
    valueFrom: {fieldRef: {fieldPath: status.hostIP}}
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://$(HOST_IP):4318
  - name: OTEL_EXPORTER_OTLP_PROTOCOL
    value: http/protobuf
  - name: OTEL_SERVICE_NAME
    value: checkout
```

### Prometheus 메트릭 스크레이핑 {#scrape-prometheus-metrics}

`presets.prometheusScrape.enabled: true`로 설정한 다음, 애플리케이션 Pod에 `prometheus.io/scrape: "true"`, `prometheus.io/port`, `prometheus.io/path` 어노테이션을 추가합니다. 메트릭은 `otel_metrics_*` 테이블에 기록되며, `service_name`은 워크로드 이름입니다.

### 여러 클러스터 수집 {#collect-multiple-clusters}

각 클러스터에 수집기 릴리스를 하나씩 설치합니다. `gateway.endpoint`가 같은 게이트웨이를 가리키도록 설정하고(클러스터 간에는 LoadBalancer 또는 별도로 구성한 gRPC ingress 사용), 각 클러스터에 서로 다른 `clusterName`을 지정합니다. 쿼리와 대시보드에서는 `k8s.cluster.name`으로 필터링합니다.

## 운영 환경 권장 사항 {#production-recommendations}

| 항목 | 매개변수 | 설명 |
| --- | --- | --- |
| Doris 복제본 및 디스크 | `doris.internal.cluster.fe.replicas`, `doris.internal.cluster.be.replicas`, `doris.internal.cluster.persistence` | 최소 FE 세 개와 BE 세 개를 사용하고 `gateway.dorisExporter.replicationNum: 3`으로 설정합니다. |
| 게이트웨이 복제본 및 큐 | `gateway.replicas`, `gateway.persistence.size`, `gateway.dorisExporter.sendingQueue` | 각 게이트웨이 복제본은 자체 PVC에 전송 큐를 유지합니다. 데이터 기록이 지연되면 수집기 자체 모니터링 대시보드에서 `otelcol_exporter_queue_size`를 확인하세요. |
| 데이터 보존 기간 | `gateway.dorisExporter.historyDays` | 기본값은 7일입니다. |
| Grafana 비밀번호 | `grafana.adminPassword` 또는 `grafana.existingSecret` | 기본 비밀번호는 `admin`입니다. |
| 외부 접근 | `ingress`, `gateway.service.type` | Grafana에는 Ingress를 사용합니다. 클러스터 외부의 애플리케이션은 OTLP/HTTP Ingress 경로 또는 LoadBalancer를 사용합니다. |
| 디버그 출력 | `gateway.debug.enabled: false` | `dev.yaml`에서는 활성화되어 있습니다. |
| 수집 범위 | `logs.namespaces.exclude` | 일반적으로 `kube-system`을 제외합니다. |
| 수집기 리소스 | `agent.resources`, `agent.queueSize` | 각 agent는 CPU 100m와 메모리 128 MiB를 요청하며, CPU 1개와 메모리 512 MiB로 제한됩니다. 게이트웨이에 접근할 수 없는 동안 각 노드는 로컬 디스크에 최대 `agent.queueSize`개의 레코드(기본값 20,000)를 버퍼링합니다. |

저장소의 `examples/ai-observe-stack/prod.yaml`은 운영 환경 구성의 출발점으로 사용할 수 있는 values 파일입니다.

기본적으로 `gateway.timeGuard.enabled=true`는 기록 가능한 파티션 시간 범위를 벗어난 레코드의 타임스탬프를 수신 시각으로 다시 지정합니다. 로그는 원래 시각을 `log.original_time_unix_nano`에, 트레이스는 `span.original_start_time_unix_nano`에 보존하며, 메트릭 타임스탬프는 직접 덮어씁니다. 과거 데이터를 백필하려면 `gateway.dorisExporter.createHistoryDays`와 time-guard 설정을 함께 검토하세요. Doris 내보내기의 기본 재시도 제한 시간은 10분(`gateway.dorisExporter.retryMaxElapsedTime`)이며, 이 시간이 지나도 실패하는 배치는 로그에 기록한 후 삭제합니다.

## 업그레이드 및 제거 {#upgrade-and-uninstall}

업그레이드하거나 구성을 변경합니다.

```Bash
helm upgrade dog ./ai-observe-stack -n dog -f dog-values.yaml
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

제거합니다.

```Bash
helm uninstall dog-k8s-collector -n dog
helm uninstall dog -n dog
```

수집기를 제거해도 DOG Stack이나 Doris의 데이터에는 영향을 주지 않습니다. 노드의 `/var/lib/otelcol` 아래에 있는 파일 오프셋은 유지되며, 다시 설치하면 마지막 위치에서 이어서 수집합니다. 옵션 A에서는 DOG Stack을 제거해도 사용자의 Doris에 있는 데이터베이스가 삭제되지 않습니다.

Helm은 게이트웨이의 PersistentVolumeClaim, Doris의 PersistentVolumeClaim(영구 저장소를 활성화한 옵션 B), 완료된 `helm test` Pod를 삭제하지 않습니다. 이를 제거하려면 다음 명령을 실행합니다.

```Bash
kubectl delete pvc -n dog -l app.kubernetes.io/instance=dog
kubectl delete pvc -n dog -l 'app.doris.ownerreference/name in (dog-ai-observe-stack-doris-fe,dog-ai-observe-stack-doris-be)'
kubectl delete pod -n dog dog-ai-observe-stack-test-pipeline --ignore-not-found
```

옵션 B에서는 Doris Operator와 함께 설치된 CustomResourceDefinition인 `dorisclusters.doris.selectdb.com`도 Helm이 유지합니다. Helm은 CRD를 삭제하지 않기 때문입니다. CRD를 삭제하면 Kubernetes 클러스터의 모든 DorisCluster가 삭제되므로, Doris Operator가 관리하는 다른 Doris 클러스터가 없을 때만 삭제하세요.

```Bash
kubectl delete crd dorisclusters.doris.selectdb.com
```

## 문제 해결 {#troubleshooting}

| 증상 | 원인 및 해결 방법 |
| --- | --- |
| `helm install`에서 `missing in charts/ directory: doris-operator` 보고 | 차트 종속성을 다운로드하지 않았습니다. `helm dependency update ./ai-observe-stack`을 실행하세요. |
| `helm dependency build`에서 `no repository definition for https://charts.selectdb.com` 보고 | `helm dependency build`는 `helm repo add`로 추가한 저장소만 사용합니다. 대신 `helm dependency update ./ai-observe-stack`을 실행하세요. |
| `helm install`에서 `gateway.endpoint is required` 보고 | 수집기의 `gateway.endpoint`를 게이트웨이 주소로 설정하세요. |
| `helm install`에서 `additional properties 'xxx' not allowed` 보고 | values 파일의 최상위 키에 오타가 있습니다. |
| `helm test`가 실패하거나 게이트웨이 로그에 Doris 오류가 보고됨 | Doris FE 포트 9030과 8030에 접근할 수 있는지, 계정에 대상 데이터베이스/테이블 생성, 데이터 적재, 쿼리 권한이 있는지 확인하세요. `kubectl logs -n dog dog-ai-observe-stack-otel-gateway-0`으로 게이트웨이 로그를 확인하세요. |
| agent Pod에서 `CreateContainerConfigError`가 보고되거나, Pod Security에 의해 거부되거나, `permission denied`가 `/var/log/pods` 관련 로그에 기록됨 | 네임스페이스에 `restricted`가 적용되어 있습니다. `privileged` 레이블을 추가하세요. 2단계를 참고하세요. |
| agent 로그에 `connection refused` 또는 `Unavailable` 보고 | 게이트웨이 주소가 잘못되었거나, 게이트웨이가 중지되었거나, 네트워크 정책이 포트 4317을 차단하고 있습니다. 레코드는 노드에 버퍼링되며 문제가 해결된 후 전송됩니다. |
| agent Pod가 `ContainerCreating` 상태로 유지되고 해당 이벤트에 `MountVolume.SetUp failed for volume "zoneinfo"` 보고 | 노드에 시간대 데이터베이스가 없습니다(일부 최소 운영 체제 이미지에서 발생). `agent.tzdata.hostPath: ""`로 설정하고, `timezone`과 모든 규칙의 `timestamp.timezone`을 UTC로 유지하세요. |
| 특정 네임스페이스에 로그가 없음 | `logs.namespaces.exclude` 또는 `logs.containers.exclude`로 제외되었거나, 설치 후 새 행이 기록되지 않았습니다. |
| 로그는 도착하지만 `service_name`이 비어 있음 | agent가 Pod 메타데이터를 읽을 수 없습니다. agent 로그에 RBAC `forbidden` 오류가 있는지 확인하세요. |
| 파싱 규칙이 적용되지 않음(`dog.log.rule`이 비어 있음) | `selector.container`에 컨테이너 이름 대신 Pod 이름이 들어 있거나, 앞선 규칙이 먼저 일치했습니다. `hack/test-rule.sh`로 검증하세요. |
| 로그 시각이 몇 시간씩 어긋남 | 로그 행에 시간대가 없고, 컨테이너가 UTC로 실행되지 않으며, `timestamp.timezone`이 설정되지 않았습니다. |

agent가 실제로 실행하는 구성을 확인하려면 다음 명령을 실행합니다.

```Bash
kubectl get cm -n dog dog-k8s-collector-agent-config -o jsonpath='{.data.config\.yaml}'
```

두 차트의 모든 매개변수는 각 차트의 `USER_GUIDE.md`와 `values.yaml`을 참고하세요. 이 파일들은 저장소의 [helm-charts](https://github.com/ai-observe/ai-observe-stack/tree/main/helm-charts) 아래에 있습니다.
