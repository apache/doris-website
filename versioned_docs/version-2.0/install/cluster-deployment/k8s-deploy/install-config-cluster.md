---
{
"title": "Configuring Doris Cluster",
"language": "en"
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

## Configuration data and persistent storage

In a Doris cluster, components including FE, BE, CN, and monitoring components all need to persist data to physical storage. Kubernetes provides [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) the ability to persist data to physical storage. In a Kubernetes environment, there are two main types of Persistent Volumes:

- Local PV storage (Local Persistent Volumes): Local PV is where Kubernetes directly uses the local disk directory of the host to persistently store container data. Local PV provides smaller network latency and can provide better read and write capabilities when using high-performance hard drives such as SSDs. Since the local PV is bound to the host, when the host fails, the local PV undergoes fault drift.
- Network PV storage (Network Persistent Volumes): Network PV is a storage resource accessed through the network. The network PV can be accessed by any node in the cluster. When the host fails, the network PV can be mounted to other nodes and continued to be used.

StorageClass can be used to define the type and behavior of PV. StorageClass can decouple disk resources from containers to achieve data persistence and reliability. In Doris Operator, deploying Doris on Kubernetes can support local PV and network PV, and you can choose according to business needs.

:::caution Warning
It is recommended to persist data to storage at deployment time.
If PersistentVolumeClaim is not configured during deployment, Doris Operator will use emptyDir mode by default to store metadata, data, and logs. When the pod is restarted, related data will be lost.
:::

### Persistence directory type

In Doris, the following directories are recommended for persistent storage:

- FE node: doris-meta, log
- BE node: storage, log
- CN node: storage, log
- Broker node: log

There are multiple log types in Doris, such as INFO log, OUT log, GC log and audit log. Doris Operator can output logs to the console and the specified directory at the same time. If the user's Kubernetes has complete log collection capabilities, Doris' INFO logs can be collected through console output. It is recommended that all Doris logs be persisted to the designated storage through PVC configuration, which will help locate and troubleshoot problems.

### Data persistence to network PV

Doris Operator uses Kubernetes' default StorageClass to support FE and BE storage. In the CR of DorisCluster, the specified network PV can be configured by modifying the StorageClass to specify `persistentVolumeClaimSpec.storageClassName`.

```yaml
persistentVolumes:
     - mountPath: /opt/apache-doris/fe/doris-meta
       name: storage0
       persistentVolumeClaimSpec:
         # When use specific storageclass, the storageClassName should reConfig, example as annotation.
         storageClassName: ${your_storageclass}
         accessModes:
         - ReadWriteOnce
         resources:
           # notice: if the storage size is less than 5G, fe will not start normal.
           requests:
             storage: 100Gi
```

**FE configuration persistent storage**

When deploying a cluster, it is recommended to provide persistent storage for the doris-meta and log directories in FE. Doris-meta users store metadata, usually from a few hundred MB to dozens of GB. It is recommended to reserve 100GB. The log directory is used to store FE logs. It is generally recommended to reserve 50GB.

In the following example, FE uses StorageClass to mount metadata storage and log storage:

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
             Storage: 50Gi
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

Among them, the name of [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) needs to be specified in ${storageClassName}. You can use the following command to view the StorageClass supported in the current Kubernetes cluster:

```shell
kubectl get sc
```

The return result is as follows:

```shell
NAME                          PROVISIONER                    RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
openebs-hostpath              openebs.io/local               Delete          WaitForFirstConsumer   false                  212d
openebs-device                openebs.io/local               Delete          WaitForFirstConsumer   false                  212d
openebs-jiva-csi-default      jiva.csi.openebs.io            Delete          Immediate              true                   212d
local-storage                 kubernetes.io/no-provisioner   Delete          WaitForFirstConsumer   false                  149d
microk8s-hostpath (default)   microk8s.io/hostpath           Delete          Immediate              false                  219d
doris-storage                 openebs.io/local               Delete          WaitForFirstConsumer   false                  54d
```
:::tip Tip
The default metadata path and log path can be modified by configuring [ConfigMap](#fe-configmap):
1. The mounthPath configuration of fe-meta needs to be consistent with the meta_dir variable configuration path in ConfigMap. By default, metadata will be written to the /opt/apache-doris/fe/doris-meta directory;
2. The mounthPath configuration of fe-log needs to be consistent with the LOG_DIR variable path in ConfigMap. By default, log data will be written to the /opt/apache-doris/fe/log directory.
:::

**BE configuration persistent storage**

When deploying a cluster, it is recommended that the storage and log directories in BE be used for persistent storage. Storage users store data, which needs to be measured based on the amount of business data. The log directory is used to store FE logs. It is generally recommended to reserve 50GB.

In the following example, BE uses StorageClass to mount the data storage and log storage:

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
           Storage: 1Ti
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

## Cluster deployment configuration

### Cluster name

The cluster name can be configured by modifying metadata.name in DorisCluster Custom Resource.

### Mirror version

When deploying a Doris cluster, you can specify the cluster version. When deploying a cluster, you should ensure that the versions of each component in the cluster are consistent. Configure the version of each component by modifying `spec.{feSpec|beSpec}.image`.

### Cluster topology

Before deploying a Doris cluster, you need to plan the topology of the cluster based on your business. The number of nodes of each component can be configured by modifying spec.{feSpec|beSpec}.replicas. Based on the principle of high data availability of production nodes, Doris Operator stipulates that there are at least 3 nodes in the Kubernetes cluster in the cluster. At the same time, in order to ensure the availability of the cluster, it is recommended to deploy at least 3 FE and BE nodes.

### Service configuration

Kubernetes provides different Serivce methods to expose Doris's external access interface, such as `ClusterIP`, `NodePort`, `LoadBalancer`, etc.

**ClusterIP**

A service of type ClusterIP will create a virtual IP inside the cluster. It can only be accessed within the Kubernetes cluster through ClusterIP and is not visible to the outside world. In Doris Custom Resource, the ClusterIP type Service is used by default.

**NodePort**

Can be exposed via NodePort when LoadBalancer is not available. NodePort exposes services through the node's IP and static port. A NodePort service can be accessed from outside the cluster by requesting `NodeIP + NodePort`.

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

## Cluster parameter configuration

Doris uses `ConfigMap` in Kubernetes to decouple configuration files and services. All nodes of the Doris component use ConfigMap as unified configuration management in Kubernetes, and all nodes of the component are started with the same configuration information. Doris' system parameters are stored in ConfigMap using key-value pairs. When deploying a doris cluster, you need to deploy ConfigMap under the same namespace in advance.

In the CR of Doris Cluster, provide ConfigMapInfo definitions to mount configuration information for each component. ConfigMapInfo contains two variables:

- ConfigMapName represents the name of the ConfigMap you want to use
- ResolveKey represents the corresponding configuration file, select fe.conf for FE configuration, and be.conf for BE configuration.

### FE ConfigMap

**Definition FE ConfigMap**

When using ConfigMap to define FE configuration, you need to first define and deliver ConfigMap to the Kubernetes cluster.

The following example defines a ConfigMap named fe-conf:

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

Among them, the name of FE ConfigMap is defined in metadata.name, and the database configuration in fe.conf is defined in data.
Be sure to add `enable_fqdn_mode = true` to your self-configured `fe.conf`

:::tip Tip
Use the data field in ConfigMap to store key-value pairs. In the above FE ConfigMap:
- fe.conf is the key in the key-value pair, using `|` means that newlines and indents in subsequent strings will be preserved
- Subsequent configuration is the value in the key-value pair, which is the same as the configuration in the fe.conf file
  In the data field, due to the use of the `|` symbol to retain the subsequent string format, two spaces need to be maintained in subsequent configurations.
:::

After defining the FE ConfigMap, you need to issue it through the `kubectl apply` command.

**Using FE ConfigMap**

If you need to use FE ConfigMap, you need to specify the defined ConfigMap through spec.feSpec.configMapInfo in the RC of Doris Cluster.

```yaml
Kind: DorisCluster
metadata:
   name: doriscluster-sample-configmap
spec:
   feSpec:
     configMapInfo:
       configMapName: {feConfigMapName}
       resolveKey: fe.conf
...
```

Replace ${feConfigMapName} with fe-conf in the above example to use the FE ConfigMap defined in the above example. For FE ConfigMap, you need to keep the resolveKey field fixed to `fe.conf`.

### BE ConfigMap

**Definition BE ConfigMap**

When using ConfigMap to define BE configuration, you need to first define and deliver ConfigMap to the Kubernetes cluster.

The following example defines a ConfigMap named be-conf:

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
     JAVA_OPTS_FOR_JDK_9="-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Xlog:gc:$DORIS_HOME/log/be.gc.log.$CUR_DATE -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.java.command =DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000 -DJDBC_MAX_WAIT_TIME=5000"

     # since 1.2, the JAVA_HOME need to be set to run BE process.
     # JAVA_HOME=/path/to/jdk/

     # https://github.com/apache/doris/blob/master/docs/zh-CN/community/developer-guide/debug-tool.md#jemalloc-heap-profile
     # https://jemalloc.net/jemalloc.3.html
     JEMALLOC_CONF="percpu_arena:percpu,background_thread:true,metadata_thp:auto,muzzy_decay_ms:15000,dirty_decay_ms:15000,oversize_threshold:0,lg_tcache_max:20,prof:false,lg_prof_interval:32,lg_prof_sample:19,prof_gd ump:false,prof_accum:false ,prof_leak:false,prof_final:false"
     JEMALLOC_PROF_PRFIX=""

     # INFO, WARNING, ERROR, FATAL
     sys_log_level = INFO

     # ports for admin, web, heartbeat service
     be_port = 9060
     webserver_port = 8040
     heartbeat_service_port = 9050
     brpc_port = 8060
```

Among them, the name of BE ConfigMap is defined in metadata.name, and the database configuration in be.conf is defined in data.

:::tip Tip
Use the data field in ConfigMap to store key-value pairs. In the above BE ConfigMap:
- be.conf is the key in the key-value pair, using `|` means that newlines and indents in subsequent strings will be retained
- Subsequent configuration is the value in the key-value pair, which is the same as the configuration in the be.conf file
  In the data field, due to the use of the `|` symbol to retain the subsequent string format, two spaces need to be maintained in subsequent configurations.
:::

After defining BE ConfigMap, you need to issue it through the `kubectl apply` command.

**Using BE ConfigMap**

If you need to use BE ConfigMap, you need to specify the defined ConfigMap through spec.beSpec.configMapInfo in the RC of Doris Cluster.

```yaml
Kind: DorisCluster
metadata:
   name: doriscluster-sample-configmap
spec:
   beSpec:
     configMapInfo:
       configMapName: {beConfigMapName}
       resolveKey: be.conf
...
```

Replace ${beConfigMapName} with be-conf in the above example to use the BE ConfigMap defined in the above example. For BE ConfigMap, you need to keep the resolveKey field fixed to `be.conf`.

### Add external configuration files to the conf directory

When using the Catalog function to access external data sources, you need to add the relevant configuration files to the conf directory of the Doris node. For example, when accessing the hive catalog, you need to add core-site.xml, hdfs-site.xml and hive-site.xml The files are placed in the conf directories of FE and BE.

In the Kubernetes environment, the relevant configuration files of the catalog need to be loaded into Doris in the form of ConfigMap. The following example shows loading the core-site.xml file into BE:

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

Among them, the configured key-value pairs are stored in the data field. In the above example, the key-value pairs whose keys are be.conf and core-site.xml are stored.

In the data field, the following key-value structure mapping needs to be satisfied:

```yaml
data:
  filename_1: |
    config_string
  filename_2: |
    config_string
  filename_3: |
    config_string
```

### Configure multi-disk storage for BE

Doris supports mounting multiple PVs for BE. By configuring the BE parameter `storage_root_path`, you can specify BE to use multi-disk storage. In the Kubernetes environment, you can map pv in DorisCluster CR and configure the `storage_root_path` parameter for BE through ConfigMap.

**Configure pv mapping for BE multi-disk storage**

In the DorisCluster CR file, compared to the single-disk configuration, you need to add the descriptions of `configMapInfo` and `persistentVolumeClaimSpec`:

- The specified ConfigMap under the same namespace can be identified through `configMapInfo` configuration, and the resolveKey is fixed to be.conf
- Multiple pv mappings can be configured for the BE storage directory through `persistentVolumeClaimSpec`

In the following example, the pv mapping of two disks is configured for BE:

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
In the above example, the Doris cluster specifies multi-disk storage

- beSpec.persistentVolumes specifies multiple pvs in an array, mapping two data storage pvs in `/opt/apache-doris/be/storage{1,2}`
- beSpec.configMapInfo specifies that the ConfigMap named `be-configmap` needs to be mounted

**Configure BE ConfigMap to specify the storage_root_path parameter**

According to the BE ConfigMap name specified in DorisCluster CR, you need to create the corresponding ConfigMap and specify the storage_root_path parameter.

In the following example, the `storage_root_path` parameter is specified in the ConfigMap named `be-configmap` to use two disks:

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
     JAVA_OPTS_FOR_JDK_9="-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Xlog:gc:$DORIS_HOME/log/be.gc.log.$CUR_DATE -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.java.command =DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000 -DJDBC_MAX_WAIT_TIME=5000"

     # since 1.2, the JAVA_HOME need to be set to run BE process.
     # JAVA_HOME=/path/to/jdk/

     # https://github.com/apache/doris/blob/master/docs/zh-CN/community/developer-guide/debug-tool.md#jemalloc-heap-profile
     # https://jemalloc.net/jemalloc.3.html
     JEMALLOC_CONF="percpu_arena:percpu,background_thread:true,metadata_thp:auto,muzzy_decay_ms:15000,dirty_decay_ms:15000,oversize_threshold:0,lg_tcache_max:20,prof:false,lg_prof_interval:32,lg_prof_sample:19,prof_gd ump:false,prof_accum:false ,prof_leak:false,prof_final:false"
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

:::caution Warning
When creating a BE ConfigMap, you need to pay attention to the following:
1. metadata.name needs to be the same as beSpec.configMapInfo.configMapName in DorisCluster CR, indicating that the cluster uses the specified ConfigMap;
2. The storage_root_path parameter in ConfigMap must correspond one-to-one with the persistentVolume data disk in DorisCluster CR.
:::