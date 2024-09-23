---
{
"title": "Config and install MS",
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

MS is the abbreviation of Meta Service, the Compute-storage decoupled component of Doris, which provides metadata management and query services. The configuration field in `DorisDisaggregatedMetaService` is MS.

## Simplest configuration

MS service is a stateless service and is usually deployed in active-standby mode. The simplest configuration is as follows:

```yaml
spec:
  ms:
    image: {msImage}
    replicas: 2
```

Among them, `{msImage}` is the version of the MS service you want to deploy.

## Configure resources

Add resource usage restrictions for the MS service. Take the 4c 4Gi configuration as an example:

```yaml
spec:
  ms:
    image: {msImage}
    replicas: 2
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```

Update the modified configuration to the [metadata management resources](../install-quickstart.md#Install DorisDisaggregatedMetaService). for Compute-storage decoupled that need to be deployed.

## Customized configuration file

Configuration files are mounted on K8s through ConfigMap. Doris-Operator automates the configuration of mutual perception between Compute-storage decoupled components. When deploying MS services using customized configuration files, please do not configure [FDB related configuration](../../../../../compute-storage-decoupled/compilation-and-deployment#deploy-meta-service).

**ConfigMap**:

```yaml
apiVersion: v1
data:
  doris_cloud.conf: |
    # // meta_service
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

    # //max stage num
    max_num_stages = 40
kind: ConfigMap
metadata:
  name: doris-metaservice
  namespace: default
```

The MS configuration using the above ConfigMap is as follows:

```yaml
spec:
  ms:
    image: {msImage}
    configMaps:
    - name: doris-metaservice
      mountPath: /etc/doris
```

In actual deployment, configure the name and namespace of ConfigMap as needed, and configure the configuration information in the [Compute-storage decoupled metadata management resource](../install-quickstart.md#Install DorisDisaggregatedMetaService) to be deployed according to the above sample format. The startup configuration file used by the MS service is named `doris_cloud.conf`, so the key of the ConfigMap for mounting the startup configuration must also be `doris_cloud.conf`. The startup configuration must be mounted to the `/etc/doris` directory, that is, the mountPath is `/etc/doris`.

:::tip Tip
MS service needs to use FDB as the backend metadata storage, and the FDB service must be deployed when deploying MS service.
:::