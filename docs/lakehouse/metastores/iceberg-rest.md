---
{
    "title": "Iceberg Rest Catalog API",
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

This document is used to introduce the parameters supported when connecting and accessing the metadata service that supports the Iceberg Rest Catalog interface through the `CREATE CATALOG` statement.

| Property Name                | Former Name | Description                                      | Default Value | Required       |
| -------------------------- | --- | ------------------------------------------- | ---- | ---------- |
| `iceberg.rest.uri`           | uri | Rest Catalog connection address. Example: `http://172.21.0.1:8181` |      | Yes          |
| `iceberg.rest.security.type` |     | Security authentication method for Rest Catalog. Supports `none` or `oauth2`     | `none` | `oauth2` not yet supported |
| `iceberg.rest.prefix`        |     |                                             |      | Not yet supported       |
| `iceberg.rest.oauth2.xxx`    |     | Information related to oauth2 authentication                               |      | Not yet supported       |

