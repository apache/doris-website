---
{
"title": "配置计算组",
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

存算分离集群中，计算组（Compute Group）负责数据导入并缓存对象存储中的数据以提高查询效率，计算组之间相互隔离。

## 指定计算组名称
计算组必须设定唯一标识符，唯一标识符一旦设定就不能更改，初始化时唯一标识符会作为计算组名称，作为节点一个特性注册到存算分离集群中。以下展示了一个名称为 `cg1`，副本数为 1 的计算组配置示例：
```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 1
```
`${beImage}` 为部署 BE 服务的镜像地址。

## 配置多计算组
一个 `DorisDisaggregatedCluster` 资源支持部署多套计算组，每套计算组之间相互独立。以下展示了部署名称为 `cg1` 和 `cg2` 两套计算组的配置示例：
```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: ${beImage}
    replicas: 3
  - uniqueId: cg2
    image: ${beImage}
    replicas: 2
```
其中，名称为 `cg1` 的计算组副本数为 3，名称为 `cg2` 的计算组副本数为 2。${beImage} 表示部署的 BE 服务使用的镜像地址。

:::tip 提示
多套计算组使用的 image 尽量保持一致。
:::

## 配置服务计算资源
存算分离默认部署中没有限定每个 BE 服务可使用的计算资源量，`DorisDisaggregatedCluster` 使用 Kubernetes 的[resources.requests 和 resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) 指定 CPU 和 Memory 使用量。配置 `cg1` 计算组每个 BE 可使用 8c 8Gi 资源量配置示例如下：
```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
```

将上述配置更新到需要部署的[`DorisDisaggregatedCluster` 资源](install-quickstart.md#第3步部署存算分离集群)中。

## 配置 Cache 持久化
默认部署中，BE 服务使用 Kubernetes 的 [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) 作为服务的缓存。`EmptyDir` 模式是非持久化存储模式，服务重启后缓存的数据会丢失相应查询会效率会降低。配置持久化存储流程如下：

1. 自定义包含启动信息的 ConfigMap  
  默认部署中，每个计算组的 BE 服务使用镜像内的默认配置文件启动，持久化缓存数据需要自定义启动配置。Doris Operator 使用 Kubernetes 的 ConfigMap 来挂载启动配置文件。以下展示了一个 BE 服务可使用的 ConfigMap 示例：
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
      file_cache_path = [{"path":"/mnt/disk1/doris_cloud/file_cache","total_size":107374182400,"query_limit":107374182400}]
  ```
  存算分离集群 BE 服务的启动配置必须设置 `file_cache_path`，格式请参考[存算分离配置 `be.conf`](../../../../compute-storage-decoupled/compilation-and-deployment.md#541-配置-beconf) 章节。以上示例中，设置了一个目录为 `/mnt/disk1/doris_cloud/file_cache` 的持久化缓存，设置可使用持久化总容量大小为 100Gi，查询的缓存可使用的总容量大小也为 100Gi。

2. 部署 ConfigMap  
  通过如下命令，将包含自定义启动配置信息的 ConfigMap 通过如下命令部署到 Kubernetes 集群中：
  ```shell
  kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml 
  ```
  ${namespace} 为 `DorisDisaggregatedCluster` 部署的命名空间，${beConfigMapFileName} 为包含自定义 ConfigMap 的文件名称。

3. 更新 `DorisDisaggregatedCluster` 资源  
  持久化存储需要配置存储模板，`DorisDisaggregatedCluster` 使用 `persistentVolume` 描述持久化存储模板。模板中使用 Kubernetes 的 [PersistentVolumeClaimSpec](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/config-and-storage-resources/persistent-volume-claim-v1/#PersistentVolumeClaimSpec) 描述模板的规格。  
  Doris Operator 会自动解析启动配置的 `file_cache_path` 找出挂载点，使用模板来自动生成持久化存储。`annotations` 可为使用的 [PersistentVolumeClaim](https://kubernetes.io/zh-cn/docs/reference/kubernetes-api/config-and-storage-resources/persistent-volume-claim-v1/)。Doris Operator 默认为日志创建持久化存储，可通过设置 `logNotStore: true` 来禁止为日志创建持久化存储。以下展示了 BE 服务使用自定义的 ConfigMap，并设置存储模板的示例：
  ```yaml
  spec:
    computeGroups:
    - uniqueId: cg1
      configMaps:
      - name: be-configmap
        mountPath: "/etc/doris"
      persistentVolume:
        annotations:
          doris.computegroup/id: cg1
          doris.deployment/mode: disaggregated
        logNotStore: true
        persistentVolumeClaimSpec:
          #storageClassName：${storageClassName}
          accessModes:
          - ReadWriteOnce
          resources:
            requests:
              storage: 500Gi
  ```
  Doris Operator 会使用 Kubernetes 集群中默认的 [StorageClass](https://kubernetes.io/zh-cn/docs/concepts/storage/storage-classes/#default-storageclass) 来为服务创建持久化存储。请通过设置 `storageClassName` 来指定需要使用的 StorageClass。

:::tip 提示  
启动配置必须挂载到 "/etc/doris" 目录下。  
:::
