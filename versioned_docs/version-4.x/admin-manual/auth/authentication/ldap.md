---
{
    "title": "LDAP",
    "language": "en",
    "description": "Detailed guide on Apache Doris federated authentication: unified identity verification and group authorization through LDAP integration, covering configuration steps, login methods, permission mapping rules, and common troubleshooting."
}
---

Doris supports integration with third-party LDAP services, providing two core functionalities:

- **Authentication**: Use LDAP passwords instead of Doris passwords for identity verification.
- **Group Authorization**: Map LDAP `groups` to Doris `roles` for unified permission management.

## LDAP Basic Concepts

In LDAP, data is organized in a tree structure. Here's an example of a typical LDAP directory tree:

```text
- dc=example,dc=com
 - ou = ou1
   - cn = group1
   - cn = user1
 - ou = ou2
   - cn = group2
     - cn = user2
 - cn = user3
```

### Terminology

| Term | Full Name | Description |
| --- | --- | --- |
| `dc` | Domain Component | Organization's domain name, serving as the root node of the tree |
| `dn` | Distinguished Name | Unique name. For example, user1's `dn` is `cn=user1,ou=ou1,dc=example,dc=com`, user2's `dn` is `cn=user2,cn=group2,ou=ou2,dc=example,dc=com` |
| `rdn` | Relative Distinguished Name | Part of the `dn`. user1's four `rdns` are `cn=user1`, `ou=ou1`, `dc=example`, and `dc=com` |
| `ou` | Organization Unit | Sub-organization. `users` can be placed in `ou` or directly under the example.com domain |
| `cn` | Common Name | Name |
| `group` | - | Group, corresponding to Doris roles |
| `user` | - | User, equivalent to Doris users |
| `objectClass` | - | Data type. Used to distinguish whether a node is a `group` or `user`. `group` requires `cn` and `member` (list of `users`) attributes, `user` requires `cn`, `password`, `uid`, etc. |

## Quick Start

### Step 1: Configure Doris

1. Set the authentication method in `fe/conf/fe.conf`: `authentication_type=ldap`.
2. Configure LDAP service connection information in `fe/conf/ldap.conf`:

    ```
    ldap_authentication_enabled = true
    ldap_host = ladp-host
    ldap_port = 389
    ldap_admin_name = uid=admin,o=emr
    ldap_user_basedn = ou=people,o=emr
    ldap_user_filter = (&(uid={login}))
    ldap_group_basedn = ou=group,o=emr
    ```

3. After starting `fe`, log in to Doris with `root` or `admin` account and set the LDAP admin password:

    ```sql
    set ldap_admin_password = password('<ldap_admin_password>');
    ```

### Step 2: Client Connection

LDAP authentication requires clients to send passwords in plaintext, so cleartext authentication plugins must be enabled.

**MySQL Client**

You can enable the cleartext authentication plugin using either method:

- **Method 1**: Set environment variable (permanent)

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ~/.bash_profile && source ~/.bash_profile
    ```

- **Method 2**: Add parameter when logging in (one-time)

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
    ```

**JDBC Client**

