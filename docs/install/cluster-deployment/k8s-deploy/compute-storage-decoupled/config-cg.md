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

The Compute Group (BEs) is responsible for data import and caching data in storage-computing separation mode, Compute Groups are isolated from each other.

## Specify the name of compute group

The following configuration deploys a minimal Compute Group:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: {beImage}
    replicas: 1
```

The above configuration deploys a Compute Group uniqueId is cg1. The deployment of the Compute Group depends on the FE service is available. The above sample variables are explained as follows:

`{beImage}` is the image for deploying the BE service.

:::tip Tip  
cg1 is the uniqueId of the Compute Group, also as the name of compute group. Please use the uniqueId as compute group's name, During the execution of SQL.     
:::

## Configure multiple compute groups

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

The above is a simple configuration of two Compute Groups, with the cluster name are cg1 and cg2 respectively. When using a storage-computing separation cluster, you can select which Compute Group to use by the name. In actual use, you can specify the compute group name according to the business category.

Modify the following configuration to the `DorisDisaggregatedCluster` resource when [Deploy storage-computing separation cluster](install-quickstart.md#step-2-quickly-deploy-a-storage-and-computing-separation-cluster) to deploy 2 Compute Groups, one of which can deploy 3 pods containing BE services, and the other can deploy 2 pods containing BE services. `{beImage}` specifies the image of the BE service you want to use.

:::tip Tip  
Keeping the image used by multiple Compute Groups consistent.  
:::

## Configure computing resources

Set the CPU and Memory resource usage available to the BE (Compute Service) container in each pod. Specify the CPU and Memory usage in [resources.requests and resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits).

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

The above configuration specifies 4c,8Gi computing resources to the Compute Group "cg1". You can config as need when [eploy storage and computing separation cluster](install-quickstart.md#step-2-quickly-deploy-a-storage-and-computing-separation-cluster). `{beImage}` is the BE image you want to use.

## Configure cache persistent storage

By default, each BE service uses the [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) to cache. In real usage scenarios, please config the Cache with persistent storage.

### 1.Custom start configuration
In default, BE using the configuration file in the image to start. In K8s deployment, please use the ConfigMap resource to specify the BE startup configuration. In [Mount Customized ConfigMap](#3mount-customized-configmap) shows a example format of Configmap, refer to [Storage-computing separation document](../../../../compute-storage-decoupled/compilation-and-deployment.md#541-configure-beconf) to configure the startup parameters on ConfigMap. `deploy_mode`is not needed be filled in.

### 2.Custom storage configuration

Config Cache is required in storage-computing separation mode of start BE, please specify `file_cache_path` according to [storage and computing separation start configuration document](../../../../compute-storage-decoupled/compilation-and-deployment.md#541-configure-beconf). Doris-Operator will automatically mount persistent storage according to [persistent volume template](#4config-the-persistent-volume-template).

For example: `file_cache_path` is configured as `file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]`, Doris-Operator related services automatically add storage configuration information for computing services, which can apply for a disk with a mount point of `/opt/apache-doris/be/file_cache` and a capacity of 100Gi.

When total_size in file_cache_path is greater than the storage capacity of [persistent volume template](#4config-the-persistent-volume-template), Doris-Operator will use the max size to the mount persistent volume.

### 3.Mount customized configMap

After the configuration file is prepared according to the above rules, deploy it to the namespace of the `DorisDisaggregatedCluster` deployment, after deployed configmap, please config the compute group described in `DorisDisaggregatedCluster` resource to start with the customized configuration.

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

The below describe "cg1" Compute Group to use the above ConfigMap to start:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    image: {beImage}
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

Update the configuration to the Doris [DorisDisaggregatedCluster](install-quickstart.md#step-2-quickly-deploy-a-storage-and-computing-separation-cluster) resource that to be deployed.

### 4.Config the persistent volume template
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
            storage: "100Gi"
```
Above, Describe cg1 compute group use 100Gi persistent storage and the persistent storage will create by default [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/).
In K8s deployment mode, Doris-Operator mounts customized persistent storage for each path. If you need to specify multiple paths to mount multiple disks as data cache, please refer to [Custom Storage Configuration](#2custom-storage-configuration).

:::tip Tip
- The value of file_cache_path must be a JSON array.
- All startup configurations must be mounted in the /etc/doris directory.  
::: 
