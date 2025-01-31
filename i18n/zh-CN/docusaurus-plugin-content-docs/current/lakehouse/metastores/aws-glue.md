---
{
    "title": "AWS Glue",
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

本文档用于介绍通过`CREATE CATALOG`语句连接并访问 AWS Glue 时所支持的参数。

| 属性名称              | 描述                                                          | 默认值  | 是否必须 |
| ----------------- | ----------------------------------------------------------- | ---- | ---- |
| `glue.endpoint`     | AWS Glue endpoint。示例：`https://glue.us-east-1.amazonaws.com` | none | 是    |
| `glue.access_key`  | AWS Glue access key                                         | 空    | 是    |
| `glue.secret_key`  | AWS Glue secret key                                         | 空    | 是    |
| `glue.catalog_id`  |                                                             |      | 尚未支持 |
| `glue.iam_role`    |                                                             |      | 尚未支持 |
| `glue.external_id` |                                                             |      | 尚未支持 |

