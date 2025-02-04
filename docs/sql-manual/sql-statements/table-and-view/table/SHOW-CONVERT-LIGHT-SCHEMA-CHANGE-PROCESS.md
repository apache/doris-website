---
{
    "title": "SHOW CONVERT LIGHT SCHEMA CHANGE PROCESS",
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

Used to view the conversion process of non-light schema change OLAP tables to light schema change tables.

## Syntax

```sql
SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS [ FROM <db_name> ]
```

## Optional parameters

**1. `<db_name>`**
> The name of the database to be queried can be specified in the FROM clause.

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Database | Currently only supports **ADMIN** permissions to perform this operation |

## Usage Notes

- To execute this statement, you need to enable the configuration `enable_convert_light_weight_schema_change`.

## Examples

- View the conversion on database test

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS FROM test;
  ```

- View global conversion status

  ```sql
  SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS;
  ```