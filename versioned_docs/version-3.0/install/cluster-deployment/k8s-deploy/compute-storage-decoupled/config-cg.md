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

The Compute Group with storage and computing separation is responsible for data import and caching data in object storage. Compute Groups are isolated from each other.

## Specify the name of the Compute Group

The following configuration deploys a minimal Compute Group:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: {beImage}
    replicas: 1
```

The above configuration deploys a Compute Group named cg1. The deployment of the Compute Group depends on the deployment of the FE service. The storage and computing separation cluster depends on the deployment of the metadata service. The above sample variables are explained as follows:

`{beImage}` is the image for deploying the BE service.

:::tip Tip
cg1 is the name of the Compute Group. During the execution of SQL, you can select the cluster you want to use by the name of the Compute Group.
:::

## Configure multiple Compute Groups

A `DorisDisaggregatedCluster` resource can deploy multiple Compute Groups. Each Compute Group is independent of each other and operates independently.

The simplest deployment of two Compute Groups is as follows:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: {beImage}
    replicas: 3
  - uniqueId: cg2
    image: {beImage}
    replicas: 2
```

The above is a simple configuration of two Compute Groups, with the cluster names cg1 and cg2 respectively. When using a storage-computing separation cluster, you can select which Compute Group to use by the name of the Compute Group. In actual use, you can specify the cluster name according to the business category.

Modify the following configuration to the `DorisDisaggregatedCluster` resource that needs to [Deploy storage-computing separation](install-quickstart.md#step-2-quickly-deploy-a-storage-and-computing-separation-cluster) to deploy 2 Compute Groups, one of which can deploy 3 pods containing BE services, and the other can deploy 2 pods containing BE services. `{beImage}` specifies the image of the BE service you want to use.

:::tip Tip
Keeping the image used by multiple Compute Groups consistent.
:::

## Configure service computing resources

Set the CPU and Memory resource usage available to the BE (Compute Service) container in each pod. Specify the CPU and Memory usage in [resources.requests and resources.limits].

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: {beImage}
    requests:
      cpu: 4
      memory: 8Gi
    limits:
      cpu: 4
      memory: 8Gi
```

The above configuration specifies the computing resources available to the Compute Group named cg1. You can fill in as needed and configure it in the [Deploy storage and computing separation](install-quickstart.md#step-2-quickly-deploy-a-storage-and-computing-separation-cluster) `DorisDisaggregatedCluster` resource. `{beImage}` is the BE image you want to use.

## Configure persistent storage

By default, each BE service uses the EmptyDir storage mode to cache data. In real usage scenarios, you need to define the required storage size and the StorageClass you want to use according to actual needs.

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    persistentVolume:
      persistentVolumeClaimSpec:
        #storageClassName：{storageClassName}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: "200Gi"
```
Configure 200Gi of persistent storage for the Compute Group named cg1, and use the default StorageClass in the K8s cluster to automatically create storage. If you need to specify a StorageClass, uncomment storageClassName and set it to the name of the StorageClass you want to use.

The default Cache configuration of the BE service is `file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]` The total available storage capacity is 100Gi, and the maximum available query capacity is 100Gi. In K8s deployment mode, Doris-Operator mounts customized persistent storage for each path. If you need to specify multiple paths to mount multiple disks as data cache, please refer to [Customized configuration file](config-cg.md#Service storage configuration).

:::tip Tip
The value of file_cache_path must be a JSON array.
:::

## Customized configuration file

Under storage-computing separation, the BE service of each Compute Group is started by default using the configuration file in the image. In K8s deployment, the ConfigMap resource can be used to specify the BE startup configuration.

### Automatically add configuration

Under storage-computing separation, please refer to [Storage-computing separation document](../../../../compute-storage-decoupled/compilation-and-deployment) for relevant configuration of BE service startup. In K8s deployment, `deploy_mode`, do not need to be filled in.

### Service storage configuration

BE service customized configuration startup configuration in storage and computing mode, must specify `file_cache_path` according to [storage and computing separation document](../../../../compute-storage-decoupled/compilation-and-deployment). In K8s deployment, related services will automatically mount persistent storage according to [persistence-related configuration](config-cg.md#Configure persistent storage).

For example: `file_cache_path` is configured as `file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]`, Doris-Operator related services automatically add storage configuration information for computing services, which can apply for a disk with a mount point of `/opt/apache-doris/be/file_cache` and a capacity of 100Gi.

When total_size in file_cache_path is greater than the storage capacity of [persistence configuration](config-cg.md#Configure persistent storage), Doris-Operator will change the persistence configuration to the size of total_size to prevent unexpected service failures.

### Mount customized ConfigMap

After the configuration file is prepared according to the above rules, deploy it to the namespace of the `DorisDisaggregatedCluster` deployment, and modify the `DorisDisaggregatedCluster` resource to be deployed to specify which Compute Group to start with the customized configuration.

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

The configuration that specifies the Compute Group to use the above ConfigMap is as follows:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: {beImage}
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

After modifying the configuration, update the configuration information to the deployed [DorisDisaggregatedCluster](install-quickstart.md#step-2-quickly-deploy-a-storage-and-computing-separation-cluster) resource.

:::tip Tip
All startup configurations must be mounted in the /etc/doris directory.
::: 
