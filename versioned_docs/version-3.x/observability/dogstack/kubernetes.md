---
{
    "title": "Deploy on Kubernetes",
    "sidebar_label": "Deploy on Kubernetes",
    "language": "en-US",
    "description": "How to deploy DOG Stack on Kubernetes and collect container logs, metrics, and Events of a cluster? This article uses Helm to install the DOG Stack backend (OpenTelemetry gateway, Apache Doris, Grafana) and the Kubernetes collector, and covers verification, log parsing rules, production settings, and troubleshooting.",
    "keywords": [
        "DOG Stack",
        "Kubernetes",
        "Helm",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "Kubernetes log collection",
        "observability"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack Kubernetes deployment and cluster collection -->

This article describes how to deploy DOG Stack on Kubernetes with Helm and collect container logs, kubelet, node, and cluster metrics, and Kubernetes Events of a cluster into it. After completing the steps, you can query the data in Doris and view it in the Grafana dashboards. To deploy on a single host instead, see [Deploy with Docker Compose](./docker.md).

DOG Stack on Kubernetes consists of two independent Helm charts:

| Chart | Role | Workloads |
| --- | --- | --- |
| `ai-observe-stack` | The DOG Stack backend. Installed once. It receives OTLP data, writes it into Doris, and displays it in Grafana. It collects nothing by itself. | OpenTelemetry gateway (StatefulSet), Grafana with the Doris App plugin (Deployment), and optionally a Doris cluster managed by the Doris Operator |
| `dog-k8s-collector` | The Kubernetes collector. Installed once in every cluster to be collected, and pointed at the gateway. | agent (DaemonSet, one per node): container logs, kubelet and node metrics, node-local OTLP entry point; cluster (Deployment, one per cluster): cluster metrics and Kubernetes Events |

The data flow is:

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

There is no Helm dependency between the two charts: they are installed and upgraded separately. Several Kubernetes clusters can send to one DOG Stack, told apart by the cluster name.

:::tip
If a DOG Stack is already running (installed with this chart, deployed another way, or in another cluster), skip to [Step 2: Install the Kubernetes Collector](#step-2-install-the-kubernetes-collector). You only need the OTLP gRPC address of its gateway.
:::

## Prerequisites

- Kubernetes 1.24 or later, Helm 3.8 or later, and `kubectl` configured to access the cluster.
- Cluster-level RBAC permissions: the collector creates a ClusterRole and a ClusterRoleBinding.
- Nodes can pull the images `otel/opentelemetry-collector-contrib`, `otel/opentelemetry-collector-k8s`, `grafana/grafana`, `velodb/doris-app-plugin`, and `busybox`. For a private registry, set `global.imagePullSecrets` in `ai-observe-stack` and `imagePullSecrets` in `dog-k8s-collector`, and point the image parameters at your mirror: `gateway.image.repository`, `grafana.image.repository`, `dorisPlugin.image.repository`, and `global.helperImages.busybox` / `global.helperImages.curl` in `ai-observe-stack`; `agent.image.repository` and `cluster.image.repository` in `dog-k8s-collector`.
- Doris, one of the following:
  - An existing Doris cluster whose FE ports 9030 (MySQL protocol) and 8030 (HTTP) are reachable from the Kubernetes cluster, and an account with the `CREATE DATABASE` privilege. The gateway writes data through Stream Load: FE redirects each request to a BE at the address the BE registered in Doris (shown by `SHOW BACKENDS`), so these BE addresses and the BE HTTP port (8040 by default) must also be reachable from the gateway pods.
  - Or let the chart deploy Doris: a PersistentVolume provisioner, and at least 2 CPU cores and 4 GiB of memory each for FE and BE.

The commands in this article use the release name `dog` and the namespace `dog`. The object names below are derived from them; if you use other names, replace them accordingly.

| Object | Name |
| --- | --- |
| Gateway StatefulSet and Service | `dog-ai-observe-stack-otel-gateway` |
| Grafana Deployment and Service | `dog-ai-observe-stack-grafana` |
| Grafana admin Secret | `dog-ai-observe-stack-grafana-admin` |
| DorisCluster (when the chart deploys Doris) | `dog-ai-observe-stack-doris` |
| Collector agent DaemonSet | `dog-k8s-collector-agent` |
| Collector cluster Deployment | `dog-k8s-collector-cluster` |

## Get the Charts

Clone the repository and download the chart dependency. The Doris Operator subchart is declared in the chart's dependencies, so this step is required even if you connect to an existing Doris. Use `helm dependency update`, which does not require `helm repo add`.

```Bash
git clone https://github.com/ai-observe/ai-observe-stack.git
cd ai-observe-stack/helm-charts
helm dependency update ./ai-observe-stack
```

All following commands run in the `helm-charts` directory.

## Step 1: Install the DOG Stack Backend

Choose where Doris runs:

| | Option A: use an existing Doris | Option B: the chart deploys Doris |
| --- | --- | --- |
| Suited for | An existing Doris or SelectDB cluster; production | Trials and development when no Doris is available |
| Data location | Your Doris cluster | PVCs inside the Kubernetes cluster |

### Option A: Use an Existing Doris

1. Create the namespace and store the Doris account in a Secret. The Secret must contain the keys `username` and `password`.

   ```Bash
   kubectl create namespace dog
   kubectl create secret generic doris-credentials -n dog \
     --from-literal=username=<DORIS_USER> --from-literal=password='<DORIS_PASSWORD>'
   ```

2. Create a values file `dog-values.yaml`:

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

   The same file is available as `examples/ai-observe-stack/minimal-external-doris.yaml` in the repository.

3. Install:

   ```Bash
   helm install dog ./ai-observe-stack -n dog -f dog-values.yaml
   ```

### Option B: The Chart Deploys Doris

The repository provides two sizes:

- `examples/ai-observe-stack/dev.yaml`: one FE and one BE, no persistence, one gateway, debug output on. For trials only.
- `examples/ai-observe-stack/prod.yaml`: three FE and three BE, persistence, three gateways, and Ingress. A starting point for production. Before using it, adapt the environment-specific settings: `storageClass` (set to the AWS `gp3`), the Ingress class, hosts, and TLS issuer, and the Grafana password (`CHANGE_ME`).

```Bash
helm install dog ./ai-observe-stack -n dog --create-namespace -f examples/ai-observe-stack/dev.yaml
```

Doris FE and BE take two to five minutes to pull images and initialize. The gateway waits until FE ports 9030 and 8030 are reachable and at least one BE is online before starting.

:::caution
The Doris Operator is cluster-scoped, and only one can run in a Kubernetes cluster. When installing a second DOG Stack in the same cluster, set `doris.internal.operator.enabled: false`.
:::

### Verify the Backend

When the installation finishes, Helm prints NOTES, which include the OTLP gRPC address of the gateway: `dog-ai-observe-stack-otel-gateway.dog.svc:4317`. Record it for Step 2.

1. Check that the pods are running. You should see the gateway pods (`dog-ai-observe-stack-otel-gateway-0` and `-1` with the default two replicas; `dev.yaml` runs one), the Grafana pod, and, with Option B, the Doris FE and BE pods, all in the `Running` status.

   ```Bash
   kubectl get pods -n dog
   ```

2. Run the built-in pipeline test. It sends a log record through the gateway and checks that it arrives in Doris.

   ```Bash
   helm test dog -n dog --logs
   ```

   The output ends with `OK: record found in Doris`.

3. Get the Grafana admin password (default `admin`):

   ```Bash
   kubectl get secret -n dog dog-ai-observe-stack-grafana-admin -o jsonpath='{.data.admin-password}' | base64 -d; echo
   ```

4. Access Grafana:

   ```Bash
   kubectl port-forward -n dog svc/dog-ai-observe-stack-grafana 3000:3000
   ```

   Open http://localhost:3000 and log in as `admin` with the password above. The dashboards are empty at this point, because nothing sends data to the gateway yet.

## Step 2: Install the Kubernetes Collector {#step-2-install-the-kubernetes-collector}

The backend installed in Step 1 only receives data. The collector gathers data from the Kubernetes cluster and sends it to the gateway: on every node, the agent reads the stdout and stderr of all containers and collects kubelet and node metrics; the cluster collector collects cluster-level metrics and Kubernetes Events. Every record carries the pod, namespace, workload, and cluster name. Without the collector, only applications that send OTLP to the gateway directly reach DOG Stack, and there are no container logs, node or cluster metrics, or Events. Install one collector release in every Kubernetes cluster to be observed.

1. Confirm that the gateway is reachable from the cluster to be collected. Replace the address with yours.

   ```Bash
   kubectl run -it --rm otlp-check --image=busybox:1.36 --restart=Never -- \
     sh -c 'sleep 2; nc -zv dog-ai-observe-stack-otel-gateway.dog.svc 4317'
   ```

   `open` in the output means the gateway is reachable. The gateway address depends on where the DOG Stack runs:

   | DOG Stack location | Gateway address (`host:port`, without `http://`) |
   | --- | --- |
   | Installed by this chart in the same cluster | `<release>-ai-observe-stack-otel-gateway.<namespace>.svc:4317` |
   | Your own OpenTelemetry Collector with the Doris exporter | Its OTLP gRPC Service, usually `<service>.<namespace>.svc:4317` |
   | Another Kubernetes cluster | The gateway's external address: a LoadBalancer IP (`gateway.service.type: LoadBalancer`) or an Ingress host. Port 4317 must be open between the clusters |

2. The agent runs as root and mounts the node's `/var/log/pods`, `/` (read-only), and `/var/lib/otelcol`. If the namespace enforces the `restricted` Pod Security Standard, relax it:

   ```Bash
   kubectl label namespace dog pod-security.kubernetes.io/enforce=privileged --overwrite
   ```

3. Create a values file `collector-values.yaml`:

   ```yaml
   gateway:
     endpoint: dog-ai-observe-stack-otel-gateway.dog.svc:4317
   clusterName: my-cluster
   platform: generic
   ```

   | Parameter | Required | Default | Description |
   | --- | --- | --- | --- |
   | `gateway.endpoint` | Yes | None | OTLP gRPC address of the gateway, in the form `host:port`. |
   | `clusterName` | No | Release name | Written to every record as `k8s.cluster.name`, to tell clusters apart. |
   | `platform` | No | `generic` | One of `generic`, `k3s`, `eks`, `gke`, `aks`, `ack`, `openshift`. Selects cloud resource detectors and journald unit names. Use `generic` if unsure. |
   | `timezone` | No | `UTC` | IANA time zone assumed for log lines whose timestamp has no time zone. A parsing rule can override it with `timestamp.timezone`. |

4. Install:

   ```Bash
   helm install dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
   ```

The collector enables the following collection presets by default:

| Preset | Default | Collects | Runs in |
| --- | --- | --- | --- |
| `logsCollection` | On | stdout and stderr of every container in every namespace | agent |
| `kubeletMetrics` | On | CPU, memory, network, and filesystem of nodes, pods, containers, and volumes, with limit utilization | agent |
| `hostMetrics` | On | CPU, memory, load, disk, filesystem, and network of the node | agent |
| `otlp` | On | Node-local OTLP entry point for application SDKs | agent |
| `clusterMetrics` | On | Deployment availability, node conditions, pod phases, quotas | cluster |
| `kubernetesEvents` | On | Kubernetes Events, stored as logs | cluster |
| `prometheusScrape` | Off | Pods annotated with `prometheus.io/scrape` | agent |
| `journald` | Off | Node journal. Requires an image that contains `journalctl` | agent |

:::caution
`examples/ai-observe-stack/dev.yaml` turns on the gateway's debug output, which prints sampled records to the gateway log. When the collector runs in the same cluster, exclude the gateway's log files, otherwise every record is collected again:

```yaml
logs:
  excludePaths:
    - /var/log/pods/dog_dog-ai-observe-stack-otel-gateway-*/*/*.log
```
:::

## Step 3: Verify Collection

1. Check the collector pods. There is one agent pod per node and one cluster pod:

   ```Bash
   kubectl get pods -n dog -l app.kubernetes.io/instance=dog-k8s-collector -o wide
   ```

   ```text
   NAME                                         READY   STATUS    NODE
   dog-k8s-collector-agent-7x2kq                1/1     Running   node-1
   dog-k8s-collector-agent-p9m4c                1/1     Running   node-2
   dog-k8s-collector-cluster-6f5d9c8b7d-hq2xn   1/1     Running   node-1
   ```

2. Check that the agent reports no errors. The following command should print nothing:

   ```Bash
   kubectl logs -n dog ds/dog-k8s-collector-agent | grep '"level":"error"'
   ```

3. Query the data in Doris. With Option A, connect a MySQL client to port 9030 of your Doris FE. With Option B, forward the FE port first and connect with a MySQL client:

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

   The first records arrive within 30 seconds after the agent starts. `service_name` is the name of the workload that owns the pod, looked up in the order Deployment, StatefulSet, DaemonSet, CronJob, and Job, or the pod name for a standalone pod. Kubernetes Events appear as `kubernetes-events`. Only log lines written after the installation are collected; existing log files on the nodes are not read again.

4. Open Grafana and check the dashboards:

   - **Logs Explorer**: filter logs by namespace, service, severity, and text.
   - **Kubernetes Events**: Warning counts, top reasons, and the event table.
   - **K8s Observability**: CPU and memory of nodes and pods.
   - **Collector Self-Monitoring**: queue length, failures, and refusals of the agent, the cluster collector, and the gateway.

### End-to-End Example

The following pod prints one JSON log line per second, which verifies the whole path from container logs to Doris:

```Bash
kubectl create namespace demo
kubectl run json-app -n demo --image=busybox:1.36 --restart=Never -- sh -c \
  'i=0; while true; do i=$((i+1)); echo "{\"time\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"info\",\"msg\":\"tick $i\"}"; sleep 1; done'
```

After about 30 seconds, query Doris:

```sql
SELECT timestamp, severity_text, body, cast(resource_attributes['k8s.pod.name'] as string) AS pod
FROM otel.otel_logs
WHERE cast(resource_attributes['k8s.namespace.name'] as string) = 'demo'
ORDER BY timestamp DESC LIMIT 5;
```

Rows with `severity_text` equal to `INFO` and `body` like `tick 42` show that the container log was collected, the JSON line was parsed, and Kubernetes metadata was attached. Clean up with `kubectl delete namespace demo`.

## Configure Collection

To change the collection, edit `collector-values.yaml` and run:

```Bash
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

Only the affected agent or cluster collector restarts. File offsets on the nodes are kept, so no log line is collected twice.

### Select Namespaces and Containers

```yaml
logs:
  namespaces:
    include: ["*"]                          # or a list, such as [shop, payment]
    exclude: [kube-system, monitoring]
  containers:
    exclude: [istio-proxy, linkerd-proxy]   # container names, excluded in every namespace
```

Exclusions take precedence over inclusions. The collector's own pods are never collected.

### Parse Logs

- **JSON logs**: lines starting with `{` are parsed automatically. `level` or `severity` becomes `severity_text`, `message` or `msg` becomes `body`, and other keys are stored in `log_attributes`. For other field names, set `logs.json.severityFields` and `logs.json.messageFields`.
- **Common text formats**: use a built-in preset in a rule. `selector.container` matches the container name, not the pod or Deployment name.

  ```yaml
  logs:
    rules:
      - name: shop-api
        selector: {namespace: "^shop$", container: "^api$"}
        preset: java-spring
  ```

  | Preset | Format |
  | --- | --- |
  | `java-spring` | Spring Boot 3 default console format, with stack traces joined |
  | `python-logging` | Python `logging.basicConfig` default format |
  | `go-zap-console` | zap console encoder |
  | `glog` | C++ and Go glog |
  | `nginx-access`, `nginx-error` | nginx combined access log and error log |
  | `mysql`, `postgres`, `redis` | Defaults of the official images |
  | `doris-fe`, `doris-fe-audit`, `doris-be` | Apache Doris FE, FE audit, and BE logs |
  | `json-generic` | Single-line JSON |

  Doris FE writes runtime logs and audit logs to the same container. To parse both, add two rules with the same selector, one with `preset: doris-fe` and one with `preset: doris-fe-audit`.

- **Custom formats**: write a regular expression with named groups `ts` (timestamp), `level` (severity), and `msg` (message):

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

  If the timestamp in the log line has no time zone and the container does not run in UTC, add `timezone` to `timestamp`, for example `timestamp: {layout: "...", timezone: Asia/Shanghai}`. Rules are matched in order and the first matching rule wins. The attribute `dog.log.rule` of each record shows which rule parsed it.

  Before deploying a rule, you can test it against sample logs with `hack/test-rule.sh` in the repository, which requires helm, yq, and Docker:

  ```Bash
  kubectl logs -n shop -l app=worker -c worker --tail=30 > worker.log
  hack/test-rule.sh -f collector-values.yaml -n shop -c worker worker.log
  ```

### Receive OTLP from Applications

Applications instrumented with an OpenTelemetry SDK can send traces, metrics, and logs to the agent on their node, which adds pod, namespace, and workload metadata. Expose the agent ports on the node:

```yaml
presets:
  otlp:
    hostPortHttp: 4318
    hostPortGrpc: 4317
```

Then set the endpoint in the application's pod template:

```yaml
env:
  - name: HOST_IP
    valueFrom: {fieldRef: {fieldPath: status.hostIP}}
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://$(HOST_IP):4318
  - name: OTEL_SERVICE_NAME
    value: checkout
```

### Scrape Prometheus Metrics

Set `presets.prometheusScrape.enabled: true`, then annotate the application pods with `prometheus.io/scrape: "true"`, `prometheus.io/port`, and `prometheus.io/path`. The metrics are written to the `otel_metrics_*` tables, and `service_name` is the workload name.

### Collect Multiple Clusters

Install one collector release in each cluster. Point `gateway.endpoint` at the same gateway (use its LoadBalancer or Ingress address across clusters) and give each cluster a different `clusterName`. Queries and dashboards filter by `k8s.cluster.name`.

## Production Recommendations

| Item | Parameter | Description |
| --- | --- | --- |
| Doris replicas and disks | `doris.internal.cluster.fe.replicas`, `doris.internal.cluster.be.replicas`, `doris.internal.cluster.persistence` | At least three FE and three BE, with `gateway.dorisExporter.replicationNum: 3`. |
| Gateway replicas and queue | `gateway.replicas`, `gateway.persistence.size`, `gateway.dorisExporter.sendingQueue` | Each gateway replica keeps its sending queue on its own PVC. If writes lag, watch `otelcol_exporter_queue_size` on the Collector Self-Monitoring dashboard. |
| Data retention | `gateway.dorisExporter.historyDays` | 7 days by default. |
| Grafana password | `grafana.adminPassword` or `grafana.existingSecret` | The default password is `admin`. |
| External access | `ingress`, `gateway.service.type` | Ingress for Grafana; applications outside the cluster use the OTLP/HTTP Ingress path or a LoadBalancer. |
| Debug output | `gateway.debug.enabled: false` | Turned on in `dev.yaml`. |
| Collection scope | `logs.namespaces.exclude` | Usually excludes `kube-system`. |
| Collector resources | `agent.resources`, `agent.queueSize` | Each agent requests 100m CPU and 128 MiB of memory, and is limited to 1 CPU and 512 MiB. While the gateway is unreachable, each node buffers up to `agent.queueSize` records (20,000 by default) on local disk. |

`examples/ai-observe-stack/prod.yaml` in the repository is a production values file to start from.

## Upgrade and Uninstall

Upgrade or change configuration:

```Bash
helm upgrade dog ./ai-observe-stack -n dog -f dog-values.yaml
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

Uninstall:

```Bash
helm uninstall dog-k8s-collector -n dog
helm uninstall dog -n dog
```

Uninstalling the collector does not affect the DOG Stack or the data in Doris. The file offsets under `/var/lib/otelcol` on the nodes are kept, and a reinstall continues from the last position. With Option A, uninstalling the DOG Stack does not delete the database in your Doris.

Helm does not delete the PersistentVolumeClaims of the gateway, the PersistentVolumeClaims of Doris (Option B with persistence enabled), or the completed `helm test` pod. To remove them:

```Bash
kubectl delete pvc -n dog -l app.kubernetes.io/instance=dog
kubectl delete pvc -n dog -l 'app.doris.ownerreference/name in (dog-ai-observe-stack-doris-fe,dog-ai-observe-stack-doris-be)'
kubectl delete pod -n dog dog-ai-observe-stack-test-pipeline --ignore-not-found
```

With Option B, Helm also keeps the CustomResourceDefinition `dorisclusters.doris.selectdb.com` installed with the Doris Operator, because Helm never deletes CRDs. Deleting the CRD deletes every DorisCluster in the Kubernetes cluster, so delete it only when no other Doris cluster is managed by the Doris Operator:

```Bash
kubectl delete crd dorisclusters.doris.selectdb.com
```

## Troubleshooting

| Symptom | Cause and solution |
| --- | --- |
| `helm install` reports `missing in charts/ directory: doris-operator` | The chart dependency is not downloaded. Run `helm dependency update ./ai-observe-stack`. |
| `helm dependency build` reports `no repository definition for https://charts.selectdb.com` | `helm dependency build` only uses repositories added with `helm repo add`. Run `helm dependency update ./ai-observe-stack` instead. |
| `helm install` reports `gateway.endpoint is required` | Set `gateway.endpoint` of the collector to the gateway address. |
| `helm install` reports `additional properties 'xxx' not allowed` | A top-level key in the values file is misspelled. |
| `helm test` fails, or the gateway log reports Doris errors | Check that Doris FE ports 9030 and 8030 are reachable and that the account has the `CREATE DATABASE` privilege. View the gateway log with `kubectl logs -n dog dog-ai-observe-stack-otel-gateway-0`. |
| Agent pod reports `CreateContainerConfigError`, is rejected by Pod Security, or logs `permission denied` on `/var/log/pods` | The namespace enforces `restricted`. Add the `privileged` label, see Step 2. |
| Agent log reports `connection refused` or `Unavailable` | The gateway address is wrong, the gateway is down, or a network policy blocks port 4317. Records are buffered on the node and sent after the problem is fixed. |
| Agent pod stays in `ContainerCreating`, and its events report `MountVolume.SetUp failed for volume "zoneinfo"` | The node has no time zone database (some minimal operating system images). Set `agent.tzdata.hostPath: ""`, and keep `timezone` and the `timestamp.timezone` of every rule at UTC. |
| A namespace has no logs | It is excluded by `logs.namespaces.exclude` or `logs.containers.exclude`, or no new lines were written after the installation. |
| Logs arrive but `service_name` is empty | The agent cannot read pod metadata. Check the agent log for RBAC `forbidden` errors. |
| A parsing rule has no effect (`dog.log.rule` is empty) | `selector.container` contains a pod name instead of a container name, or an earlier rule matched first. Verify with `hack/test-rule.sh`. |
| Log times are off by hours | The log line has no time zone, the container does not run in UTC, and `timestamp.timezone` is not set. |

To view the configuration that the agent actually runs:

```Bash
kubectl get cm -n dog dog-k8s-collector-agent-config -o jsonpath='{.data.config\.yaml}'
```

For all parameters of the two charts, see the `USER_GUIDE.md` and `values.yaml` of each chart under [helm-charts](https://github.com/ai-observe/ai-observe-stack/tree/main/helm-charts) in the repository.
