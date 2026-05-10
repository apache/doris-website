---
{
    "title": "Configure FE",
    "language": "en",
    "description": "A detailed guide to configuring FE (FrontEnd) in a storage-compute separation cluster, including compute resources, the number of Followers, startup parameters, access modes (ClusterIP/NodePort/LoadBalancer), and persistent storage configuration.",
    "keywords": ["Doris", "storage-compute separation", "Kubernetes", "FE", "FrontEnd", "Follower", "NodePort", "LoadBalancer", "persistent storage"]
}
---

## What you will learn in this chapter

- How to configure compute resources (CPU and memory) for the FE component
- How to configure the number of FE Followers and their roles
- How to customize FE startup parameters with a ConfigMap
- How to choose the access mode for the FE service (ClusterIP/NodePort/LoadBalancer) based on your access scenario
- How to configure persistent storage for FE to prevent metadata loss

## Configuration overview

In storage-compute separation mode, FE (Frontend) is mainly responsible for query parsing and planning. This chapter introduces FE configuration in the following order:

| Configuration item | Problem it solves |
| --- | --- |
| Compute resource configuration | Explicitly allocates CPU and memory to FE |
| Follower node count configuration | Plans the metadata management nodes in a distributed deployment |
| Custom startup configuration | Overrides default startup parameters via a ConfigMap |
| Access mode configuration | Exposes the FE service based on the access scenario (in-cluster, out-of-cluster, or cloud platform) |
| Persistent storage configuration | Prevents metadata loss after FE restarts |

## Configure compute resources

