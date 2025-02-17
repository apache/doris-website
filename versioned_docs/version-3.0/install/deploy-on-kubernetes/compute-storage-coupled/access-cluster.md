---
{
  "title": "Access Cluster",
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

Kubernetes provides the use of Service as VIP (Virtual IP) and load balancer. There are three external exposure modes for Service: ClusterIP, NodePort, and LoadBalancer.
## ClusterIP
Doris provides the ClusterIP access mode by default on Kubernetes. The ClusterIP access mode provides an internal IP address within the Kubernetes cluster to expose services through this internal IP. With the ClusterIP mode, services can only be accessed within the cluster.
### Step 1: Obtain the Service
After deploying the cluster, you can view the services exposed by the Doris Operator using the following command:
```shell
kubectl -n doris get svc
```
The returned result is as follows:
```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

In the above results, there are two types of services for FE and BE, with suffixes of "internal" and "service" respectively:
- The services with the "internal" suffix can only be used for internal communication within Doris, such as heartbeat, data exchange, and other operations, and are not for external use.
- The services with the "service" suffix can be used by users.

### Step 2: Access Doris

You can create a pod containing the mysql client in the current Kubernetes cluster using the following command:
```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```
From within the container in the cluster, you can access the Doris cluster using the service name with the "service" suffix that is exposed externally:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```
## NodePort
According to the DorisCluster access configuration section, after [configuring the access mode to use NodePort](install-config-cluster.md#nodeport), you can access FE using the MySQL protocol in root password-free mode. The steps are as follows:
### Step 1: Obtain the service
After deploying the cluster, you can view the services exposed by the Doris Operator using the following command:
```shell
kubectl get service
```
The returned result is as follows:
```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
### Step 2: Access Doris
To access Doris via NodePort, you need to know the Node IP and the mapped port. You can retrieve the node IPs using:
```shell
  kubectl get nodes -owide
```
Example output::
```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```
You can then use the IP address of any node (e.g., 192.168.88.61, 192.168.88.62, or 192.168.88.63) along with the mapped port to access Doris. For example, using node 192.168.88.62 and port 31545:
```shell
  mysql -h 192.168.88.62 -P 31545 -uroot
```
## LoadBalancer
According to the DorisCluster access configuration section, on a public cloud platform, after [configuring the access mode to use LoadBalancer](install-config-cluster.md#loadbalancer), you can access FE using the MySQL protocol in root password-free mode. The steps are as follows:
### Step 1: Obtain the service
After deploying the cluster, you can view the services exposed by the Doris Operator using the following command:
```shell
kubectl get service
```
The returned result is as follows:
```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

### Step 2: Access Doris
To access Doris through the LoadBalancer, use the external IP (provided in the EXTERNAL-IP field) and the corresponding port. For example, using the `mysql` command:
```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```
