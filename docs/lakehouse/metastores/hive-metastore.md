---
{
  "title": "Hive Metastore",
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

This document is used to introduce the parameters supported when connecting and accessing the Hive Metastore through the `CREATE CATALOG` statement.
## Parameter Overview
| Property Name                         | Alias | Description                                                                                                                                                                                                                                 | Default | Required |
|--------------------------------------|---|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------|------|
| `hive.metastore.uris`                | | The URI address of the Hive Metastore. Multiple URIs can be specified, separated by commas. The first URI is used by default, and if the first URI is unavailable, others will be tried. For example: `thrift://172.0.0.1:9083` or `thrift://172.0.0.1:9083,thrift://172.0.0.2:9083` | None   | Yes  |
| `hive.conf.resources`                | | The location of the hive-site.xml file, used to load the parameters needed to connect to HMS from the hive-site.xml file. If the hive-site.xml file contains complete connection parameter information, only this parameter needs to be filled in. The configuration file must be placed in the FE deployment directory, with the default directory being `/plugins/hadoop_conf/` under the deployment directory (the default path can be changed by modifying `hadoop_config_dir` in fe.conf), and the file location needs to be a relative path, such as hms-1/hive-site.xml. All FE nodes must contain this file. | Empty  | No   |
| `hive.metastore.authentication.type` | | The authentication method for the Hive Metastore. Supports `simple` and `kerberos`. In versions 2.1 and earlier, the authentication method is determined by the `hadoop.security.authentication` property. Starting from version 3.0, the authentication method for the Hive Metastore can be specified separately. | simple | No   |
| `hive.metastore.service.principal`   | | When the authentication method is kerberos, used to specify the principal of the Hive Metastore server.                                                                                                                                                                                     | Empty  | No   |
| `hive.metastore.client.principal`    | | When the authentication method is kerberos, used to specify the principal of the Hive Metastore client. In versions 2.1 and earlier, this parameter is determined by the `hadoop.kerberos.principal` property.                                                                                                                                    | Empty  | No   |
| `hive.metastore.client.keytab`       | | When the authentication method is kerberos, used to specify the keytab of the Hive Metastore client. The keytab file must be placed in the same directory on all FE nodes.                                                                                                                                                          | Empty  | No   |

## Authentication Parameters
In Hive Metastore, there are two authentication methods: simple and kerberos.

### `hive.metastore.authentication.type`

- Description  
    Specifies the authentication method for the Hive Metastore.

- Optional Values
    - `simple` (default): No authentication is used.
    - `kerberos`: Enable Kerberos authentication

- Version Differences
    - Versions 2.1 and earlier: Relies on the global parameter `hadoop.security.authentication`
    - Version 3.1+: Can be configured independently

### Enabling Simple Authentication Related Parameters
Simply specify `hive.metastore.authentication.type = simple`. **Not recommended for production environments**

#### Complete Example
```plaintext
"hive.metastore.authentication.type" = "simple"
```

### Enabling Kerberos Authentication Related Parameters

#### `hive.metastore.service.principal`
- Description  
    The Kerberos principal of the Hive Metastore service, used for Doris to verify the identity of the Metastore.

- Placeholder Support  
    `_HOST` will automatically be replaced with the actual hostname of the connected Metastore (suitable for multi-node Metastore clusters).

- Example
    ```plaintext
    hive/hive-metastore01.example.com@EXAMPLE.COM
    hive/_HOST@EXAMPLE.COM  # Dynamically resolve the actual hostname
    ```

#### `hive.metastore.client.principal`
- Description
    The Kerberos principal used when connecting to the Hive Metastore service. For example: `doris/fe@EXAMPLE.COM` or `doris/_HOST@EXAMPLE.COM`.

- Placeholder Support  
    `_HOST` will automatically be replaced with the actual hostname of the connected Metastore (suitable for multi-node Metastore clusters).

- Example
    ```plaintext
    doris/fe@EXAMPLE.COM
    doris/_HOST@EXAMPLE.COM  # Dynamically resolve the actual hostname
    ```

#### `hive.metastore.client.keytab`
- Description
    The path to the keytab file containing the key for the specified principal. The operating system user running all FEs must have permission to read this file.

- Example
    ```plaintext
    "hive.metastore.client.keytab" = "conf/doris.keytab"
    ```

#### Complete Example  

Enable Kerberos authentication

```plaintext
"hive.metastore.authentication.type" = "kerberos",
"hive.metastore.service.principal" = "hive/_HOST@EXAMPLE.COM",
"hive.metastore.client.principal" = "doris/_HOST@EXAMPLE.COM",
"hive.metastore.client.keytab" = "etc/doris/conf/doris.keytab"
```
