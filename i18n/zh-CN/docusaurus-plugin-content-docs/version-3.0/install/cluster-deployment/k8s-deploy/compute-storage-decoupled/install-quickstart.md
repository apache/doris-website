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

在 K8s 上部署存算分离集群需要提前部署好 FDB。如果是虚机部署需确保部署的虚机能够被 K8s 集群上的服务访问，部署请参考存算分离部署文档中[部署前准备阶段介绍](../../../../compute-storage-decoupled/before-deployment)；如需要在 K8s 上部署请参考 [FDB 在 K8s 上部署](install-fdb.md)。
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
NAME                                         READY   STATUS    RESTARTS   AGE
doris-operator-fdb-manager-d75574c47-b2sqx   1/1     Running   0          11s
```

## 第二步：快速部署存算分离集群
1. 下载 `ddc-sample.yaml` 部署样例:
```bash
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

2. 根据存算分离 K8s 部署文档中，[元数据配置章节](config-ms.md)配置 metaService ； [fe 集群配置章节](config-fe.md)进行 fe 终态规格配置；[计算资源组配置章节](config-cg.md)进行相关资源组的配置。配置完成后，使用如下命令部署资源：
```bash
kubectl apply -f ddc-sample.yaml
```
部署资源下发后，等待集群自动搭建完成，成功结果预期如下：
```bash
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     1         1                  1
```
:::tip 提示
MS 服务需要使用 FDB 作为后端元数据存储，部署 MS 服务必须部署 FDB 服务，请按照[部署 FDB 文档](install-fdb.md)提前部署。
::: 
