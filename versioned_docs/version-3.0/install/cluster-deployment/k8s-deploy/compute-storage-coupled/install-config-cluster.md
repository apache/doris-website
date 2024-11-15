---
{
  "title": "Config Doris to Deploy",
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

## Cluster planning
In the default deployed DorisCluster resources, the images used by FE and BE may not be the latest versions. The default number of replicas is FE = 3, BE = 3. The computing resources used by FE are 6c and 12Gi, and the resources used by BE are 8 c and 16Gi. Please refer to the following instructions for making changes.

### Image settings
The Doris Operator is decoupled from the Doris version. Essentially, the Doris Operator can deploy any version of Doris if not explicitly specified.

**FE image settings**  
Specify the image for fe as follows:
```yaml
spec:
  feSpec:
    image: ${image}
```
Replace ${image} with the name of the image you want to deploy, update the configuration to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) that needs to be deployed.

**BE image settings**  
Specify the image for be as follows:
```yaml
spec:
  beSpec:
    image: ${image}
```
Replace ${image} with the name of the image you want to deploy, update the configuration to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) that needs to be deployed.

### Replicas settings
**FE Replicas Setting**  
Specify the replicas of fe as follows:
```yaml
spec:
  feSpec:
    replicas: 5
```
Update the configuration to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) that needs to be deployed.

**BE Replicas Setting**  
Specify the replicas of be as follows:
```yaml
spec:
  beSpec:
    replicas: 5
```
Update the configuration to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) that needs to be deployed.

### Computing resource settings
**FE computing resource settings**  
To change the computing resources of fe to 8c and 16Gi, the configuration is as follows:
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
Update the configuration to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) that needs to be deployed.

**BE computing resource settings**    
To change the computing resources of be to 16c and 32Gi, the configuration is as follows:
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
Update the configuration to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) that needs to be deployed.

:::tip Tip  
The minimum resources required for FE and BE are 4c and 8Gi. This is the minimum required for startup. The normal testing needed resources are 8c and 8Gi.  
:::

## Custom startup configuration
Doris uses ConfigMap to decouple configuration files from services, in Kubernetes. By default, services use the default configurations in the image as startup parameter configurations.Customized the startup parameters into a specific ConfigMap according to the introductions in the [FE Configuration Document](../../../../admin-manual/config/fe-config.md) and the [BE Configuration Document](../../../../admin-manual/config/be-config.md),
and deploy the customized ConfigMap to the namespace where the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) needs to be deployed.

### Custom FE startup configuration
1. Deploying ConfigMap  
  The following defines a ConfigMap named fe-conf that can be used by Doris FE:
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
  When using the ConfigMap to mount FE startup configuration, the key corresponding to the configuration must be `fe.conf`. Write the ConfigMap to a file and deploy it to the namespace where the DorisCluster resource is deployed, using the following command:
  ```shell
  kubectl -n ${namespace} apply -f ${feConfigMapFile}.yaml
  ```
  ${namespace} is the namespace to which the DorisCluster resource needs to be deployed, and ${feConfigMapFile} is the name of the configMap file used by FE.

2. Configuring DorisCluster resource  
  When use the ConfigMap named by `fe-conf` to mount startup configuration, add the following config to the FE spec of the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) to be deployed:
  ```yaml
  spec:
    feSpec:
      configMapInfo:
        configMapName: fe-conf
        resolveKey: fe.conf
  ```

:::tip Tip
Please add `enable_fqdn_mode=true` in start config. If you want to use ip mode and K8s have the ability that the pod IP keep the same after restarted, please refer to the [issue](https://github.com/apache/doris-operator/issues/138) to config.
:::

### Custom BE startup configuration
1. Deploying ConfigMap  
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
  When using the ConfigMap to mount BE startup configuration, the key corresponding to the configuration must be `be.conf`. Write the ConfigMap to a file and deploy it to the namespace where the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) is deployed, using the following command:
  ```shell
  kubectl -n ${namespace} apply -f ${beConfigMapFile}.yaml
  ```
  ${namespace} is the namespace to which the DorisCluster resource needs to be deployed, and ${beConfigMapFile} is the name of the configMap file used by BE.
  
2. Configuring DorisCluster Resource  
  When use the ConfigMap named by `be-conf` to mount startup configuration, add the following config to the BE spec of the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) to be deployed:
  ```yaml
  spec:
    feSpec:
      configMapInfo:
        configMapName: be-conf
        resolveKey: be.conf
  ```
