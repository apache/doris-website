---
{
    "title": "CREATE USER",
    "language": "en"
}
---

## Description

The `CREATE USER` statement is used to create a Doris user.

## Syntax

```sql
CREATE USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
[DEFAULT ROLE <role_name>]
[<password_policy>]
[<comment>]  

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}
```
## Required Parameters

**1. `<user_identity>`**

> A user_identity uniquely identifies a user.The syntax is:'user_name'@'host'.
> `user_identity` consists of two parts, user_name and host, where username is the username. Host identifies the host address where the client connects. The host part can use % for fuzzy matching. If no host is specified, it defaults to '%', which means the user can connect to Doris from any host.
> The host part can also be specified as a domain, the syntax is: 'user_name'@['domain'], even if it is surrounded by square brackets, Doris will think this is a domain and try to resolve its ip address. 

## Optional Parameters

**1. `<password>`**

> Specify the user password. 

**2. `<role_name>`**

> Specify the user role.
> If a role (ROLE) is specified, the newly created user will be automatically granted the permissions of the role. If not specified, the user has no permissions by default. The specified ROLE must already exist.

**3. `<password_policy>`**

> `password_policy` is a clause used to specify policies related to password authentication login. Currently, the following policies are supported:
>
> `PASSWORD_HISTORY { <n> | DEFAULT }`
>
> Whether to allow the current user to use historical passwords when resetting their passwords. For example, `PASSWORD_HISTORY 10` means that it is forbidden to use the password set in the past 10 times as a new password. If set to `PASSWORD_HISTORY DEFAULT`, the value in the global variable `password_history` will be used. `0` means do not enable this feature. Default is 0.
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
> Set the expiration time of the current user's password. For example `PASSWORD_EXPIRE INTERVAL 10 DAY` means the password will expire in 10 days. `PASSWORD_EXPIRE NEVER` means that the password does not expire. If set to `PASSWORD_EXPIRE DEFAULT`, the value in the global variable `default_password_lifetime` is used. Defaults to NEVER (or 0), which means it will not expire.
>
> `FAILED_LOGIN_ATTEMPTS <n>` 
>
> When the current user logs in, if the user logs in with the wrong password for n times, the account will be locked.For example, `FAILED_LOGIN_ATTEMPTS 3` means that if you log in wrongly for 3 times, the account will be locked.
>   
> `PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}`
>
> When the account is locked, the lock time is set. For example, `PASSWORD_LOCK_TIME 1 DAY` means that the account will be locked for one day.

**4. `<comment`>**

> Specify the user comment.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with ADMIN_PRIV permissions  |

## Example

- Create a passwordless user (if host is not specified, it is equivalent to jack@'%')

```sql
CREATE USER 'jack';
```

- Create a user with a password to allow login from '172.10.1.10'

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY '123456';
```

- In order to avoid passing plaintext, use case 2 can also be created in the following way

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY PASSWORD '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9';
The encrypted content can be obtained through PASSWORD(), for example:
SELECT PASSWORD('123456');
```

- Create a user that is allowed to log in from the '192.168' subnet, and specify its role as example_role

```sql
CREATE USER 'jack'@'192.168.%' DEFAULT ROLE 'example_role';
```

- Create a user that is allowed to log in from the domain 'example_domain'

```sql
CREATE USER 'jack'@['example_domain'] IDENTIFIED BY '12345';
```

- Create a user and assign a role

```sql
CREATE USER 'jack'@'%' IDENTIFIED BY '12345' DEFAULT ROLE 'my_role';
```
   
- Create a user, set the password to expire after 10 days, and set the account to be locked for one day if you log in failed for 3 times.

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_EXPIRE INTERVAL 10 DAY FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- Create a user and restrict non-resetable passwords to the last 8 passwords used.

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_HISTORY 8;
```

- Create a user with comment

```sql
CREATE USER 'jack' COMMENT "this is my first user";
```