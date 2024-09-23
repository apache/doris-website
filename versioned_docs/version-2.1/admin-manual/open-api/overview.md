---
{
    "title": "Overview",
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

As a supplement to Apache Doris operation and maintenance management, OPEN API is mainly used by database administrators to perform some management operations.

:::note
The OPEN API is currently unstable and is only recommended for developers to test and use. We may change the interface behavior in subsequent versions.
In a production environment, it is recommended to use SQL commands to complete operations.
:::

## Security certification

The security authentication of FE BE API can be enabled through the following configuration:

| Configuration | Configuration File | Default Value | Description |
| --- | ---| --- | --- |
| `enable_all_http_auth` | `be.conf` | `false` | Enable authentication for BE HTTP port (default 8040). After enabling, access to BE's HTTP API requires ADMIN user login. |
| `enable_brpc_builtin_services` | `be.conf` | true | Whether to open brpc built-in service to the outside world (default is 8060). If disabled, HTTP port 8060 will be inaccessible. (Supported since version 2.1.7) |
| `enable_all_http_auth` | `fe.conf` | `false` | Enable authentication for the FE HTTP port (default 8030). After enabling, access to the FE HTTP API requires corresponding user permissions. |

:::info NOTE
The permission requirements for the HTTP API of FE and BE vary from version to version. Please refer to the corresponding API documentation for details.
:::

