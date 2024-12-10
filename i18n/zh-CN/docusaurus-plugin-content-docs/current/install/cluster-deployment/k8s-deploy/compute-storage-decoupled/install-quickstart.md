---
{
"title": "在 Kubernetes 上部署存算分离集群",
"language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

在 Kubernetes 上部署存算分离集群分为4步：
1. 部署前准备。  
2. 部署 Doris Operator。  
3. 部署存算分离集群。
4. 创建存储后端。

## 第1步：部署前准备
在 Kubernetes 上部署存算分离集群需要提前部署好 FoundationDB。如果使用虚机部署，需要确保虚机能够被 Kubernetes 集群上的服务访问。FoundationDB 在虚机上部署请参考存算分离部署文档中[部署前准备阶段的介绍](../../../../compute-storage-decoupled/before-deployment.md)。在 Kubernetes 上部署请参考 [FoundationDB 在 Kubernetes 上部署](install-fdb.md)。

## 第2步：部署 Operator
1. 下发资源定义：
  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

2. 部署 Doris-Operator 以及依赖的 RBAC 规则：

  ```shell
  kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
  ```
  预期结果：
  ```shell
  kubectl -n doris get pods
  NAME                              READY   STATUS    RESTARTS   AGE
  doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
  ```

## 第3步：部署存算分离集群
1. 下载存算分离集群的部署样例:
  ```shell
  curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
  ```

2. 配置 FoundationDB 访问信息：
  Doris 存算分离版本使用 FDB 存储元数据，在 `DorisDisaggregatedCluster` 的 `spec.metaService.fdb` 中提供两种方式配置 FDB 的可访问信息：直接配置访问地址，配置包含访问地址的 ConfigMap。
- 配置访问地址  
  若 FoundationDB 部署在 Kubernetes 外部，可直接配置 FoundationDB 的访问地址：
  ```yaml
  spec:
    metaService:
      fdb:
        address: ${fdbAddress}
  ```
  其中, ${fdbAddress} 为 FoundationDB 使用客户端的访问地址。Linux 虚机默认部署的情况下存储在 `/etc/foundationdb/fdb.cluster`，可参考 FoundationDB 对于 [cluster file](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) 的介绍了解详细信息。  
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

3. 根据存算分离 K8s 部署文档中，[元数据配置章节](config-ms.md)配置 metaService； [fe 集群配置章节](config-fe.md)进行 fe 终态规格配置；[计算资源组配置章节](config-cg.md)进行相关资源组的配置。配置完成后，使用如下命令部署资源：
  ```shell
  kubectl apply -f ddc-sample.yaml
  ```
  部署资源下发后，等待集群自动搭建完成，预期结果如下：
  ```shell
  kubectl get ddc
  NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
  test-disaggregated-cluster   green           Ready     2         2                  2
  ```

## 第4步：创建远程存储后端
存算分离集群搭建完毕后，需要通过客户端执行相应的 `CREATE STORAGE VAULT` SQL 语句创建存储后端来实现数据的持久化。
可以进入 FE 容器内部使用 MySQL Client 连接 Doris 进行创建操作。

1. 获取 Service。  
  在部署集群后，通过以下命令可以查看 Doris Operator 暴露的 service：
  
  ```shell
  kubectl get svc
  ```
  
  返回结果如下：
  
  ```shell
  NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
  test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
  test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
  test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
  test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
  test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
  ```

2. MySQL 客户端访问。  
  使用以下命令，可以在当前的 Kubernetes 集群中创建一个包含 mysql client 的 pod：
  ```shell
  kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
  ```
  在集群内的容器中，可以使用 fe 服务名访问 Doris 集群：
  ```shell
  mysql -uroot -P9030 -h test-disaggregated-cluster-fe  
  ```

3. 创建存储后端。  
  使用提供 S3 协议对象存储作为存储后端，创建示例如下：  
  a. 创建 S3 Storage Vault
  ```mysql
  CREATE STORAGE VAULT IF NOT EXISTS s3_vault
      PROPERTIES (
          "type"="S3",    
          "s3.endpoint" = "oss-cn-beijing.aliyuncs.com", 
          "s3.region" = "bj",       
          "s3.bucket" = "bucket",        
          "s3.root.path" = "big/data/prefix",   
          "s3.access_key" = "ak",         
          "s3.secret_key" = "sk",             
          "provider" = "OSS" 
      );
  ```
  
  b. 设置默认数据后端
  ```mysql
  SET s3_vault AS DEFAULT STORAGE VAULT;
  ```
  
:::tip 提示  
在本文展示的创建命令中，配置信息都是虚构信息不能用于真实场景，请参照[管理 Storage Vault 章节](../../../../compute-storage-decoupled/managing-storage-vault.md)创建可用存储后端。  
:::

