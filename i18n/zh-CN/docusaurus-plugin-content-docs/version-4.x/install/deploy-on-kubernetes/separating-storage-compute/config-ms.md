---
{
    "title": "配置部署 MetaService",
    "language": "zh-CN",
    "description": "MetaService 是 Doris 存算分离集群元数据管理组件，不对外暴漏，仅用于内部使用。MetaService 属于无状态服务，通常采用主备模式部署。下面介绍如何在 DorisDisaggregatedCluster 资源中配置 MetaService。"
}
---

MetaService 是 Doris 存算分离集群元数据管理组件，不对外暴漏，仅用于内部使用。MetaService 属于无状态服务，通常采用主备模式部署。下面介绍如何在 `DorisDisaggregatedCluster` 资源中配置 MetaService。

## 配置 FoundationDB 访问
根据 FoundationDB 部署环境不同，配置方式也有所差异：
- 使用 ConfigMap 配置 FoundationDB 访问  
  如果 FoundationDB 集群通过 `fdb-kubernetes-operator` 部署，可直接使用 该 Operator 生成的包含 FoundationDB 访问地址的 ConfigMap，示例如下：
    ```yaml
    spec:
      metaService:
        fdb:
          configMapNamespaceName:
            name: ${foundationdbConfigMapName}
            namespace: ${namespace}
    ```
  其中，`${foundationdbConfigMapName}` 为 ConfigMap 的名称。`${namespace}` 为 FoundationDB 部署的命名空间。查找 `fdb-kubernetes-operator` 生成的 ConfigMap，请参考部署 FoundationDB 章节的 [获取包含 FoundationDB 访问信息的 ConfigMap](install-fdb.md#获取包含-foundationdb-访问信息的-configmap)。

- 直接配置 FoundationDB 访问地址  
  如果 FoundationDB 是直接在物理机上部署，则可以直接在 MetaService 配置中指定访问地址：
    ```yaml
       spec:
         metaService:
           fdb:
             address: ${fdbEndpoint}
    ```
  `${fdbEndpoint}` 为可访问 FoundationDB 的访问地址信息，物理机部署情况下查找请参考存算分离章节 [MetaService 部署获取 `fdb_cluster` 介绍](../../../compute-storage-decoupled/compilation-and-deployment.md#31-配置)。

## 配置镜像
在部署样例中，MetaService 配置的镜像可能不是最新版本镜像。自定义镜像时，请按照如下格式配置：
```yaml
spec:
  metaService:
    image: ${msImage}
```
其中 `${msImage}` 为想要部署的 MetaService 的镜像。请使用 Doris 官方提供的 [MetaService 镜像](https://hub.docker.com/r/apache/doris)(镜像 tag 中包含 ms 前缀)。

## 配置资源
可以通过 Kubernetes 的资源限制为 MetaService 分配合适的计算资源，例如限制为 4 核 CPU 和 4Gi 内存，配置如下：
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
将配置更新到需要[部署的 DorisDisaggregatedCluster 资源](./install-doris-cluster.md#3-配置-dorisdisaggregatedcluster-资源)中。

## 定制化启动配置
Doris-Operator 通过 ConfigMap 挂载组件的启动配置文件。Doris-Operator 自动填充 MetaService 启动配置中有关 FoundationDB 的相关配置，因此定制化启动配置时无需填写这些信息。
1. 创建自定义 ConfigMap  
   自定义一个包含启动配置信息的 ConfigMap。启动配置文件的名称必须为 `doris_cloud.conf`，示例如下：
    ```yaml
    apiVersion: v1
    data:
      doris_cloud.conf: |
        # // meta_service
        brpc_listen_port = 5000
        brpc_num_threads = -1
        brpc_idle_timeout_sec = 30
        http_token = greedisgood9999
  
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
2. 挂载自定义启动配置  
   在 `DorisDisaggregatedCluster` 资源中，通过 `metaService.configMaps` 挂载上述 ConfigMap，示例如下：
    ```yaml
    spec:
      metaService:
        configMaps:
        - name: ${msConfigMapName}
          mountPath: /etc/doris
    ```
   `${msConfigMapName}` 为包含 MetaService 启动配置的 ConfigMap 名称。更新到需要部署的 [DorisDisaggregatedCluster 资源](./install-doris-cluster.md#3-配置-dorisdisaggregatedcluster-资源)。包含启动配置的 ConfigMap 的挂载点必须为 `/etc/doris` ，即 `mountPath` 为 `/etc/doris`。

:::tip 提示
在 Kubernetes 部署中，定制化 MetaService 启动配置时请不要填写 `fdb_cluster` 配置，Doris Operator 会自动处理相关信息。
:::

## 配置服务探测超时
Doris Operator 为存算分离集群服务提供两种超时参数配置：存活探测超时和启动超时。
### 存活探测超时配置
存活探测（LivenessProbe）用于监控服务运行状态，当探测失败超过设定阈值时，服务将被强制重启。默认超时时间为 180 秒，若需要配置为 30 秒，可按如下设置
```yaml
spec:
  metaService:
    liveTimeout: 30
```
### 启动超时配置
启动超时用于应对服务启动时间过长的情况，当服务启动时间超过设定阈值时，服务将被强制重启。默认启动超时时间为 300 秒，若需要配置为 120 秒，可按如下设置：
```yaml
spec:
  metaService:
    startTimeout: 120
```
