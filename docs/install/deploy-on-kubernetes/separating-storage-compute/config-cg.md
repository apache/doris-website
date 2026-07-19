---
{
    "title": "Configuring Compute Groups",
    "language": "en",
    "description": "A detailed guide to configuring Compute Groups, including replica configuration, multi-compute-group configuration, resource configuration, access mode configuration, startup parameter configuration, and persistent storage configuration.",
    "keywords": ["Doris", "Storage-Compute Decoupling", "Kubernetes", "Compute Group", "BE", "NodePort", "LoadBalancer", "Persistent Storage", "ConfigMap"]
}
---

A Compute Group is a collection of BE nodes that handle the same task. This document describes how to configure Compute Groups in the `DorisDisaggregatedCluster` resource by use case, mainly covering:

- **Basic deployment**: quick setup of a single compute group or multiple compute groups
- **Resource control**: limiting compute resources such as CPU and memory
- **Access control**: accessing BE services from inside or outside the cluster through different methods
- **Startup customization**: customizing BE startup parameters through ConfigMap
- **Data persistence**: persistent storage for cache, logs, and StreamLoad staging data

## Scenario 1: Quickly Set Up a Single Compute Group

### Minimal Configuration

The simplest compute group configuration contains only 3 fields:

```yaml
spec:
  computeGroups:
  - uniqueId: ${uniqueId}
    image: ${beImage}
    replicas: 1
```

### Field Descriptions

