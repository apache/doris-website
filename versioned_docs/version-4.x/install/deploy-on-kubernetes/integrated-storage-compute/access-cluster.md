---
{
    "title": "04 Accessing the Doris Cluster",
    "language": "en",
    "description": "Learn how to access a Doris storage-compute integrated cluster on Kubernetes through ClusterIP, NodePort, and LoadBalancer modes, including connecting from the FE Pod, kubectl port-forward, the difference between node ports and load balancer ports, and the StreamLoad access configuration.",
    "keywords": ["accessing Doris cluster", "MySQL client", "ClusterIP", "NodePort", "LoadBalancer", "port-forward", "StreamLoad", "Service", "K8s"]
}
---

Doris Operator creates Kubernetes Services for FE and BE. A Service can be exposed in three ways: `ClusterIP`, `NodePort`, and `LoadBalancer`. This page uses the `doriscluster-sample` cluster in the `doris` namespace created in [Deploy Doris Cluster](install-doris-cluster.md) as an example to describe how to access the cluster in each way.

After the first deployment, the `root` user has no password. Before exposing Doris outside the Kubernetes cluster, [set a password for the root user](install-config-cluster.md#set-the-root-user-password-after-cluster-deployment).

## ClusterIP Mode

By default, Doris on Kubernetes uses the [ClusterIP access mode](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip). The ClusterIP access mode provides an internal address that is reachable only from inside the Kubernetes cluster.

### Step 1: Get the Service

After deploying the cluster, run the following command to view the Services created by Doris Operator:

```shell
kubectl -n doris get svc
```

The result is as follows:

```text
NAME                              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                               AGE
doris-operator-service            ClusterIP   10.96.125.220   <none>        443/TCP                               37m
doriscluster-sample-be-internal   ClusterIP   None            <none>        9050/TCP                              116s
doriscluster-sample-be-service    ClusterIP   10.96.154.191   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   116s
doriscluster-sample-fe-internal   ClusterIP   None            <none>        9030/TCP                              3m9s
doriscluster-sample-fe-service    ClusterIP   10.96.181.183   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   3m9s
```

FE and BE each have two kinds of Services:

- Services with the `-internal` suffix are used for internal Doris communication, such as heartbeats and data exchange, and are not used by clients.
- Services with the `-service` suffix are used to access the cluster. `doris-operator-service` belongs to the Operator and is not part of the Doris cluster.

### Step 2: Access Doris

Choose an access method based on where the client runs:

| Client location | Access method |
| --- | --- |
| An operator running ad hoc SQL | Use the MySQL client included in the FE image from inside the FE Pod |
| Applications inside the Kubernetes cluster | Use the DNS name of the FE Service |
| A local computer with a MySQL client installed | Forward the FE port to the local computer with `kubectl port-forward` |

**Connect from the FE Pod**

The FE image includes a MySQL client, so no additional client image is required:

```shell
kubectl -n doris exec -it doriscluster-sample-fe-0 -- mysql -h doriscluster-sample-fe-service -P 9030 -uroot
```

**Access from applications in the cluster**

Applications in the Kubernetes cluster connect to Doris with the following address. Applications in the same namespace can use `doriscluster-sample-fe-service:9030`:

```text
doriscluster-sample-fe-service.doris.svc.cluster.local:9030
```

**Access from a local computer through port-forward**

Run the following command on your local computer to forward FE port 9030 to the local computer. The command keeps running, so keep this terminal open:

```shell
kubectl -n doris port-forward svc/doriscluster-sample-fe-service 9030:9030
```

In another terminal, connect with your local MySQL client:

```shell
mysql -h 127.0.0.1 -P 9030 -uroot
```

`port-forward` is suitable for temporary debugging. The connection is relayed through the Kubernetes API server, so it is not suitable for long-term application access.

## NodePort Mode

After [configuring the NodePort access mode](install-config-cluster.md#nodeport) in the `DorisCluster` resource, follow these steps to access the FE over the MySQL protocol.

### Step 1: Get the Service

```shell
kubectl -n doris get svc
```

The result is as follows:

```text
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

In `PORT(S)`, `9030:31545/TCP` means that Service port 9030 is mapped to node port 31545.

### Step 2: Access Doris

To access the Doris cluster, you also need the IP address of a cluster node:

```shell
kubectl get nodes -o wide
```

The result is as follows:

```text
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

In NodePort mode, you can access Doris through the IP address of any node and the node port. The following example connects to Doris through node 192.168.88.62 and node port 31545, which corresponds to the Query Port:

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

The client must be able to reach the node IP. For a kind cluster running in a desktop environment such as Docker Desktop, the node IP is usually not reachable from the host; use `port-forward` instead.

## LoadBalancer Mode

On a public cloud, after [configuring the LoadBalancer access mode](install-config-cluster.md#loadbalancer) in the `DorisCluster` resource, follow these steps to access the FE over the MySQL protocol.

### Step 1: Get the Service

```shell
kubectl -n doris get svc
```

The result is as follows:

```text
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

`EXTERNAL-IP` is the address assigned by the load balancer. In `PORT(S)`, `9030:31545/TCP` means that the load balancer listens on Service port 9030, and 31545 is the node port that is allocated at the same time.

If `EXTERNAL-IP` stays `<pending>`, the load balancer has not been created successfully. Run the following command to view the Events:

```shell
kubectl -n doris describe svc doriscluster-sample-fe-service
```

If the cluster has no load balancer controller (for example, a self-managed cluster or a local kind cluster), the Events are empty and `EXTERNAL-IP` stays `<pending>`. Use NodePort mode instead.

### Step 2: Access Doris

Connect with `EXTERNAL-IP` and Service port 9030, not node port 31545:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 9030 -uroot
```

## Using StreamLoad to Access Doris Deployed on Kubernetes

Doris supports importing data using the StreamLoad mode. When the client and the Doris cluster are in the same LAN, the client can use the FE address directly as the request address. The FE service receives the request and returns an HTTP 307 status code along with an accessible BE address, telling the client to send the data import request to that BE address. A Doris cluster deployed on Kubernetes communicates over addresses that are only accessible inside Kubernetes. When the FE accessible address is configured for StreamLoad, the BE address returned by the FE through the redirect is only accessible inside Kubernetes, which causes data imports from clients outside Kubernetes to fail.

When a client outside Kubernetes uses StreamLoad to import data into a Doris cluster deployed on Kubernetes, you need to configure a BE address that is accessible from outside as the StreamLoad import address.

### Configure the BE Service to Be Externally Accessible

Configure the BE `Service` to be accessible from outside the Kubernetes cluster according to [NodePort](install-config-cluster.md#nodeport) or [LoadBalancer](install-config-cluster.md#loadbalancer), then update the `DorisCluster` resource.

### Configure the BE Proxy Address

Following the methods described in [NodePort Mode](#nodeport-mode) or [LoadBalancer Mode](#loadbalancer-mode), get the BE address that is accessible outside Kubernetes and the port that corresponds to the BE `webserver_port` (8040 by default): use the node IP and node port in NodePort mode, or `EXTERNAL-IP` and 8040 in LoadBalancer mode. Configure the obtained address and port as the request address used by StreamLoad to import data.
