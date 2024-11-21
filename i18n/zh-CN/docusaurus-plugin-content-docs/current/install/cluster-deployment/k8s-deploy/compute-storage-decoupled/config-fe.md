---
{
"title": "配置部署 FE",
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

FE 在存算分离模式下主要负责 SQL 解析相关工作，也负责跟元数据管理组件 MS 交互。FE 通常情况下只需部署 2 个服务，replicas 设置为 2 即可。最简单部署模式如下：

```yaml
spec:
  feSpec:
    image: {feImage}
    replicas: 2
```

配置好版本大于 3.0.2 的需要使用的 FE 服务镜像，将配置更新到需要[部署的存算分离资源](install-quickstart#第二步快速部署存算分离集群)中。

## 配置资源

### 配置服务的计算资源

为 FE 服务添加计算资源配置，`DorisDisaggregatedCluster` 复用 K8s 的 requests 和 limits 来配置每个组件的资源使用。以下是使用 4c 4Gi 来配置 FE 服务：

```yaml
spec:
  feSpec:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

上述样例展示如何将 FE 服务的计算资源配置为 4c 4Gi 的模式。配置好 FE 希望使用的资源，将配置信息更新到[需要部署的存算分离资源](install-quickstart#第二步快速部署存算分离集群)中。

### 配置服务存储资源

存算分离集群 FE 服务是有状态服务，在 K8s 部署模式下需要挂载相应的磁盘来存储 FE 服务需要持久化的存储信息。

以下为 FE 配置使用默认 [StorageClass](https://kubernetes.io/zh-cn/docs/concepts/storage/storage-classes/) 来提供存储服务的使用样例：

```yaml
spec:
  feSpec:
    persistentVolume:
      persistentVolumeClaimSpec:
        #storageClassName：{storageClassName}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 200Gi
```

上述样例展示了如何为 FE 服务添加 200Gi 的存储。`{storageClassName}` 为需要使用的 StorageClass 的名称，如果不填写将使用集群默认的 StorageClass。按上述模式配置好 FE 服务需要使用的存储信息后，将配置更新到[需要部署的存算分离资源](install-quickstart.md#第二步快速部署存算分离集群)中。

## 定制化配置文件

在 K8s 部署中可使用 ConfigMap 为 FE 服务挂载定制化的配置来启动 FE 服务。假定使用如下配置启动 FE 服务：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fe-configmap
  namespace: default
  labels:
    app.kubernetes.io/component: fe
data:
  fe.conf: |
    CUR_DATE=`date +%Y%m%d-%H%M%S`
    # Log dir
    LOG_DIR = ${DORIS_HOME}/log
    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Djavax.security.auth.useSubjectCredsOnly=false -Xmx8192m -Xms8192m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED"
    # INFO, WARN, ERROR, FATAL
    sys_log_level = INFO
    # NORMAL, BRIEF, ASYNC
    sys_log_mode = NORMAL
    # Default dirs to put jdbc drivers,default value is ${DORIS_HOME}/jdbc_drivers
    # jdbc_drivers_dir = ${DORIS_HOME}/jdbc_drivers
    http_port = 8030
    rpc_port = 9020
    query_port = 9030
    edit_log_port = 9010
    enable_fqdn_mode=true
```

在 K8s 部署中，必须设定 `enable_fqdn_mode=true` ，FE 使用上述 ConfigMap 的 `DorisDisaggregatedCluster` 资源样例：

```yaml
spec:
  feSpec:
    replicas: 2
    configMaps:
    - name: fe-configmap
```

在 `DorisDisaggregatedCluster` 资源中，配置挂载 ConfigMap 的 configMaps 是一个数组。每一个元素的 name 表示当前命名空间的 ConfigMap 名称。

按上述模式配置好 FE 服务需要使用的 ConfigMap 信息，将配置更新到[需要部署的存算分离资源](install-quickstart.md#第二步快速部署存算分离集群)中。

:::tip 提示
1. K8s 部署中，使用 ConfigMap 挂载定制化配置文件时，无需添加 `meta_service_endpoint`、`deploy_mode` 以及 `cluster_id` 配置，Doris-Operator 相关服务会自动添加。
2. K8s 部署中，使用 ConfigMap 挂载定制化配置文件时，必须设定 `enable_fqdn_mode=true`。
:::
