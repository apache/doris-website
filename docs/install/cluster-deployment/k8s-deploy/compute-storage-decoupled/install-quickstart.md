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

To deploy a storage-computing separation cluster on K8s, you need to deploy FDB in advance. If it is a virtual machine deployment, you need to ensure that the deployed virtual machine can be accessed by the services on the K8s cluster. For deployment, please refer to [Before Deployment](../../../../compute-storage-decoupled/before-deployment) in the storage-computing separation deployment document; if you need to deploy on K8s, please refer to [FDB deployment on k8s](install-fdb.md).
Deploying the Deploying the Doris storage-computing separation cluster is divided into two parts: deployment of Doris-Operator and its related dependent permissions; deployment of customized resources for the Doris storage-computing separation cluster.
storage-computing separation cluster is divided into two parts: deployment of Doris-Operator and its related dependent permissions; deployment of customized resources for the Doris storage-computing separation cluster.

## Step 1: Deploy Operator

1. Issue resource definitions:
```bash
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```

Expected Results:
```bash
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com created
customresourcedefinition.apiextensions.k8s.io/doris.selectdb.com_dorisclusters.yaml created
```

2. Deploy Doris-Operator and dependent RBAC rules:

```bash
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

Expected Results:

```bash
kubectl -n doris get pods
NAME                                         READY   STATUS    RESTARTS   AGE
doris-operator-fdb-manager-d75574c47-b2sqx   1/1     Running   0          11s
```

## Step 2: Quickly deploy a storage and computing separation cluster
1. Download the `ddc-sample.yaml` deployment sample:

```bash
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

2. According to the storage and computing separation K8s deployment document, configure metaService in the [metadata configuration](config-ms.md); configure the fe final state specifications in the [fe configuration](config-fe.md); and configure the relevant resource groups in the [compute cluster configuration](config-cg.md). After the configuration is completed, use the following command to deploy resources:
```bash
kubectl apply -f ddc-sample.yaml
```
After the deployment resources are delivered, wait for the cluster to be automatically built. The expected successful results are as follows:
```bash
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     1         1                  1
```
:::tip Tip
MS service needs to use FDB as the backend metadata storage. FDB service must be deployed when deploying MS service. Please deploy it in advance according to [install FDB](./install-fdb.md).
:::  
