---
{
    "title": "SET PASSWORD",
    "language": "en"
}
---

## Description

The `SET PASSWORD` statement is used to modify a user's login password.

## Syntax 

```sql
SET PASSWORD [FOR <user_identity>] =
    [PASSWORD(<plain_password>)]|[<hashed_password>]
```

## Required Parameters

**1. `<plain_password>`**

> The input is a plaintext password. Taking the password `123456` as an example, directly use the string `123456`.

**2. `<hashed_password>`**

> The input is an encrypted password. Taking the password 123456 as an example, directly use the string `*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9`, which is the return value of the function `PASSWORD('123456')`.

## Optional Parameters

**1. `<user_identity>`**

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