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
## 参数总览
| 属性名称                                 | 描述                                                                                                                                                                                                                                        | 默认值    | 是否必须 |
|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------|------|
| `hive.metastore.uris`                | Hive Metastore 的 URI 地址。支持指定多个 URI，使用逗号分隔。默认使用第一个 URI，当第一个 URI 不可用时，会尝试使用其他的。如：`thrift://172.0.0.1:9083` 或 `thrift://172.0.0.1:9083,thrift://172.0.0.2:9083`                                                                              | 无      | 是    |
| `hive.conf.resources`                | hive-site.xml 文件位置，用于从hive-site.xml 文件中加载连接 HMS 所需参数，若hive-site.xml 文件包含完整的链接参数信息，则可仅填写此参数。配置文件必须放在 FE 部署目录，默认目录为部署目录下的 /plugins/hadoop_conf/（可修改fe.conf中的hadoop_config_dir 来更改默认路径），文件位置需要为相对路径，如 hms-1/hive-site.xml。且所有 FE 节点都必须含有此文件。 | 空      | 否    |
| `hive.metastore.authentication.type` | Hive Metastore 的认证方式。支持 `simple` 和 `kerberos` 两种。在 2.1 及之前版本中，认证方式由`hadoop.security.authentication`属性决定。3.0 版本开始，可以单独指定 Hive Metastore 的认证方式。                                                                                             | simple | 否    |
| `hive.metastore.service.principal`   | 当认证方式为 kerberos 时，用于指定 Hive Metastore 服务端的 principal。                                                                                                                                                                                     | 空      | 否    |
| `hive.metastore.client.principal`    | 当认证方式为 kerberos 时，用于指定 Hive Metastore 客户端的 principal。在 2.1 及之前版本中，该参数由`hadoop.kerberos.principal`属性决定。                                                                                                                                    | 空      | 否    |
| `hive.metastore.client.keytab`       | 当认证方式为 kerberos 时，用于指定 Hive Metastore 客户端的 keytab。keytab 文件必须要放置到所有 FE 节点的相同目录下。                                                                                                                                                          | 空      | 否    |

## 认证参数
在 Hive Metastore 中，有两种认证方式：simple 和 kerberos。
### `hive.metastore.authentication.type`
- **描述**  
  指定 Hive Metastore 的认证方式。
- **可选值**
    - `simple`（默认）: 即不使用任何认证。
    - `kerberos`: 启用 Kerberos 认证
- **版本差异**
    - 2.1 及之前版本：依赖全局参数 `hadoop.security.authentication`
    - 3.0+ 版本：可独立配置
### 启用 Simple 认证相关参数
直接指定 `hive.metastore.authentication.type = simple` 即可。
**生产环境不建议使用此方式**
#### 完整示例
```properties
hive.metastore.authentication.type = simple
```
### 启用 Kerberos 认证相关参数
#### `hive.metastore.service.principal`
- **描述**  
  Hive Metastore 服务的 Kerberos 主体，用于 Doris 验证 Metastore 身份。
- **占位符支持**  
  `_HOST` 会自动替换为实际连接的 Metastore 主机名（适用于多节点 Metastore 集群）。
- **示例**
  ```plaintext
  hive/hive-metastore01.example.com@EXAMPLE.COM
  hive/_HOST@EXAMPLE.COM  # 动态解析实际主机名
  ```
#### `hive.metastore.client.principal`
- **描述**
  连接到 Hive MeteStore 服务时使用的 Kerberos 主体。 例如：doris/fe@EXAMPLE.COM或doris/_HOST@EXAMPLE.COM。
- **占位符支持**  
  `_HOST` 会自动替换为实际连接的 Metastore 主机名（适用于多节点 Metastore 集群）。
- **示例**
  ```plaintext
  doris/fe@EXAMPLE.COM
  doris/_HOST@EXAMPLE.COM  # 动态解析实际主机名
  ```
#### `hive.metastore.client.keytab`
- **描述**
  包含指定的 principal 的密钥的密钥表文件的路径。运行所有 FE 的操作系统用户必须有权限读取此文件。
- **示例**
  ```properties
  hive.metastore.client.keytab = conf/doris.keytab
   ```


#### 完整示例  
启用 Kerberos 认证
```properties
hive.metastore.authentication.type = kerberos
hive.metastore.service.principal = hive/_HOST@EXAMPLE.COM
hive.metastore.client.principal = doris/_HOST@EXAMPLE.COM
hive.metastore.client.keytab = etc/doris/conf/doris.keytab
```
  
