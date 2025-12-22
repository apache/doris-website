---
{
    "title": "Federated Authentication",
    "language": "en",
    "description": "Integrate third-party LDAP services to provide login authentication and group authorization services for Doris."
}
---

## LDAP

Integrate third-party LDAP services to provide login authentication and group authorization services for Doris.

### LDAP Login Authentication

LDAP login authentication refers to supplementing Doris's login authentication by integrating password verification from LDAP services. Doris prioritizes using LDAP to verify user passwords. If the user does not exist in the LDAP service, Doris continues to use its own password verification. If the LDAP password is correct but there is no corresponding account in Doris, a temporary user is created to log in to Doris.

After enabling LDAP, users can exist in the following scenarios in Doris and LDAP:

| LDAP User      | Doris User     | Password       | Login Status     | User Logged into Doris |
| -------------- | -------------- | -------------- | ---------------- | ---------------------- |
| Exists         | Exists         | LDAP Password  | Login Successful | Doris User             |
| Exists         | Exists         | Doris Password | Login Failed     | None                   |
| Does Not Exist | Exists         | Doris Password | Login Successful | Doris User             |
| Exists         | Does Not Exist | LDAP Password  | Login Successful | Ldap Temporary User    |

After enabling LDAP, when users log in using the MySQL client, Doris first verifies the user password through the LDAP service. If the user exists in LDAP and the password is correct, Doris logs in with that user; if Doris has a corresponding account, it logs into that account directly. If there is no corresponding account, a temporary account is created for the user to log in. Temporary accounts have corresponding permissions (see LDAP Group Authorization) and are only valid for the current connection. Doris will not create the user or generate user creation metadata.
If the login user does not exist in the LDAP service, Doris's password authentication is used.

Assuming LDAP authentication is enabled, configured with `ldap_user_filter = (&(uid={login}))`, and other configurations are correct, the client sets the environment variables accordingly.

For example:

1. Both Doris and LDAP have the account:

    Doris account: `jack@'172.10.1.10'`, password: `123456`

    LDAP user node has attributes: `uid: jack` user password: `abcdef`

    Using the following command to log in to Doris can log in to the `jack@'172.10.1.10'` account:

    ```sql
    mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
    ```

    Using the following command will log in failed:

    ```sql
    mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
    ```

2. LDAP has a user, but Doris does not have a corresponding account:

    LDAP user node has attributes: `uid: jack` user password: `abcdef`

    Using the following command to create a temporary user and log in to `jack@'%'`, the temporary user has basic permissions DatabasePrivs: Select_priv, and the user will be deleted after logging out:

    ```sql
    mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
    ```

3. LDAP does not have a user:

    Doris account: `jack@'172.10.1.10'`, password: `123456`

    Using Doris's password to log in to the account, successful:

    ```sql
    mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
    ```

### LDAP Group Authorization

LDAP group authorization is to map LDAP groups to Doris roles and grant all corresponding role permissions to the logged-in user. After logging out, Doris will revoke the corresponding role permissions. Before using LDAP group authorization, you should create the corresponding role in Doris and grant permissions to the role.

The permissions of the logged-in user are related to the Doris user and group permissions, as shown in the following table:

| LDAP User      | Doris User     | Login User's Permissions                        |
| -------------- | -------------- | ----------------------------------------------- |
| Exists         | Exists         | LDAP Group Permissions + Doris User Permissions |
| Does Not Exist | Exists         | Doris User Permissions                          |
| Exists         | Does Not Exist | LDAP Group Permissions                          |

If the logged-in user is a temporary user and does not have group permissions, the user has the select_priv permission of the information_schema by default.

For example:

LDAP user dn is the "member" attribute of the LDAP group node, and Doris considers the user to belong to that group. Doris takes the first Rdn of the group dn as the group name.

