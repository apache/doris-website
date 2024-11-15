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
本章节介绍如何在测试 Kubernetes 集群中部署 Doris Operator 与 Doris 集群。
部署操作如下：
1. 创建 Kubernetes 测试集群
2. 部署 Doris Operator
3. 部署 Doris 集群
4. 连接访问 Doris 集群

## 第 1 步：创建 Kubernetes 测试集群
此步骤简述在没有 k8s 集群的情况下如何快速搭建一套单节点 k8s 集群，如果已有 k8s 集群，此步骤请跳过。  
Kind 是目前比较通用的创建本地 Kubernetes 测试环境的方案。Kind 使用 Docker 容器作为节点，在本地创建和运行 Kubernetes 集群。
1. 部署前置条件
   部署前需要确保环境中具有以下组件：

| 组件      | 版本要求      |
|---------|-----------|
| Docker  | \>= 18.09 |
| kubectl | \>=1.19   |
| kind    | \>=0.8.0  |

2. 使用 kind 部署 Kubernetes 集群
   本例中使用 kind 0.10.0 版本安装 Kubernetes 集群，命令如下：
   ```
      kind create cluster --image kindest/node:v1.20.2 --name test-doris
   ```
   期望输出结果：
   ```
   Creating cluster "test-doris" ...
    ✓ Ensuring node image (kindest/node:v1.20.2)
    ✓ Preparing nodes
    ✓ Writing configuration
    ✓ Starting control-plane
    ✓ Installing CNI
    ✓ Installing StorageClass
   Set kubectl context to "kind-test-doris"
   You can now use your cluster with:
   ```
3. 检查 Kubernetes 集群状态
   使用以下命令检查 Kubernete 集群状态:
   ```
   kubectl cluster-info --context kind-test-doris
   ```
   以下是期望输出结果：
   ```
   Kubernetes control plane is running at https://127.0.0.1:40075
   KubeDNS is running at https://127.0.0.1:40075/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
   To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
   ```
## 第 2 步：部署 Doris Operator
部署 Doris Operator 分成安装定义和部署 operator 服务两部分：
1. 安装 Doris Operator CRD
   通过以下命令添加 Doris Operator 的自定义资源（CRD）：
   ```
   kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
   ```
   期望输出结果:
   ```
   customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com created
   ```
2. 安装 Doris Operator
   通过以下命令安装 Doris Operator ：
   ```
   kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
   ```
   期望输出结果：
   ```
   namespace/doris created
   role.rbac.authorization.k8s.io/leader-election-role created
   rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
   clusterrole.rbac.authorization.k8s.io/doris-operator created
   clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
   serviceaccount/doris-operator created
   deployment.apps/doris-operator created
   ```
3. 检查 Doris Operator 状态
   通过以下命令检查 Doris Operator 的部署状态：
   ```
   kubectl get pods -n doris
   ```
   期望输出结果:
   ```
   NAME                              READY   STATUS    RESTARTS   AGE
   doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
   ```
   Doris Operator 相关配置以及其他部署方式可参考[部署 operator 部分](./install-operator.md)。
## 第 3 步：部署 Doris 集群
1. 下载模板 Doris 部署模板：
   ```
   curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
   ```
2. 根据[集群配置章节](install-config-cluster.md)按需进行定制化配置，配置完成后通过如下命令部署：
   ```
   kubectl apply -f doriscluster-sample.yaml
   ```
3. 检查集群部署状态：
   通过查看 pods 的状态检查集群的状态：
   ```
   kubectl get pods
   ```
   期望结果：
   ```
   NAME                       READY   STATUS    RESTARTS   AGE
   doriscluster-sample-fe-0   1/1     Running   0          2m
   doriscluster-sample-be-0   1/1     Running   0          3m
   ```
   检查部署资源的状态：
   ```
   kubectl get dcr -n doris
   ```
   期望结果：
   ```
   NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
   doriscluster-sample   available   available
   ```
## 第 4 步：连接访问 Doris 集群
在测试环境中快速部署的 Doris 集群，可以进入容器 FE 内部使用 MySQL Client 链接 Doris 进行测试操作。其他访问方式可参考[集群配置访问章节](./install-config-cluster.md#访问配置)配置使用。
1. 获取 FE 容器名称:
   ```
   kubectl get pod -n doris | grep fe
   doriscluster-sample-fe-0          1/1     Running   0          16m
   ```
   在本例中，FE 容器名为 doriscluster-sample-fe-0。


2. 进入 FE 容器内部:
   ```
   kubectl -n doris exec -it doriscluster-sample-fe-0 /bin/bash
   ```

3. 在 FE 容器内部使用 MySQL Client 链接 Doris 集群：
   ```
   mysql -uroot -P9030 -h127.0.0.1
   ```