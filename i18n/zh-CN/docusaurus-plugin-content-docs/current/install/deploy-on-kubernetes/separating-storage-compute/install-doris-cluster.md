---
{
    "title": "部署完整 Doris 存算分离集群",
    "language": "zh-CN",
    "description": "在 Kubernetes 上从零部署一套可读写的 Doris 存算分离测试集群：部署单副本 FoundationDB、部署 Doris Operator、创建 1 FE + 1 MS + 1 个计算组的 DorisDisaggregatedCluster、在已有对象存储上创建 Storage Vault，并完成读写验证。",
    "keywords": ["Doris", "存算分离", "Kubernetes", "部署集群", "FoundationDB", "Doris Operator", "Storage Vault", "DorisDisaggregatedCluster"]
}
---

本文面向首次在 Kubernetes 上部署 Doris 存算分离集群的用户。按顺序完成以下 5 步后，你将得到一套可读写的测试集群：

1. 在 Kubernetes 上部署单副本 FoundationDB（FDB），用于存储元数据。
2. 部署 Doris Operator。
3. 部署包含 1 个 FE、1 个 MetaService（MS）和 1 个计算组（1 个 BE）的存算分离集群。
4. 在已准备好的对象存储上创建 Storage Vault。
5. 建表、写入并查询数据，完成端到端验证。

## 部署成果

| 组件 | 命名空间 | 说明 |
| --- | --- | --- |
| FoundationDB | `fdb-system` | 1 个单副本集群（4 个 Pod），存储元数据，仅用于开发测试 |
| Doris Operator | `doris` | 1 个 Pod，管理 Doris 集群 |
| MetaService（MS） | `doris` | 1 个 Pod，元数据服务，读写 FoundationDB |
| FE | `doris` | 1 个 Pod，负责 SQL 解析和查询协调，元数据保存在 PVC 中 |
| 计算组 `cg1` | `doris` | 1 个 BE，执行查询和导入，本地磁盘只作缓存 |
| Storage Vault `s3_vault` | - | 指向你提供的对象存储，表数据写入其中 |

## 开始前准备

