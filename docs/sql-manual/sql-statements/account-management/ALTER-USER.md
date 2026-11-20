---
{
    "title": "ALTER USER",
    "language": "en",
    "description": "The ALTER USER statement modifies account passwords and policies, including dual-password rotation."
}
---

## Description

The `ALTER USER` statement is used to modify a user's account attributes, including passwords, and password policies, etc.

Since 4.2.1, Doris supports dual passwords for built-in password authentication with `RETAIN CURRENT PASSWORD` and `DISCARD OLD PASSWORD`.

## Syntax

```sql
ALTER USER [IF EXISTS] <user_identity>
    [IDENTIFIED BY <password> [RETAIN CURRENT PASSWORD] | DISCARD OLD PASSWORD]
[<password_policy>]
[<comment>]

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}
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
> `PASSWORD_HISTORY { <n> | DEFAULT}`
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
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> When the account is locked, the lock time is set. For example, `PASSWORD_LOCK_TIME 1 DAY` means that the account will be locked for one day.
>
> `ACCOUNT_UNLOCK`
>    
> `ACCOUNT_UNLOCK` is used to unlock a locked user.

**3. `<comment>`**

>Specify the user comment.

**4. `RETAIN CURRENT PASSWORD` (since 4.2.1)**

> Use with `IDENTIFIED BY` to make the previous primary password the retained secondary password. The new password becomes the primary; either password can authenticate. Any earlier secondary password is replaced.

**5. `DISCARD OLD PASSWORD` (since 4.2.1)**

> Remove the retained secondary password, leaving the primary unchanged. This is a standalone operation: do not combine it with a password change, password policy, comment, or other account operation. If no secondary password exists, it has no effect.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| GRANT_PRIV or ADMIN_PRIV | Global | Required for ALTER USER, including RETAIN CURRENT PASSWORD and DISCARD OLD PASSWORD. |

## Usage Notes

Since 4.1.5, only `'root'@'%'` is the special root identity. An identity such as `'root'@'localhost'` remains an ordinary user and gains no privilege to modify the actual root account merely from its username. Protection of the actual root account also does not apply to other users named root.

1. Starting from version 2.0, this command no longer supports modifying user roles. Please use [GRANT](./GRANT-TO.md) and [REVOKE](./REVOKE-FROM.md) for related operations.

2. In an ALTER USER command, only one of the following account attributes can be modified at the same time:
- Change password, optionally with RETAIN CURRENT PASSWORD
- Discard the retained secondary password
- Modify `PASSWORD_HISTORY`
- Modify `PASSWORD_EXPIRE`
- Modify `FAILED_LOGIN_ATTEMPTS` and `PASSWORD_LOCK_TIME`
- Unlock users

### Dual Passwords (Since 4.2.1)

- `RETAIN CURRENT PASSWORD` requires a nonempty current primary password and a password change. An empty new password clears both password slots, even with RETAIN.
- An ordinary nonempty password change without RETAIN preserves an existing secondary password; it does not revoke that credential.
- Account lock and password expiration checks apply to both passwords. DISCARD does not change password history or restart the password expiration clock.

See [Dual Passwords](../../../admin-manual/auth/authentication/internal#dual-passwords) for the rotation procedure, observability, domain-account behavior, and upgrade restrictions. These clauses manage built-in passwords, not credentials held by LDAP or an external authentication integration.

## Example

Setup — create user `jack` so the examples below have a target user:

```sql
CREATE USER jack@'%' IDENTIFIED BY "12345";
```

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

- Rotate the password while keeping the previous password usable (since 4.2.1)

```sql
ALTER USER jack@'%' IDENTIFIED BY 'NewPwd_2026!' RETAIN CURRENT PASSWORD;
```

Both the previous password and `NewPwd_2026!` can authenticate. After all clients have switched to the new password, discard the retained one:

```sql
ALTER USER jack@'%' DISCARD OLD PASSWORD;
```

Only `NewPwd_2026!` can authenticate afterward.
