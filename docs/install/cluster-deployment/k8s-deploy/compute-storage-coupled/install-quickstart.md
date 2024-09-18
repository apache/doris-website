---
{
"title": "Quick Start",
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
This section describes how to deploy Doris Operator and Doris cluster in the test Kubernetes cluster.
The deployment operations are as follows:
1. Create a Kubernetes test cluster
2. Deploy Doris Operator
3. Deploy Doris cluster
4. Connect to Doris cluster

## Step 1: Create a Kubernetes test cluster
This step briefly describes how to quickly build a single-node k8s cluster without a k8s cluster. If you already have a k8s cluster, please skip this step.
Kind is currently a common solution for creating a local Kubernetes test environment. Kind uses Docker containers as nodes to create and run Kubernetes clusters locally.

1. Deployment prerequisites
   Before deployment, you need to ensure that the following components are available in the environment:

| Components | Version requirements |
|------------|----------------------|
| Docker     | \>= 18.09            |
| kubectl    | \>=1.19              |
| kind       | \>=0.8.0             |

2. Deploy Kubernetes cluster using kind
   In this example, kind 0.10.0 is used to install the Kubernetes cluster. The command is as follows:

```
   kind create cluster --image kindest/node:v1.20.2 --name test-doris
```
Expected output:
```
Creating cluster "test-doris" ...
 ✓ Ensuring node image (kindest/node:v1.20.2)
 ✓ Preparing nodes
 ✓ Writing configuration
 ✓ Starting control-plane
 ✓ Installing CNI
 ✓ Installing StorageClass
Set kubectl context to "kind-test-doris"
You can now use your cluster with:
```
3. Check the Kubernetes cluster status Use the following command to check the Kubernetes cluster status:
```
kubectl cluster-info --context kind-test-doris
```
Expected output:
```
Kubernetes control plane is running at https://127.0.0.1:40075
KubeDNS is running at https://127.0.0.1:40075/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```
## Step 2: Deploy Doris Operator
Deploying Doris Operator consists of two parts: installing the definition and deploying the operator service:
1. Installing Doris Operator CRD
   Add the custom resource (CRD) of Doris Operator using the following command:
```
kubectl apply -f https://raw.githubusercontent.com/selectdb/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
```
Expected output:
```
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com created
```
2. Install Doris Operator
   Install Doris Operator using the following command:
```
kubectl apply -f https://raw.githubusercontent.com/selectdb/doris-operator/master/config/operator/operator.yaml
```
Expected output:
```
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```
3. Check the Doris Operator status
   Check the deployment status of Doris Operator using the following command:
```
kubectl get pods -n doris
```
Expected output:
```
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
```
For Doris Operator related configuration and other deployment methods, please refer to [Deploying Doris Operator](./install-operator.md).
## Step 3: Deploy Doris cluster
1. Download the template Doris deployment template:
```
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```
2. Perform customized configuration as needed according to the [Deploying Doris Cluster](./install-doris-cluster.md). After the configuration is completed, deploy it with the following command:
```
kubectl apply -f doriscluster-sample.yaml
```
3. Check the cluster deployment status:
   Check the status of the cluster by checking the status of pods:
```
kubectl get pods
```
Expected output:
```
NAME                       READY   STATUS    RESTARTS   AGE
doriscluster-sample-fe-0   1/1     Running   0          2m
doriscluster-sample-be-0   1/1     Running   0          3m
```
Check the status of the deployed resources:
```
kubectl get dcr -n doris
```
Expected output:
```
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```

## Step 4: Connect and access the Doris cluster

The Doris cluster is quickly deployed in the test environment. You can enter the container FE and use the MySQL Client to connect to Doris for test operations. For other access methods, refer to [Accessing Doris Cluster](./install-access-cluster.md) for configuration.
1. Get the FE container name:
```
kubectl get pod -n doris | grep fe
doriscluster-sample-fe-0          1/1     Running   0          16m
```
In this example, the FE container is named doriscluster-sample-fe-0.

2. Enter the FE container:
```
kubectl -n doris exec -it doriscluster-sample-fe-0 /bin/bash
```

3. Use MySQL Client to connect to the Doris cluster in the FE container:
```
mysql -uroot -P9030 -h127.0.0.1
```