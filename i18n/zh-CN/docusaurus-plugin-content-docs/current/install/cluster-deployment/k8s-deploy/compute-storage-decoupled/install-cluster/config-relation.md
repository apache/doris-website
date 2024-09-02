---
{
"title": "集群关联配置",
"language": "zh-CN"
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

## 注册对象存储

部署存算分离集群需要预先规划好使用的对象存储，将对象存储信息通过 ConfigMap 配置到 Doris 存算分离集群需要部署的 Namespace 下。

下面展示了存算分离集群使用 S3 协议的对象存储必填配置信息组成的 ConfigMap 格式：

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

对象存储信息以 JSON 格式配置。 在使用 ConfigMap 作为配置的载体时，必须以 `instance.conf` 作为 key，JSON 格式的对象存储信息整体作为 value 来配置。对象存储的详细配置请[参考存算分离文档](../install-quickstart#部署 DorisDisaggregatedCluster 资源)。

`DorisDisaggregatedCluster` 使用上述配置作为后端对象存储配置如下:

```yaml
apiVersion: disaggregated.cluster.doris.com/v1
kind: DorisDisaggregatedCluster
metadata:
  name: test-disaggregated-cluster
  namespace: default
spec:
  instanceConfigMap: vault-test
```

部署时按照上述描述更新配置，并更新到需要[部署的存算分离资源](../install-quickstart#部署 DorisDisaggregatedCluster 资源)中。

:::tip 提示
1. 上文 ConfigMap 中的配置信息为展示必填键值对，所有 value 的值都是虚构不能用于真实环境。请根据存算分离文档，根据实际支持 S3 协议的对象存储真实信息填写。
2. ConfigMap 必须提前下发部署到存算分离集群希望部署的命名空间。
::: 

## 配置元数据资源信息

部署存算分离集群需要指定使用的元数据资源信息，在部署 `DorisDisaggregatedCluster` 之前需要提前规划部署好需要使用的 `DorisDisaggregatedMetaService` 资源。按需填写下面的配置，更新到需要[部署的存算分离资源](../install-quickstart#部署 DorisDisaggregatedCluster 资源)中。

```yaml
spec:
  disMS:
    namespace: {metaServiceNamespace}
    name: {metaServiceName}
```

按实际使用资源填写如上信息，`{metaServiceNamespace}` 为使用的 `DorisDisaggregatedMetaService` 资源部署的命名空间，`{metaServiceName}` 为使用的 `DorisDisaggregatedMetaService` 资源的名称。

将填写的信息更新到需要[部署的存算分离资源](../install-quickstart#部署 DorisDisaggregatedCluster 资源)中。