:::tip Tip  
Please use the startup configMap to mount files, when you want mount the file into the config directory in container, the config directory is ${DORIS_HOME}/conf.  
:::

### Mounting multiple ConfigMaps
In addition to providing the ability to mount configuration files, the Doris Operator also has the capability to mount multiple ConfigMaps to different directories within the container.

**Mounting multiple ConfigMaps for FE**  
  The following is an example of mounting the ConfigMaps named test-fe1 and test-fe2 to the directories "/etc/fe/config1/" and "/etc/fe/config2" within the FE container respectively:
  ```yaml
  spec:
    feSpec:
      configMaps:
      - configMapName: test-fe1
        mountPath: /etc/fe/config1
      - configMapName: test-fe2
        mountPath: /etc/fe/config2
  ```
**Mounting multiple ConfigMaps for BE**  
The following is an example of mounting the ConfigMaps named test-be1 and test-be2 to the directories "/etc/be/config1/" and "/etc/be/config2" within the BE container respectively:
  ```yaml
  spec:
    beSpec:
      configMaps:
        - configMapName: test-be1
          mountPath: /etc/be/config1
        - configMapName: test-be2
          mountPath: /etc/be/config2
  ```
  
## Persistent storage
Kubernetes provides the [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) to persist data to physical storage. In Kubernetes, the Doris Operator automatically creates corresponding PersistentVolumeClaims associated with appropriate PersistentVolumes using the template that defined in the need deployed [DorisCluster Resource](install-quickstart.md#step-3-deploy-doris-cluster).

### Persistent storage for FE
In the deployment of Doris on K8s, it is recommended to persist the `/opt/apache-doris/fe/doris-meta` mount point by default. This is the default storage path for FE metadata. When Doris is deployed on K8s, logs are output to the console by default. If the cluster has the ability to collect logs, they can be directly collected through the console. If the cluster lacks a log collection system, it is recommended to persist the log path, default value is `/opt/apache-doris/fe/log`.

#### Persistent metadata
When using the default configuration file, add the following configuration to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) to be deployed:
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
In the above configuration, ${your_storageclass} represents the name of the StorageClass you want to use, and ${storageSize} represents the storage size you want to allocation. The format of ${storageSize} follows the [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) method of K8s, such as: 100Gi. Please replace them as needed when using.

#### Persistent FE log
When using the default configuration file, add the following configuration to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) to be deployed:
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
In the above configuration, ${your_storageclass} represents the name of the StorageClass you want to use, and ${storageSize} represents the storage size you want to allocation. The format of ${storageSize} follows the [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) method of K8s, such as: 100Gi. Please replace them as needed when using.

:::tip Tip  
If you have reconfigured meta_dir or sys_log_dir in the [customized configuration file](#custom-fe-startup-configuration), please reconfigure the mountPath.
:::

### Persistent storage for BE
In the deployment of Doris on K8s, it is recommended to persist the `/opt/apache-doris/be/storage` mount point by default. This is the default storage path for storing actual data on BE nodes. When Doris is deployed on K8s, logs are output to the console by default. If the cluster has the ability to collect logs, they can be directly collected through the console. If the cluster lacks a log collection system, it is recommended to persist the log path, default value is `/opt/apache-doris/be/log`.

#### Persistent data
- **Using default storage path**  
  If BE uses the default configuration, please update the following configuration information to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) to be deployed:
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
  In the above configuration, ${your_storageclass} represents the name of the StorageClass you want to use, and ${storageSize} represents the storage size you want to use. The format of ${storageSize} follows the [quantity expression method](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) of K8s, such as: 100Gi. Please replace them as needed when using.

- **Customized storage paths for BE**

  Doris provides the ability to configure multiple storage directories to fully utilize the advantages of multiple disks. If multiple storage directories are specified through `storage_root_path` in the customized configuration, the deployed DorisCluster should add multiple templates . For example, if `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD`, you need to add the following configuration to the deployment resource:
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
  In the above configuration, ${your_storageclass} represents the name of the StorageClass you want to use, and ${storageSize} represents the storage size you want to use. The format of ${storageSize} follows the [quantity expression method](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) of K8s, such as: 100Gi. Please replace them as needed when using.

