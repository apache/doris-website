---
{
"title": "Deploying Doris Operator",
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

The Doris Operator can be deployed by directly applying resources or by using Helm.
The deployment involves the following steps:
1. Apply resource definitions.
2. Deploy the Operator and RBAC rules.  
3. Verify the deployment status.

## Directly use resources

### non-network-isolated from github
If your environment has access to [Doris Operator repo](https://github.com/apache/doris-operator), you can deploy Doris Operator directly using the resources defined in the Doris Operator repository. 

#### Add doris operator resource definitions
Doris Operator uses Custom Resource Definitions (CRDs) to extend Kubernetes. The Doris Cluster CRD encapsulates the descriptions of Doris objects, such as Frontend (FE) and Backend (BE) components. For detailed information, refer to the doris-operator-api. Before deploying Doris, the Doris Cluster CRD must be created.  
Run the following command to deploy the Doris Cluster CRD in your Kubernetes environment:
```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
```
Expected output:
```shell
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com created
```
To confirm that the CRD has been created:
```shell
kubectl get crd | grep doris
```
Expected output:
```shell
dorisclusters.doris.selectdb.com                      2024-02-22T16:23:13Z
```

### Deploy doris operator
The Doris Operator repository provides a deployment template. If your environment can access the Doris Operator repository, please use this template to deploy the Operator.
Run the following command to deploy Doris Operator using the default configuration:
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

#### Check doris operator status
To check the deployment status of Doris Operator:
```shell
kubectl get pod --namespace doris
```
Expected output:
```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
```

### network-isolated from github
If your deployment environment is isolated from GitHub, download the necessary resources on a machine with GitHub access, then transfer them to the target environment.  

#### Apply doris operator resource definitions
1. On a machine with GitHub access, download the resource definitions:
  ```shell
  wget https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
  ```
2. Transfer the downloaded file to the target machine, then apply the resource definition:
  ```shell
  kubectl create -f ./doris.selectdb.com_dorisclusters.yaml
  ```
  Expected output:
  ```shell
  customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com created
  ```
3. Verify the resource definition was applied successfully:
  ```shell
  kubectl get crd | grep doris
  ```
  Expected output:
  ```shell
  dorisclusters.doris.selectdb.com                      2024-02-22T16:23:13Z
  ```

#### Deploy doris operator and RBAC rules
If the environment cannot pull the [Doris Operator image](https://hub.docker.com/repository/docker/selectdb/doris.k8s-operator/general), please pre-download the image and push it to a private registry. For detailed guidance, refer to the doc [Moving docker images from one container registry to another](https://medium.com/@pjbgf/moving-docker-images-from-one-container-registry-to-another-2f1f1631dc49).  
1. Download the deployment template:
  ```shell
  wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
  ```
2. Update the image reference: Replace the default image (selectdb/doris.k8s-operator:latest) in the deployment template with the private registry address:
  ```yaml
  spec:
    containers:
    - command:
      - /dorisoperator
      args:
      - --leader-elect
      image: private.registry.com/doris.k8s-operator:latest
      name: dorisoperator
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
          - "ALL"
  ```
3. Apply the deployment:
  ```shell
  kubectl apply -f ./operator.yaml
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
4. Verify the deployment:
  ```shell
  kubectl get pods --namespace doris
  ```
  Expected output:
  ```shell
  NAME                              READY   STATUS    RESTARTS   AGE
  doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
  ```

## Use helm to deploy
Helm Charts are collections of YAML files describing Kubernetes resources. By using Helm, you can easily customize and deploy applications. A Chart is a Helm package (in TAR format) used for deploying Kubernetes-native applications, simplifying the process of deploying Doris clusters.

### Add the helm chart repo
1. Add the Doris Helm repository:
  ```shell
  helm repo add doris-repo https://charts.selectdb.com
  ```
2. Update the repository to fetch the latest Chart version:
  ```shell
  helm repo update doris-repo
  ```

### Install Doris Operator
1. Install Doris Operator in the doris namespace using the default configuration:
  ```shell
  helm install operator doris-repo/doris-operator
  ```
  To customize the deployment, create and specify a values.yaml file:
  ```shell
  helm install -f values.yaml operator doris-repo/doris-operator
  ```
2. Verify the deployment:
  ```shell
  kubectl get pods --namespace doris
  ```
  Expected output:
  ```shell
  NAME                              READY   STATUS    RESTARTS   AGE
  doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
  ```