In the [deployment example](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml) provided by the Doris-Operator repository, FE has no resource limits by default. For production environments, it is recommended to explicitly configure FE compute resources via Kubernetes [requests and limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

The following example allocates 8c8Gi of compute resources to FE:

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

Apply this configuration to the [`DorisDisaggregatedCluster` resource you want to deploy](./install-doris-cluster.md#configure-the-dorisdisaggregatedcluster-resource).

## Configure the number of Follower nodes

The FE service has two roles, with the following responsibilities:

| Role | Responsibilities |
| --- | --- |
| Follower | Handles SQL parsing and manages and stores metadata |
| Observer | Handles SQL parsing and shares the query and write load of Followers |

Doris uses the bdbje storage system to manage metadata. The underlying implementation of bdbje is similar to a Paxos protocol algorithm. In a distributed deployment, multiple Follower nodes must be configured to participate in metadata management together.

When you deploy a Doris storage-compute separation cluster with the `DorisDisaggregatedCluster` resource, the default number of Followers is 1. You can adjust the number of Follower nodes via the `electionNumber` field. The following example sets the number of Followers to 3:

```yaml
spec:
    feSpec:
        electionNumber: 3
```

:::tip Tip

After a storage-compute separation cluster is deployed, `electionNumber` cannot be modified. Plan the number of Followers before deployment.

:::

## Custom startup configuration

Doris Operator mounts the FE startup configuration through a Kubernetes ConfigMap. The configuration procedure is as follows:

### Step 1: Write the FE startup ConfigMap

Define a ConfigMap that contains the FE startup configuration, as shown below:

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

### Step 2: Deploy the ConfigMap to the target namespace

Deploy the ConfigMap to the namespace where the `DorisDisaggregatedCluster` resides with the following command:

```shell
kubectl apply -n ${namespace} -f ${feConfigMapName}.yaml
```

Parameter description:

- `${namespace}`: the namespace where the `DorisDisaggregatedCluster` resides
- `${feConfigMapName}`: the name of the file that contains the configuration above

### Step 3: Reference the ConfigMap in DorisDisaggregatedCluster

Update the [`DorisDisaggregatedCluster` resource](./install-doris-cluster.md#configure-the-dorisdisaggregatedcluster-resource) and mount the ConfigMap through the `feSpec.configMaps` array, as shown below:

```yaml
spec:
    feSpec:
        replicas: 2
        configMaps:
            - name: fe-configmap
```

:::tip Tip

When customizing the startup configuration in a Kubernetes deployment, note the following two points:

1. **Do not** add the `meta_service_endpoint` or `cluster_id` configuration. Doris-Operator injects these values automatically.
2. **You must** set `enable_fqdn_mode=true`.

:::

## Access configuration

Doris-Operator uses Kubernetes Service to provide VIP and load balancing capabilities. Depending on the access scenario, you can choose one of the following three exposure modes:

| Access mode | Applicable scenario | Description |
| --- | --- | --- |
| ClusterIP | Access only from within the Kubernetes cluster | The default mode, no extra configuration is required |
| NodePort | Access from outside the Kubernetes cluster (commonly used in self-built clusters) | Exposes the service via the host port |
| LoadBalancer | Access through a cloud load balancer in a cloud platform environment | The load balancer is provided by the cloud service provider |

The following sections describe the configuration of each mode.

### ClusterIP mode

Kubernetes uses [ClusterIP mode](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip) by default. This mode provides an internal address inside the Kubernetes cluster that can only be accessed from within the cluster.

#### Step 1: Configure ClusterIP

ClusterIP is the default access mode and **no additional changes** are required to use it.

#### Step 2: Get the Service access address

After the cluster is deployed, view the Services exposed by FE with the following command:

```shell
kubectl -n doris get svc
```

A sample result is shown below:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe            ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

The result contains two kinds of Services:

- With the `internal` suffix: used only for Doris internal communication (such as heartbeat and data exchange), and is not exposed externally
- Without the `internal` suffix: used for external access to the FE service

#### Step 3: Access Doris from inside a container

Run the following command to create a Pod that contains a MySQL client in the current Kubernetes cluster:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

Inside the container, connect to the Doris cluster using the Service name without the `internal` suffix:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

### NodePort mode

To access Doris from outside the Kubernetes cluster, use [NodePort mode](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport). NodePort mode supports two ways to allocate ports:

| Allocation method | Description |
| --- | --- |
| Dynamic host port allocation | When no port mapping is set explicitly, Kubernetes automatically assigns an unused host port (default range 30000-32767) |
| Static host port allocation | The port mapping is specified explicitly. The port is fixed when the host port is not occupied and there is no conflict |

Static allocation requires planning the port mapping. Doris provides the following ports for external interaction by default:

**Table 1: FE service port descriptions**

| Port name  | Default port | Port description                       |
|---------- | ------- | -------------------------------------- |
| Query Port | 9030    | Used to access the Doris cluster via the MySQL protocol |
| HTTP Port  | 8030    | The HTTP Server port on FE, used to view FE information |

#### Step 1: Configure FE NodePort

Choose one of the following configurations as needed:

- **Dynamic port allocation**:

    ```yaml
    spec:
        feSpec:
            service:
                type: NodePort
    ```

- **Static port allocation**:

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

#### Step 2: Get the Service

After the cluster is deployed, view the `Service` with the following command:

```shell
kubectl get service
```

The result is shown below:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe            NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### Step 3: Access Doris through NodePort

Take a MySQL connection as an example. Assume the Doris Query Port is mapped to host port 31545. The steps are as follows:

1. Get the IP address of any node in the Kubernetes cluster:

    ```shell
    kubectl get nodes -owide
    ```

    Sample result:

    ```shell
    NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
    r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
    ```

2. Use the IP of any node (such as 192.168.88.62) and the mapped port to connect to the Doris cluster:

    ```shell
    mysql -h 192.168.88.62 -P 31545 -uroot
    ```

### LoadBalancer mode

[LoadBalancer mode](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) is suitable for Kubernetes environments on cloud platforms, where the load balancer is provided by the cloud service provider.

#### Step 1: Configure LoadBalancer mode

Set the type to `LoadBalancer` in `feSpec.service`:

```yaml
spec:
    feSpec:
        service:
            type: LoadBalancer
            annotations:
                service.beta.kubernetes.io/load-balancer-type: "external"
```

#### Step 2: Get the Service

After the cluster is deployed, view the `Service` with the following command:

```shell
kubectl get service
```

Sample result:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe            LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
```

#### Step 3: Access through the LoadBalancer

Take a MySQL connection as an example. Assume the Query Port listens on 9030. Connect to the Doris cluster with the following command:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## Persistent storage

In the [default deployment](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/cluster/ddc-sample.yaml), the FE service uses Kubernetes [EmptyDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) as the metadata storage mode. Because `EmptyDir` is a non-persistent storage mode, **metadata is lost after the service restarts**.

To ensure FE metadata is not lost after a restart, configure persistent storage for FE. Doris Operator provides the following three options. Choose one based on your needs:

| Option | Applicable scenario |
| --- | --- |
| Auto-generate using a storage template | Logs and metadata use the same storage configuration, simplifying the setup |
| Custom mount point configuration | Different directories require different storage specifications |
| Do not persist logs | Logs are written only to standard output and do not need to be persisted |

### Auto-generate using a storage template

Configure unified persistence for logs and metadata through a storage template, as shown below:

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

After the cluster is deployed with this configuration, the following takes effect:

- Doris Operator automatically mounts persistent storage for the log directory (default `/opt/apache-doris/fe/log`) and the metadata directory (default `/opt/apache-doris/fe/doris-meta`)
- If the log or metadata directory is explicitly specified in the [custom startup configuration](#custom-startup-configuration), Doris Operator parses it automatically and mounts the storage accordingly
- Persistent storage uses [StorageClass mode](https://kubernetes.io/docs/concepts/storage/storage-classes/). You can specify the desired StorageClass through `storageClassName`

### Custom mount point configuration

Doris Operator supports per-directory storage configuration. For example, mount a 300Gi disk for the log directory using a custom storage configuration, and mount a 200Gi disk for the metadata directory using the storage template:

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

If the `mountPaths` array is empty, the storage configuration is treated as a template configuration (that is, it applies to all directories that are not configured separately).

:::

### Do not persist logs

If you do not want to persist logs and only want them written to standard output, use the following configuration:

```yaml
spec:
    feSpec:
        logNotStore: true
```
