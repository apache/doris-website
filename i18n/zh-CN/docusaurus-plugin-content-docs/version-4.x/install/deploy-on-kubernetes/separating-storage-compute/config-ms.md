---
{
    "title": "配置 MetaService",
    "language": "zh-CN",
    "description": "详细介绍 MetaService 元数据管理组件的配置方法，包括 FoundationDB 访问配置、镜像配置、资源配置、启动参数配置和服务探测超时配置。",
    "keywords": ["Doris", "存算分离", "Kubernetes", "MetaService", "FoundationDB", "元数据", "配置"]
}
---

## 学完本章节你将能够

- 配置 MetaService 访问 FoundationDB 的连接信息
- 自定义 MetaService 镜像版本
- 为 MetaService 分配合适的计算资源
- 通过 ConfigMap 自定义 MetaService 启动参数
- 配置 MetaService 的存活探测超时和启动超时

## 概述

MetaService 是 Doris 存算分离集群的元数据管理组件，仅供集群内部使用，不对外暴露。它属于无状态服务，通常采用主备模式部署。本章介绍如何在 `DorisDisaggregatedCluster` 资源中配置 MetaService。

完整配置项概览如下：

| 配置场景 | 配置字段 | 是否必选 | 适用场景 |
|----------|----------|----------|----------|
| 连接 FoundationDB | `fdb.configMapNamespaceName` 或 `fdb.address` | 必选 | 所有场景 |
| 自定义镜像 | `image` | 可选 | 部署样例镜像版本不满足需求时 |
| 分配计算资源 | `requests` / `limits` | 可选 | 需要限制 CPU 和内存使用时 |
| 定制化启动参数 | `configMaps` | 可选 | 需要修改默认启动参数时 |
| 存活探测超时 | `liveTimeout` | 可选 | 默认 180 秒不满足需求时 |
| 启动超时 | `startTimeout` | 可选 | 默认 300 秒不满足需求时 |

## 1. 连接 FoundationDB

MetaService 依赖 FoundationDB 存储元数据，因此必须配置 FoundationDB 的访问信息。根据 FoundationDB 的部署方式不同，有两种配置方式：

| FoundationDB 部署方式 | 推荐配置方式 | 配置字段 |
|----------------------|--------------|----------|
| 通过 `fdb-kubernetes-operator` 在 Kubernetes 上部署 | 引用 Operator 自动生成的 ConfigMap | `fdb.configMapNamespaceName` |
| 直接在物理机上部署 | 直接填写访问地址 | `fdb.address` |

### 方式一：通过 ConfigMap 配置访问信息

如果 FoundationDB 集群通过 `fdb-kubernetes-operator` 部署，可直接使用该 Operator 自动生成的、包含 FoundationDB 访问地址的 ConfigMap：

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}
        namespace: ${namespace}
```

参数说明：

- `${foundationdbConfigMapName}`：ConfigMap 的名称
- `${namespace}`：FoundationDB 部署所在的命名空间

查找 `fdb-kubernetes-operator` 生成的 ConfigMap，请参考部署 FoundationDB 章节的 [获取包含 FoundationDB 访问信息的 ConfigMap](install-fdb.md#获取包含-foundationdb-访问信息的-configmap)。

### 方式二：直接配置访问地址

如果 FoundationDB 部署在物理机上，则可在 MetaService 配置中直接指定访问地址：

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}
```

参数说明：

- `${fdbEndpoint}`：可访问 FoundationDB 的地址信息

物理机部署情况下查找该地址，请参考存算分离章节 [MetaService 部署获取 `fdb_cluster` 介绍](../../deploy-manually/separating-storage-compute-deploy-manually)

## 2. 自定义镜像

部署样例中 MetaService 配置的镜像可能不是最新版本。如需指定镜像版本，按如下格式配置：

```yaml
spec:
  metaService:
    image: ${msImage}
```

参数说明：