| Field | Description |
|------|------|
| `uniqueId` | The unique identifier of the compute group, which is also the name of the compute group. Once set, it cannot be modified. The name must match the rule `[a-zA-Z][0-9a-zA-Z_]+` |
| `image` | The image address for deploying the BE service. Use the images provided by the [Apache Doris official image registry](https://hub.docker.com/r/apache/doris) |
| `replicas` | The number of BE service nodes in the compute group |

## Scenario 2: Deploy Multiple Compute Groups for Business Isolation

The `DorisDisaggregatedCluster` resource supports deploying multiple compute groups, and each compute group is independent of the others. The following example shows the configuration for deploying two compute groups named `cg1` and `cg2`:

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

The replica counts of each compute group are described as follows:

| Compute Group Name | Replicas |
|------|------|
| `cg1` | 3 |
| `cg2` | 2 |

Here, `${beImage}` represents the BE service image to be deployed.

:::tip Tip
Although compute groups are independent of each other, it is recommended that the BE service images used by all compute groups in the same storage-compute decoupled cluster remain consistent.
:::

## Scenario 3: Limit the Compute Resources of a Compute Group

In the [default deployment example](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) for storage-compute decoupling, no limits are placed on the compute resources used by the BE service. `DorisDisaggregatedCluster` uses Kubernetes [resources.requests and resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) to specify CPU and memory resources.

For example, to configure the BE in the compute group named `cg1` to use 8c 8Gi of resources:

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

Update the configuration above into the [`DorisDisaggregatedCluster` resource](./install-doris-cluster.md#2-modify-key-configurations) to be deployed for it to take effect.

## Scenario 4: Configure the Access Method of a Compute Group

By default, a compute group does not directly expose services externally. Doris Operator provides a Service in the `DorisDisaggregatedCluster` resource as an access proxy for the compute group. The Service supports three external exposure modes. Choose the one that fits your access source:

| Access Mode | Applicable Scenario | Characteristics |
|------|------|------|
| `ClusterIP` | Access from within the Kubernetes cluster | Default mode, providing an internal cluster address |
| `NodePort` | Access from outside a self-managed Kubernetes cluster | Exposes services through host machine ports |
| `LoadBalancer` | Access from outside a cloud platform Kubernetes cluster | A load balancer provided by the cloud service provider |

### 4.1 ClusterIP (Access Within the Cluster)

The [ClusterIP access mode](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip) provides an internal address within the Kubernetes cluster, which serves as the entry point for accessing the service inside Kubernetes.

#### Step 1: Configure ClusterIP as the Service Type

Doris enables the ClusterIP access mode on Kubernetes by default. You can use it without additional configuration.

#### Step 2: Get the Service Access Address

After deploying the cluster, use the following command to view the Service exposed by the compute group:

```shell
kubectl -n doris get svc
```

The result is as follows:

```shell
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```

In the result above, the externally usable Service for the compute group with `uniqueId` `cg1` under the namespace `doris` is obtained.

### 4.2 NodePort (External Access for Self-Managed Clusters)

To access Doris from outside the Kubernetes cluster, choose the [NodePort mode](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). The NodePort mode provides two port allocation methods:

| Allocation Method | Description |
|------|------|
| Dynamic host port allocation | When no port mapping is explicitly set, Kubernetes automatically allocates an unused host port (default range 30000-32767) when creating the Pod |
| Static host port allocation | When a port mapping is explicitly specified, Kubernetes will assign that fixed port if the host port is unoccupied and has no conflict |

Static allocation requires planning the port mapping. Doris provides the following ports for interaction with the outside:

**Table 1: BE Service Port Descriptions**

| Port Name | Default Port | Port Description |
|------|------|------|
| Web Server Port | 8040 | The HTTP server port on the BE, used to view BE information |

#### Static Allocation Configuration

The following example maps port 8040 on the BE in the compute group named `cg1` to port 31012 on the host:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
      portMaps:
      - nodePort: 31012
        targetPort: 8040
```

#### Dynamic Allocation Configuration

The configuration for the compute group named `cg1` to use the dynamic NodePort access mode is as follows:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: NodePort
```

### 4.3 LoadBalancer (External Access in Cloud Environments)

The [LoadBalancer mode](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) is suitable for Kubernetes environments on cloud platforms and uses a load balancer provided by the cloud service provider. Set the type to `LoadBalancer` in `computeGroup.service` as shown below:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## Scenario 5: Customize the BE Startup Configuration

In the default deployment, the BE service of each compute group starts with the default configuration file inside the image. Doris Operator uses Kubernetes ConfigMap to mount custom startup configuration files. The overall flow is as follows:

| Stage | Description |
|------|------|
| Input | A custom `be.conf` configuration file |
| Operation | Create a ConfigMap and mount it to the `/etc/doris` directory |
| Output | The BE service of the compute group starts with the custom configuration |

### Step 1: Create a ConfigMap That Contains the Startup Information

The following shows an example of a ConfigMap that can be used by a BE service:

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
    file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]
    deploy_mode = cloud
```

:::tip Tip
The startup configuration of the BE service in a storage-compute decoupled cluster must set `file_cache_path`. For the format, refer to the [Storage-Compute Decoupled `be.conf` configuration](../../deploy-manually/separating-storage-compute-deploy-manually) section.
:::

### Step 2: Deploy the ConfigMap

Use the following command to deploy the ConfigMap containing the custom startup configuration to the Kubernetes cluster:

```shell
kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml
```

Parameter descriptions:

| Parameter | Description |
|------|------|
| `${namespace}` | The namespace where the `DorisDisaggregatedCluster` is deployed |
| `${beConfigMapFileName}` | The file name containing the custom ConfigMap |

### Step 3: Update the DorisDisaggregatedCluster Resource

Update the [`DorisDisaggregatedCluster` resource](./install-doris-cluster.md#2-modify-key-configurations) to mount the ConfigMap. The configuration is as follows:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    configMaps:
    - name: be-configmap
      mountPath: "/etc/doris"
```

:::tip Tip
The startup configuration must be mounted to the `/etc/doris` directory.
:::

## Scenario 6: Configure Persistent Storage for a Compute Group

In the default deployment, the BE service uses Kubernetes [EmptyDir](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/#emptydir) as the cache for the service. The `EmptyDir` mode is a non-persistent storage mode. After the service restarts, the cached data is lost, and query efficiency is reduced accordingly.

To ensure that the BE service does not lose cached data after a restart and that query efficiency is not reduced, you need to persist the cached data. The key storage paths involved in the BE service are as follows:

| Storage Path | Purpose |
|------|------|
| BE log directory | BE service logs are output to standard output and also written to the directory specified by `LOG_DIR` in the startup configuration |
| `/opt/apache-doris/be/storage` | The staging location for data when importing in StreamLoad mode, used to prevent the loss of staged data after an abnormal service restart |
| BE cache directory | Query cache. Data loss after a restart reduces query efficiency |

### 6.1 Persistent Storage Example

The following is a sample configuration for mounting persistent storage for data that needs to be persisted:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    persistentVolumes:
    - mountPaths:
      - /opt/apache-doris/be/log
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - mountPaths:
      - /opt/apache-doris/be/storage
      persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 300Gi
    - persistentVolumeClaimSpec:
        # storageClassName: ${storageclass_name}
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 500Gi
```

Description of the configuration above:

- The log directory uses a custom storage configuration and mounts a 300Gi storage disk
- The directory used for WAL and StreamLoad imports is configured to mount a 300Gi storage disk
- The cache directory uses the storage template and mounts a 500Gi storage disk

:::tip Tip
If the `mountPaths` array is empty, the current storage configuration is treated as a template configuration.
:::

### 6.2 Do Not Persist Logs

If you do not want to persist logs and only output them to standard output, configure as follows:

```yaml
spec:
  computeGroups:
  - uniqueId: cg1
    logNotStore: true
```
