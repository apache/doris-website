---
{
    "title": "ALTER CATALOG",
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

This statement is used to set properties of the specified catalog.


## Syntax
1) Rename the catalog

    ```sql
    ALTER CATALOG <catalog_name> RENAME <new_catalog_name>;
    ```

2) Modify / Add properties for the catalog

    ```sql
    ALTER CATALOG <catalog_name> SET PROPERTIES ('<key>' = '<value>' [, ... ]); 
    ```

3) Modify comment for the catalog

    ```sql
    ALTER CATALOG <catalog_name> MODIFY COMMENT "<new catalog comment>";
    ```

## Required Parameters

**1. `<catalog_name>`**

The name of the catalog that should be modified

**2. `<new_catalog_name>`**

New catalog name after modification

**3. `'<key>' = '<value>'`**

The key and value of the catalog properties that need to be modified / added

**4. `<new catalog comment>`**

Modified catalog comment


## Access Control Requirements
| Privilege  | Object  | Notes                                     |
|:-----------|:--------|:------------------------------------------|
| ALTER_PRIV | Catalog | The ALTER_PRIV of the catalog is required |
## Usage Notes

1) Rename the catalog
- The builtin catalog `internal` cannot be renamed
- Only the one who has at least Alter privilege can rename a catalog
- After renaming the catalog, use the REVOKE and GRANT commands to modify the appropriate user permissions

2) Modify / Add properties for the catalog

- property `type` cannot be modified.
- properties of builtin catalog `internal` cannot be modified.
- Update values of specified keys. If a key does not exist in the catalog properties, it will be added.

3) Modify comment for the catalog

- The builtin catalog `internal` cannot be modified

## Example

1. rename catalog ctlg_hive to hive

      ```sql
      ALTER CATALOG ctlg_hive RENAME hive;
      ```

2. modify property `hive.metastore.uris` of catalog hive

      ```sql
      ALTER CATALOG hive SET PROPERTIES ('hive.metastore.uris'='thrift://172.21.0.1:9083');
      ```

3. modify comment of catalog hive
      ```sql
      ALTER CATALOG hive MODIFY COMMENT "new catalog comment";
      ```

