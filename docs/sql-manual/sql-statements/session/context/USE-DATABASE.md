---
{
    "title": "USE DATABASE",
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

Used to switch to the specified database or compute group.

## Syntax

```SQL
USE { [<catalog_name>.]<database_name>[@<compute_group_name>] | @<compute_group_name> }
```

## Required Parameters

Switch to the specified database.

   **1. `<database_name>`**
   > The name of the database to switch to.
   > If no catalog is specified, the current catalog is used by default.

Switch to the specified compute group only.

   **1. `<compute_group_name>`**
   > The name of the compute group to switch to.

## Optional Parameters

Switch to the specified database.

   **1. `<catalog_name>`**
   > The name of the catalog to switch to.
   
   **2. `<compute_group_name>`**
   > The name of the compute group to switch to.

## Access Control Requirements

| Privilege   | Object                | Notes                                                                |
|-------------|-----------------------|----------------------------------------------------------------------|
| SELECT_PRIV | Catalog, Database     | SELECT_PRIV privilege is required on the catalog or database to switch to. |
| USAGE_PRIV  | Compute Group         | USAGE_PRIV privilege is required on the compute group to switch to.  |

## Examples

1. If the `demo` database exists, try to use it:

   ```sql
   mysql> use demo;
   Database changed
   ```

2. If the `demo` database exists under the `hms_catalog` catalog, try to switch to `hms_catalog` and use it:

    ```sql
    mysql> use hms_catalog.demo;
    Database changed
    ```

3. If the `demo` database exists in the current catalog and you want to use the compute group named 'cg1', try to access it:

    ```sql
    mysql> use demo@cg1;
    Database changed
    ```

4. If you only want to use the compute group named 'cg1', try to access it:

    ```sql
    mysql> use @cg1;
    Database changed
    ```