#### Persistent BE log
When using the default configuration file, add the following configuration to the [DorisCluster resource](install-quickstart.md#step-3-deploy-doris-cluster) to be deployed:
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
In the above configuration, ${your_storageclass} represents the name of the StorageClass you want to use, and ${storageSize} represents the storage size you want to use. The format of ${storageSize} follows the [quantity expression method](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/) of K8s, such as: 100Gi. Please replace them as needed when using.

## Access Configuration
Kubernetes provides the use of Service as VIP (Virtual IP) and load balancer. There are three external exposure modes for Service: ClusterIP, NodePort, and LoadBalancer.

### ClusterIP
Doris provides the ClusterIP access mode by default on Kubernetes. The ClusterIP access mode provides an internal IP address within the Kubernetes cluster to expose services through this internal IP. With the ClusterIP mode, services can only be accessed within the cluster.

1. Configure ClusterIP as the service type  
  Doris provides the ClusterIP access mode by default on Kubernetes. You can use the ClusterIP access mode without any modification.

2. Obtain the Service  
  After deploying the cluster, you can view the services exposed by the Doris Operator using the following command:
  ```shell
  kubectl -n doris get svc
  ```
  The returned result is as follows:
  ```shell
  NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
  doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
  doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
  doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
  doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
  ```

3. Access Doris from Inside the Container  

In the above results, there are two types of services for FE and BE, with suffixes of "internal" and "service" respectively:
- The services with the "internal" suffix can only be used for internal communication within Doris, such as heartbeat, data exchange, and other operations, and are not for external use.
- The services with the "service" suffix can be used by users.

  You can create a pod containing the mysql client in the current Kubernetes cluster using the following command:
  ```shell
  kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
  ```
  From within the container in the cluster, you can access the Doris cluster using the service name with the "service" suffix that is exposed externally:
  
  ```shell
  mysql -uroot -P9030 -hdoriscluster-sample-fe-service
  ```

### NodePort
If users need to access Doris from outside the Kubernetes cluster, they can choose to use the NodePort mode. There are two ways to use NodePort: mapping the host port in advance and dynamically allocating the host port during deployment.
- Dynamic Allocation:

  If the port mapping is not explicitly set, Kubernetes will automatically allocate an unused port (the default range is 30000 - 32767) when creating the pod.
- Static Allocation:

  If the port mapping is explicitly specified, Kubernetes will fixedly allocate that port when it is unused and there is no conflict.

Static allocation requires planning the port mapping. Doris provides the following ports for interacting with the outside:

| Port Name | default value | Port Description                     |
|------| ---- |--------------------------|
| Query Port | 9030 | Used to access the Doris cluster via the MySQL protocol |
| HTTP Port | 8030 | The http server port on FE, used to view FE information |
| Web Server Port | 8040 | The http server port on BE, used to view BE information |

1. Configure NodePort  

**FE NodePort**
- The configuration for dynamic allocation of FE NodePort is as follows:
  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
  ```
- An example of static configuration for FE NodePort is as follows:
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
- The configuration for dynamic allocation of BE NodePort is as follows:
  ```yaml
  spec:
    beSpec:
      service:
        type: NodePort
  ```
- An example of static allocation of BE NodePort is as follows:
  ```yaml
    beSpec:
      service:
        type: NodePort
        servicePorts:
        - nodePort: 31006
          targetPort: 8040
  ```
2. Obtain the Service  
  After deploying the cluster, you can view the services exposed by the Doris Operator using the following command:
  ```shell
  kubectl get service
  ```
  The returned result is as follows:
  ```shell
  NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
  kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
  doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
  doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
  doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
  doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
  ```
3. Access Services Using NodePort  
  Taking the mysql connection as an example. The default Query Port of Doris is 9030, which is mapped to the host port 31545 in the above example. When accessing the Doris cluster, you also need to obtain the corresponding IP address, which can be viewed using the following command:
  ```shell
  kubectl get nodes -owide
  ```
  The returned result is as follows:
  ```shell
  NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
  r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
  r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
  r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
  r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
  ```
  In the NodePort mode, you can access the services within the Kubernetes cluster based on the host IP of any node and the port mapping. In this example, you can use the IP of any node, such as 192.168.88.61, 192.168.88.62, or 192.168.88.63, to access the Doris service. For example, in the following, the node 192.168.88.62 and the mapped query port 31545 are used to access the cluster:
  ```shell
  mysql -h 192.168.88.62 -P 31545 -uroot
  ```

### LoadBalancer
[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) is an additional load balancer provided by cloud service providers. This mode can only be configured when deploying the Doris cluster on K8s provided by the cloud platform.
1. Configure the LoadBalancer Mode  
**FE LoadBalancer**  
  ```yaml
  spec:
    feSpec:
      service:
        type: LoadBalancer
  ```
**BE LoadBalancer**
  ```yaml
  spec:
    beSpec:
      service:
        type: LoadBalancer
  ```
2. Obtain the Service  
  After deploying the cluster, you can view the services exposed by the Doris Operator using the following command:
  ```shell
  kubectl get service
  ```
  The returned result is as follows:
  ```shell
  NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
  kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
  doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
  doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
  doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
  doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
  ```

3. Access Using the LoadBalancer Mode  
  Taking the mysql connection as an example:
  ```shell
  mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
  ```

## Configuring the Username and Password for the Management Cluster
The management of Doris nodes requires connecting to the live FE nodes via the MySQL protocol using a username and password for operations. Doris implements [a permission management mechanism similar to RBAC](../../../../admin-manual/auth/authentication-and-authorization?_highlight=rbac), and the management of nodes requires the user to have the [Node_priv](../../../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions) permission. By default, Doris Operator deploys and manages the cluster configured with DorisCluster resources using the root user with all permissions in passwordless mode. After adding a password to the root user, it is necessary to explicitly configure the username and password with Node_Priv permission in the DorisCluster resource, so that Doris Operator can perform automated management operations on the cluster.

DorisCluster resources provide two ways to configure the username and password required for managing cluster nodes, including the way of environment variable configuration and the way of using [Secret](https://kubernetes.io/docs/concepts/configuration/secret/). Configuring the username and password for cluster management can be divided into three cases:

- initializing the root user password during cluster deployment;
- automatically setting a non-root user with management permissions in the root passwordless deployment;
- setting the root user password after deploying the cluster in root passwordless mode.

### Configuring the Root User Password during Cluster Deployment

Doris supports configuring the root user's password in encrypted form in `fe.conf`. To configure the root user's password during the first deployment of Doris, follow these steps so that Doris Operator can automatically manage the cluster nodes:

1. **Generate the Root Encrypted Password**

  Doris supports setting the root user's password in the [fe.conf](../../../../admin-manual/config/fe-config?_highlight=initial_#initial_root_password) in encrypted form. The password encryption is implemented using two-stage SHA-1 encryption. The code implementation is as follows:
  
  Java Code for Two-Stage SHA-2 Encryption:
  
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
  
  Golang Code for Two-Stage SHA-1 Encryption:
  
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
  Configure the encrypted password into `fe.conf` according to the requirements of the configuration file format. Then, distribute the configuration file to the K8s cluster in the form of a configmap according to the introduction in [the Cluster Parameter Configuration Section](./install-config-cluster.md).

2. **Configure the DorisCluster Resource**

  After setting the root initialization password in the configuration file, the root password will take effect immediately after the first Doris FE node starts. When other nodes join the cluster, Doris Operator needs to operate using the root username + password. It is necessary to specify the username + password in the deployed DorisCluster resource so that Doris Operator can automatically manage the cluster nodes.
  
  **Using Environment Variables**
  
  Configure the username root and password into the ".spec.adminUser.name" and ".spec.adminUser.password" fields in the DorisCluster resource. Doris Operator will automatically convert the following configuration into environment variables for the container to use. The auxiliary services inside the container will use the username and password configured by the environment variables to add themselves to the specified cluster. The configuration format is as follows:
  
  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```
  Here, ${password} is the unencrypted password of root.

  **Using Secret:**
  
  Doris Operator provides the use of [Basic authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret) to specify the username and password of the management node. After the DorisCluster resource is configured to use the required Secret, Doris Operator will automatically mount the Secret to the specified location of the container in the form of a file. The auxiliary services of the container will parse the username and password from the file to automatically add themselves to the specified cluster. The stringData of basic-authentication-secret only contains two fields: username and password. The process of using Secret to configure the management username and password is as follows:
  
  a. Configure the Required Secret
  
  Configure the required Basic authentication Secret according to the following format:
  
  ```yaml
  stringData:
    username: root
    password: ${password}
  ```
  
  Here, ${password} is the unencrypted password set for root.
  
  b. Configure the DorisCluster Resource to be Deployed
  
  Configure the DorisCluster to specify the required Secret in the following format:
  
  ```yaml
  spec:
    authSecret: ${secretName}
  ```
  
  Here, ${secretName} is the name of the Secret containing the root username and password.

### Automatically Creating Non-Root Management Users and Passwords during Deployment (Recommended)

During the first deployment, do not set the initialization password of root. Instead, set the non-root user and login password through the environment variable or using Secret. The auxiliary services of the Doris container will automatically create the configured user in the database, set the password, and grant the Node_priv permission. Doris Operator will manage the cluster nodes using the automatically created username and password.

- Using Environment Variables:

  Configure the DorisCluster resource to be deployed according to the following format:

    ```yaml
    spec:
      adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
    ```

  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADMIN_PASSWD} is the password set for the newly created username.

