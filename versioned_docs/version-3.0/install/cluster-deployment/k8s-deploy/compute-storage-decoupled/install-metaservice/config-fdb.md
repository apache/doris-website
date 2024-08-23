---
{
"title": "Config and install FDB",
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

Doris Compute-storage decoupled uses FoundationDB as the metadata storage component. In K8s deployment mode, use the `v1beta2` version of [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) to deploy `fdb`.

Doris-Operator shields the tediousness of manually configuring `FoundationDBCluster`, and abstracts very little configuration information to reduce the cost of learning to use `FoundationDBCluster` resources. Through abstraction, Doris-Operator hopes that users only focus on matters related to FDB deployment, without paying attention to the internal operating mechanism of FDB and the complex connection between Doris and FDB.

## Simplest configuration

By default, you only need to configure the resources used by FDB, and Doris-Operator automatically generates `FoundationDBCluster` to deploy the FDB metadata management cluster.

Default configuration:

```yaml
spec:
  fdb:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```
With the above configuration, Doris-Operator will automatically deploy an FDB cluster consisting of 5 pods.

## Specify image deployment

Doris-Operator uses the 7.1.38 version recommended by Doris to deploy FDB by default. In a privatized environment and if there are special requirements for the FDB version, please configure the image or configure the private warehouse image pull key in the following format.

### Private warehouse public image configuration

In the case of a private warehouse or external network access failure, you need to configure the private image warehouse address.

```yaml
spec:
  fdb:
    image: {fdb_image}
    sidecarImage: {fdb_sidecarImage}
```
Set `{fdb_image}` to the corresponding FoundationDB main image (`selectdb/foundationdb:xxx` in the selectdb repository), and `{fdb_sidecarImage}` to the FDB sidecar container image (`selectdb/foundationdb-kubernetes-sidecar:xxx` in the selectdb repository).

Configure the specified image-related configuration to the [`DorisDisaggregatedMetaService`](../install-quickstart#Install DorisDisaggregatedMetaService) resource that needs to be deployed.

**Configure image secret**

When using a private repository, if you configure access keys, follow the [Kubernetes private repository imagePullSecret](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) creation steps to create the corresponding secret and deploy it to the `DorisDisaggregatedMetaService` namespace.

```yaml
spec:
  fdb:
    image: {fdb_image}
    sidecarImage: {fdb_sidecarImage}
    imagePullSecrets:
    - {secret_name}
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

For the configuration of `{fdb_image}` and `{fdb_sidecarImage}`, please refer to the private repository public image configuration ** ** related introduction. `{secret_name}` is the name of the secret created according to the Kubernetes private repository `imagePullSecret`.

Add the above configuration to the [`DorisDisaggregatedMetaSerivce`](../install-quickstart.md#Install DorisDisaggregatedMetaService) resource that needs to be deployed.

## Configure storage

FoundationDB is a stateful distributed storage service that needs to configure persistent storage. By default, Doris-Operator will use the default StorageClass in Kubernetes to build the relevant pvc for the FDB pod. The default size of pvc is 128Gi. If you need to specify StorageClass and modify the default configuration size, please modify it as follows:

```yaml
spec:
  fdb:
    volumeClaimTemplate:
      spec:
        #storageClassName: {storageClassName}
        resources:
          requests:
            storage: "200Gi"
```
The above configuration uses the default StorageClass to create a 200Gi storage for the FDB service. If you need to specify a StorageClass, uncomment it and replace the variable `{storageClassName}` with the name of the StorageClass you want to specify.

Add the above configuration to the [`DorisDisaggregatedMetaSerivce`](../install-quickstart.md#Install DorisDisaggregatedMetaService) resource that needs to be deployed.
