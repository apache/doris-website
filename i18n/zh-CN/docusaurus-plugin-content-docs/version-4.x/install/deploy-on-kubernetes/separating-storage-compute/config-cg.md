---
{
    "title": "配置计算组",
    "language": "zh-CN",
    "description": "存算分离集群中，计算组（Compute Group）负责数据导入并缓存对象存储中的数据以提高查询效率，计算组之间相互隔离。"
}
---

存算分离集群中，计算组（Compute Group）负责数据导入并缓存对象存储中的数据以提高查询效率，计算组之间相互隔离。

## 最简计算组配置
计算组为一组负责相同任务的 BE 集合。在配置 `DorisDisaggregatedCluster` 资源时，必须为每个计算组设置唯一标识符，唯一标识符也是计算组的名称，一旦设定便无法修改。一个最简单计算组配置包括 3 个组成部分，uniqueId，image，replicas，配置如下：
```yaml
spec:
  computeGroups:
  - uniqueId: ${uniqueId}
    image: ${beImage}
    replicas: 1
```
`${beImage}` 为部署 BE 服务的镜像地址，请使用 [apache doris 官方镜像仓库](https://hub.docker.com/r/apache/doris)提供的镜像。`${uniqueId}` 为计算组的唯一标识也是计算组的名称，匹配规则为`[a-zA-Z][0-9a-zA-Z_]+`。replicas 为计算组内 BE 服务节点的数量。

## 配置多计算组
`DorisDisaggregatedCluster` 资源支持部署多套计算组，每套计算组之间相互独立。以下展示了部署名称为 `cg1` 和 `cg2` 两套计算组的配置示例：
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
其中，名称为 `cg1` 的计算组副本数为 3，名称为 `cg2` 的计算组副本数为 2。`${beImage}` 表示部署的 BE 服务镜像。尽管计算组之间相互独立，但建议同一存算分离集群中各计算组内 BE 服务所使用的镜像保持一致。

## 计算资源配置
存算分离[默认部署样例](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml)中，没有对 BE 服务使用的计算资源做限制。`DorisDisaggregatedCluster` 使用 Kubernetes 的[resources.requests 和 resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) 指定 CPU 和内存资源。例如，配置名称为 `cg1` 的计算组 BE 可使用 8c 8Gi 的资源，配置如下：
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
将上述配置更新到需要部署的[`DorisDisaggregatedCluster` 资源](./install-doris-cluster.md#3-配置-dorisdisaggregatedcluster-资源)中。

## 访问配置
默认情况下，计算组不会直接对外提供服务。Doris Operator 在 `DorisDisaggregatedCluster` 资源中为计算组提供 Service 作为被访问的代理。Service 有三种对外暴漏模式 `ClusterIP`、`NodePort`、`LoadBalancer`。
### ClusterIP
在 Kubernetes 上默认使用 [ClusterIP 访问模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)。ClusterIP 访问模式在 Kubernetes 集群内提供了一个内部地址，该地址作为服务在 Kubernetes 内部的。

#### 第 1 步：配置使用 ClusterIP 作为 Service 类型
Doris 默认在 Kubernetes 上启用 ClusterIP 访问模式，用户无需额外配置即可使用。
#### 第 2 步：获取 Service 访问地址
部署集群后，通过以下命令可以查看计算组服务对外暴露的 Service：
```shell
kubectl -n doris get svc
```
返回结果如下：
```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```
在上述结果中，获取了 namespace 为 doris 下，`uniqueId` 为 `cg1` 的对外可使用的 Service 。

### NodePort
若需从 Kubernetes 集群外部访问 Doris，可以选择 [NodePort 的模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)。NodePort 模式提供两种配置方式：静态宿主机端口映射和动态宿主机端口分配。
- **动态宿主机端口分配**：如果未显示设置端口映射，Kubernetes 会在创建 pod 的时自动分配一个宿主机未被使用的端口（默认范围为 30000-32767）。
- **静态宿主机端口分配**：如果显示指定了端口映射，当宿主机端口未被占用且无冲突的时，Kubernetes 会固定分配该端口。
  静态分配需要规划端口映射，Doris 提供以下端口用于与外部交互：

| 端口名称 | 默认端口 | 端口描述                     |
|------| ---- |--------------------------|
| Web Server Port | 8040 | BE 上的 http server 端口，用于查看 BE 的信息 |

#### 静态分配配置
名称为 `cg1` 的计算组静态配置 NodePort 访问模式如下：
```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
      portMaps:
      - nodePort: 31012
        targetPort: 8040
```
上述配置中，将计算组名称为 cg1 的 BE 监听端口 8040 映射到宿主机的 31012 端口。
#### 动态配置
名称为 `cg1` 的计算组动态配置 NodePort 访问模式如下：
```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### LoadBalancer
[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) 模式适用于云平台的 Kubernetes 环境，是由云服务商提供的负载均衡器。
在 `computeGroup.service` 中设置类型为 LoadBalancer，如下所示：
```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## 自定义启动配置
1. 自定义包含启动信息的 ConfigMap  
   默认部署中，每个计算组的 BE 服务均使用镜像内的默认配置文件启动。Doris Operator 使用 Kubernetes 的 ConfigMap 来挂载自定义启动配置文件。以下展示了一个 BE 服务可使用的 ConfigMap 示例：
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
        file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]
        deploy_mode = cloud
    ```
   存算分离集群 BE 服务的启动配置必须设置 `file_cache_path`，格式请参考[存算分离配置 `be.conf`](../../../compute-storage-decoupled/compilation-and-deployment.md#541-配置-beconf) 章节。
2. 部署 ConfigMap  
   使用如下命令将自定义启动配置信息的 ConfigMap 部署到 Kubernetes 集群中：
    ```shell
    kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml 
    ```
   `${namespace}` 为 `DorisDisaggregatedCluster` 部署的命名空间，${beConfigMapFileName} 为包含自定义 ConfigMap 的文件名称。

3. 更新 [`DorisDisaggregatedCluster` 资源](./install-doris-cluster.md#3-配置-dorisdisaggregatedcluster-资源)以 ConfigMap，配置如下：
    ```yaml
    spec:
      computeGroups:
      - uniqueId: cg1
        configMaps:
        - name: be-configmap
          mountPath: "/etc/doris"
    ```

:::tip 提示  
启动配置必须挂载到 "/etc/doris" 目录下。  
:::

## 持久化存储配置
默认部署中，BE 服务使用 Kubernetes 的 [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) 作为服务的缓存。`EmptyDir` 模式是非持久化存储模式，服务重启后缓存的数据会丢失相应查询效率会降低。
为了保证 BE 服务在重启后缓存数据不丢失、查询效率不降低，需要对缓存数据进行持久化存储。BE 服务的日志既会输出到标准输出，也会写入启动配置中 `LOG_DIR` 指定的目录。StreamLoad 模式导入会使用 `/opt/apache-doris/be/storage` 作为数据的暂存位置，避免服务异常重启后暂存的数据丢失，需要对对应写入位置挂载持久化存储。

### 持久化存储样例
以下为需要持久化数据挂载持久化存储的配置样例：
```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    persistentVolumes:
    - mountPaths:
      - /opt/apache-doris/be/log
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - mountPaths:
      - /opt/apache-doris/be/storage
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 500Gi
```
上述配置中，日志目录使用自定义的存储配置挂载 300Gi 的存储磁盘，WAL 以及 StreamLoad 导入时使用的目录配置挂载 300Gi 的存储磁盘，而缓存目录则使用存储模板挂载 500Gi 的存储磁盘。

:::tip 提示
若 `mountPaths` 数组为空，则表示当前存储配置为模板配置。
:::

### 不持久化日志
如果不希望将日志持久化，而仅输出到标准输出，则可配置如下：
```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```
