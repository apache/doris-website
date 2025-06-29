---
{
  "title": "HDFS",
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

本文档用于介绍访问 OSS-HDFS 时所需的参数。这些参数适用于：

- Catalog 属性。
- Table Valued Function 属性。
- Broker Load 属性。
- Export 属性。
- Outfile 属性。
- 备份恢复

## 参数总览

| 参数名称                               | 描述                                                                                                                                                                                                    | 默认值 | 是否必须 | 备注说明                         |
|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----|------|------------------------------|
| `oss.hdfs.access_key`              | 用于认证的阿里云 Access Key ID，必须具有 OSS 的访问权限。                                                                                                                                                                | 无   | 是    | 与 `oss.hdfs.secret_key` 成对使用 |
| `oss.hdfs.secret_key`              | 用于认证的阿里云 Access Key Secret。                                                                                                                                                                           | 无   | 是    | 与 `oss.hdfs.access_key` 成对使用 |
| `oss.hdfs.endpoint`                | 阿里云 OSS-HDFS 服务的 Endpoint，例如 `cn-hangzhou.oss-dls.aliyuncs.com`。                                                                                                                                      | 无   | 是    | 决定请求发往哪个地域的 OSS 服务           |
| `oss.hdfs.region`                  | OSS bucket 所在的地域 ID，例如 `cn-beijing`。                                                                                                                                                                  | 无   | 是    |                              |
| `oss.hdfs.fs.defaultFS`            | 指定 OSS 的文件系统访问路径，例如 `oss://my-bucket/`。                                                                                                                                                               | 无   | 否    | Hadoop FS 初始化所需              |
| `oss.hdfs.hadoop.config.resources` | 指定包含 OSS 文件系统配置的路径，需使用相对路径，默认目录为（FE/BE）部署目录下的 /plugins/hadoop_conf/（可修改 fe.conf/be.conf 中的 hadoop_config_dir 来更改默认路径）。所有 FE 和 BE 节点需配置相同相对路径。示例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` | 无   | 否    | 一般用于兼容 Hadoop 环境配置           |

### 认证配置

- `oss.hdfs.access_key`:
- `oss.hdfs.secret_key`:

#### 认证类型

当前仅支持 ACCESS KEY/SECRET KEY 认证方式。

### Endpoint 配置

`oss.hdfs.endpoint`: 用于指定 OSS-HDFS 服务的 Endpoint。Endpoint 是访问阿里云 OSS
的入口地址，格式为 `<region>.oss-dls.aliyuncs.com`，例如 `cn-hangzhou.oss-dls.aliyuncs.com`。
我们会对格式进行强校验，确保 Endpoint 符合阿里云 OSS Endpoint 格式。
为保证向后兼容，Endpoint 配置项允许包含 https:// 或 http:// 前缀，系统在格式校验时会自动解析并忽略协议部分。

### 配置文件

OSS-HDFS 支持通过 `oss.hdfs.hadoop.config.resources` 参数来指定 HDFS 相关配置文件目录。

配置文件目录需包含 `hdfs-site.xml` 和 `core-site.xml` 文件，默认目录为（FE/BE）部署目录下的 `/plugins/hadoop_conf/`。所有 FE
和 BE 节点需配置相同的相对路径。

如果配置文件包含文档上述参数，则优先使用用户显示配置的参数。配置文件可以指定多个文件，多个文件以逗号分隔。如 `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。

### 向后兼容性

#### 向后兼容配置

**旧版本保留的参数，为向后兼容，但非最佳实践,应使用新参数**

| 旧参数名称                             | 新参数名称                 | 描述                                                               
|-----------------------------------|-----------------------|------------------------------------------------------------------|
| `s3.access_key`,`oss.access_key`  | `oss.hdfs.access_key` | 用于认证的阿里云 Access Key ID，必须具有 OSS 的访问权限。                           |
| `s3.secret_key` ,`oss.secret_key` | `oss.hdfs.secret_key` | 用于认证的阿里云 Access Key Secret。                                      |
| `s3.endpoint`,`oss.endpoint`      | `oss.hdfs.endpoint`   | 阿里云 OSS-HDFS 服务的 Endpoint，例如 `cn-hangzhou.oss-dls.aliyuncs.com`。 |
| `s3.region`,`oss.region`          | `oss.hdfs.region`     | OSS bucket 所在的地域 ID，例如 `cn-beijing`。                             |

