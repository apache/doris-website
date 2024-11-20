---
{
"title": "配置部署计算组",
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

存算分离计算组（Compute Group）负责数据导入并缓存对象存储中的数据，计算组之间相互隔离。

## 指定计算组名称

以下配置部署一套最简计算组：

```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      image: {beImage}
      replicas: 1
```

上述配置部署一套名称为 cg1 的计算组。上述样例变量解释如下：

`{beImage}` 为部署 BE 服务的 image。

:::tip 提示
cg1 为计算组的名称，执行 sql 的过程中可通过计算组名称选定想要使用的计算组。
:::


## 配置多计算组

一个 `DorisDisaggregatedCluster` 资源可部署多套计算组，每套计算组之间相互独立，彼此之间独自运作。

部署两套计算组最简部署如下：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: {beImage}
    replicas: 3
  - uniqueId: cg2
    image: {beImage}
    replicas: 2
```

以上为两套计算组的简单配置，计算组的名称分别为 cg1 和 cg2。使用存算分离集群时可通过计算组的名称选择使用哪一个计算组，实际使用中可按照业务类别指定计算组名称。

修改如下配置到需要[部署存算分离](install-quickstart.md) `DorisDisaggregatedCluster` 资源中，可部署 2 套计算组，一套可部署 3 个 包含 BE 服务的 pod，一套可部署 2 个包含 BE 服务的 pod。 `{beImage}` 指定想要使用的 BE 服务的 image。

:::tip 提示
多套计算组使用的 image 尽量保持一致。
:::

## 配置服务计算资源

设置每个 pod 中 BE（计算服务）容器可使用的 CPU 和 Memory 资源使用量。在 [resources.requests 和 resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) 指定 CPU 和 Memory 使用量。

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: {beImage}
    requests:
      cpu: 4
      memory: 8Gi
    limits:
      cpu: 4
      memory: 8Gi
```

上述配置指定了名称 cg1 的计算组可使用的计算资源。可根据需要填写，并配置到[部署存算分离](install-quickstart.md) `DorisDisaggregatedCluster` 资源中。`{beImage}` 为想使用的 BE 镜像。

## 配置 Cache 持久化存储

默认情况下，每个 BE 服务会使用 EmptyDir 存储模式来缓存数据，在真实使用场景下需要根据实际需要定义需要的存储大小以及希望使用的 StorageClass。

### 1.定制化配置文件
存算分离下，每个计算组的 BE 服务默认使用镜像内的配置文件启动，在 K8s 部署中可使用 ConfigMap 资源自定义 BE 启动配置，在[挂载定制化 ConfigMap 中](#3挂载定制化-configmap)，展示了一个 ConfigMap 配置样例。请根据[存算分离文档](../../../../compute-storage-decoupled/compilation-and-deployment.md)进行 BE 的相关启动配置，`deploy_mode` 在 K8s 部署中相关服务自动添加，可无需指定。

### 2.设置服务储存配置

BE 在存算分离模式下必须指定 Cache 配置，请按照[存算分离文档](../../../../compute-storage-decoupled/compilation-and-deployment.md#541-配置-beconf)的 `file_cache_path` 相关介绍配置 Cache 存储。服务在部署时，Doris-Operator 会自动根据[持久化相关配置模板](#4-配置持久化存储模板)挂载持久化存储。

比如： `file_cache_path` 配置为 `file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]`，Doris-Operator 相关服务自动为计算服务添加存储配置信息，这些信息能够申请到挂载点为 `/opt/apache-doris/be/file_cache` 且容量为 100Gi 的磁盘。

当 file_cache_path 中 total_size 大于[持久化配置模版](#4-配置持久化存储模板)中设置的存储容量，Doris-Operator 会将持久化配置改为 total_size 的大小，防止服务出现非预期故障。

### 3.挂载定制化 ConfigMap

通过上述规则制定好配置文件后，部署到 `DorisDisaggregatedCluster` 部署的命名空间，并修改需要部署的 `DorisDisaggregatedCluster` 资源指定哪一个计算组使用定制化配置启动。

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

指定计算组使用上述 ConfigMap 的配置如下：

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: {beImage}
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

修改好配置后，将配置信息更新到部署的 [DorisDisaggregatedCluster](install-quickstart.md)  资源中。

### 4. 配置持久化存储模板
```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    persistentVolume:
      persistentVolumeClaimSpec:
        #storageClassName：{storageClassName}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: "200Gi"
```

以上为名称 cg1 的计算组配置 200Gi 的持久化存储，使用 K8s 集群中默认的 StorageClass 来自动创建存储。如果需要指定 StorageClass，请取消注释将 storageClassName 设置为想要使用的 StorageClass 的名称。

BE 服务默认 Cache 配置为 `file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]` 存储容量总可使用容量为 100Gi，查询可使用的最大容量为 100Gi。K8s 部署模式下，Doris-Operator 会为每个路径挂载定制的持久化存储。如果需要指定多个路径挂载多盘作为数据缓存，请参考[定制化配置文件](../../../../compute-storage-decoupled/compilation-and-deployment.md#54-添加-be-节点)。

:::tip 提示
- file_cache_path 的值必须是一个 JSON 数组。
- 所有的启动配置必须挂载到 /etc/doris 目录下。   
::: 
