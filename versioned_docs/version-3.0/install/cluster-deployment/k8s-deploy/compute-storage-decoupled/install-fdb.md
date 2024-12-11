---
{
"title": "Install FoundationDB",
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

FoundationDB is a distributed database developed by Apple that provides strong consistency for structured data storage. In the Doris compute-storage decoupling model, FoundationDB is used as the metadata store, with the meta-service component managing the metadata within FoundationDB. When deploying a compute-storage decoupled cluster on Kubernetes, FoundationDB must be deployed in advance. Two deployment options are recommended:  
- Deploying FoundationDB directly on virtual machines (including physical machines).  
- Using the [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) to deploy FoundationDB on Kubernetes.  

For VM deployments, refer to the Doris [compute-storage decoupling documentation's Pre-deployment section](../../../../compute-storage-decoupled/before-deployment.md) to set up the FoundationDB cluster. Before deployment, ensure that FoundationDB can be accessed by the Doris Kubernetes cluster, i.e., the Kubernetes nodes should be on the same subnet as the machine where FoundationDB is deployed.  

## Deploy FoundationDB on Kubernetes
The deployment of a FoundationDB cluster on Kubernetes involves four main steps:
1. Create FoundationDBCluster CRDs.  
2. Deploy fdb-kubernetes-operator service.  
3. Deploy FoundationDB cluster.  
4. Check FoundationDB status.  

### Step 1: Create FoundationDBCluster CRDs
```shell
kubectl create -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl create -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl create -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

### Step 2: Deploy fdb-kubernetes-operator service

The fdb-kubernetes-operator repository provides deployment samples for setting up an FoundationDB cluster in IP mode. The Doris-operator repository offers FoundationDB cluster deployment examples in [FQDN mode](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#pod-sethostnameasfqdn-field), which can be downloaded as needed.
1. Download the deployment sample:   
- From the fdb-kubernetes-operator official repository:  
  The fdb-kubernetes-operator by default deploys FoundationDB in IP mode. You can download the [default deployment configuration](https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml) in YAML format. If you wish to deploy using FQDN mode, refer to the [official documentation's DNS section](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#using-dns) for customization.
  ```shell
  wget -O fdb-operator.yaml https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml
  ```
- From the doris-operator repository:   
  The doris-operator repository provides deployment examples based on fdb-kubernetes-operator version 1.46.0. These examples can be used directly to deploy FoundationDB clusters.
  ```shell
  wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
  ```

2. Deploy the fdb-kubernetes-operator Service:     
  After customizing the fdb-kubernetes-operator deployment YAML, use the following command to deploy the `fdb-kubernetes-operator`:
  ```shell
  kubectl apply -f fdb-operator.yaml
  ```
  Expected Results:
  ```shell
  serviceaccount/fdb-kubernetes-operator-controller-manager created
  clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrole created
  clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
  rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
  clusterrolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrolebinding created
  deployment.apps/fdb-kubernetes-operator-controller-manager created
  ```

### Step 3: Deploy FoundationDB cluster
Deployment examples for FoundationDB are available in the fdb-kubernetes-operator repository. You can download and use them directly.  
1. Download the IP mode deployment sample from the FoundationDB official website:
  ```shell
  wget https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/cluster.yaml
  ```

2. Customized deployment example:  
- For environments with access to Docker Hub:  
  Customize the final deployment state according to the [User Manual](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/index.md) provided by the official website. If you use FQDN deployment, please set the `routing.useDNSInClusterFile` field to true and configure as follows:  
  Doris Operator's official repository provides a sample for deploying FoundationDB with [FQDN](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#pod-sethostnameasfqdn-field), which can be downloaded directly from [here](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/fdb/cluster.yaml).
  ```yaml
  spec:
    routing:
    useDNSInClusterFile: true
  ```

- For private networks:  
  If the environment cannot directly access Docker Hub, download the necessary images from the official FoundationDB repository and push them to a private registry.  
  The fdb-kubernetes-operator depends on the following Docker images:  
  [foundationdb/fdb-kubernetes-operator](https://hub.docker.com/r/foundationdb/fdb-kubernetes-operator)  
  [foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar)  
  The FoundationDB images include:  
  [foundationdb/foundationdb](https://hub.docker.com/r/foundationdb/foundationdb)  
  [foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar)  
  After pushing the images to your private registry, follow the official fdb-kubernetes-operator documentation to [customize the image configuration](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#customizing-the-foundationdb-image).
  Example configuration to add private registry image configurations:
  ```yaml
  spec:
    mainContainer:
      imageConfigs:
      - baseImage: foundationdb/foundationdb
        tag: 7.1.38
    sidecarContainer:
      imageConfigs:
      - baseImage: foundationdb/foundationdb-kubernetes-sidecar
        tag: 7.1.36-1
    version: 7.1.38
  ```

:::tip Tip
- In a private environment, when FoundationDB is pushed to a private repository, the tag must be consistent with the official one, for example: 7.1.38.
- When deploying FoundationDB, FoundationDBCluster resources, `.spec.version` must be configured.
- When FoundationDB is deployed based on fdb-kubernetes-operator, at least three hosts are required to meet the high availability requirements of the production environment.  
::: 

### Step 4: Check FoundationDB status
After deploying FoundationDB via the fdb-kubernetes-operator, check the status of the FoundationDB cluster with the following command:
```shell
kubectl get fdb
```
The expected results are as follows. If `AVAILABLE` is `true`, the cluster is available:
```shell
NAME           GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
test-cluster   1            1            true        true              7.1.26    13m
```
## Retrieve the ConfigMap containing FoundationDB access information
When using the fdb-kubernetes-operator to deploy FoundationDB, a specific ConfigMap containing the access information for FoundationDB will be created in the namespace where FoundationDB is deployed. The name of this ConfigMap will be the resource name of the FoundationDB deployment, with "-config" appended. Use the following command to view the ConfigMap:
```shell
kubectl get configmap
```
Expected output:
```shell
test-cluster-config   5      15d
```
