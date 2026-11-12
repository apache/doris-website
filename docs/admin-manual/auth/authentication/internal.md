---
{
    "title": "Built-in Authentication",
    "language": "en",
    "description": "Detailed guide to the Apache Doris built-in authentication mechanism: composition of the user_identity, password policies (history, expiration, login-failure lockout, strength validation), IP matching priority, simulating a blacklist with a whitelist, and common troubleshooting."
}
---

<!-- Knowledge type: Concept + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: User and privilege management / Login authentication troubleshooting / Password policy configuration -->

Apache Doris provides a built-in user authentication mechanism. Administrators create users, set passwords, and control the connection source through SQL commands. This document describes how a Doris user identity is composed, the available password policies, the IP matching priority, and common operational scenarios and troubleshooting methods.

## Applicable Scenarios

| Scenario | Recommended Section |
| --- | --- |
| Create an account, drop an account, reset a password | [Core Concepts](#core-concepts), [Common Operational Commands](#common-operational-commands) |
| Configure enterprise-grade password policies (expiration / history / strength / lockout) | [Password Policies](#password-policies) |
| The same user name matches multiple `user_identity` values and login is rejected | [User Identity Matching Priority](#user-identity-matching-priority) |
| Block a specific IP from logging in (simulate a blacklist) | [Simulating a Blacklist with a Whitelist](#simulating-a-blacklist-with-a-whitelist) |
| Forgot the root password, or `current_user()` does not match `user()` | [FAQ](#faq) |

## Core Concepts

<!-- Knowledge type: Concept -->

### User (user_identity)

In Doris, a `user_identity` uniquely identifies a user and consists of two parts:

- `user_name`: the user name.
- `host`: the host address from which the client connects. It supports `%` for fuzzy matching.

If `host` is not specified, it defaults to `'%'`, which means the user can connect to Doris from any host.

### User Properties

User properties are attached directly to the `user_name`, not to the `user_identity`. That is, `user@'192.%'` and `user@['domain']` share the same set of user properties. The properties belong to the user, not to `user@'192.%'` or `user@['domain']`.

User properties include, but are not limited to, the maximum number of user connections, load cluster configuration, and so on.

### Built-in Users

Built-in users are users that Doris creates by default and that have certain privileges out of the box, including root and admin. Unless an initial root password is configured, their initial passwords are empty. Initialize client access as described in [Initialize Built-in Accounts](#initialize-built-in-accounts). **Default users cannot be dropped.**

| User | Login source after setting a password | Default Role |
| --- | --- | --- |
| `root@'%'` | Any node | operator |
| `admin@'%'` | Any node | admin |

### Password

The password is the credential used by a user to log in. It is set by the administrator when the user is created, and the user can also change it later.

## Initialize Built-in Accounts

:::info Supported versions

The following behavior is available from **4.2.1** in the 4.x series and in **5.0**. It applies by default to clusters newly initialized on these versions. Clusters initialized before this feature retain their previous authentication behavior after an upgrade. Adding an FE to an existing cluster does not reinitialize the accounts.

:::

With the default configuration, authentication depends on each account's **current** password:

| Account state | Direct MySQL connection from the FE's loopback address | Remote MySQL, HTTP/Web UI, Stream Load, Arrow Flight SQL/ADBC |
| --- | --- | --- |
| root has an empty password | Can log in, but must set its own nonempty password before normal SQL | Login rejected |
| admin has an empty password | Login rejected | Login rejected |
| root or admin has a nonempty password | Normal password and privilege checks | Normal password and privilege checks |

Resetting either account's password to empty applies these restrictions to subsequent logins again. Existing authenticated sessions are not revoked by a password change. Other users' empty-password behavior is unchanged. Internal JOB, MTMV, statistics and other internal execution contexts do not require an admin login password.

### Set root's password before using the cluster

If no `initial_root_password` was configured, run the MySQL client **on the FE host**, using a direct TCP loopback connection. Replace `9030` with the FE's `query_port` if needed:

```bash
mysql --protocol=TCP -h127.0.0.1 -P9030 -uroot
```

Only `127.0.0.1` and IPv6 loopback `::1` qualify; the entire `127.0.0.0/8` range does not. Connections carrying PROXY protocol are not eligible for this bootstrap login. For Docker or Kubernetes, run the client inside the FE container's network namespace; loopback on the Docker host is not the FE container's loopback.

In this session, normal SQL such as `SHOW DATABASES` returns error **1820** until root sets a nonempty password. Execute:

```sql
SET PASSWORD = PASSWORD('<new_root_password>');
SHOW DATABASES;
```

Replace the password placeholder with your own nonempty password. The password change releases the restriction on the same session, so `SHOW DATABASES` now succeeds without reconnecting. Rejected MySQL logins use **1045 / 28000**; Arrow Flight SQL/ADBC reports **UNAUTHENTICATED**. Use the configured password for Web UI, HTTP, Stream Load and Flight clients.

Subsequent MySQL connections must supply the password:

```bash
mysql --protocol=TCP -h<fe_host> -P9030 -uroot -p
```

### Enable admin only when needed

After initializing root, run the following as root if client access to admin is needed:

```sql
ALTER USER 'admin' IDENTIFIED BY '<new_admin_password>';
```

This enables admin password authentication. Leaving admin with an empty password keeps client login disabled on a protected new cluster and does not stop internal background jobs. Only root can change root's own password.

### Set an initial root password for automation

Before the **first cluster initialization**, set the existing FE configuration [`initial_root_password`](../../config/fe-config#initial_root_password) to a two-stage SHA-1 password hash. FE accepts a hash, not plaintext. For example, generate it offline without requiring an already running Doris cluster:

```bash
python3 - <<'PY'
import getpass
import hashlib
password = getpass.getpass('Initial root password: ')
if not password:
    raise SystemExit('Password must not be empty')
print('*' + hashlib.sha1(hashlib.sha1(password.encode('utf-8')).digest()).hexdigest().upper())
PY
```

Copy the output into `fe.conf` before starting the first FE:

```properties
initial_root_password = *<40_HEXADECIMAL_DIGITS>
```

Root then authenticates with that password from the first startup and does not enter the empty-password bootstrap session. This setting does not initialize admin's password. Invalid nonempty values prevent first initialization in 4.2.1 and 5.0; correct the value and restart. Already initialized clusters ignore this setting, so keeping it does not overwrite later password changes. Remove it after initialization if no longer needed.

Deployment scripts must use the configured credentials when registering FE/BE nodes or running SQL. Use the deployment tool's Secret/configuration integration to supply them; FE reads the initial hash from its configuration.

### Explicit test compatibility

For isolated tests that require the previous empty-password behavior, set the following on **every FE that accepts client connections**, in `fe.conf` or the effective `fe_custom.conf`, and restart those FEs:

```properties
allow_empty_password_for_root_admin = true
```

On a protected new cluster this permits empty-password root/admin logins from any host and supported protocol, without the password-reset restriction. It does not bypass a configured nonempty password. The default is `false`; it cannot be changed online. Removing the entry or setting it to `false` and restarting restores protection. This is a test setting; use `skip_localhost_auth_check` only for temporary local password recovery as described in [FAQ](#faq).

## Authentication Mechanism

<!-- Knowledge type: Process description -->

Doris authentication consists of the following two steps:

1. **The client sends authentication information.** The client packages the user information (user name, password, database, and so on) and sends it to the Doris server to prove its identity and request access to the database.
2. **The server verifies the identity.** After Doris receives the authentication information, it verifies it. If the user name, password, and client IP are all correct and the user has access to the selected database, authentication succeeds and Doris maps the user to a system user identity. Otherwise, authentication fails and the corresponding error message is returned to the client.

## Password Policies

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Enterprise security compliance / Password lifecycle management -->

Doris supports the following password policies to help administrators manage the password lifecycle and security.

| Policy | Purpose | Default Value |
| --- | --- | --- |
| `PASSWORD_HISTORY` | Forbid reusing the last N passwords | 0 (disabled) |
| `PASSWORD_EXPIRE` | Set the password expiration time | NEVER (does not expire) |
| `FAILED_LOGIN_ATTEMPTS` + `PASSWORD_LOCK_TIME` | Lock the account after consecutive failed logins | Disabled |
| `validate_password_policy` | Validate password strength | NONE/0 (no validation) |

### PASSWORD_HISTORY

Controls whether the current user is allowed to reuse previous passwords when resetting the password. For example, `PASSWORD_HISTORY 10` forbids using any of the last 10 passwords as the new password. If set to `PASSWORD_HISTORY DEFAULT`, the value of the global variable `password_history` is used. 0 disables this feature, and the default is 0.

Examples:

- Set the global variable: `SET GLOBAL password_history = 10`
- Set for a user: `ALTER USER user1@'ip' PASSWORD_HISTORY 10`

### PASSWORD_EXPIRE

Sets the expiration time of the current user's password. For example, `PASSWORD_EXPIRE INTERVAL 10 DAY` means the password expires in 10 days. `PASSWORD_EXPIRE NEVER` means the password does not expire. If set to `PASSWORD_EXPIRE DEFAULT`, the value of the global variable `default_password_lifetime` is used (in days). The default is NEVER (or 0), meaning the password does not expire.

Examples:

- Set the global variable: `SET GLOBAL default_password_lifetime = 1`
- Set for a user: `ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

### FAILED_LOGIN_ATTEMPTS and PASSWORD_LOCK_TIME

Locks the current user's account after n failed login attempts and sets the lockout duration. For example, `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` means the account is locked for one day after 3 failed login attempts. An administrator can manually unlock a locked account with the ALTER USER statement.

Example:

- Set for a user: `ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

### Password Strength

This feature is controlled by the global variable `validate_password_policy`. The default is NONE/0, which means password strength is not checked. If set to STRONG/2, the password must contain at least 3 of the following 4 categories: uppercase letters, lowercase letters, digits, and special characters, and its length must be at least 8.

Example:

- `SET validate_password_policy = STRONG`

### Viewing Password Policies

After the policies above are set, you can view them with the following command:

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

Note that the user and host parts must each be wrapped in single quotes. For example:

```sql
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## User Identity Matching Priority

<!-- Knowledge type: Rule description -->
<!-- Applicable scenarios: Login rejection troubleshooting / Conflicts between multiple user_identity values -->

A `user_identity` is composed of a `user_name` and a `host`, but when logging in the user only provides a `user_name`. Doris matches the corresponding `host` based on the client IP to decide which `user_identity` to use for login.

If only one `user_identity` matches the client IP, Doris uses that one. When multiple `user_identity` values match, Doris applies the following priority:

| Comparison Scenario | Priority |
| --- | --- |
| Specific IP vs domain | Specific IP takes priority over domain |
| Specific IP vs IP range | The more specific IP range wins (for example, `192.%` over `%`) |

### Example 1: IP Takes Priority Over Domain

```sql
CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
CREATE USER user1@'ip1' IDENTIFIED BY "abcde";
```

Suppose `domain1` resolves to two IPs: `ip1` and `ip2`. Because IP takes priority over domain, when user `user1` tries to log in to Doris from `ip1` with the password `'12345'`, the login is rejected (the correct password is `'abcde'`).

### Example 2: More Specific IP Range Wins

```sql
CREATE USER user1@'%' IDENTIFIED BY "12345";
CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
```

Because `'192.%'` takes priority over `'%'`, when user `user1` tries to log in to Doris from `192.168.1.1` with the password `'12345'`, the login is rejected (the correct password is `'abcde'`).

## Simulating a Blacklist with a Whitelist

<!-- Knowledge type: Operational technique -->
<!-- Applicable scenarios: Block specific IPs from logging in -->

Doris does not natively support blacklists, only whitelists. However, you can use the [User Identity Matching Priority](#user-identity-matching-priority) to simulate a blacklist.

For example, suppose a user named `user@'192.%'` has been created, allowing users from `192.*` to log in. To block logins from `192.168.10.1`, create another user `cmy@'192.168.10.1'` and set a new password. Because `192.168.10.1` has higher priority than `192.%`, users from `192.168.10.1` can no longer log in with the old password.

## Common Operational Commands

<!-- Knowledge type: Command index -->

| Operation | Command |
| --- | --- |
| Create a user | [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) |
| View user grants | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
| Modify a user | [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) |
| Change a password | [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD) |
| Drop a user | [DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER) |
| Set user properties | [SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY) |
| View user properties | [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY) |

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Login failures / Identity confusion / Forgotten passwords -->

### Q: How do I reset a forgotten password?

Use the existing local recovery setting temporarily:

1. On one FE, add `skip_localhost_auth_check = true` to `fe.conf` or the effective `fe_custom.conf`, then restart that FE.
2. On that FE host, connect directly over loopback MySQL: `mysql --protocol=TCP -h127.0.0.1 -P9030 -uroot`.
3. Run `SET PASSWORD = PASSWORD('<new_root_password>');`. Only root can reset root's password.
4. Remove the recovery entry or set it to `false`, then restart the FE again. Reconnect using `-p` and the new password.

For protected new clusters, recovery does not apply to PROXY protocol, HTTP or Flight. `allow_empty_password_for_root_admin` does not bypass an existing password and is not a forgotten-password recovery setting.

### Q: Can other users reset the root user's password?

No. **No user other than root can reset the root user's password.**

### Q: What is the difference between `current_user()` and `user()`?

You can run `SELECT current_user()` and `SELECT user()` to view `current_user` and `user` respectively:

- `current_user`: the identity under which the current user passed authentication (the `user_identity` used when the user was created).
- `user`: the actual user identity the user currently has, including the real client IP.

For example, suppose the user `user1@'192.%'` is created, and then a user `user1` from `192.168.10.1` logs in to the system. In that case, `current_user` is `user1@'192.%'` and `user` is `user1@'192.168.10.1'`.

All privileges are granted to a specific `current_user`, and the real user holds all the privileges of that `current_user`.

### Q: A user's login is rejected, but the password is confirmed to be correct. Why?

This usually means the [User Identity Matching Priority](#user-identity-matching-priority) rules took effect: the client IP matched a more specific `user_identity`, and the user should log in with the password that belongs to that `user_identity`. You can confirm the actual matched identity with the following command:

```sql
SELECT current_user();
```
