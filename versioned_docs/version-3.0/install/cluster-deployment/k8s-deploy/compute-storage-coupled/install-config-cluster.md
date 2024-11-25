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
In the default DorisCluster resource deployment, the FE and BE images may not be the latest versions, and  the default replica count for both FE and BE is set to 3. Additionally, Additionally, the default resource configuration for FE is 6 CPUs and 12Gi of memory, while for BE, it is 8 CPUs and 16Gi of memory. This section describes how to modify these default configurations according to your requirements.

### Image settings
Doris Operator is decoupled from the Doris version and supports deploying Doris versions 2.0 and above.

**FE image configuration**  
To specify the FE image version, use the following configuration:
```yaml
spec:
  feSpec:
    image: ${image}
```
Replace ${image} with the desired image name, then update the configuration in the target [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster).  Official FE images are available at [FE Image](https://hub.docker.com/repository/docker/selectdb/doris.fe-ubuntu).

**BE image configuration**  
To specify the BE image version, use the following configuration:
```yaml
spec:
  beSpec:
    image: ${image}
```
Replace ${image} with the desired image name, then update the configuration in the target [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster).  Official BE images are available at [BE Image](https://hub.docker.com/repository/docker/selectdb/doris.be-ubuntu).

### Replicas settings
**FE Replicas Setting**  
To modify the default FE replica count of 3 to 5, use the following configuration:
```yaml
spec:
  feSpec:
    replicas: 5
```
Update the configuration in the target [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster).

**BE Replicas Setting**  
To modify the default FE replica count of 3 to 5, use the following configuration:
```yaml
spec:
  beSpec:
    replicas: 5
```
Update the configuration to the [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster) that needs to be deployed.

### Computing resource settings
**FE computing resource configuration**  
The default compute resource configuration for FE is 6 CPUs and 12Gi of memory. To modify it to 8CPUs and 16Gi, use the following configuration:
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
Update the configuration in the target [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster).

**BE computing resource setting**    
The default compute resource configuration for BE is 8 CPUs and 16Gi of memory. To modify it to 16 CPUs and 32Gi of memory, use the following configuration:  
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
Update the configuration in the target [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster).

:::tip Tip  
The minimum required resources for FE and BE to start are 4 CPUs and 8Gi of memory. For normal performance testing, it is recommended to configure  8 CPUs and 8Gi of memory.  
:::

## Custom startup configuration
Doris uses ConfigMap to decouple configuration files from services, in Kubernetes. By default, services use the default configurations in the image as startup parameter configurations. To customize the startup parameters, create a specific ConfigMap following the instructions in the [FE Configuration Document](../../../../admin-manual/config/fe-config.md) and the [BE Configuration Document](../../../../admin-manual/config/be-config.md). Then deploy the customized ConfigMap to the namespace where the [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster) is to be deployed.

### Custom FE startup configuration
#### Step 1:  Create and deploy the FE ConfigMap
The following example defines a ConfigMap named fe-conf for use with Doris FE:
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
Here, ${namespace} refers to the namespace where the DorisCluster is to be deployed, and ${feConfigMapFile} is the name of the ConfigMap file for FE.  

#### Step 2: Update the DorisCluster resource
To use the ConfigMap named `fe-conf` for mounting the startup configuration, add the following config to the FE spec of the [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster):
```yaml
spec:
  feSpec:
    configMapInfo:
      configMapName: fe-conf
      resolveKey: fe.conf
```

:::tip Tip
Please ensure that `enable_fqdn_mode=true` is included in the startup configuration.. If you want to use IP mode and K8s have the ability that the pod IP keep the same after restarted, please refer to the issue [#138](https://github.com/apache/doris-operator/issues/138) to config.
:::

### Custom BE startup configuration
#### Step 1: Create and deploy the BE ConfigMap  
The following example defines a ConfigMap named `be-conf` for use with Doris BE:
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
When using the ConfigMap to mount BE startup configuration, the key corresponding to the configuration must be `be.conf`. Write the ConfigMap to a file and deploy it to the namespace where the [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster) is deployed using the following command:
```shell
kubectl -n ${namespace} apply -f ${beConfigMapFile}.yaml
```
Here, ${namespace} refers to the namespace where the DorisCluster resource needs to be deployed, and ${beConfigMapFile} is the name of the ConfigMap file for BE.  

#### Step 2: Update the DorisCluster resource
To use the ConfigMap named `be-conf` for mounting the startup configuration, add the following config to the BE spec of the [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster):
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
The Doris Operator supports mounting multiple ConfigMaps into different directories within the container, allowing flexible configuration management.

**Mounting multiple ConfigMaps for FE**  
The following example demonstrates how to mount two ConfigMaps `test-fe1` and `test-fe2` to the directories "/etc/fe/config1/" and "/etc/fe/config2",respectively, within the FE container:
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
Similarly, the following example shows how to mount two ConfigMaps `test-be1` and `test-be2` into the directories "/etc/be/config1" and "/etc/be/config2", respectively, within the BE container:
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
Kubernetes provides the [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) to persist data to physical storage. In Kubernetes, the Doris Operator automatically creates PersistentVolumeClaims associated with appropriate PersistentVolumes, based on the template that defined in the need deployed [DorisCluster Resource](install-quickstart.md#step-2-deploy-doris-cluster).

### Persistent storage for FE
In a Kubernetes-based Doris deployment, it is recommended to persist the following paths for FE:  
1. Metadata: /opt/apache-doris/fe/doris-meta (default storage configuration for FE metadata).
2. Logs: /opt/apache-doris/fe/log (if log persistence is required).

#### Persistent metadata for FE
To persist FE metadata using the default storage configuration, add the following configuration to the [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster):
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
In the above configuration, ${your_storageclass} represents the name of the StorageClass you want to use, and ${storageSize} represents the storage size you want to allocation. The format is [quantity expression](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), such as: 100Gi. 

#### Persistent FE log
If your cluster lacks a centralized log collection system, persist the FE log directory by adding the following configuration to the [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster):
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
For BE nodes in a Doris deployment, it is recommended to persist the following paths:  
1. Data Storage: /opt/apache-doris/be/storage (default storage for BE data).
2. Logs: /opt/apache-doris/be/log (if log persistence is required).

#### Persistent data
- **Using default storage configuration**  
  To persist data uses the default storage configuration, update the [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster) with the following configuration:
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

- **Customizing BE storage paths**  
  To leverage multiple disks, you can configure multiple storage directories using storage_root_path. For example, if storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD, the configuration should include:
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
To persist BE logs when using the default configuration, update the DorisCluster resource [DorisCluster resource](install-quickstart.md#step-2-deploy-doris-cluster) as follows:
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

#### Step 1: Configure ClusterIP
Doris provides the ClusterIP access mode by default on Kubernetes. You can use the ClusterIP access mode without any modification.

#### Step 2: Obtain the Service  
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

In the above results, there are two types of services for FE and BE, with suffixes of "internal" and "service" respectively:
- The services with the "internal" suffix can only be used for internal communication within Doris, such as heartbeat, data exchange, and other operations, and are not for external use.
- The services with the "service" suffix can be used by users.

#### Step 3: Access doris from inside the container

You can create a pod containing the mysql client in the current Kubernetes cluster using the following command:
```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```
From within the container in the cluster, you can access the Doris cluster using the service name with the "service" suffix that is exposed externally:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

### NodePort
To access Doris from outside the Kubernetes cluster, you can use the NodePort service type. There are two ways to allocate a port for the NodePort: dynamic allocation and static allocation.  
- Dynamic Allocation: If the port is not explicitly set, Kubernetes will automatically allocate an unused port from the default range (30000-32767) when the pod is created.
- Static Allocation:I f a port is explicitly specified, Kubernetes will allocate that port if it is available, ensuring it remains fixed.

Doris exposes the following ports for external access:

| Port Name | default value | Port Description                     |
|------| ---- |--------------------------|
| Query Port | 9030 | Used to access the Doris cluster via the MySQL protocol |
| HTTP Port | 8030 | The http server port on FE, used to view FE information |
| Web Server Port | 8040 | The http server port on BE, used to view BE information |

#### Step 1: Configure NodePort
**FE NodePort**  
- Dynamic Allocation:
  ```yaml
  spec:
    feSpec:
      service:
        type: NodePort
  ```
- Static Allocation:
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
- Dynamic Allocation:
  ```yaml
  spec:
    beSpec:
      service:
        type: NodePort
  ```
- Static Allocation:
  ```yaml
    beSpec:
      service:
        type: NodePort
        servicePorts:
        - nodePort: 31006
          targetPort: 8040
  ```
#### Step 2: Obtain the service
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
#### Step 3: Access service using NodePort  
To access Doris via NodePort, you need to know the Node IP and the mapped port. You can retrieve the node IPs using:
```shell
  kubectl get nodes -owide
```
Example output::
```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```
You can then use the IP address of any node (e.g., 192.168.88.61, 192.168.88.62, or 192.168.88.63) along with the mapped port to access Doris. For example, using node 192.168.88.62 and port 31545:  
```shell
  mysql -h 192.168.88.62 -P 31545 -uroot
```

### LoadBalancer
[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) service type provides an additional load balancer, typically offered by cloud service providers. This mode is only available when deploying the Doris cluster on Kubernetes clusters managed by a cloud platform.
#### Step 1: Configure the LoadBalancer mode  
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
#### Step 2: Obtain the service  
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

#### Step 3: Access service using LoadBalancer 
To access Doris through the LoadBalancer, use the external IP (provided in the EXTERNAL-IP field) and the corresponding port. For example, using the `mysql` command:
```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## Configuring the Username and Password for the Management Cluster
Managing Doris nodes requires connecting to the live FE nodes via the MySQL protocol using a username and password for administrative operations. Doris implements [a permission management mechanism similar to RBAC](../../../../admin-manual/auth/authentication-and-authorization?_highlight=rbac), where the user must have the [Node_priv](../../../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions) permission to perform node management. By default, the Doris Operator deploys the cluster with the root user in passwordless mode.

The process of configuring the username and password can be divided into three scenarios:  
- initializing the root user password during cluster deployment;
- automatically setting a non-root user with management permissions in the root passwordless deployment;
- setting the root user password after deploying the cluster in root passwordless mode.

To secure access, you must configure a username and password with Node_Priv permission in the DorisCluster resource after adding a password to the root user. There are two ways to set up the username and password for managing the cluster nodes:
- Using environment variables
- Using a Kubernetes Secret

### Configuring the Root User Password during Cluster Deployment
To set the root user's password securely, Doris supports encrypting it in [`fe.conf`](../../../../admin-manual/config/fe-config?_highlight=initial_#initial_root_password) using a two-stage SHA-1 encryption process. Here's how to set up the password.

#### Step 1: Generate the root encrypted password

Use the following methods to encrypt the root password using two-stage SHA-1 encryption:

- Java Code:
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

- Golang Code:
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
  Configure the encrypted password into `fe.conf` according to the requirements of the configuration file format. Then, Then, distribute the configuration to the Kubernetes cluster using a ConfigMap, describes in [the Cluster Parameter Configuration Section](#custom-fe-startup-configuration).

#### Step 2: Configure the DorisCluster resource
After setting the root password in fe.conf, Doris will automatically apply the password to the first FE node when it starts. For other nodes to join the cluster, specify the username and password in the DorisCluster resource so that Doris Operator can perform automatic node management.
- Using environment variables

  Configure the username root and password into the ".spec.adminUser.name" and ".spec.adminUser.password" fields in the DorisCluster resource. Doris Operator will automatically convert the following configuration into environment variables for the container to use. The auxiliary services inside the container will use the username and password configured by the environment variables to add themselves to the specified cluster. The configuration format is as follows:

  ```yaml
  spec:
    adminUser:
      name: root
      password: ${password}
  ```
  Here, ${password} is the unencrypted password of root.

- Using secret

  To securely manage the username and password, you can use a Kubernetes [Basic Authentication Secret](https://kubernetes.io/docs/concepts/configuration/secret/#basic-authentication-secret). Configure the Secret to store the root username and password and reference it in the DorisCluster resource.
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
For enhanced security, it is recommended to create a non-root user for management during the first deployment, rather than using the root user. In this method, the username and password for the non-root user are configured through environment variables or Secrets. The Doris container's auxiliary services will automatically create the user in the database, set the password, and grant the necessary Node_priv permission. After deployment, Doris Operator will use the newly created non-root username and password to manage the cluster nodes.

- Using environment variables:

  To configure a non-root user, you can set the username and password using environment variables in the DorisCluster resource:
    ```yaml
    spec:
      adminUser:
        name: ${DB_ADMIN_USER}
        password: ${DB_ADMIN_PASSWD}
    ```

  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADMIN_PASSWD} is the password set for the newly created username.

- Using Secret:
  To securely manage the username and password, you can use a Kubernetes Secret for basic authentication.  
  a. Configure the required secret
  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```

  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADMIN_PASSWD} is the password set for the newly created username.  
  Deploy the Secret to the Kubernetes cluster by running:
  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
  Here, ${namespace} is the namespace where the DorisCluster resource needs to be deployed, and ${secretFileName} is the file name of the Secret to be deployed.

  b. Configure the DorisCluster resource

  Update the DorisCluster resource according to the following format:

  ```yaml
  spec:
    authSecret: ${secretName}
  ```

  Here, ${secretName} is the name of the deployed Basic authentication Secret.

:::tip Tip  
After deployment, please set the root password. Doris Operator will switch to using the automatically newly created username and password to manage the nodes. Please avoid deleting the automatically created user.  
:::

### Setting the root user password after cluster deployment
After deploying the Doris cluster and setting the root user's password, it's essential to create a management user with the necessary [Node_priv](../../../../admin-manual/auth/authentication-and-authorization.md#types-of-permissions) permission to allow Doris Operator to automatically manage the cluster nodes. Using the root user for this purpose is not recommended. Instead, please refer to [the User Creation and Permission Assignment Section](../../../../sql-manual/sql-statements/Account-Management-Statements/CREATE-USER.md) to create a new user and grant Node_priv permission.

#### Step 1: Create a user with Node_priv permission
First, connect to the Doris database using the MySQL protocol, then create a new user with the required permissions:
  ```shell
  CREATE USER '${DB_ADMIN_USER}' IDENTIFIED BY '${DB_ADMIN_PASSWD}';
  ```

- ${DB_ADMIN_USER}: The name of the user you wish to create.
- ${DB_ADMIN_PASSWD}: The password for the newly created user.

#### Step 2: Grant Node_priv permission to the new user
Grant the Node_priv permission to the newly created user:
```shell
GRANT NODE_PRIV ON *.*.* TO ${DB_ADMIN_USER};
```
${DB_ADMIN_USER}: The username you created in the previous step.  
For more details on creating users, setting passwords, and granting permissions, refer to the [CREATE-USER](../../../../sql-manual/sql-statements/Account-Management-Statements/CREATE-USER.md) section.

#### Step 3: Configure DorisCluster  
- Using environment variables

  Directly configure the new user’s name and password in the DorisCluster resource:
  ```yaml
  spec:
    adminUser:
      name: ${DB_ADMIN_USER}
      password: ${DB_ADMIN_PASSWD}
  ```

  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADIC_PASSWD} is the password set for the newly created user.

- Using Secret
  To securely manage the username and password, you can use Kubernetes Secrets.  
  a. Create the required secret  
  Create a Basic Authentication Secret for the new user:
  ```yaml
  stringData:
    username: ${DB_ADMIN_USER}
    password: ${DB_ADMIN_PASSWD}
  ```
  Here, ${DB_ADMIN_USER} is the newly created username, and ${DB_ADMIN_PASSWD} is the password set for the newly created username.  
  Deploy the Secret to the Kubernetes cluster with:
  ```shell
  kubectl -n ${namespace} apply -f ${secretFileName}.yaml
  ```
  Here, ${namespace} is the namespace where the DorisCluster resource needs to be deployed, and ${secretFileName} is the file name of the Secret to be deployed.

  b. Update the DorisCluster resource  
  Once the Secret is deployed, update the DorisCluster resource to specify the Secret:
  ```yaml
  spec:
    authSecret: ${secretName}
  ```
  Here, ${secretName} is the name of the deployed Basic authentication Secret.

:::tip Tip  
After setting the root password and configuring the new username and password for managing nodes after deployment, the existing services will be restarted once in a rolling manner.  
:::
