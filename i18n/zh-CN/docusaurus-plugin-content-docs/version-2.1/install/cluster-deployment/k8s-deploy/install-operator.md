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

Doris Operator 可直接通过下发资源的方式部署，也可以使用 helm 的方式部署。
部署 Doris Operator 分三步：
1. 下发资源定义。  
2. 部署 Doris Operator 及其 RBAC 规则。
3. 检查部署状态。

## 直接使用资源部署

### 环境可访问 github
环境可访问 [Doris Operator 仓库](https://github.com/apache/doris-operator) 的情况下，可直接使用 Doris Operator 仓库定义的资源部署。

#### 下发 Doris Operator 资源定义
Doris Operator 使用自定义资源定义（Custom Resource Definition, CRD）扩展 Kubernetes。Doris Cluster 的 CRD 中封装了对 Doris 对象的描述，例如对 FE 或 BE 的描述，详细内容可以参考 [doris-operator-api](https://github.com/apache/doris-operator/blob/master/doc/api.md)。在部署 Doris 前，需要先创建 Doris Cluster 的 CRD。

1. 执行以下命令部署 Doris Cluster CRD：

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
  ```
  预期输出：
  
  ```shell
  customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com created
  ```

2. 验证 CRD 是否创建成功：

  ```shell
  kubectl get crd | grep doris
  ```
  
  预期输出：
  
  ```shell
  dorisclusters.doris.selectdb.com                      2024-02-22T16:23:13Z
  ```

#### 部署 Doris Operator
Doris Operator 仓库中提供了部署 Doris Operator 模板，在可访问 [Doris Operator 仓库](https://github.com/apache/doris-operator)的环境下直接使用仓库模板部署。

通过以下命令使用使用官方模板安装 Doris Operator：

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
```

预期输出：

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

#### 检查 Doris Operator 部署状态

通过 `kubectl get pods` 命令查看 Doris Operator 的 Pod 部署状态。当 Doris Operator 的 Pod 处于 Running 状态且 Pod 内所有容器都已经就绪，即部署成功。在默认配置下，Doris Operator 部署为单实例，并默认安装在 `doris` 命名空间。

```shell
kubectl get pod --namespace doris
```

预期结果：

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
```

### 在网络隔离环境中部署
如果部署环境无法直接访问 GitHub 或 Docker Hub，需要在联网环境中准备必要文件和镜像，并传输到目标环境。

#### 下发 Doris Operator 资源定义
1. 在与 github 不存在网络隔离的机器上，使用如下命令下载资源定义：
  ```shell
  wget https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
  ```
  将下载的资源定义文件传递到目标环境。  
2. 在目标环境中，使用如下命令下发资源定义：
  ```shell
  kubectl create -f ./doris.selectdb.com_dorisclusters.yaml
  ```
  预期结果：
  
  ```shell
  customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com created
  ```

3. 查看资源定义是否下发成功:  
  在创建了 Doris Cluster CRD 后，可以通过以下命令查看创建的 CRD。
  ```shell
  kubectl get crd | grep doris
  ```
  以下为期望输出结果：
  ```shell
  dorisclusters.doris.selectdb.com                      2024-02-22T16:23:13Z
  ```

#### 部署 Doris Operator 及其权限规则
如果部署环境不能拉取 [Doris Operator 镜像](https://hub.docker.com/repository/docker/selectdb/doris.k8s-operator/general)，请预先拉取 image 并传到私有仓库，详细使用请参考文档 [Moving docker images from one container registry to another](https://medium.com/@pjbgf/moving-docker-images-from-one-container-registry-to-another-2f1f1631dc49) 。

1. 获取部署模板：  
  ```shell
  wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
  ```
2. 修改模板中的镜像地址为私有仓库地址：
  将部署样例中的 image 替换成预先上传的私有仓库的 Doris Operator image 地址:
  ```yaml
  spec:
    containers:
    - command:
      - /dorisoperator
      args:
      - --leader-elect
      image: selectdb/doris.k8s-operator:latest
      name: dorisoperator
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
          - "ALL"
  ```
  部署样例中，默认的 image 为上述展示的 `selectdb/doris.k8s-operator:latest` 。使用时请将其替换成私有仓库存放的地址。  
3. 使用如下命令部署：  
  ```shell
  kubectl apply -f ./operator.yaml
  ```
  预期结果：
  ```shell
  namespace/doris created
  role.rbac.authorization.k8s.io/leader-election-role created
  rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
  clusterrole.rbac.authorization.k8s.io/doris-operator created
  clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
  serviceaccount/doris-operator created
  deployment.apps/doris-operator created
  ```
4. 检查 Doris Operator 部署状态  
  通过 `kubectl get pods` 命令查看 Doris Operator 的 Pod 部署状态。当 Doris Operator 的 Pod 处于 Running 状态且 Pod 内所有容器都已经就绪，即部署成功。在默认配置下，Doris Operator 部署为单实例，并默认安装在 `doris` 命名空间。
  
  ```shell
  kubectl get pod --namespace doris
  ```
  返回结果如下：
  
  ```shell
  NAME                              READY   STATUS    RESTARTS   AGE
  doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
  ```

## Helm 部署
Helm Chart 是一系列描述 Kubernetes 相关资源的 YAML 文件的封装。Helm Chart 的核心价值在于通过模板化配置简化应用程序部署的复杂性，并支持版本控制和易于更新。

### 添加 Helm Chart 仓库
1. 添加 Doris Helm Chart 仓库：

  ```shell
  helm repo add doris-repo https://charts.selectdb.com
  ```
2. 更新 Chart 仓库：
  ```shell
  helm repo update doris-repo
  ```

### 安装 Doris Operator

1. 通过 `helm install` 命令使用默认配置安装 Doris Operator：
  ```shell
  helm install operator doris-repo/doris-operator
  ```
  如果需要自定义装配 [values.yaml](https://artifacthub.io/packages/helm/doris/doris-operator?modal=values) ，可以参考如下命令：
  ```shell
  helm install -f values.yaml operator doris-repo/doris-operator
  ```

2. 通过 `kubectl get pods` 命令查看 Pod 的部署状态:    
  当 Doris Operator 的 Pod 处于 Running 状态且 Pod 内所有容器都已经就绪，即部署成功。
  ```shell
  kubectl get pod --namespace doris
  ```

  预期结果：

  ```shell
  NAME                              READY   STATUS    RESTARTS   AGE
  doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
  ```
