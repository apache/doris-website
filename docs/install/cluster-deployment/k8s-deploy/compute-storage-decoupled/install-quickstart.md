---
{
"title": "Deploy on Kubernetes",
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

The deployment of a compute-storage decoupled cluster on Kubernetes involves four main steps:  
1. Pre-deployment preparation.  
2. Deploying the Doris Operator.  
3. Deploying the compute-storage decoupled cluster.  
4. Creating the storage backend.

## Step 1: Pre-deployment preparation
To deploy a compute-storage decoupled cluster on Kubernetes, you need to deploy FoundationDB in advance. If using virtual machines (VMs), ensure that the VMs can be accessed by services within the Kubernetes cluster. For deploying FoundationDB on VMs, refer to the "Pre-deployment Preparation" section of the [compute-storage decoupling deployment guide](../../../../compute-storage-decoupled/before-deployment.md). For deployment on Kubernetes, follow the instructions in the [FoundationDB on Kubernetes deployment guide](install-fdb.md).  

## Step 2: Deploy the operator

1. Create the resource definitions:
  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

2. Deploy the Doris Operator and its associated RBAC rules:
  ```shell
  kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
  ```
  
  Expected Results:
  
  ```shell
  kubectl -n doris get pods
  NAME                              READY   STATUS    RESTARTS   AGE
  doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
  ```

## Step 3: Deploy the compute-storage decoupled cluster
1. Download the example deployment configuration for the compute-storage decoupled cluster:
  ```shell
  curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
  ```
2. Configure FoundationDB access information.  
  The compute-storage decoupled version of Doris uses FoundationDB to store metadata. The access details for FoundationDB can be provided in the DorisDisaggregatedCluster under `spec.metaService.fdb` in one of two ways: by directly specifying the access address or by using a ConfigMap that includes the access information.
- Direct Access Address Configuration  
  If FoundationDB is deployed outside of Kubernetes, you can specify its access address directly:
  ```yaml
  spec:
    metaService:
      fdb:
        address: ${fdbAddress}
  ```
  Here, ${fdbAddress} refers to the client access address for FoundationDB. On Linux VMs, this is typically stored in `/etc/foundationdb/fdb.cluster`. For more details, refer to the FoundationDB [cluster file documentation](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file).  
- Using a ConfigMap Containing Access Information  
  If FoundationDB is deployed using the [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator), it will automatically generate a ConfigMap containing the access details. The name of the generated ConfigMap is based on the resource name used for the deployment and appended with "-config".  
  To obtain the ConfigMap, refer to the ["Access Information" section](install-fdb.md#retrieve-the-configmap-containing-foundationdb-access-information) in the FoundationDB on Kubernetes deployment guide. Once you have the ConfigMap name and namespace, configure the DorisDisaggregatedCluster as follows:
  ```yaml
  spec:
    metaService:
      fdb:
        configMapNamespaceName:
          name: ${foundationdbConfigMapName}
          namespace: ${namespace}
  ```
  Replace ${foundationdbConfigMapName} with the name of the ConfigMap and ${namespace} with the namespace where it is located.
3. Follow the instructions in the compute-storage decoupling Kubernetes deployment documentation to configure the metadata service ([metaService configuration](config-ms.md)), the FE cluster specifications ([FE cluster configuration](config-fe.md)), and the compute groups ([compute group configuration](config-cg.md)). After completing the configuration, deploy the resources with the following command:
  ```shell
  kubectl apply -f ddc-sample.yaml
  ```
  Once the resources are applied, wait for the cluster to be automatically set up. The expected output is:
  ```shell
  kubectl get ddc
  NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
  test-disaggregated-cluster   green           Ready     2         2                  2
  ```

## Step 4: Create a remote storage backend
Once the compute-storage decoupled cluster is set up, you need to execute the appropriate `CREATE STORAGE VAULT` SQL statement through the client to create the storage backend for data persistence. You can enter the FE container and use the MySQL client to perform the creation.
1. Get the service.  
  After the cluster is deployed, you can view the services exposed by the Doris Operator with the following command:
  ```shell
  kubectl get svc
  ```
  The output will be similar to:
  ```shell
  NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
  test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
  test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
  test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
  test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
  test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
  ```
2. MySQL client access.  
  To create a pod with the MySQL client inside the Kubernetes cluster, use the following command:
  ```shell
  kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
  ```
  Within the pod, you can connect to the Doris cluster using the FE service name:
  ```shell
  mysql -uroot -P9030 -h test-disaggregated-cluster-fe 
  ```
3. Create the Storage Backend.  
  To create a storage backend using an S3-compatible object storage, use the following example:  
  a. Create an S3 Storage Vault:
  ```mysql
  CREATE STORAGE VAULT IF NOT EXISTS s3_vault
      PROPERTIES (
          "type"="S3",    
          "s3.endpoint" = "oss-cn-beijing.aliyuncs.com", 
          "s3.region" = "bj",       
          "s3.bucket" = "bucket",        
          "s3.root.path" = "big/data/prefix",   
          "s3.access_key" = "ak",         
          "s3.secret_key" = "sk",             
          "provider" = "OSS" 
      );
  ```
  b. Set the Default Storage Vault.  
  ```mysql
  SET s3_vault AS DEFAULT STORAGE VAULT;
  ```

:::tip Tip  
The configuration details in the above commands are for illustrative purposes only and are not valid for real-world scenarios. Please refer to [the Managing Storage Vaults section](../../../../compute-storage-decoupled/managing-storage-vault.md) for instructions on creating a usable storage backend.  
:::

