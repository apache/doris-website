---
{
"title": "配置 MS 部署",
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

MS 是 Doris 存算分离组件 Meta Service 的简称，提供元数据管理和查询服务。`DorisDisaggregatedMetaService` 中配置字段为 MS。

## 最简配置

MS 服务属于无状态服务，通常采用主备模式部署。最简单配置如下：

```yaml
spec:
  ms:
    image: {msImage}
    replicas: 2
```

其中 `{msImage}` 为想要部署的 MS 服务的版本。

## 配置资源

为 MS 服务添加资源使用限制。以 4c 4Gi 配置为例：

```yaml
spec:
  ms:
    image: {msImage}
    replicas: 2
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

将修改后的配置更新到需要[部署的存算分离元数据管理资源](../install-quickstart.md#部署 DorisDisaggregatedMetaService 资源)中。

## 定制化配置文件

K8s 上通过 ConfigMap 挂载配置文件。Doris-Operator 对于存算分离组件之间相互感知的配置进行了自动化处理，在部署 MS 服务使用定制化配置文件时，[FDB 的相关的配置](https://doris.apache.org/zh-CN/docs/compute-storage-decoupled/compilation-and-deployment/#meta-service-%E9%85%8D%E7%BD%AE)请不要配置。

使用 ConfigMap 挂载配置文件部署 MS 服务：

**ConfigMap**:

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

使用上述 ConfigMap 的 MS 配置如下：

```yaml
spec:
  ms:
    image: {msImage}
    configMaps:
    - name: doris-metaservice
      mountPath: /etc/doris
```

实际部署中，按照需要配置 ConfigMap 的名称以及命名空间，并将配置信息按照上述样例格式配置到需要部署的[存算分离元数据管理资源](../install-quickstart#部署 DorisDisaggregatedMetaService 资源)中。MS 服务使用的启动配置文件名称 `doris_cloud.conf` ， 因此挂载启动配置的 ConfigMap 的 key 也必须是 `doris_cloud.conf` 。启动配置必须挂载到 `/etc/doris` 目录下，即 mountPath 为 `/etc/doris` 。

:::tip 提示
MS 服务需要使用 FDB 作为后端元数据存储，部署 MS 服务必须部署 FDB 服务。
::: 
