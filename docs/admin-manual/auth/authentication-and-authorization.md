---
{
    "title": "Authentication and Authorization",
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

The Doris permission management system is modeled after the MySQL permission management mechanism. It supports fine-grained permission control at the row and column level, role-based access control, and also supports a whitelist mechanism.

## Glossary

1. User Identity

   Within a permission system, a user is identified as a User Identity. A User Identity consists of two parts: `username` and `host`. The `username` is the user's name, consisting of English letters (both uppercase and lowercase). `host` represents the IP from which the user connection originates. User Identity is represented as `username@'host'`, indicating `username` from `host`.

   Another representation of User Identity is `username@['domain']`, where `domain` refers to a domain name that can be resolved into a set of IPs through DNS. Eventually, this is represented as a set of `username@'host'`, hence moving forward, we uniformly use `username@'host'` to denote it.

2. Privilege

   Privileges apply to nodes, data directories, databases, or tables. Different privileges represent different operation permissions.

3. Role

   Doris allows the creation of custom-named roles. A role can be viewed as a collection of privileges. Newly created users can be assigned a role, automatically inheriting the privileges of that role. Subsequent changes to the role's privileges will also reflect on the permissions of all users associated with that role.

4. User Property

   User properties are directly affiliated with a user, not the User Identity. Meaning, both `user@'192.%'` and `user@['domain']` share the same set of user properties, which belong to the user `user`, not to `user@'192.%'` or `user@['domain']`.

   User properties include but are not limited to: maximum number of user connections, import cluster configurations, etc.

## Authentication and Authorization Framework

The process of a user logging into Apache Doris is divided into two parts: **Authentication** and **Authorization**.

- Authentication: Identity verification is conducted based on the credentials provided by the user (such as username, client IP, password). Once verified, the individual user is mapped to a system-defined User Identity.
- Authorization: Based on the acquired User Identity, it checks whether the user has the necessary permissions for the intended operations, according to the privileges associated with that User Identity.

## Authentication

Doris supports built-in authentication schemes as well as LDAP authentication.

### Doris Built-in Authentication Scheme

Authentication is based on usernames, passwords, and other information stored within Doris itself.

Administrators create users with the `CREATE USER` command and view all created users with the `SHOW ALL GRANTS` command.

When a user logs in, the system verifies whether the username, password, and client IP address are correct.

#### Password Policy

Doris supports the following password policies to assist users in better password management.

1. `PASSWORD_HISTORY`

    Determines whether a user can reuse a historical password when resetting their current password. For example, `PASSWORD_HISTORY 10` means the last 10 passwords cannot be reused as a new password. Setting `PASSWORD_HISTORY DEFAULT` will use the value from the global variable `password_history`. A setting of 0 disables this feature. The default is 0.

    Examples:

    - Set a global variable: `SET GLOBAL password_history = 10`
    - Set for a user: `ALTER USER user1@'ip' PASSWORD_HISTORY 10`

2. `PASSWORD_EXPIRE`

    Sets the expiration time for the current user's password. For instance, `PASSWORD_EXPIRE INTERVAL 10 DAY` means the password will expire after 10 days. `PASSWORD_EXPIRE NEVER` indicates the password never expires. Setting `PASSWORD_EXPIRE DEFAULT` will use the value from the global variable `default_password_lifetime` (in days). The default is NEVER (or 0), indicating it does not expire.

    Examples:

    - Set a global variable: `SET GLOBAL default_password_lifetime = 1`
    - Set for a user: `ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

3. `FAILED_LOGIN_ATTEMPTS` and `PASSWORD_LOCK_TIME`

    Configures the number of incorrect password attempts after which the user account will be locked and sets the lock duration. For example, `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` means if there are 3 incorrect logins, the account will be locked for one day. Administrators can unlock the account using the `ALTER USER` statement.

    Example:

    - Set for a user: `ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

4. Password Strength

    This is controlled by the global variable `validate_password_policy`. The default is `NONE/0`, which means no password strength checking. If set to `STRONG/2`, the password must include at least three of the following: uppercase letters, lowercase letters, numbers, and special characters, and must be at least 8 characters long.

    Example:

    - `SET validate_password_policy=STRONG`

For more help, please refer to [ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md).

### LDAP-based Authentication Scheme

Please refer to [LDAP-based Authentication Scheme](./ldap.md).

## Authorization

### Permission Operations

- Create user: [CREATE USER](../../../version-3.0/sql-manual/sql-statements/account-management/CREATE-USER.md)
- Modify user: [ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md)
- Delete user: [DROP USER](../../sql-manual/sql-statements/account-management/DROP-USER.md)
- Grant/Assign role: [GRANT](../../sql-manual/sql-statements/account-management/GRANT-TO)
- Revoke/Withdraw role: [REVOKE](../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)
- Create role: [CREATE ROLE](../../sql-manual/sql-statements/account-management/CREATE-ROLE.md)
- Delete role: [DROP ROLE](../../sql-manual/sql-statements/account-management/DROP-ROLE.md)
- Modify role: [ALTER ROLE](../../sql-manual/sql-statements/account-management/ALTER-ROLE.md)
- View current user's permissions and roles: [SHOW GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- View all users' permissions and roles: [SHOW ALL GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- View created roles: [SHOW ROLES](../../sql-manual/sql-statements/account-management/SHOW-ROLES.md)
- Set user property: [SET PROPERTY](../../sql-manual/sql-statements/account-management/SET-PROPERTY.md)
- View user property: [SHOW PROPERTY](../../sql-manual/sql-statements/account-management/SHOW-PROPERTY.md)
- Change password: [SET PASSWORD](../../sql-manual/sql-statements/account-management/SET-PASSWORD.md)
- View all supported privileges: [SHOW PRIVILEGES]
- View row policy: [SHOW ROW POLICY]
- Create row policy: [CREATE ROW POLICY]

### Types of Permissions

Doris currently supports the following permissions:

1. `Node_priv`

    Node modification permission. Includes adding, deleting, and offlining FE, BE, BROKER nodes.

    Root users have this permission by default. Users who possess both `Grant_priv` and `Node_priv` can grant this permission to other users.

    This permission can only be granted at the Global level.

2. `Grant_priv`

    Permission modification authority. Allows execution of operations including granting, revoking, adding/deleting/modifying users/roles.

    Before version 2.1.2, when granting permissions to other users/roles, the current user only needed the respective level's `Grant_priv` permission. After version 2.1.2, the current user also needs permission for the resource they wish to grant.

    When assigning roles to other users, Global level `Grant_priv` permission is required.

3. `Select_priv`

    Read-only permission for data directories, databases, and tables.

4. `Load_priv`

    Write permission for data directories, databases, and tables. Includes Load, Insert, Delete, etc.

5. `Alter_priv`

    Alteration permissions for data directories, databases, and tables. Includes renaming libraries/tables, adding/deleting/modifying columns, adding/deleting partitions, etc.

6. `Create_priv`

    Permission to create data directories, databases, tables, and views.

7. `Drop_priv`

    Permission to delete data directories, databases, tables, and views.

8. `Usage_priv`

    Usage permissions for Resources and Workload Groups.

9. `Show_view_priv`

    Permission to execute `SHOW CREATE VIEW`.

### Permission Levels

#### Global Permissions

Permissions granted through the GRANT statement with `*.*.*` scope. These permissions apply to any table within any catalog.

#### Catalog Permissions

Permissions granted through the GRANT statement with `ctl.*.*` scope. These permissions apply to any table within the specified catalog.

#### Database Permissions

Permissions granted through the GRANT statement with `ctl.db.*` scope. These permissions apply to any table within the specified database.

#### Table Permissions

Permissions granted through the GRANT statement with `ctl.db.tbl` scope. These permissions apply to any column within the specified table.

#### Column Permissions

Column permissions are primarily used to restrict user access to certain columns within a table. Specifically, column permissions allow administrators to set viewing, editing, and other rights for certain columns, controlling user access and manipulation of specific column data.

Permissions for specific columns of a table can be granted with `GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1`.

Currently, column permissions support only `Select_priv`.

#### Row-Level Permissions

Row Policies enable administrators to define access policies based on fields within the data, controlling which users can access which rows.

Specifically, Row Policies allow administrators to create rules that can filter or restrict user access to rows based on actual values stored in the data.

From version 1.2, row-level permissions can be created with the `CREATE ROW POLICY` command.

From version 2.1.2, support for setting row-level permissions through Apache Ranger's `Row Level Filter` is available.

#### Usage Permissions

- Resource Permissions

    Resource permissions are set specifically for Resources, unrelated to permissions for databases or tables, and can only assign `Usage_priv` and `Grant_priv`.

    Permissions for all Resources can be granted with the `GRANT USAGE_PRIV ON RESOURCE '%' TO user1`.

- Workload Group Permissions

    Workload Group permissions are set specifically for Workload Groups, unrelated to permissions for databases or tables, and can only assign `Usage_priv` and `Grant_priv`.

    Permissions for all Workload Groups can be granted with `GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1`.

### Data Masking

Data masking is a method to protect sensitive data by modifying, replacing, or hiding the original data, such that the masked data retains certain formats and characteristics while no longer containing sensitive information.

For example, administrators may choose to replace part or all of the digits of sensitive fields like credit card numbers or ID numbers with asterisks `*` or other characters, or replace real names with pseudonyms.

From version 2.1.2, support for setting data masking policies for certain columns through Apache Ranger's Data Masking is available, currently only configurable via [Apache Ranger](./ranger.md).

### Doris Built-in Authorization Scheme

Doris's permission design is based on the RBAC (Role-Based Access Control) model, where users are associated with roles, and roles are associated with permissions. Users are indirectly linked to permissions through their roles.

When a role is deleted, users automatically lose all permissions associated with that role.

When a user is disassociated from a role, they automatically lose all permissions of that role.

When permissions are added to or removed from a role, the permissions of the users associated with that role change accordingly.

```
┌────────┐        ┌────────┐         ┌────────┐
│  user1 ├────┬───►  role1 ├────┬────►  priv1 │
└────────┘    │   └────────┘    │    └────────┘
              │                 │
              │                 │
              │   ┌────────┐    │
              │   │  role2 ├────┤
┌────────┐    │   └────────┘    │    ┌────────┐
│  user2 ├────┘                 │  ┌─►  priv2 │
└────────┘                      │  │ └────────┘
                  ┌────────┐    │  │
           ┌──────►  role3 ├────┘  │
           │      └────────┘       │
           │                       │
           │                       │
┌────────┐ │      ┌────────┐       │ ┌────────┐
│  userN ├─┴──────►  roleN ├───────┴─►  privN │
└────────┘        └────────┘         └────────┘
```

As shown above:

User1 and user2 both have permission `priv1` through `role1`.

UserN has permission `priv1` through `role3`, and permissions `priv2` and `privN` through `roleN`. Thus, userN has permissions `priv1`, `priv2`, and `privN` simultaneously.

For ease of user operations, it is possible to directly grant permissions to a user. Internally, a unique default role is created for each user. When permissions are granted to a user, it is essentially granting permissions to the user's default role.

The default role cannot be deleted, nor can it be assigned to someone else. When a user is deleted, their default role is automatically deleted as well.

### Authorization Scheme Based on Apache Ranger

Please refer to [Authorization Scheme Based on Apache Ranger](./ranger.md).

## Common Questions

### Explanation of Permissions

1. Users with ADMIN privileges or GRANT privileges at the GLOBAL level can perform the following operations:

    - CREATE USER
    - DROP USER
    - ALTER USER
    - SHOW GRANTS
    - CREATE ROLE
    - DROP ROLE
    - ALTER ROLE
    - SHOW ROLES
    - SHOW PROPERTY FOR USER

2. GRANT/REVOKE

    - Users with ADMIN privileges can grant or revoke permissions for any user.
    - Users with ADMIN or GLOBAL level GRANT privileges can assign roles to users.
    - Users who have the corresponding level of GRANT privilege and the permissions to be assigned can distribute those permissions to users/roles.

3. SET PASSWORD

    - Users with ADMIN privileges or GLOBAL level GRANT privileges can set passwords for non-ROOT users.
    - Ordinary users can set the password for their corresponding User Identity. Their corresponding User Identity can be viewed with the `SELECT CURRENT_USER()` command.
    - ROOT users can change their own password.

### Additional Information

1. When Doris is initialized, the following users and roles are automatically created:

    - operator role: This role has `Node_priv` and `Admin_priv`, i.e., all permissions in Doris.
    - admin role: This role has `Admin_priv`, i.e., all permissions except for node changes.
    - root@'%': root user, allowed to log in from any node, with the operator role.
    - admin@'%': admin user, allowed to log in from any node, with the admin role.

2. It is not supported to delete or change the permissions of roles or users created by default.

3. There is only one user with the operator role, which is Root. There can be multiple users with the admin role.

4. Some potentially conflicting operations are explained as follows:

    1. Domain and IP conflict:

        Suppose the following user is created:

        `CREATE USER user1@['domain'];`

        And granted:

        `GRANT SELECT_PRIV ON *.* TO user1@['domain']`

        This domain is resolved to two IPs: ip1 and ip2.

        Suppose later, we grant a separate permission to `user1@'ip1'`:

        `GRANT ALTER_PRIV ON . TO user1@'ip1';`

        Then `user1@'ip1'` will have permissions for both Select_priv and Alter_priv. And when we change the permissions for `user1@['domain']` again, `user1@'ip1'` will not follow the change.

    2. Duplicate IP conflict:

        Suppose the following users are created:

        ```
        CREATE USER user1@'%' IDENTIFIED BY "12345";
        CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
        ```

        In terms of priority, `'192.%'` takes precedence over `'%'`, so when user `user1` from machine `192.168.1.1` tries to log into Doris using password `'12345'`, access will be denied.

5. Forgotten Password

    If you forget the password and cannot log into Doris, you can add `skip_localhost_auth_check=true` to the FE's config file and restart the FE, thus logging into Doris as root without a password from the local machine.

    After logging in, you can reset the password using the `SET PASSWORD` command.

6. No user can reset the root user's password except for the root user themselves.

7. `Admin_priv` permissions can only be granted or revoked at the GLOBAL level.

8. `current_user()` and `user()`

    Users can view their `current_user` and `user` by executing `SELECT current_user()` and `SELECT user()` respectively. Here, `current_user` indicates the identity the user authenticated with, while `user` is the actual User Identity at the moment.

    For example:

    Suppose `user1@'192.%'` is created, and then user `user1` logs in from `192.168.10.1`, then the `current_user` would be `user1@'192.%'`, and `user` would be `user1@'192.168.10.1'`.

    All permissions are granted to a specific `current_user`, and the real user has all the permissions of the corresponding `current_user`.

## Best Practices

Here are some examples of use cases for the Doris permission system.

1. Scenario 1

   Users of the Doris cluster are divided into administrators (Admin), development engineers (RD), and users (Client). Administrators have all permissions over the entire cluster, primarily responsible for cluster setup and node management. Development engineers are responsible for business modeling, including creating databases and tables, importing, and modifying data. Users access different databases and tables to retrieve data.

   In this scenario, administrators can be granted ADMIN or GRANT privileges. RDs can be granted CREATE, DROP, ALTER, LOAD, and SELECT permissions for any or specific databases and tables. Clients can be granted SELECT permissions for any or specific databases and tables. Additionally, different roles can be created to simplify the authorization process for multiple users.

2. Scenario 2

   A cluster may contain multiple businesses, each potentially using one or more datasets. Each business needs to manage its users. In this scenario, an administrative user can create a user with DATABASE-level GRANT privileges for each database. This user can only authorize users for the specified database.

3. Blacklist

   Doris itself does not support a blacklist, only a whitelist, but we can simulate a blacklist through certain means. Suppose a user named `user@'192.%'` is created, allowing users from `192.*` to log in. If you want to prohibit a user from `192.168.10.1` from logging in, you can create another user `cmy@'192.168.10.1'` with a new password. Since `192.168.10.1` has higher priority than `192.%`, the user from `192.168.10.1` will no longer be able to log in with the old password.
