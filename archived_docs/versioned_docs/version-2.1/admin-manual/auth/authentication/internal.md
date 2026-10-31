---
{
    "title": "Built-in Authentication",
    "language": "en",
    "description": "In Doris, a useridentity uniquely identifies a user. useridentity consists of two parts: username and host, where username is the user name."
}
---

## Key Concepts
### Users

In Doris, a user_identity uniquely identifies a user. user_identity consists of two parts: user_name and host, where username is the user name. host identifies the host address where the user client connection is located. The host part can use % for fuzzy matching. If host is not specified, it defaults to '%', which means the user can connect to Doris from any host.

#### User Attributes

User attributes are directly attached to user_name, not user_identity. This means user@'192.%' and user@['domain'] both have the same set of user attributes. These attributes belong to user, not to user@'192.%' or user@['domain'].

User attributes include but are not limited to: maximum user connections, import cluster configuration, etc.

#### Built-in Users

Built-in users are users created by default in Doris and have certain default permissions, including root and admin. The initial passwords are empty. After FE starts, you can modify them using the password change command. Built-in users cannot be deleted.

- root@'%': root user, allowed to log in from any node, with operator role.
- admin@'%': admin user, allowed to log in from any node, with admin role.

### Password

User login credentials, set by administrators when creating users, or can be changed by users themselves after creation.

#### Password Policies

Doris supports the following password policies to help users better manage passwords.

- `PASSWORD_HISTORY`

  Whether to allow the current user to use historical passwords when resetting passwords. For example, `PASSWORD_HISTORY` 10 means prohibiting the use of the last 10 passwords as new passwords. If set to `PASSWORD_HISTORY DEFAULT`, it will use the value in the global variable `password_history`. 0 means this feature is disabled. Default is 0.

  Examples:

  - Set global variable: `SET GLOBAL password_history = 10`
  - Set for user: `ALTER USER user1@'ip' PASSWORD_HISTORY 10`

- `PASSWORD_EXPIRE`

  Set the expiration time for the current user's password. For example, `PASSWORD_EXPIRE INTERVAL 10 DAY` means the password will expire in 10 days. `PASSWORD_EXPIRE NEVER` means the password never expires. If set to `PASSWORD_EXPIRE DEFAULT`, it will use the value in the global variable `default_password_lifetime` (in days). Default is NEVER (or 0), meaning it will not expire.

  Examples:

  - Set global variable: `SET GLOBAL default_password_lifetime = 1`
  - Set for user: `ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

- `FAILED_LOGIN_ATTEMPTS` and `PASSWORD_LOCK_TIME`

  Set that when the current user logs in with wrong password n times, the account will be locked and set a lock time. For example, `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` means if there are 3 wrong logins, the account will be locked for one day. Administrators can actively unlock locked accounts through ALTER USER statements.

  Examples:

  - Set for user: `ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

- Password Strength

  This feature is controlled by the global variable `validate_password_policy`. Default is NONE/0, meaning password strength is not checked. If set to STRONG/2, the password must contain 3 of the following: "uppercase letters", "lowercase letters", "numbers", and "special characters", and the length must be greater than or equal to 8.

  Examples:

    - `SET validate_password_policy=STRONG`

After setting the above policies, you can view them with the following command:

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

Note that you need to wrap the user and host parts with single quotes separately. For example:

```
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## Authentication Mechanism

1. Client authentication information sending: The client packages and sends user information (such as username, password, database, etc.) to the Doris server. This information is used to prove the client's identity and request access to the database.

2. Server authentication: After Doris receives the client's authentication information, it performs verification. If the username, password, and client IP are correct, and the user has permission to access the selected database, authentication succeeds, and Doris will map the user individual to the User Identity in the system. Otherwise, authentication fails and returns the corresponding error message to the client.

## Blacklist and Whitelist

Doris itself does not support blacklists, only whitelist functionality, but we can simulate blacklists in certain ways. Suppose we first created a user named `user@'192.%'`, indicating that users from `192.*` are allowed to log in. If we want to prohibit users from `192.168.10.1` from logging in, we can create another user `cmy@'192.168.10.1'` and set a new password. Because `192.168.10.1` has higher priority than `192.%`, users from `192.168.10.1` will no longer be able to log in using the old password.

## Related Commands

- Create user: [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER)
- View users: [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- Modify user: [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER)
- Change password: [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD)
- Delete user: [DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER)
- Set user attributes: [SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY)
- View user attributes: [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY)

## Other Notes

1. Priority selection of user_identity during login

    As mentioned above, `user_identity` consists of `user_name` and `host`, but when users log in, they only need to input `user_name`, so Doris matches the corresponding `host` based on the client's IP to determine which `user_identity` to use for login.

    If only one `user_identity` can be matched based on the client IP, then this `user_identity` will undoubtedly be matched. However, when multiple `user_identity` can be matched, there will be the following priority issues.

    1. Priority between domain and IP:

        Suppose the following users were created:

        ```sql
        CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
        CREATE USER user1@'ip1'IDENTIFIED BY "abcde";
        ```

        domain1 is resolved to two IPs: ip1 and ip2.

        In terms of priority, IP takes precedence over domain, so when user user1 tries to log in to Doris from ip1 using password '12345', it will be rejected.

    2. Priority between specific IP and IP range:

      Suppose the following users were created:

      ```sql
      CREATE USER user1@'%' IDENTIFIED BY "12345";
      CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
      ```

      In terms of priority, '192.%' takes precedence over '%', so when user user1 tries to log in to Doris from 192.168.1.1 using password '12345', it will be rejected.

2. Forgot password

    If you forget your password and cannot log in to Doris, you can add the skip_localhost_auth_check=true parameter in the FE config file and restart FE, so you can log in to Doris as root on the FE local machine without a password.

    After logging in, you can reset the password using the SET PASSWORD command.

3. No user can reset the root user's password except the root user itself.

4. `current_user()` and `user()`

    Users can view `current_user` and `user` through `SELECT current_user()` and `SELECT user()` respectively. `current_user` represents the identity through which the current user passed the authentication system, while `user` is the user's actual User Identity.

    Example:

    Suppose we created the user `user1@'192.%'`, then user `user1` from `192.168.10.1` logged into the system. In this case, `current_user` would be `user1@'192.%'`, while `user` would be `user1@'192.168.10.1'`.

    All permissions are granted to a specific `current_user`, and the actual user has all the permissions of the corresponding `current_user`.