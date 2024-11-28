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

FE 在存算分离模式下主要负责 SQL 解析相关工作，也负责跟元数据管理组件 MetaService 交互。FE 支持分布式模式部署，默认情况下使用主备模式部署。 Doris Operator 支持 Doris 3.0.2 及以上的版本在 Kubernetes 上部署存算分离模式。

## 配置资源

### 配置计算资源

FE 在 Kubernetes 部署默认不限制资源使用，`DorisDisaggregatedCluster` 使用 Kubernetes 的 [requests 和 Limits](https://kubernetes.io/zh-cn/docs/concepts/configuration/manage-resources-containers/) 配置服务的计算资源。配置 FE 服务使用 8c 8Gi 计算资源配置如下：
```yaml
spec:
  feSpec:
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
```
将上述配置信息更新到[需要部署的 `DorisDisaggregatedCluster` 资源](install-quickstart.md#第3步部署存算分离集群)中。

### 配置存储资源

存算分离集群 FE 服务是有状态服务，在 Kubernetes 上部署，需要持久化元数据存储目录。Doris Operator 根据配置文件配置的元数据存储目录，以及配置的存储模板自动挂载持久化存储。在[需要部署的 `DorisDisaggregatedCluster` 资源](install-quickstart.md#第3步部署存算分离集群)添加如下配置：
```yaml
spec:
  feSpec:
    persistentVolume:
      persistentVolumeClaimSpec:
        storageClassName: ${storageClassName}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: ${storageSize}
```
其中，`${storageClassName}` 为需要使用的 StorageClass 的名称，如果不填写将使用集群默认的 StorageClass；${storageSize} 表示希望使用申请的存储容量大小，${storageSize} 的格式遵循 Kubernetes 的 [quantity 表达方式](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), 比如： 100Gi。

## 自定义配置文件
Doris Operator 使用 Kubernetes 的 ConfigMap 挂载启动配置。
1. 自定义包含启动配置的 ConfigMap：
  以下展示了可供 FE 使用，包含启动配置的 ConfigMap 示例：
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
  
  在 K8s 部署中，必须设定 `enable_fqdn_mode=true` 。

2. 通过如下命令部署 `ConfigMap` 到 `DorisDisaggregatedCluster` 所在的命名空间：
  ```shell
  kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
  ```
  其中，${namespace} 为 `DorisDisaggregatedCluster` 所在的命名空间，${feConfigMapName} 为包含上述配置的文件名。

3. 更新 [`DorisDisaggregatedCluster` 资源](install-quickstart.md#第3步部署存算分离集群)来使用上述 ConfigMap, 示例如下:
  ```yaml
  spec:
    feSpec:
      replicas: 2
      configMaps:
      - name: fe-configmap
  ```
  
  在 `DorisDisaggregatedCluster` 资源中，配置挂载 ConfigMap 的 configMaps 是一个数组。每一个元素的 name 表示当前命名空间的 ConfigMap 名称。

:::tip 提示
1. Kubernetes 部署中，启动配置中无需要添加 `meta_service_endpoint`、`deploy_mode` 以及 `cluster_id` 配置，Doris-Operator 相关服务会自动添加。  
2. Kubernetes 部署中，自定义启动配置时，必须设定 `enable_fqdn_mode=true`。
:::
