---
{
    "title": "03 部署 Doris 集群",
    "language": "zh-CN",
    "description": "在 Kubernetes 上使用 Doris Operator 部署 1 FE + 1 BE 的 Apache Doris 存算一体集群：编写带持久化存储的 DorisCluster 资源、等待集群就绪、排查常见问题，并在 FE Pod 内连接集群完成建表、写入和查询验证。",
    "keywords": ["Doris 集群部署", "Kubernetes", "K8s", "DorisCluster", "存算一体", "快速部署", "PVC", "读写验证"]
}
---

本页以 Doris 4.1.5 的 1 FE + 1 BE 存算一体集群为例介绍 Doris 集群的部署，集群位于 `doris` 命名空间中。部署完成后，在 FE Pod 内连接集群，完成建表、写入和查询验证。

开始前请确认：

- 已完成[部署前准备](../doris-operator/preparation.mdx)：集群有默认 StorageClass，节点可分配资源至少还有 4 CPU / 8Gi，且 Pod 安全策略允许 BE 的特权初始化容器。
- 已按[部署 Doris Operator](install-doris-operator.md)安装 CRD 和 Operator，Operator Pod 处于 `Running` 状态。

## 第 1 步：准备 DorisCluster 资源 {#prepare-doriscluster}

将以下内容保存为 `doriscluster-sample.yaml`：

```yaml
apiVersion: doris.selectdb.com/v1
kind: DorisCluster
metadata:
  name: doriscluster-sample
  namespace: doris
spec:
  feSpec:
    replicas: 1
    image: apache/doris:fe-4.1.5
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 4
      memory: 10Gi
    persistentVolumes:
    - name: fe-meta
      mountPath: /opt/apache-doris/fe/doris-meta
      persistentVolumeClaimSpec:
        # 不设置 storageClassName 时使用集群默认 StorageClass
        # storageClassName: <your-storageclass>
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
  beSpec:
    replicas: 1
    image: apache/doris:be-4.1.5
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 4
      memory: 8Gi
    persistentVolumes:
    - name: be-storage
      mountPath: /opt/apache-doris/be/storage
      persistentVolumeClaimSpec:
        # storageClassName: <your-storageclass>
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 20Gi
```

主要字段说明：

| 字段 | 样例取值 | 说明 |
| --- | --- | --- |
| `metadata.namespace` | `doris` | 与 Operator 位于同一命名空间。本页后续命令都带 `-n doris` |
| `feSpec.image`、`beSpec.image` | `apache/doris:fe-4.1.5`、`apache/doris:be-4.1.5` | FE 和 BE 必须使用同一版本。镜像同时提供 amd64 和 arm64 版本 |
| `replicas` | FE、BE 各 1 个 | 功能测试规格。只有 1 个 BE 时，建表必须设置 `"replication_num" = "1"` |
| `requests` / `limits` | FE：2 CPU / 4Gi，上限 4 CPU / 10Gi<br />BE：2 CPU / 4Gi，上限 4 CPU / 8Gi | `requests` 用于调度，`limits` 限制容器可用的资源。FE 镜像默认的 JVM 最大堆为 8GB（`-Xmx8192m`），因此 FE 的内存上限设为 10Gi，为非堆内存留出余量 |
| `persistentVolumes` | FE 元数据 10Gi，BE 数据 20Gi | Operator 为 FE 元数据目录和 BE 数据目录创建 PVC。未设置 `storageClassName` 时使用默认 StorageClass |

:::caution 数据生命周期
- FE 元数据和 BE 数据保存在 PVC 中。Pod 重启、删除或重新调度后，数据仍然保留。
- 删除 `DorisCluster` 资源时，Operator 会删除 FE 和 BE 的 StatefulSet，但会保留 PVC。只有手动删除 PVC 后，数据才会被删除；当 StorageClass 的回收策略为 `Delete` 时，底层数据卷也会一并删除。
- 如果删除样例中的 `persistentVolumes` 段，FE 和 BE 将使用临时存储，Pod 删除或重建后元数据和数据全部丢失，只适合短时间体验。持久化配置需要在首次部署前确定。
:::

需要调整镜像、副本数、资源、启动参数、访问方式或管理用户密码时，参考[配置 Doris 集群](install-config-cluster.md)修改这个文件。生产环境请按业务负载规划资源和副本数。

## 第 2 步：部署集群

```shell
kubectl -n doris apply -f doriscluster-sample.yaml
```

期望输出：

```text
doriscluster.doris.selectdb.com/doriscluster-sample created
```

Operator 先创建并启动 FE。FE 可用后，再创建 BE。

## 第 3 步：等待集群就绪

执行以下命令，等待 FE 和 BE 都进入 `available` 状态：