- `${msImage}`：要部署的 MetaService 镜像。请使用 Doris 官方提供的 [MetaService 镜像](https://hub.docker.com/r/apache/doris)（镜像 tag 中包含 `ms` 前缀）。

## 3. 分配计算资源

通过 Kubernetes 资源限制为 MetaService 分配合适的 CPU 和内存。例如，限制为 4 核 CPU 和 4Gi 内存的配置如下：

```yaml
spec:
  metaService:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

将上述配置更新到需要[部署的 DorisDisaggregatedCluster 资源](./install-doris-cluster.md#2-修改关键配置)中。

## 4. 定制化启动配置

如果默认的启动参数不满足需求，可以通过 ConfigMap 挂载自定义的启动配置文件。Doris-Operator 通过 ConfigMap 挂载组件的启动配置文件来实现自定义。

整体流程如下：

| 阶段 | 说明 |
|------|------|
| 输入 | 自定义的 `doris_cloud.conf` 配置文件 |
| 操作 | 创建 ConfigMap，挂载到 `/etc/doris` 目录 |
| 输出 | MetaService 使用自定义配置启动 |

:::tip 提示
Doris-Operator 会自动填充 MetaService 启动配置中关于 FoundationDB 的相关配置，因此定制化启动配置时无需（也不要）填写 `fdb_cluster` 配置。
:::

### 第 1 步：创建自定义 ConfigMap

启动配置文件的名称必须为 `doris_cloud.conf`，示例如下：

```yaml
apiVersion: v1
data:
  doris_cloud.conf: |
    # // meta_service
    brpc_listen_port = 5000
    brpc_num_threads = -1
    brpc_idle_timeout_sec = 30
    http_token = ${httpToken}

    # // doris txn config
    label_keep_max_second = 259200
    expired_txn_scan_key_nums = 1000

    # // logging
    log_dir = ./log/
    # info warn error
    log_level = info
    log_size_mb = 1024
    log_filenum_quota = 10
    log_immediate_flush = false
    # log_verbose_modules = *

    # //max stage num
    max_num_stages = 40
kind: ConfigMap
metadata:
  name: doris-metaservice
  namespace: default
```

### 第 2 步：挂载自定义启动配置

在 `DorisDisaggregatedCluster` 资源中，通过 `metaService.configMaps` 挂载上述 ConfigMap：

```yaml
spec:
  metaService:
    configMaps:
    - name: ${msConfigMapName}
      mountPath: /etc/doris
```

参数说明：

- `${msConfigMapName}`：包含 MetaService 启动配置的 ConfigMap 名称
- `mountPath`：挂载点必须为 `/etc/doris`

将上述配置更新到需要部署的 [DorisDisaggregatedCluster 资源](./install-doris-cluster.md#2-修改关键配置)中。

### 配置和修改 HTTP token

`http_token` 用于 MetaService HTTP 管理接口鉴权，与 [Doris 管理账户凭据 `authSecret`](config-cluster.md) 相互独立。请将上方示例中的 `${httpToken}` 替换为自定义随机字符串，并通过 `spec.metaService.configMaps` 引用该 ConfigMap。修改已有配置时，保留 `doris_cloud.conf` 中的其他配置项。

FE、BE 正常访问 MetaService 的 RPC 不使用该 HTTP token。对于通过 FE SQL 注册节点的镜像（例如 Doris 4.1.5），无需在 FE、BE 中配置相同的 token，也无需因此重启 FE、BE。

部署后也可以修改 token，操作步骤如下：

1. 更新被引用的 ConfigMap 中 `doris_cloud.conf` 的 `http_token`，保留其他配置。
2. 逐个重启 MetaService Pod，等待当前 Pod 恢复 Ready 后再处理下一个。单副本部署在重启期间会暂时无法提供 MetaService 服务。
3. 使用需要 token 鉴权的只读 HTTP 管理接口，逐个验证各 MetaService 副本的新 token 已生效；仅检查 Pod Ready 不能确认 token 已切换。
4. 同步更新调用这些 HTTP 管理接口的运维工具。

`http_token` 是启动时加载的非动态配置，仅更新 ConfigMap 不会修改运行中 MetaService 进程的 token，也不要依赖该操作自动触发 Pod 重启。滚动切换期间，各副本可能暂时使用不同的 token，HTTP 管理调用可能认证失败，应避开依赖这些接口的节点管理操作。

## 5. 配置服务探测超时

Doris Operator 为存算分离集群服务提供两种超时参数配置：

| 探测类型 | 配置字段 | 默认值 | 作用阶段 | 触发条件 |
|----------|----------|--------|----------|----------|
| 存活探测（LivenessProbe） | `liveTimeout` | 180 秒 | 服务运行期间 | 探测失败超过阈值时，服务被强制重启 |
| 启动超时 | `startTimeout` | 300 秒 | 服务启动阶段 | 启动时间超过阈值时，服务被强制重启 |

### 存活探测超时配置

存活探测用于监控服务运行状态。例如，将存活探测超时配置为 30 秒：

```yaml
spec:
  metaService:
    liveTimeout: 30
```

### 启动超时配置

启动超时用于应对服务启动时间过长的情况。例如，将启动超时配置为 120 秒：

```yaml
spec:
  metaService:
    startTimeout: 120
```
