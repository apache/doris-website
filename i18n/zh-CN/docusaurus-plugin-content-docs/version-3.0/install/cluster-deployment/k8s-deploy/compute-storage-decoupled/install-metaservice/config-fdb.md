---
{
"title": "配置 FDB 部署",
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


Doris 存算分离使用 foundationdb 作为元数据存储组件。K8s 部署模式下，使用[fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) 的 `v1beta2` 版本部署 `fdb` 。

Doris-Operator 屏蔽了手动配置 `FoundationDBCluster` 的繁琐，通过抽象透出极少数配置信息，降低学习使用 `FoundationDBCluster` 资源的成本。通过抽象，Doris-Operator 希望用户只关注 fdb 部署相关的事项，而无需关注 fdb 内部运作机制以及 Doris 和 fdb 结合产生的复杂联系。

## 最简配置

默认情况下，只需要配置 fdb 使用的资源，Doris-Operator 自动生成 `FoundationDBCluster` 来部署 fdb 元数据管理集群。

默认配置：

```yaml
spec:
  fdb:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

通过以上配置，Doris-Operator 会自动部署 5 个 pod 组成的 fdb 集群。

## 指定 image 部署

Doris-Operator 默认情况下使用 Doris  推荐的 7.1.38 版本部署 fdb 。私有化环境下以及对 fdb 版本有特殊需求，请按照如下格式配置 image 或者配置私有仓库的镜像拉取秘钥。

### 私有仓库公共 image 配置

私有仓库下或者外网访问不通的情形，需要配置私有镜像仓库地址。

```yaml
spec:
  fdb:
    image: {fdb_image}
    sidecarImage: {fdb_sidecarImage}
```

分别设置 `{fdb_image}` 为对应的 foundationdb 的主镜像（在 selectdb 仓库中为 `selectdb/foundationdb:xxx`）, `{fdb_sidecarImage}` 为 fdb 的 sidecar 容器镜像（在 selectdb 仓库中为 `selectdb/foundationdb-kubernetes-sidecar:xxx`）。

将指定的镜像相关配置，配置到需要[部署的](../install-quickstart#部署 DorisDisaggregatedMetaService 资源)`DorisDisaggregatedMetaService` 资源中。

**配置 image 的 secret**

使用私有仓库时，如果配置访问密钥，请按照 [Kubernetes 私有仓库 imagePullSecret](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) 创建步骤创建相应的 secret 部署到 `DorisDisaggregatedMetaService` 的命名空间。

```yaml
spec:
  fdb:
    image: {fdb_image}
    sidecarImage: {fdb_sidecarImage}
    imagePullSecrets:
    - {secret_name}
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

`{fdb_image}` 和 `{fdb_sidecarImage}` 配置请参考 私有仓库公共 image 配置相关介绍。`{secret_name}` 是按照 Kubernetes 私有仓库 `imagePullSecret` 创建的 secret 名称。

将上述配置添加到需要部署的 [`DorisDisaggregatedMetaSerivce`](../install-quickstart#部署 DorisDisaggregatedMetaService 资源) 资源中。

## 配置存储

foundationdb 是有状态的分布式存储服务需要配置持久化存储，在默认情况下 Doris-Operator 会使用 Kubernetes 中默认 StorageClass 来为 fdb 的 pod 构建相关的 pvc ，pvc 的默认大小为  128Gi 。如果需要指定 StorageClass 以及修改默认的配置大小请按照如下配置修改：

```yaml
spec:
  fdb:
    volumeClaimTemplate:
      spec:
        #storageClassName: {storageClassName}
        resources:
          requests:
            storage: "200Gi"
```

上述配置使用默认 StorageClass 来创建 200Gi 存储来供 fdb 服务使用，如果需要指定 StorageClass 请将注释取消后，将变量 `{storageClassName}` 替换为想要指定的 StorageClass 名称。

将上述配置添加到需要部署的 [`DorisDisaggregatedMetaSerivce`](../install-quickstart#部署 DorisDisaggregatedMetaService 资源) 资源中。
