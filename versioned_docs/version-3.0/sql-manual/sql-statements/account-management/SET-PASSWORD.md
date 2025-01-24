---
{
    "title": "SET PASSWORD",
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

The `SET PASSWORD` statement is used to modify a user's login password.

## Syntax 

```sql
SET PASSWORD [FOR <user_identity>] =
    [PASSWORD(<plain_password>)]|[<hashed_password>]
```

## Required Parameters

**<plain_password>**

> The input is a plaintext password. 

**<hashed_password>**

> The input is an encrypted password.

## Optional Parameters

**<user_identity>**

> The user_identity here must exactly match the user_identity specified when creating a user with CREATE USER, otherwise an error will be reported that the user does not exist. If user_identity is not specified, the current user is 'username'@'ip', which may not match any user_identity. Current users can be viewed through SHOW GRANTS.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | User or Role has the ADMIN_PRIV privilege to modify all user's password, otherwise only the current user's password can be modified.  |

## Usage Notes

- If the `FOR user_identity` field does not exist, then change the current user's password.

## Example

- Modify the current user's password

```sql
SET PASSWORD = PASSWORD('123456')
SET PASSWORD = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```

- Modify the specified user password

```sql
SET PASSWORD FOR 'jack'@'192.%' = PASSWORD('123456')
SET PASSWORD FOR 'jack'@['domain'] = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```