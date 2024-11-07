---
{
"title": "亲和性",
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

# 节点调度
Doris Operator 支持 K8s 的 nodeSelector ，affinity and anti-affinity 两种类型调度策略。部署时，Doris Operator 为 fe 节点添加同类节点非强制性反亲和性调度，尽量保证 fe 的节点不调度到同一台宿主机；为 be 节点添加
基于同类节点的非强制性反亲和性调度，和基于 fe 节点的非强制反亲和性调度。基于两个默认反亲和性调度，Doris Operator 尽量保证两个 fe 节点不会调度到同一台宿主机，两个 be 节点不会调度同一台机器，fe 和 be 不会调度到同一台机器。

## 选定节点部署
Doris Operator 提供 NodeSelector 配置实现将服务严格调度到一组特定的机器进行部署。使用 NodeSelector 请提前规划好需要部署的节点列表，通过 k8s [给节点打标能力](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/assign-pods-nodes/#add-a-label-to-a-node) 为需要使用的节点添加合适的标签。  

- FE 节点调度
    将一个集群的 FE 服务调度到具有 `test-label=test-value` 标签的节点中，在对选定的宿主机节点打标后，将如下配置添加到需要[部署的 DorisCluster 资源](https://doris.apache.org/zh-CN/docs/3.0/install/cluster-deployment/k8s-deploy/compute-storage-coupled/install-quickstart#%E7%AC%AC-3-%E6%AD%A5%E9%83%A8%E7%BD%B2-doris-%E9%9B%86%E7%BE%A4)中。
    ```yaml
    spec:
      feSpec:
        nodeSelector:
          test-label: test-value
    ```
    nodeSelector 支持添加多个标签，在使用时可按照 yaml 的格式依次添加多个标签。
- BE 节点调度  
    将一个集群的 BE 服务调度到具有 `test-be1=test-value1,test-be2=test-value2` 两个标签的节点中，在对选定的宿主机节点打标后，将如下配置添加到需要[部署的 DorisCluster 资源](https://doris.apache.org/zh-CN/docs/3.0/install/cluster-deployment/k8s-deploy/compute-storage-coupled/install-quickstart#%E7%AC%AC-3-%E6%AD%A5%E9%83%A8%E7%BD%B2-doris-%E9%9B%86%E7%BE%A4)中。
    ```yaml
    spec:
      beSpec:
        nodeSelector:
          test-be1: test-value1
          test-be2: test-value2
    ```
  
## 亲和性与反亲和性
Doris Operator 提供 K8s 原生[亲和性和反亲和性](https://kubernetes.io/zh-cn/docs/concepts/scheduling-eviction/assign-pod-node/)设置，可以设置关于 node 的亲和性和反亲和性调度，以及关于 pod 之间的亲和性和反亲和性调度。

亲和性调度分为[强制性亲和性调度和非强制性亲和性调度](https://kubernetes.io/zh-cn/docs/concepts/scheduling-eviction/assign-pod-node/#node-affinity)。可参考如下描述根据需要为 FE 和 BE 服务添加强制性和非强制性亲和调度。
### FE 亲和性调度
- 强制性节点亲和性调度  
    将 FE 服务调度到标签中包含 key 为 `topology.kubernetes.io/zone`， value 为 `east1,east2` 的宿主机节点上，在需要[部署的 DorisCluster 资源](https://doris.apache.org/zh-CN/docs/3.0/install/cluster-deployment/k8s-deploy/compute-storage-coupled/install-quickstart#%E7%AC%AC-3-%E6%AD%A5%E9%83%A8%E7%BD%B2-doris-%E9%9B%86%E7%BE%A4)添加如下配置：
    ```yaml
    spec:
      feSpec:
        affinity:
          nodeAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
              nodeSelectorTerms:
              - matchExpressions:
                - key: topology.kubernetes.io/zone
                  operator: In
                  values:
                  - east1
                  - east2
    ```
- 倾向性节点调度  
    将 FE 尽量调度到标签中包含 key 为 `topology.kubernetes.io/zone` value 为 `east1,east` 的宿主机节点上，在需要[部署的 DorisCluster 资源](https://doris.apache.org/zh-CN/docs/3.0/install/cluster-deployment/k8s-deploy/compute-storage-coupled/install-quickstart#%E7%AC%AC-3-%E6%AD%A5%E9%83%A8%E7%BD%B2-doris-%E9%9B%86%E7%BE%A4) 上添加如下配置：
    ```yaml
    spec:
      feSpec:
        affinity:
          nodeAffinity:
            preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 1
              preference:
                matchExpressions:
                - key: another-node-label-key
                  operator: In
                  values:
                  - east1
                  - east2
    ```
### BE 亲和性调度
- 强制性节点亲和性调度
  将 BE 服务调度到标签中包含 key 为 `topology.kubernetes.io/zone`， value 为 `east1,east2` 的宿主机节点上，在需要[部署的 DorisCluster 资源](https://doris.apache.org/zh-CN/docs/3.0/install/cluster-deployment/k8s-deploy/compute-storage-coupled/install-quickstart#%E7%AC%AC-3-%E6%AD%A5%E9%83%A8%E7%BD%B2-doris-%E9%9B%86%E7%BE%A4)添加如下配置：
    ```yaml
    spec:
      beSpec:
        affinity:
          nodeAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
              nodeSelectorTerms:
              - matchExpressions:
                - key: topology.kubernetes.io/zone
                  operator: In
                  values:
                  - east1
                  - east2
    ```
- 倾向性节点调度  
  将 BE 尽量调度到标签中包含 key 为 `topology.kubernetes.io/zone` value 为 `east1,east` 的宿主机节点上，在需要[部署的 DorisCluster 资源](https://doris.apache.org/zh-CN/docs/3.0/install/cluster-deployment/k8s-deploy/compute-storage-coupled/install-quickstart#%E7%AC%AC-3-%E6%AD%A5%E9%83%A8%E7%BD%B2-doris-%E9%9B%86%E7%BE%A4) 上添加如下配置：
    ```yaml
    spec:
      beSpec:
        affinity:
          nodeAffinity:
            preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 1
              preference:
                matchExpressions:
                - key: another-node-label-key
                  operator: In
                  values:
                  - east1
                  - east2
    ```
:::tip 提示  
关于 pod 的亲和性和反亲和性请参考 [K8s 的官方文档](https://kubernetes.io/zh-cn/docs/concepts/scheduling-eviction/assign-pod-node/)进行配置。  
:::