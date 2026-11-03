---
{
    "title": "部署 FoundationDB",
    "language": "zh-CN",
    "description": "在 Kubernetes 上安装版本配套的 FoundationDB Operator 和数据库，涵盖 SelectDB 镜像源、测试与双副本资源规划、MetaService 客户端兼容性、存储权限和就绪验证。",
    "keywords": [
        "Doris",
        "Kubernetes",
        "FoundationDB",
        "fdb-kubernetes-operator",
        "resources",
        "SelectDB"
    ]
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview)（FDB）是一个分布式强一致性数据库，Doris 存算分离模式使用 FoundationDB 存储元数据。

部署 Doris 存算分离集群前，需要先准备好 FoundationDB 服务。可以根据现有环境选择以下方式：

- 在机器上直接部署，具体步骤请参考[机器部署说明](../../deploy-manually/separating-storage-compute-deploy-manually.md)。部署完成后，需要确保 MetaService 能够访问 FoundationDB。
- 在 Kubernetes 上通过 fdb-kubernetes-operator 部署，具体步骤见下文。

## 部署前准备

在 Kubernetes 上部署 FoundationDB，需要提前准备：

- 具有创建 CRD、RBAC 和工作负载权限的 Kubernetes 账号。
- 可写的 SSD StorageClass，以及满足下方资源配置的节点。
- 正常的集群 DNS，以及 MetaService 到 FDB Pod 的网络连通性。

