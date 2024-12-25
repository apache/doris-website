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

在 Kubernetes 上部署 Doris 集群请提前[部署 Doris Operator](install-doris-operator.md)。  
部署 Doris 集群分为下载 Doris 部署模板，自定义部署模板，检查集群状态三个步骤。
## 第 1 步：下载 Doris 部署模板
```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```
## 第 2 步：安装自定义部署模板
根据[集群配置章节](./install-config-cluster.md)按需进行定制化配置，配置完成后通过如下命令部署：
```shell
kubectl apply -f doriscluster-sample.yaml
```
## 第 3 步：检查集群部署状态
- 通过查看 pods 的状态检查集群的状态：
  ```shell
  kubectl get pods
  ```
  期望结果：
  
  ```shell
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-0   1/1     Running   0          2m
  doriscluster-sample-be-0   1/1     Running   0          3m
  ```
- 通过检查部署资源的状态检查集群状态：
  ```shell
  kubectl get dcr -n doris
  ```
  期望结果：
  ```shell
  NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
  doriscluster-sample   available   available
  ```
