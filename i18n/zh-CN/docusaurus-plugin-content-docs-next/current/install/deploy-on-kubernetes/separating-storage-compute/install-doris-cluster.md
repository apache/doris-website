---
{
    "title": "部署存算分离 Doris 集群",
    "language": "zh-CN",
    "description": "在 Kubernetes 上部署可用存算分离集群分为 4 步："
}
---

在 Kubernetes 上部署可用存算分离集群分为 4 步：
1. 部署前准备，主要包括安装 FoundationDB 集群。
2. 部署 Doris Operator。
3. 部署 Doris 存算分离集群。
4. 创建存储后端。

## 第 1 步：部署前准备
在 Kubernetes 上部署存算分离集群需要提前部署好 FoundationDB。
- （推荐）如果使用机器直接部署，需要确保该机器能够被 Kubernetes 集群上的服务访问。FoundationDB 在机器上直接部署请参考存算分离部署文档中[部署前准备阶段的介绍](../../../compute-storage-decoupled/before-deployment)。
- 在 Kubernetes 上部署请参考[在 Kubernetes 上部署 FoundationDB](install-fdb.md)。

## 第 2 步：部署 Doris Operator
### 1. 下发资源定义
```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```
如果已经部署过非存算分离集群请用如下命令下发资源定义：
```yaml
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
```

### 2. 部署 Operator 及 RBAC 规则
执行如下命令部署 Doris Operator 及其依赖的 RBAC 规则：
```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```
部署后可通过以下命令检查 Operator Pod 状态：
```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

## 第 3 步：部署存算分离集群
### 1. 下载部署样例
从 Doris Operator 仓库下载默认部署样例：
```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. 配置 FoundationDB 访问信息
Doris 存算分离版本使用 FDB 存储元数据，在 `DorisDisaggregatedCluster` 的 `spec.metaService.fdb` 中提供两种配置方式：
- 配置访问地址  
  若 FoundationDB 部署在 Kubernetes 外部，可直接配置 FoundationDB 的访问地址：
    ```yaml
    spec:
      metaService:
        fdb:
          address: ${fdbAddress}
    ```
  其中，${fdbAddress} 为 FoundationDB 使用客户端的访问地址。Linux 虚机默认部署的情况下存储在 `/etc/foundationdb/fdb.cluster`，可参考 FoundationDB 对于 [cluster file](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) 的介绍了解详细信息。

- 配置包含访问信息的 ConfigMap  
  使用 [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) 部署 FoundationDB，`fdb-kubernetes-operator` 会在部署的命名空间下生成一个特定的，包含 FoundationDB 访问信息的 ConfigMap。
  生成的 ConfigMap 名称为部署 FoundationDB 的资源名称加上 "-config"。如何获取 `ConfigMap`，请参考文档 FoundationDB 在 Kubernetes 上部署中的[访问信息获取](./install-fdb.md#获取包含-foundationdb-访问信息的-configmap)章节。获取 `ConfigMap` 的命名空间和名称后，请按照如下格式配置 `DorisDisaggregatedCluster` 资源：
    ```yaml
    spec:
      metaService:
        fdb:
          configMapNamespaceName:
            name: {foundationdbConfigMapName}
            namespace: {namespace}
    ```
  其中，${foundationdbConfigMapName} 为 `fdb-kubernetes-operator` 生成的 `ConfigMap` 名称。${namespace} 为 `ConfigMap` 所在的命名空间。

### 3. 配置 DorisDisaggregatedCluster 资源
根据存算分离 Kubernetes 部署文档中：
- [元数据配置章节](config-ms.md)配置 metaService；
- [FE 集群配置章节](config-fe.md)进行 FE 规格配置；
- [计算资源组配置章节](config-cg.md)进行相关资源组的配置。  
  配置完成后，使用如下命令部署：
```shell
kubectl apply -f ddc-sample.yaml
```
部署资源下发后，等待集群自动搭建完成，预期结果如下：
```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

## 第 4 步：创建远程存储后端
集群启动成功后，需要通过相应的 SQL 配置，将可用的对象存储作为持久化存储后端（Doris 称之为 Vault）。
### 1. 获取 FE Service 的访问地址
部署集群后，通过以下命令查找可访问 FE 服务的 Service：
```shell
kubectl get svc
```
示例输出：
```shell
NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
```
其中不带 "-internal" 后缀的 Service 为外部访问使用的 Service 。

### 2. 通过 MySQL 客户端连接
在 Kubernetes 集群中创建一个包含 MySQL Client 的 Pod，并进入 Pod内部：
```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```
在 Pod 内部使用 Service 名称直接连接 Doris 集群：
```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. 存储后端创建(Vault)
通过 SQL 命令创建支持 S3 协议的对象存储作为 Vault。示例如下：
 ```mysql
 CREATE STORAGE VAULT IF NOT EXISTS s3_vault
     PROPERTIES (
         "type"="S3",
         "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
         "s3.region" = "bj",
         "s3.bucket" = "bucket",
         "s3.root.path" = "big/data/prefix",
         "s3.access_key" = "your-ak",
         "s3.secret_key" = "your-sk",
         "provider" = "OSS"
     );
 ```
有关其他存储后端的创建以及各字段详细说明，请参考存算分离文档中的[管理 Storage Vault](../../../compute-storage-decoupled/managing-storage-vault.md)部分。
设置默认存储后端，命令如下：
```mysql
SET {vaultName} AS DEFAULT STORAGE VAULT;
```
其中，{vaultName} 为希望使用的 Vault 的名称，比如创建示例中的 `s3_vault`。