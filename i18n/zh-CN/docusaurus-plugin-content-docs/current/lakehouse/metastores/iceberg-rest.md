---
{
    "title": "Iceberg Rest Catalog API",
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

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问支持 Iceberg Rest Catalog 接口的元数据服务时所支持的参数。

| 属性名称                       | 曾用名 | 描述                                          | 默认值  | 是否必须       |
| -------------------------- | --- | ------------------------------------------- | ---- | ---------- |
| `iceberg.rest.uri`           | uri | Rest Catalog 连接地址。示例：`http://172.21.0.1:8181` |      | 是          |
| `iceberg.rest.security.type` |     | Rest Catalog 的安全认证方式。支持 `none`或`oauth2`     | `none` | `oauth2` 尚未支持 |
| `iceberg.rest.prefix`        |     |                                             |      | 尚未支持       |
| `iceberg.rest.oauth2.xxx`    |     | oauth2 认证相关信息                               |      | 尚未支持       |

