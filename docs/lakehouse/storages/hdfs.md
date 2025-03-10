---
{
  "title": "HDFS",
  "language": "en"
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
This document is used to introduce the parameters required when accessing HDFS. These parameters apply to:
- Catalog properties.
- Table Valued Function properties.
- Broker Load properties.
- Export properties.
- Outfile properties.
- Backup and restore

## Parameter Overview
| Property Name                            | Former Name                      | Description                                                                                                                                                                                                                                        | Default Value | Required |
|------------------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|----------|
| `hdfs.authentication.type`               | `hadoop.security.authentication` | Authentication type for accessing HDFS. Supports `kerberos` and `simple`                                                                                                                                                                           | `simple`      | No       |
| `hdfs.authentication.kerberos.principal` | `hadoop.kerberos.principal`      | Specifies the principal when the authentication type is `kerberos`                                                                                                                                                                                 | -             | No       |
| `hdfs.authentication.kerberos.keytab`    | `hadoop.kerberos.keytab`         | Specifies the keytab when the authentication type is `kerberos`                                                                                                                                                                                    | -             | No       |
| `hdfs.impersonation.enabled`             | -                                | If `true`, HDFS impersonation will be enabled. It will use the proxy user configured in `core-site.xml` to proxy the Doris login user to perform HDFS operations                                                                                   | `Not supported yet` | -    |
| `hadoop.username`                        | -                                | When the authentication type is `simple`, this user will be used to access HDFS. By default, the Linux system user running the Doris process will be used                                                                                          | -             | -        |
| `hadoop.config.resources`                | -                                | Specifies the directory of HDFS-related configuration files (must include `hdfs-site.xml` and `core-site.xml`), must use a relative path, the default directory is /plugins/hadoop_conf/ under the (FE/BE) deployment directory (can be changed by modifying hadoop_config_dir in fe.conf/be.conf). All FE and BE nodes must configure the same relative path. Example: `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` | -             | -        |
| `dfs.nameservices`                       | -                                | Manually configure parameters for HDFS high availability clusters. If configured with `hadoop.config.resources`, parameters will be automatically read from `hdfs-site.xml`. Must be used with the following parameters:<br>`dfs.ha.namenodes.your-nameservice`<br>`dfs.namenode.rpc-address.your-nameservice.nn1`<br>`dfs.client.failover.proxy.provider` etc. | -             | -        |

### Authentication Configuration
- `hdfs.authentication.type`: Used to specify the authentication type. Options are `kerberos` or `simple`. If `kerberos` is selected, the system will use Kerberos authentication to interact with HDFS; if `simple` is used, it means no authentication is used, suitable for open HDFS clusters. Choosing kerberos requires configuring the corresponding principal and keytab.
- `hdfs.authentication.kerberos.principal`: Specifies the Kerberos principal when the authentication type is `kerberos`. A Kerberos principal is a string that uniquely identifies an identity, usually including the service name, hostname, and domain name.
- `hdfs.authentication.kerberos.keytab`: This parameter specifies the path to the keytab file used for Kerberos authentication. The keytab file is used to store encrypted credentials, allowing the system to authenticate automatically without requiring the user to manually enter a password.

#### Authentication Types
HDFS supports two authentication methods:
- Kerberos
- Simple

##### Simple Authentication
Simple authentication is suitable for HDFS clusters where Kerberos is not enabled.

To use Simple authentication, the following parameter needs to be set:

```plaintext
"hdfs.authentication.type" = "simple"
```

In Simple authentication mode, the `hadoop.username` parameter can be used to specify the username. If not specified, the username of the current process will be used by default.

**Example:**

Access HDFS using the `lakers` username
```plaintext
"hdfs.authentication.type" = "simple",
"hadoop.username" = "lakers"
```

Access HDFS using the default system user
```plaintext
"hdfs.authentication.type" = "simple"
```
##### Kerberos Authentication
Kerberos authentication is suitable for HDFS clusters where Kerberos is enabled.

To use Kerberos authentication, the following parameters need to be set:

```plaintext
"hdfs.authentication.type" = "kerberos"
"hdfs.authentication.kerberos.principal" = "<your_principal>"
"hdfs.authentication.kerberos.keytab" = "<your_keytab>"
```

In Kerberos authentication mode, the Kerberos principal and keytab file path need to be set.

Doris will access HDFS with the identity specified by the `hdfs.authentication.kerberos.principal` property, using the keytab specified by the keytab for authentication.

**Note:**
- The keytab file must exist on every FE and BE node, and the path must be the same, and the user running the Doris process must have read permission for the keytab file.

Example:
```plaintext
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "hdfs/hadoop@HADOOP.COM",
"hdfs.authentication.kerberos.keytab" = "/etc/security/keytabs/hdfs.keytab",
```

### Configuration Files

Doris supports specifying the directory of HDFS-related configuration files through the `hadoop.config.resources` parameter.

The configuration file directory must include `hdfs-site.xml` and `core-site.xml` files, the default directory is `/plugins/hadoop_conf/` under the (FE/BE) deployment directory. All FE and BE nodes must configure the same relative path.

If the configuration file contains the parameters mentioned in the document above, the parameters explicitly configured by the user will be used preferentially. The configuration file can specify multiple files, separated by commas. For example, `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`.

