---
{
    "title": "LDAP",
    "language": "en",
    "description": "Configure unified authentication and group authorization for Apache Doris by integrating LDAP/LDAPS, including login methods, privilege mapping, and common issues.",
    "keywords": [
        "Doris LDAP",
        "Doris LDAPS",
        "LDAP authentication",
        "LDAP group authorization",
        "unified authentication",
        "ldap.conf configuration",
        "ldap_default_roles",
        "MysqlClearPasswordPlugin",
        "ldap_admin_password",
        "ldap_use_ssl",
        "SSLHandshakeException",
        "PKIX path building failed",
        "cleartext password plugin",
        "cleartext plugin"
    ]
}
---

Apache Doris supports integration with third-party LDAP services, so the existing enterprise account system can be reused directly as the identity and privilege source for Doris, avoiding duplicate maintenance of users and passwords. LDAP integration provides two core capabilities:

- **Authentication login**: Use the LDAP password instead of the Doris password for identity authentication.
- **Group authorization**: Map LDAP `group` to Doris `role` to achieve unified privilege management.
- **Default role authorization**: Grant configured Doris roles to every LDAP-authenticated user without putting all users into one LDAP group.

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Integrating enterprise unified identity / centralized privilege management -->

## Applicable Scenarios

| Scenario | Description |
| --- | --- |
| Enterprise unified identity authentication | An LDAP/AD account system already exists, and you want Doris users to reuse it directly without creating accounts again in Doris |
| Centralized privilege management | Manage role members through LDAP groups; adjust LDAP group members to batch-adjust Doris privileges |
| Baseline privileges for LDAP users | Grant the same Doris roles to all LDAP-authenticated users through configuration, while still keeping LDAP group authorization |
| Temporary access | Users that exist only in LDAP can log in to Doris as temporary users based on LDAP group privileges |
| Encrypted channel | Encryption is required for the connection between Doris FE and the LDAP server (LDAPS) |

## Prerequisites

- An accessible LDAP/AD service has been deployed, and the following information is available:
    - The `host` and port of the LDAP service (`389` for cleartext, `636` for LDAPS)
    - The administrator account `dn` and password
    - The `basedn` for users and groups
    - The user filter (`ldap_user_filter`)
- You have read/write access to the FE configuration files of the Doris cluster and can restart FE.
- You have a `root` or `admin` account for setting the LDAP administrator password.
- Enabling LDAPS requires Doris version **4.0.5** or higher.

## LDAP Basic Concepts

In LDAP, data is organized in a tree structure. The following is a typical LDAP directory tree example:

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

### Term Explanations

| Term | Full Name | Description |
| --- | --- | --- |
| `dc` | Domain Component | The domain name of the organization, used as the root node of the tree |
| `dn` | Distinguished Name | Unique name. For example, the `dn` of user1 is `cn=user1,ou=ou1,dc=example,dc=com`, and the `dn` of user2 is `cn=user2,cn=group2,ou=ou2,dc=example,dc=com` |
| `rdn` | Relative Distinguished Name | A part of the `dn`. The four `rdn` of user1 are `cn=user1`, `ou=ou1`, `dc=example`, and `dc=com` |
| `ou` | Organization Unit | A suborganization. A `user` can be placed inside an `ou` or directly under the example.com domain |
| `cn` | Common Name | Name |
| `group` | - | Group, corresponding to a Doris role |
| `user` | - | User, equivalent to a Doris user |
| `objectClass` | - | The data type. Used to distinguish whether a node is a `group` or a `user`. A `group` requires `cn` and `member` (the `user` list) attributes; a `user` requires `cn`, `password`, `uid`, and other attributes |

## Integration Process Overview

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: First-time LDAP integration -->

