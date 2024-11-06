---
{
"title": "部署 Doris 集群",
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

在规划集群拓扑后，可以在 Kubernetes 中部署 Doris 集群。

## 部署集群

### 使用 Custom Resource 文件部署

**在线部署**

在线署集群需要经过以下步骤：

1. 创建 namespace：

```shell
kubectl create namespace ${namespace}
```

2. 部署 Doris 集群

```shell
kubectl apply -f ./${cluster_sample}.yaml -n ${namespace}
```

**离线部署**

离线部署 Doris 集群需要在有外网的机器上将 Doris 集群用到的 docker 镜像，上传到所有的 node 节点上。然后使用 docker load 将镜像安装到服务器上。离线部署需要经历以下步骤：

1. 下载所需的镜像

部署 Doris 集群需要以下镜像：

```text
selectdb/doris.fe-ubuntu:2.0.2
selectdb/doris.be-ubuntu:2.0.2
```

将镜像下载到本地后打包成 tar 文件

```shell
## download docker image
docker pull selectdb/doris.fe-ubuntu:2.0.2
docker pull selectdb/doris.be-ubuntu:2.0.2

## save docker image as a tar package
docker save -o doris.fe-ubuntu-v2.0.2.tar selectdb/doris.fe-ubuntu:2.0.2
docker save -o doris.be-ubuntu-v2.0.2.tar docker pull selectdb/doris.be-ubuntu:2.0.2
```

将 image tar 包上传到服务器上，执行 docker load 命令：

```shell
## load docker image
docker load -i doris.fe-ubuntu-v2.0.2.tar
docker load -i doris.be-ubuntu-v2.0.2.tar
```

2. 创建 namespace：

```shell
kubectl create namespace ${namespace}
```

3. 部署 Doris 集群

```shell
kubectl apply -f ./${cluster_sample}.yaml -n ${namespace}
```

### 使用 Helm 部署

**在线部署**

在安装开始前，需要添加部署仓库，若已经添加则可直接进行 Doris Cluster 的安装，否则请参考添加[部署 Doris Operator](./install-operator.md#方案三helm-部署-doris-operator) 时 **添加部署仓库** 的操作

1. 安装 Doris Cluster

安装 [doriscluster](https://artifacthub.io/packages/helm/doris/doris)，使用默认配置此部署仅部署 3 个 FE 和 3 个 BE 组件，使用默认 `storageClass` 实现 PV 动态供给。

```shell
helm install doriscluster doris-repo/doris
```

如果需要自定义资源和集群形态，请根据 [values.yaml](https://artifacthub.io/packages/helm/doris/doris?modal=values) 的各个资源配置的注解自定义资源配置，并执行如下命令:

```shell
helm install -f values.yaml doriscluster doris-repo/doris
```

2. 验证 doris 集群安装结果

通过 `kubectl get pods` 命令可以查看 pod 部署状态。当 `doriscluster` 的 Pod 处于 `Running` 状态且 Pod 内所有容器都已经就绪，即部署成功。

```shell
kubectl get pod --namespace doris
```

返回结果如下：

```shell
NAME                     READY   STATUS    RESTARTS   AGE
doriscluster-helm-fe-0   1/1     Running   0          1m39s
doriscluster-helm-fe-1   1/1     Running   0          1m39s
doriscluster-helm-fe-2   1/1     Running   0          1m39s
doriscluster-helm-be-0   1/1     Running   0          16s
doriscluster-helm-be-1   1/1     Running   0          16s
doriscluster-helm-be-2   1/1     Running   0          16s
```

**离线部署**

1. 下载 Doris Cluster Chart 资源

下载 `doris-{chart_version}.tgz` 安装 Doris Cluster chart。如需要下载 1.6.1 版本的 Doris 集群可以使用以下命令：

```shell
wget https://charts.selectdb.com/doris-1.6.1.tgz
```

2. 安装 Doris 集群

通过 `helm install` 命令可以安装 Doris 集群。

```shell
helm install doriscluster doris-1.4.0.tgz
```

如果需要自定义装配 [values.yaml](https://artifacthub.io/packages/helm/doris/doris?modal=values) ，可以参考如下命令:

```shell
helm install -f values.yaml doriscluster doris-1.4.0.tgz
```

3. 验证 doris 集群安装结果

通过 `kubectl get pods` 命令可以查看 pod 部署状态。当 `doriscluster` 的 Pod 处于 `Running` 状态且 Pod 内所有容器都已经就绪，即部署成功。

```shell
kubectl get pod --namespace doris
```

返回结果如下：

```shell
NAME                     READY   STATUS    RESTARTS   AGE
doriscluster-helm-fe-0   1/1     Running   0          1m39s
doriscluster-helm-fe-1   1/1     Running   0          1m39s
doriscluster-helm-fe-2   1/1     Running   0          1m39s
doriscluster-helm-be-0   1/1     Running   0          16s
doriscluster-helm-be-1   1/1     Running   0          16s
doriscluster-helm-be-2   1/1     Running   0          16s
```

## 查看集群状态

### 检查集群状态

集群部署资源下发后，可以通过以下命令检查集群状态。

```shell
kubectl get pods -n ${namespace}
```

返回结果如下：

```shell
NAME                       READY   STATUS    RESTARTS   AGE
doriscluster-sample-fe-0   1/1     Running   0          20m
doriscluster-sample-be-0   1/1     Running   0          19m
```

当所有 pod 的 `STATUS` 都是 `Running` 状态， 且所有组件的 pod 中所有容器都 `READY` 表示整个集群部署正常。

### 检查部署资源状态

Doris Operator 会收集集群服务的状态显示到下发的资源中。Doris Operator 定义了 `DorisCluster` 类型资源名称的简写 `dcr`，在使用资源类型查看集群状态时可用简写替代。

```shell
kubectl get dcr
```

返回结果如下：

```shell
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```

当配置的相关服务的 `STATUS` 都为 `available` 时，集群部署成功。
