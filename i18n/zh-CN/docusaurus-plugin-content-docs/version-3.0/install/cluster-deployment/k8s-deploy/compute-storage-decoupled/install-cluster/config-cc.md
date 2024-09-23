---
{
"title": "配置计算集群部署",
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

存算分离计算集群（ Compute Cluster ）负责数据导入并缓存对象存储中的数据。计算集群之间相互隔离。

## 指定计算集群名称

以下配置部署一套最简计算集群：

```yaml
spec:
  computeClusters:
  - name: cc1
    image: {beImage}
    replicas: 1
```

上述配置部署一套计算集群名称为 cc1 的计算集群。计算集群的部署依赖 FE 服务部署完成。存算分离集群依赖元数据服务部署完成。上述样例变量解释如下：

`{beImage}` 为部署 BE 服务的 image 。

:::tip 提示
cc1 为计算集群的名称，执行 sql 的过程中可通过计算集群名称选定想要使用的集群。
:::


## 配置多计算集群

一个 `DorisDisaggregatedCluster` 资源可部署多套计算集群，每套计算集群之间相互独立，彼此之间独自运作。

部署两套计算集群最简部署如下：

```yaml
spec:
  computeClusters:
  - name: cc1
    image: {beImage}
    replicas: 3
  - name: cc2
    image: {beImage}
    replicas: 2
```

以上为两套计算集群的简单配置，集群的名称分别为 cc1 和 cc2 。使用存算分离集群时可通过计算集群的名称选择使用哪一个计算集群，实际使用中可按照业务类别指定集群名称。

修改如下配置到需要[部署存算分离](../install-quickstart.md#部署 DorisDisaggregatedCluster 资源) `DorisDisaggregatedCluster` 资源中，可部署 2 套计算集群，一套可部署 3 个 包含 BE 服务的 pod ， 一套可部署 2 个包含 BE 服务的 pod 。 `{beImage}` 指定想要使用的 BE 服务的 image 。

:::tip 提示
多套计算集群使用的 image 尽量保持一致。
:::

## 配置服务计算资源

设置每个 pod 中 BE（计算服务）容器可使用的 CPU 和 Memory 资源使用量。在 [resources.requests 和 resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) 指定 CPU 和 Memory 使用量。

```yaml
spec:
  computeClusters:
  - name: cc1
    image: {beImage}
    requests:
      cpu: 4
      memory: 8Gi
    limits:
      cpu: 4
      memory: 8Gi
```

上述配置指定了名称 cc1 的计算集群可使用的计算资源。可根据需要填写，并配置到[部署存算分离](../install-quickstart.md#部署 DorisDisaggregatedCluster 资源) `DorisDisaggregatedCluster` 资源中。`{beImage}` 为想使用的 BE 镜像。

## 配置持久化存储

默认情况下，每个 BE 服务会使用 EmptyDir 存储模式来缓存数据，在真实使用场景下需要根据实际需要定义需要的存储大小以及希望使用的 StorageClass 。

```yaml
spec:
  computeClusters:
  - name: cc1
    persistentVolume:
      persistentVolumeClaimSpec:
        #storageClassName：{storageClassName}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: "200Gi"
```

为名称 cc1 的计算集群配置 200Gi 的持久化存储，使用 K8s 集群中默认的 StorageClass 来自动创建存储。如果需要指定 StorageClass ，请取消注释将 storageClassName 设置为想要使用的 StorageClass 的名称。

BE 服务默认 Cache 配置为 `file_cache_path = [{"path":"/opt/apache-doris/be/storage","total_size":107374182400,"query_limit":107374182400}]` 存储容量总可使用容量为 100Gi ，查询可使用的最大容量为 100Gi 。K8s 部署模式下，Doris-Operator 会为每个路径挂载定制的持久化存储。如果需要指定多个路径挂载多盘作为数据缓存，请参考[定制化配置文件](config-cc.md#MA37d8fVKohQffxMYQBcyPSZnZf)。

:::tip 提示
file_cache_path 的值必须是一个 JSON 数组。
:::

## 定制化配置文件

存算分离下，每个计算集群的 BE 服务默认使用镜像内的配置文件启动，在 K8s 部署中可使用 ConfigMap 资源指定 BE 启动配置。

### 自动添加配置

存算分离下，BE 服务的启动请参考[存算分离文档](../../../../../compute-storage-decoupled/creating-cluster#beconf)进行相关配置，在 K8s 部署中 `meta_service_endpoint`, `cloud_unique_id`, `meta_service_use_load_balancer`, `enable_file_cache` 无需填写。

`meta_service_endpoint` K8s 部署中相关服务会根据 `DorisDisaggregatedCluster` 中配置的 `DorisDisaggregatedMetaService` 信息自动生成真实地址信息，自动添加。

`cloud_unique_id` K8s 部署中相关服务自动添加，无需指定。

`meta_service_use_load_balancer` K8s 部署中相关服务会自动添加默认值 false 。

`enable_file_cache` K8s 部署中相关服务会自动设置默认值为 true。

### 服务储存配置

BE 服务在存算模式下定制化配置启动配置，必须按照[存算分离文档](../../../../../compute-storage-decoupled/creating-cluster#beconf)指定 `file_cache_path`。在 K8s 部署中，相关服务会自动根据[持久化相关配置](config-cc.md#配置持久化存储)挂载持久化存储。

比如： `file_cache_path` 配置为 `file_cache_path = [{"path":"/opt/apache-doris/be/storage","total_size":107374182400,"query_limit":107374182400}]`，Doris-Operator 相关服务自动为计算服务添加存储配置信息，这些信息能够申请到挂载点为 `/opt/apache-doris/be/storage` 且容量为 100Gi 的磁盘。

当 file_cache_path 中 total_size 大于[持久化配置](config-cc.md#配置持久化存储)的存储容量，Doris-Operator 会将持久化配置改为 total_size 的大小，防止服务出现非预期故障。

### 挂载定制化 ConfigMap

通过上述规则制定好配置文件后，部署到 `DorisDisaggregatedCluster` 部署的命名空间，并修改需要部署的 `DorisDisaggregatedCluster` 资源指定哪一个计算集群使用定制化配置启动。

如启动配置如下：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: be-configmap
  labels:
    app.kubernetes.io/component: be
data:
  be.conf: |
    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Xmx1024m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED"
    file_cache_path = [{"path":"/mnt/disk1/doris_cloud/file_cache","total_size":104857600000,"query_limit":10485760000}, {"path":"/mnt/disk2/doris_cloud/file_cache","total_size":104857600000,"query_limit":10485760000}]
```

指定计算集群使用上述 ConfigMap 的配置如下：

```yaml
spec:
  computeClusters:
  - name: cc1
    image: {beImage}
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

修改好配置后，将配置信息更新到部署的 [DorisDisaggregatedCluster](../install-quickstart.md#部署 DorisDisaggregatedCluster 资源)  资源中。

:::tip 提示
所有的启动配置必须挂载到 /etc/doris 目录下。
::: 
