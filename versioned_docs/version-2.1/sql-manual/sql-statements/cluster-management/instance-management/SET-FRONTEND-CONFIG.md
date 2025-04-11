---
{
  "title": "SET FRONTEND CONFIG",
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

This statement is used to set the configuration items of the cluster (currently only supports setting FE configuration items).

## Syntax:

```sql
ADMIN SET {ALL FRONTENDS | FRONTEND} CONFIG ("<fe_config_key>" = "<fe_config_value>")
```

## Required Parameters
**`{ALL FRONTENDS | FRONTEND}`**
> **`ALL FRONTENDS`**: Represents all FE nodes in the Doris cluster
>
> **`FRONTEND`**: Represents the currently connected FE node, i.e., the FE node the user is interacting with

## Optional Parameters
The `<fe_config_key>` and `<fe_config_value>` that need to be modified can be viewed through the [SHOW FRONTEND CONFIG](./SHOW-FRONTEND-CONFIG) command

:::tip Explanation

- Starting from version 2.1.5, the `ALL` keyword is supported. When using the `ALL` keyword, the configuration parameters will be applied to all FEs (except for the `master_only` parameter).
- This syntax does not persistently modify the configuration. After an FE restarts, the modified configuration becomes invalid. To persist the changes, the configuration items need to be synchronously added in fe.conf.
  :::

## Example

1. Set `disable_balance` to `true`

    ```sql
    ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
    ```

2. Set `disable_balance` of all FE nodes to `true`
   ```sql
   ADMIN SET ALL FRONTENDS CONFIG ("disable_balance" = "true");
   ```
