---
{
"title": "Built-in Authentication",
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

## Key Concepts

### User
In Doris, a `user_identity` uniquely identifies a user. `user_identity` consists of two parts: `user_name` and `host`, where `user_name` is the username. `host` identifies the host address from which the user connects. The `host` part can use `%` for fuzzy matching. If `host` is not specified, it defaults to `%`, meaning the user can connect to Doris from any host.

#### User Attributes
User attributes are directly attached to `user_name`, not `user_identity`, meaning `user@'192.%'` and `user@['domain']` share the same set of user attributes. These attributes belong to the user, not `user@'192.%'` or `user@['domain']`.

User attributes include, but are not limited to: maximum number of user connections, import cluster configuration, etc.

#### Built-in Users
Built-in users are users created by default in Doris and have certain permissions by default, including `root` and `admin`. Initial passwords are empty and can be changed after the frontend starts using password modification commands. Default users cannot be deleted.
- `root@'%'`: Root user, allowed to log in from any node, role is operator.
- `admin@'%'`: Admin user, allowed to log in from any node, role is admin.

### Password
Credentials for user login, set by the administrator when creating the user, can also be changed by the user after creation.

#### Password Policy
Doris supports the following password policies to help users manage passwords better.
- `PASSWORD_HISTORY`
  Whether the current user is allowed to use historical passwords when resetting their password. For example, `PASSWORD_HISTORY 10` means that the past 10 passwords cannot be reused as the new password. If set to `PASSWORD_HISTORY DEFAULT`, the value of the global variable `password_history` will be used. 0 means this feature is not enabled. The default is 0.
  Example:
    - Set global variable: `SET GLOBAL password_history = 10`
    - Set for user: `ALTER USER user1@'ip' PASSWORD_HISTORY 10`
- `PASSWORD_EXPIRE`
  Set the password expiration time for the current user. For example, `PASSWORD_EXPIRE INTERVAL 10 DAY` means the password will expire in 10 days. `PASSWORD_EXPIRE NEVER` means the password will never expire. If set to `PASSWORD_EXPIRE DEFAULT`, the value of the global variable `default_password_lifetime` will be used (in days). The default is `NEVER` (or 0), meaning the password will not expire.
  Example:
    - Set global variable: `SET GLOBAL default_password_lifetime = 1`
    - Set for user: `ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`
- `FAILED_LOGIN_ATTEMPTS` and `PASSWORD_LOCK_TIME`
  Set the number of incorrect password attempts before the account is locked and the lock time. For example, `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` means the account will be locked for one day after 3 incorrect login attempts. Administrators can unlock locked accounts using the `ALTER USER` statement.
  Example:
    - Set for user: `ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`
- Password Strength
  Controlled by the global variable `validate_password_policy`. The default is `NONE/0`, meaning no password strength check. If set to `STRONG/2`, the password must contain at least 3 of the following: "uppercase letters", "lowercase letters", "numbers", and "special characters", and the length must be at least 8.
  Example:
    - `SET validate_password_policy=STRONG`

## Authentication Mechanism
1. Client Authentication Information Sending: The client packages user information (such as username, password, database, etc.) and sends it to the Doris server. This information is used to prove the client's identity and request access to the database.
2. Server Authentication: After receiving the client's authentication information, Doris verifies it. If the username, password, and client IP are correct, and the user has permission to access the selected database, authentication is successful, and Doris maps the user entity to the system's user identity. Otherwise, authentication fails, and an error message is returned to the client.

## Whitelist and Blacklist
Doris itself does not support a blacklist, only a whitelist function, but we can simulate a blacklist in some ways. Suppose a user named `user@'192.%'` is created, allowing users from 192.* to log in. If you want to prohibit users from 192.168.10.1 from logging in, you can create another user `cmy@'192.168.10.1'` and set a new password. Since 192.168.10.1 has a higher priority than 192.%, users from 192.168.10.1 will no longer be able to log in using the old password.

## Related Commands
- Create User: [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER)
- View User: [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- Modify User: [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER)
- Change Password: [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD)
- Delete User: [DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER)
- Set User Attributes: [SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY)
- View User Attributes: [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY)

## Other Explanations
  1. User Identity Priority Selection Issue During Login

     As introduced above, `user_identity` consists of `user_name` and `host`, but when logging in, the user only needs to enter `user_name`, so Doris determines based on the client's IP which `user_identity` to use for login.

     If only one `user_identity` can be matched based on the client's IP, it will be used for login without any issues. However, if multiple `user_identity` can be matched, there will be a priority issue.
      1. Priority between domain name and IP:
         Suppose the following users are created:
         ```sql
              CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
              CREATE USER user1@'ip1'IDENTIFIED BY "abcde";
         ```
         `domain1` is resolved to two IPs: `ip1` and `ip2`.

         In terms of priority, IP takes precedence over domain name. Therefore, when user `user1` attempts to log in to Doris from `ip1` using password `'12345'`, the login will be rejected.
     2. Priority between specific IP and range IP:
        Suppose the following users are created:
        ```sql
             CREATE USER user1@'%' IDENTIFIED BY "12345";
             CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
        ```
        In terms of priority, `'192.%'` takes precedence over `'%'`. Therefore, when user `user1` attempts to log in to Doris from `192.168.1.1` using password `'12345'`, the login will be rejected.

  2. Forgotten Password

     If you forget your password and cannot log in to Doris, you can add the `skip_localhost_auth_check=true` parameter to the FE's configuration file and restart the FE. This will allow you to log in to Doris from the FE machine without a password using the `root` user.

     After logging in, you can use the `SET PASSWORD` command to reset your password.

  3. Any user cannot reset the password of the `root` user, except for the `root` user itself.

  4. `current_user()` and `user()`

        Users can use `SELECT current_user()` and `SELECT user()` to view `current_user` and `user`, respectively. `current_user` indicates the identity used by the current user to pass the authentication system, while `user` is the actual User Identity of the current user.

        For example:

        Suppose `user1@'192.%'` is created, and then a user named `user1` logs in to the system from `192.168.10.1`. At this time, `current_user` is `user1@'192.%'`, and `user` is `user1@'192.168.10.1'`.

        All permissions are granted to a specific `current_user`, and the actual user has all the permissions of the corresponding `current_user`.
