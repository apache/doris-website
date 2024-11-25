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
This section describes how to deploy Doris Operator and Doris cluster in the test Kubernetes cluster.
The deployment operations are as follows:
1. Deploy Doris Operator
2. Deploy Doris cluster
3. Connect to Doris cluster

## Step 1: Deploy Doris Operator
Deploying Doris Operator consists of two parts: installing the definition and deploying the operator service:
1. Installing Doris Operator CRD
   Add the custom resource (CRD) of Doris Operator using the following command:
   ```shell
   kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.apache.com_dorisclusters.yaml
   ```

2. Install Doris Operator
   Install Doris Operator using the following command:
   ```shell
   kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
   ```
   Expected output:
   ```shell
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
   ```shell
   kubectl get pods -n doris
   ```
   Expected output:
   ```shell
   NAME                              READY   STATUS    RESTARTS   AGE
   doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
   ```

## Step 2: Deploy Doris cluster
1. Download the template Doris deployment template:
   ```shell
   curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
   ```
2. Perform customized configuration as needed according to the doc of [Config Doris to Deploy](./install-config-cluster.md). After the configuration is completed, deploy it with the following command:
   ```shell
   kubectl apply -f doriscluster-sample.yaml
   ```
3. Check the cluster deployment status:
   Check the status of the cluster by checking the status of pods:
   ```shell
   kubectl get pods
   ```
   Expected output:
   ```shell
   NAME                       READY   STATUS    RESTARTS   AGE
   doriscluster-sample-fe-0   1/1     Running   0          2m
   doriscluster-sample-be-0   1/1     Running   0          3m
   ```
   Check the status of the deployed resources:
   ```shell
   kubectl get dcr -n doris
   ```
   Expected output:
   ```shell
   NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
   doriscluster-sample   available   available
   ```

## Step 3: Access the Doris cluster

The Doris cluster is quickly deployed in the test environment. You can enter the container FE and use the MySQL Client to connect to Doris for test operations. For other access methods, refer to [Accessing Doris Cluster](./install-config-cluster.md#access-configuration) for configuration.
1. Get the FE container name:
   ```shell
   kubectl get pod -n doris | grep fe
   doriscluster-sample-fe-0          1/1     Running   0          16m
   ```
   In this example, the FE container is named doriscluster-sample-fe-0.

2. Enter the FE container:
   ```shell
   kubectl -n doris exec -it doriscluster-sample-fe-0 /bin/bash
   ```

3. Use MySQL Client to connect to the Doris cluster in the FE container:
   ```shell
   mysql -uroot -P9030 -h127.0.0.1
   ```