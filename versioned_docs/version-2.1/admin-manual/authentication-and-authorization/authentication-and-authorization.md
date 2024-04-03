---
{
"title": "authentication-and-authorization",
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

# Noun Interpretation

1. User Identity

   In a permission system, a user is identified as a User Identity. The user identity consists of two parts: username and userhost. Where username is the username, composed of uppercase and lowercase in English. Userhost represents the IP address from which the user link comes. User Identity is presented as username @'userhost ', representing the username from userhost.

   Another representation of User Identity is username @ ['domain '], where domain is a domain name that can be resolved into a set of IPs through DNS or BNS (Baidu Name Service). The final representation is a set of username @'userhost ', so we will use username @'userhost' to represent it uniformly.

2. Privilege

   The objects of permission are nodes, data directories, databases, or tables. Different permissions represent different operating permissions.
   
3. Role

   Doris can create custom named characters. A role can be seen as a collection of permissions. If a newly created user can be assigned a certain role, they will be automatically granted the permissions that the role possesses. Subsequent permission changes to the role will also be reflected in the permissions of all users belonging to that role.

5. User Property

   User attributes are directly associated with a user, rather than a user ID. Both user1 @'192.% 'and user1 @ ['domain'] have the same set of user attributes, which belong to user user1, rather than user1 @'192.% 'or user1 @ ['domain'].

   User attributes include but are not limited to: maximum number of user connections, importing cluster configuration, and so on.

# Authentication-and-authorization framework

The process of users logging into Apache Doris is divided into two parts: authentication and authentication.

- Authentication: Perform identity verification based on the credentials provided by the user, such as username, customer single IP, password, etc. After verification, the individual user will be mapped to the User Identity within the system.
- Authorization: Based on the obtained user ID, check whether the user has the corresponding operation permissions according to the permissions corresponding to the user ID.

# Authentication

Doris supports built-in authentication schemes as well as authentication schemes for LDAP.

## Doris built-in authentication scheme

Authenticate based on the username, password, and other information stored by Doris itself.

Administrators create users through `create user` and view all created users through `show all grants`

When a user logs in, they will check if the username, password, and client's IP address are correct.

### Password Policy

Doris supports the following password policies to help users better manage passwords.

1. `PASSWORD_HISTORY`

   Allow the current user to use historical passwords when resetting their password. For example, `PASSWORd_HISTORY 10` means that the password set in the past 10 times is prohibited from being used as a new password. If set to `PASSWORd_HISTORY DEFAULT`, the value in the global variable `password_history` will be used `0` indicates that this feature is not enabled. The default is 0.

3. `PASSWORD_EXPIRE`

   Set the expiration time for the current user's password. For example, `PASSWORD.EXIRE INTERVAL 10 DAY` indicates that the password will expire in 10 days `PASSWORd_EXIRE NEVER` indicates that the password does not expire. If set to `PASSWORDEXPIRE DEFAULT`, the value in the global variable `default_passwordlifetime` will be used. The default is NEVER (or 0), indicating that it will not expire.

4. `FAILED_LOGIN_ATTEMPTS` 和 `PASSWORD_LOCK_TIME`

   When setting the current user login, if the wrong password is used n times to log in, the account will be locked and the lock time will be set. For example, `FAILED-LOGIN-ATTEMPTS 3 PASSWORL_LOCK TIME 1 DAY` indicates that if there are 3 incorrect logins, the account will be locked for one day.

   Locked accounts can be actively unlocked through the SUPER USER statement.

## LDAP based authentication scheme

[LDAP](../privilege-ldap/ldap.md)

# authorization
## Permission operation
1. Create user: [CREATE USER](../../sql-manual/sql-reference/Account-Management-Statements/CREATE-USER.md)
2. Alter user: [ALTER USER](../../sql-manual/sql-reference/Account-Management-Statements/ALTER-USER.md)
3. Drop user: [DROP USER](../../sql-manual/sql-reference/Account-Management-Statements/DROP-USER.md)
4. Grant/Assign roles: [GRANT](../../sql-manual/sql-reference/Account-Management-Statements/GRANT.md)
5. Revoke/Revoke roles: [REVOKE](../../sql-manual/sql-reference/Account-Management-Statements/REVOKE.md)
6. Create role: [CREATE ROLE](../../sql-manual/sql-reference/Account-Management-Statements/CREATE-ROLE.md)
7. Drop role: [DROP ROLE](../../sql-manual/sql-reference/Account-Management-Statements/DROP-ROLE.md)
8. Alter role: [ALTER ROLE](../../sql-manual/sql-reference/Account-Management-Statements/ALTER-ROLE.md)
9. View current user privileges: [SHOW GRANTS](../../sql-manual/sql-reference/Show-Statements/SHOW-GRANTS.md)
10. View all user privileges: [SHOW ALL GRANTS](../../sql-manual/sql-reference/Show-Statements/SHOW-GRANTS.md)
11. View the created roles: [SHOW ROLES](../../sql-manual/sql-reference/Show-Statements/SHOW-ROLES.md)
12. Set user properties: [SET PROPERTY](../../sql-manual/sql-reference/Account-Management-Statements/SET-PROPERTY.md)
13. View user properties: [SHOW PROPERTY](../../sql-manual/sql-reference/Show-Statements/SHOW-PROPERTY.md)
14. Change password: [SET PASSWORD](../../sql-manual/sql-reference/Account-Management-Statements/SET-PASSWORD.md)
15. View all supported permission items: [SHOW PRIVILEGES](../../sql-manual/sql-reference/Show-Statements/SHOW-PRIVILEGES.md)
16. View row permission policies: [SHOW ROW POLICY](../../sql-manual/sql-reference/Show-Statements/SHOW-POLICY.md)
17. Create row permission policy: [CREATE ROW POLICY](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-POLICY.md)

## Permission type

Doris currently supports the following types of permissions

1. Node_priv

   Node change permissions. Including operations such as adding, deleting, and offline FE, BE, and BROKER nodes.

   Root users have this permission by default. Users who have both Grant_priv and Node.priv can grant this permission to other users.

   This permission can only be granted at the Global level.

2. Grant_priv

   Permission change permission. Allow operations including authorization, revocation, adding/deleting/changing users/roles.

   When granting authorization to other users/roles, the current user only needs the corresponding level of grant priv permission before 2.1.2, and after 2.1.2, the current user must also have the permissions they want to authorize.

   When assigning roles to other users, grant _priv permission at the global level is required

3. Select_priv

   Read only permissions on data directories, databases, tables, and columns.

4. Load_priv

   Write permissions for data directories, databases, and tables. Including Load, Insert, Delete, etc.

5. Alter_priv

   Change permissions for data directories, databases, and tables. This includes operations such as renaming libraries/tables, adding/deleting/changing columns, and adding/deleting partitions.

7. Create_priv

   Create permissions for data directories, databases, tables, and views.

7. Drop_priv

   Delete permissions for data directories, databases, tables, and views.

8. Usage_priv

   The usage and workload group permissions of the resource.

9. Show_view_priv

   priv of Show create view

## privilege level

### Global Permissions

   The permissions granted on *. *. * through the GRANT statement. The granted permissions apply to any library table in any catalog.

### Catalog Permissions

   The permissions granted on ctl. *. * through the GRANT statement. The granted permissions apply to any library table in the specified Catalog.

### Database level permissions

   The permission granted on ctl. db. * through the GRANT statement. The granted permissions apply to any table in the specified database.

### Table level permissions

   The permission granted on ctl. db. tbl through the GRANT statement. The granted permissions apply to any column of the specified table.

### Column level permissions

   Mainly used to restrict user access to certain columns in the data table. Specifically, column permissions allow administrators to set viewing, editing, and other permissions for certain columns to control user access and operations on specific column data.

   Partial column permissions for a specified table can be granted through GRANT Select_priv (col1, col2) to ctl. db. tbl.

   Currently, column permissions only support Select_priv.

### Row level permissions

   Exercise restrictions allow administrators to define access policies based on certain fields of data, thereby controlling which users can access which data rows.

   Specifically, Row Policy allows administrators to create rules that can filter or restrict user access to rows based on actual values stored in the data.

   Starting from version 1.2, row level permissions can be created using the [CREATE ROW POLICY](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-POLICY.md).

   Starting from version 2.1.2, it is supported to set row permissions through Apache Ranger's Row Level Filter (note: only supported in the Nereids optimizer)

## Usage permissions

#### RESOURCE permissions

   The Resource permission is a permission set separately for resources, which is not related to permissions such as databases and tables. Only USAGE and GRANT permissions can be assigned, and assigning all Resources can be done through the `GRANT USAGE-PRIV ON Resource 'to xxx`

#### WORKLOAD GROUP permissions

   The Workload Group permission is a separate permission set for Workload Group, which is not related to permissions such as databases and tables. Only USAGE and GRANT permissions can be assigned

   Allocating all Workload Groups can be done through ` GRANT USAGE-PRIV ON GROUP '%' to xxx`

## Data Mask

   Data desensitization is a method of protecting sensitive data by modifying, replacing, or hiding the original data, so that the desensitized data no longer contains sensitive information while maintaining a certain format and characteristics.

   For example, the administrator can choose to replace some or all numbers of sensitive fields such as credit card number and ID number with asterisks (*) or other characters, or replace the real name with a pseudonym.

   Starting from version 2.1.2, it is supported to set desensitization policies for certain columns through Apache Ranger Masking. Currently, only [Doris Ranger](../privilege-ldap/ranger.md) is supported for setting.

## Authentication scheme

### Doris built-in authentication scheme

   Doris permission design is based on the RBAC (Role Based Access Control) permission management model, where users are associated with roles, roles are associated with permissions, and users are indirectly associated with permissions through roles.

   When a role is deleted, the user automatically loses all permissions for that role.

   When a user and a role are disassociated, the user automatically loses all permissions of the role.

   When the permissions of a role are added or removed, the user's permissions will also change accordingly. 
   
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
   As shown in the above figure:

   Both user1 and user2 have priv1 permissions through role1.

   UserN has the permission to priv1 through role3, and priv2 and privN through roleN. Therefore, userN has the permission to priv1, priv2, and privN simultaneously.

   For the convenience of user operation, it is possible to directly authorize users. In the underlying implementation, a default role dedicated to each user is created. When authorizing a user, it is actually authorizing the user's default role.

   The default role cannot be deleted or assigned to others. When a user is deleted, the default role is also automatically deleted.
   
### Authentication scheme based on Apache Ranger

   [Doris Ranger](../privilege-ldap/ranger.md)

# Others

## Permission Item Description

1. Users with ADMIN permission or GRANT permission at the GLOBAL level can perform the following operations:
- `CREATE USER`
- `DROP USER`
- `ALTER USER`
- `SHOW GRANTS`
- `CREATE ROLE`
- `DROP ROLE`
- `ALTER ROLE`
- `SHOW ROLES`
- `SHOW PROPERTY FOR USER`

2. `GRANT/REVOKE`
- Having the ADMIN permission allows for granting or revoking permissions to any user.
- Having the 'ADMIN' or 'GLOBAL' hierarchical 'GRANT' permission allows roles to be assigned to users.
- Simultaneously possessing the corresponding level of 'GRANT' permissions and the permissions to be assigned, permissions can be assigned to users/roles.

3. `SET PASSWORD`
- Users with ADMIN permission or GLOBAL level GRANT permission can set passwords for non ROOT users.
- Ordinary users can set their corresponding UserIdentity password. The corresponding UserIdentity can be accessed through ` SELECT CURREN_USER()` Command viewing.
- ROOT users can change their passwords

## Other instructions
1. When Doris initializes, the following users and roles will be automatically created:
   - `operator` role: This role has all permissions to Doris, namely 'Node_priv' and 'Adminpriv'.
   - `admin` role: This role has' Adminpriv ', which means all permissions except for node changes.
   - `root@'%'`：`root` user，Allow login from any node with the role of 'operator'.
   - `admin@'%'`：`admin` user，Allow login from any node with the role of 'admin'.
2. Deleting or changing the permissions of default created roles or users is not supported.
3. There is only one user in the role of `operator`, namely `'Root'` Users with the `admin` role can create multiple.
4. Some possible conflicting operation instructions

   1. Domain name and IP conflict:

   Assuming the following users are created:

   `CREATE USER user1@['domain'];`

   And authorize:

   `GRANT SELECT_PRIV ON *.* TO user1@['domain']`

   The domain is parsed into two IPs: 'ip1' and 'ip2'`

   Assuming that after that, we will grant a separate authorization to 'user1 @'ip1':

   `GRANT ALTER_PRIV ON *.* TO user1@'ip1';`

   The permission for 'user1 @'ip1' will be modified to `SELECT-PRIV, Alter-PRIV`. And when we change the permissions of 'user1 @ ['domain'] again, 'user1 @'ip1' will not follow the change.

   2. Duplicate IP conflict:

   Assuming the following users are created:

   `CREATE USER user1@'%' IDENTIFIED BY "12345";`

   `CREATE USER user1@'192.%' IDENTIFIED BY "abcde";`

   In terms of priority, '192.%' takes precedence over '%'. Therefore, when user 'user1' attempts to log in to Doris using the password '12345' from the machine '192.168.1.1', it will be rejected.

5. forgot password

   If you forget your password and are unable to log in to Doris, you can add the `skip_localhost_auth_check` parameter to the FE's config file and restart FE to log in to Doris locally through localhost without a password:
   `skip_localhost_auth_check = true`

   After logging in, the password can be reset using the 'SET PASSWORD' command.

6. No user can reset the password of the root user, except for the root user themselves.

7. `ADMIN-PRIV permission can only be granted or revoked at the GLOBAL level.

8. `current_user()` and `user()`

   Users can use ` SELECT current_user()` And ` SELECT user()` View 'current_user' and 'user' separately. Among them, 'current_user' represents the identity of the current user through the authentication system, while 'user' is the actual 'user_identity' of the user. For example:

   Assuming a user named 'user1 @'192.%' is created, and it is assumed that user 'user1' from '192.168.10.1' has logged into the system, then the 'current_user' is' user1 @'192.% ', and the' user 'is' user1 @'192.168.10.1'.

   All permissions are assigned to a certain 'current_user', and real users have all the corresponding permissions for the 'current_user'.

9. Password strength

   In version 1.2, a verification function for user password strength has been added. This feature is controlled by the global variable 'validate.password_policy'. The default is' NONE/0 ', which means password strength is not checked. If set to 'STRING/2', the password must contain three items: 'uppercase letters',' lowercase letters', 'numbers', and' special characters', and the length must be greater than or equal to 8.