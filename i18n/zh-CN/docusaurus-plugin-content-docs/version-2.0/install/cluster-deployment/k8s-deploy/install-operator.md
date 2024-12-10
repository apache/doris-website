---
{
"title": "部署 Doris Operator",
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

## 添加 Doris Cluster 资源定义

Doris Operator 使用自定义资源定义（Custom Resource Definition, CRD）扩展 Kubernetes。Doris Cluster 的 CRD 中封装了对 Doris 对象的描述，例如对 FE 或 BE 的描述，详细内容可以参考 [doris-operator-api](https://github.com/apache/doris-operator/blob/master/doc/api.md)。在部署 Doris 前，需要先创建 Doris Cluster 的 CRD。

通过以下命令可以在 Kubernetes 环境中部署 Doris Cluster CRD：

```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
```

如果没有外网，先将 CRD 文件下载到本地：

```shell
wget https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
kubectl create -f ./doris.selectdb.com_dorisclusters.yaml
```

以下是期望输出结果：

```shell
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com created
```

在创建了 Doris Cluster CRD 后，可以通过以下命令查看创建的 CRD。

```shell
kubectl get crd | grep doris
```

以下为期望输出结果：

```shell
dorisclusters.doris.selectdb.com                      2024-02-22T16:23:13Z
```

## 添加 Doris Operator

### 方案一：快速部署 Doris Operator

可以直接拉去仓库中的 Doris Operator 模板进行快速部署。

使用以下命令可以在 Kubernetes 集群中部署 Doris Operator：

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
```

以下为期望输出结果：

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

### 方案二：自定义部署 Doris Operator

在创建完 CRD 后，在 Kubernetes 集群上部署 Doris Operator 有两种方式：在线与离线部署。

在 operator.yaml 文件中规范了部署 operator 的服务的最低要求。为了适配复杂的生产环境，可以下载 operator.yaml 文件后，按照期望更新其中配置。

**在线安装 Doris Operator**

在修改 operator.yaml 文件后，可以使用以下命令部署 Doris Operator 服务：

```shell
kubectl apply -f ./operator.yaml
```

以下为期望输出结果：

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

**离线安装 Doris Operator**

1. 下载 operator 运行所需镜像文件

如果服务器没有连通外网，需要先下载对应的 operator 镜像文件。Doris Operator 用到以下的镜像：

```shell
selectdb/doris.k8s-operator:latest
```

在可以连通外网的服务器中运行以下的命令，可以将镜像下载下来：

```shell
## download doris operator image
docker pull selectdb/doris.k8s-operator:latest
## save the doris operator image as a tar package
docker save -o doris.k8s-operator-latest.tar selectdb/doris.k8s-operator:latest
```

将已打包的 tar 文件放置到所有的 Kubernetes node 节点中，运行以下命令上传镜像：

```shell
docker load -i doris.k8s-operator-latest.tar
```

2. 配置 Doris Operator

下载 operator.yaml 文件后，可以根据生产环境期望修改模板。

Doris Operator 在 Kubernetes 集群中是一个无状态的 Deployment，可以根据需求修改如 `limits`、`replica`、`label`、`namespace` 等项目。如需要指定某一版本的 doirs operator 镜像，可以在上传镜像后对 operator.yaml 文件做如下修改：

```shell
...
containers:
  - command:
      - /dorisoperator
    args:
      - --leader-elect
    image: selectdb/doris.k8s-operator:v1.0.0
    name: dorisoperator
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
          - "ALL"
  ...
```

3. 安装 Doris Operator

在修改 Doris Operator 模板后，可以使用 apply 命令部署 Operator：

```shell
kubectl apply -f ./operator.yaml
```

以下为期望输出结果：

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

### 方案三：Helm 部署 Doris Operator

Helm Chart 是一系列描述 Kubernetes 相关资源的 YAML 文件的封装。通过 Helm 部署应用时，你可以自定义应用的元数据，以便于分发应用。Chart 是 Helm 的软件包，采用 TAR 格式，用于部署 Kubernetes 原生应用程序。通过 Helm Chart 可以简化部署 Doris 集群的流程。

1. 添加部署仓库

**在线添加仓库**

通过 `repo add` 命令添加远程仓库

```shell
helm repo add doris-repo https://charts.selectdb.com
```

通过 `repo update` 命令更新最新版本的 chart

```shell
helm repo update doris-repo
```

2. 安装 Doris Operator

通过 `helm install` 命令可以使用默认配置在 doris 的 namespace 中安装 Doris Operator

```shell
helm install operator doris-repo/doris-operator
```

如果需要自定义装配 [values.yaml](https://artifacthub.io/packages/helm/doris/doris-operator?modal=values) ，可以参考如下命令:

```shell
helm install -f values.yaml operator doris-repo/doris-operator
```

通过 `kubectl get pods` 命令查看 Pod 的部署状态。当 Doris Operator 的 Pod 处于 Running 状态且 Pod 内所有容器都已经就绪，即部署成功。

```shell
kubectl get pod --namespace doris
```

返回结果如下：

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
```

**离线添加仓库**

如果服务器无法连接外网，需要预先下载 Doris Operator 与 Doris Cluster 的 chart 资源。

1. 下载离线 chart 资源

下载 `doris-operator-{chart_version}.tgz` 安装 Doris Operator chart。如需要下载 1.4.0 版本的 Doris Operator 可以使用以下命令：

```shell
wget https://charts.selectdb.com/doris-operator-1.4.0.tgz
```

2. 安装 Doris Operator

通过 `helm install` 命令可以安装 Doris Operator。

```shell
helm install operator doris-operator-1.4.0.tgz
```

如果需要自定义装配 [values.yaml](https://artifacthub.io/packages/helm/doris/doris-operator?modal=values) ，可以参考如下命令:

```shell
helm install -f values.yaml operator doris-operator-1.4.0.tgz
```

通过 `kubectl get pods` 命令查看 Pod 的部署状态。当 Doris Operator 的 Pod 处于 Running 状态且 Pod 内所有容器都已经就绪，即部署成功。

```shell
kubectl get pod --namespace doris
```

返回结果如下：

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
```

## 查看服务状态

当部署 Operator 服务后，可以通过以下命令查看服务状态。

```shell
kubectl get pod -n doris
```

返回结果如下：

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6f47594455-p5tp7   1/1     Running   0          11s
```

需要确保 STATUS 状态为 Running，且 pod 中所有容器的状态都为 Ready。
