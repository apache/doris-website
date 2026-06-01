---
{
    "title": "02 Configure the Doris Cluster",
    "language": "en",
    "description": "DorisCluster resource configuration guide: image settings, replica planning, compute resource allocation, persistent storage configuration, ConfigMap customization, Service access modes, and username/password management.",
    "keywords": ["DorisCluster", "resource configuration", "replicas", "ConfigMap", "persistent storage", "NodePort", "LoadBalancer", "ClusterIP", "access configuration", "integrated storage and compute"]
}
---

## Cluster Planning

In the default `DorisCluster` resource, the FE and BE images may not be the latest versions, and both default to 3 replicas. By default, FE uses 6c 12Gi compute resources and BE uses 8c 16Gi. The following sections describe how to adjust these defaults to match your needs.

### Image Settings

Doris Operator is decoupled from Doris versions. Doris Operator supports deployment of Doris versions 2.0 and later.

**FE Image Settings**

To specify the FE image, configure it as follows:

```yaml
spec:
  feSpec:
    image: ${image}
```

Replace `${image}` with the image name to deploy, then update the configuration in the [DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template) to be deployed. The official [FE Image](https://hub.docker.com/r/apache/doris/tags?name=fe) provided by Doris is available for use.

**BE Image Settings**

To specify the BE image, configure it as follows:

```yaml
spec:
  beSpec:
    image: ${image}
```

Replace `${image}` with the image name to deploy, then update the configuration in the [DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template) to be deployed. The official [BE Image](https://hub.docker.com/r/apache/doris/tags?name=be) provided by Doris is available for use.

### Replica Settings

**Modify FE Replicas**

To change the default FE replica count from 3 to 5, configure it as follows:

```yaml
spec:
  feSpec:
    replicas: 5
```

Update the configuration in the [DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template) to be deployed.

**Modify BE Replicas**

To change the default BE replica count from 3 to 5, configure it as follows:

```yaml
spec:
  beSpec:
    replicas: 5
```

Update the configuration in the [DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template) to be deployed.

### Compute Resource Settings

**FE Compute Resource Settings**

The default FE compute resource is 6c 12Gi. To change it to 8c 16Gi, configure it as follows:

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

Update the configuration in the [DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template) to be deployed.

**BE Compute Resource Settings**

The default BE compute resource is 8c 16Gi. To change it to 16c 32Gi, configure it as follows:

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

Update the configuration in the [DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template) to be deployed.

:::tip Tip
The minimum startup resource required for FE and BE is 4c 8Gi. For normal capability testing, 8c 8Gi is recommended.
:::

## Customized Startup Configuration

In Kubernetes, Doris uses `ConfigMap` to separate configuration files from services. By default, services use the default configuration in the image as startup parameters. According to the [FE configuration document](../../../admin-manual/config/fe-config) and the [BE configuration document](../../../admin-manual/config/be-config), prepare the customized startup parameters in a specific `ConfigMap` in advance. Once configured, deploy it to the namespace where the target [`DorisCluster` resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template) is located.

### FE Customized Startup Configuration

#### Step 1: Configure and Deploy the ConfigMap

The following example defines a ConfigMap named `fe-conf` that can be used by Doris FE:

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
    sys_log_level = INFO
    # NORMAL, BRIEF, ASYNC
    sys_log_mode = ASYNC
    # audit_log_dir = $LOG_DIR
    # audit_log_modules = slow_query, query
    # audit_log_roll_num = 10
    # meta_delay_toleration_second = 10
    # qe_max_connection = 1024
    # qe_query_timeout_second = 300
    # qe_slow_log_ms = 5000
    enable_fqdn_mode = true
```

When using a ConfigMap to mount FE startup configuration, the key for the configuration must be `fe.conf`. After preparing the configuration file, deploy it to the namespace where the `DorisCluster` resource will be deployed using the following command.

```shell
kubectl -n ${namespace} apply -f ${feConfigMapFile}.yaml
```

Here, `${namespace}` is the namespace where the target `DorisCluster` resource will be deployed, and ${feConfigMapFile} is the file name that contains the configuration above.

#### Step 2: Configure the DorisCluster Resource

Taking the ConfigMap corresponding to fe-conf as an example, add the following information to the [deployed `DorisCluster` resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template):

```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: fe-conf
      resolveKey: fe.conf
```

:::tip Tip
For Kubernetes deployments, FQDN mode is recommended. Add enable_fqdn_mode=true to the startup configuration. If you want to use IP mode and the Kubernetes cluster can guarantee that the pod IP does not change after restart, refer to issue [#138](https://github.com/apache/doris-operator/issues/138) to configure IP mode startup.
:::

### BE Customized Startup Configuration

#### Step 1: Configure and Deploy the ConfigMap

The following defines a ConfigMap named `be-conf` that can be used by Doris BE:

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
    # https://doris.apache.org/community/developer-guide/debug-tool#jemalloc-heap-profile
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

When using a ConfigMap to mount BE startup configuration, the key for the configuration must be `be.conf`. After preparing the configuration file, deploy it to the namespace where the target `DorisCluster` resource will be deployed.

```shell
kubectl -n ${namespace} apply -f ${beConfigMapFile}.yaml
```

Here, `${namespace}` is the namespace where the `DorisCluster` resource will be deployed, and ${beConfigMapFile} is the file name that contains the configuration above.

#### Step 2: Configure the DorisCluster Resource

Taking the ConfigMap corresponding to be-conf as an example, add the following information to the [deployed `DorisCluster` resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template):

```yaml
spec:
  beSpec:
    configMapInfo:
      configMapName: be-conf
      resolveKey: be.conf
```

:::tip Tip
To mount a file in the same directory as the startup configuration, place the configuration in the same ConfigMap that holds the startup configuration. The key in the ConfigMap is the file name, and the value is the configuration content.
:::

### Mounting Multiple ConfigMaps

In addition to supporting mounting configuration files via ConfigMap, Doris Operator also provides the ability to mount multiple ConfigMaps to different directories in the container.

**FE Mounting Multiple ConfigMaps**

The following example shows how to mount the ConfigMaps `test-fe1` and `test-fe2` to the FE container directories `/etc/fe/config1/` and `/etc/fe/config2`, respectively:

```yaml
spec:
  feSpec:
    configMaps:
    - configMapName: test-fe1
      mountPath: /etc/fe/config1
    - configMapName: test-fe2
      mountPath: /etc/fe/config2
```

In the configuration above, ${your_storageclass} is the name of the [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) you want to use, and ${storageSize} is the storage size you want to use. The format of ${storageSize} follows the K8s [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), for example: 100Gi. Replace them as needed.

**BE Mounting Multiple ConfigMaps**

The following example shows how to mount the ConfigMaps test-be1 and test-be2 to the BE container directories `/etc/be/config1/` and `/etc/be/config2`, respectively:

```yaml
spec:
  beSpec:
    configMaps:
    - configMapName: test-be1
      mountPath: /etc/be/config1
    - configMapName: test-be2
      mountPath: /etc/be/config2
```

In the configuration above, ${your_storageclass} is the name of the [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) you want to use, and ${storageSize} is the storage size you want to use. The format of ${storageSize} follows the K8s [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), for example: 100Gi. Replace them as needed.

## Configure Persistent Storage

In a Doris cluster, the FE and BE components need to persist data. Kubernetes provides the [Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) mechanism to persist data to physical storage. In the Kubernetes environment, Doris Operator uses [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) to automatically create a PersistentVolumeClaim that binds to a suitable PersistentVolume.

### FE Persistent Storage Configuration

When deploying a Doris cluster on Kubernetes, it is recommended to persist the `/opt/apache-doris/fe/doris-meta` mount point by default, since this path is the default storage path for FE metadata. Doris outputs all log information to standard output (console) by default. If the cluster lacks log collection capability, it is recommended to persist the /opt/apache-doris/fe/log mount point to enable log persistence.

#### FE Metadata Persistence

When using the default configuration file, add the following content to the [deployed DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template):

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

In the configuration above, ${your_storageclass} is the name of the specified [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/), and ${storageSize} is the specified storage size. The format follows the Kubernetes [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), for example: 100Gi.

#### FE Log Persistence

When using the default configuration file, add the following content to the [DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template) to be deployed:

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

In the configuration above, ${your_storageclass} is the name of the [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) you want to use, and ${storageSize} is the storage size you want to use. The format of ${storageSize} follows the Kubernetes [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), for example: 100Gi.

:::tip Tip
If `meta_dir` or `LOG_DIR` is reset in the [customized configuration file](#fe-customized-startup-configuration), reset `mountPath` accordingly.
:::

### BE Persistent Storage Configuration

When deploying a Doris cluster on Kubernetes, it is recommended to persist the `/opt/apache-doris/be/storage` mount point, since this path is the default data storage path for BE nodes. When deployed in Kubernetes, Doris outputs all log information to standard output (console) by default. If the cluster lacks log collection capability, it is recommended to persist the `/opt/apache-doris/be/log` mount point.

#### BE Data Persistence

- Default persistent storage path

  If BE uses the default configuration, add the following content to the [deployed DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template):
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

  In the configuration above, ${your_storageclass} is the name of the [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) you want to use, and ${storageSize} is the storage size you want to use. The format follows the Kubernetes [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), for example: 100Gi.

- Multi-storage-path persistence

  If multiple storage directories are specified via `storage_root_path` in the customized configuration (for example, `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD`), add the following configuration to the deployed [DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template):

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
  
#### BE Log Persistence

When using the default configuration file, add the following content to the [DorisCluster resource](install-doris-cluster.md#step-2-install-the-customized-deployment-template) to be deployed:

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

In the configuration above, ${your_storageclass} is the name of the [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) you want to use, and ${storageSize} is the storage size you want to use. The format follows the Kubernetes [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), for example: 100Gi.

## Access Configuration

Kubernetes uses Service to provide vip and load balancing capability. A Service has three external exposure modes: `ClusterIP`, `NodePort`, and `LoadBalancer`.

### ClusterIP

By default, Doris on Kubernetes uses the [ClusterIP access mode](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip). The ClusterIP access mode provides an internal address inside the Kubernetes cluster, which serves as the access address for the service within Kubernetes.

#### Step 1: Configure ClusterIP as the Service Type

  Doris enables the ClusterIP access mode on Kubernetes by default. You can use this mode without any extra modification.

#### Step 2: Get the Service Access Address

After deploying the cluster, run the following command to view the services exposed by Doris Operator:

```shell
kubectl -n doris get svc
```

The result is as follows:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

In the result above, FE and BE each have two types of Services, suffixed with internal and service respectively:

Services with the internal suffix are used only for internal communication inside Doris, such as heartbeats and data exchange, and are not exposed externally.

Services with the service suffix are used to access cluster services.

#### Step 3: Access Doris Inside a Container

Use the following command to create a Pod containing the MySQL client in the current Kubernetes cluster:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

Inside the container, you can connect to the Doris cluster by accessing the Service name with the `service` suffix:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

### NodePort

To access Doris from outside the Kubernetes cluster, you can choose [NodePort mode](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). NodePort mode provides two configuration methods: static host port mapping and dynamic host port allocation.

- **Dynamic host port allocation**: If port mapping is not explicitly set, Kubernetes automatically allocates an unused port on the host (default range 30000-32767) when creating the pod.

- **Static host port allocation**: If port mapping is explicitly specified, Kubernetes allocates that fixed port when the host port is unused and there is no conflict.

Static allocation requires planning the port mapping. Doris provides the following ports for external interaction:

| Port Name | Default Port | Port Description                     |
|------| ---- |--------------------------|
| Query Port | 9030 | Used to access the Doris cluster via the MySQL protocol |
| HTTP Port | 8030 | The http server port on FE, used to view FE information |
| Web Server Port | 8040 | The http server port on BE, used to view BE information |


#### Step 1: Configure NodePort for FE and BE

**FE NodePort**

- Dynamic allocation configuration:

  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
  ```

- Static allocation configuration example:

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

- Dynamic allocation configuration:

  ```yaml
  spec:
    beSpec:
      service:
        type: NodePort
  ```

- Static allocation configuration example:

  ```yaml
  beSpec:
    service:
      type: NodePort
      servicePorts:
      - nodePort: 31006
        targetPort: 8040
  ```

#### Step 2: Get the Service

After the cluster is deployed, run the following command to view the `Service`:

```shell
kubectl get service
```

The result is as follows:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### Step 3: Access the Service Using NodePort

Take MySQL connection as an example. The default Doris Query Port is 9030. In the example above, port 9030 is mapped to local port 31545. To access the Doris cluster, you need to obtain the IP address of a cluster node. Run the following command to view it:

```shell
kubectl get nodes -owide
```

The result is as follows:

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

In NodePort mode, you can access services inside the Kubernetes cluster through the IP address of any node and the mapped host port. In this example, the available node IPs include 192.168.88.61, 192.168.88.62, and 192.168.88.63. The following example shows how to use node 192.168.88.62 and the host port 31545 mapped from the `query port` to connect to Doris:

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

### LoadBalancer

[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) is a load balancer provided by the cloud service provider. This configuration applies only to Kubernetes environments provided by cloud platforms.

#### Step 1: Configure LoadBalancer Mode

**FE LoadBalancer Configuration**

```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
```

**BE LoadBalancer Configuration**

  ```yaml
  spec:
    beSpec:
      service:
        type: LoadBalancer
  ```

#### Step 2: Get the Service

After deploying the cluster, run the following command to view the `Service` that can access `Doris`:

```shell
kubectl get service
```

The result is as follows:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

#### Step 3: Access in LoadBalancer Mode

Take MySQL connection as an example:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## Configure Admin Username and Password

Doris node management requires connecting to a live FE node via the MySQL protocol with a username and password. Doris implements an [RBAC-like permission management mechanism](../../../admin-manual/auth/authentication-and-authorization). Node management requires the user to have [Node_priv](../../../admin-manual/auth/authentication-and-authorization#permission-types) privilege. By default, Doris Operator deploys and manages the cluster configured by the DorisCluster resource using the root user with all privileges and no password. After a password is set for the root user, you must explicitly configure a username and password with Node_Priv privilege in the DorisCluster resource so that Doris Operator can perform automated management on the cluster.

The DorisCluster resource provides two ways to configure the username and password used to manage cluster nodes: configuration via environment variables, and configuration via [Secret](https://kubernetes.io/docs/concepts/configuration/secret/). There are 3 scenarios for configuring the cluster admin username and password:

- Initialize the root user password during cluster deployment.

- In a passwordless root deployment, automatically set up a non-root user with admin privileges.

- After a passwordless root cluster is deployed, set a password for the root user.

### Configure the Root User Password During Cluster Deployment

Doris supports configuring the root user password in encrypted form in `fe.conf`. Configure the root user password when Doris is first deployed so that Doris Operator can automatically manage cluster nodes. Follow these steps:

#### Step 1: Build the Encrypted Root Password

Doris supports setting the root user password in encrypted form in the [FE configuration file](../../../admin-manual/config/fe-config#initial_root_password). The password is encrypted with two-stage SHA-1 encryption. Code examples are as follows:

Java code implementation:

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

Golang code implementation:

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

Place the encrypted password in `fe.conf` as required by the configuration file. According to the [cluster parameter configuration section](#fe-customized-startup-configuration), distribute the configuration file to the Kubernetes cluster as a `ConfigMap`.

#### Step 2: Build the DorisCluster Resource

Once the root initialization password is set in the configuration file, the root password takes effect immediately when the first Doris FE node starts. When subsequent nodes join the cluster, Doris Operator uses the root username and password to add the nodes. Therefore, you need to specify the username and password in the deployed DorisCluster resource so that Doris Operator can manage the cluster nodes.

- Environment variable method

  Configure the root username and password in the ".spec.adminUser.name" and ".spec.adminUser.password" fields of the DorisCluster resource. Doris Operator automatically converts these into container environment variables, and the auxiliary services inside the container use these environment variables to add nodes to the cluster. The configuration format is as follows:

  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```

  Here, `${password}` is the unencrypted root password.

- Secret method

  Doris Operator supports specifying the management username and password using a [Basic authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret). Doris Operator automatically mounts the Secret as a file at a specific location in the container. The auxiliary services in the container parse the username and password from the file and use them to automatically add nodes to the cluster. The stringData of the basic-authentication-secret contains only 2 fields: username and password. The procedure for configuring the management username and password using a Secret is as follows:

  a. Configure the Secret to use

  Configure the Basic Authentication Secret to use in the following format:

  ```yaml
  stringData:
    username: root
    password: ${password}
  ```

  Here, `${password}` is the unencrypted password set for root.
  Deploy the updated Secret to the Kubernetes cluster using the following command.
  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
  Here, `${namespace}` is the namespace where the DorisCluster resource will be deployed, and ${secretFileName} is the file name of the Secret to deploy.

  b. Configure the DorisCluster resource

  Specify the Secret to use in the DorisCluster resource to be deployed. The configuration is as follows:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  Here, `${secretName}` is the name of the Secret containing the root username and password.

### Automatically Create a Non-Root Admin User and Password During Deployment (Recommended)

During the first deployment, if you do not set the root initialization password, configure a non-root user and login password via environment variables or a Secret. The auxiliary service in the Doris container automatically creates this user in Doris, sets the password, and grants Node_priv privilege. Doris Operator then uses the automatically created username and password to manage cluster nodes.

- Environment variable mode

  Configure the DorisCluster resource to be deployed in the following format:
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  Here, `${DB_ADMIN_USER}` is the username to be newly created with admin privileges, and `${DB_ADMIN_PASSWD}` is the password for the new user.

- Secret method

  a. Configure the Secret to use

  Configure the Basic authentication Secret to use in the following format:

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  Here, `${DB_ADMIN_USER}` is the newly created username, and `${DB_ADMIN_PASSWD}` is the password set for the new username.

  Use the following command to deploy the Secret to the Kubernetes cluster:

  ```
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  Here, `${namespace}` is the namespace where the DorisCluster resource is deployed, and `${secretFileName}` is the file name of the Secret to deploy.

  b. Update the DorisCluster resource

  Specify the Secret to use in the DorisCluster resource as follows:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  Here, `${secretName}` is the name of the deployed Basic Authentication Secret.

:::tip Tip
- After deployment, set the root password. Doris Operator will switch to managing cluster nodes using the new user and password. Do not delete the newly created user.
:::

### Set the Root User Password After Cluster Deployment

After a Doris cluster is deployed, if no password has been set for the root user, you need to configure a user with [Node_priv](../../../admin-manual/auth/authentication-and-authorization.md#permission-types) privilege so that Doris Operator can manage cluster nodes automatically. It is recommended not to use the root user. Refer to the [user creation and privilege grant section](../../../sql-manual/sql-statements/account-management/CREATE-USER) to create a new user and grant Node_priv privilege. After creating the user, configure the new admin user and password via environment variables or a Secret, and set them in the DorisCluster resource.

#### Step 1: Create a User With Node_priv Privilege

After connecting to the database via the MySQL protocol, run the following command to create a user with only Node_priv privilege and set a password.

```shell
CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
```

Here, ${DB_ADMIN_USER} is the username to create, and ${DB_ADMIN_PASSWD} is the password to set.

#### Step 2: Grant Node_priv Privilege to the New User

After connecting to the database via the MySQL protocol, run the following command to grant Node_priv privilege to the new user.

```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```

Here, ${DB_ADMIN_USER} is the newly created username.

For details on creating users, setting passwords, and granting privileges, refer to the official [CREATE-USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) documentation.

#### Step 3: Configure the DorisCluster Resource

- Environment variable method

  Configure the newly created user and password in the DorisCluster resource as follows:
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADMIN_PASSWD} is the password set for the new user.

- Secret method

  a. Configure the Secret

  Create a Basic Authentication Secret in the following format:

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADMIN_PASSWD} is the password set for the new username.

  Use the following command to deploy the Secret to the Kubernetes cluster:

  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```

  Here, `${namespace}` is the namespace where the DorisCluster resource is deployed, and `${secretFileName}` is the file name of the Secret to deploy.

  b. Update the DorisCluster Resource That Uses the Secret

  Specify the Secret to use in the DorisCluster resource as follows:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  Here, `${secretName}` is the name of the deployed Basic authentication Secret.

:::tip Tip
- After deployment, setting the root password and configuring a new admin username and password will trigger one rolling restart of the existing services.
:::

## Automatically Restart Service to Apply Startup Configuration Changes
Doris specifies startup parameters via configuration files. Most parameters can be modified through the corresponding web interface and take effect in real time. Some parameters that cannot be modified through the web interface require a service restart to take effect. Starting from version 25.1.0, Doris Operator provides the ability to automatically restart and apply changes to service startup parameters.
Enable this capability in the `DorisCluster` resource as follows:
```yaml
spec:
  enableRestartWhenConfigChange: true
```
If the DorisCluster resource contains the configuration above, Doris Operator handles it as follows:
1. Monitor whether the startup configuration that the cluster deployed by the `DorisCluster` resource depends on (mounted via ConfigMap, see the [Customized Startup Configuration section](#customized-startup-configuration) for details) has changed.
2. After the startup configuration changes, automatically restart the corresponding service so that the configuration takes effect.

### Usage Example
ConfigMap monitoring and restart is supported for FE and BE node types. The following uses FE as an example.
1. The DorisCluster deployment spec is as follows:
    ```yaml
    spec:
      enableRestartWhenConfigChange: true
      feSpec:
        image: apache/doris:fe-2.1.8
        replicas: 1
        configMapInfo:
          configMapName: fe-configmap
    ```
2. Update the FE service startup configuration specified in `fe-configmap`.
After updating the value with key `fe.conf` in `fe-configmap` (the FE service startup configuration), Doris Operator automatically performs a rolling restart of the FE service so that the configuration takes effect.

## Use Kerberos Authentication
Starting from version 25.2.0, Doris Operator supports Kerberos authentication for Doris (versions 2.1.9 and 3.0.4 and later) on Kubernetes. Doris Kerberos authentication requires the [krb5.conf](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html) and [keytab file](https://web.mit.edu/Kerberos/krb5-1.16/doc/basic/keytab_def.html).
Doris Operator uses a `ConfigMap` resource to mount the krb5.conf file, and a `Secret` resource to mount the keytab file. The procedure for using Kerberos authentication is as follows:
1. Build a ConfigMap that contains the krb5.conf file:
    ```shell
    kubectl create -n ${namespace} create configmap ${name} --from-file=krb5.conf
    ```
   ${namespace} is the namespace where the `DorisCluster` is deployed, and ${name} is the desired name for the ConfigMap.
2. Build a Secret that contains the keytab:
    ```shell
    kubectl create -n ${namespace} secret generic ${name} --from-file= ${xxx.keytab}
    ```
   ${namespace} is the namespace where the `DorisCluster` is deployed, and ${name} is the desired name for the Secret. To mount multiple `keytab` files, refer to the [kubectl create Secret documentation](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret/) to put multiple `keytab` files into a single Secret.
3. Configure the DorisCluster resource and specify the ConfigMap that contains `krb5.conf` and the Secret that contains the `keytab` file.
    ```yaml
    spec:
      kerberosInfo:
        krb5ConfigMap: ${krb5ConfigMapName}
        keytabSecretName: ${keytabSecretName}
        keytabPath: ${keytabPath}
    ```
   ${krb5ConfigMapName} is the name of the ConfigMap that contains the `krb5.conf` file to use. ${keytabSecretName} is the name of the Secret that contains the keytab file. ${keytabPath} is the path where the Secret is mounted into the container. This path is the directory where the keytab file resides, as specified by `hadoop.kerberos.keytab` when creating the catalog. For creating a catalog, refer to the [Hive Catalog](../../../lakehouse/catalogs/hive-catalog.mdx#configure-catalog) documentation.

## Configure Shared Storage
Starting from version 25.4.0, Doris Operator supports mounting a `ReadWriteMany` shared storage to all Pods of multiple components. Before use, create the shared storage `PersistentVolume` and `PersistentVolumeClaim` resources in advance. Configure the `DorisCluster` resource as follows before deploying the Doris cluster:
```yaml
spec:
  sharedPersistentVolumeClaims:
  - mountPath: ${mountPath}
    persistentVolumeClaimName: ${sharedPVCName}
    supportComponents:
    - fe
    - be
```
- ${mountPath} specifies the absolute path mounted into the container.
- ${sharedPVCName} is the name of the `PersistentVolumeClaim` to be mounted.
- `supportComponents` specifies the names of the components that need to mount this shared storage. In the example above, FE and BE are specified to mount the shared storage. If the `supportComponents` array is empty, all deployed components mount the shared storage.

:::tip Tip
`mountPath` supports using `${DORIS_HOME}` as a path prefix. When `mountPath` uses `${DORIS_HOME}` as a prefix, in the FE container `${DORIS_HOME}` refers to `/opt/apache-doris/fe`, and in the BE container `${DORIS_HOME}` refers to `/opt/apache-doris/be`.
:::

## Configure Probe Timeouts
`DorisCluster` provides two probe timeout configurations for each service: startup probe timeout and liveness probe timeout. When the service startup time exceeds the configured startup probe timeout, the service is considered to have failed to start and is restarted. When the service does not respond within the liveness probe timeout, the Pod is automatically restarted.
### Startup Probe Timeout Configuration
- FE service startup probe timeout configuration
    ```
    spec:
      feSpec:
        startTimeout: 3600
    ```
  The configuration above sets the FE startup timeout to 3600 seconds.
- BE service startup probe timeout configuration
    ```
    spec:
      beSpec:
        startTimeout: 3600
    ```
  The configuration above sets the BE startup timeout to 3600 seconds.
### Liveness Probe Timeout Configuration
- FE service liveness probe timeout configuration
    ```
    spec:
      feSpec:
        liveTimeout: 60
    ```
  The configuration above sets the FE liveness timeout to 60 seconds.
- BE service liveness probe timeout configuration
    ```
    spec:
      beSpec:
        liveTimeout: 60
    ```
  The configuration above sets the BE liveness timeout to 60 seconds.
