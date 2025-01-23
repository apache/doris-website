---
{
    "title": "CREATE DATABASE",
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

This statement is used to create a new database

## Syntax

```sql
CREATE DATABASE [IF NOT EXISTS] <db_name>
    [PROPERTIES ("<key>"="<value>", ...)];
```

## Required parameters

** 1. `<db_name>`**
>  Database Name

## Optional parameters

** 1. `<PROPERTIES>`**
>  Additional information about this database

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object    | Notes             |
|:-----------|:------|:---------------|
| CREATE_PRIV | Corresponding database | You need to have the create permission for the corresponding database |


## Precautions

If you want to specify the default replica distribution strategy for the table under db, you need to specify `<replication_allocation>` (the `<replication_allocation>` attribute of table has a higher priority than db):

  ```sql
  PROPERTIES (
    "replication_allocation" = "tag.location.default:3"
  )
  ```

## Example

- Create a new database db_test

   ```sql
   CREATE DATABASE db_test;
   ```

- Create a new database and set the default replica distribution:

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"replication_allocation" = "tag.location.group_1:3"
   );
   ```
