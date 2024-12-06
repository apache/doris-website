---
{
"title": "Config FE",
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

In the storage-computation separation mode, the FE (Frontend) is primarily responsible for SQL parsing and interacts with the metadata management component, MetaService. FE supports distributed deployment, and by default, it uses a master-observer configuration. Doris Operator supports deploying the storage-computation separation mode on Kubernetes for Doris versions 3.0.2 and above.
## Resource configuration
### Configuring compute resources
By default, FE deployments on Kubernetes do not limit resource usage. The DorisDisaggregatedCluster uses Kubernetes' [requests and limits](https://kubernetes.io/zh-cn/docs/concepts/configuration/manage-resources-containers/) to configure compute resources. To allocate 8 CPU cores and 8 Gi of memory to the FE service, use the following configuration:
```yaml
spec:
  feSpec:
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
```
Update the above configuration in the [DorisDisaggregatedCluster resource](install-quickstart.md#step-3-deploy-the-compute-storage-decoupled-cluster).

### Configuring storage resources
The FE service in the storage-computation separation cluster is a stateful service. When deployed on Kubernetes, it requires persistent storage for metadata. Doris Operator automatically mounts the persistent storage based on the configuration of the metadata storage directory and the storage template. Add the following configuration to the [DorisDisaggregatedCluster resource](install-quickstart.md#step-3-deploy-the-compute-storage-decoupled-cluster):
```yaml
spec:
  feSpec:
    persistentVolume:
      persistentVolumeClaimSpec:
        storageClassName: ${storageClassName}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: ${storageSize}
```
Here, ${storageClassName} is the name of the desired StorageClass. If not specified, the cluster’s default StorageClass will be used. ${storageSize} indicates the storage capacity you wish to allocate, and the format follows Kubernetes' [quantity notation](https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/), for example: 100Gi.

## Custom startup configuration
Doris Operator uses Kubernetes' ConfigMap to mount the startup configuration.  
1. Creating a Custom ConfigMap with Startup Configuration.  
  Below is an example of a ConfigMap for FE, which includes the startup configuration:
  ```yaml
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: fe-configmap
    namespace: default
    labels:
      app.kubernetes.io/component: fe
  data:
    fe.conf: |
      CUR_DATE=`date +%Y%m%d-%H%M%S`
      # Log dir
      LOG_DIR = ${DORIS_HOME}/log
      # For jdk 17, this JAVA_OPTS will be used as default JVM options
      JAVA_OPTS_FOR_JDK_17="-Djavax.security.auth.useSubjectCredsOnly=false -Xmx8192m -Xms8192m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=$LOG_DIR -Xlog:gc*:$LOG_DIR/fe.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens java.base/jdk.internal.ref=ALL-UNNAMED"
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
      enable_fqdn_mode=true
  ```
  In Kubernetes deployments, `enable_fqdn_mode=true` must be set.
2. Use the following command to deploy the ConfigMap:
  ```shell
  kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
  ```
  Where ${namespace} is the namespace of the DorisDisaggregatedCluster and ${feConfigMapName} is the filename containing the above configuration.  
3. Update the `DorisDisaggregatedCluster` resource as follows:
  ```yaml
  spec:
    feSpec:
      replicas: 2
      configMaps:
      - name: fe-configmap
  ```
  In the `DorisDisaggregatedCluster` resource, the `configMaps` field is an array, with each element’s `name` representing the name of the ConfigMap in the current namespace.
  
:::tip Tip  
1. In Kubernetes deployments, no need to manually set `meta_service_endpoint`, `deploy_mode`, or `cluster_id` in the startup configuration. These are automatically handled by Doris Operator services.  
2. When customizing the startup configuration in Kubernetes, always set `enable_fqdn_mode=true`.  
:::