本章样例使用 FDB 7.3.69，MetaService 需要包含兼容的 7.3 客户端库。如果当前 Doris 版本使用 7.1 客户端，请按 [FDB 7.1 部署说明](#fdb-71)配置。Operator 中的客户端仅供控制器使用，不会更新 MetaService 的客户端库。

:::tip 提示
本章介绍新建 FDB 集群的步骤。如果环境中已有 FDB Operator，可以在确认版本兼容后复用，避免多个控制器管理同一 namespace。CRD 为集群级资源，更新前需检查已有 FDB 集群的兼容性；已有集群的升级需要单独规划。
:::

## 版本与镜像来源

本章使用 [Doris Operator 仓库提供的部署样例](https://github.com/apache/doris-operator/tree/bae8554666d68d24cd10b06a6b868a372b59a5a4/config/fdb/v2.35.0)。CRD 从 [VeloDB FDB Operator 仓库的 v2.35.0](https://github.com/velodb/fdb-kubernetes-operator/tree/v2.35.0/config/crd/bases) 下载，与本章使用的 Operator v2.35.0 配套。部署样例来源和 CRD 校验信息可查看[版本说明](https://github.com/apache/doris-operator/blob/bae8554666d68d24cd10b06a6b868a372b59a5a4/config/fdb/v2.35.0/UPSTREAM.md)。部署样例使用的镜像如下：

| 组件 | 版本 | SelectDB 镜像 |
| --- | --- | --- |
| FDB Operator / 配套 CRD | v2.35.0 | `selectdb/fdb-kubernetes-operator:v2.35.0` |
| 控制器初始化客户端 / FDB 数据库 | 7.3.69 | `selectdb/fdb-kubernetes-monitor:7.3.69` |

上述镜像均支持 linux/amd64 和 linux/arm64。样例采用 `imageType: unified`，FDB 主容器和 sidecar 共用 Monitor 镜像，控制器也使用该镜像初始化客户端。

请配套使用本章提供的 CRD、Operator 和集群样例。仓库中的旧版 `config/operator/fdb-operator.yaml`、根目录 FDB CRD、旧集群样例和 `doris-foundationdb` Helm Chart 使用了不同版本，不能直接与本章配置混用。

## 资源规划 {#resource-planning}

部署资源包括 FDB Operator 和 FDB 集群两部分。Operator 的 requests 和 limits 均为 **500m CPU / 256Mi**，初始化客户端均为 **10m CPU / 50Mi**。

Doris Operator 仓库提供了单副本和双副本两种集群样例，可以根据使用场景选择：

| 配置项 | 单副本（开发测试） | 双副本 |
| --- | --- | --- |
| storage / log / stateless Pod 数量 | 1 / 1 / 2 | 3 / 4 / 9 |
| 每个主容器 requests | 1 CPU / 1Gi | 1 CPU / 8Gi |
| 每个主容器 limits | 1 CPU / 2Gi | 2 CPU / 8Gi |
| 每个 sidecar requests = limits | 100m CPU / 256Mi | 100m CPU / 256Mi |
| 每个 storage / log Pod 的 PVC | 10Gi / 10Gi | 200Gi / 100Gi |
| Pod / PVC 总数 | 4 / 2 | 16 / 7 |
| requests 合计，包含 sidecar | **4.4 CPU / 5Gi** | **17.6 CPU / 132Gi** |
| PVC 申请容量合计 | 20Gi | 1000Gi |

表中资源总量包含 sidecar，不包含 Operator、MS/FE/BE 和 Kubernetes 系统开销。Stateless Pod 无需持久化数据 PVC；集群滚动替换时还需要预留额外的 Pod 和存储空间。

单副本配置适合小规模功能测试。样例降低了内存配置，使用时需关注 memory/cache 配置和 OOM 情况。上游主容器默认分配 1 CPU / 8Gi，requests 与 limits 相同，详见[资源配置说明](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/warnings.md#resource-requirements)。

双副本集群至少需要三个独立宿主机故障域。部署后请检查 storage、log 和 coordinator 是否合理分布在不同节点上。样例采用软反亲和，允许同一角色的多个 Pod 调度到同一节点；如果改为同角色每节点一个 Pod 的硬反亲和，九个 stateless Pod 就需要至少九个可调度节点。具体说明见[故障域配置](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/fault_domains.md)。

生产环境建议使用 SSD，并根据元数据量、写入负载和恢复所需空间调整资源。样例为每个 storage Pod 分配 200Gi、log Pod 分配 100Gi，可以按需修改。多个 Doris 集群共享 FDB 时，应按总负载规划容量，并在上线前进行负载验证。样例中每个 storage/log Pod 运行一个 server，增加进程数时需相应调整 CPU 和内存。

## 在 Kubernetes 上部署 FoundationDB

在 Kubernetes 上部署 FoundationDB 分为四步：

1. 下载部署文件。
2. 部署 CRD、FDB Operator 和 Monitor RBAC。
3. 部署 FoundationDB 集群。
4. 确认集群状态。

以下步骤使用 `fdb-system` namespace，Operator 仅管理该 namespace 中的 FDB 集群。如需使用其他 namespace，请同时修改部署文件中的对象 namespace 和 RBAC subject namespace。

### 第 1 步：下载固定版本的安装资源

将 `/path/to/kubeconfig` 替换为目标 Kubernetes 集群的配置文件路径，然后查看已有的 FDB 资源、控制器和 StorageClass：

```shell
export KUBECONFIG=/path/to/kubeconfig
kubectl --kubeconfig "$KUBECONFIG" get crd foundationdbclusters.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" get deployments -A
kubectl --kubeconfig "$KUBECONFIG" get storageclass
```

如果已有 FDB CRD 或控制器，请先确认是否可以复用。新建环境可以通过以下命令下载部署文件：

```shell
mkdir fdb-install-v2.35.0
cd fdb-install-v2.35.0
FDB_CRDS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/v2.35.0/config/crd/bases
FDB_ASSETS=https://raw.githubusercontent.com/apache/doris-operator/bae8554666d68d24cd10b06a6b868a372b59a5a4/config/fdb/v2.35.0
FDB_EXAMPLES=https://raw.githubusercontent.com/apache/doris-operator/bae8554666d68d24cd10b06a6b868a372b59a5a4/doc/examples/disaggregated/fdb/v2.35.0
for resource in clusters backups restores; do
  curl -fSL "$FDB_CRDS/apps.foundationdb.org_foundationdb${resource}.yaml" -o "fdb-${resource}-crd.yaml"
done
curl -fSL "$FDB_ASSETS/operator.yaml" -o fdb-operator.yaml
curl -fSL "$FDB_ASSETS/monitor-rbac.yaml" -o fdb-monitor-rbac.yaml
# 开发测试配置。双副本配置请改为下载 cluster-double.yaml。
curl -fSL "$FDB_EXAMPLES/cluster-single.yaml" -o fdb-cluster.yaml
```

### 第 2 步：安装 CRD、控制器和 Monitor RBAC

部署文件使用上表中的 SelectDB 镜像。

通过以下命令部署 CRD、Operator 和 Monitor RBAC：

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

三个 CRD 均为 Established，且 Operator Deployment rollout 成功后，即可继续部署 FDB 集群。CRD 文件较大，因此使用 `--server-side` 避免超出 last-applied 注解大小限制。如果与已有资源发生冲突，请先检查版本和资源归属，不要直接使用 `--force-conflicts` 覆盖。

`fdb-monitor-rbac.yaml` 为 FDB Pod 创建独立的 `fdb-monitor` ServiceAccount，授予本 namespace 中 Pod 的 get/list/watch/patch 权限。

### 第 3 步：配置并创建数据库

打开下载的 `fdb-cluster.yaml`，将两处 `REPLACE_WITH_SSD_STORAGE_CLASS` 替换为实际使用的 StorageClass，并根据前面的资源规划调整 CPU、内存和 PVC 容量。单副本样例用于开发测试，生产环境请选择双副本并按实际负载调整。

样例已经配置好 Monitor ServiceAccount、宿主机故障域、FQDN 路由和每 Pod 一个 server。修改配置时还需注意：

- `spec.version`、`mainContainer.imageConfigs[].version` 和 `tag` 应与镜像中的 FDB 版本一致。使用 7.1 时，请先完成 [FDB 7.1 配置](#fdb-71)。
- 样例使用 UID/GID 4059 运行容器，并通过 `fsGroup: 4059` 配置卷权限，需要确认 CSI 驱动支持该用户组写入。使用自定义镜像时，请按镜像中的用户信息调整。

配置完成后，通过以下命令部署集群：

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

部署完成后，检查以下状态：

- PVC 已绑定，数据库容器正常启动；仅 Pod Running 不代表安装成功。
- `status.configured`、`status.health.available`、`status.health.fullReplication` 均为 `true`。
- `status.generations.reconciled` 已追上 `metadata.generation`。数据库可用时，仍可能处于替换或缩容调谐中。

上述状态正常后，即可使用生成的 ConfigMap 配置 MetaService。连接成功后再创建表。生产使用前，还需验证集群的健康状态、coordinator 分布和宿主机故障时的可用性。

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

将以上配置更新到 `DorisDisaggregatedCluster` 资源中，完整说明见[配置 MetaService](config-ms.md)。

:::tip 提示
多个 Doris 集群可以共享同一个 FDB，删除其中一个 Doris 集群时需要保留共享的 FDB。删除 FDB 资源或 PVC 可能导致元数据丢失，请提前做好备份和恢复规划。
:::

## MetaService 需要 FDB 7.1 时的方案 {#fdb-71}

如果 MetaService 使用 7.1 客户端，可以在 amd64 环境中新建 FDB 7.1.67 集群。先通过以下命令为 Operator 添加 7.1 客户端，再部署 FDB 集群：

```shell
curl -fSL "$FDB_ASSETS/operator-client-7.1.patch.yaml" -o fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system patch \
  deployment fdb-kubernetes-operator-controller-manager --type=strategic \
  --patch-file fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
```

将下载的集群 YAML 中 `spec.version`、主镜像配置的 `version` 和 `tag` 一起改为 `7.1.67`。7.1.67 镜像仅支持 amd64；混合架构集群需在控制器及所有数据库 Pod 模板中设置 `nodeSelector: {kubernetes.io/arch: amd64}`。该配置用于新建兼容当前 MetaService 的集群，不用于已有 FDB 集群的降级。

## 私有仓库与常见问题

如果环境无法直接访问 Docker Hub，可以先将所需镜像同步到私有仓库，再修改部署文件中的镜像地址：

- Operator 和初始化容器：修改 `image`。
- FDB 集群：修改 `mainContainer.imageConfigs[].baseImage`，保持镜像内的 FDB 版本与 `spec.version` 一致。Unified 模式下，主容器和 sidecar 共用该镜像。
- 私有仓库需要鉴权时，在 Operator 和 FDB Pod 模板中分别配置 `imagePullSecrets`。

同步镜像时，请包含所有启用的初始化客户端镜像，并选择与节点架构一致的平台。常见部署问题及检查方法如下：

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

排查过程中请保留共享 CRD、FDB 集群和 PVC，避免影响已有集群的数据。
