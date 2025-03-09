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
# HDFS 
本文档用于介绍访问 HDFS 时所需的参数。这些参数适用于：
- Catalog 属性。
- Table Valued Function 属性。
- Broker Load 属性。
- Export 属性。
- Outfile 属性。
- 备份恢复

## 参数总览
| 属性名称                                     | 曾用名                              | 描述                                                                                                                                                                                                                                        | 默认值      | 是否必须 |
|------------------------------------------|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|------|
| `hdfs.authentication.type`               | `hadoop.security.authentication` | 访问HDFS的认证类型。支持 `kerberos` 和 `simple`                                                                                                                                                                                                      | `simple` | 否    |
| `hdfs.authentication.kerberos.principal` | `hadoop.kerberos.principal`      | 当认证类型为 `kerberos` 时，指定 principal                                                                                                                                                                                                          | -        | 否    |
| `hdfs.authentication.kerberos.keytab`    | `hadoop.kerberos.keytab`         | 当认证类型为 `kerberos` 时，指定 keytab                                                                                                                                                                                                             | -        | 否    |
| `hdfs.impersonation.enabled`             | -                                | 如果为 `true`，将开启HDFS的impersonation功能。会使用 `core-site.xml` 中配置的代理用户，来代理 Doris 的登录用户，执行HDFS操作                                                                                                                                                  | `尚未支持`   | -    |
| `hadoop.username`                        | -                                | 当认证类型为 `simple` 时，会使用此用户来访问HDFS。默认情况下，会使用运行 Doris 进程的 Linux 系统用户进行访问                                                                                                                                                                      | -        | -    |
| `hadoop.config.resources`                | -                                | 指定 HDFS 相关配置文件目录（需包含 `hdfs-site.xml` 和 `core-site.xml`）,需使用相对路径，默认目录为（FE/BE）部署目录下的 /plugins/hadoop_conf/（可修改 fe.conf/be.conf 中的hadoop_config_dir 来更改默认路径）。所有 FE 和 BE 节点需配置相同相对路径。示例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` | -        | -    |
| `dfs.nameservices`                       | -                                | 手动配置HDFS高可用集群的参数。若使用 `hadoop.config.resources` 配置，则会自动从 `hdfs-site.xml` 读取参数。需配合以下参数：<br>`dfs.ha.namenodes.your-nameservice`<br>`dfs.namenode.rpc-address.your-nameservice.nn1`<br>`dfs.client.failover.proxy.provider` 等                 | -        | -    |

### 认证配置
- hdfs.authentication.type: 用于指定认证类型。可选值为 kerberos 或 simple。如果选择 kerberos，系统将使用 Kerberos 认证同 HDFS 交互；如果使用 simple ，表示不使用认证，适用于开放的 HDFS 集群。选择 kerberos 需要配置相应的 principal 和 keytab。
- hdfs.authentication.kerberos.principal: 当认证类型为 kerberos 时，指定 Kerberos 的 principal。Kerberos principal 是一个唯一标识身份的字符串，通常包括服务名、主机名和域名。
- hdfs.authentication.kerberos.keytab: 该参数指定用于 Kerberos 认证的 keytab 文件路径。keytab 文件用于存储加密的凭证，允许系统自动进行认证，无需用户手动输入密码。
#### 认证类型
HDFS 支持两种认证方式：即 
- Kerberos
- Simple

##### Simple 认证
Simple 认证适用于未开启 Kerberos 的 HDFS 集群。生产环境不建议使用此方式。

开启 Simple 认证方式，需要设置以下参数：
```
hdfs.authentication.type: simple
```
Simple 认证模式下，可以使用 `hadoop.username` 参数来指定用户名。如不指定，则默认使用当前进程运行的用户名。

**示例：**

使用 `lakers` 用户名访问 HDFS
```properties
hdfs.authentication.type = simple
hadoop.username = lakers
```
使用默认系统用户访问 HDFS
```properties
hdfs.authentication.type = simple
```
##### Kerberos 认证
Kerberos 认证适用于已开启 Kerberos 的 HDFS 集群。

开启 Kerberos 认证方式，需要设置以下参数：
```properties
hdfs.authentication.type = kerberos
hdfs.authentication.kerberos.principal = hdfs/hadoop@HADOOP.COM
hdfs.authentication.kerberos.keytab = /etc/security/keytabs/hdfs.keytab
```
Kerberos 认证模式下，需要设置 Kerberos 的 principal 和 keytab 文件路径。
Doris 将以该 hdfs.authentication.kerberos.principal 属性指定的主体身份访问 HDFS， 使用 keytab 指定的 keytab 对该 Principal 进行认证。

**注意：**
- Keytab 文件需要在每个 FE 和 BE 节点上均存在，且路径相同，同时运行 Doris 进程的用户必须具有该 keytab 文件的读权限。

示例：
```properties
hdfs.authentication.type = kerberos
hdfs.authentication.kerberos.principal = hdfs/hadoop@HADOOP.COM
hdfs.authentication.kerberos.keytab = etc/security/keytabs/hdfs.keytab
```

### 配置文件
Doris 支持通过 `hadoop.config.resources` 参数来指定 HDFS 相关配置文件目录。
配置文件目录需包含 `hdfs-site.xml` 和 `core-site.xml` 文件，默认目录为（FE/BE）部署目录下的 `/plugins/hadoop_conf/`。所有 FE 和 BE 节点需配置相同的相对路径。

如果配置文件包含文档上述参数，则优先使用用户显示配置的参数。配置文件可以指定多个文件，多个文件以逗号分隔。如 `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。


