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
## Add Doris Cluster resource definition

Doris Operator extends Kubernetes with Custom Resource Definition (CRD). The CRD of Doris Cluster encapsulates the description of Doris objects, such as the description of FE or BE. For details, please refer to [doris-operator-api](https://github.com/apache/doris-operator/blob/master/doc/api.md). Before deploying Doris, you need to create the CRD of Doris Cluster.

Doris Cluster CRD can be deployed in a Kubernetes environment with the following command:

```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
```

If there is no external network, download the CRD file to your local computer first:

```shell
wget https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/doris.selectdb.com_dorisclusters.yaml
kubectl create -f ./doris.selectdb.com_dorisclusters.yaml
```

The following is the expected output:

```shell
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com created
```

After the Doris Cluster CRD is created, you can view the created CRD with the following command.

```shell
kubectl get crd | grep doris
```

The following is the expected output:

```shell
dorisclusters.doris.selectdb.com                      2024-02-22T16:23:13Z
```

## Add Doris Operator

### Solution 1: Quickly deploy Doris Operator

You can directly pull the Doris Operator template in the warehouse for quick deployment.

Doris Operator can be deployed in a Kubernetes cluster using the following command:

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
```

The following is the expected output:

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```
### Option 2: Customized deployment of Doris Operator

After creating the CRD, there are two ways to deploy Doris Operator on the Kubernetes cluster: online and offline deployment.

The minimum requirements for deploying operator services are specified in the operator.yaml file. In order to adapt to complex production environments, you can download the operator.yaml file and update the configuration as desired.

**Install Doris Operator online**

After modifying the operator.yaml file, you can deploy the Doris Operator service using the following command:

```shell
kubectl apply -f ./operator.yaml
```

The following is the expected output:

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

**Offline installation of Doris Operator**

1. Download the image file required to run the operator

If the server is not connected to the external network, you need to download the corresponding operator image file first. Doris Operator uses the following images:

```shell
selectdb/doris.k8s-operator:latest
```

Run the following command on a server that can connect to the external network to download the image:

```shell
## download doris operator image
docker pull selectdb/doris.k8s-operator:latest
## save the doris operator image as a tar package
docker save -o doris.k8s-operator-latest.tar selectdb/doris.k8s-operator:latest
```

Place the packaged tar file into all Kubernetes nodes and run the following command to upload the image:

```shell
docker load -i doris.k8s-operator-latest.tar
```

2. Configure Doris Operator

After downloading the operator.yaml file, you can modify the template according to your production environment expectations.

Doris Operator is a stateless Deployment in the Kubernetes cluster. Items such as `limits`, `replica`, `label`, `namespace` and other items can be modified according to needs. If you need to specify a certain version of the doirs operator image, you can make the following modifications to the operator.yaml file after uploading the image:

```shell
...
containers:
  - command:
      - /dorisoperator
    args:
      - --leader-elect
    image: selectdb/doris.k8s-operator:v1.0.0
    name: dorisoperator
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
          - "ALL"
  ...
```
3. Install Doris Operator

After modifying the Doris Operator template, you can use the apply command to deploy the Operator:

```shell
kubectl apply -f ./operator.yaml
```

The following is the expected output:

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

### Option 3: Helm deploys Doris Operator

Helm Chart is an encapsulation of a series of YAML files that describe Kubernetes-related resources. When deploying an application through Helm, you can customize the application's metadata to facilitate application distribution. Chart is a Helm package in TAR format for deploying Kubernetes native applications. Helm Chart can simplify the process of deploying Doris clusters.

1. Add a deployment warehouse

**Add warehouse online**

Add the remote repository through the `repo add` command

```shell
helm repo add doris-repo https://charts.selectdb.com
```

Update the latest version of the chart through the `repo update` command

```shell
helm repo update doris-repo
```

2. Install Doris Operator

Doris Operator can be installed in the doris namespace using the default configuration through the `helm install` command.

```shell
helm install operator doris-repo/doris-operator
```

If you need to customize the assembly [values.yaml](https://artifacthub.io/packages/helm/doris/doris-operator?modal=values), you can refer to the following command:

```shell
helm install -f values.yaml operator doris-repo/doris-operator
```

Check the deployment status of Pods through the `kubectl get pods` command. When the Doris Operator's Pod is in the Running state and all containers in the Pod are ready, the deployment is successful.

```shell
kubectl get pod --namespace doris
```

The return result is as follows:

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
```

**Add warehouse offline**

If the server cannot connect to the external network, you need to download the chart resources of Doris Operator and Doris Cluster in advance.

1. Download offline chart resources

Download `doris-operator-{chart_version}.tgz` to install Doris Operator chart. If you need to download version 1.4.0 of Doris Operator, you can use the following command:

```shell
wget https://charts.selectdb.com/doris-operator-1.4.0.tgz
```

2. Install Doris Operator

Doris Operator can be installed through the `helm install` command.

```shell
helm install operator doris-operator-1.4.0.tgz
```

If you need to customize the assembly [values.yaml](https://artifacthub.io/packages/helm/doris/doris-operator?modal=values), you can refer to the following command:

```shell
helm install -f values.yaml operator doris-operator-1.4.0.tgz
```

Check the deployment status of Pods through the `kubectl get pods` command. When the Doris Operator's Pod is in the Running state and all containers in the Pod are ready, the deployment is successful.

```shell
kubectl get pod --namespace doris
```

The return result is as follows:

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-866bd449bb-zl5mr   1/1     Running   0          18m
```

## Check service status

After deploying the Operator service, you can check the service status through the following command.

```shell
kubectl get pod -n doris
```

The return result is as follows:

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6f47594455-p5tp7   1/1     Running   0          11s
```

You need to ensure that the STATUS status is Running and the status of all containers in the pod is Ready.