For example, the user dn is `uid=jack,ou=aidp,dc=domain,dc=com`, and the group information is as follows:

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com
objectClass: groupOfNames
member: uid=jack,ou=aidp,dc=domain,dc=com
```

Then the group name is `doris_rd`.

Assuming `jack` also belongs to LDAP groups `doris_qa` and `doris_pm`; and Doris has roles: `doris_rd`, `doris_qa`, `doris_pm`, after logging in using LDAP authentication, the user will not only have the original permissions of the account but also gain the permissions of roles `doris_rd`, `doris_qa`, and `doris_pm`.

> Note:
>
> The group a user belongs to is unrelated to the organizational structure of the LDAP tree. User2 in the example does not necessarily belong to group2.

### LDAP Example

#### Modify Doris Configuration

1. In the `fe/conf/fe.conf` file, configure the authentication method as ldap: `authentication_type=ldap`.
2. In the `fe/conf/ldap.conf` file, configure the basic LDAP information.
3. Set the LDAP administrator password: After configuring the `ldap.conf` file, start the fe, log in to Doris using the root or admin account, and execute the SQL

```sql
set ldap_admin_password = password('ldap_admin_password');
```

#### Log in Using the MySQL Client

```sql
mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
Enter the LDAP password
```

Note: To log in using other clients, refer to the section "How Clients Use Clear Text Login" below.

### LDAP Information Cache

To avoid frequent access to the LDAP service, Doris caches LDAP information in memory. You can configure the `ldap_user_cache_timeout_s` parameter in the `ldap.conf` file to specify the cache time for LDAP users, which defaults to 12 hours. After modifying the information in the LDAP service or modifying the corresponding role permissions in Doris, the changes may not take effect immediately due to caching. You can use the `refresh ldap` statement to refresh the cache. For details, see [REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP).

### Limitations of LDAP Verification

-   Currently, Doris's LDAP function only supports clear text password verification, which means that the password is transmitted in clear text between the client and fe, and between fe and the LDAP service.

### Common Issues

-   How to determine which roles an LDAP user has in Doris?

    Log in to Doris using the LDAP user and execute `show grants;` to view the roles of the current user. `ldapDefaultRole` is the default role that each LDAP user has in Doris.

-   Why does an LDAP user have fewer roles in Doris than expected?

    1. Use `show roles;` to check if the expected role exists in Doris. If it does not exist, create the role using `CREATE ROLE rol_name;`.
    2. Check if the expected group is under the organizational structure corresponding to `ldap_group_basedn`.
    3. Check if the expected group has the member attribute.
    4. Check if the member attribute of the expected group contains the current user.

### LDAP Concepts

In LDAP, data is organized in a tree structure.

#### Example (The following explanations are based on this example)

```
- dc=example,dc=com
 - ou = ou1
   - cn = group1
   - cn = user1
 - ou = ou2
   - cn = group2
     - cn = user2
 - cn = user3
```

#### LDAP Terminology

-   dc (Domain Component): Can be understood as the domain name of an organization, serving as the root node of the tree.
-   dn (Distinguished Name): Equivalent to a unique name, such as the dn of user1 is `cn=user1,ou=ou1,dc=example,dc=com`, and the dn of user2 is `cn=user2,cn=group2,ou=ou2,dc=example,dc=com`.
-   rdn (Relative Distinguished Name): A part of the dn, such as the four rdns of user1 are `cn=user1`, `ou=ou1`, `dc=example`, and `dc=com`.
-   ou (Organization Unit): Can be understood as a sub-organization, users can be placed under ou, or directly under the example.com domain.
-   cn (common name): Name.
-   group: Group, can be understood as a role in Doris.
-   user: User, equivalent to a user in Doris.
-   objectClass: Can be understood as the type of each line of data, such as how to distinguish group1 as a group or a user, each type of data requires different attributes, such as group requires cn and member (user list), user requires cn, password, uid, etc.

### How Clients Use Clear Text Login

#### MySQL Client

To use LDAP verification, the client needs to enable the MySQL client clear text verification plugin. To log in to Doris using the command line, you can use one of the following methods to enable the MySQL clear text verification plugin:

-   Set the environment variable `LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN` to 1

    For example, in a Linux or Mac environment, you can use:

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ～/.bash_profile && source ～/.bash_profile
    ```

-   Add the parameter `--enable-cleartext-plugin` when logging in to Doris each time

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin

    Enter the LDAP password
    ```

#### JDBC Client

To log in to Doris using the JDBC client, you need to customize the plugin.

First, create a class named `MysqlClearPasswordPluginWithoutSSL` that inherits from `MysqlClearPasswordPlugin`. In this class, override the `requiresConfidentiality()` method and return false.

```java
public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
@Override
public boolean requiresConfidentiality() {
    return false;
  }
}
```

When getting a database connection, you need to configure the customized plugin in the properties.

That is, (xxx is the package name of the customized class)

-   authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL
-   defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL
-   disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin

For example:

```sql
jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
```
