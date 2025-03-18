---
{
    "title": "SHOW ROLES",
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

The `SHOW ROLES` statement is used to display all created role information, including role name, included users and permissions.

## Syntax 

```sql
SHOW ROLES
```

## Return Value

| Column                | DataType    | Note                           |
|-----------------------|-------------|--------------------------------|
| Name                  | string      | Role Name                      |
| Comment               | string      | Comment                        |
| Users                 | string      | Included Users                 |
| GlobalPrivs           | string      | Global Privileges              |
| CatalogPrivs          | string      | Catalog Privileges             |
| DatabasePrivs         | string      | Database Privileges            |
| TablePrivs            | string      | Table Privileges               |
| ResourcePrivs         | string      | Resource Privileges            |
| WorkloadGroupPrivs    | string      | Workload Group Privileges      |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| GRANT_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with GRANT_PRIV permissions  |

## Usage Notes

Doris creates a default role for each user. If you want to display the default role, you can execute the command ```set show_user_default_role=true;```.

## Example

- View created roles

```sql
SHOW ROLES
```