- Using Secret:

  a. Configure the Required Secret

  Configure the required Basic authentication Secret according to the following format:

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADMIN_PASSWD} is the password set for the newly created username.  
  Deploy the updated Secret to the K8s cluster by running `kubectl -n ${namespace} apply -f ${secretFileName}.yaml`. Here, ${namespace} is the namespace where the DorisCluster resource needs to be deployed, and ${secretFileName} is the file name of the Secret to be deployed.

  b. Configure the DorisCluster Resource Requiring Secret

  Update the DorisCluster resource according to the following format:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  Here, ${secretName} is the name of the deployed Basic authentication Secret.

:::tip Tip  
After deployment, please set the root password. Doris Operator will switch to using the automatically newly created username and password to manage the nodes. Please avoid deleting the automatically created user.  
:::

### Setting the Root User Password after Cluster Deployment

After the Doris cluster is deployed and the root user's password is set, it is necessary to configure a user with [Node_priv](../../../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions) permission into the DorisCluster resource so that Doris Operator can automatically manage the cluster nodes. It is not recommended to use root as this username. Please refer to [the User Creation and Permission Assignment Section](../../../../sql-manual/sql-statements/Account-Management-Statements/CREATE-USER.md) to create a new user and grant Node_priv permission. After creating the user, specify the new management user and password through the environment variable or Secret method, and configure the corresponding DorisCluster resource.

