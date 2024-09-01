---
{
"title": "Config and install Compute Clusters",
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

The Compute Cluster of Compute-storage decoupled cluster is responsible for data import and caching data in object storage. Compute clusters are isolated from each other.

## Specify the name of the compute cluster

The following configuration deploys a minimal compute cluster:

```yaml
spec:
  computeClusters:
  - name: cc1
    image: {beImage}
    replicas: 1
```

The above configuration deploys a compute cluster named cc1. The deployment of the compute cluster depends on the deployment of the FE service. The Compute-storage decoupled cluster depends on the deployment of the metadata service. The variables in the above example are explained as follows:

`{beImage}` is the image for deploying BE service.

:::tip Tip
cc1 is the name of the compute cluster. During SQL execution, you can select the cluster you want to use by using the compute cluster name.
:::


## Configuring multiple compute clusters

A `DorisDisaggregatedCluster` resource can deploy multiple compute clusters, each of which is independent of each other and operates independently.

The simplest deployment of two compute clusters is as follows:

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

The above is a simple configuration of two compute clusters, named cc1 and cc2. When using a Compute-storage decoupled cluster, you can select which compute cluster to use by the name of the compute cluster. In actual use, you can specify the cluster name according to the business category.

Modify the following configuration to the `DorisDisaggregatedCluster` resource that needs to deploy Compute-storage decoupled cluster [quick_start](../install-quickstart.md#Install DorisDisaggregatedCluster). You can deploy 2 compute clusters, one for 3 pods containing BE services, and one for 2 pods containing BE services. `{beImage}` specifies the image of the BE service you want to use.

:::tip Tip
The images used by multiple compute clusters should be kept consistent as much as possible.
:::

## Configure resources

Sets the CPU and Memory resource usage that can be used by the BE (Compute) container in each pod. Specify the CPU and Memory usage in [resources.requests and resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits).

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

The above configuration specifies the computing resources available for the compute cluster named cc1. You can fill in the information as needed and configure it in the [Deployment Compute-storage decoupled cluster](../install-quickstart.md#Install DorisDisaggregatedCluster) `DorisDisaggregatedCluster` resource. `{beImage}` is the BE image you want to use.

## Configure persistent storage

By default, each BE service will use the EmptyDir storage mode to cache data. In real usage scenarios, you need to define the required storage size and the StorageClass you want to use based on actual needs.

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

Configure 200Gi of persistent storage for the compute cluster named cc1, and use the default StorageClass in the K8s cluster to automatically create storage. If you need to specify a StorageClass, uncomment storageClassName to the name of the StorageClass you want to use.

The default Cache configuration of the BE service is `file_cache_path = [{"path":"/opt/apache-doris/be/storage","total_size":107374182400,"query_limit":107374182400}]` The total available storage capacity is 100Gi, and the maximum available query capacity is 100Gi. In K8s deployment mode, Doris-Operator mounts customized persistent storage for each path. If you need to specify multiple paths to mount multiple disks as data cache, please refer to [Customized configuration file](config-cc.md#Customize configuration files).

:::tip Tip
The value of file_cache_path must be a JSON array.
:::

## Customize configuration files

Under Compute-storage decoupled cluster, the BE service of each compute cluster is started by default using the configuration file in the image. In K8s deployment, the ConfigMap resource can be used to specify the BE startup configuration.

### Automatically add configuration

Under Compute-storage decoupled cluster, please refer to [Compute-storage decoupled Document](../../../../../compute-storage-decoupled/creating-cluster#beconf) for related configuration of BE service startup. In K8s deployment, `meta_service_endpoint`, `cloud_unique_id`, `meta_service_use_load_balancer`, `enable_file_cache` do not need to be filled in.

`meta_service_endpoint` Related services in K8s deployment will automatically generate real address information based on the `DorisDisaggregatedMetaService` information configured in `DorisDisaggregatedCluster` and automatically add it.

`cloud_unique_id` is automatically added to the relevant services in K8s deployment, no need to specify.

`meta_service_use_load_balancer` is automatically added to the relevant services in K8s deployment with a default value of false.

`enable_file_cache` is automatically set to the default value of true for the relevant services in K8s deployment.

### Service storage configuration

The BE service customizes the startup configuration in Compute-storage decoupled mode, and must specify `file_cache_path` according to the [Compute-storage decoupled document](../../../../../compute-storage-decoupled/creating-cluster#beconf). In K8s deployment, the relevant services will automatically mount persistent storage according to the [persistence related configuration](config-cc.md#Configure persistent storage).

For example: `file_cache_path` is configured as `file_cache_path = [{"path":"/opt/apache-doris/be/storage","total_size":107374182400,"query_limit":107374182400}]`, Doris-Operator related services automatically add storage configuration information for the computing service, which can apply for a disk with a mount point of `/opt/apache-doris/be/storage` and a capacity of 100Gi.

When total_size in file_cache_path is greater than the storage capacity of [persistent configuration](config-cc.md#Configure persistent storage), Doris-Operator will change the persistent configuration to the size of total_size to prevent unexpected service failures.

### Mount customized ConfigMap

After the configuration file is prepared according to the above rules, deploy it to the namespace of the `DorisDisaggregatedCluster` deployment, and modify the `DorisDisaggregatedCluster` resource to be deployed to specify which compute cluster to start with the customized configuration.

For example, the startup configuration is as follows:

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

The configuration that specifies the compute cluster to use the above ConfigMap is as follows:
```yaml
spec:
  computeClusters:
  - name: cc1
    image: {beImage}
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

After modifying the configuration, update the configuration information to the deployed [DorisDisaggregatedCluster](../install-quickstart.md#Install DorisDisaggregatedCluster) resource.

:::tip Tip
All startup configurations must be mounted in the /etc/doris directory.
::: 
