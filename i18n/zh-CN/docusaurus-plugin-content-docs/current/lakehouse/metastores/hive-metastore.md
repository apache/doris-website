---
{
    "title": "Hive Metastore",
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

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问 Hive Metastore 时所支持的参数。

| 属性名称                               | 描述                                                                                                                                                                              | 默认值  | 是否必须 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| `hive.metastore.uri`                 | Hive Metastore 的 URI 地址。可以从 hive-site.xml 中获取。支持指定多个 URI，使用逗号分隔。默认使用第一个 URI，当第一个 URI 不可用时，会尝试使用其他的。如：`thrift://172.0.0.1:9083` 或 `thrift://172.0.0.1:9083,thrift://172.0.0.2:9083` | 无    | 是    |
| `hive.metastore.authentication.type | Hive Metastore 的认证方式。支持 `none` 和 `kerberos` 两种。在 2.1 及之前版本中，认证方式由`hadoop.security.authentication`属性决定。3.0 版本开始，可以单独指定 Hive Metastore 的认证方式。                                       | none | 否    |
| `hive.metastore.service.principal`   | 当认证方式为 kerberos 时，用于指定 Hive Metastore 服务端的 principal。                                                                                                                             | 空    | 否    |
| `hive.metastore.client.principal`    | 当认证方式为 kerberos 时，用于指定 Hive Metastore 客户端的 principal。                                                                                                                             | 空    | 否    |
| `hive.metastore.client.keytab`       | 当认证方式为 kerberos 时，用于指定 Hive Metastore 客户端的 keytab。keytab 文件必须要放置到所有 FE 节点的相同目录下。                                                                                                   | 空    | 否    |
