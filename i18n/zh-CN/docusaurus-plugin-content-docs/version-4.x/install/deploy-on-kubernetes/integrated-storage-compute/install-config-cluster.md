---
{
    "title": "配置 Doris 集群",
    "language": "zh-CN",
    "description": "默认部署的 DorisCluster 资源中，FE 和 BE 的镜像可能并非最新版本，且默认副本数均为 3。默认情况下，FE 使用的计算资源配置为 6c 12Gi，BE 使用的资源是 8c 16Gi。以下介绍如何根据需求调整这些默认配置。"
}
---

## 集群规划

默认部署的 `DorisCluster` 资源中，FE 和 BE 的镜像可能并非最新版本，且默认副本数均为 3。默认情况下，FE 使用的计算资源配置为 6c 12Gi，BE 使用的资源是 8c 16Gi。以下介绍如何根据需求调整这些默认配置。

### Image 设置

Doris Operator 与 Doris 版本相互解耦，Doris Operator 支持 2.0  以上 的 Doris 版本部署。

**FE Image 设置**  

如需指定 FE 的镜像，可按以下方式进行配置：  

```yaml
spec:
  feSpec:
    image: ${image}
```

将 `${image}` 替换想要部署的 image 名称后，将配置更新到需要部署的 [DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中。Doris 官方提供的 [FE Image](https://hub.docker.com/r/apache/doris/tags?name=fe) 可供使用。

**BE Image 设置**  

如需指定 BE 的镜像，可按以下方式进行配置：

```yaml
spec:
  beSpec:
    image: ${image}
```

将 `${image}` 替换想要部署的 image 名称后，将配置更新到需要部署的 [DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中。Doris 官方提供的 [BE Image](https://hub.docker.com/r/apache/doris/tags?name=be) 可供使用。

### 副本数设定

**FE 副本数修改**

将默认的 FE 副本数 3 改为 5，可按以下方式进行配置：

```yaml
spec:
  feSpec:
    replicas: 5
```

将配置更新到需要部署的 [DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中。

**BE 副本数修改**

将默认的 BE 副本数 3 改为 5，可按以下方式进行配置：

```yaml
spec:
  beSpec:
    replicas: 5
```

将配置更新到需要部署的 [DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中。

### 计算资源设定

**FE 计算资源设定**

默认部署的 FE 计算资源为 6c 12Gi，若需修改为 8c 16Gi，可按以下方式进行配置：

```yaml
spec:
  feSpec:
    requests:
      cpu: 8
      memory: 16Gi
    limits:
      cpu: 8
      memory: 16Gi
```

将配置更新到需要部署的 [DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中。

**BE 计算资源设定**

默认部署的 BE 计算资源为 8c 16Gi, 如需修改为 16c 32Gi，可按以下方式进行配置：

```yaml
spec:
  beSpec:
    requests:
      cpu: 16
      memory: 32Gi
    limits:
      cpu: 16
      memory: 32Gi
```

将配置更新到需要部署的 [DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中。

:::tip 提示  
FE 和 BE 所需要的最小启动资源为 4c 8Gi，如果需要进行正常能力测试，建议配置为 8c 8Gi。  
:::

## 定制化启动配置

在 Kubernetes 中，Doris 使用 `ConfigMap` 将配置文件和服务分离。默认情况下，服务使用镜像里默认配置作为启动参数。请根据 [FE 配置文档](../../../admin-manual/config/fe-config)和 [BE 配置文档](../../../admin-manual/config/be-config)介绍，预先将定制好的启动参数配置到特定的 `ConfigMap` 中。配置完成后，将其部署到目标[ `DorisCluster` 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)所在的命名空间中。

### FE 定制化启动配置

#### 第 1 步：配置并部署 ConfigMap  

以下示例定义了名为 `fe-conf` 的 ConfigMap，该配置可供 Doris FE 使用：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fe-conf
  labels:
    app.kubernetes.io/component: fe
data:
  fe.conf: |
    CUR_DATE=`date +%Y%m%d-%H%M%S`
    # Log dir
    LOG_DIR = ${DORIS_HOME}/log
    # For jdk 8
    JAVA_OPTS="-Dfile.encoding=UTF-8 -Djavax.security.auth.useSubjectCredsOnly=false -Xss4m -Xmx8192m -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+PrintClassHistogramAfterFullGC -Xloggc:$LOG_DIR/log/fe.gc.log.$CUR_DATE -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=10 -XX:GCLogFileSize=50M -Dlog4j2.formatMsgNoLookups=true"

    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Dfile.encoding=UTF-8 -Djavax.security.auth.useSubjectCredsOnly=false -Xmx8192m -Xms8192m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*,classhisto*=trace:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED --add-opens java.base/sun.nio.ch=ALL-UNNAMED"
    # Set your own JAVA_HOME
    # JAVA_HOME=/path/to/jdk/
    ##
    ## the lowercase properties are read by main program.
    ##
    # store metadata, must be created before start FE.
    # Default value is ${DORIS_HOME}/doris-meta
    # meta_dir = ${DORIS_HOME}/doris-meta
    # Default dirs to put jdbc drivers,default value is ${DORIS_HOME}/jdbc_drivers
    # jdbc_drivers_dir = ${DORIS_HOME}/jdbc_drivers

    http_port = 8030
    rpc_port = 9020
    query_port = 9030
    edit_log_port = 9010
    arrow_flight_sql_port = -1

    # Choose one if there are more than one ip except loopback address.
    # Note that there should at most one ip match this list.
    # If no ip match this rule, will choose one randomly.
    # use CIDR format, e.g. 10.10.10.0/24 or IP format, e.g. 10.10.10.1
    # Default value is empty.
    # priority_networks = 10.10.10.0/24;192.168.0.0/16

    # Advanced configurations
    # log_roll_size_mb = 1024
    # INFO, WARN, ERROR, FATAL
    syg_level = INFO
    # NORMAL, BRIEF, ASYNC
    syg_mode = ASYNC
    # audit_log_dir = $LOG_DIR
    # audit_log_modules = slow_query, query
    # audit_log_roll_num = 10
    # meta_delay_toleration_second = 10
    # qe_max_connection = 1024
    # qe_query_timeout_second = 300
    # qe_slow_log_ms = 5000
    enable_fqdn_mode = true
```

使用 ConfigMap 挂载 FE 启动配置信息时，配置信息对应的 key 必须为 `fe.conf` 。完成配置文件后，通过如下命令部署到 `DorisCluster` 资源将要部署的命名空间。

```shell
kubectl -n ${namespace} apply -f ${feConfigMapFile}.yaml
```

其中，`${namespace}` 为 目标 `DorisCluster` 资源 将要部署的命名空间， ${feConfigMapFile} 为包含上述配置的文件名。

#### 第 2 步：配置 DorisCluster 资源

以 fe-conf 对应的 ConfigMap 为例，需要在[部署的 `DorisCluster` 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中添加如下信息：

```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: fe-conf
      resolveKey: fe.conf
```

:::tip 提示  
Kubernetes 部署中，建议使用 FQDN 模式，启动配置中应添加 enable_fqdn_mode=true。如果想用 IP 模式，且 Kubernetes 集群能够保证 pod 重启后 IP 不发生变化，请参照 issue [#138](https://github.com/apache/doris-operator/issues/138) 进行配置 IP 模式启动。
:::

### BE 定制化启动配置

#### 第 1 步：配置并部署 ConfigMap   

以下定义了名为 `be-conf` ConfigMap，该配置可供 Doris BE 使用：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: be-conf
  labels:
    app.kubernetes.io/component: be
data:
  be.conf: |
    CUR_DATE=`date +%Y%m%d-%H%M%S`
    # Log dir
    LOG_DIR="${DORIS_HOME}/log/"
    # For jdk 8
    JAVA_OPTS="-Dfile.encoding=UTF-8 -Xmx2048m -DlogPath=$LOG_DIR/jni.log -Xloggc:$LOG_DIR/be.gc.log.$CUR_DATE -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=10 -XX:GCLogFileSize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives"
    # For jdk 17, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_17="-Dfile.encoding=UTF-8 -Djol.skipHotspotSAAttach=true -Xmx2048m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED -Darrow.enable_null_check_for_get=false"
    # Set your own JAVA_HOME
    # JAVA_HOME=/path/to/jdk/
    # https://github.com/apache/doris/blob/master/docs/zh-CN/community/developer-guide/debug-tool.md#jemalloc-heap-profile
    # https://jemalloc.net/jemalloc.3.html
    JEMALLOC_CONF="percpu_arena:percpu,background_thread:true,metadata_thp:auto,muzzy_decay_ms:5000,dirty_decay_ms:5000,oversize_threshold:0,prof:true,prof_active:false,lg_prof_interval:-1"
    JEMALLOC_PROF_PRFIX="jemalloc_heap_profile_"
    # ports for admin, web, heartbeat service
    be_port = 9060
    webserver_port = 8040
    heartbeat_service_port = 9050
    brpc_port = 8060
    arrow_flight_sql_port = -1
    # HTTPS configures
    enable_https = false
    # path of certificate in PEM format.
    ssl_certificate_path = "$DORIS_HOME/conf/cert.pem"
    # path of private key in PEM format.
    ssl_private_key_path = "$DORIS_HOME/conf/key.pem"

    # Choose one if there are more than one ip except loopback address.
    # Note that there should at most one ip match this list.
    # If no ip match this rule, will choose one randomly.
    # use CIDR format, e.g. 10.10.10.0/24 or IP format, e.g. 10.10.10.1
    # Default value is empty.
    # priority_networks = 10.10.10.0/24;192.168.0.0/16

    # data root path, separate by ';'
    # You can specify the storage type for each root path, HDD (cold data) or SSD (hot data)
    # eg:
    # storage_root_path = /home/disk1/doris;/home/disk2/doris;/home/disk2/doris
    # storage_root_path = /home/disk1/doris,medium:SSD;/home/disk2/doris,medium:SSD;/home/disk2/doris,medium:HDD
    # /home/disk2/doris,medium:HDD(default)
    #
    # you also can specify the properties by setting '<property>:<value>', separate by ','
    # property 'medium' has a higher priority than the extension of path
    #
    # Default value is ${DORIS_HOME}/storage, you should create it by hand.
    # storage_root_path = ${DORIS_HOME}/storage

    # Default dirs to put jdbc drivers,default value is ${DORIS_HOME}/jdbc_drivers
    # jdbc_drivers_dir = ${DORIS_HOME}/jdbc_drivers

    # Advanced configurations
    # INFO, WARNING, ERROR, FATAL
    sys_log_level = INFO
    # sys_log_roll_mode = SIZE-MB-1024
    # sys_log_roll_num = 10
    # sys_log_verbose_modules = *
    # log_buffer_level = -1

    # aws sdk log level
    #    Off = 0,
    #    Fatal = 1,
    #    Error = 2,
    #    Warn = 3,
    #    Info = 4,
    #    Debug = 5,
    #    Trace = 6
    # Default to turn off aws sdk log, because aws sdk errors that need to be cared will be output through Doris logs
    aws_log_level=0
    ## If you are not running in aws cloud, you can disable EC2 metadata
    AWS_EC2_METADATA_DISABLED=true
```

使用 ConfigMap 挂载 BE 启动配置信息时，配置信息对应的 key 必须为 `be.conf` 。完成配置文件后，将其部署到目标 `DorisCluster` 资源需要部署的命名空间。

```shell
kubectl -n ${namespace} apply -f ${beConfigMapFile}.yaml
```

其中，`${namespace}` 为 `DorisCluster` 资源需要部署到的 namespace，${beConfigMapFile} 为包含上述配置的文件名。

#### 第 2 步：配置 DorisCluster 资源

以 be-conf 对应的 ConfigMap 为例，需要在[部署的 `DorisCluster` 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中添加如下信息：

```yaml
spec:
  beSpec:
    configMapInfo:
      configMapName: be-conf
      resolveKey: be.conf
```

:::tip 提示  
如果需要将文件挂载到和启动配置同一目录下，需要将配置信息配置到启动配置所在的 ConfigMap 中。ConfigMap 中的 key 为文件名称，value 为配置信息。  
:::

### 多 ConfigMap 挂载

Doris Operator 除了支持通过 ConfigMap 挂载配置文件，还提供了将多个 ConfigMap 挂载到容器不同目录的功能。

**FE 挂载多 ConfigMap**

以下示例展示将 `test-fe1` ， `test-fe2` 的 ConfigMap 分别挂载到 FE 容器 `/etc/fe/config1/` 和 `/etc/fe/config2` 目录下：

```yaml
spec:
  feSpec:
    configMaps:
    - configMapName: test-fe1
      mountPath: /etc/fe/config1
    - configMapName: test-fe2
      mountPath: /etc/fe/config2
```

上述配置中，${your_storageclass} 表示希望使用的 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 名称，${storageSize} 表示希望使用的存储大小，${storageSize} 的格式遵循 K8s 的 [quantity 表达方式](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), 比如：100Gi。请在使用时按需替换。

**BE 挂载多 ConfigMap**  

以下示例展示将 test-be1，test-be2 的 ConfigMap 分别挂载到 BE 容器 `/etc/be/config1/` 和 `/etc/be/config2` 目录下：

```yaml
spec:
  beSpec:
    configMaps:
    - configMapName: test-be1
      mountPath: /etc/be/config1
    - configMapName: test-be2
      mountPath: /etc/be/config2
```

上述配置中，${your_storageclass} 表示希望使用的 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 名称，${storageSize} 表示希望使用的存储大小，${storageSize} 的格式遵循 K8s 的 [quantity 表达方式](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), 比如：100Gi。请在使用时按需替换。

## 配置持久化存储

在 Doris 集群中，FE、BE 组件需要将数据持久化。Kubernetes 提供了 [Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) 机制，将数据持久化到物理存储中。在 Kubernetes 环境中，Doris Operator 使用 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 自动创建 PersistentVolumeClaim 关联合适的 PersistentVolume。

### FE 持久化存储配置

在 Kubernetes 部署 Doris 集群时，建议默认持久化 `/opt/apache-doris/fe/doris-meta` 挂载点，该路径为 FE 元数据的默认存储路径。Doris 默认将所有的日志信息输出到标准输出（console），如集群缺乏日志收集能力，建议持久化 /opt/apache-doris/fe/log 挂载点以实现日志持久化。  

#### FE 元数据持久化

使用默认配置文件时，需要在[部署的 DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中添加如下内容：

```yaml
spec:
  feSpec:
    persistentVolumes:
    - mountPath: /opt/apache-doris/fe/doris-meta
      name: meta
      persistentVolumeClaimSpec:
        # when use specific storageclass, the storageClassName should reConfig, example as annotation.
        storageClassName: ${your_storageclass}
        accessModes:
          - ReadWriteOnce
        resources:
          # notice: if the storage size less 5G, fe will not start normal.
          requests:
            storage: ${storageSize}
```

上述配置中，${your_storageclass} 表示指定的 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 名称，${storageSize} 表示指定的存储大小，格式遵循 Kubernetes 的 [quantity 表达方式](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), 比如：100Gi。

#### FE 日志持久化

使用默认配置文件时，将如下配置添加到需要[部署的 DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中：

```yaml
spec:
  feSpec:
    persistentVolumes:
    - mountPath: /opt/apache-doris/fe/log
      name: log
      persistentVolumeClaimSpec:
        # when use specific storageclass, the storageClassName should reConfig, example as annotation.
        storageClassName: ${your_storageclass}
        accessModes:
          - ReadWriteOnce
        resources:
          # notice: if the storage size less 5G, fe will not start normal.
          requests:
            storage: ${storageSize}
```

上述配置中，${your_storageclass} 表示希望使用的 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 名称，${storageSize} 表示希望使用的存储大小，${storageSize} 的格式遵循 Kubernetes 的 [quantity 表达方式](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), 比如：100Gi。

:::tip 提示  
如果在[定制化配置文件中](#fe-定制化启动配置)，重新设置了 `meta_dir` 或者 `LOG_DIR` 请重新设置 `mountPath` 。
:::

### BE 持久化存储配置

在 Kubernetes 部署 Doris 集群时，建议持久化 `/opt/apache-doris/be/storage` 挂载点，该路径为 BE 节点默认的数据存储路径。在 Kubernetes 部署时，Doris 默认将所有的日志信息输出标准输出（console）。如果集群缺少日志收集能力，建议持久化 `/opt/apache-doris/be/log` 挂载点。

#### BE 数据持久化

- 默认持久化存储路径  

  如果 BE 使用默认配置，需要在[部署的 DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中添加如下内容：
  ```yaml
  beSpec:
    persistentVolumes:
    - mountPath: /opt/apache-doris/be/storage
      name: be-storage
      persistentVolumeClaimSpec:
        storageClassName: ${your_storageclass}
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: ${storageSize}
  ```

  上述配置中，${your_storageclass} 表示希望使用的 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 名称，${storageSize} 表示希望使用的存储大小，格式遵循 Kubernetes 的 [quantity 表达方式](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), 比如：100Gi。  

- 多存储路径持久化

  如果自定义配置中通过 `storage_root_path` 指定了多个存储目录（如： `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD` ）, 需要在部署 [DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中添加如下配置：

  ```yaml
  beSpec:
    persistentVolumes:
    - mountPath: /home/disk1/doris
      name: be-storage1
      persistentVolumeClaimSpec:
        storageClassName: ${your_storageclass}
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: ${storageSize}
    - mountPath: /home/disk2/doris
      name: be-storage2
      persistentVolumeClaimSpec:
        storageClassName: ${your_storageclass}
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: ${storageSize}
  ```
  
#### BE 日志持久化

使用默认配置文件时，在需要[部署的 DorisCluster 资源](install-doris-cluster.md#第-2-步安装自定义部署模板)中，添加以下内容：

```yaml
beSpec:
  persistentVolumes:
  - mountPath: /opt/apache-doris/be/log
    name: belog
    persistentVolumeClaimSpec:
      storageClassName: ${your_storageclass}
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: ${storageSize}
```

上述配置中，${your_storageclass} 表示希望使用的 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 名称，${storageSize} 表示希望使用的存储大小，格式遵循 Kubernetes 的 [quantity 表达方式](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), 比如：100Gi。

## 访问配置

Kubernetes 通过 Service 作为 vip 和负载均衡器的能力，Service 有三种对外暴漏模式 `ClusterIP` 、 `NodePort` 、 `LoadBalancer` .

### ClusterIP

Doris 在 Kubernetes 上默认使用 [ClusterIP 访问模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip)。ClusterIP 访问模式在 Kubernetes 集群内提供了一个内部地址，该地址作为服务在 Kubernetes 内部的被访问地址。

#### 第 1 步：配置使用 ClusterIP 作为 Service 类型

  Doris 默认在 Kubernetes 上启用 ClusterIP 访问模式，用户无需额外修改即可使用该模式。

#### 第 2 步：获取 Service 访问地址

部署集群后，通过以下命令可以查看 Doris Operator 暴露的 service：

```shell
kubectl -n doris get svc
```

返回结果如下：

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

在上述结果中，FE 与 BE 各自有两类 Service，分别以 internal 与 service 作为后缀：

以 internal 后缀的 Service 仅供 Doris 内部通信使用，如心跳，数据交换等，不对外暴漏。 

以 service 后缀的 Service 用于访问集群服务。

#### 第 3 步：在容器内部访问 Doris

使用如下命令在当前的 Kubernetes 集群中创建一个包含 MySQL 客户端 的 Pod：

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

在容器内部，可以通过访问带有 `service` 后缀的 Service 名称连接 Doris 集群：

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

### NodePort

若需从 Kubernetes 集群外部访问 Doris，可以选择 [NodePort 的模式](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)。NodePort 模式提供两种配置方式：静态宿主机端口映射和动态宿主机端口分配。

- **动态宿主机端口分配**：如果未显示设置端口映射，Kubernetes 会在创建 pod 的时自动分配一个宿主机未被使用的端口（默认范围为 30000-32767）；

- **静态宿主机端口分配**：如果显示指定了端口映射，当宿主机端口未被占用且无冲突的时，Kubernetes 会固定分配该端口。

静态分配需要规划端口映射，Doris 提供以下端口用于与外部交互：

| 端口名称 | 默认端口 | 端口描述                     |
|------| ---- |--------------------------|
| Query Port | 9030 | 用于通过 MySQL 协议访问 Doris 集群 |
| HTTP Port | 8030 | FE 上的 http server 端口，用于查看 FE 的信息 |
| Web Server Port | 8040 | BE 上的 http server 端口，用于查看 BE 的信息 |


#### 第 1 步：配置 FE 和 BE 的 NodePort

**FE NodePort**  

- 动态分配配置：

  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
  ```

- 静态分配配置示例：

  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
        servicePorts:
        - nodePort: 31001
          targetPort: 8030
        - nodePort: 31002
          targetPort: 9030
  ```

**BE NodePort**

- 动态分配配置：

  ```yaml
  spec:
    beSpec:
      service:
        type: NodePort
  ```

- 静态分配配置示例：

  ```yaml
  beSpec:
    service:
      type: NodePort
      servicePorts:
      - nodePort: 31006
        targetPort: 8040
  ```

#### 第 2 步：获取 Service

集群部署完成后，通过以下命令查看 `Service` ：

```shell
kubectl get service
```

返回结果如下：

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### 第 3 步：使用 NodePort 访问服务

以 mysql 连接为例，Doris 的 Query Port 默认端口 9030，在上述示例中，端口  9030 被映射到本地端口 31545。要访问 Doris 集群，需要获取到集群的节点 IP 地址，可以使用以下命令查看：

```shell
kubectl get nodes -owide
```

返回结果如下：

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

在 NodePort 模式下，可以通过任意 node 节点的 IP 地址与映射的宿主机端口方位 Kubernetes 集群内的服务。在本例中，可以使用的 node 节点 IP 包括 192.168.88.61、192.168.88.62、192.168.88.63。以下示例展示了如何使用节点 192.168.88.62 和 `query port` 映射的宿主机端口 31545 连接 Doris：

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

### LoadBalancer

[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) 是由云服务商提供的负载均衡器。此配置仅适用于云平台提供的 Kubernetes 环境。

#### 第 1 步：配置 LoadBalancer 模式

**FE 配置 LoadBalancer**

```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
```

**BE 配置 LoadBalancer**

  ```yaml
  spec:
    beSpec:
      service:
        type: LoadBalancer
  ```

#### 第 2 步：获取 Service

在部署集群后，通过以下命令可以查看可访问 `Doris` 的 `Service`：

```shell
kubectl get service
```

返回结果如下：

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### 第 3 步：使用 LoadBalancer 模式访问

以 MySQL 连接为例：

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## 配置管理用户名和密码

Doris 节点的管理需要通过用户名、密码以 MySQL 协议连接活着的 FE 节点进行操作。Doris 实现[类似 RBAC 的权限管理机制](../../../admin-manual/auth/authentication-and-authorization)，节点的管理需要用户拥有 [Node_priv](../../../admin-manual/auth/authentication-and-authorization#权限类型) 权限。Doris Operator 默认使用拥有所有权限的 root 用户无密码模式对 DorisCluster 资源配置的集群进行部署和管理。root 用户添加密码后，需要在 DorisCluster 资源中显示配置拥有 Node_Priv 权限的用户名和密码，以便 Doris Operator 对集群进行自动化管理操作。

DorisCluster 资源提供两种方式来配置管理集群节点所需的用户名、密码，包括：环境变量配置的方式，以及使用 [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) 配置的方式。配置集群管理的用户名和密码分为 3 种情况：

- 集群部署需初始化 root 用户密码；

- root 无密码部署下，自动化设置拥有管理权限的非 root 用户；

- 集群 root 无密码模式部署后，设置 root 用户密码。

### 集群部署配置 root 用户密码

Doris 支持将 root 的用户以密文的形式配置在 `fe.conf` 中，在 Doris 首次部署时配置 root 用户的密码，以便让 Doris Operator 能够自动管理集群节点，请按照如下步骤操作：

#### 第 1 步：构建 root 加密密码

Doris 支持密文的方式在 [FE 的配置文件](../../../admin-manual/config/fe-config#initial_root_password)中设置 root 用户的密码，密码的加密方式是采用两阶段 SHA-1 加密实现。代码实现示例如下：

Java 代码实现：

```java
import org.apache.commons.codec.digest.DigestUtils;

public static void main( String[] args ) {
      //the original password
      String a = "123456";
      String b = DigestUtils.sha1Hex(DigestUtils.sha1(a.getBytes())).toUpperCase();
      //output the 2 stage encrypted password.
      System.out.println("*"+b);
  }
```

Golang 代码实现：

```go
import (
"crypto/sha1"
"encoding/hex"
"fmt"
"strings"
)

func main() {
	//original password
	plan := "123456"
	//the first stage encryption.
	h := sha1.New()
	h.Write([]byte(plan))
	eb := h.Sum(nil)

	//the two stage encryption.
	h.Reset()
	h.Write(eb)
	teb := h.Sum(nil)
	dst := hex.EncodeToString(teb)
	tes := strings.ToUpper(fmt.Sprintf("%s", dst))
	//output the 2 stage encrypted password. 
	fmt.Println("*"+tes)
}
```

将加密后的密码按照配置文件要求配置到 `fe.conf` 中，根据[集群参数配置章节](#fe-定制化启动配置)章节的说明，将配置文件以 `ConfigMap` 的形式下发到 Kubernetes 集群。

#### 第 2 步：构建 DorisCluster 资源

配置文件设置了 root 初始化密码后，当 Doris FE 第一个节点启动后 root 的密码会立即生效，后续节点加入集群时，Doris Operator 将使用 root 用户名和密码来添加节点。因此，需要在部署的 DorisCluster 资源中指定用户名和密码，以便 Doris Operator 管理集群节点。

- 环境变量方式

  将 root 用户名和密码配置到 DorisCluster 资源中的 ".spec.adminUser.name" 和 ".spec.adminUser.password" 字段，Doris Operator 会自动将这些配置转为容器的环境变量，容器内的辅助服务会使用环境变量来添加节点到集群。配置格式如下：

  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```

  其中，`${password}` 为 root 的非加密密码。

- Secret 方式

  Doris Operator 提供使用 [Basic authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) 来指定管理节点的用户名和密码，Doris Operator 会自动将 Secret 以文件形式挂载到容器指定位置，容器的辅助服务会解析出文件中的用户名和密码，用于自动将节点加入集群。basic-authentication-secret 的 stringData 只包含 2 个字段：username 和 password。使用 Secret 配置管理用户名和密码流程如下：

  a. 配置需要使用的 Secret

  按照如下格式配置需要使用的 Basic Authentication Secret：

  ```yaml
  stringData:
    username: root
    password: ${password}
  ```

  其中，`${password}` 为 root 设置的非加密密码。  
  通过如下命令将更新后的 Secret 部署到 Kubernetes 集群中。
  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
  其中，`${namespace}` 为 DorisCluster 资源需要部署的命名空间，${secretFileName} 为需要部署的 Secret 的文件名称。

  b. 配置 DorisCluster 资源

  在需要部署的 DorisCluster 资源中，指定使用的 Secret。配置如下：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  其中，`${secretName}` 为包含 root 用户名和密码的 Secret 名称。

### 部署时自动创建非 root 管理用户和密码（推荐）

在首次部署时，如果不设置 root 的初始化密码，通过环境变量或者 Secret 的方式配置非 root 用户和登录密码。Doris 容器的辅助服务会自动在 Doris 中创建该用户，设置密码和赋予 Node_priv 权限，Doris Operator 将使用自动创建的用户名和密码管理集群节点。

- 环境变量模式

  按照如下格式配置需要部署的 DorisCluster 资源：
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  其中，`${DB_ADMIN_USER}` 为需要新建拥有管理权限的用户名，`${DB_ADMIN_PASSWD}` 为新建用户的密码。

- Secret 方式

  a. 配置需要使用的 Secret

  按照如下格式配置需要使用的 Basic authentication Secret：

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  其中，`${DB_ADMIN_USER}` 为新创建的用户名，`${DB_ADMIN_PASSWD}` 为新建用户名设置的密码。

  使用以下命令将 Secret 部署到 Kubernetes 集群中：

  ```
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  其中，`${namespace}` 为 DorisCluster 资源部署的命名空间，`${secretFileName}` 为需要部署的 Secret 的文件名称。

  b. 更新 DorisCluster 资源

  在 DorisCluster 资源中指定使用的 Secret，如下所示：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  其中，`${secretName}` 为部署的 Basic Authentication Secret 的名称。

:::tip 提示
- 部署后请设置 root 的密码，Doris Operator 会切换为使用新用户和密码管理集群节点，请避免删除新建的用户。
:::

### 集群部署后设置 root 用户密码

Doris 集群在部署后，若未设置 root 用户的密码。需要配置一个具有 [Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#权限类型) 权限的用户，便于 Doris Operator 自动化的管理集群节点。建议不要使用 root 用户，请参考[用户新建和权限赋值章节](../../../sql-manual/sql-statements/account-management/CREATE-USER)来创建新用户并赋予 Node_priv 权限。创建用户后，通过环境变量或者 Secret 配置新的管理用户和密码，并在 DorisCluster 资源中配置。

#### 第 1 步：新建拥有 Node_priv 权限用户

通过 MySQL 协议连接数据库后，通过如下命令创建一个仅拥有 Node_priv 权限的用户并设置密码。

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

其中 ${DB_ADMIN_USER} 为要创建的用户名，${DB_ADMIN_PASSWD} 为要设置的密码。

#### 第 2 步：为新用户赋予 Node_priv 权限

使用 MySQL 协议连接数据库后，执行如下命令将 Node_priv 权限赋予新用户。

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

其中，${DB_ADMIN_USER} 为新创建的用户名。

新建用户名密码，以及赋予权限详细使用，请参考官方文档 [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) 部分。

#### 第 3 步：配置 DorisCluster 资源

- 环境变量方式

  在 DorisCluster 资源中配置新建用户及其密码，格式如下：
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  其中，${DB_ADMIN_USER} 为新建的用户名，${DB_ADMIN_PASSWD} 为新建用户设置的密码。

- Secret 方式

  a. 配置 Secret

  按照如下格式创建 Basic Authentication Secret：

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  其中 ${DB_ADMIN_USER} 为新创建的用户名，${DB_ADMIN_PASSWD} 为新建用户名设置的密码。

  使用以下命令将 Secret 部署到 Kubernetes 集群：

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  其中，`${namespace}` 为 DorisCluster 资源部署的命名空间，`${secretFileName}` 为需要部署的 Secret 的文件名称。

  b. 更新需要使用 Secret 的 DorisCluster 资源

  在 DorisCluster 资源中指定使用的 Secret，如下所示：

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  其中，`${secretName}` 为部署的 Basic authentication Secret 的名称。

:::tip 提示
- 部署后设置 root 密码，并配置新的拥有管理节点的用户名和密码后，会引起存量服务滚动重启一次。
:::

## 启动配置修改后自动重启服务生效参数
Doris 通过配置文件的方式指定启动参数。目前大部分参数可以通过相应的 web 接口进行修改并实时生效，一些不能通过 web 接口修改的参数需要重启服务生效。Doris Operator 的 25.1.0 版本后提供服务启动参数修改后自动重启生效的能力。  
在 `DorisCluster` 资源中配置开启上述能力，配置如下：
```yaml
spec:
  enableRestartWhenConfigChange: true
```
如果 DorisCluster 资源含有上述配置，Doris Operator 将会进行如下处理：
1. 监测 `DorisCluster` 资源部署的集群依赖的启动配置(通过 ConfigMap 挂载，详情请查看[定制化启动配置章节](#定制化启动配置))是否发生变化。  
2. 启动配置变化后，自动重启相应服务来使配置生效。

### 使用范例
支持 FE、BE 节点类型的 configmap 监测重启，这里以 FE 为例。
1. DorisCluster 部署规格如下：
    ```yaml
    spec:
      enableRestartWhenConfigChange: true
      feSpec:
        image: apache/doris:fe-2.1.8
        replicas: 1
        configMapInfo:
          configMapName: fe-configmap
    ```
2. 更新 `fe-configmap` 里面指定的 FE 服务启动配置。  
当更新 `fe-configmap` 中 key 为 `fe.conf` 对应的值( FE 服务的启动配置)后，Doris Operator 自动滚动重启 FE 服务使配置生效。

## 使用 Kerberos 认证
Doris Operator 从 25.2.0 版本开始支持 Doris (2.1.9 和 3.0.4 及以后版本) 在 Kubernetes 使用 Kerberos 认证。 Doris 使用 Kerberos 认证需要使用 [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) 和 [keytab 文件](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html) 。
Doris Operator 使用 `ConfigMap` 资源挂载 krb5.conf 文件，使用 `Secret` 资源挂载 keytab 文件。使用 Kerberos 认证流程如下：
1. 构建包含 krb5.conf 文件的 ConfigMap：
    ```shell
    kubectl create -n ${namespace} create configmap ${name} --from-file=krb5.conf
    ```
   ${namespace} 为 `DorisCluster` 部署的命名空间，${name} 为 ConfigMap 想要指定的名字。
2. 构建包含 keytab 的 Secret:
    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file= ${xxx.keytab}
    ```
   ${namespace} 为 `DorisCluster` 部署的命名空间，${name} 为 Secret 想要指定的名字，如果需要挂载多个 `keytab` 文件，请参考 [kubectl 创建 Secret 文档](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/)将多个 `keytab` 文件放到一个 Secret 中。
3. 配置 DorisCluster 资源，指定包含 `krb5.conf` 的 ConfigMap, 以及包含 `keytab` 文件的 Secret。
    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
   ${krb5ConfigMapName} 为包含要使用的 `krb5.conf` 文件的 ConfigMap 名称。${keytabSecretName} 为包含 keytab 文件的 Secret 名称。${keytabPath} 为 Secret 希望挂载到容器中的路径，这个路径是创建 catalog 时，通过 `hadoop.kerberos.keytab` 指定 keytab 的文件所在目录。创建
   catalog 请参考配置 [Hive Catalog](../../../lakehouse/catalogs/hive-catalog.mdx#配置-catalog) 文档。

## 配置共享存储
Doris Operator 从 25.4.0 版本开始支持为多个组件的所有 Pod 挂载一个 `ReadWriteMany` 的共享存储。使用前请提前创建好共享存储 `PersistentVolume` 和 `PersistentVolumeClaim` 资源，在部署 Doris 集群之前按照如下配置 `DorisCluster` 资源：
```yaml
spec:
  sharedPersistentVolumeClaims:
  - mountPath: ${mountPath}
    persistentVolumeClaimName: ${sharedPVCName}
    supportComponents:
    - fe
    - be
```
- ${mountPath} 指定挂载到容器内的绝对路径。
- ${sharedPVCName} 表示被挂载的 `PersistentVolumeClaim` 的名称。
- `supportComponents` 指定需要挂载该共享存储的组件名称，上述实例中，指定 FE，BE 两种组件挂载该共享存储，如果 `supportComponents` 数组为空，表示所有组件部署的的组件都挂载该共享存储。

:::tip 提示
`mountPath` 支持使用 `${DORIS_HOME}` 作为路径前缀。当 `mountPath` 使用 `${DORIS_HOME}` 作为前缀使用时，在 FE 容器中 `${DORIS_HOME}` 指代 `/opt/apache-doris/fe`; 在 BE 容器中 `${DORIS_HOME}` 指代 `/opt/apache-doris/be`。
:::

## 配置探测超时
`DorisCluster` 为每种服务提供两种探测超时配置：启动探测超时配置，存活探测超时配置。当服务启动时间超过配置的启动探测超时时间时，则认定服务启动失败并重新启动服务。当服务超过存活探测时间没有响应时，Pod 会被自动重启。
### 启动探测超时配置
- FE 服务启动探测超时配置
    ```
    spec:
      feSpec:
        startTimeout: 3600
    ```
  以上配置将 FE 的启动超时设置为 3600 秒。
- BE 服务启动探测超时配置
    ```
    spec:
      beSpec:
        startTimeout: 3600
    ```
  以上配置将 BE 的启动超时设置为 3600 秒。
### 存活探测超时配置
- FE 服务存活探测超时配置
    ```
    spec:
      feSpec:
        liveTimeout: 60
    ```
  以上配置将 FE 的存活超时设置为 60 秒。
- BE 服务存活探测超时配置
    ```
    spec:
      beSpec:
        liveTimeout: 60
    ```
  以上配置将 BE 的存活超时设置为 60 秒。
