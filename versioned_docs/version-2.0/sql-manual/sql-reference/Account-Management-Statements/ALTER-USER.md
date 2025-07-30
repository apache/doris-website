---
{
    "title": "ALTER-USER",
    "language": "en"
}
---

## ALTER USER

### Name

ALTER USER

### Description

The ALTER USER command is used to modify a user's account attributes, including passwords, and password policies, etc.

>Note that.
>
>This command give over supports modifying user roles from versions 2.0. Please use [GRANT](./GRANT.md) and [REVOKE](./REVOKE.md) for related operations

```sql
ALTER USER [IF EXISTS] user_identity [IDENTIFIED BY 'password']
[password_policy]

user_identity:
    'user_name'@'host'

password_policy:

    1. PASSWORD_HISTORY [n|DEFAULT]
    2. PASSWORD_EXPIRE [DEFAULT|NEVER|INTERVAL n DAY/HOUR/SECOND]
    3. FAILED_LOGIN_ATTEMPTS n
    4. PASSWORD_LOCK_TIME [n DAY/HOUR/SECOND|UNBOUNDED]
    5. ACCOUNT_UNLOCK
```

About `user_identity` and `password_policy`, Please refer to `CREATE USER`.

`ACCOUNT_UNLOCK` is used to unlock a locked user.

In an ALTER USER command, only one of the following account attributes can be modified at the same time:

1. Change password
2. Modify `PASSWORD_HISTORY`
3. Modify `PASSWORD_EXPIRE`
4. Modify `FAILED_LOGIN_ATTEMPTS` and `PASSWORD_LOCK_TIME`
5. Unlock users

### Example

1. Change the user's password

    ```
    ALTER USER jack@'%' IDENTIFIED BY "12345";
    ```

2. Modify the user's password policy
	
    ```
    ALTER USER jack@'%' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
    ```

3. Unlock a user

    ```
    ALTER USER jack@'%' ACCOUNT_UNLOCK
    ```

### Keywords

    ALTER, USER

### Best Practice

1. Modify the password policy

    1. Modify `PASSWORD_EXPIRE` will reset the timing of password expiration time.

    2. Modify `FAILED_LOGIN_ATTEMPTS` or `PASSWORD_LOCK_TIME` will unlock the user.