---
{
    "title": "ALTER USER",
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

The `ALTER USER` statement is used to modify a user's account attributes, including passwords, and password policies, etc.

## Syntax

```sql
ALTER USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
[<password_policy>]
[<comment>]

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}
    5. ACCOUNT_UNLOCK
```

## Required Parameters

**1. `<user_identity`>**

> A user_identity uniquely identifies a user.The syntax is:'user_name'@'host'.
> `user_identity` consists of two parts, user_name and host, where username is the username. Host identifies the host address where the client connects. The host part can use % for fuzzy matching. If no host is specified, it defaults to '%', which means the user can connect to Doris from any host.
> The host part can also be specified as a domain, the syntax is: 'user_name'@['domain'], even if it is surrounded by square brackets, Doris will think this is a domain and try to resolve its ip address. 

## Optional Parameters

**1. `<password>`**

> Specify the user password. 

**2. `<password_policy>`**

> `password_policy` is a clause used to specify policies related to password authentication login. Currently, the following policies are supported:
>
> `PASSWORD_HISTORY { <n> | DEFAULT }`
>
>    Whether to allow the current user to use historical passwords when resetting their passwords. For example, `PASSWORD_HISTORY 10` means that it is forbidden to use the password set in the past 10 times as a new password. If set to `PASSWORD_HISTORY DEFAULT`, the value in the global variable `password_history` will be used. `0` means do not enable this feature. Default is 0.
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
>    Set the expiration time of the current user's password. For example `PASSWORD_EXPIRE INTERVAL 10 DAY` means the password will expire in 10 days. `PASSWORD_EXPIRE NEVER` means that the password does not expire. If set to `PASSWORD_EXPIRE DEFAULT`, the value in the global variable `default_password_lifetime` is used. Defaults to NEVER (or 0), which means it will not expire.
>
> `FAILED_LOGIN_ATTEMPTS <n>` 
>
> When the current user logs in, if the user logs in with the wrong password for n times, the account will be locked.For example, `FAILED_LOGIN_ATTEMPTS 3` means that if you log in wrongly for 3 times, the account will be locked.
>   
> `PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}`
>
> When the account is locked, the lock time is set. For example, `PASSWORD_LOCK_TIME 1 DAY` means that the account will be locked for one day.
>
> `ACCOUNT_UNLOCK`
>    
> `ACCOUNT_UNLOCK` is used to unlock a locked user.

**3. `<comment>`**

>Specify the user comment.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with ADMIN_PRIV permissions  |

## Usage Notes

1. This command give over supports modifying user roles from versions 2.0. Please use [GRANT](./GRANT-TO.md) and [REVOKE](./REVOKE-FROM.md) for related operations

2. In an ALTER USER command, only one of the following account attributes can be modified at the same time:
- Change password
- Modify `PASSWORD_HISTORY`
- Modify `PASSWORD_EXPIRE`
- Modify `FAILED_LOGIN_ATTEMPTS` and `PASSWORD_LOCK_TIME`
- Unlock users

## Example

- Change the user's password

```sql
ALTER USER jack@'%' IDENTIFIED BY "12345";
```

- Modify the user's password policy
    
```sql
ALTER USER jack@'%' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- Unlock a user

```sql
ALTER USER jack@'%' ACCOUNT_UNLOCK
```

- Modify the user's comment

```sql
ALTER USER jack@'%' COMMENT "this is my first user"
```
