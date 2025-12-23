---
{
    "title": "部署 FoundationDB",
    "language": "zh-CN",
    "description": "FoundationDB 是基于Apache 2.0开源协议的分布式强一致性存储结构化数据的数据库，Doris 存算分离模式使用 FoundationDB 作为元数据存储。Kubernetes 上部署存算分离集群需要提前部署 FoundationDB 服务，推荐两种部署方式："
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview) 是基于Apache 2.0开源协议的分布式强一致性存储结构化数据的数据库，Doris 存算分离模式使用 FoundationDB 作为元数据存储。Kubernetes 上部署存算分离集群需要提前部署 FoundationDB 服务，推荐两种部署方式：
- 在机器（包括物理机）上直接部署。机器直接部署 FoundationDB 请参考 Doris 存算分离官方文档[部署前准备部分](../../../compute-storage-decoupled/before-deployment)搭建 FoundationDB 集群。部署前请确保 FoundationDB 部署的机器和 Doris 所在的 Kubernetes 在同一个局域网内。
- 在 Kubernetes 上部署 FoundationDB。FoundationDB 官方提供 Kubernetes 上部署运维管理服务 [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator)。

## 在 Kubernetes 上部署 FoundationDB
在 Kubernetes 上部署 FoundationDB 分为 4 步：
1. 部署 FoundationDB 相关资源定义。
2. 部署 fdb-kubernetes-operator 服务。
3. 部署 FoundationDB 集群。
4. 确认 FoundationDB 状态。

### 第 1 步：部署 FoundationDB 相关资源定义
通过以下命令下发 FoundationDB 资源定义：
```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```
预期结果：
```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org created
```

### 第 2 步：部署 fdb-kubernetes-operator 服务
fdb-kubernetes-operator 仓库提供了以 IP 模式部署 FoundationDB 集群的部署样例。在 doris-operator 仓库中提供了以 FQDN 模式部署的 FoundationDB 集群样例，可以按需下载。
1. 下载部署样例
    - 从 fdb-kubernetes-operator 官方仓库下载  
      fdb-kubernetes-operator 默认情况下使用 IP 模式部署 FoundationDB Cluster，可以下载 YAML 文件 [fdb-kubernetes-operator 默认部署](https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml)。如果使用 FQDN 部署模式，请按照官方文档[使用 DNS 部分](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#using-dns)进行定制化使用域名模式。
      ```shell
      wget -O fdb-operator.yaml https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml
      ```
    - 从 doris-operator 仓库下载  
      doris-operator 仓库中制定化了以 fdb-kuberentes-operator 1.46.0 版本为基础的部署示例，可直接使用部署 FoundationDB cluster。
      ```shell
      wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
      ```
2. 部署 fdb-kubernetes-operator 服务  
   定制化 `fdb-kubernetes-operator` 的部署 yaml 后，使用如下命令部署 fdb-kubernetes-operator：
    ```shell
    kubectl apply -f fdb-operator.yaml
    ```
   预期结果：
    ```shell
    serviceaccount/fdb-kubernetes-operator-controller-manager created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrole created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
    rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
    clusterrolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrolebinding created
    deployment.apps/fdb-kubernetes-operator-controller-manager created
    ```
### 第 3 步：部署 FoundationDB 集群
在 [fdb-kubernetes-operator 仓库](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/config/samples/cluster.yaml)中提供了部署 FoundationDB 的部署样例，通过如下命令直接下载使用。
1. 下载部署样例  
   从 FoundationDB 官方下载 IP 模式部署样例：
    ```shell
    wget https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/cluster.yaml
    ```
2. 定制化部署样例
    - 环境可访问 dockerhub  
      根据官网提供的[用户手册](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/index.md)定制化部署终态。如果使用 FQDN 部署，请将 `routing.useDNSInClusterFile` 字段设置为 true，配置如下：  
      doris-operator 的官方仓库中提供了使用 [FQDN 部署 FoundationDB 的部署样例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/fdb/)可直接下载使用。
      ```yaml
      spec:
        routing:
        useDNSInClusterFile: true
      ```
    - 私网环境  
      在私网环境下，如果不能直接访问 dockerhub 可从 FoundationDB 的官方仓库中将需要的镜像下载，并推到私有仓库中。fdb-kubernetes-operator 依赖 [foundationdb/fdb-kubernetes-operator](https://hub.docker.com/r/foundationdb/fdb-kubernetes-operator), [foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar) 。
      部署 FoundationDB 依赖的镜像是 [fdb-kubernetes-monitor](https://hub.docker.com/r/foundationdb/fdb-kubernetes-monitor/tags)。
      推到私有仓库后，按照 fdb-kubernetes-operator 官方文档[定制化镜像配置](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#customizing-the-foundationdb-image)说明进行配置。  
      可参考如下配置添加私有仓库镜像配置：
      ```yaml
      spec:
        mainContainer:
          imageConfigs:
          - baseImage: foundationdb/fdb-kubernetes-monitor
            tag: 7.1.38
        sidecarContainer:
          imageConfigs:
          - baseImage: foundationdb/fdb-kubernetes-monitor
            tag: 7.1.38
        version: 7.1.38
      ```
   在 doris operator 仓库中，总结了 4 种 FoundationDB 的部署形态，[单副本模式最简部署](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml)，[两副本模式最简部署](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster.yaml)，[两副本生产部署](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product.yaml)，[两副本生产使用私有仓库镜像部署](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product_private_env.yaml)。

:::tip 提示
- 部署 FoundationDB 时，FoundationDBCluster 资源，`.spec.version` 必须配置，且为 FoundationDB 发布的版本号。
- FoundationDB 基于 fdb-kubernetes-operator 部署，要求 Kubernetes 集群至少有三台宿主机才可满足生产环境高可用要求。  
  :::

### 第 4 步：确认 FoundationDB 状态
FoundationDB 基于 fdb-kubernetes-operator 部署，可以通过如下命令查看 FoundationDB 集群状态：
```shell
kubectl get fdb
```
预期结果如下，若 `AVAILABLE` 为 `true` 则代表集群可用：
```shell
NAME           GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
test-cluster   1            1            true        true              7.1.26    13m
```
## 获取包含 FoundationDB 访问信息的 ConfigMap
使用 [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) 部署 FoundationDB，会在部署的命名空间下生成一个特定的 ConfigMap 包含 FoundationDB 的访问信息。这个 ConfigMap 的名称为部署 FoundationDB 的资源名称加上 "-config"。使用如下命令查看 ConfigMap：
```shell
kubectl get configmap
```
预期结果：
```shell
test-cluster-config   5      15d
```

:::tip 提示  
在 Kubernetes 上部署，清理 FoundationDBCluster 资源会导致元数据丢失，请慎重处理 FoundationDBCluster 资源。  
:::
