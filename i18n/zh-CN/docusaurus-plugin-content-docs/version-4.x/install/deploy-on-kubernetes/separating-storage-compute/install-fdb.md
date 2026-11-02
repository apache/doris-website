---
{
    "title": "部署 FoundationDB",
    "language": "zh-CN",
    "description": "在 Kubernetes 上安装版本配套的 FoundationDB Operator 和数据库，涵盖 SelectDB/VeloDB 镜像源、测试与双副本资源规划、MetaService 客户端兼容性、存储权限和就绪验证。",
    "keywords": [
        "Doris",
        "Kubernetes",
        "FoundationDB",
        "fdb-kubernetes-operator",
        "resources",
        "SelectDB",
        "VeloDB"
    ]
}
---

FoundationDB（FDB）为 Doris 存算分离集群存储元数据。可以复用已有且可访问的 FDB，或参考[机器部署说明](../../deploy-manually/separating-storage-compute-deploy-manually.md)在 Kubernetes 外部部署。本章介绍 **Kubernetes 全新安装**，不用于升级已有数据库、控制器或共享 CRD。

## 部署前准备

- 安装前检查已有 FDB 控制器和数据库。CRD 是集群级资源；已有兼容控制器时优先复用，不要部署监听范围重叠的控制器，也不要未经升级评估覆盖共享 CRD。
- 准备创建 CRD、RBAC 和工作负载的 Kubernetes 权限、可写的 SSD StorageClass、正常的集群 DNS，以及 MetaService 到 FDB Pod 的网络连通性。
- 核对 **MetaService 构建产物**包含的 FoundationDB 客户端库。7.3.69 样例要求兼容的 7.3 客户端。Operator 的初始化客户端不会更新 MetaService。需要 7.1 的构建产物，应先按 [7.1 方案](#fdb-71)准备，再创建数据库。
- 本章资源预设用于容量规划，不是通用最低要求或生产容量保证。生产使用前，应结合 Doris 构建版本和实际负载验证整套组合。

## 版本与镜像来源

安装使用 [Doris Operator 仓库中的版本目录](https://github.com/apache/doris-operator/tree/9e8feacc6518a4d6d254a42998355a4d58cbd820/config/fdb/v2.35.0)，其中 CRD 原样同步自 FoundationDB Operator v2.35.0。[来源与 SHA-256 校验记录](https://github.com/apache/doris-operator/blob/9e8feacc6518a4d6d254a42998355a4d58cbd820/config/fdb/v2.35.0/UPSTREAM.md)标明了上游提交。下方所有安装地址均固定到同一个 Doris Operator commit。

| 组件 | 版本 | SelectDB 镜像 | VeloDB 备选镜像 |
| --- | --- | --- | --- |
| FDB Operator / 配套 CRD | v2.35.0 | `selectdb/fdb-kubernetes-operator:v2.35.0` | `velodb/fdb-kubernetes-operator:v2.35.0` |
| 控制器初始化客户端 / FDB 数据库 | 7.3.69 | `selectdb/fdb-kubernetes-monitor:7.3.69` | `velodb/fdb-kubernetes-monitor:7.3.69` |

上述镜像 tag 均支持 linux/amd64 和 linux/arm64。数据库采用 `imageType: unified`，主镜像同时用于 `foundationdb` 和 `foundationdb-kubernetes-sidecar` 容器，无需单独的 split sidecar 镜像。控制器初始化容器也使用 Monitor 镜像，但与数据库容器是不同用途。

不要混用本版本目录与旧版 `config/operator/fdb-operator.yaml`、根目录 FDB CRD、旧集群样例或旧版 `doris-foundationdb` Helm Chart。仅替换镜像仓库前缀不能保证这些配置相互兼容。

## 资源规划 {#resource-planning}

FDB Operator 是控制器，不是数据库。控制器样例的 requests 和 limits 均为 **500m CPU / 256Mi**；其初始化客户端均为 **10m CPU / 50Mi**。数据库资源单独规划：

| 配置项 | 单副本：仅开发测试 | 双副本：基础配置起点 |
| --- | --- | --- |
| storage / log / stateless Pod 数量 | 1 / 1 / 2 | 3 / 4 / 9 |
| 每个主容器 requests | 1 CPU / 1Gi | 1 CPU / 8Gi |
| 每个主容器 limits | 1 CPU / 2Gi | 2 CPU / 8Gi |
| 每个 sidecar requests = limits | 100m CPU / 256Mi | 100m CPU / 256Mi |
| 每个 storage / log Pod 的 PVC | 10Gi / 10Gi | 200Gi / 100Gi |
| Pod / PVC 总数 | 4 / 2 | 16 / 7 |
| requests 合计，包含 sidecar | **4.4 CPU / 5Gi** | **17.6 CPU / 132Gi** |
| PVC 申请容量合计 | 20Gi | 1000Gi |

以上按样例 YAML 计算，不包含 Operator、MS/FE/BE、Kubernetes 系统开销和临时替换 Pod/PVC。Stateless Pod 不配置持久化数据 PVC。低内存单副本方案仅用于小规模功能测试，需要结合实际负载检查 memory/cache 配置及 OOM 行为。上游主容器默认 requests 为 1 CPU / 8Gi，limits 与之相同，参见[上游资源说明](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/warnings.md#resource-requirements)。

双副本应提供至少三个独立宿主机故障域，并检查实际 storage/log/coordinator 分布。Pod 数量不等于宿主机数量；软反亲和只是调度偏好，不保证物理分散。如果将所有角色都改为同角色每节点一个 Pod 的硬反亲和，九个 stateless Pod 至少需要九个可调度节点。参见[上游故障域说明](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/fault_domains.md)。

使用 SSD 存储，按共享 FDB 的所有 Doris 集群的元数据总量、写入负载、复制和恢复余量规划 storage/log PVC。200Gi / 100Gi 是可调整的起点，不是适用于所有负载的固定推荐。每个 Pod 保持一个 storage/log server；如需多个进程，必须重新核算资源。

## 在 Kubernetes 上部署 FoundationDB

样例将控制器和数据库均放在 `fdb-system`，控制器仅监听自身所在 namespace。改用其他 namespace 时，应同时修改下载文件中的所有 namespaced 对象和 RBAC subject namespace。

### 第 1 步：下载固定版本的安装资源

显式设置 kubeconfig，先检查已有安装和 StorageClass：

```shell
export KUBECONFIG=/path/to/kubeconfig
kubectl --kubeconfig "$KUBECONFIG" get crd foundationdbclusters.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" get deployments -A
kubectl --kubeconfig "$KUBECONFIG" get storageclass
```

已有 FDB CRD/控制器时，应先完成兼容性评估。否则，在新的本地目录中下载配套文件：

```shell
mkdir fdb-install-v2.35.0
cd fdb-install-v2.35.0
FDB_ASSETS=https://raw.githubusercontent.com/apache/doris-operator/9e8feacc6518a4d6d254a42998355a4d58cbd820/config/fdb/v2.35.0
FDB_EXAMPLES=https://raw.githubusercontent.com/apache/doris-operator/9e8feacc6518a4d6d254a42998355a4d58cbd820/doc/examples/disaggregated/fdb/v2.35.0
for resource in clusters backups restores; do
  curl -fSL "$FDB_ASSETS/crds/apps.foundationdb.org_foundationdb${resource}.yaml" -o "fdb-${resource}-crd.yaml"
done
curl -fSL "$FDB_ASSETS/operator.yaml" -o fdb-operator.yaml
curl -fSL "$FDB_ASSETS/monitor-rbac.yaml" -o fdb-monitor-rbac.yaml
# 开发测试配置。双副本配置请改为下载 cluster-double.yaml。
curl -fSL "$FDB_EXAMPLES/cluster-single.yaml" -o fdb-cluster.yaml
```

### 第 2 步：安装 CRD、控制器和 Monitor RBAC

先审阅下载的文件。使用 VeloDB 镜像时，将 Operator 镜像、初始化容器镜像和数据库镜像配置中的 `selectdb/` 替换为 `velodb/`，保留版本 tag。

```shell
kubectl --kubeconfig "$KUBECONFIG" create namespace fdb-system
kubectl --kubeconfig "$KUBECONFIG" apply --server-side \
  -f fdb-clusters-crd.yaml -f fdb-backups-crd.yaml -f fdb-restores-crd.yaml
kubectl --kubeconfig "$KUBECONFIG" wait --for=condition=Established --timeout=60s \
  crd/foundationdbclusters.apps.foundationdb.org \
  crd/foundationdbbackups.apps.foundationdb.org \
  crd/foundationdbrestores.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-operator.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-monitor-rbac.yaml
```

预期结果：三个 CRD 均为 Established，控制器 Deployment rollout 成功。Server-side apply 避免生成过大的 client-side last-applied 注解；不要使用 `--force-conflicts` 覆盖已有安装。

Monitor 使用独立的 `fdb-monitor` ServiceAccount，只授予本 namespace 的 Pod get/list/watch/patch 权限，与控制器权限分开配置。

### 第 3 步：配置并创建数据库

应用 `fdb-cluster.yaml` 前完成以下调整：

1. 将**两处** `REPLACE_WITH_SSD_STORAGE_CLASS` 替换为适用的 StorageClass。
2. 选择单副本或双副本，核对上方资源总量。生产环境不使用单副本。
3. 保持 `spec.version`、`mainContainer.imageConfigs[].version` 和 `tag` 与 Monitor 镜像内的二进制版本一致。需要 7.1 时先完成 [7.1 方案](#fdb-71)。
4. 对上述镜像保留 `runAsUser`、`runAsGroup` 和 `fsGroup: 4059`，确认 CSI 驱动支持该身份写入挂载卷。自定义镜像可能需要其他身份。
5. 保留样例中的独立 Monitor ServiceAccount、宿主机故障域、FQDN 路由和每 Pod 一个 server 的设置。

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-cluster.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb
```

单副本样例创建 `fdb-single`，双副本样例创建 `fdb-double`。后续命令以 `fdb-single` 为例，使用双副本时替换为 `fdb-double`。

### 第 4 步：验证可用性与调谐状态

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get pods,pvc
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb fdb-single -o yaml
```

分别确认以下阶段：

- PVC 已绑定，数据库容器正常启动；仅 Pod Running 不代表安装成功。
- `status.configured`、`status.health.available`、`status.health.fullReplication` 均为 `true`。
- `status.generations.reconciled` 已追上 `metadata.generation`。数据库可用时，仍可能处于替换或缩容调谐中。

随后通过生成的 ConfigMap 配置 MetaService，验证实际 FDB 连接成功，再创建表。依赖宿主机容错前还需检查数据库健康、容错状态和 coordinator 分布。这些样例不代表已经完成故障注入或生产负载验证。

## 获取包含 FoundationDB 访问信息的 ConfigMap {#get-the-configmap-that-contains-foundationdb-access-information}

Operator 在数据库所在 namespace 生成 `<FoundationDBCluster 名称>-config`：

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get configmap fdb-single-config -o yaml
```

在 Doris 资源中配置如下；双副本样例使用 `fdb-double-config`：

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        namespace: fdb-system
        name: fdb-single-config
```

完整配置见[配置 MetaService](config-ms.md)。多个 Doris 集群可以共享 FDB，需要合并计算负载。删除 Doris 集群时应保留共享 FDB；删除 FDB 资源或 PVC 可能毁坏元数据，应单独规划备份和恢复。

## MetaService 需要 FDB 7.1 时的方案 {#fdb-71}

对于需要 7.1 客户端/服务端组合的 **amd64 全新安装**，使用已同步的 Monitor `7.1.67`，创建数据库前先补充控制器客户端：

```shell
curl -fSL "$FDB_ASSETS/operator-client-7.1.patch.yaml" -o fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system patch \
  deployment fdb-kubernetes-operator-controller-manager --type=strategic \
  --patch-file fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
```

将下载的集群 YAML 中 `spec.version`、主镜像配置的 `version` 和 `tag` 一起改为 `7.1.67`。使用 VeloDB 时，也应将补丁中的镜像改为 `velodb/fdb-kubernetes-monitor:7.1.67`。7.1.67 镜像仅支持 amd64；混合架构集群需在控制器及所有数据库 Pod 模板中设置 `nodeSelector: {kubernetes.io/arch: amd64}`。确认 MetaService 兼容性后再使用。这不是已有数据库的降级流程。

## 私有仓库与常见问题

使用私有仓库时，应同步控制器及**所有启用的初始化客户端/数据库镜像**，保留所需平台。修改 Operator 和初始化容器的 `image`，以及数据库的 `mainContainer.imageConfigs[].baseImage`。需要鉴权时，在控制器和数据库 Pod 模板中分别配置 `imagePullSecrets`。Unified 模式不再配置独立 split sidecar 镜像，并保持二进制版本一致。

| 现象 | 检查项 |
| --- | --- |
| 控制器 init 失败 / 镜像无法运行 | 镜像源、tag、节点架构；可选 7.1 初始化镜像仅支持 amd64 |
| PVC 或 Pod Pending | StorageClass、CSI 供应、容量、资源 requests、节点选择和反亲和 |
| `File could not be written` | 卷属主、UID/GID/fsGroup，以及 CSI 权限处理 |
| FDB 未完成调谐 | 控制器监听 namespace/RBAC、Event、控制器日志、替换容量和恢复进度 |
| FDB 可用但 MS 连接失败 | MetaService 客户端兼容性、生成的连接信息、DNS 和 Pod 网络 |

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get events --sort-by=.metadata.creationTimestamp
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system logs \
  deployment/fdb-kubernetes-operator-controller-manager -c manager --tail=100
```

不要通过删除共享 CRD、数据库或 PVC 处理启动和调谐问题。
