---
{
"title": "Compute-storage decoupled quick start",
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

Deploying a complete Doris Compute-storage decoupled cluster from scratch on K8s is divided into two parts: the first part deploys `Doris-Operator`; the second part distributes the relevant resources `DorisDisaggregatedMetaService` and `DorisDisaggregatedCluster` for deploying the Compute-storage decoupled cluster. The `DorisDisaggregatedMetaService` resource deploys the metadata component; the `DorisDisaggregatedCluster` resource deploys the SQL parsing component and the computing component.

## Install Operator

1. Create CRD：

```
kubectl create -f https://raw.githubusercontent.com/selectdb/doris-operator/master/config/crd/bases/crds.yaml
```

Expected Results：

```
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org created
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org created
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org created
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com created
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedmetaservices.disaggregated.metaservice.doris.com created
```

2. Deploy Doris-Operator and dependent RBAC rules:

```
kubectl apply -f https://raw.githubusercontent.com/selectdb/doris-operator/master/config/operator/disaggregated-operator.yaml
```

Expected Results：

```
kubectl -n doris get pods
NAME                                         READY   STATUS    RESTARTS   AGE
doris-operator-fdb-manager-d75574c47-b2sqx   1/1     Running   0          11s
doris-operator-5b667b4954-d674k              1/1     Running   0          11s
```

## Compute-storage decoupled cluster quick start

### Install DorisDisaggregatedMetaService

1. Download `ddm-sample.yaml`, a resource that tells Doris-Operator how to deploy metadata components.

```shell
curl -O https://raw.githubusercontent.com/selectdb/doris-operator/master/doc/examples/disaggregated/metaservice/ddm-sample.yaml
```

Deploy resources according to configuration metadata chapters: [FDB](install-metaservice/config-fdb.md), [ms](install-metaservice/config-ms.md), [recycler](install-metaservice/config-recycler.md) Configure resources according to actual needs.

2. Apply `DorisDisaggregatedMetaService`

```
kubectl apply -f ddm-sample.yaml
```

Expected Results：

```
kubectl get ddm
NAME                   FDBSTATUS   MSSTATUS   RECYCLERSTATUS
meta-service-release   Available   Ready      Ready
```

### Config object storage

The Compute-storage decoupled cluster uses object storage as persistent storage. You need to use ConfigMap to deliver [object storage information used by the Compute-storage decoupled cluster](install-cluster/config-relation#Register object storage).

1. Download the ConfigMap resource that contains the object storage information:

Compute-storage decoupled cluster uses object storage as the backend storage, and needs to plan the object storage to be used in advance. Download `object-store-info.yaml`.

```
curl -O https://raw.githubusercontent.com/selectdb/doris-operator/master/doc/examples/disaggregated/cluster/object-store-info.yaml
```

2. According to the [Doris Compute-storage decoupled_interface](../../../../compute-storage-decoupled/creating-cluster#%E5%86%85%E7%BD%AE%E5%AD%98%E5%82%A8%E5%90%8E%E7%AB%AF) format, configure the object storage information in JSON format, with `instance.conf` as the key and the object storage information in JSON format as the value configured in the data of ConfigMap. (Replace the corresponding value in the sample JSON format)

apply `object-store-info.yaml` :

```shell
kubectl apply -f object-store-info.yaml
```

:::tip Tip
- To deploy a Compute-storage decoupled cluster, you need to plan the object storage to be used in advance, and configure the object storage information through ConfigMap to the Namespace where the doris Compute-storage decoupled cluster needs to be deployed.
- The configuration in the case is mainly to show the basic configuration information required for object storage. All values are fictitious and cannot be used in real scenarios. If you need to build a real and available cluster, please fill in the real data.
:::

### Install DorisDisaggregatedCluster

1. Download `ddc-sample.yaml`:

```shell
curl -O https://raw.githubusercontent.com/selectdb/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

2. According to the chapters on configuring Compute-storage decoupled cluster: [Cluster association configuration](install-cluster/config-relation.md), [fe](install-cluster/config-fe.md), [compute cluster](install-cluster/config-cc.md), configure resources according to actual needs. Use the following command to deploy resources:

```
kubectl apply -f ddc-sample.yaml
```

The expected results of deploying a computing cluster are as follows:

```
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     1         1                  1
```

:::tip Tip
- `DorisDisaggregatedCluster` must be configured to use `DorisDisaggregatedMetaService` resource information in the [specification](install-cluster/config-relation.md).
- To deploy a Compute-storage decoupled cluster, you must plan the object storage you want to use in advance and configure the deployment according to the [object storage configuration section](install-cluster/config-relation.md) in the cluster association configuration.
:::
