---
{
    "title": "04 Accessing the Doris Cluster",
    "language": "en",
    "description": "Learn how to access a Doris cluster on Kubernetes through ClusterIP, NodePort, and LoadBalancer modes, including MySQL client connections and StreamLoad configuration.",
    "keywords": ["accessing Doris cluster", "MySQL client", "ClusterIP", "NodePort", "LoadBalancer", "StreamLoad", "Service", "K8s"]
}
---

Kubernetes uses Service to provide VIP and load balancing capabilities. A Service has three modes for external exposure: `ClusterIP`, `NodePort`, and `LoadBalancer`.

## ClusterIP Mode

By default, Doris on Kubernetes uses the [ClusterIP access mode](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip). The ClusterIP access mode provides an internal address within the Kubernetes cluster, which serves as the address of the service inside Kubernetes.

After the initial deployment, you can access Doris over the MySQL protocol using the `root` user with no password as follows.

### Step 1: Get the Service

After deploying the cluster, run the following command to view the Services exposed by the Doris Operator:

```shell
kubectl -n doris get svc
```

The result is as follows:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

In the result above, FE and BE each have two types of Services, suffixed with `internal` and `service` respectively:

- Services with the `internal` suffix are used only for internal Doris communication, such as heartbeats and data exchange, and are not exposed externally.

- Services with the `service` suffix are used to access cluster services.

### Step 2: Access Doris

The ClusterIP mode can only be used inside Kubernetes. Run the following command to create a Pod that contains a MySQL client in the current Kubernetes cluster:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

Inside the container, you can connect to the Doris cluster by accessing the Service name with the `service` suffix:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

## NodePort Mode

After [configuring the NodePort access mode](install-config-cluster.md#nodeport) in the DorisCluster access configuration section, follow these steps to access the FE over the MySQL protocol using the `root` user with no password.

### Step 1: Get the Service

After the cluster is deployed, run the following command to view the `Service`:

```shell
kubectl get service
```

The result is as follows:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

### Step 2: Access Doris

Take a MySQL connection as an example. The default Doris Query Port is 9030. In the example above, port 9030 is mapped to the local port 31545. To access the Doris cluster, you need to obtain the IP address of a cluster node. Run the following command to view it:

```shell
kubectl get nodes -owide
```

The result is as follows:

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

In NodePort mode, you can access services inside the Kubernetes cluster through the IP address of any node and the mapped host port. In this example, the available node IPs include 192.168.88.61, 192.168.88.62, and 192.168.88.63. The following example shows how to connect to Doris using node 192.168.88.62 and the host port 31545 mapped from `query port`:

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

## LoadBalancer Mode

On a public cloud, after [configuring the LoadBalancer access mode](install-config-cluster.md#loadbalancer) in the DorisCluster access configuration section, follow these steps to access the FE over the MySQL protocol using the `root` user with no password.

### Step 1: Get the Service

After deploying the cluster, run the following command to view the `Service` that can be used to access `Doris`:

```shell
kubectl get service
```

The result is as follows:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
### Step 2: Access Doris

Take a MySQL connection as an example:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## Using StreamLoad to Access Doris Deployed on Kubernetes
Doris supports importing data using the StreamLoad mode. When the client and the Doris cluster are in the same LAN, the client can use the FE address directly as the request address. The FE service receives the request and returns an HTTP 301 status code along with an accessible BE address, telling the client to send the data import request to that BE address. A Doris cluster deployed on Kubernetes communicates over addresses that are only accessible inside Kubernetes. When the FE accessible address is configured for StreamLoad, the BE address returned by the FE through the 301 mechanism is only accessible inside Kubernetes, which causes data imports from clients outside Kubernetes to fail.

When a client outside Kubernetes uses StreamLoad to import data into a Doris cluster deployed on Kubernetes, you need to configure a BE address that is accessible from outside as the StreamLoad import address.
### Configure the BE Service to Be Externally Accessible
Configure the BE `Service` to be accessible from outside the Kubernetes cluster according to [NodePort](install-config-cluster.md#nodeport) or [LoadBalancer](install-config-cluster.md#loadbalancer). Then update the `DorisCluster` resource that deploys the Doris cluster.

### Configure the BE Proxy Address
Following the methods described in [NodePort Mode](#nodeport-mode) or [LoadBalancer Mode](#loadbalancer-mode) for obtaining access addresses, get an address that is accessible outside Kubernetes and the corresponding port for the web_server service. Configure the obtained address and port as the request address used by StreamLoad to import data.
