---
{
    "title": "CREATE ROLE",
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

The `CREATE ROLE` statement is used to create an unprivileged role, which can be subsequently granted with the GRANT command.

## Syntax 

```sql
 CREATE ROLE <role_name> [<comment>];
```

## Required Parameters

**<role_name>**

> The name of the role. 

## Optional Parameters

**<comment>**

> The comment of the role.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with ADMIN_PRIV permissions  |

## Example

- Create a role

```sql
CREATE ROLE role1;
```

- Create a role with comment

```sql
CREATE ROLE role2 COMMENT "this is my first role";
```
