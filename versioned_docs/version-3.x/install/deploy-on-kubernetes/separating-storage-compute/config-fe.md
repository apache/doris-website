---
{
"title": "Config FE",
"language": "en"
}
---

FE is primarily responsible for query parsing, planning, and related tasks in decoupled storage and compute mode.

## Configuring Compute Resources
In the deployment sample provided in the [Doris Operator repository](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml), the FE service has no resource restrictions by default. CPU and memory resources for the service can be configured using Kubernetes [requests and limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/). For example, to allocate 8 CPU cores and 8Gi of memory for FE, use the following configuration:
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
Update the above configuration in the [DorisDisaggregatedCluster resource](./install-doris-cluster.md#step-3-deploy-the-compute-storage-decoupled-cluster) that you intend to deploy.

## Configuring the Number of Follower Nodes
In a Doris Frontend (FE) service, there are two types of roles: Follower and Observer. Follower nodes are responsible for SQL parsing, metadata management, and storage. Observer nodes primarily handle SQL parsing to offload query and write traffic from Followers. Doris uses the bdbje storage system for metadata management, which implements an algorithm similar to the Paxos protocol.

In a distributed deployment, multiple Follower nodes must be configured to participate in metadata management within the distributed environment.

When deploying a compute-storage disaggregated Doris cluster using the `DorisDisaggregatedCluster` resource, the default number of Follower nodes is set to 1. You can configure the number of Followers using the following setting. The example below configures three Follower nodes:
```yaml
spec:
  feSpec:
    electionNumber: 3
```
:::tip Note
Once the disaggregated cluster is deployed, the `electionNumber` setting cannot be modified.
:::

## Custom Startup Configuration
The Doris Operator mounts the FE startup configuration using a Kubernetes ConfigMap. Follow these steps to configure it:

1. Create a Custom ConfigMap Containing the FE Startup Configuration  
    In the default deployment, each FE service starts with a default configuration file embedded in the image. You can override this by creating a custom ConfigMap. For example:
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
        deploy_mode = cloud
    ```

2. Deploy the ConfigMap  
    Deploy the custom ConfigMap to the namespace where the DorisDisaggregatedCluster resource resides by executing:
    ```shell
    kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
    ```
    Here, `${namespace}` is the namespace of the `DorisDisaggregatedCluster` resource, and `${feConfigMapName}` is the filename of the ConfigMap.

3. Update the `DorisDisaggregatedCluster` Resource to Use the ConfigMap  
    In the `DorisDisaggregatedCluster` resource, mount the ConfigMap using the `feSpec.configMaps` array, as shown below:
    ```yaml
    spec:
      feSpec:
        replicas: 2
        configMaps:
        - name: fe-configmap
    ```
    In the `DorisDisaggregatedCluster` resource, the `configMaps` field is an array, with each element's `name` representing the name of the ConfigMap in the current namespace.
  
:::tip Tip  
1. In Kubernetes deployments, it is not necessary to include `meta_service_endpoint` or `cluster_id` in the startup configuration, as the Doris Operator will automatically add this information.
2. When customizing the startup configuration, `enable_fqdn_mode` must be set to true.
:::

## Access Configuration
The Doris Operator uses Kubernetes Services to provide VIP and load balancing capabilities, supporting three exposure modes: `ClusterIP`, `NodePort`, and `LoadBalancer`.

### ClusterIP Mode
Kubernetes uses the [`ClusterIP service type`](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip) by default. This mode provides an internal address within the Kubernetes cluster.

#### Step 1: Configure ClusterIP Mode
By default, Doris is configured to use ClusterIP mode on Kubernetes; no additional configuration is required.

#### Step 2: Obtain the Service Access Address
After deploying the cluster, view the FE service by running:
```yaml
kubectl -n doris get svc
```
A sample output is:
```yaml
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```
In the output above, the service with the suffix "internal" is used solely for internal communication (e.g., heartbeat, data exchange) and is not exposed externally. The service without the "internal" suffix is used for external access to the FE service.

#### Step 3: Access Doris from Within a Container
Create a Pod with the MySQL client in the current Kubernetes cluster by running:
```yaml
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```
Within the Pod, connect to the Doris cluster by using the Service name that does not have the "internal" suffix:
```yaml
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```
### NodePort Mode
To access Doris from outside the Kubernetes cluster, you can use the [NodePort service type](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). NodePort mode supports two configuration methods: static host port assignment and dynamic host port assignment.
- Dynamic Host Port Assignment:
    If no explicit port mapping is provided, Kubernetes automatically assigns an unused host port (default range: 30000–32767) when the pod is created.
- Static Host Port Assignment:
    If a port mapping is explicitly specified and the host port is available and conflict-free, Kubernetes will allocate that port. For static assignment, you must plan the port mappings. Doris provides the following ports for external interactions:

| Port Name  | Default Port | Description                                              |
|------------|-------------|----------------------------------------------------------|
| Query Port | 9030        | Used to access the Doris cluster via the MySQL protocol. |
| HTTP Port  | 8030        | The HTTP server port on FE, used to view FE information. |

#### Step 1: Configure FE NodePort
- Dynamic Assignment Configuration:
    ```yaml
    spec:
      feSpec:
        service:
          type: NodePort
    ```
- Static Assignment Configuration Example:
    ```yaml
    spec:
      feSpec:
        service:
          type: NodePort
          portMaps:
          - nodePort: 31001
            targetPort: 8030
          - nodePort: 31002
            targetPort: 9030
    ```
#### Step 2: Obtain the Service
After the cluster is deployed, run the following command to view the Service:
```yaml
kubectl get service
```
A sample output is:
```yaml
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```
#### Step 3: Accessing Doris Using NodePort
For example, if Doris' `Query Port` is mapped to host port 31545, first obtain the IP address of one node in the Kubernetes cluster by running:
```yaml
kubectl get nodes -o wide
```
A sample output is:
```yaml
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```
Using any of these node IPs (for example, 192.168.88.62), connect to the Doris cluster with:
```yaml
mysql -h 192.168.88.62 -P31545 -uroot
```

### LoadBalancer Mode
The [LoadBalancer service](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) type is applicable in cloud-based Kubernetes environments and is provided by the cloud provider's load balancer.

#### Step 1: Configure LoadBalancer Mode
Set the `feSpec.service` type to LoadBalancer, as shown:
```yaml
spec:
  feSpec:
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/load-balancer-type: "external"
```

#### Step 2: Obtain the Service
After deploying the cluster, view the Service by running:
```yaml
kubectl get service
```
A sample output is:
```yaml
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe            LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### Step 3: Accessing Doris Using LoadBalancer
For example, if Doris' Query Port listens on port 9030, connect using:
```yaml
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P9030 -uroot
```

## Persistent Storage
In the default deployment, the FE service uses Kubernetes [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) as its metadata storage mode. Since EmptyDir is non-persistent, metadata will be lost after a service restart. To ensure that FE metadata is preserved after restarts, persistent storage must be configured.

### Automatically Generating Persistent Storage Using a Storage Template
Configure persistent storage for logs and metadata using a storage template, as shown below:
```yaml
spec:
  feSpec:
    persistentVolumes:
    - persistentVolumeClaimSpec:
      # storageClassName: ${storageclass_name}
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 200Gi
```
When deployed with the above configuration, the Doris Operator automatically mounts persistent storage for the log directory (default `/opt/apache-doris/fe/log`) and the metadata directory (default `/opt/apache-doris/fe/doris-meta`). If the log or metadata directory is explicitly specified in the [custom startup configuration](#custom-startup-configuration), the Doris Operator will parse and mount the persistent storage accordingly. Persistent storage is implemented using the [StorageClass mechanism](https://kubernetes.io/docs/concepts/storage/storage-classes/), which allows specifying the required StorageClass via the `storageClassName` field.

### Custom Mount Point Configuration
The Doris Operator supports customized storage configurations for mount points. The following example mounts 300Gi of storage for the log directory using a custom configuration and 200Gi for the metadata directory using the storage template:
```yaml
spec:
  feSpec:
    persistentVolumes:
    - mountPaths:
      - /opt/apache-doris/fe/log
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
            storage: 200Gi
```
:::tip Tip
If the `mountPaths` array is empty, it indicates that the current storage configuration is using the template configuration.
:::

### Disable Log Persistence
If log persistence is not desired and logs should only be output to the standard output, configure as follows:
```yaml
spec:
  feSpec:
    logNotStore: true
```
