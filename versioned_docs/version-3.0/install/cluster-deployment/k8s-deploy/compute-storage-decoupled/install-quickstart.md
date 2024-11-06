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

To deploy a storage-computing separation cluster on K8s, FDB deployed in advance is required. If it is a virtual machine deployment, please ensure the deployed virtual machine can be accessed by the services on the K8s cluster. For deployment, please refer to [Before Deployment](../../../../compute-storage-decoupled/before-deployment.md#51-install-foundationdb) doc; if deploy on K8s, please refer to [FDB deployment on k8s](install-fdb.md).  
Doris storage-computing separation cluster deployment is divided into two parts: deploying Doris-Operator and its RBAC resources; Deploying customized resource `DorisDisaggregatedCluster`.

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
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

## Step 2: Quickly deploy a storage and computing separation cluster
1. Download the `ddc-sample.yaml` deployment sample:

```bash
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

2. According to the documents of deploying doris storage and computing separation cluster, configure metaService in the [metadata configuration](config-ms.md); configure the fe specifications in the [fe configuration](config-fe.md); and configure the resource groups in the [compute cluster configuration](config-cg.md). After the configuration is completed, use the following command to deploy resource:
```bash
kubectl apply -f ddc-sample.yaml
```
After the deployment resource is delivered, using the command `kubectl get ddc` to check the cluster status. The expected successful result is as follow:
```bash
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```
:::tip Tip  
MS service needs to use FDB as the backend metadata storage. FDB service must be deployed before deploying MS service. Please deploy it in advance according to [install FDB](install-fdb.md).  
:::

## Step 3: Creating remote storage vault
After the cluster is built, you need to execute the corresponding `CREATE STORAGE VAULT` SQL statement through the client to create a storage backend to achieve data persistence.
Refer to [Accessing Doris Cluster](../compute-storage-coupled/install-access-cluster.md) to connect to the Doris cluster. One of the implementation methods is provided below.

**1. Get service**

After deploying the cluster, you can view the service exposed by Doris Operator by using the following command:

```shell
kubectl get svc
```

The returned results are as follows:

```shell
NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
```

**2. Access by MySQL Client**

Use the following command to create a pod containing the mysql client in the current Kubernetes cluster:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

In the container within the cluster, you can use the fe service name to access the Doris cluster:

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe  
```

**3. Create storage vault**

Create statement syntax, please refer to [managing storage vault](../../../../compute-storage-decoupled/managing-storage-vault.md).  
Here is an example of S3 protocol object storage:

1. Create S3 Storage Vault
```SQL
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
    PROPERTIES (
        "type"="S3",                                   -- required
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com", -- required
        "s3.region" = "bj",                            -- required
        "s3.bucket" = "bucket",                        -- required
        "s3.root.path" = "big/data/prefix",            -- required
        "s3.access_key" = "ak",                        -- required
        "s3.secret_key" = "sk",                        -- required
        "provider" = "OSS"                             -- required
    );
```

2. Set the default storage vault
```SQL
SET s3_vault AS DEFAULT STORAGE VAULT;
```