1. Doris SSL Not Enabled

    When Doris SSL is not enabled, you need to create a custom authentication plugin to bypass SSL restrictions when using JDBC connections:

    1. Create a custom plugin class that extends `MysqlClearPasswordPlugin` and overrides the `requiresConfidentiality()` method:

        ```java
        public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
          @Override
          public boolean requiresConfidentiality() {
            return false;
          }
        }
        ```

    2. Configure the custom plugin in the JDBC connection URL (replace `xxx` with your actual package name):

        ```sql
        jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
        ```

        Description of the three required properties:

        | Property | Description |
        | --- | --- |
        | `authenticationPlugins` | Register the custom cleartext authentication plugin |
        | `defaultAuthenticationPlugin` | Set the custom plugin as the default authentication plugin |
        | `disabledAuthenticationPlugins` | Disable the original cleartext authentication plugin (which mandates SSL) |

    > You can refer to the examples in [this code repository](https://github.com/morningman/doris-debug-tools/tree/main/jdbc-test). Or execute `build-auth-plugin.sh` to directly generate the plugin JAR file, then place it in the client's specified location.

2. Doris SSL Enabled

    When Doris SSL is enabled (`enable_ssl=true` added in `fe.conf`):

    ```sql
    jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?useSSL=true&sslMode=REQUIRED
    ```

## Authentication

LDAP authentication means password verification through LDAP service to supplement Doris's native authentication mechanism. Password verification priority is as follows:

1. Doris first uses LDAP to verify user passwords.
2. If the user doesn't exist in LDAP, it falls back to Doris local password verification.
3. If the LDAP password is correct but there's no corresponding account in Doris, a temporary user is created for login.

### Login Behavior Overview

After enabling LDAP, login behaviors under different user states are as follows:

| LDAP User | Doris User | Password Used | Login Result | Login Identity |
| --------- | ---------- | ------------- | ------------ | -------------- |
| Exists | Exists | LDAP password | Success | Doris user |
| Exists | Exists | Doris password | Failed | - |
| Not exists | Exists | Doris password | Success | Doris user |
| Exists | Not exists | LDAP password | Success | LDAP temporary user |

> **About Temporary Users:**
>
> - Temporary accounts are only valid for the current connection and are automatically destroyed when disconnected.
> - Doris doesn't create persistent user metadata for temporary users.
> - Temporary user permissions are determined by LDAP group authorization (see "Group Authorization" section below).
> - If temporary users have no corresponding group permissions, they default to `select_priv` on `information_schema`.

### Login Examples

The following examples assume LDAP authentication is enabled, configured with `ldap_user_filter = (&(uid={login}))`, and the client has set `LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1`.

**Scenario 1: Account exists in both Doris and LDAP**

- Doris account: `jack@'172.10.1.10'`, password: `123456`
- LDAP user attributes: `uid: jack`, password: `abcdef`

Login with LDAP password, success:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

Login with Doris password, failed (after enabling LDAP, LDAP users must use LDAP passwords):

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

**Scenario 2: User exists only in LDAP**

- LDAP user attributes: `uid: jack`, password: `abcdef`

Login with LDAP password, Doris automatically creates temporary user `jack@'%'` and logs in. Temporary user has basic permission `DatabasePrivs`: `Select_priv`, automatically destroyed after disconnection:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

**Scenario 3: Account exists only in Doris**

- Doris account: `jack@'172.10.1.10'`, password: `123456`

User doesn't exist in LDAP, falls back to Doris local authentication, login succeeds with Doris password:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

## Group Authorization

LDAP group authorization maps LDAP `groups` to Doris `roles` to achieve centralized permission management. The core mechanism is:

- If an LDAP user's `dn` appears in the `member` attribute of an LDAP group node, Doris considers the user belongs to that group.
- When users log in, Doris automatically grants them the `role` permissions corresponding to their LDAP groups.
- After users log out, Doris automatically revokes these `role` permissions.

> **Prerequisite:** Before using LDAP group authorization, you need to create `roles` in Doris with the same names as LDAP `groups` and grant permissions to these `roles`.

### Permission Merging Rules

The final permissions of a logged-in user depend on their status in both LDAP and Doris:

| LDAP User | Doris User | Final Permissions |
| --------- | ---------- | ----------------- |
| Exists | Exists | LDAP group permissions + Doris user permissions |
| Not exists | Exists | Doris user permissions |
| Exists | Not exists | LDAP group permissions |

### Group Name Mapping Rules

Doris extracts the first `Rdn` of the LDAP group `dn` as the group name and maps it to a `role` with the same name in Doris.

For example, if user `dn` is `uid=jack,ou=aidp,dc=domain,dc=com`, and the group information is:

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```

The first `Rdn` of this group `dn` is `cn=doris_rd`, so the group name is `doris_rd`, corresponding to the `role` `doris_rd` in Doris.

### Group Authorization Example

If user jack belongs to LDAP groups `doris_rd`, `doris_qa`, `doris_pm`, and Doris has `roles` with the same names: `doris_rd`, `doris_qa`, `doris_pm`. After jack logs in, in addition to the original permissions of their Doris account, they will also receive the permissions of these three `roles`.

> **Note:**
>
> - Which `group` a `user` belongs to is independent of the LDAP tree's organizational structure. `user2` in the example above doesn't necessarily belong to `group2`.
> - To make `user2` belong to `group2`, you need to explicitly add `user2` to the `member` attribute of `group2`.

## Cache Management

To avoid frequent access to LDAP services, Doris caches LDAP information in memory.

| Configuration | Description | Default Value |
| --- | --- | --- |
| `ldap_user_cache_timeout_s` | Cache time for LDAP user information (seconds) | 43200 (12 hours) |

In the following scenarios, you may need to manually refresh the cache to make changes take effect immediately:

- Modified user or group information in the LDAP service.
- Modified the `Role` permissions corresponding to LDAP user groups in Doris.

You can refresh the cache with the `refresh ldap` statement. See [REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP) for details.

## Known Limitations

- Currently, Doris's LDAP functionality only supports cleartext password verification, meaning that when users log in, passwords are transmitted in plaintext between `client` and `fe`, and between `fe` and LDAP service.

## FAQ

**Q: How to check which roles an LDAP user has in Doris?**

After logging into Doris with an LDAP user, execute `show grants;` to view all roles of the current user. `ldapDefaultRole` is the default role that every LDAP user has.

**Q: An LDAP user has fewer roles in Doris than expected, how to troubleshoot?**

Check the following items step by step:

1. Execute `show roles;` to confirm whether the expected roles exist in Doris. If not, create them with `CREATE ROLE role_name;`.
2. Check whether the expected `group` is located under the organizational structure corresponding to `ldap_group_basedn`.
3. Check whether the expected `group` contains the `member` attribute.
4. Check whether the `member` attribute of the expected `group` contains the current user's `dn`.
