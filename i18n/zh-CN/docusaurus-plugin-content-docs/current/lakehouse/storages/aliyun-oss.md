---
{
  "title": "Aliyun OSS",
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

# 阿里云 OSS 访问参数

本文档介绍访问阿里云 OSS 所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性

**Doris 使用 S3 Client，通过 S3 兼容协议访问阿里云 OSS。**

## 参数总览
| 属性名称                            | 曾用名              | 描述                                                             | 默认值    | 是否必须 |
|---------------------------------|------------------|----------------------------------------------------------------|--------|------|
| `s3.endpoint`                   | `oss.endpoint`   | OSS endpoint，指定阿里云 OSS 的访问端点。注意，OSS 和 OSS HDFS 的 endpoint 不相同。 |        | 是    |
| `s3.region`                     | `oss.region`     | OSS region，指定阿里云 OSS 的区域                                       |        | 否    |
| `s3.access_key`                 | `oss.access_key` | OSS access key，用于身份验证的 OSS 访问密钥                                |        | 是    |
| `s3.secret_key`                 | `oss.secret_key` | OSS secret key，与 access key 配合使用的访问密钥                          |        | 是    |
| `s3.connection.maximum`         |                  | S3 最大连接数，指定与 OSS 服务建立的最大连接数                                    | `50`   | 否    |
| `s3.connection.request.timeout` |                  | S3 请求超时时间，单位为毫秒，指定连接 OSS 服务时的请求超时时间                            | `3000` | 否    |
| `s3.connection.timeout`         |                  | S3 连接超时时间，单位为毫秒，指定与 OSS 服务建立连接时的超时时间                           | `1000` | 否    |
| `s3.sts_endpoint`               |                  | 尚未支持                                                           |        | 否    |
| `s3.sts_region`                 |                  | 尚未支持                                                           |        | 否    |
| `s3.iam_role`                   |                  | 尚未支持                                                           |        | 否    |
| `s3.external_id`                |                  | 尚未支持                                                           |        | 否    |

### 认证配置
访问阿里云 OSS 时，需要提供阿里云的 Access Key 和 Secret Key，即下列参数：

- `s3.access_key` （或 `oss.access_key`）
- `s3.secret_key` （或 `oss.secret_key`）

### 示例配置

```plaintext
"oss.access_key" = "ak",
"oss.secret_key" = "sk",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```