1. **Configure Doris FE**: Switch the authentication method in `fe.conf` and fill in the LDAP service connection information in `ldap.conf`.
2. **Set the LDAP administrator password**: After logging in to Doris, write `ldap_admin_password` through SQL.
3. **Configure the client**: Enable the cleartext password plugin in the MySQL Client or JDBC Client to send the LDAP password.
4. **(Optional) Enable LDAPS**: Encrypt the channel between FE and LDAP.
5. **(Optional) Configure group authorization**: Create `role` in Doris with the same name as the LDAP groups and grant privileges.
6. **(Optional) Configure default roles**: Grant baseline Doris roles to all LDAP-authenticated users through `ldap_default_roles`.

## Step 1: Configure Doris FE

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: LDAP integration configuration on the FE side -->

### 1.1 Switch the Authentication Method

Set the authentication method in `fe/conf/fe.conf`:

```text
authentication_type=ldap
```

### 1.2 Configure LDAP Connection Information

Fill in the LDAP service connection information in `fe/conf/ldap.conf`:

```text
ldap_authentication_enabled = true
ldap_host = ladp-host
ldap_port = 389
ldap_admin_name = uid=admin,o=emr
ldap_user_basedn = ou=people,o=emr
ldap_user_filter = (&(uid={login}))
ldap_group_basedn = ou=group,o=emr
ldap_default_roles = ldap_readonly,ldap_query_user
```

The configuration items are explained below:

| Configuration item | Description |
| --- | --- |
| `ldap_authentication_enabled` | Whether to enable LDAP authentication. Must be `true` |
| `ldap_host` | LDAP server address |
| `ldap_port` | LDAP service port. Default is `389` for cleartext LDAP and `636` for LDAPS |
| `ldap_admin_name` | The `dn` of the LDAP administrator. Doris uses this account to query user and group information |
| `ldap_user_basedn` | The base `dn` for user search |
| `ldap_user_filter` | User match filter. `{login}` is replaced with the login user name |
| `ldap_group_basedn` | The base `dn` for group search, used for group authorization |
| `ldap_default_roles` | Optional. Comma-separated Doris roles granted to every LDAP-authenticated user. These roles are added in addition to LDAP group roles |

