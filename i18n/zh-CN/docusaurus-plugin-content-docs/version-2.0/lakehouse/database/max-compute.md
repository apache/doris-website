---
{
    "title": "MaxCompute",
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


MaxCompute 是阿里云上的企业级 SaaS（Software as a Service）模式云数据仓库。

:::note
[什么是 MaxCompute](https://help.aliyun.com/zh/maxcompute/product-overview/what-is-maxcompute?spm=a2c4g.11174283.0.i1)
:::

## 连接 Max Compute

```sql
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.region" = "cn-beijing",
  "mc.default.project" = "your-project",
  "mc.access_key" = "ak",
  "mc.secret_key" = "sk"
);
```

* `mc.region`：MaxCompute 开通的地域。可以从 Endpoint 中找到对应的 Region，参阅[ Endpoints ](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints?spm=a2c4g.11186623.0.0)。

* `mc.default.project`：MaxCompute 项目。可以在[MaxCompute 项目列表](https://maxcompute.console.aliyun.com/cn-beijing/project-list)中创建和管理。

* `mc.access_key`：AccessKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。

* `mc.secret_key`：SecretKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。

* `mc.public_access`: 当配置了`"mc.public_access"="true"`，可以开启公网访问，建议测试时使用。

## 限额

连接 MaxCompute 时，按量付费的 Quota 查询并发和使用量有限，如需增加资源，请参照 MaxCompute 文档。参见[ 配额管理 ](https://help.aliyun.com/zh/maxcompute/user-guide/manage-quotas-in-the-new-maxcompute-console).

## 列类型映射

和 Hive Catalog 一致，可参阅 [Hive Catalog](../../lakehouse/datalake/hive) 中 **列类型映射** 一节。

## 自定义服务地址

默认情况下，Max Compute Catalog 根据 region 去默认生成公网的 endpoint。

除了默认的 endpoint 地址外，Max Compute Catalog 也支持在属性中自定义服务地址。

使用以下两个属性：
* `mc.odps_endpoint`：Max Compute Endpoint。

* `mc.tunnel_endpoint`: Tunnel Endpoint，Max Compute Catalog 使用 Tunnel SDK 获取数据。

Max Compute Endpoint 和 Tunnel Endpoint 的配置请参见[各地域及不同网络连接方式下的 Endpoint](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)

示例：

```sql
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.region" = "cn-beijing",
  "mc.default.project" = "your-project",
  "mc.access_key" = "ak",
  "mc.secret_key" = "sk"
  "mc.odps_endpoint" = "http://service.cn-beijing.maxcompute.aliyun-inc.com/api",
  "mc.tunnel_endpoint" = "http://dt.cn-beijing.maxcompute.aliyun-inc.com"
);
```


