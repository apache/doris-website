---
{
    "title": "SHOW ROW POLICY",
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

View row security policies. For details on row security policies, refer to the "Security Policies" chapter

## Syntax

```sql
SHOW ROW POLICY [ FOR { <user_name> | ROLE <role_name> } ];
```
## Optional Parameters

**<user_name>**

> User name

**<role_name>**

> Role name

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes |
| :--------- | :----- | :---- |
| ADMIN_PRIV | Global |       |

## Examples

1. View all security policies


  ```sql
  SHOW ROW POLICY;
  ```

1. Query by specifying a user name

  ```sql
  SHOW ROW POLICY FOR user1;
  ```

1. Query by specifying a role name

  ```sql
  SHOW ROW POLICY for role role1;
  ```