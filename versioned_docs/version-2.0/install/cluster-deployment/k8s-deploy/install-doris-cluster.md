---
{
"title": "Deploying Doris Cluster",
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

After planning the cluster topology, you can deploy the Doris cluster in Kubernetes.

## Deploy cluster

### Deploy using Custom Resource files

**Online Deployment**

Deploying a cluster online requires the following steps:

1. Create namespace:

```shell
kubectl create namespace ${namespace}
```

2. Deploy Doris cluster

```shell
kubectl apply -f ./${cluster_sample}.yaml -n ${namespace}
```

**Offline deployment**

To deploy Doris cluster offline, you need to upload the docker image used by Doris cluster to all nodes on a machine with external network. Then use docker load to install the image on the server. Offline deployment requires the following steps:

1. Download the required image

Deploying Doris cluster requires the following images:

```text
selectdb/doris.fe-ubuntu:2.0.2
selectdb/doris.be-ubuntu:2.0.2
```

Download the image locally and package it into a tar file

```shell
## download docker image
docker pull selectdb/doris.fe-ubuntu:2.0.2
docker pull selectdb/doris.be-ubuntu:2.0.2

## save docker image as a tar package
docker save -o doris.fe-ubuntu-v2.0.2.tar selectdb/doris.fe-ubuntu:2.0.2
docker save -o doris.be-ubuntu-v2.0.2.tar docker pull selectdb/doris.be-ubuntu:2.0.2
```

Upload the image tar package to the server and execute the docker load command:

```shell
## load docker image
docker load -i doris.fe-ubuntu-v2.0.2.tar
docker load -i doris.be-ubuntu-v2.0.2.tar
```

2. Create namespace:

```shell
kubectl create namespace ${namespace}
```

3. Deploy Doris cluster

```shell
kubectl apply -f ./${cluster_sample}.yaml -n ${namespace}
```

### Deploy using Helm

**Online Deployment**

Before installation, you need to add a deployment warehouse. If it has been added, you can directly install Doris Cluster. Otherwise, please refer to the operation of **Add Deployment Warehouse** when adding [Deploy Doris Operator](install-operator.md#option-3-helm-deploys-doris-operator)

1. Install Doris Cluster

Install [doriscluster](https://artifacthub.io/packages/helm/doris/doris), using the default configuration this deployment only deploys 3 FE and 3 BE components, using the default `storageClass` to implement PV dynamic provisioning.

```shell
helm install doriscluster doris-repo/doris
```

If you need to customize resources and cluster shapes, please customize the resource configuration according to the annotations of each resource configuration in [values.yaml](https://artifacthub.io/packages/helm/doris/doris?modal=values) and execute The following command:

```shell
helm install -f values.yaml doriscluster doris-repo/doris
```

2. Verify doris cluster installation results

You can check the pod deployment status through the `kubectl get pods` command. When the Pod of `doriscluster` is in `Running` state and all containers in the Pod are ready, the deployment is successful.

```shell
kubectl get pod --namespace doris
```

The return result is as follows:

```shell
NAME                     READY   STATUS    RESTARTS   AGE
doriscluster-helm-fe-0   1/1     Running   0          1m39s
doriscluster-helm-fe-1   1/1     Running   0          1m39s
doriscluster-helm-fe-2   1/1     Running   0          1m39s
doriscluster-helm-be-0   1/1     Running   0          16s
doriscluster-helm-be-1   1/1     Running   0          16s
doriscluster-helm-be-2   1/1     Running   0          16s
```

**Offline deployment**

1. Download the Doris Cluster Chart resource

Download `doris-{chart_version}.tgz` to install Doris Cluster chart. If you need to download the 1.6.1 version of the Doris cluster, you can use the following command:

```shell
wget https://charts.selectdb.com/doris-1.6.1.tgz
```

2. Install Doris cluster

Doris cluster can be installed through the `helm install` command.

```shell
helm install doriscluster doris-1.4.0.tgz
```

If you need to customize the assembly [values.yaml](https://artifacthub.io/packages/helm/doris/doris?modal=values), you can refer to the following command:

```shell
helm install -f values.yaml doriscluster doris-1.4.0.tgz
```

3. Verify doris cluster installation results

You can check the pod deployment status through the `kubectl get pods` command. When the Pod of `doriscluster` is in `Running` state and all containers in the Pod are ready, the deployment is successful.

```shell
kubectl get pod --namespace doris
```

The return result is as follows:

```shell
NAME                     READY   STATUS    RESTARTS   AGE
doriscluster-helm-fe-0   1/1     Running   0          1m39s
doriscluster-helm-fe-1   1/1     Running   0          1m39s
doriscluster-helm-fe-2   1/1     Running   0          1m39s
doriscluster-helm-be-0   1/1     Running   0          16s
doriscluster-helm-be-1   1/1     Running   0          16s
doriscluster-helm-be-2   1/1     Running   0          16s
```

## View cluster status

### Check cluster status

After the cluster deployment resources are delivered, you can check the cluster status by running the following command.

```shell
kubectl get pods -n ${namespace}
```

The return result is as follows:

```shell
NAME                       READY   STATUS    RESTARTS   AGE
doriscluster-sample-fe-0   1/1     Running   0          20m
doriscluster-sample-be-0   1/1     Running   0          19m
```

When the `STATUS` of all pods is in the `Running` state, and all containers in the pods of all components are `READY`, it means that the entire cluster is deployed normally.

### Check deployment resource status

Doris Operator will collect the status of cluster services and display them in the distributed resources. Doris Operator defines the abbreviation `dcr` for the `DorisCluster` type resource name, which can be replaced by the abbreviation when using the resource type to view the cluster status.

```shell
kubectl get dcr
```

The return result is as follows:

```shell
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```

When the `STATUS` of the configured related services is `available`, the cluster deployment is successful.