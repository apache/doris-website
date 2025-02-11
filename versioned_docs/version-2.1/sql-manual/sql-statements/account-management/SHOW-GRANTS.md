---
{
    "title": "SHOW GRANTS",
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

 This statement is used to view user permissions.

## Syntax

```sql
SHOW [ALL] GRANTS [FOR <user_identity>];
```

## Optional Parameters

**1. `[ALL]`**

Whether to view the permissions of all users.

**2. `<user_identity>`**

  Specify the user whose permissions are to be viewed. The `user_identity` must be created by the `CREATE USER` command.

## Return Value

  | Column | Description |
  | -- | -- |
  | UserIdentity | User identity |
  | Comment | Comment |
  | Password | Whether the password is set |
  | Roles | Roles |
  | GlobalPrivs | Global privileges |
  | CatalogPrivs | Catalog privileges |
  | DatabasePrivs | Database privileges |
  | TablePrivs | Table privileges |
  | ColPrivs | Column privileges |
  | ResourcePrivs | Resource privileges |
  | WorkloadGroupPrivs | WorkloadGroup privileges |

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role    | User or Role has the `GRANT_PRIV` privilege to view all user permissions, otherwise only the current user's permissions can be viewed |

## Usage Notes
  - `SHOW ALL GRANTS` can view all users' permissions, but requires the `GRANT_PRIV` permission.
  - If the `user_identity` is specified, the permissions of the specified user are viewed. And the `user_identity` must be created by the `CREATE USER` command.
  - If the `user_identity` is not specified, the permissions of the current user are viewed.

## Examples

1. View all user permission information.

   ```sql
   SHOW ALL GRANTS;
   ```

   ```text
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | UserIdentity | Comment | Password | Roles    | GlobalPrivs          | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | 'root'@'%'   | ROOT    | No       | operator | Node_priv,Admin_priv | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   | 'admin'@'%'  | ADMIN   | No       | admin    | Admin_priv           | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   | 'jack'@'%'   |         | No       |          | NULL                 | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   ```

2. View the permissions of the specified user

    ```sql
    SHOW GRANTS FOR jack@'%';
    ```

    ```text
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    | UserIdentity | Comment | Password | Roles | GlobalPrivs | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    | 'jack'@'%'   |         | No       |       | NULL        | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    ```

3. View the permissions of the current user

   ```sql
   SHOW GRANTS;
   ```

   ```text
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | UserIdentity | Comment | Password | Roles    | GlobalPrivs          | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | 'root'@'%'   | ROOT    | No       | operator | Node_priv,Admin_priv | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   ```

