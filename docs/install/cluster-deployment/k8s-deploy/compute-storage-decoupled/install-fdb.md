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

[FDB](https://apple.github.io/foundationdb/#overview) is a distributed, strongly consistent database for storing structured data developed by Apple. Doris storage-computing separation mode uses FDB as metadata storage and manages metadata in FDB through the meta-service component. To deploy a storage-computing separation cluster on Kubernetes, you need to deploy the FDB service in advance. Two deployment methods are recommended: direct deployment on a virtual machine (including a physical machine); Use [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) to deploy FDB.
For virtual machine deployment, please refer to the official Doris storage-computing separation document [before deployment](../../../../compute-storage-decoupled/before-deployment.md) to build an FDB cluster. Before deployment, make sure that FDB has the ability to be accessed by the Kubernetes cluster deployed by Doris, that is, the Kubernetes Node and the machine where FDB is deployed are in the same subnet. FDB officially provides the operation and maintenance management service [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) for deployment on Kubernetes.

The following briefly describes the use of the latest version of fdb-kubernetes-operator to deploy FDB.

## Deploy FDB CRDs

```bash
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

Expected Results:

```bash
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org created
```

## Deploy fdb-kubernetes-operator service

The fdb-kubernetes-operator repository provides a deployment sample for deploying the FDB cluster in IP mode. The doris-operator repository provides a sample for deploying the FDB cluster in FQDN mode, which can be downloaded on demand.

1. Download the deployment sample:

- Download from the fdb-kubernetes-operator official repository:

  By default, fdb-kuberentes-operator deploys FDB Cluster in IP mode. You can download the [fdb-kubernetes-operator default deployment](https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml) yaml. If you use the FQDN deployment mode, please follow the official documentation [Using DNS section](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#using-dns) to customize the domain name mode.

```bash
wget -O fdb-operator.yaml https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml
```

- Download from the doris-operator repository:  
  The doris-operator repository has a deployment example based on the fdb-kuberentes-operator 1.46.0 version, which can be used directly to deploy the FDB cluster.

```bash
wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
```

2. Deploy the fdb-kubernetes-operator service:   
   After customizing the deployment yaml of `fdb-kubernetes-operator`, use the following command to deploy fdb-kubernetes-operator:

```bash
kubectl apply -f fdb-operator.yaml
```

Expected Results:

```bash
serviceaccount/fdb-kubernetes-operator-controller-manager created
clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrole created
clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
clusterrolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrolebinding created
deployment.apps/fdb-kubernetes-operator-controller-manager created
```

## Deploy FDB cluster

The deployment sample of FDB is provided in the [fdb-kubernetes-operator repository](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/config/samples/cluster.yaml). You can download it directly with the following command

1. Download the deployment sample:

   Download the IP mode deployment sample from the FDB official website:

```bash
wget https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/cluster.yaml
```

2. Customized deployment example:

- The environment can access dockerhub  
  Customize the final deployment state according to the [User Manual](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/index.md) provided by the official website. If you use FQDN deployment, please set the `routing.useDNSInClusterFile` field to true and configure as follows:
  The official repository of doris-operator provides a deployment example of [deploying FDB using FQDN](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/fdb/cluster.yaml) that can be downloaded and used directly.  

```yaml
spec:
  routing:
  useDNSInClusterFile: true
```

- Private network environment  

  In a private network environment, if you cannot directly access dockerhub, you can download the required image from the official repository of FDB and push it to the private repository. fdb-kubernetes-operator depends on [foundationdb/fdb-kubernetes-operator](https://hub.docker.com/r/foundationdb/fdb-kubernetes-operator), [foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar) .
  Deployment of FDB dependent images include: [foundationdb/foundationdb](https://hub.docker.com/r/foundationdb/foundationdb) , [foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar).
  After pushing to the private repository, follow the fdb-kubernetes-operator official document [Customized Image Configuration](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#customizing-the-foundationdb-image) instructions for configuration.  

  You can refer to the following configuration to add private repository image configuration:  

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
- In a private environment, when FDB is pushed to a private repository, the tag must be consistent with the official one, for example: 7.1.38.
- When deploying FDB, FoundationDBCluster resources, .spec.version must be configured.
- When FDB is deployed based on fdb-kubernetes-operator, at least three hosts are required to meet the high availability requirements of the production environment.  
:::

## Confirm FDB status  

Based on the FDB deployed by fdb-kubernetes-operator, you can view the FDB cluster status through the following command:

```bash
kubectl get fdb
```

The expected results are as follows. If `AVAILABLE` is `true`, the cluster is available:

```bash
NAME           GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
test-cluster   1            1            true        true              7.1.26    13m
```