```shell
kubectl -n doris wait --for=jsonpath='{.status.feStatus.componentCondition.phase}'=available \
  dcr/doriscluster-sample --timeout=900s
kubectl -n doris wait --for=jsonpath='{.status.beStatus.componentCondition.phase}'=available \
  dcr/doriscluster-sample --timeout=900s
```

期望输出：

```text
doriscluster.doris.selectdb.com/doriscluster-sample condition met
doriscluster.doris.selectdb.com/doriscluster-sample condition met
```

首次部署需要从 Docker Hub 拉取 FE 和 BE 镜像，耗时取决于网络状况。镜像拉取完成后，FE 和 BE 通常在 2 分钟内就绪。

等待结束后，检查集群、Pod 和 PVC：

```shell
kubectl -n doris get dcr,pods,pvc
```

期望输出：

```text
NAME                                                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster.doris.selectdb.com/doriscluster-sample   available   available

NAME                                  READY   STATUS    RESTARTS   AGE
pod/doris-operator-5665bb679c-ttdh5   1/1     Running   0          36m
pod/doriscluster-sample-be-0          1/1     Running   0          10s
pod/doriscluster-sample-fe-0          1/1     Running   0          83s

NAME                                                        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/be-storage-doriscluster-sample-be-0   Bound    pvc-427f9e99-b89b-4ced-b247-805f0fa351c7   20Gi       RWO            standard       <unset>                 10s
persistentvolumeclaim/fe-meta-doriscluster-sample-fe-0      Bound    pvc-2548f70d-2407-4eb9-9986-fa5bc94f5952   10Gi       RWO            standard       <unset>                 83s
```

判断标准：`FESTATUS` 和 `BESTATUS` 都为 `available`，FE、BE Pod 都为 `1/1 Running`，两个 PVC 都为 `Bound`。部署过程中 `FESTATUS` 和 `BESTATUS` 会先显示为 `initializing`。

### 排查部署问题

如果等待超时，先查看 Pod 状态和事件：

```shell
kubectl -n doris get pods
kubectl -n doris describe pod <pod-name>
kubectl -n doris get events --sort-by=.lastTimestamp
```