1. **Create a User with Node_priv Permission**

  After connecting to the database using the MySQL protocol, use the following command to create a simple user with only Node_priv permission and set the password.
  
  ```shell
  CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
  ```

  Here, ${DB_ADMIN_USER} is the username you hope to create, and ${DB_ADMIN_PASSWD} is the password you hope to set for the newly created user.

2. **Grant Node_priv Permission to the Newly Created User**

  After connecting to the database using the MySQL protocol, use the following command to grant Node_priv permission to the newly created user.
  
  ```shell
  GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
  ```
  
  Here, ${DB_ADMIN_USER} is the newly created username.
  
  For detailed usage of creating users, setting passwords, and granting permissions, please refer to the official document [CREATE-USER](../../../../sql-manual/sql-statements/Account-Management-Statements/CREATE-USER.md) section.
  
3. **Configure DorisCluster**  
  **Using Environment Variables**

  Configure the newly created username and password into the ".spec.adminUser.name" and ".spec.adminUser.password" fields in the DorisCluster resource. Doris Operator will automatically convert the following configuration into environment variables. The auxiliary services inside the container will use the username and password configured by the environment variables to add themselves to the specified cluster. The configuration format is as follows:

  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADIC_PASSWD} is the password set for the newly created user.

  **Using Secret**

  a. Configure the Required Secret

  Configure the required Basic authentication Secret according to the following format:

  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADMIN_PASSWD} is the password set for the newly created username.  
  Deploy the configured Secret to the K8s cluster by running kubectl -n ${namespace} apply -f ${secretFileName}.yaml. Here, ${namespace} is the namespace where the DorisCluster resource needs to be deployed, and ${secretFileName} is the file name of the Secret to be deployed.

  b. Update the DorisCluster Resource Requiring Secret

  Update the DorisCluster resource according to the following format:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```
  Here, ${secretName} is the name of the deployed Basic authentication Secret.

:::tip Tip  
After setting the root password and configuring the new username and password for managing nodes after deployment, the existing services will be restarted once in a rolling manner.  
:::
