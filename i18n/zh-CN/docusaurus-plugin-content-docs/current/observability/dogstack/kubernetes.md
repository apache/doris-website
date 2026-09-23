---
{
    "title": "Kubernetes 部署",
    "sidebar_label": "Kubernetes 部署",
    "language": "zh-CN",
    "description": "如何在 Kubernetes 上部署 DOG Stack 并采集集群的容器日志、指标和 Events？本文使用 Helm 安装 DOG Stack 后端（OpenTelemetry 网关、Apache Doris、Grafana）和 Kubernetes 采集器，并介绍验证方法、日志解析规则、生产配置与问题排查。",
    "keywords": [
        "DOG Stack",
        "Kubernetes",
        "Helm",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "Kubernetes 日志采集",
        "可观测性建设"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 可观测性建设 / DOG Stack Kubernetes 部署与集群采集 -->

本文介绍如何使用 Helm 在 Kubernetes 上部署 DOG Stack，并将集群的容器日志、kubelet / 节点 / 集群指标以及 Kubernetes Events 采集进来。完成后，可以在 Doris 中查询这些数据，并在 Grafana 仪表盘中查看。如果需要在单机上部署，请参见 [Docker Compose 部署](./docker.md)。

Kubernetes 上的 DOG Stack 由两个相互独立的 Helm Chart 组成：

| Chart | 作用 | 工作负载 |
| --- | --- | --- |
| `ai-observe-stack` | DOG Stack 后端，只需安装一次。接收 OTLP 数据、写入 Doris，并通过 Grafana 展示。它本身不采集任何数据。 | OpenTelemetry 网关（StatefulSet）、集成 Doris App 插件的 Grafana（Deployment），以及可选的由 Doris Operator 管理的 Doris 集群 |
| `dog-k8s-collector` | Kubernetes 采集器。在每个需要采集的集群中安装一次，指向网关。 | agent（DaemonSet，每个节点一个）：容器日志、kubelet 与节点指标、节点本地 OTLP 入口；cluster（Deployment，每个集群一个）：集群指标与 Kubernetes Events |

数据流如下：

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

两个 Chart 之间没有 Helm 依赖关系，分别安装、分别升级。多个 Kubernetes 集群可以写入同一个 DOG Stack，通过集群名称区分。

:::tip
如果已经有运行中的 DOG Stack（使用本 Chart 安装、以其他方式部署或位于其他集群），可以直接跳到[步骤 2：安装 Kubernetes 采集器](#step-2-install-the-kubernetes-collector)，只需要知道其网关的 OTLP gRPC 地址。
:::

## 前提条件

- Kubernetes 1.24 及以上版本、Helm 3.8 及以上版本，并已配置 `kubectl` 访问集群。
- 集群级 RBAC 权限：采集器会创建 ClusterRole 和 ClusterRoleBinding。
- 节点能够拉取镜像 `otel/opentelemetry-collector-contrib`、`otel/opentelemetry-collector-k8s`、`grafana/grafana`、`velodb/doris-app-plugin` 和 `busybox`。使用私有镜像仓库时，在 `ai-observe-stack` 中设置 `global.imagePullSecrets`，在 `dog-k8s-collector` 中设置 `imagePullSecrets`，并将镜像参数指向镜像源：`ai-observe-stack` 中的 `gateway.image.repository`、`grafana.image.repository`、`dorisPlugin.image.repository` 以及 `global.helperImages.busybox` / `global.helperImages.curl`；`dog-k8s-collector` 中的 `agent.image.repository` 和 `cluster.image.repository`。
- Doris，以下二选一：
  - 已有 Doris 集群：FE 的 9030（MySQL 协议）和 8030（HTTP）端口可以从 Kubernetes 集群访问，并准备一个具有 `CREATE DATABASE` 权限的账号。
  - 由 Chart 部署 Doris：集群中有 PersistentVolume 供应器，且 FE 和 BE 各自至少有 2 核 CPU 和 4 GiB 内存。

本文命令使用 Release 名称 `dog` 和命名空间 `dog`，下表中的对象名称由此生成。如果使用其他名称，请相应替换。

| 对象 | 名称 |
| --- | --- |
| 网关 StatefulSet 与 Service | `dog-ai-observe-stack-otel-gateway` |
| Grafana Deployment 与 Service | `dog-ai-observe-stack-grafana` |
| Grafana 管理员 Secret | `dog-ai-observe-stack-grafana-admin` |
| DorisCluster（由 Chart 部署 Doris 时） | `dog-ai-observe-stack-doris` |
| 采集器 agent DaemonSet | `dog-k8s-collector-agent` |
| 采集器 cluster Deployment | `dog-k8s-collector-cluster` |

## 获取 Chart

克隆仓库并下载 Chart 依赖。Doris Operator 子 Chart 声明在 Chart 的依赖中，因此即使连接已有 Doris，也需要执行这一步。请使用 `helm dependency update`，它不需要预先执行 `helm repo add`。

```Bash
git clone https://github.com/ai-observe/ai-observe-stack.git
cd ai-observe-stack/helm-charts
helm dependency update ./ai-observe-stack
```

后续命令均在 `helm-charts` 目录下执行。

## 步骤 1：安装 DOG Stack 后端

选择 Doris 的部署方式：

| | 方式 A：使用已有 Doris | 方式 B：由 Chart 部署 Doris |
| --- | --- | --- |
| 适用场景 | 已有 Doris 或 SelectDB 集群；生产环境 | 没有可用 Doris 时的试用和开发 |
| 数据位置 | 已有的 Doris 集群 | Kubernetes 集群内的 PVC |

### 方式 A：使用已有 Doris

1. 创建命名空间，并将 Doris 账号保存到 Secret 中。Secret 必须包含 `username` 和 `password` 两个键。

   ```Bash
   kubectl create namespace dog
   kubectl create secret generic doris-credentials -n dog \
     --from-literal=username=<DORIS_USER> --from-literal=password='<DORIS_PASSWORD>'
   ```

2. 创建 values 文件 `dog-values.yaml`：

   ```yaml
   doris:
     mode: external
     database: otel                  # 网关会自动创建该数据库及其中的表
     external:
       host: <DORIS_FE_HOST>         # 集群内可访问的 FE 地址
       port: 9030                    # MySQL 协议端口
       feHttpPort: 8030              # HTTP 端口，用于 Stream Load
       existingSecret: doris-credentials
     internal:
       operator:
         enabled: false              # 不安装 Doris Operator
   ```

   仓库中的 `examples/ai-observe-stack/minimal-external-doris.yaml` 即为该文件。

3. 安装：

   ```Bash
   helm install dog ./ai-observe-stack -n dog -f dog-values.yaml
   ```

### 方式 B：由 Chart 部署 Doris

仓库提供两种规格：

- `examples/ai-observe-stack/dev.yaml`：FE 和 BE 各一个，不开启持久化，一个网关，开启调试输出。仅用于试用。
- `examples/ai-observe-stack/prod.yaml`：FE 和 BE 各三个，开启持久化，三个网关，并配置 Ingress。可作为生产配置的起点。

```Bash
helm install dog ./ai-observe-stack -n dog --create-namespace -f examples/ai-observe-stack/dev.yaml
```

Doris FE 和 BE 拉取镜像并完成初始化需要 2 到 5 分钟。网关会等待 FE 的 9030 和 8030 端口可访问、且至少有一个 BE 在线后再启动。

:::caution
Doris Operator 是集群级组件，一个 Kubernetes 集群中只能运行一个。在同一集群中安装第二个 DOG Stack 时，需要设置 `doris.internal.operator.enabled: false`。
:::

### 验证后端

安装完成后，Helm 会输出 NOTES，其中包含网关的 OTLP gRPC 地址 `dog-ai-observe-stack-otel-gateway.dog.svc:4317`，请记录下来，步骤 2 中需要使用。

1. 检查 Pod 是否运行。应能看到网关 Pod（默认两个副本，即 `dog-ai-observe-stack-otel-gateway-0` 和 `-1`；`dev.yaml` 为一个副本）、Grafana Pod，以及方式 B 下的 Doris FE 和 BE Pod，状态均为 `Running`。

   ```Bash
   kubectl get pods -n dog
   ```

2. 运行内置的链路测试。该测试通过网关发送一条日志，并检查其是否写入 Doris。

   ```Bash
   helm test dog -n dog --logs
   ```

   输出以 `OK: record found in Doris` 结尾。

3. 获取 Grafana 管理员密码（默认为 `admin`）：

   ```Bash
   kubectl get secret -n dog dog-ai-observe-stack-grafana-admin -o jsonpath='{.data.admin-password}' | base64 -d; echo
   ```

4. 访问 Grafana：

   ```Bash
   kubectl port-forward -n dog svc/dog-ai-observe-stack-grafana 3000:3000
   ```

   打开 <http://localhost:3000>，使用 `admin` 和上一步获取的密码登录。此时还没有数据写入网关，仪表盘为空。

## 步骤 2：安装 Kubernetes 采集器 {#step-2-install-the-kubernetes-collector}

1. 确认在待采集的集群中可以访问网关。请将地址替换为实际地址。

   ```Bash
   kubectl run -it --rm otlp-check --image=busybox:1.36 --restart=Never -- \
     sh -c 'sleep 2; nc -zv dog-ai-observe-stack-otel-gateway.dog.svc 4317'
   ```

   输出中出现 `open` 表示网关可访问。网关地址取决于 DOG Stack 的部署位置：

   | DOG Stack 部署位置 | 网关地址（`host:port`，不带 `http://`） |
   | --- | --- |
   | 使用本 Chart 安装在同一集群 | `<release>-ai-observe-stack-otel-gateway.<namespace>.svc:4317` |
   | 自建的带 Doris exporter 的 OpenTelemetry Collector | 其 OTLP gRPC Service，通常为 `<service>.<namespace>.svc:4317` |
   | 其他 Kubernetes 集群 | 网关的外部地址：LoadBalancer IP（`gateway.service.type: LoadBalancer`）或 Ingress 域名。集群之间需要开放 4317 端口 |

2. agent 以 root 身份运行，并挂载节点的 `/var/log/pods`、`/`（只读）和 `/var/lib/otelcol`。如果命名空间启用了 `restricted` 级别的 Pod Security Standard，需要放宽：

   ```Bash
   kubectl label namespace dog pod-security.kubernetes.io/enforce=privileged --overwrite
   ```

3. 创建 values 文件 `collector-values.yaml`：

   ```yaml
   gateway:
     endpoint: dog-ai-observe-stack-otel-gateway.dog.svc:4317
   clusterName: my-cluster
   platform: generic
   ```

   | 参数 | 是否必填 | 默认值 | 说明 |
   | --- | --- | --- | --- |
   | `gateway.endpoint` | 是 | 无 | 网关的 OTLP gRPC 地址，格式为 `host:port`。 |
   | `clusterName` | 否 | Release 名称 | 以 `k8s.cluster.name` 写入每条记录，用于区分集群。 |
   | `platform` | 否 | `generic` | 可选 `generic`、`k3s`、`eks`、`gke`、`aks`、`ack`、`openshift`。决定云资源探测器和 journald 单元名称。不确定时使用 `generic`。 |
   | `timezone` | 否 | `UTC` | 日志时间戳不带时区时所采用的 IANA 时区。解析规则可以通过 `timestamp.timezone` 覆盖。 |

4. 安装：

   ```Bash
   helm install dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
   ```

采集器默认开启以下采集预设：

| 预设 | 默认 | 采集内容 | 运行位置 |
| --- | --- | --- | --- |
| `logsCollection` | 开启 | 所有命名空间中所有容器的 stdout 和 stderr | agent |
| `kubeletMetrics` | 开启 | 节点、Pod、容器和卷的 CPU、内存、网络和文件系统，以及相对 limit 的使用率 | agent |
| `hostMetrics` | 开启 | 节点自身的 CPU、内存、负载、磁盘、文件系统和网络 | agent |
| `otlp` | 开启 | 供应用 SDK 使用的节点本地 OTLP 入口 | agent |
| `clusterMetrics` | 开启 | Deployment 可用性、节点状态、Pod 阶段、配额等 | cluster |
| `kubernetesEvents` | 开启 | Kubernetes Events，以日志形式存储 | cluster |
| `prometheusScrape` | 关闭 | 带有 `prometheus.io/scrape` 注解的 Pod | agent |
| `journald` | 关闭 | 节点 journal 日志，需要包含 `journalctl` 的镜像 | agent |

:::caution
`examples/ai-observe-stack/dev.yaml` 开启了网关的调试输出，会将采样数据打印到网关日志中。当采集器与网关位于同一集群时，需要排除网关的日志文件，否则每条记录都会被重复采集：

```yaml
logs:
  excludePaths:
    - /var/log/pods/dog_dog-ai-observe-stack-otel-gateway-*/*/*.log
```
:::

## 步骤 3：验证采集

1. 检查采集器 Pod。每个节点一个 agent Pod，另有一个 cluster Pod：

   ```Bash
   kubectl get pods -n dog -l app.kubernetes.io/instance=dog-k8s-collector -o wide
   ```

   ```text
   NAME                                         READY   STATUS    NODE
   dog-k8s-collector-agent-7x2kq                1/1     Running   node-1
   dog-k8s-collector-agent-p9m4c                1/1     Running   node-2
   dog-k8s-collector-cluster-6f5d9c8b7d-hq2xn   1/1     Running   node-1
   ```

2. 检查 agent 没有报错。以下命令应当没有任何输出：

   ```Bash
   kubectl logs -n dog ds/dog-k8s-collector-agent | grep '"level":"error"'
   ```

3. 在 Doris 中查询数据。使用方式 B 时，先转发 FE 端口，再用 MySQL 客户端连接：

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

   agent 启动后 30 秒内会写入第一批数据。`service_name` 为工作负载名称（Deployment、StatefulSet 或 DaemonSet），Kubernetes Events 显示为 `kubernetes-events`。只采集安装之后写入的日志行，节点上已有的日志文件不会重新读取。

4. 打开 Grafana，检查以下仪表盘：

   - **Logs Explorer**：按命名空间、服务、日志级别和文本过滤日志。
   - **Kubernetes Events**：Warning 数量、主要原因和事件列表。
   - **K8s Observability**：节点和 Pod 的 CPU 与内存。
   - **Collector Self-Monitoring**：agent、cluster 采集器和网关的队列长度、失败和拒绝情况。

### 端到端示例

以下 Pod 每秒输出一行 JSON 日志，可以验证从容器日志到 Doris 的完整链路：

```Bash
kubectl create namespace demo
kubectl run json-app -n demo --image=busybox:1.36 --restart=Never -- sh -c \
  'i=0; while true; do i=$((i+1)); echo "{\"time\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"info\",\"msg\":\"tick $i\"}"; sleep 1; done'
```

约 30 秒后，在 Doris 中查询：

```sql
SELECT timestamp, severity_text, body, cast(resource_attributes['k8s.pod.name'] as string) AS pod
FROM otel.otel_logs
WHERE cast(resource_attributes['k8s.namespace.name'] as string) = 'demo'
ORDER BY timestamp DESC LIMIT 5;
```

如果返回 `severity_text` 为 `INFO`、`body` 类似 `tick 42` 的记录，说明容器日志已被采集、JSON 已被解析，并附加了 Kubernetes 元数据。验证完成后执行 `kubectl delete namespace demo` 清理。

## 配置采集

修改采集配置时，编辑 `collector-values.yaml` 后执行：

```Bash
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

只有受影响的 agent 或 cluster 采集器会重启。节点上的文件读取位置会保留，不会重复采集日志。

### 选择命名空间和容器

```yaml
logs:
  namespaces:
    include: ["*"]                          # 或列表，例如 [shop, payment]
    exclude: [kube-system, monitoring]
  containers:
    exclude: [istio-proxy, linkerd-proxy]   # 容器名称，在所有命名空间中排除
```

排除优先于包含。采集器自身的 Pod 不会被采集。

### 解析日志

- **JSON 日志**：以 `{` 开头的行会被自动解析。`level` 或 `severity` 写入 `severity_text`，`message` 或 `msg` 写入 `body`，其余字段写入 `log_attributes`。字段名不同时，可设置 `logs.json.severityFields` 和 `logs.json.messageFields`。
- **常见文本格式**：在规则中使用内置预设。`selector.container` 匹配的是容器名称，而不是 Pod 或 Deployment 名称。

  ```yaml
  logs:
    rules:
      - name: shop-api
        selector: {namespace: "^shop$", container: "^api$"}
        preset: java-spring
  ```

  | 预设 | 适用格式 |
  | --- | --- |
  | `java-spring` | Spring Boot 3 默认控制台格式，自动合并异常堆栈 |
  | `python-logging` | Python `logging.basicConfig` 默认格式 |
  | `go-zap-console` | zap console encoder |
  | `glog` | C++ 和 Go glog |
  | `nginx-access`、`nginx-error` | nginx combined 访问日志和错误日志 |
  | `mysql`、`postgres`、`redis` | 官方镜像的默认格式 |
  | `doris-fe`、`doris-fe-audit`、`doris-be` | Apache Doris FE、FE 审计和 BE 日志 |
  | `json-generic` | 单行 JSON |

  Doris FE 的运行日志和审计日志输出在同一个容器中。如果需要同时解析，请使用相同的 selector 添加两条规则，分别设置 `preset: doris-fe` 和 `preset: doris-fe-audit`。

- **自定义格式**：编写带命名分组的正则表达式，分组 `ts` 为时间戳，`level` 为日志级别，`msg` 为消息：

  ```yaml
  logs:
    rules:
      - name: shop-worker
        selector: {namespace: "^shop$", container: "^worker$"}
        regex: '^(?P<ts>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(?P<level>[a-z]+)\s+(?P<msg>(?s:.*))$'
        timestamp: {layout: "%Y-%m-%dT%H:%M:%S.%L%z"}
        severity: {field: level}
        multiline: {firstLinePattern: '^\d{4}-\d{2}-\d{2}T'}   # 堆栈行合并到上一条记录
        drop: ['GET /healthz']                             # 在节点上直接丢弃
  ```

  如果日志时间戳不带时区，且容器不在 UTC 时区运行，需要在 `timestamp` 中增加 `timezone`，例如 `timestamp: {layout: "...", timezone: Asia/Shanghai}`。规则按顺序匹配，第一个匹配的规则生效。每条记录的 `dog.log.rule` 属性标明了解析它的规则。

  部署规则之前，可以使用仓库中的 `hack/test-rule.sh` 对样例日志进行测试，该脚本依赖 helm、yq 和 Docker：

  ```Bash
  kubectl logs -n shop -l app=worker -c worker --tail=30 > worker.log
  hack/test-rule.sh -f collector-values.yaml -n shop -c worker worker.log
  ```

### 接收应用的 OTLP 数据

接入 OpenTelemetry SDK 的应用可以将 Trace、指标和日志发送到所在节点的 agent，agent 会附加 Pod、命名空间和工作负载元数据。先在节点上开放 agent 端口：

```yaml
presets:
  otlp:
    hostPortHttp: 4318
    hostPortGrpc: 4317
```

然后在应用的 Pod 模板中设置地址：

```yaml
env:
  - name: HOST_IP
    valueFrom: {fieldRef: {fieldPath: status.hostIP}}
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://$(HOST_IP):4318
  - name: OTEL_SERVICE_NAME
    value: checkout
```

### 抓取 Prometheus 指标

设置 `presets.prometheusScrape.enabled: true`，然后为应用 Pod 添加注解 `prometheus.io/scrape: "true"`、`prometheus.io/port` 和 `prometheus.io/path`。指标写入 `otel_metrics_*` 表，`service_name` 为工作负载名称。

### 采集多个集群

在每个集群中各安装一个采集器 Release，`gateway.endpoint` 指向同一个网关（跨集群时使用其 LoadBalancer 或 Ingress 地址），并为每个集群设置不同的 `clusterName`。查询和仪表盘通过 `k8s.cluster.name` 过滤。

## 生产环境建议

| 项目 | 参数 | 说明 |
| --- | --- | --- |
| Doris 副本和磁盘 | `doris.internal.cluster.fe.replicas`、`doris.internal.cluster.be.replicas`、`doris.internal.cluster.persistence` | FE 和 BE 各至少三个，并设置 `gateway.dorisExporter.replicationNum: 3`。 |
| 网关副本和队列 | `gateway.replicas`、`gateway.persistence.size`、`gateway.dorisExporter.sendingQueue` | 每个网关副本的发送队列保存在各自的 PVC 上。写入出现延迟时，在 Collector Self-Monitoring 仪表盘中观察 `otelcol_exporter_queue_size`。 |
| 数据保留 | `gateway.dorisExporter.historyDays` | 默认 7 天。 |
| Grafana 密码 | `grafana.adminPassword` 或 `grafana.existingSecret` | 默认密码为 `admin`。 |
| 外部访问 | `ingress`、`gateway.service.type` | 为 Grafana 配置 Ingress；集群外的应用通过 OTLP/HTTP Ingress 路径或 LoadBalancer 写入。 |
| 调试输出 | `gateway.debug.enabled: false` | `dev.yaml` 中为开启状态。 |
| 采集范围 | `logs.namespaces.exclude` | 通常排除 `kube-system`。 |
| 采集器资源 | `agent.resources`、`agent.queueSize` | 每个 agent 默认申请 100m CPU 和 128 MiB 内存，上限为 1 CPU 和 512 MiB。网关不可达期间，每个节点最多在本地磁盘缓存 `agent.queueSize` 条记录（默认 20,000 条）。 |

仓库中的 `examples/ai-observe-stack/prod.yaml` 可作为生产 values 文件的起点。

## 升级与卸载

升级或修改配置：

```Bash
helm upgrade dog ./ai-observe-stack -n dog -f dog-values.yaml
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

卸载：

```Bash
helm uninstall dog-k8s-collector -n dog
helm uninstall dog -n dog
```

卸载采集器不会影响 DOG Stack 以及 Doris 中的数据。节点上 `/var/lib/otelcol` 中的文件读取位置会保留，重新安装后从上次的位置继续采集。使用方式 A 时，卸载 DOG Stack 不会删除已有 Doris 中的数据库。

Helm 不会删除网关的 PersistentVolumeClaim、Doris 的 PersistentVolumeClaim（方式 B 开启持久化时）以及已完成的 `helm test` Pod。如需删除：

```Bash
kubectl delete pvc -n dog -l app.kubernetes.io/instance=dog
kubectl delete pvc -n dog -l 'app.doris.ownerreference/name in (dog-ai-observe-stack-doris-fe,dog-ai-observe-stack-doris-be)'
kubectl delete pod -n dog dog-ai-observe-stack-test-pipeline --ignore-not-found
```

使用方式 B 时，Helm 也不会删除随 Doris Operator 安装的 CustomResourceDefinition `dorisclusters.doris.selectdb.com`，因为 Helm 从不删除 CRD。删除该 CRD 会同时删除 Kubernetes 集群中所有的 DorisCluster，因此仅在集群中没有其他由 Doris Operator 管理的 Doris 集群时才删除：

```Bash
kubectl delete crd dorisclusters.doris.selectdb.com
```

## 常见问题

| 现象 | 原因与解决方法 |
| --- | --- |
| `helm install` 报错 `missing in charts/ directory: doris-operator` | 未下载 Chart 依赖。执行 `helm dependency update ./ai-observe-stack`。 |
| `helm dependency build` 报错 `no repository definition for https://charts.selectdb.com` | `helm dependency build` 只使用通过 `helm repo add` 添加的仓库。改为执行 `helm dependency update ./ai-observe-stack`。 |
| `helm install` 报错 `gateway.endpoint is required` | 将采集器的 `gateway.endpoint` 设置为网关地址。 |
| `helm install` 报错 `additional properties 'xxx' not allowed` | values 文件中有拼写错误的顶层键。 |
| `helm test` 失败，或网关日志中出现 Doris 相关错误 | 检查 Doris FE 的 9030 和 8030 端口是否可访问，以及账号是否具有 `CREATE DATABASE` 权限。使用 `kubectl logs -n dog dog-ai-observe-stack-otel-gateway-0` 查看网关日志。 |
| agent Pod 报 `CreateContainerConfigError`、被 Pod Security 拒绝，或日志中出现 `/var/log/pods` 的 `permission denied` | 命名空间启用了 `restricted`。添加 `privileged` 标签，参见步骤 2。 |
| agent 日志出现 `connection refused` 或 `Unavailable` | 网关地址错误、网关未运行，或网络策略阻止了 4317 端口。问题修复前，记录会缓存在节点上，修复后自动发送。 |
| agent 日志出现 `unknown time zone` | 规则设置了时区，但节点上没有 `/usr/share/zoneinfo`。改用 UTC，或将 `agent.image.repository` 设置为 `otel/opentelemetry-collector-contrib`。 |
| 某个命名空间没有日志 | 被 `logs.namespaces.exclude` 或 `logs.containers.exclude` 排除，或安装后没有写入新的日志行。 |
| 有日志但 `service_name` 为空 | agent 无法读取 Pod 元数据。检查 agent 日志中是否有 RBAC `forbidden` 错误。 |
| 解析规则不生效（`dog.log.rule` 为空） | `selector.container` 填写的是 Pod 名称而不是容器名称，或更靠前的规则先匹配。使用 `hack/test-rule.sh` 验证。 |
| 日志时间相差若干小时 | 日志行不带时区、容器不在 UTC 时区运行，且未设置 `timestamp.timezone`。 |

查看 agent 实际运行的配置：

```Bash
kubectl get cm -n dog dog-k8s-collector-agent-config -o jsonpath='{.data.config\.yaml}'
```

两个 Chart 的完整参数说明，请参见仓库 [helm-charts](https://github.com/ai-observe/ai-observe-stack/tree/main/helm-charts) 目录下各 Chart 的 `USER_GUIDE_zh.md` 和 `values.yaml`。
