---
{
"title": "Config ComputeGroups",
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

In a storage-computation separation cluster, the compute group (Compute Group) is responsible for data import and caching data from object storage to improve query efficiency. Compute groups are isolated from one another.
## Specify compute group name
Each compute group must have a unique identifier, which cannot be changed once set. This unique identifier is used as the compute group name and is registered as a node attribute in the storage-computation separation cluster. Below is an example of a compute group configuration named cg1, with 1 replica:
```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      image: ${beImage}
      replicas: 1
```
Here, ${beImage} refers to the image address for deploying the BE service.
## Configure multiple compute groups
A `DorisDisaggregatedCluster` resource supports the deployment of multiple compute groups, with each group being independent of the others. Below is an example showing how to deploy two compute groups, `cg1` and `cg2`:
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
In this configuration, the compute group `cg1` has 3 replicas, and `cg2` has 2 replicas. ${beImage} represents the image address used for deploying the BE service.  
It is recommended to use the same image across all compute groups.

## Configure compute resources
In the default storage-computation separation deployment, no specific limits are set for the compute resources (CPU and memory) used by each BE service. The DorisDisaggregatedCluster resource uses Kubernetes' [resources.requests and resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) to specify CPU and memory usage. Below is an example of configuring each BE in the cg1 compute group to use 8 CPU cores and 8 Gi of memory:
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
Update the above configuration in the required [DorisDisaggregatedCluster resource](install-quickstart.md#step-3-deploy-the-compute-storage-decoupled-cluster).

## Configure Cache persistent
In the default deployment, BE services use Kubernetes' [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) as the cache storage. The EmptyDir mode is non-persistent, meaning that cached data will be lost after a service restart, leading to a drop in query efficiency. The steps to configure persistent storage for the cache are as follows:  

1. Create a custom ConfigMap containing the startup information.  
  In the default deployment, each compute group’s BE service starts using the default configuration file from the image. To persist cache data, a custom startup configuration is needed. Doris Operator uses Kubernetes' ConfigMap to mount the startup configuration file. 
  Below is an example of a ConfigMap that a BE service can use:
  ```yaml
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: be-configmap
    labels:
      app.kubernetes.io/component: be
  data:
    be.conf: |
      # For JDK 17, this JAVA_OPTS will be used as default JVM options
      JAVA_OPTS_FOR_JDK_17="-Xmx1024m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED"
      file_cache_path = [{"path":"/mnt/disk1/doris_cloud/file_cache","total_size":107374182400,"query_limit":107374182400}]
  ```
  For decoupled compute-storage clusters, the BE service's startup configuration must include file_cache_path. For formatting details, refer to the [Decoupled Compute-Storage Configuration be.conf section](../../../../compute-storage-decoupled/compilation-and-deployment.md#541-configure-beconf). In the example above, a persistent cache is configured at the directory `/mnt/disk1/doris_cloud/file_cache`, with a total persistent capacity of 100Gi and a query cache limit of 100Gi.

2. Deploy the ConfigMap.  
  To deploy the ConfigMap containing the custom startup configuration to the Kubernetes cluster, use the following command:
  ```shell
  kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml 
  ```
  Here, ${namespace} refers to the namespace where the DorisDisaggregatedCluster is deployed, and ${beConfigMapFileName} is the filename of the custom ConfigMap.
3. Configure the DorisDisaggregatedCluster Resource  
  Persistent storage requires a storage template configuration. The DorisDisaggregatedCluster resource uses persistentVolume to describe the persistent storage template. The template is specified using Kubernetes' [PersistentVolumeClaimSpec](https://kubernetes.io/docs/reference/kubernetes-api/config-and-storage-resources/persistent-volume-claim-v1/#PersistentVolumeClaimSpec).  
  Doris Operator will automatically parse the `file_cache_path` in the startup configuration to identify the mount points, and use the template to automatically generate persistent storage. The annotations will be added into [PersistentVolumeClaim](https://kubernetes.io/docs/reference/kubernetes-api/config-and-storage-resources/persistent-volume-claim-v1/). By default, Doris Operator creates persistent storage for logs, but this can be disabled by setting `logNotStore: true`. Below is an example where a BE service uses a custom ConfigMap and specifies a storage template:
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
          #storageClassName: ${storageClassName}
          accessModes:
          - ReadWriteOnce
          resources:
            requests:
              storage: 500Gi
  ```
  Doris Operator will use the [default StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/#default-storageclass) in the Kubernetes cluster to create persistent storage for the service. You can specify a custom StorageClass by setting the storageClassName field.

:::tip Tip  
The startup configuration must be mounted to the "/etc/doris" directory.  
:::
