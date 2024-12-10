---
{
"title": "Accessing Doris Cluster",
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
## Access using ClusterIP mode

Doris provides ClusterIP access mode by default on Kubernetes. The ClusterIP access mode provides an internal IP address within a Kubernetes cluster through which services are exposed. With ClusterIP mode, access is only possible within the cluster.

1. Configure and use ClusterIP as the Service type

Doris provides ClusterIP access mode by default on Kubernetes. No modification is required to use ClusterIP access mode.

2. Get Service

After deploying the cluster, you can view the services exposed by Doris Operator through the following command:

```shell
kubectl -n doris get svc
```

The return result is as follows:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

In the above results, FE and BE have two types of Services, with the suffixes internal and service respectively:

- Service services with the suffix internal can only be used for Doris internal communication, such as heartbeat, data exchange and other operations, and are not used externally.
- Service services with the service suffix can be provided to users

3. Access Doris inside the container

Use the following command to create a pod containing the mysql client in the current Kubernetes cluster:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

In the container in the cluster, you can use the externally exposed service name with the suffix `service` to access the Doris cluster:

```shell
## Use service type pod name to access the Doris cluster
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

## Access using NodePort mode

If users need to access Doris outside the Kubernetes cluster, they can choose to use NodePort mode.

1. Plan NodePort mode port mapping

To use and maintain Doris cluster, users need to access the following ports:

| port name | default port | port description |
|------| ---- |--------------------------|
| Query Port | 9030 | Used to access Doris cluster through MySQL protocol |
| HTTP Port | 8030 | http server port on FE, used to view FE information |
| Web Server Port | 8040 | http server port on BE, used to view BE information |

There are two ways of port allocation using NodePort:

- Dynamic allocation: If port mapping is not explicitly set, Kubernetes will automatically allocate an unused port when creating a pod (the default range is 30000-32767);
- Static allocation: If port mapping is explicitly specified, Kubernetes will fixedly allocate the port when the port is not in use without conflict.

Kubernetes uses dynamic port allocation by default. If you need to plan the port in advance, you need to specify it explicitly in Custom Resource. In the following example, the Doris port is mapped:

```yaml
...
spec:
  feSpec:
    replicas: 3
    service:
      type: NodePort
      servicePorts:
        - nodePort: 31001
          targetPort: 8030
        - nodePort: 31002
          targetPort: 8040
        - nodePort: 31003
          targetPort: 9030
...
  beSpec:
    replicas: 3
    service:
      type: NodePort
      servicePorts:
        - nodePort: 31005
          targetPort: 9060
        - nodePort: 31006
          targetPort: 8040
        - nodePort: 31007
          targetPort: 9050
        - nodePort: 31008
          targetPort: 8060
...
```
2. Configure using NodePort as Service type

Custom DorisCluster resource to use NodePort mode with BE, the specific changes are as follows:
```yaml
...
spec:
   feSpec:
     replicas: 3
     service:
       type: NodePort
...
    beSpec:
     replicas: 3
     service:
       type: NodePort
...
```

3. Get Service

After deploying the cluster, you can view the services exposed by Doris Operator through the following command:

```shell
kubectl get service
```

The return result is as follows:

```shell
NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE
kubernetes ClusterIP 10.152.183.1 <none> 443/TCP 169d
doriscluster-sample-fe-internal ClusterIP None <none> 9030/TCP 2d
doriscluster-sample-fe-service NodePort 10.152.183.58 <none> 8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP 2d
doriscluster-sample-be-internal ClusterIP None <none> 9050/TCP 2d
doriscluster-sample-be-service NodePort 10.152.183.244 <none> 9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP 2d
```

Doris's Query Port defaults to 9030, which is mapped to local port 31545 locally. When accessing the Doris cluster, you need to obtain the corresponding IP address, which can be viewed with the following command:

```shell
kubectl get nodes -owide
```

The return result is as follows:

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

In NodePort mode, you can access services in the Kubernetes cluster based on the host IP and port mapping of any node. In this example, you can use any node IP, 192.168.88.61, 192.168.88.62, 192.168.88.63, to access the Doris service. For example, in the following example, the node node 192.168.88.62 and the mapped query port port 31545 are used to access the cluster:

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

## Stream Load ErrorURL Redirect

[Stream Load](../../../data-operate/import/stream-load-manual) is a synchronous import mode provided by Doris. It is an efficient way to import local files into Doris. In the case of physical or virtual machine deployment, directly use http to initiate an import data request to FE, and FE will redirect the request to the BE service through the 301 mechanism to execute the write request. On Kubernetes, FE and BE use [Service](https://kubernetes.io/zh-cn/docs/concepts/services-networking/service/) as the method of service discovery. In situations where a proxy is used to mask the internal real address to provide service discovery, the address of the BE (the real address used for internal communication within the service) returned using FE 301 cannot be accessed. On Kubernetes, you need to use BE's Service address to import data.

As in the following example, Stream Load ErrorUrl returns the result `http://doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local:8040/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e`

### View ErrorURL inside the container

If you perform Stream Load inside Kubernetes, you can directly use the error address returned by Stream Load to obtain a detailed error report.

In the return result of the above example, you can directly obtain the return result through the curl command in the Pod in the same Kubernetes cluster:

```shell
curl http://doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local:8040/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e
```

### View ErrorURL outside the container

An error occurs when importing data using Stream Load from outside Kubernetes. The returned error address cannot be directly accessed outside Kubernetes to obtain a detailed error report. In the Kubernetes environment, you need to use a customized Service proxy to detect the pod where an error occurred. Configure the customized Service in an externally accessible mode and obtain a detailed error report by accessing the proxy Service.

The customized Service template is as follows:

```yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    app.doris.service/role: debug
    app.kubernetes.io/component: be
  name: doriscluster-detail-error
spec:
  externalTrafficPolicy: Cluster
  internalTrafficPolicy: Cluster
  ipFamilies:
    - IPv4
  ipFamilyPolicy: SingleStack
  ports:
    - name: webserver-port
      port: 8040
      protocol: TCP
      targetPort: 8040
  selector:
    app.kubernetes.io/component: be
    statefulset.kubernetes.io/pod-name: ${podName}
  sessionAffinity: None
  type: ${ServiceType}
```

in:

- ${podName} represents the third-level domain name of the pod where the error currently occurs. For example, in the above example, the pod name needs to be filled in doriscluster-sample-be-2
- ${ServiceType} is the deployed Service type, you can choose NodePort or LoadBalancer

:::tip Tip
Since the pod name returned by each stream load may be different, please delete the customized Service after obtaining the detailed error information of the stream load.
:::

**NodePort Mode**

1. Deploy NodePort Service

Follow the service in the above example, replace ${podName} in CR with doriscluster-sample-be-2, and replace ${ServiceType} with NodePort. Use the kubectl apply command to create the service service in the same namespace of the doris cluster.

```shell
kubectl -n {namespace} apply -f strem_load_get_error.yaml
```

2. Build access commands

Use the following command to view the NodePort assigned by the above deployment Service:

```shell
kubectl get service -n doris doriscluster-detail-error
```

The return result is as follows:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)            AGE
doriscluster-detail-error         NodePort    10.152.183.35    <none>        8040:31201/TCP     32s
```

The BE port accessed by `Stream Load` is 8040, and the host port (NodePort) corresponding to 8040 in the above Service is 31201.

Get the host address controlled by K8s:

```shell
kubectl get node -owide
```

The return result is as follows:

```shell
NAME             STATUS   ROLES    AGE    VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE                       KERNEL-VERSION       CONTAINER-RUNTIME
vm-10-8-centos   Ready    <none>   226d   v1.28.7   10.16.10.8    <none>        TencentOS Server 3.1 (Final)   5.4.119-19-0009.3    containerd://1.6.28
vm-10-7-centos   Ready    <none>   19d    v1.28.7   10.16.10.7    <none>        TencentOS Server 3.1 (Final)   5.4.119-19.0009.25   containerd://1.6.28
```

Use any of the above hosts `INTERNAL-IP` and get the host port to build an access address using NodePort mode to get error details. In `NodePort` mode, the address for obtaining error details is spliced into `Host IP:NodePort`, then the accessible address of the case is `10.16.10.8:31201`. Replace the access address in the returned error address information to obtain the accessible error information. Available addresses for details:

```text
http://10.16.10.8:31201/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e
```

Use the above command to obtain detailed error information of Stream Load.

**LoadBalancer Mode**

1. Deploy and obtain error details Service

Assume that the error address of the Stream Load range is as follows:

```text
http://doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local:8040/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e
```

The domain name address of the above address is `doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local`. Among the domain names used by pods deployed by `Doris Operator` on `Kubernetes`, the third level The domain name is the name of the pod. Replace {podName} in the above template with the real `pod` name, replace {serviceType} with `LoadBalancer`, and save the changes to the newly created `stream_load_get_error.yaml` file. Use the following command to deploy service:

```shell
kubectl -n {namespace} apply -f strem_load_get_error.yaml
```

2. Build access commands

Use the following command to view the LoadBalaner address EXTERNAL-IP assigned by the above deployment Service. The following is a test instance in aws eks:

```shell
kubectl get service -n doris doriscluster-detail-error
```

The return result is as follows:

```shell
NAME                         TYPE          CLUSTER-IP       EXTERNAL-IP                                                              PORT(S)           AGE
doriscluster-detail-error    LoadBalancer  172.20.183.136   ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com  8040:32003/TCP    14s
```

The above Service obtains the LoadBalancer address assigned by the K8s cluster as `ac4828493dgrftb884g67wg4tb68gyut``-1137856348.us-east-1.elb.amazonaws.com`. In LoadBalancer mode, the port is still the listening port for deployment deployment. In `LoadBalancer` mode , the address to obtain error details is spliced into "EXTERNAL-IP:listener-port". In the above example, the address to obtain error details is `ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com:8040`. The address to obtain detailed error information is as follows:

```text
http://ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com:8040/api/_load_error_log?file=__shard_1/error_log_insert_stmt_af474190276a2e9c-49bb9d175b8e968e_af474190276a2e9c_49bb9d175b8e968e
```
