---
{
    "title": "Aliyun DLF",
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

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问阿里云 DLF 时所支持的参数。

| 属性名称            | 曾用名            | 描述                                                                                     | 默认值 | 是否必须 |
| --------------- | -------------- | -------------------------------------------------------------------------------------- | --- | ---- |
| `dlf.endpoint`    |                | DLF endpoint，参阅：https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints |     | 是    |
| `dlf.region`      |                | DLF region，参阅：https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints   |     | 是    |
| `dlf.uid`         |                | 阿里云账号。即阿里云控制台右上角个人信息的“云账号 ID”。                                                         |     | 是    |
| `dlf.access_key` |                | DLF access key。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。          |     | 是    |
| `dlf.secret_key` |                | DLF secret key。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。          |     | 是    |
| `dlf.catalog_id` | dlf.catalog.id | Catalog Id。用于指定数据目录，如果不填，使用默认的 Catalog ID。                                             |     | 否    |