| 现象 | 可能原因与处理方法 |
| --- | --- |
| Pod 为 `Pending` | 查看 `describe` 输出的 Events。`Insufficient cpu` 或 `Insufficient memory` 表示节点资源不足；`unbound immediate PersistentVolumeClaims` 表示 PVC 无法创建，请检查 StorageClass |
| PVC 为 `Pending` | StorageClass 为 `WaitForFirstConsumer` 时，PVC 在 Pod 调度前保持 `Pending`，属于正常现象。Pod 已调度后仍为 `Pending` 时，执行 `kubectl -n doris describe pvc <pvc-name>` 检查 StorageClass 和存储插件 |
| `ImagePullBackOff` 或 `ErrImagePull` | 节点无法拉取镜像。检查镜像名称、节点到 Docker Hub 或私有仓库的网络，以及 `imagePullSecrets` |
| FE 已就绪，但 BE Pod 一直没有出现 | 先执行 `kubectl -n doris get statefulset`：<br />- 没有 `doriscluster-sample-be`：Operator 尚未创建 BE。执行 `kubectl -n doris annotate dcr doriscluster-sample reconcile-at="$(date +%s)" --overwrite` 触发一次调谐。<br />- 已有 `doriscluster-sample-be`：执行 `kubectl -n doris describe statefulset doriscluster-sample-be`。Events 中出现 `FailedCreate` 和 `violates PodSecurity`，表示 Pod 被准入策略拒绝，参见 [Pod 安全策略](../doris-operator/preparation.mdx#pod-security) |
| BE 为 `Init:Error` 或 `Init:CrashLoopBackOff` | BE 的特权初始化容器 `default-init` 执行失败。执行 `kubectl -n doris logs doriscluster-sample-be-0 -c default-init` 查看原因；如果退出码为 32，通常是节点开启了 swap，处理方法见下方提示 |
| `CrashLoopBackOff` | 执行 `kubectl -n doris logs <pod-name> --previous` 查看上一次启动的日志。容器因内存超限被终止时，`describe` 输出中会显示 `OOMKilled`，请调大内存 `limits` |

:::tip 节点开启了 swap
`default-init` 会执行 `swapoff -a`。如果节点开启了 swap，而 swap 文件在容器中不可见（例如在 Docker Desktop 中运行 kind），`swapoff` 会失败，退出码为 32。即使跳过这一步，BE 启动脚本检测到 swap 后也会拒绝启动。可以选择以下一种方法处理：

- 关闭节点的 swap。kubelet 会自动重试初始化容器，也可以删除 BE Pod 立即重试。
- 由节点管理员将 `vm.max_map_count` 设置为不小于 `2000000`，然后在 `spec.beSpec` 中设置 `skipDefaultSystemInit: true`。Operator 不再添加 `default-init`，并让 BE 启动时跳过系统参数检查。该开关只在首次创建 BE 时生效：对已部署的集群修改该开关，`default-init` 不会被移除。此时需要先删除 `DorisCluster` 资源（PVC 会保留），在 YAML 中加入该开关后重新部署。
:::

## 第 4 步：连接集群并验证读写

FE 镜像自带 MySQL 客户端，可以直接进入 FE Pod 连接集群：

```shell
kubectl -n doris exec -it doriscluster-sample-fe-0 -- mysql -h 127.0.0.1 -P 9030 -uroot
```

首次部署时，`root` 用户没有密码。设置密码的方法见[配置管理用户名和密码](install-config-cluster.md#配置管理用户名和密码)。

### 1. 确认 FE 和 BE 状态

```sql
SHOW FRONTENDS\G
SHOW BACKENDS\G
```

期望输出（节选）：

```text
*************************** 1. row ***************************
              Name: fe_77e335e4_78ea_490d_81dd_7bc94ba0379d
              Host: doriscluster-sample-fe-0.doriscluster-sample-fe-internal.doris.svc.cluster.local
              ...
              Role: FOLLOWER
          IsMaster: true
              ...
             Alive: true
              ...
           Version: doris-4.1.5-release-917b20be838
1 row in set (0.01 sec)

*************************** 1. row ***************************
              BackendId: 1795859523402
                   Host: doriscluster-sample-be-0.doriscluster-sample-be-internal.doris.svc.cluster.local
                   ...
                  Alive: true
                   ...
                Version: doris-4.1.5-release-917b20be838
                   ...
1 row in set (0.00 sec)
```

`SHOW FRONTENDS` 返回 1 行，`IsMaster` 和 `Alive` 都为 `true`；`SHOW BACKENDS` 返回 1 行，`Alive` 为 `true`。

### 2. 写入并查询测试数据

```sql
CREATE DATABASE IF NOT EXISTS k8s_demo;
DROP TABLE IF EXISTS k8s_demo.hello;
CREATE TABLE k8s_demo.hello (
    id INT,
    msg VARCHAR(64)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO k8s_demo.hello VALUES (1, 'hello doris');
SELECT * FROM k8s_demo.hello;
```

`INSERT` 的期望输出：

```text
Query OK, 1 row affected (0.08 sec)
{'label':'label_bcd4ca04f4c64f68_83f746e7aabb2b6e', 'status':'VISIBLE', 'txnId':'2'}
```

`SELECT` 的期望输出：

```text
+------+-------------+
| id   | msg         |
+------+-------------+
|    1 | hello doris |
+------+-------------+
1 row in set (0.03 sec)
```

`k8s_demo.hello` 仅用于验证。这组语句会先删除并重建该表，因此可以重复执行，每次都应该只返回这一行。返回该行表示 FE、BE 和数据目录都已正常工作。执行 `exit` 退出 MySQL 客户端。

### 3.（可选）验证数据持久化

删除 FE 和 BE 的 Pod，等待 StatefulSet 重新创建 Pod 后再次查询：

```shell
kubectl -n doris delete pod doriscluster-sample-fe-0 doriscluster-sample-be-0
kubectl -n doris rollout status statefulset/doriscluster-sample-fe --timeout=600s
kubectl -n doris rollout status statefulset/doriscluster-sample-be --timeout=600s
kubectl -n doris exec -it doriscluster-sample-fe-0 -- mysql -h 127.0.0.1 -P 9030 -uroot -e "SELECT * FROM k8s_demo.hello"
```

查询仍返回 `1 | hello doris`，说明 FE 元数据和 BE 数据都保存在 PVC 中。Pod 就绪后，FE 需要几秒钟才能重新收到 BE 的心跳，此时查询可能返回 `has no queryable replicas`，等待约 10 秒后重试即可。

## 清理集群

删除集群并保留数据：

```shell
kubectl -n doris delete dcr doriscluster-sample
```

此时 PVC 仍然保留。使用相同的 `doriscluster-sample.yaml` 重新部署时，集群会复用这些 PVC 中的元数据和数据。

如果不再需要这些数据，再删除 PVC。PVC 删除后数据无法恢复：

```shell
kubectl -n doris delete pvc -l 'app.doris.ownerreference/name in (doriscluster-sample-fe,doriscluster-sample-be)'
```

## 下一步

- 从 Kubernetes 集群外部或其他命名空间访问 Doris：[访问 Doris 集群](access-cluster.md)。
- 调整副本数、资源、启动参数和认证方式：[配置 Doris 集群](install-config-cluster.md)。
- 扩缩容、升级和故障处理：[集群运维](cluster-operation.md)。
