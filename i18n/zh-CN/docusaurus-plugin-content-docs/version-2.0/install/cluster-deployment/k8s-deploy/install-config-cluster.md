---
{
"title": "配置 Doris 集群",
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
## 配置数据及持久化存储

在 Doris 集群中，包括 FE、BE、CN 和监控组件在内的组件都需要将数据持久化到物理存储中。Kubernetes 提供了 [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) 的能力将数据持久化到物理存储中。在 Kubernetes 环境中，主要存在两种类型的 Persistent Volumes：

- 本地 PV 存储（Local Persistent Volumes）：本地 PV 是 Kubernetes 直接使用宿主机的本地磁盘目录来持久化存储容器的数据。本地 PV 提供更小的网络延迟，在使用 SSD 等高性能硬盘时，可以提供更好的读写能力。由于本地 PV 与宿主机绑定，在宿主机出现故障时，本地 PV 进行故障漂移。
- 网络 PV 存储（Network Persistent Volumes）：网络 PV 是通过网络访问的存储资源。网络 PV 可以被集群中的任一节点访问，在宿主机出现故障时，网络 PV 可以挂载到其他节点继续使用。

StorageClass 可以用于定义 PV 的类型和行为，通过 StorageClass 可以将磁盘资源与容器解耦，从而实现数据的持久性与可靠性。在 Doris Operator 中，在 Kubernetes 上部署 Doris，可以支持本地 PV 与网络 PV，可以根据业务需求进行选择。

:::caution 注意
建议在部署时将数据持久化到存储中。
如果部署时未配置 PersistentVolumeClaim，Doris Operator 默认会使用 emptyDir 模式来存储元数据、数据以及日志。当 pod 重启时，相关数据会丢失掉。
:::

### 持久化目录类型

在 Doris 中，建议持久化存储以下目录：

- FE 节点：doris-meta、log
- BE 节点：storage、log
- CN 节点：storage、log
- Broker 节点：log

在 Doris 中存在多种日志类型，如 INFO 日志、OUT 日志、GC 日志以及审计日志。Doris Operator 可以将日志同时输出到 console 与指定目录下。如果用户的 Kubernetes 有完整的日志收集能力，可以通过 console 输出来收集 Doris 的 INFO 日志。建议将 Doris 的所有日志通过 PVC 配置持久化到指定存储中，这将有助于问题的定位与排查。

### 数据持久化到网络 PV

Doris Operator 使用 Kubernetes 默认的 StorageClass 来支持 FE 与 BE 的存储。在 DorisCluster 的 CR 中，通修改 StorageClass 指定 `persistentVolumeClaimSpec.storageClassName`，可以配置指定的网络 PV。

```yaml
persistentVolumes:
    - mountPath: /opt/apache-doris/fe/doris-meta
      name: storage0
      persistentVolumeClaimSpec:
        # when use specific storageclass, the storageClassName should reConfig, example as annotation.
        storageClassName: ${your_storageclass}
        accessModes:
        - ReadWriteOnce
        resources:
          # notice: if the storage size less 5G, fe will not start normal.
          requests:
            storage: 100Gi
```
 
**FE 配置持久化存储**

在部署集群时，建议对 FE 中的 doris-meta 与 log 目录做持久化存储。doris-meta 用户存放元数据，一般在几百 MB 到几十 GB，建议预留 100GB。log 目录用来存放 FE 日志，一般建议预留 50GB。

下例中 FE 使用 StorageClass 挂载了元数据存储与日志存储：

```yaml
feSpec:
    persistentVolumes:
    - name: fe-meta
      mountPath: /opt/apache-doris/fe/doris-meta
      persistentVolumeClaimSpec:
        storageClassName: ${storageClassName}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 50Gi
    - name: fe-log            
      mountPath: /opt/apache-doris/fe/log
      persistentVolumeClaimSpec:
        storageClassName: ${storageClassName}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
```

其中，需要在 ${storageClassName} 指定 [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) 的名称。可以通过 以下命令查看当前 Kubernetes 集群内支持的 StorageClass：

```shell
kubectl get sc
```

返回结果如下：

```shell
NAME                          PROVISIONER                    RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
openebs-hostpath              openebs.io/local               Delete          WaitForFirstConsumer   false                  212d
openebs-device                openebs.io/local               Delete          WaitForFirstConsumer   false                  212d
openebs-jiva-csi-default      jiva.csi.openebs.io            Delete          Immediate              true                   212d
local-storage                 kubernetes.io/no-provisioner   Delete          WaitForFirstConsumer   false                  149d
microk8s-hostpath (default)   microk8s.io/hostpath           Delete          Immediate              false                  219d
doris-storage                 openebs.io/local               Delete          WaitForFirstConsumer   false                  54d
```

:::tip 提示
可以通过配置 [ConfigMap](#fe-configmap) 修改默认的元数据路径与日志路径：
1. fe-meta 的 mounthPath 配置需要与 ConfigMap 中的 meta_dir 变量配置路径一致，默认情况下元数据会写入  /opt/apache-doris/fe/doris-meta 目录下；
2. fe-log 的 mounthPath 配置需要与 ConfigMap 中的 LOG_DIR 变量路径一致，默认情况下日志数据会写入到 /opt/apache-doris/fe/log 目录下。
:::

**BE 配置持久化存储**

在部署集群时，建议对 BE 中的 storage 与 log 目录做持久化存储。storage 用户存放数据，需要根据业务数据量衡量。log 目录用来存放 FE 日志，一般建议预留 50GB。

下例中 BE 使用 StorageClass 挂载了数据存储与日志存储：

```yaml
beSpec:
  persistentVolumes:
  - mountPath: /opt/apache-doris/be/storage
    name: be-storage
    persistentVolumeClaimSpec:
      storageClassName: {storageClassName}
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 1Ti
  - mountPath: /opt/apache-doris/be/log
    name: belog
    persistentVolumeClaimSpec:
      storageClassName: {storageClassName}
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 100Gi
```

## 集群部署配置

### 集群名称

可以通过修改 DorisCluster Custom Resource 中的 metadata.name 来配置集群名称。

### 镜像版本

在部署 Doris 集群时，可以指定集群的版本。部署集群时应该保证集群中的各个组件版本一致。通过修改 `spec.{feSpec|beSpec}.image` 配置各个组件的版本。

### 集群拓扑

在部署 Doris 集群前，需要根据业务规划集群的拓扑结构。可以通过修改 spec.{feSpec|beSpec}.replicas 配置各个组件的节点数。基于生产节点的数据高可用原则，Doris Operator 规定集群中 Kubernetes 集群中至少有 3 个节点。同时，为了保证集群的可用性，建议至少部署 3 个 FE 与 BE 节点。

### 服务配置

Kubernetes 提供不同的 Serivce 方式暴露 Doris 的对外访问接口，如 `ClusterIP`、`NodePort`、`LoadBalancer` 等。

**ClusterIP**

ClusterIP 类型的 service 会在集群内部创建虚拟 IP。通过 ClusterIP 只能在 Kubernetes 集群内访问，对外不可见。在 Doris Custom Resource 中，默认使用 ClusterIP 类型的 Service。

**NodePort**

在没有 LoadBalancer 时，可以通过 NodePort 暴露。NodePort 是通过节点的 IP 和静态端口暴露服务。通过请求 `NodeIP + NodePort`，可以从集群的外部访问一个 NodePort 服务。

```yaml
...
feSpec:
  replicas: 3
  service:
    type: NodePort
...
beSpec:
  replicas: 3
  service:
    type: NodePort
...
```

## 集群参数配置

Doris 在 Kubernetes 使用 `ConfigMap` 实现配置文件和服务解耦。Doris 组件的所有节点在 Kubernetes 使用 ConfigMap 作为统一化配置管理，组件的所有节点都使用相同的配置信息启动。在 ConfigMap 中使用键值对的方式存储 Doris 的系统参数。在部署 doris 集群时，需要提前在相同 namespace 下部署 ConfigMap。

在 Doris Cluster 的 CR 中，提供 ConfigMapInfo 定义给各个组件挂载配置信息。ConfigMapInfo 包含两个变量：

- ConfigMapName 表示想要使用的 ConfigMap 的名称
- ResolveKey 表示对应的配置文件，FE 配置选择 fe.conf，BE 配置选择 be.conf

### FE ConfigMap

**定义 FE ConfigMap**

在使用 ConfigMap 定义 FE 配置时，需要先定义并下发 ConfigMap 到 Kubernetes 集群中。

下例中定义了名为 fe-conf 的 ConfigMap：

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

    # the output dir of stderr and stdout
    LOG_DIR = ${DORIS_HOME}/log

    JAVA_OPTS="-Djavax.security.auth.useSubjectCredsOnly=false -Xss4m -Xmx8192m -XX:+UseMembar -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xloggc:$DORIS_HOME/log/fe.gc.log.$CUR_DATE"

    # For jdk 9+, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_9="-Djavax.security.auth.useSubjectCredsOnly=false -Xss4m -Xmx8192m -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xlog:gc*:$DORIS_HOME/log/fe.gc.log.$CUR_DATE:time"

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
    enable_fqdn_mode = true
```

其中，在 metadata.name 中定义 FE ConfigMap 的名字，在 data 中定义 fe.conf 中的数据库配置。
自己配置的 `fe.conf` 一定要添加 `enable_fqdn_mode = true`

:::tip 提示
在 ConfigMap 中使用 data 字段存储键值对。在上述 FE ConfigMap 中：
- fe.conf 是键值对中的 key，使用 `|` 表示将保留后续字符串中的换行符和缩进
- 后续配置为键值对中的 value，与 fe.conf 文件中的配置相同
  在 data 字段中，由于使用了 `|` 符号保留后续字符串格式，后续的配置中需要保持两个空格缩进。
:::

在定义 FE ConfigMap 后，需要通过 `kubectl apply` 命令下发。

**使用 FE ConfigMap**

如果需要使用 FE ConfigMap，需要再 Doris Cluster 的 RC 中通过 spec.feSpec.configMapInfo 指定定义的 ConfigMap。

```yaml
kind: DorisCluster
metadata:
  name: doriscluster-sample-configmap
spec:
  feSpec:
    configMapInfo:
      configMapName: {feConfigMapName}
      resolveKey: fe.conf
...
```

将上例中的 ${feConfigMapName} 替换为 fe-conf 表示使用上例中定义的 FE ConfigMap。对于 FE ConfigMap，需要保持 resolveKey 字段固定为 `fe.conf`。

### BE ConfigMap

**定义 BE ConfigMap**

在使用 ConfigMap 定义 BE 配置时，需要先定义并下发 ConfigMap 到 Kubernetes 集群中。

下例中定义了名为 be-conf 的 ConfigMap：

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

    PPROF_TMPDIR="$DORIS_HOME/log/"

    JAVA_OPTS="-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Xloggc:$DORIS_HOME/log/be.gc.log.$CUR_DATE -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000 -DJDBC_MAX_WAIT_TIME=5000"

    # For jdk 9+, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_9="-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Xlog:gc:$DORIS_HOME/log/be.gc.log.$CUR_DATE -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000 -DJDBC_MAX_WAIT_TIME=5000"

    # since 1.2, the JAVA_HOME need to be set to run BE process.
    # JAVA_HOME=/path/to/jdk/

    # https://github.com/apache/doris/blob/master/docs/zh-CN/community/developer-guide/debug-tool.md#jemalloc-heap-profile
    # https://jemalloc.net/jemalloc.3.html
    JEMALLOC_CONF="percpu_arena:percpu,background_thread:true,metadata_thp:auto,muzzy_decay_ms:15000,dirty_decay_ms:15000,oversize_threshold:0,lg_tcache_max:20,prof:false,lg_prof_interval:32,lg_prof_sample:19,prof_gdump:false,prof_accum:false,prof_leak:false,prof_final:false"
    JEMALLOC_PROF_PRFIX=""

    # INFO, WARNING, ERROR, FATAL
    sys_log_level = INFO

    # ports for admin, web, heartbeat service
    be_port = 9060
    webserver_port = 8040
    heartbeat_service_port = 9050
    brpc_port = 8060
```

其中，在 metadata.name 中定义 BE ConfigMap 的名字，在 data 中定义 be.conf 中的数据库配置。

:::tip 提示
在 ConfigMap 中使用 data 字段存储键值对。在上述 BE ConfigMap 中：
- be.conf 是键值对中的 key，使用 `|` 表示将保留后续字符串中的换行符和缩进
- 后续配置为键值对中的 value，与 be.conf 文件中的配置相同
  在 data 字段中，由于使用了 `|` 符号保留后续字符串格式，后续的配置中需要保持两个空格缩进。
:::

在定义 BE ConfigMap 后，需要通过 `kubectl apply` 命令下发。

**使用 BE ConfigMap**

如果需要使用 BE ConfigMap，需要再 Doris Cluster 的 RC 中通过 spec.beSpec.configMapInfo 指定定义的 ConfigMap。

```yaml
kind: DorisCluster
metadata:
  name: doriscluster-sample-configmap
spec:
  beSpec:
    configMapInfo:
      configMapName: {beConfigMapName}
      resolveKey: be.conf
...
```

将上例中的 ${beConfigMapName} 替换为 be-conf 表示使用上例中定义的 BE ConfigMap。对于 BE ConfigMap，需要保持 resolveKey 字段固定为 `be.conf`。

### 为 conf 目录添加外部配置文件

在使用 Catalog 功能访问外部数据源时，需要将相关配置文件添加到 Doris 节点的 conf 目录下，如在访问 hive catalog 时，需要将 core-site.xml，hdfs-site.xml 与 hive-site.xml 文件放到 FE 与 BE 的 conf 目录。

在 Kubernetes 环境中，需要将 catalog 的相关配置文件，以 ConfigMap 的形式加载到 Doris 中。下例展示了将 core-site.xml 文件加载到 BE：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: be-configmap
  labels:
    app.kubernetes.io/component: be
data:
  be.conf: |
    be_port = 9060
    webserver_port = 8040
    heartbeat_service_port = 9050
    brpc_port = 8060
  core-site.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
    <configuration>
      <property>
      <name>hadoop.security.authentication</name>
        <value>kerberos</value>
      </property>
    </configuration>
    ...
```

其中，在 data 字段中存储了配置的键值对，在上例中存储了 key 分别为 be.conf 与 core-site.xml 的键值对。

在 data 字段中，需要满足以下的键值结构映射：

```yaml
data:
 filename_1: |
   config_string
 filename_2: |
   config_string
 filename_3: |
   config_string
```

### 为 BE 配置多盘存储

Doris 支持为 BE 挂载多块 PV。通过配置 BE 参数 `storage_root_path` 可以指定 BE 使用多盘存储。在 Kubernetes 环境中，可以在 DorisCluster CR 中对 pv 进行映射，通过 ConfigMap 为 BE 配置 `storage_root_path` 参数。

**为 BE 多盘存储配置 pv 映射**

在 DorisCluster CR 文件中，相比于单盘配置，需要添加 `configMapInfo` 与 `persistentVolumeClaimSpec` 的描述：

- 通过 `configMapInfo` 配置可以标识使用相同 namespace 下的指定 ConfigMap，resolveKey 固定为 be.conf
- 通过 `persistentVolumeClaimSpec` 可以为 BE 存储目录配置多个 pv 映射

下例中为 BE 配置了两块盘的 pv  映射：

```yaml
...
  beSpec:
    replicas: 3
    image: selectdb/doris.be-ubuntu:2.0.2
    limits:
      cpu: 8
      memory: 16Gi
    requests:
      cpu: 8
      memory: 16Gi
    configMapInfo:
      configMapName: be-configmap
      resolveKey: be.conf
    persistentVolumes:
    - mountPath: /opt/apache-doris/be/storage1
      name: storage2
      persistentVolumeClaimSpec:
        # when use specific storageclass, the storageClassName should reConfig, example as annotation.
        #storageClassName: openebs-jiva-csi-default
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
    - mountPath: /opt/apache-doris/be/storage2
      name: storage3
      persistentVolumeClaimSpec:
        # when use specific storageclass, the storageClassName should reConfig, example as annotation.
        #storageClassName: openebs-jiva-csi-default
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
    - mountPath: /opt/apache-doris/be/log
      name: storage4
      persistentVolumeClaimSpec:
        # when use specific storageclass, the storageClassName should reConfig, example as annotation.
        #storageClassName: openebs-jiva-csi-default
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
```

在上例中 Doris 集群指定了多盘存储

- beSpec.persistentVolumes 以数组的方式指定了多块 pv，映射了 `/opt/apache-doris/be/storage{1,2}` 两个数据存储 pv
- beSpec.configMapInfo 中指定了需要挂载名为 `be-configmap` 的 ConfigMap

**配置 BE ConfigMap 指定 storage_root_path 参数**

根据 DorisCluster CR 中指定的 BE ConfigMap 名，需要创建相应的 ConfigMap 并指定 storage_root_path 参数。

下例中在名为 `be-configmap` 的 ConfigMap 中指定了 `storage_root_path` 参数使用两块盘：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: be-configmap
  labels:
    app.kubernetes.io/component: be
data:
  be.conf: |
    CUR_DATE=`date +%Y%m%d-%H%M%S`

    PPROF_TMPDIR="$DORIS_HOME/log/"

    JAVA_OPTS="-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Xloggc:$DORIS_HOME/log/be.gc.log.$CUR_DATE -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000 -DJDBC_MAX_WAIT_TIME=5000"

    # For jdk 9+, this JAVA_OPTS will be used as default JVM options
    JAVA_OPTS_FOR_JDK_9="-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Xlog:gc:$DORIS_HOME/log/be.gc.log.$CUR_DATE -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000 -DJDBC_MAX_WAIT_TIME=5000"

    # since 1.2, the JAVA_HOME need to be set to run BE process.
    # JAVA_HOME=/path/to/jdk/

    # https://github.com/apache/doris/blob/master/docs/zh-CN/community/developer-guide/debug-tool.md#jemalloc-heap-profile
    # https://jemalloc.net/jemalloc.3.html
    JEMALLOC_CONF="percpu_arena:percpu,background_thread:true,metadata_thp:auto,muzzy_decay_ms:15000,dirty_decay_ms:15000,oversize_threshold:0,lg_tcache_max:20,prof:false,lg_prof_interval:32,lg_prof_sample:19,prof_gdump:false,prof_accum:false,prof_leak:false,prof_final:false"
    JEMALLOC_PROF_PRFIX=""

    # INFO, WARNING, ERROR, FATAL
    sys_log_level = INFO

    # ports for admin, web, heartbeat service
    be_port = 9060
    webserver_port = 8040
    heartbeat_service_port = 9050
    brpc_port = 8060
    
    storage_root_path = /opt/apache-doris/be/storage,medium:ssd;/opt/apache-doris/be/storage1,medium:ssd
```

:::caution 注意
在创建 BE ConfigMap 时，需要注意以下事项：
1. metadata.name 需要与 DorisCluster CR 中 beSpec.configMapInfo.configMapName 相同，表示该集群使用指定的 ConfigMap；
2. ConfigMap 中的 storage_root_path 参数要与 DorisCluster CR 中的 persistentVolume 数据盘一一对应。
:::