---
{
"title": "Cluster dependency association configuration",
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

## Register object storage

To deploy a Compute-storage decoupled cluster, you need to plan the object storage to be used in advance, and configure the object storage information through ConfigMap to the Namespace where the Doris Compute-storage decoupled cluster needs to be deployed.

The following shows the ConfigMap format composed of the required configuration information of the object storage of the Compute-storage decoupled cluster using the S3 protocol:

```yaml
apiVersion: v1
data:
  instance.conf: |
    {
      "instance_id": "disaggregated-test-cluster3",
      "name": "instance-name",
      "user_id": "test_user",
      "vault": {
        "obj_info": {
          "ak": "test_ak",
          "sk": "test_sk",
          "bucket": "test_bucket",
          "prefix": "test-prefix",
          "endpoint": "cos.ap-beijing.myqcloud.com",
          "external_endpoint": "cos.ap-beijing.myqcloud.com",
          "region": "ap-beijing",
          "provider": "COS"
        }
      }
    }
kind: ConfigMap
metadata:
  name: vault-test
  namespace: default
```

Object storage information is configured in JSON format. When using ConfigMap as the configuration carrier, `instance.conf` must be used as the key and the object storage information in JSON format as a whole as the value. For detailed configuration of object storage, please refer to the [Compute-storage decoupled document](../install-quickstart.md#Install DorisDisaggregatedCluster).

`DorisDisaggregatedCluster` uses the above configuration as the backend object storage configuration as follows:

```yaml
apiVersion: disaggregated.cluster.doris.com/v1
kind: DorisDisaggregatedCluster
metadata:
  name: test-disaggregated-cluster
  namespace: default
spec:
  instanceConfigMap: vault-test
```

During deployment, update the configuration as described above and update it to the [Compute-storage decoupled resources to be deployed](../install-quickstart.md#Install DorisDisaggregatedCluster).

:::tip Tip
1. The configuration information in the above ConfigMap is to show the required key-value pairs. All value values are fictitious and cannot be used in the real environment. Please fill in the actual information of the object storage that actually supports the S3 protocol according to the Compute-storage decoupled document.
2. ConfigMap must be deployed in advance to the namespace where the Compute-storage decoupled cluster is expected to be deployed.
:::

## Configure metadata resource information

To deploy a Compute-storage decoupled cluster, you need to specify the metadata resource information to be used. Before deploying `DorisDisaggregatedCluster`, you need to plan and deploy the `DorisDisaggregatedMetaService` resource to be used. Fill in the following configuration as needed and update it to the [Compute-storage decoupled resource to be deployed](../install-quickstart.md#Install DorisDisaggregatedCluster).

```yaml
spec:
  disMS:
    namespace: {metaServiceNamespace}
    name: {metaServiceName}
```

Fill in the above information according to the actual resources used. `{metaServiceNamespace}` is the namespace where the `DorisDisaggregatedMetaService` resource is deployed, and `{metaServiceName}` is the name of the `DorisDisaggregatedMetaService` resource used.

Update the filled information to the [Compute-storage decoupled resources to be deployed](../install-quickstart.md#Install DorisDisaggregatedCluster).

