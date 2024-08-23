---
{
"title": "Config and install Recycler",
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

Recyler is a Doris Compute-storage decoupled component that cleans up expired metadata. The configuration field in `DorisDisaggregatedMetaService` is recyler.

The Recyler service is a stateless service and is usually deployed in active-standby mode. The simplest configuration is as follows:

```yaml
spec:
  recycler:
    image: {recylerImage}
    replicas: 2
```

Among them, `{recylerImage}` is the image for deploying the Recyler service. Recyler and MS are different ways to start the same program of the metadata management service. Recycler does not have a separate image name, please fill in the image of MS.

Update the modified configuration to the [Compute-storage decoupled metadata management resource](../install-quickstart.md#Install DorisDisaggregatedMetaService) that needs to be deployed.

## Configure resources

Add resource usage restrictions to the Recycler service. Take the 4c 4Gi configuration as an example:

```yaml
spec:
  recyler:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

Update the modified configuration to the [Compute-storage decoupled metadata management resource](../install-quickstart.md#Install DorisDisaggregatedMetaService) that needs to be deployed.

## Customized configuration file

ConfigMap is used to mount the configuration file on K8s. Doris-Operator automates the configuration of mutual perception between Compute-storage decoupled components. When deploying MS services using customized configuration files, please do not configure [FDB related configuration](../../../../../compute-storage-decoupled/compilation-and-deployment#deploy-meta-service).

Use ConfigMap to mount the configuration file to deploy the Recycler service:

**ConfigMap**:

```yaml
apiVersion: v1
data:
  doris_cloud.conf: |
    brpc_listen_port = 5000
    brpc_num_threads = -1
    brpc_idle_timeout_sec = 30
    http_token = greedisgood9999

    # // doris txn config
    label_keep_max_second = 259200
    expired_txn_scan_key_nums = 1000

    # // logging
    log_dir = ./log/
    # info warn error
    log_level = info
    log_size_mb = 1024
    log_filenum_quota = 10
    log_immediate_flush = false
    # log_verbose_modules = *
    # // recycler config
    recycle_interval_seconds = 3600
    retention_seconds = 259200
    recycle_concurrency = 16
kind: ConfigMap
metadata:
  name: doris-metaservice
```

The Recycler configuration using the above ConfigMap is as follows:

```yaml
spec:
  recyler:
    image: {recylerImage}
    configMaps:
    - name: doris-metaservice
      mountPath: /etc/doris
```

In actual deployment, configure the name and namespace of ConfigMap as needed, and configure the configuration information in the [Compute-storage decoupled Metadata Management Resource](../install-quickstart.md#Install DorisDisaggregatedMetaService) to be deployed according to the above sample format. The startup configuration file used by the Recycler service is named `doris_cloud.conf`, so the key of the ConfigMap for mounting the startup configuration must also be `doris_cloud.conf`. The startup configuration must be mounted to the `/etc/doris` directory, that is, the mountPath is `/etc/doris`.

:::tip Tip
The Recyler service needs to use FDB as the backend metadata storage. The FDB service must be deployed when deploying the Recyler service.
:::