1. 完成[部署前准备](../doris-operator/preparation.mdx)的第 1 至 5 项。本教程所有 Pod 的 requests 合计约 11 CPU / 16.25Gi。
2. 按[准备对象存储](../doris-operator/preparation.mdx#object-storage)拿到 Endpoint、Region、Bucket、数据目录前缀、Access Key / Secret Key 和服务商类型，并确认 Kubernetes 节点可以访问 Endpoint。**对象存储是必需的**：没有 Storage Vault 时集群可以启动，但无法建表和写入数据。
3. 确定 FoundationDB 使用的 StorageClass。执行 `kubectl get storageclass` 查看可用的 StorageClass，生产环境应使用 SSD。

本文使用以下版本为例：

| 组件 | 版本 | 说明 |
| --- | --- | --- |
| Doris Operator | 26.0.1 | 镜像 `apache/doris:operator-26.0.1` |
| Doris FE、MS、BE | 4.1.5 | 三者必须使用同一版本。MS 镜像内置 FoundationDB 7.1 和 7.3 客户端 |
| FoundationDB Operator | v2.35.0 | 镜像 `velodb/fdb-kubernetes-operator:v2.35.0` |
| FoundationDB | 7.3.69 | 镜像 `velodb/fdb-kubernetes-monitor:7.3.69` |

:::info FoundationDB 部署文件的来源
第 1 步使用的 FDB CRD、FDB Operator 部署清单、集群样例和镜像均由 VeloDB 发布，下载地址固定到 [velodb/fdb-kubernetes-operator](https://github.com/velodb/fdb-kubernetes-operator) 仓库中的提交 `d062b417991432f511bf907ba8649bf919ebc17d`，以保证每次下载的内容一致。如果只能使用 Apache Doris 发布的制品，请改为[接入已有的 FoundationDB](#use-existing-fdb)。
:::

## 第 1 步：部署 FoundationDB

存算分离集群依赖 FoundationDB 存储元数据，部署 Doris 前必须先准备好可用的 FoundationDB。根据现有基础设施选择部署方式：

| 部署方式 | 适用场景 | 操作 |
| --- | --- | --- |
| 在 Kubernetes 上部署 | 开发测试，或希望统一在 Kubernetes 中管理 FDB | 按本节第 1 至 5 小节操作 |
| 接入已有的 FDB，或在机器上部署 | 已有 FDB 集群，或希望 FDB 独立于 Kubernetes 运行 | 参见[接入已有的 FoundationDB](#use-existing-fdb)，然后直接进入第 2 步 |

本节以单副本 FDB 集群为例，包含 sidecar 的 requests 合计 4.4 CPU / 5Gi，另需 2 个 10Gi 的 PVC，**不能用于生产**。双副本配置、资源规划、FDB 7.1 方案、私有镜像仓库和更多排障方法参见[部署 FoundationDB](install-fdb.md)。

### 1. 下载部署文件

```shell
FDB_REF=d062b417991432f511bf907ba8649bf919ebc17d
FDB_CRDS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/${FDB_REF}/config/crd/bases
FDB_ASSETS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/${FDB_REF}/config/samples/velodb
mkdir -p fdb-install && cd fdb-install
for resource in clusters backups restores; do
  curl -fsSL "${FDB_CRDS}/apps.foundationdb.org_foundationdb${resource}.yaml" -o "fdb-${resource}-crd.yaml"
done
curl -fsSL "${FDB_ASSETS}/operator.yaml" -o fdb-operator.yaml
curl -fsSL "${FDB_ASSETS}/monitor-rbac.yaml" -o fdb-monitor-rbac.yaml
curl -fsSL "${FDB_ASSETS}/cluster-single.yaml" -o fdb-cluster.yaml
ls
```

期望输出：

```text
fdb-backups-crd.yaml
fdb-cluster.yaml
fdb-clusters-crd.yaml
fdb-monitor-rbac.yaml
fdb-operator.yaml
fdb-restores-crd.yaml
```

### 2. 安装 CRD、FDB Operator 和 Monitor RBAC

如果集群中已有 FDB 的 CRD 或 FDB Operator，请先参考[部署 FoundationDB](install-fdb.md)确认能否复用，不要覆盖其他团队正在使用的 CRD。新环境执行以下命令：

```shell
kubectl create namespace fdb-system --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --server-side -f fdb-clusters-crd.yaml -f fdb-backups-crd.yaml -f fdb-restores-crd.yaml
kubectl wait --for=condition=Established --timeout=60s \
  crd/foundationdbclusters.apps.foundationdb.org \
  crd/foundationdbbackups.apps.foundationdb.org \
  crd/foundationdbrestores.apps.foundationdb.org
kubectl -n fdb-system apply -f fdb-operator.yaml
kubectl -n fdb-system rollout status deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
kubectl -n fdb-system apply -f fdb-monitor-rbac.yaml
```

期望输出：

```text
namespace/fdb-system created
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org serverside-applied
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org serverside-applied
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org serverside-applied
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org condition met
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org condition met
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org condition met
serviceaccount/fdb-kubernetes-operator-controller-manager created
clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
deployment.apps/fdb-kubernetes-operator-controller-manager created
deployment "fdb-kubernetes-operator-controller-manager" successfully rolled out
serviceaccount/fdb-monitor created
role.rbac.authorization.k8s.io/fdb-monitor created
rolebinding.rbac.authorization.k8s.io/fdb-monitor created
```

FDB Operator 只管理 `fdb-system` 命名空间中的 FDB 集群。以上命令可以重复执行，重复执行时输出中的 `created` 会变为 `unchanged`。

### 3. 创建 FoundationDB 集群

将 `fdb-cluster.yaml` 中的 StorageClass 占位符替换为实际使用的 StorageClass。以下示例使用 `standard`，请替换为你的 StorageClass：

```shell
STORAGE_CLASS=standard
sed -i.bak "s/REPLACE_WITH_SSD_STORAGE_CLASS/${STORAGE_CLASS}/g" fdb-cluster.yaml
grep -n "storageClassName" fdb-cluster.yaml
```

期望输出（两处均已替换）：

```text
103:          storageClassName: standard
156:          storageClassName: standard
```

创建 FDB 集群：

```shell
kubectl -n fdb-system apply -f fdb-cluster.yaml
```

期望输出：

```text
foundationdbcluster.apps.foundationdb.org/fdb-single created
```

### 4. 等待 FoundationDB 就绪

```shell
kubectl -n fdb-system wait --for=jsonpath='{.status.health.available}'=true \
  foundationdbcluster/fdb-single --timeout=900s
kubectl -n fdb-system get fdb fdb-single
kubectl -n fdb-system get fdb fdb-single -o jsonpath='configured={.status.configured} available={.status.health.available} fullReplication={.status.health.fullReplication} generation={.metadata.generation} reconciled={.status.generations.reconciled}{"\n"}'
```

期望输出：

```text
foundationdbcluster.apps.foundationdb.org/fdb-single condition met
NAME         GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
fdb-single   1            1            true        true              7.3.69    2m28s
configured=true available=true fullReplication=true generation=1 reconciled=1
```

判断标准：`configured`、`available`、`fullReplication` 都为 `true`，且 `reconciled` 等于 `generation`。仅 Pod 处于 `Running` 不代表 FDB 已可用。FDB 镜像拉取完成后，集群通常在 3 分钟内就绪。

检查 Pod 和 PVC：

```shell
kubectl -n fdb-system get pods,pvc
```

期望输出：

```text
NAME                                                              READY   STATUS    RESTARTS   AGE
pod/fdb-kubernetes-operator-controller-manager-658c6b44d5-ckcdd   1/1     Running   0          3m3s
pod/fdb-single-log-57659                                          2/2     Running   0          2m29s
pod/fdb-single-stateless-17701                                    2/2     Running   0          2m29s
pod/fdb-single-stateless-42431                                    2/2     Running   0          2m29s
pod/fdb-single-storage-92513                                      2/2     Running   0          2m29s

NAME                                                  STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/fdb-single-log-57659-data       Bound    pvc-cac044d8-9dce-421e-8c8f-a24f7d4981b5   10Gi       RWO            standard       <unset>                 2m29s
persistentvolumeclaim/fdb-single-storage-92513-data   Bound    pvc-6b13224b-1ea5-43e3-91ce-40cad1c9530a   10Gi       RWO            standard       <unset>                 2m29s
```

如果长时间未就绪，查看事件和 FDB Operator 日志：

```shell
kubectl -n fdb-system get events --sort-by=.lastTimestamp
kubectl -n fdb-system logs deployment/fdb-kubernetes-operator-controller-manager -c manager --tail=100
```

常见原因包括：StorageClass 写错导致 PVC 无法创建、节点资源不足、存储卷不支持 `fsGroup: 4059` 的写权限。更多排查方法见[部署 FoundationDB](install-fdb.md#私有仓库与常见问题)。

### 5. 确认连接信息

FDB Operator 会在 `fdb-system` 中生成名为 `fdb-single-config` 的 ConfigMap，其中的 `cluster-file` 是 FDB 的连接串：

```shell
kubectl -n fdb-system get configmap fdb-single-config -o jsonpath='{.data.cluster-file}{"\n"}'
```

期望输出类似：

```text
fdb_single:CkSr0MxcWyVky600RxkO7zXqwuTK1TcM@fdb-single-log-57659.fdb-single.fdb-system.svc.cluster.local:4501
```

连接串的格式为 `<描述>:<ID>@<地址>:<端口>`。第 3 步的 Doris 集群通过 `spec.metaService.fdb.configMapNamespaceName` 引用这个 ConfigMap（命名空间 `fdb-system`，名称 `fdb-single-config`）。Doris Operator 创建 MS 时会读取 `cluster-file` 并传给 MS，因此请在 ConfigMap 中能查到 `cluster-file` 之后再部署 Doris 集群。

### 接入已有的 FoundationDB {#use-existing-fdb}

已有 FDB 集群，或按[手动部署存算分离集群](../../deploy-manually/separating-storage-compute-deploy-manually.md)在机器上部署了 FDB 时，不需要执行本节第 1 至 5 小节：

1. 在任一 FDB 节点上获取连接串。使用 FDB 官方安装包部署时，连接串位于 `/etc/foundationdb/fdb.cluster`；使用 Doris 提供的 `fdb_ctl.sh` 部署时，位于 FDB 安装目录下的 `conf/fdb.cluster`。

   ```shell
   cat /etc/foundationdb/fdb.cluster
   ```

   连接串的格式为 `<描述>:<ID>@<IP>:<端口>[,<IP>:<端口>...]`，例如 `doris_fdb:ra7eOp7x@192.168.1.10:4500,192.168.1.11:4500,192.168.1.12:4500`。

2. 在第 3 步的 YAML 中，将 `spec.metaService.fdb` 下的 `configMapNamespaceName` 段替换为 `address`：

   ```yaml
   spec:
     metaService:
       fdb:
         address: "doris_fdb:ra7eOp7x@192.168.1.10:4500,192.168.1.11:4500,192.168.1.12:4500"
   ```

3. 确认 MS 所在的 Kubernetes 节点能访问连接串中的所有地址和端口，且 FDB 服务端版本为 7.1 或 7.3（Doris 4.1.5 的 MS 镜像同时包含这两个系列的客户端）。

## 第 2 步：部署 Doris Operator

本步骤以 Doris Operator 26.0.1 为例介绍 Doris Operator 的安装。命名空间的分工如下：`fdb-system` 存放 FDB 资源，`doris` 存放 Doris Operator 和 Doris 集群。Doris Operator 的 ClusterRole 具有读取所有命名空间 ConfigMap 的权限，因此可以跨命名空间读取 `fdb-system` 中的 FDB 连接信息。

### 1. 安装 CRD

```shell
DORIS_OPERATOR_VERSION=26.0.1
kubectl apply --server-side -f https://raw.githubusercontent.com/apache/doris-operator/${DORIS_OPERATOR_VERSION}/config/crd/bases/crds.yaml
kubectl wait --for=condition=Established --timeout=60s \
  crd/dorisclusters.doris.selectdb.com \
  crd/dorisdisaggregatedclusters.disaggregated.cluster.doris.com
```

期望输出：

```text
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com condition met
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com condition met
```

`crds.yaml` 同时包含存算一体和存算分离的 CRD。已经部署过存算一体集群时，可以直接重复执行该命令，不会报错。

### 2. 部署 Operator

下载存算分离使用的部署清单，并将镜像固定为 `apache/doris:operator-26.0.1`：

```shell
curl -fsSL -o doris-operator.yaml \
  https://raw.githubusercontent.com/apache/doris-operator/${DORIS_OPERATOR_VERSION}/config/operator/disaggregated-operator.yaml
sed -i.bak "s#apache/doris:operator-latest#apache/doris:operator-${DORIS_OPERATOR_VERSION}#" doris-operator.yaml
grep 'image:' doris-operator.yaml
kubectl apply -f doris-operator.yaml
kubectl -n doris rollout status deployment/doris-operator --timeout=300s
```

期望输出：

```text
          image: apache/doris:operator-26.0.1
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
validatingwebhookconfiguration.admissionregistration.k8s.io/doris-operator-validate-webhook created
mutatingwebhookconfiguration.admissionregistration.k8s.io/doris-operator-mutate-webhook created
secret/doris-operator-secret-cert created
service/doris-operator-service created
deployment.apps/doris-operator created
deployment "doris-operator" successfully rolled out
```

`disaggregated-operator.yaml` 在存算一体使用的 `operator.yaml` 基础上，增加了存算分离控制器所需的 Pod `update`、`delete` 和 `pods/exec` 权限。如果之前已经按存算一体教程安装了 Operator，执行上述命令时输出中会出现 `configured` 和 `unchanged`：已有的同名资源会被原地更新，Operator 不会重启，已部署的存算一体集群不受影响。详见[在同一集群中同时运行两种模式](../integrated-storage-compute/install-doris-operator.md#run-both-modes)。

## 第 3 步：部署存算分离集群

### 1. 编写 DorisDisaggregatedCluster 资源 {#ddc-manifest}

将以下内容保存为 `ddc-sample.yaml`：

```yaml
apiVersion: disaggregated.cluster.doris.com/v1
kind: DorisDisaggregatedCluster
metadata:
  name: test-disaggregated-cluster
  namespace: doris
spec:
  metaService:
    image: apache/doris:ms-4.1.5
    replicas: 1
    requests:
      cpu: 1
      memory: 1Gi
    limits:
      cpu: 2
      memory: 2Gi
    fdb:
      configMapNamespaceName:
        name: fdb-single-config
        namespace: fdb-system
  feSpec:
    image: apache/doris:fe-4.1.5
    replicas: 1
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 4
      memory: 10Gi
    persistentVolumes:
    - logNotStore: true
      persistentVolumeClaimSpec:
        # 不设置 storageClassName 时使用集群默认 StorageClass
        # storageClassName: <your-storageclass>
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
  computeGroups:
  - uniqueId: cg1
    image: apache/doris:be-4.1.5
    replicas: 1
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 4
      memory: 8Gi
```

主要字段说明：

| 字段 | 样例取值 | 说明 |
| --- | --- | --- |
| `metadata.namespace` | `doris` | 与 Doris Operator 位于同一命名空间。本教程后续命令都带 `-n doris` |
| `metaService.image`、`feSpec.image`、`computeGroups[].image` | `apache/doris:ms-4.1.5`、`fe-4.1.5`、`be-4.1.5` | MS、FE、BE 必须使用同一版本 |
| `metaService.fdb.configMapNamespaceName` | `fdb-system` / `fdb-single-config` | 第 1 步生成的 FDB 连接信息。接入已有 FDB 时改用 `address`，参见[接入已有的 FoundationDB](#use-existing-fdb) |
| `feSpec.replicas` | 1 | FE 中 Follower 的数量由 `electionNumber` 决定，默认为 1，且部署后不能修改。生产环境请在部署前规划，参见[配置 FE](config-fe.md#配置-follower-节点数量) |
| `feSpec.persistentVolumes` | 10Gi，`logNotStore: true` | 为 FE 元数据目录创建 PVC，日志不写入 PVC。不配置持久化时，FE 重建后元数据会丢失 |
| `computeGroups[].uniqueId` | `cg1` | 计算组名称，部署后不能修改，需匹配 `[a-zA-Z][0-9a-zA-Z_]+` |
| `computeGroups[].replicas` | 1 | 计算组内 BE 的数量。BE 的本地磁盘只作数据缓存，本样例未持久化缓存，BE 重建后缓存需要重新加载 |
| `requests` / `limits` | FE：2 CPU / 4Gi，上限 4 CPU / 10Gi<br />MS：1 CPU / 1Gi，上限 2 CPU / 2Gi<br />BE：2 CPU / 4Gi，上限 4 CPU / 8Gi | 功能测试规格。FE 镜像默认的 JVM 最大堆为 8GB，因此 FE 的内存上限设为 10Gi |

### 2. 部署并等待就绪

```shell
kubectl -n doris apply -f ddc-sample.yaml
kubectl -n doris wait --for=jsonpath='{.status.clusterHealth.health}'=green \
  ddc/test-disaggregated-cluster --timeout=900s
kubectl -n doris wait --for=jsonpath='{.status.clusterHealth.cgFullAvailableCount}'=1 \
  ddc/test-disaggregated-cluster --timeout=900s
kubectl -n doris get ddc test-disaggregated-cluster
```

期望输出：

```text
dorisdisaggregatedcluster.disaggregated.cluster.doris.com/test-disaggregated-cluster created
dorisdisaggregatedcluster.disaggregated.cluster.doris.com/test-disaggregated-cluster condition met
dorisdisaggregatedcluster.disaggregated.cluster.doris.com/test-disaggregated-cluster condition met
NAME                         CLUSTERHEALTH   MSPHASE   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     Ready     1         1                  1
```

Operator 按 MS、FE、计算组的顺序创建组件。镜像拉取完成后，集群通常在 2 分钟内就绪。各列含义如下：

| 列 | 含义 |
| --- | --- |
| `CLUSTERHEALTH` | 集群整体状态。MS 和 FE 都为 `Ready`，且每个计算组至少有一个 BE 可用时为 `green`；MS 或 FE 不可用，或可用的计算组不超过一半时为 `red`；其他情况为 `yellow` |
| `MSPHASE`、`FEPHASE` | MS 和 FE 的状态，就绪时为 `Ready` |
| `CGCOUNT` | 计算组数量 |
| `CGAVAILABLECOUNT` | 至少有一个 BE 可用的计算组数量 |
| `CGFULLAVAILABLECOUNT` | 所有 BE 都已就绪的计算组数量 |

判断标准：`CLUSTERHEALTH` 为 `green`，且 `CGFULLAVAILABLECOUNT` 等于 `CGCOUNT`。`CGAVAILABLECOUNT` 只表示计算组可用，不代表组内所有 BE 都已就绪。计算组有多个 BE 时，请把第二条 `wait` 命令中的 `1` 改为计算组数量。

检查 Pod 和 PVC：

```shell
kubectl -n doris get pods,pvc -l app.doris.disaggregated.cluster=test-disaggregated-cluster
```

期望输出：

```text
NAME                                   READY   STATUS    RESTARTS      AGE
pod/test-disaggregated-cluster-cg1-0   1/1     Running   2 (36s ago)   41s
pod/test-disaggregated-cluster-fe-0    1/1     Running   0             90s
pod/test-disaggregated-cluster-ms-0    1/1     Running   0             96s

NAME                                                               STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/doris-meta-test-disaggregated-cluster-fe-0   Bound    pvc-e0cb2d96-2814-40cb-8e70-2277cd11a3e4   10Gi       RWO            standard       <unset>                 90s
```

首次部署时，BE 可能因为在 FE 中注册自己时的重试而重启一两次（`RESTARTS` 不为 0）。只要最终为 `1/1 Running`，即属正常。

确认 MS 已连接 FDB：

```shell
kubectl -n doris logs test-disaggregated-cluster-ms-0 | grep -E "fdb txn kv is initialized|MetaService has been started"
```

期望输出：

```text
I20261128 09:55:46.269853   231 txn_kv.cpp:162] fdb txn kv is initialized
I20261128 09:55:46.276001   231 main.cpp:292] MetaService has been started successfully
```

MS 启动时可能输出一条包含 `The protocol version of the cluster has changed` 的警告。这是 FDB 多版本客户端选择匹配版本时的正常日志，可以忽略。

如果等待超时，按以下方法排查：

| 现象 | 可能原因与处理方法 |
| --- | --- |
| MS 不断重启，或日志中没有 `fdb txn kv is initialized` | FDB 未就绪、ConfigMap 名称或命名空间写错，或 MS 无法访问 FDB。执行 `kubectl -n doris describe ddc test-disaggregated-cluster`，如果 Events 中有 `FDBAddressNotConfiged`，说明 Operator 没有读到 ConfigMap 中的 `cluster-file`，请回到第 1 步第 5 小节检查 |
| Pod 为 `Pending`、`ImagePullBackOff` 或 `ErrImagePull` | 处理方法与存算一体相同，参见[排查部署问题](../integrated-storage-compute/install-doris-cluster.md#排查部署问题) |
| BE 为 `Init:CrashLoopBackOff` | 执行 `kubectl -n doris logs test-disaggregated-cluster-cg1-0 -c default-init`。退出码为 32 时，通常是节点开启了 swap，参见[检查节点 swap](../doris-operator/preparation.mdx#检查节点-swap) |
| BE 持续 `CrashLoopBackOff` | 执行 `kubectl -n doris logs test-disaggregated-cluster-cg1-0 --previous` 查看上一次启动的日志 |

## 第 4 步：创建 Storage Vault {#create-storage-vault}

### 1. 连接 FE

FE 镜像自带 MySQL 客户端，可以直接进入 FE Pod 连接集群：

```shell
kubectl -n doris exec -it test-disaggregated-cluster-fe-0 -- mysql -h 127.0.0.1 -P 9030 -uroot
```

首次部署时，`root` 用户没有密码。如果本地电脑已安装 MySQL 客户端，也可以先执行 `kubectl -n doris port-forward svc/test-disaggregated-cluster-fe 9030:9030`，再在另一个终端中执行 `mysql -h 127.0.0.1 -P 9030 -uroot`。从集群外长期访问的配置方法见[配置 FE](config-fe.md#访问配置)。

此时还没有 Storage Vault，建表会失败并返回：

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = No default storage vault. You can use `SHOW STORAGE VAULT` to get all available vaults, and pick one set default vault with `SET <vault_name> AS DEFAULT STORAGE VAULT`
```

### 2. 创建 Storage Vault

使用[准备对象存储](../doris-operator/preparation.mdx#object-storage)时获取的信息替换以下语句中的占位符：

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "<endpoint>",
    "s3.region" = "<region>",
    "s3.bucket" = "<bucket>",
    "s3.root.path" = "<prefix>",
    "s3.access_key" = "<access_key>",
    "s3.secret_key" = "<secret_key>",
    "provider" = "<provider>",
    "use_path_style" = "<true_or_false>"
);
```

例如，使用阿里云北京地域的 OSS 时：

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
    "s3.region" = "cn-beijing",
    "s3.bucket" = "doris-data",
    "s3.root.path" = "doris/test-disaggregated-cluster",
    "s3.access_key" = "<access_key>",
    "s3.secret_key" = "<secret_key>",
    "provider" = "OSS",
    "use_path_style" = "false"
);
```

使用在 Kubernetes 集群内自行部署的 S3 兼容服务时，`s3.endpoint` 填写该服务的 Service 地址，`provider` 填写 `S3`，`use_path_style` 填写 `true`。例如 `"s3.endpoint" = "http://<service>.<namespace>.svc.cluster.local:9000"`。

期望输出：

```text
Query OK, 0 rows affected (0.47 sec)
```

创建 Storage Vault 时，FE 会访问对象存储，检查 Endpoint、凭证以及 put、head、delete、list、multipartUpload 权限；检查失败时不会创建 Storage Vault。常见错误如下：

| 错误信息 | 原因 |
| --- | --- |
| `pingS3 failed(put)` 且包含 `Status Code: 403` | Access Key / Secret Key 错误，或凭证缺少该前缀下的写权限 |
| `pingS3 failed(put)` 且包含 `UnknownHostException` | Endpoint 写错，或 Pod 内无法解析 Endpoint 的域名 |

各云厂商的属性说明及示例参见[管理 Storage Vault](../../../compute-storage-decoupled/managing-storage-vault.md)。Storage Vault 创建后不支持删除，请确认属性正确后再创建。

### 3. 设为默认 Storage Vault

```sql
SET s3_vault AS DEFAULT STORAGE VAULT;
SHOW STORAGE VAULTS\G
```

期望输出类似：

```text
*************************** 1. row ***************************
     Name: s3_vault
       Id: 1
Propeties: ctime: 1795859872 mtime: 1795859872 ak: "<access_key>" sk: "xxxxxxx" bucket: "<bucket>" prefix: "<prefix>" endpoint: "http://<endpoint>" region: "<region>" provider: <provider> external_endpoint: "" encryption_info { encryption_method: "AES_256_ECB" key_id: 1 } sse_enabled: false use_path_style: <true_or_false>
IsDefault: true
```

`IsDefault` 为 `true` 表示建表时未指定 Storage Vault 的表都会写入 `s3_vault`。输出中 Secret Key 显示为 `xxxxxxx`；`s3.endpoint` 未写协议时，Doris 会自动补全为 `http://`。

## 第 5 步：验证读写

在同一个 MySQL 连接中执行以下语句。

### 1. 确认 FE 和 BE 状态

```sql
SHOW FRONTENDS\G
SHOW BACKENDS\G
```

期望输出（节选）：

```text
*************************** 1. row ***************************
              Name: fe_bb3b1189_fe1c_4b2a_888f_e626ee55a63a
              Host: test-disaggregated-cluster-fe-0.test-disaggregated-cluster-fe-internal.doris.svc.cluster.local
              ...
              Role: FOLLOWER
          IsMaster: true
              ...
             Alive: true
              ...
1 row in set (0.00 sec)

*************************** 1. row ***************************
              BackendId: 1795859798462
                   Host: test-disaggregated-cluster-cg1-0.test-disaggregated-cluster-cg1.doris.svc.cluster.local
                   ...
                  Alive: true
                   ...
                    Tag: {"cloud_unique_id" : "1:1814801713:OU2S2nox", "compute_group_status" : "NORMAL", "private_endpoint" : "", "compute_group_name" : "cg1", "location" : "default", "public_endpoint" : "", "compute_group_id" : "AoxMKnwT"}
                   ...
1 row in set (0.00 sec)
```

`SHOW FRONTENDS` 返回 1 行，`IsMaster` 和 `Alive` 都为 `true`。`SHOW BACKENDS` 返回的行数等于所有计算组的 BE 总数（本教程为 1），`Alive` 为 `true`，`Tag` 中的 `compute_group_name` 为 `cg1`。

### 2. 写入并查询测试数据

```sql
CREATE DATABASE IF NOT EXISTS k8s_demo;
DROP TABLE IF EXISTS k8s_demo.hello;
CREATE TABLE k8s_demo.hello (
    id INT,
    msg VARCHAR(64)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;
INSERT INTO k8s_demo.hello VALUES (1, 'hello doris');
SELECT * FROM k8s_demo.hello;
```

`INSERT` 的期望输出：

```text
Query OK, 1 row affected (0.24 sec)
{'label':'label_7703464ad56a4432_afeb67948cec9a2c', 'status':'VISIBLE', 'txnId':'1425240708096'}
```

`SELECT` 的期望输出：

```text
+------+-------------+
| id   | msg         |
+------+-------------+
|    1 | hello doris |
+------+-------------+
1 row in set (0.04 sec)
```

`k8s_demo.hello` 仅用于验证。这组语句会先删除并重建该表，因此可以重复执行，每次都应该只返回这一行。存算分离模式的数据写入对象存储，建表时不需要设置副本数。查询返回这一行，并且对象存储中 `s3.root.path` 前缀下出现了新文件，表示 FE、MetaService、FDB、计算组和 Storage Vault 组成的读写链路已经打通。

至此，集群已经可以读写数据。删除 FE 或 BE 的 Pod 后，Pod 会自动重建，已写入的数据仍然可以查询：FE 元数据保存在 PVC 中，表数据保存在对象存储中。

## 生产使用前

本教程得到的是可读写的测试集群，与生产就绪还有以下差距：

| 项目 | 本教程 | 生产环境建议 |
| --- | --- | --- |
| FoundationDB | 单副本，降低了内存配置 | 双副本，至少三个独立的宿主机故障域，参见[部署 FoundationDB](install-fdb.md) |
| FE | 1 个 Follower | 部署前规划 Follower 数量，参见[配置 FE](config-fe.md) |
| 计算组 | 1 个 BE，缓存未持久化 | 按负载规划计算组和 BE 数量，为缓存配置持久化存储，参见[配置计算组](config-cg.md) |
| 资源 | `requests` 小于 `limits` | 按负载规划资源，并将 `requests` 和 `limits` 设为相同的值 |
| 认证 | `root` 用户无密码 | 设置 root 密码和管理用户，参见[配置认证](config-cluster.md) |

## 清理测试集群

按以下顺序删除。删除前请确认这些资源没有被其他 Doris 集群使用：

1. 删除 Doris 集群。FE 元数据的 PVC 会保留：

   ```shell
   kubectl -n doris delete ddc test-disaggregated-cluster
   kubectl -n doris delete pvc -l app.doris.disaggregated.cluster=test-disaggregated-cluster
   ```

2. 删除 FoundationDB 集群。FDB Operator 会同时删除 FDB 的 PVC 和 ConfigMap，**FDB 中的所有元数据都将丢失且无法恢复**。多个 Doris 集群共用同一个 FDB 时，不要执行这一步：

   ```shell
   kubectl -n fdb-system delete foundationdbcluster fdb-single
   ```

3. 对象存储中 `s3.root.path` 前缀下的数据不会被自动删除。如果不再需要，请在对象存储中手动删除该前缀。

## 进阶配置

完成上述 5 步后，可以按需继续定制集群：

| 关注点 | 参考文档 | 主要内容 |
|--------|----------|----------|
| FoundationDB 部署细节、两副本/生产模式、FDB 7.1、私有镜像仓库 | [部署 FoundationDB](install-fdb.md) | FDB 部署的完整原理与所有部署形态 |
| 切换 MetaService 镜像、调资源、定制启动参数、调存活探测超时 | [配置 MetaService](config-ms.md) | `spec.metaService.*` 全量字段 |
| 调 FE 资源、改 Follower 数量、自定义启动配置、配置访问模式（NodePort / LoadBalancer）、持久化存储 | [配置 FE](config-fe.md) | `spec.feSpec.*` 全量字段 |
| 单组/多组计算组、限制资源、配置访问模式、缓存与日志的持久化 | [配置计算组](config-cg.md) | `spec.computeGroups[*]` 全量字段 |
| 设置 root / 非 root 管理用户密码、Secret 凭证、挂载 Kerberos 认证文件 | [配置认证](config-cluster.md) | 集群级凭证与 Kerberos |
| BE 扩缩容、新增或移除计算组、检查缩容和 PVC 清理 | [调整计算容量](config-cg.md#scaling-compute-groups) | 操作步骤、退役行为与结果验证 |
