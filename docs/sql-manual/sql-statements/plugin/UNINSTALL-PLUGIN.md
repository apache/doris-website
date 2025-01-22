---
{
    "title": "UNINSTALL PLUGIN",
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


## Description

This statement is used to uninstall a plugin.

## Syntax：

```sql
UNINSTALL PLUGIN plugin_name;
```

## Required parameters

- plugin_name
 The name of the uninstalled plugin

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object   | Notes            |
|:-----------|:-----|:--------------|
| Admin_priv | The entire cluster | Requires administrative privileges for the entire cluster |

## Precautions

Only non-builtin plugins can be uninstalled

## Example

- To uninstall a plugin:

    ```sql
    UNINSTALL PLUGIN auditdemo;
    ```