:::tip
To enable LDAPS (encrypted connection to the LDAP server), see the [LDAPS (Encrypted Connection)](#ldaps-encrypted-connection) section below.
:::

### 1.3 Set the LDAP Administrator Password

After starting FE, log in to Doris with the `root` or `admin` account and write the LDAP administrator password:

```sql
set ldap_admin_password = password('<ldap_admin_password>');
```

This password is the password of the account corresponding to `ldap_admin_name`. Doris uses it to query the LDAP service.

## Step 2: Client Connection

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Enabling the cleartext password plugin on the client -->

LDAP authentication requires the client to send the password in cleartext, so the cleartext authentication plugin must be enabled.

### 2.1 MySQL Client

You can enable the cleartext authentication plugin by either of the following methods:

- **Method 1**: Set an environment variable (persistent)

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ~/.bash_profile && source ~/.bash_profile
    ```

- **Method 2**: Add a parameter at login time (one-time)

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
    ```

### 2.2 JDBC Client

JDBC requires the cleartext password plugin to be used on top of SSL by default. Whether SSL is enabled determines how the JDBC URL is written:

#### Scenario A: SSL is Not Enabled in Doris

A custom authentication plugin is required to bypass the SSL restriction:

1. Create a custom plugin class that extends `MysqlClearPasswordPlugin` and overrides the `requiresConfidentiality()` method:

    ```java
    public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
        @Override
        public boolean requiresConfidentiality() {
            return false;
        }
    }
    ```

2. Configure the custom plugin in the JDBC connection URL (replace `xxx` with the actual package name):

    ```sql
    jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
    ```

    The three properties to configure are explained below:

    | Property | Description |
    | --- | --- |
    | `authenticationPlugins` | Registers the custom cleartext authentication plugin |
    | `defaultAuthenticationPlugin` | Sets the custom plugin as the default authentication plugin |
    | `disabledAuthenticationPlugins` | Disables the original cleartext authentication plugin (which forces SSL) |

:::tip
You can refer to the related examples in [this code repository](https://github.com/morningman/doris-debug-tools/tree/main/jdbc-test). Running `build-auth-plugin.sh` directly generates the plugin jar described above, which can then be placed in the designated location on the client.
:::

#### Scenario B: SSL is Enabled in Doris

After adding `enable_ssl=true` in `fe.conf`, the JDBC URL can use the MySQL native cleartext password plugin directly:

```sql
jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?useSSL=true&sslMode=REQUIRED
```

## Authentication Login

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenario: Understanding user authentication priority -->

LDAP authentication login means using the LDAP service for password verification, supplementing the authentication mechanism of Doris itself. The priority of password verification is as follows:

1. Doris first uses LDAP to verify the user password.
2. If the user does not exist in LDAP, it falls back to Doris local password verification.
3. If the LDAP password is correct but there is no corresponding account in Doris, a temporary user is created for login.

### Login Behavior Overview

After LDAP is enabled, the login behavior under different user states is as follows:

| LDAP user | Doris user | Password used | Login result | Login identity |
| --------- | ---------- | -------------- | ------------ | -------------- |
| Exists | Exists | LDAP password | Success | Doris user |
| Exists | Exists | Doris password | Failure | - |
| Does not exist | Exists | Doris password | Success | Doris user |
| Exists | Does not exist | LDAP password | Success | LDAP temporary user |

:::info About temporary users

- The temporary account is valid only for the current connection and is automatically destroyed after the connection is closed.
- Doris does not create persistent user metadata for a temporary user.
- The privileges of a temporary user are determined by LDAP group authorization and `ldap_default_roles` (see the "Group Authorization" and "Default Roles for LDAP Users" sections below).
- If the temporary user has no corresponding group privileges or configured default roles, it has the `select_priv` privilege on `information_schema` by default.

:::

### Login Examples

The following examples assume that LDAP authentication is enabled, `ldap_user_filter = (&(uid={login}))` is configured, and the client has `LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1` set.

**Scenario 1: The account exists in both Doris and LDAP**

- Doris account: `jack@'172.10.1.10'`, password: `123456`
- LDAP user attributes: `uid: jack`, password: `abcdef`

Log in with the LDAP password, succeeds:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

Log in with the Doris password, fails (after LDAP is enabled, LDAP users must use the LDAP password):

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

**Scenario 2: The user exists only in LDAP**

- LDAP user attributes: `uid: jack`, password: `abcdef`

Log in with the LDAP password. Doris automatically creates the temporary user `jack@'%'` and logs in. The temporary user receives LDAP group roles and configured default roles if they are available. If no matching roles are available, it has the basic privilege `DatabasePrivs`: `Select_priv`, and is automatically destroyed after the connection is closed:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

**Scenario 3: The account exists only in Doris**

- Doris account: `jack@'172.10.1.10'`, password: `123456`

The user does not exist in LDAP, so it falls back to Doris local authentication. Login with the Doris password succeeds:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

## Group Authorization

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenario: Mapping LDAP groups to Doris roles -->

LDAP group authorization maps LDAP `group` to Doris `role`, providing centralized privilege management. The core mechanism is as follows:

- If the `dn` of an LDAP user appears in the `member` attribute of an LDAP group node, Doris considers the user to belong to that group.
- When the user logs in, Doris automatically grants the user the `role` privileges corresponding to the LDAP groups it belongs to.
- If `ldap_default_roles` is configured, Doris also grants those default roles to the user.
- After the user logs out, Doris automatically revokes these `role` privileges.

:::caution Prerequisites
Before using LDAP group authorization, you must first create a `role` in Doris with the same name as the LDAP `group`, and grant privileges to the `role`.
:::

### Privilege Merge Rules

The final privileges of the logged-in user depend on its state in LDAP and Doris:

| LDAP user | Doris user | Final privileges |
| --------- | ---------- | ---------------- |
| Exists | Exists | LDAP group privileges + configured default roles + Doris user privileges |
| Does not exist | Exists | Doris user privileges |
| Exists | Does not exist | LDAP group privileges + configured default roles |

### Group Name Mapping Rules

Doris extracts the first `Rdn` of the LDAP group `dn` as the group name and maps it to the `role` with the same name in Doris.

For example, if the user `dn` is `uid=jack,ou=aidp,dc=domain,dc=com` and the group information is as follows:

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```

The first `Rdn` of the group `dn` is `cn=doris_rd`, so the group name is `doris_rd`, which corresponds to the `role` `doris_rd` in Doris.

### Group Authorization Example

Suppose user jack belongs to the LDAP groups `doris_rd`, `doris_qa`, and `doris_pm`, and Doris has `role` with the same names: `doris_rd`, `doris_qa`, and `doris_pm`. After jack logs in, in addition to the existing privileges of its Doris account, it also gains the privileges of these three `role`.

:::note Note

- Which `group` a `user` belongs to is independent of the organizational structure of the LDAP tree. In the example above, `user2` does not necessarily belong to `group2`.
- To make `user2` belong to `group2`, you must explicitly add `user2` to the `member` attribute of `group2`.

:::

## Default Roles for LDAP Users

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Granting baseline Doris privileges to all LDAP-authenticated users -->

`ldap_default_roles` is used to grant baseline Doris roles to every LDAP-authenticated user. It is useful when all LDAP users should have the same basic privileges, but maintaining a dedicated LDAP group that contains all LDAP users is impractical.

`ldap_default_roles` does not replace LDAP group authorization. When an LDAP user logs in, Doris merges all of the following privileges:

- Doris roles mapped from the user's LDAP groups.
- Doris roles configured in `ldap_default_roles`.
- Existing privileges of the Doris user, if the same account also exists in Doris.
- The built-in `ldapDefaultRole`, which provides `select_priv` on `information_schema`.

:::caution Prerequisites
Roles listed in `ldap_default_roles` must already exist in Doris. If a configured role does not exist, Doris ignores that role and logs a warning.
:::

### Configure Default Roles

Create the roles and grant privileges to them:

```sql
CREATE ROLE ldap_readonly;
CREATE ROLE ldap_query_user;

GRANT SELECT_PRIV ON internal.example_db.* TO ROLE 'ldap_readonly';
GRANT SELECT_PRIV ON internal.example_db.example_table TO ROLE 'ldap_query_user';
```

Configure the roles in `fe/conf/ldap.conf`:

```text
ldap_default_roles = ldap_readonly,ldap_query_user
```

You can also update the value online:

```sql
ADMIN SET FRONTEND CONFIG ("ldap_default_roles" = "ldap_readonly,ldap_query_user");
```

After `ldap_default_roles` is updated online, Doris refreshes the LDAP user cache automatically so later LDAP logins can use the new default roles.

## LDAPS (Encrypted Connection)

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Encrypting the channel between FE and the LDAP server -->

:::info Supported since version 4.0.5
:::

By default, Doris communicates with the LDAP server through the cleartext LDAP protocol. Starting from version 4.0.5, Doris supports LDAPS (LDAP over SSL/TLS) to encrypt the connection between Doris FE and the LDAP server.

### Enable LDAPS

In `fe/conf/ldap.conf`, update the port to the LDAPS port (typically `636`) and enable SSL:

```text
ldap_host = ldap-host
ldap_port = 636
ldap_use_ssl = true
```

When `ldap_use_ssl` is set to `true`, Doris connects to the LDAP server using the `ldaps://` protocol.

### Configure Certificate Trust

When using LDAPS, the SSL certificate of the LDAP server must be trusted by the JVM of Doris FE:

- If the certificate used by the LDAP server is issued by a well-known public CA, no additional configuration is required.
- If a custom or self-signed CA is used, the CA certificate must be imported into the Java trustStore, and the JVM must be configured to use this trustStore.

Add the trustStore parameters to `JAVA_OPTS` in `fe/conf/fe.conf`. Example:

```text
# JDK 17 example
JAVA_OPTS_FOR_JDK_17 = "-Djavax.net.ssl.trustStore=/path/to/your/cacerts -Djavax.net.ssl.trustStorePassword=changeit ..."
```

The complete steps for importing a self-signed CA certificate:

1. Obtain the CA certificate file (for example, `ca.crt`).
2. Use `keytool` to import it into the Java trustStore:

    ```shell
    keytool -importcert -alias ldap-ca -keystore /path/to/your/cacerts -file /path/to/ca.crt -storepass changeit -noprompt
    ```

3. Configure the trustStore path in `JAVA_OPTS` as described above.
4. Restart Doris FE for the configuration to take effect.

## Cache Management

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Forcing a refresh after LDAP information changes -->

To avoid frequent access to the LDAP service, Doris caches LDAP information in memory.

| Configuration item | Description | Default value |
| --- | --- | --- |
| `ldap_user_cache_timeout_s` | Cache duration of LDAP user information (in seconds) | 43200 (12 hours) |

In the following scenarios, you may need to manually refresh the cache so that the changes take effect immediately:

- User or group information in the LDAP service has been modified.
- The `Role` privileges corresponding to LDAP user groups in Doris have been modified.

Online updates to `ldap_default_roles` refresh the LDAP user cache automatically. You do not need to run `refresh ldap` only for this configuration change.

You can refresh the cache with the `refresh ldap` statement. For details, see [REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP).

## Known Limitations

- The LDAP feature of Doris supports only cleartext password verification on the channel from the client to FE, that is, when the user logs in, the password is transmitted in cleartext between the `client` and `fe`. SSL/TLS encryption between the client and Doris FE must be configured separately (see [Client Connection](#step-2-client-connection)).
- The channel from FE to the LDAP server uses cleartext transmission by default (`ldap_use_ssl = false`). To encrypt this channel, set `ldap_use_ssl = true` to enable LDAPS (see [LDAPS (Encrypted Connection)](#ldaps-encrypted-connection)).

## Frequently Asked Questions

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Login failure / missing roles / LDAPS handshake failure -->

### Q: How do I view which roles an LDAP user has in Doris?

After logging in to Doris with an LDAP user, run `show grants;` to view all roles of the current user. Among them, `ldapDefaultRole` is the default role that every LDAP user has.

`ldapDefaultRole` is a built-in temporary role that provides `select_priv` on `information_schema`. It is different from roles configured in `ldap_default_roles`.

### Q: An LDAP user has fewer roles in Doris than expected. How do I troubleshoot?

Check the following items one by one:

1. Run `show roles;` to confirm whether the expected role exists in Doris. If it does not exist, create it with `CREATE ROLE role_name;`.
2. Check whether the expected `group` is located under the organizational structure corresponding to `ldap_group_basedn`.
3. Check whether the expected `group` contains the `member` attribute.
4. Check whether the `member` attribute of the expected `group` contains the `dn` of the current user.
5. If the missing role is configured in `ldap_default_roles`, check whether the role name is spelled correctly and whether the role exists in Doris.

### Q: LDAPS connection fails. How do I troubleshoot?

Check the following items one by one:

1. Confirm that `ldap_use_ssl = true` is set in `fe/conf/ldap.conf`.
2. Confirm that `ldap_port` is set to the correct LDAPS port (typically `636`).
3. Check whether the SSL certificate of the LDAP server is trusted by the JVM. Check `fe.log` for SSL handshake errors such as `SSLHandshakeException` or `PKIX path building failed`.
4. If a self-signed CA is used, confirm that the CA certificate has been imported into the trustStore and that the trustStore path in `JAVA_OPTS` is configured correctly.
