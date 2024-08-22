---
{
"title": "Config and install FE",
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

In the Compute-storage decoupled mode, FE is mainly responsible for SQL parsing related work and is also responsible for interacting with the metadata management component MS. FE usually only needs to deploy 2 services and set the replicas to 2. The simplest deployment mode is as follows:

```yaml
spec:
  feSpec:
    image: {feImage}
    replicas: 2
```

Configure the FE service image to be used, and update the configuration to the [Compute-storage decoupled resources to be deployed](../install-quickstart.md#Install DorisDisaggregatedCluster).

## Configure resources

### Configure computing resources for services

Add computing resource configuration for FE services. `DorisDisaggregatedCluster` reuses K8s requests and limits to configure resource usage for each component. The following is how to configure FE services using 4c 4Gi:

```yaml
spec:
  feSpec:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

The above example shows how to configure the computing resources of the FE service to 4c 4Gi mode. After configuring the resources that FE wants to use, update the configuration information to [Compute-storage decoupled resources to be deployed](../install-quickstart.md#Install DorisDisaggregatedCluster).

### Configure service storage resources

The Compute-storage decoupled cluster FE service is a stateful service. In the K8s deployment mode, the corresponding disk needs to be mounted to store the storage information that the FE service needs to persist.

The following is an example of using the default [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/) to provide storage services for FE configuration:

```yaml
spec:
  feSpec:
    persistentVolume:
      persistentVolumeClaimSpec:
        #storageClassName：{storageClassName}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 200Gi
```

The above example shows how to add 200Gi storage to the FE service. `{storageClassName}` is the name of the StorageClass to be used. If it is not filled in, the default StorageClass of the cluster will be used. After configuring the storage information required by the FE service according to the above mode, update the configuration to [Compute-storage decoupled resources to be deployed](../install-quickstart.md#Install DorisDisaggregatedCluster).

## Customized configuration file

In K8s deployment, you can use ConfigMap to mount customized configuration for the FE service to start the FE service. Assume that the following configuration is used to start the FE service:

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

In K8s deployment, `enable_fqdn_mode=true` must be set. FE uses the `DorisDisaggregatedCluster` resource sample of the above ConfigMap:

```yaml
spec:
  feSpec:
    replicas: 2
    configMaps:
    - name: fe-configmap
```

In the `DorisDisaggregatedCluster` resource, the configMaps for mounting ConfigMap is an array. The name of each element represents the ConfigMap name of the current namespace.

Configure the ConfigMap information required by the FE service according to the above mode, and update the configuration to [Compute-storage decoupled resources to be deployed](../install-quickstart.md#Install DorisDisaggregatedCluster).

:::tip Tip
In K8s deployment, when using ConfigMap to mount customized configuration files, there is no need to add `meta_service_endpoint` and `cloud_unique_id` configurations, and Doris-Operator related services will be added automatically.
:::
