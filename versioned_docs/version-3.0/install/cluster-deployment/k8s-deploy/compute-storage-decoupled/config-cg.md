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
1. Customize the startup configuration.  
2. Deploy the ConfigMap containing the startup configuration.  
3. Update the DorisDisaggregatedCluster resource.

### Step 1: Customize the Startup Configuration
In the default deployment, each BE service in a compute group uses the default configuration file inside the image. To enable persistent cache, a custom startup configuration is required. Doris Operator uses Kubernetes' ConfigMap to mount the startup configuration file. Below is an example of a ConfigMap that can be used for BE services:
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
In a storage-computation separation cluster, the BE service's startup configuration must set file_cache_path. For details on configuring be.conf for storage-computation separation, refer to the section on [Configuring be.conf](../../../../compute-storage-decoupled/compilation-and-deployment.md#541-configure-beconf). In the example above, a persistent cache is set to the directory `/mnt/disk1/doris_cloud/file_cache`, with a total persistent storage size of 100 Gi and a query cache size of 100 Gi.

### Step 2: Deploy the ConfigMap containing the startup configuration
Use the following command to deploy the ConfigMap with the custom startup configuration to the Kubernetes cluster:
```shell
kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml 
```
Where ${namespace} is the namespace where the DorisDisaggregatedCluster is deployed, and ${beConfigMapFileName} is the filename containing the custom ConfigMap.

### Step 3: Update the `DorisDisaggregatedCluster` resource
To enable persistent storage, a storage template must be configured. The `DorisDisaggregatedCluster` resource uses `persistentVolume` to describe the persistent storage template. The template is defined using Kubernetes' [PersistentVolumeClaimSpec](https://kubernetes.io/docs/reference/kubernetes-api/config-and-storage-resources/persistent-volume-claim-v1/#PersistentVolumeClaimSpec). In the persistent storage template, multiple mount paths can be specified through `mountPaths`. 
If `mountPaths` is not set, Doris Operator will automatically parse the `file_cache_path` from the startup configuration to determine the mount point and use the template to create persistent storage. The `annotations` field is where custom annotations can be added.  
By default, Doris Operator creates persistent storage for logs. If the Kubernetes cluster has a log collection system that can collect logs from Doris services via standardized output, persistent storage for logs can be disabled by setting `logNotStore: true`. Below is an example of how to use a custom ConfigMap and set up a storage template for BE services:
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
In the `configMaps` configuration, the name of the custom ConfigMap is specified, along with the mount path within the container. In the storage template `persistentVolume`, `logNotStore: true` is set to disable persistent storage for logs. Two annotations are added for each persistent storage, and the persistent storage specifications are configured. Once the configuration is complete, update the required `DorisDisaggregatedCluster` resource.  
Doris Operator will use the [default StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/#default-storageclass) in the Kubernetes cluster to create persistent storage for the service. You can specify the desired StorageClass by setting storageClassName.

:::tip Tip  
The startup configuration must be mounted to the "/etc/doris" directory.  
:::
