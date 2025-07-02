---
{
   "title": "Config ComputeGroups",
   "language": "en"
}
---

In a decoupled storage and compute cluster, the Compute Group is responsible for importing data and caching data from object storage to enhance query performance. Compute groups are isolated from each other.

## Minimal Compute Group Configuration
A compute group is a collection of BE nodes that perform identical tasks. When configuring the `DorisDisaggregatedCluster` resource, each compute group must be assigned a unique identifier that also serves as its name, which cannot be modified once set. A minimal compute group configuration consists of three components: `uniqueId`, `image`, and `replicas`. For example:
```yaml
spec:
  computeGroups:
   - uniqueId: ${uniqueId}
     image: ${beImage}
     replicas: 1
```
Here, `${beImage}` is the image used to deploy the BE service; please use the image provided by the [Apache Doris official repository](https://hub.docker.com/r/apache/doris). `${uniqueId}` is the unique identifier and name of the compute group, which must match the pattern `[a-zA-Z][0-9a-zA-Z_]+`. The `replicas` field specifies the number of BE nodes within the compute group.

## Configuring Multiple Compute Groups
The `DorisDisaggregatedCluster` resource supports the deployment of multiple independent compute groups. The following example shows a configuration with two compute groups, `cg1` and `cg2`:
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
In this example, compute group `cg1` has 3 replicas, and compute group `cg2` has 2 replicas. Although compute groups are isolated, it is recommended that the BE nodes within each group use the same image across the decoupled cluster.

## Configure Compute Resources
In the default deployment sample for a decoupled cluster, there are no resource restrictions on the BE service. The `DorisDisaggregatedCluster` resource uses Kubernetes [resources.requests and resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#requests-and-limits) to specify CPU and memory resources. For example, to allocate 8 CPU cores and 8Gi memory for the BE nodes in compute group `cg1`, use the following configuration:
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

Apply this configuration to the appropriate [DorisDisaggregatedCluster resource](install-doris-cluster.md#step-3-deploy-the-compute-storage-decoupled-cluster).

## Access Configuration
By default, compute groups do not expose services externally. The Doris Operator provides a Service as a proxy for compute groups within the `DorisDisaggregatedCluster` resource. Three service exposure modes are supported: `ClusterIP`, `NodePort`, and `LoadBalancer`.

### ClusterIP
Kubernetes uses the [ClusterIP service type](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip) by default, which provides an internal address within the cluster.

#### Step 1: Configure the Service Type as ClusterIP
Doris is configured to use ClusterIP mode by default in Kubernetes; no additional configuration is required.

#### Step 2: Obtain the Service Access Address
After deploying the cluster, use the following command to view the Service exposed for the compute group:
```yaml
kubectl -n doris get svc
```
A sample output is:
```yaml
NAME                                     TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-cg1           ClusterIP   10.152.183.154   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   2d
```
This output shows the Service for the compute group with a `uniqueId` of `cg1` in the `doris` namespace.

### NodePort
If external access to Doris is required from outside the Kubernetes cluster, the [NodePort service type](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport) can be used. NodePort supports two configuration methods: static host port mapping and dynamic host port assignment.
- Dynamic Host Port Assignment:
  If no explicit port mapping is provided, Kubernetes will automatically assign an unused host port (default range: 30000–32767) when the pod is created.
- Static Host Port Mapping:
  If a port mapping is specified, and the host port is available, Kubernetes will allocate that port. For static assignment, you must plan the port mappings. Doris provides the following port for external interactions:

| Port Name | Default Port	 | Description                     |
|--| ---- |--------------------------|
| Web Server Port | 8040 | The HTTP server port on BE, used to view BE information.|

#### Static Configuration
For compute group `cg1`, the static NodePort configuration is as follows:
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
In this configuration, the BE listening port 8040 for compute group `cg1` is mapped to host port 31012.

#### Dynamic Configuration
For compute group `cg1`, the dynamic NodePort configuration is as follows:
```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      service:
        type: NodePort
```

### LoadBalancer Mode
The [LoadBalancer service](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) type is applicable in cloud-based Kubernetes environments and is provided by the cloud provider's load balancer.
Set the `computeGroup.service` type to LoadBalancer, as shown:
```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

## Custom Startup Configuration
1. Create a Custom ConfigMap Containing Startup Information
   In the default deployment, each compute group's BE service starts with a default configuration file embedded in the image. The Doris Operator uses a Kubernetes ConfigMap to mount a custom startup configuration file. Below is an example ConfigMap for a BE service:
    ```yaml
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: be-configmap
      labels:
        app.kubernetes.io/component: be
    data:
      be.conf: |
        # For JDK 17, these JAVA_OPTS serve as the default JVM options
        JAVA_OPTS_FOR_JDK_17="-Xmx1024m -DlogPath=$LOG_DIR/jni.log -Xlog:gc*:$LOG_DIR/be.gc.log.$CUR_DATE:time,uptime:filecount=10,filesize=50M -Djavax.security.auth.useSubjectCredsOnly=false -Dsun.security.krb5.debug=true -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -XX:+IgnoreUnrecognizedVMOptions --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.security.jgss/sun.security.krb5=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED"
        file_cache_path = [{"path":"/opt/apache-doris/be/file_cache","total_size":107374182400,"query_limit":107374182400}]
    ```
   The startup configuration for the BE service in a decoupled cluster must include the file_cache_path setting. For the required format, please refer to the [Doris decoupled configuration for be.conf](./../../../compute-storage-decoupled/compilation-and-deployment.md#541-configure-beconf).

2. Deploy the ConfigMap
   Use the following command to deploy the custom ConfigMap containing the startup configuration to the Kubernetes cluster:
    ```yaml
    kubectl -n ${namespace} -f ${beConfigMapFileName}.yaml
    ```
   Here, `${namespace}` is the namespace where the `DorisDisaggregatedCluster` is deployed, and `${beConfigMapFileName}` is the name of the file containing the custom ConfigMap.

3. Update the DorisDisaggregatedCluster Resource to Use the ConfigMap
   Modify the resource to mount the ConfigMap at the required location, as shown below:
    ```yaml
    spec:
      computeGroups:
      - uniqueId: cg1
        configMaps:
        - name: be-configmap
          mountPath: "/etc/doris"
    ```

:::tip Note
The startup configuration must be mounted at the `/etc/doris` directory.
:::

## Persistent Storage Configuration
In the default deployment, the BE service uses Kubernetes [`EmptyDir`](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) as its cache. The EmptyDir mode is non-persistent; thus, cache data is lost upon service restart, potentially reducing query performance. To ensure that cached data is preserved after a restart and to maintain query performance, persistent storage must be configured. The BE service logs are both output to the standard output and written to the directory specified by `LOG_DIR` in the startup configuration. When using a storage template, persistent storage is also applied to the logs.

### Automatically Generating Persistent Storage with a Storage Template
For compute group `cg1`, persistent storage for logs and cache data can be configured using a storage template, as shown below:
```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      persistentVolumes:
        - persistentVolumeClaimSpec:
            # storageClassName: ${storageclass_name}
            accessModes:
              - ReadWriteOnce
            resources:
              requests:
                storage: 500Gi
```
After deploying the cluster with this configuration, the Doris Operator automatically mounts persistent storage for the log directory (default `/opt/apache-doris/be/log`) and the cache directory (default `/opt/apache-doris/be/file_cache`). If the log or cache directory is explicitly specified in the [custom startup configuration](#custom-startup-configuration), the Doris Operator will automatically parse and mount the persistent storage accordingly. Persistent storage is implemented using the [StorageClass mechanism](https://kubernetes.io/docs/concepts/storage/storage-classes/), which allows specifying the required StorageClass using the `storageClassName` field.

### Custom Mount Point Configuration
The Doris Operator supports customized storage configurations for mount points. The following example demonstrates a custom configuration for the log directory:
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
        - persistentVolumeClaimSpec:
            # storageClassName: ${storageclass_name}
            accessModes:
              - ReadWriteOnce
            resources:
              requests:
                storage: 500Gi
```
In the above configuration, the log directory is mounted using a custom storage configuration with 300Gi, while the cache directory is mounted using the storage template with 500Gi.

:::tip Note
If the `mountPaths` array is empty, it indicates that the current storage configuration is using the template configuration.
:::

### Disable Log Persistence
If log persistence is not required and logs should only be output to the standard output, configure as follows:
```yaml
spec:
  computeGroups:
    - uniqueId: cg1
      logNotStore: true
```