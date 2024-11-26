---
{
"title": "快速部署",
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

在 K8s 上部署存算分离集群需要提前部署好 FDB。如果是虚机部署需确保部署的虚机能够被 K8s 集群上的服务访问，部署请参考存算分离部署文档中[部署前准备阶段介绍](../../../../compute-storage-decoupled/before-deployment.md)；如需要在 K8s 上部署请参考 [FDB 在 K8s 上部署](install-fdb.md)。
部署 Doris 存算分离集群分为两部分：Doris-Operator 及其相关依赖权限部署；Doris 存算分离集群定制化资源部署。
## 第一步：部署 Operator

1. 下发资源定义：

```bash
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```

预期结果：
```bash
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com created
customresourcedefinition.apiextensions.k8s.io/doris.selectdb.com_dorisclusters.yaml created
```

2. 部署 Doris-Operator 以及依赖的 RBAC 规则：

```bash
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```
预期结果：

```bash
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

## 第二步：快速部署存算分离集群
1. 下载 `ddc-sample.yaml` 部署样例：
```bash
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

2. 根据存算分离 K8s 部署文档中，[元数据配置章节](config-ms.md)配置 metaService； [fe 集群配置章节](config-fe.md)进行 fe 终态规格配置；[计算资源组配置章节](config-cg.md)进行相关资源组的配置。配置完成后，使用如下命令部署资源：
```bash
kubectl apply -f ddc-sample.yaml
```
部署资源下发后，等待集群自动搭建完成，成功结果预期如下：
```bash
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```
:::tip 提示
MS 服务需要使用 FDB 作为后端元数据存储，部署 MS 服务必须部署 FDB 服务，请按照[部署 FDB 文档](install-fdb.md)提前部署。
:::

## 第三步：创建远程存储后端
存算分离集群搭建完毕后，需要通过客户端执行相应的 `CREATE STORAGE VAULT` SQL 语句创建存储后端来实现数据的持久化。
集群访问方式可参考 [访问 Doris 集群](../compute-storage-coupled/install-config-cluster.md#访问配置) 来连接 Doris 集群，下文提供其中一种实现方式。

**1. 获取 Service**

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

**2. MySQL 客户端访问**

使用以下命令，可以在当前的 Kubernetes 集群中创建一个包含 mysql client 的 pod：

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

在集群内的容器中，可以使用 fe 服务名访问 Doris 集群：

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe  
```

**3. 创建存储后端**

创建语句语法，具体参考[管理 Storage Vault](../../../../compute-storage-decoupled/managing-storage-vault.md)。
这里提供 S3 协议对象存储的示例：

1. 创建 S3 Storage Vault
```SQL
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
    PROPERTIES (
        "type"="S3",                                   -- required
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com", -- required
        "s3.region" = "bj",                            -- required
        "s3.bucket" = "bucket",                        -- required
        "s3.root.path" = "big/data/prefix",            -- required
        "s3.access_key" = "ak",                        -- required
        "s3.secret_key" = "sk",                        -- required
        "provider" = "OSS"                             -- required
    );
```

2. 设置默认数据后端
```SQL
SET s3_vault AS DEFAULT STORAGE VAULT;
```




