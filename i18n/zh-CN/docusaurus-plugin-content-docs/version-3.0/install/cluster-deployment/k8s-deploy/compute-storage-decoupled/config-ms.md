---
{
"title": "配置部署 MetaService",
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

MetaService 是 Doris 存算分离组件，提供元数据管理和查询服务。MetaService 服务属于无状态服务，通常采用主备模式部署。下面文档详细介绍了如何在 `DorisDisaggregatedCluster` 中配置 MetaService 。 

## 配置镜像
在部署样例中，MetaService 配置的镜像可能不是最新版本镜像。自定义镜像时，请按照如下格式配置：
```yaml
spec:
  metaService:
    image: ${msImage}
```

其中 `${msImage}` 为想要部署的 MetaService 的镜像。 在 DockerHub 中提供了 Doris 官方制作的 [MetaService 镜像](https://hub.docker.com/repository/docker/selectdb/doris.ms-ubuntu/general)。

## 配置资源
限制 MetaService 可使用的资源为 4c 4Gi 的配置如下：
```yaml
spec:
  metaService:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

将配置更新到需要[部署的 DorisDisaggregatedCluster 资源](install-quickstart.md#第3步部署存算分离集群)中。

## 配置 FoundationDB 访问
根据 FoundationDB 部署环境不同，需要调整一下配置项：
- 配置包含 FoundationDB 访问地址的 ConfigMap  
  FoundationDB 集群通过 `fdb-kubernetes-operator` 部署，可直接配置 `fdb-kubernetes-operator` 生成的包含 FoundationDB 可访问地址的 ConfigMap，配置如下：
  ```yaml
  spec:
    metaService:
      fdb:
        configMapNamespaceName:
          name: ${foundationdbConfigMapName}
          namespace: ${namespace}
  ```
  其中，${foundationdbConfigMapName} 为 ConfigMap 的名称，${namespace} 为 FoundationDB 部署的命名空间。查找 `fdb-kubernetes-operator` 生成的包含 FoundationDB 可访问信息的 ConfigMap 请参考部署 FoundationDB 章节的 [获取包含 FoundationDB 访问信息的 ConfigMap](install-fdb.md#获取包含-foundationdb-访问信息的-configmap)。  

- 若 FDB 是机器直接部署，则可直接在 metaService 中配置 FoundationDB 访问地址信息：
  ```yaml
  spec:
    metaService:
      fdb:
        address: ${fdbEndpoint}
  ```
  ${fdbEndpoint} 为可访问 FoundationDB 的访问地址信息，物理机部署情况下查找请参考 FoundationDB 关于 [cluster-file 的相关介绍](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file)。

## 自定义启动配置
K8s 上通过 ConfigMap 挂载配置文件。Doris 存算分离组件的启动配置可通过 ConfigMap 挂载文件的方式实现。在自定义启动配置时，Doris Operator 对于存算分离组件之间相互感知的配置进行了自动化处理，在自定义 MetaService 启动配置时, 无需填写 FoundationDB 有关的配置。
1. 自定义包含启动配置的 ConfigMap，样例如下：
  ```yaml
  apiVersion: v1
  data:
    doris_cloud.conf: |
      # // meta_service
      brpc_listen_port = 5000
      brpc_num_threads = -1
      brpc_idle_timeout_sec = 30
      http_token = greedisgood9999
  
      # // doris txn config
      label_keep_max_second = 259200
      expired_txn_scan_key_nums = 1000
  
      # // logging
      log_dir = ./log/
      # info warn error
      log_level = info
      log_size_mb = 1024
      log_filenum_quota = 10
      log_immediate_flush = false
      # log_verbose_modules = *
  
      # //max stage num
      max_num_stages = 40
  kind: ConfigMap
  metadata:
    name: doris-metaservice
    namespace: default
  ```

2. 更新部署的 DorisDisaggregatedCluster 资源：
  ```yaml
  spec:
    metaService:
      configMaps:
      - name: doris-metaservice
        mountPath: /etc/doris
  ```
  以上一步构建的 ConfigMap 为例，更新需要部署的 [DorisDisaggregatedCluster 资源](install-quickstart.md#第3步部署存算分离集群)。MetaService 服务使用的启动配置文件名称为 `doris_cloud.conf`，ConfigMap 中启动信息对应的 key 必须是 `doris_cloud.conf`。 包含启动配置的 ConfigMap 的挂载点必须为 `/etc/doris` ，即 `mountPath` 为 `/etc/doris`。
