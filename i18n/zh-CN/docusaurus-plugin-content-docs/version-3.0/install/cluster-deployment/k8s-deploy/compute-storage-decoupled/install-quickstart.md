---
{
"title": "存算分离快速部署",
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

在 K8s 上从零开始部署一整套完整的 Doris 存算分离集群分为两部分： 第一部分部署 `Doris-Operator`；第二部分下发部署存算分离集群的相关资源 `DorisDisaggregatedMetaService`  和 `DorisDisaggregatedCluster` 。 `DorisDisaggregatedMetaService` 资源部署元数据组件； `DorisDisaggregatedCluster` 资源部署存算 sql 解析组件与计算组件。

## 安装 Operator

1. 下发资源定义：

```
kubectl create -f https://raw.githubusercontent.com/selectdb/doris-operator/master/config/crd/bases/crds.yaml
```

预期结果：

```
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org created
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org created
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org created
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com created
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedmetaservices.disaggregated.metaservice.doris.com created
```

2. 部署 Doris-Operator 以及依赖的 RBAC 规则：

```
kubectl apply -f https://raw.githubusercontent.com/selectdb/doris-operator/master/config/operator/disaggregated-operator.yaml
```

预期结果：

```
kubectl -n doris get pods
NAME                                         READY   STATUS    RESTARTS   AGE
doris-operator-fdb-manager-d75574c47-b2sqx   1/1     Running   0          11s
doris-operator-5b667b4954-d674k              1/1     Running   0          11s
```

## 快速部署存算分离集群

### 部署 DorisDisaggregatedMetaService 资源

1. 下载 `ddm-sample.yaml`, 一种用户告诉 Doris-Operator 如何部署元数据组件的资源。

```shell
curl -O https://raw.githubusercontent.com/selectdb/doris-operator/master/doc/examples/disaggregated/metaservice/ddm-sample.yaml
```

根据配置元数据部署资源章节：[FDB](./install-metaservice/config-fdb.md)，[ms](./install-metaservice/config-ms.md)， [recycler](./install-metaservice/config-recycler.md) 按照实际需要配置资源。

2. 下发 `DorisDisaggregatedMetaService` 资源:

```
kubectl apply -f ddm-sample.yaml
```

预期结果：

```
kubectl get ddm
NAME                   FDBSTATUS   MSSTATUS   RECYCLERSTATUS
meta-service-release   Available   Ready      Ready
```

### 下发对象存储信息

存算分离集群使用对象存储作为持久化存储，需要通过 ConfigMap 下发[存算分离集群使用的对象存储信息](./install-cluster/config-relation#注册对象存储)。

1. 下载包含对象存储信息的 ConfigMap 资源：

存算分离以对象存储作为后端存储，需要提前规划好使用的对象存储。下载 `object-store-info.yaml` 。

```
curl -O https://raw.githubusercontent.com/selectdb/doris-operator/master/doc/examples/disaggregated/cluster/object-store-info.yaml
```

2. 按照 [Doris 存算分离接口](../../../../compute-storage-decoupled/creating-cluster#%E5%86%85%E7%BD%AE%E5%AD%98%E5%82%A8%E5%90%8E%E7%AB%AF)接口格式将对象存储信息配置成 JSON 格式，以 `instance.conf` 为 key ， JSON 格式的对象存储信息作为 value 配置到 ConfigMap 的 data 中。  (替换样例 JSON 格式中对应的 value 值)

部署 `object-store-info.yaml` :

```shell
kubectl apply -f object-store-info.yaml
```

:::tip 提示
- 部署存算分离集群需要预先规划好使用的对象存储，将对象存储信息通过 ConfigMap 配置到 doris 存算分离集群需要部署的 Namespace 下。
- 案例中的配置主要为展示对象存储的基本配置所需信息，所有的值均为虚构不能用于真实场景，如果需要搭建真实可用集群请使用真实数据填写。
:::

### 部署 DorisDisaggregatedCluster 资源

1. 下载 `ddc-sample.yaml`:

```shell
curl -O https://raw.githubusercontent.com/selectdb/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

2. 根据配置存算分离集群章节: [集群关联配置](./install-cluster/config-relation.md)，[fe](./install-cluster/config-fe.md)，[compute cluster](./install-cluster/config-cc.md)，按照实际需要配置资源。使用如下命令部署资源：

```
kubectl apply -f ddc-sample.yaml
```

部署一个计算集群的预期结果如下：

```
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     1         1                  1
```

:::tip 提示
- `DorisDisaggregatedCluster` 必须在[规格中](./install-cluster/config-relation.md)配置使用 `DorisDisaggregatedMetaService` 资源信息。
- 部署存算分离集群必须提前规划好想要使用的对象存储，按照集群关联配置中[对象存储配置章节](./install-cluster/config-relation.md)配置部署。
:::
