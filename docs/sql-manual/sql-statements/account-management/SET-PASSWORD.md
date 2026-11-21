---
{
    "title": "SET PASSWORD",
    "language": "en",
    "description": "Change a Doris login password and optionally retain the current password during rotation."
}
---

## Description

The `SET PASSWORD` statement is used to modify a user's login password.

Since 4.2.1, Doris supports dual passwords for built-in password authentication with `RETAIN CURRENT PASSWORD` and `DISCARD OLD PASSWORD`.

## Syntax 

```sql
SET PASSWORD [FOR <user_identity>] =
    { PASSWORD(<plain_password>) | <hashed_password> }
    [RETAIN CURRENT PASSWORD]
```

## Required Parameters

**1. `<plain_password>`**

> The input is a plaintext password. Taking the password `123456` as an example, directly use the string `123456`.

**2. `<hashed_password>`**

> The input is an encrypted password. Taking the password 123456 as an example, directly use the string `*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9`, which is the return value of the function `PASSWORD('123456')`.

## Optional Parameters

**1. `<user_identity>`**

> With `FOR`, specify exactly the account identity created by `CREATE USER`, including its host part. Without `FOR`, Doris uses the authenticated account returned by `CURRENT_USER()`, not the client IP identity returned by `USER()`. View the current account with `SHOW GRANTS`.

**2. `RETAIN CURRENT PASSWORD` (since 4.2.1)**

> Retain the previous primary password as the secondary and install the specified new primary password. Either password can authenticate; any earlier secondary is replaced. Requires global `GRANT_PRIV` or `ADMIN_PRIV`, including when changing your own password.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| None | Current user | An ordinary change of your own password without RETAIN requires no additional privilege. |
| GRANT_PRIV or ADMIN_PRIV | Global | Required to change another user's password or use RETAIN CURRENT PASSWORD, including on your own account. |

## Usage Notes

Since 4.1.5, only `'root'@'%'` is the special root identity. An identity such as `'root'@'localhost'` remains an ordinary user and gains no privilege to modify the actual root account merely from its username. Protection of the actual root account also does not apply to other users named root.

- If the `FOR user_identity` field does not exist, then change the current user's password.

### Dual Passwords (Since 4.2.1)

- Without RETAIN, an ordinary nonempty password change preserves any existing secondary password.
- RETAIN fails if the current primary password is empty. An empty new password clears both slots, including when RETAIN is specified.
- For plaintext, use `PASSWORD('<new_password>')`; a bare string must contain an already hashed password.
- To revoke the secondary, use `ALTER USER ... DISCARD OLD PASSWORD`. SET PASSWORD has no DISCARD clause.

See [Dual Passwords](../../../admin-manual/auth/authentication/internal#dual-passwords) for the complete workflow and upgrade restrictions. These clauses apply to built-in passwords.

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

- Rotate an account with an overlap period (since 4.2.1)

Run as an administrator with global `GRANT_PRIV` or `ADMIN_PRIV`:

```sql
CREATE USER 'rotation_user'@'%' IDENTIFIED BY 'OldPwd_2026!';
SET PASSWORD FOR 'rotation_user'@'%' = PASSWORD('NewPwd_2026!') RETAIN CURRENT PASSWORD;
```

Both `OldPwd_2026!` and `NewPwd_2026!` authenticate. After migrating clients, remove the old credential:

```sql
ALTER USER 'rotation_user'@'%' DISCARD OLD PASSWORD;
```

Only `NewPwd_2026!` authenticates afterward.
