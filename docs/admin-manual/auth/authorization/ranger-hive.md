---
{
    "title": "Ranger-Hive Authorization",
    "description": "Configure Ranger-Hive authorization for Doris Hive Catalogs, including Kerberos, policies, row filtering, and masking.",
    "keywords": [
        "Apache Doris Ranger Hive",
        "Hive Catalog authorization",
        "ranger-hive",
        "ranger-hive-security.xml",
        "ranger.plugin.hive.service.name",
        "access_controller.class",
        "row filter",
        "data masking",
        "Doris Hive Catalog Ranger authorization",
        "Ranger Admin Kerberos",
        "policy.download.auth.users",
        "ranger-hive-security.xml not found",
        "Ranger Hive policy download failure",
        "Doris Current Ranger Hive"
    ]
}
---

<!-- Knowledge Type: Configuration Guide / Authorization -->
<!-- Use Case: Hive Catalog Authorization / Reusing Ranger Hive Policies -->

Apache Doris can assign a Ranger-Hive Access Controller to an individual Hive Catalog. Doris then reuses the Hive policies already managed by Apache Ranger for database, table, and column authorization in that Catalog. Ranger row-level filters, data masking, and auditing are also supported.

Use this mode when your organization already manages Hive permissions in Ranger and wants Doris queries over the same data to follow those policies.

Ranger-Hive only controls the Hive Catalogs configured with this Access Controller. It does not replace Doris cluster-level authorization and does not enforce Ranger policies for the underlying HDFS, S3, or other storage systems.

## Use cases

| Scenario | Supported | Description |
| --- | --- | --- |
| Reuse existing Ranger Hive policies for Hive data queried through Doris | Yes | Configure the Ranger-Hive Access Controller on the corresponding Hive Catalog |
| Centrally manage permissions for the entire Doris cluster through Ranger | No | Use Ranger-Doris instead |
| Authorize access to underlying HDFS or S3 storage | No | Enforce access control and credential isolation in the storage system |
| Configure Ranger authorization for a non-Hive/HMS Catalog | No | Ranger-Hive only applies to Hive/HMS Catalogs |

<!-- Knowledge Type: Architecture Decision -->
<!-- Use Case: Choosing Ranger-Doris or Ranger-Hive / Confirming Authorization Boundaries -->

## Ranger-Doris and Ranger-Hive

Ranger-Doris and Ranger-Hive serve different purposes:

| Item | Ranger-Doris | Ranger-Hive |
| --- | --- | --- |
| Primary use | Centrally manage Doris cluster permissions in Ranger | Apply existing Ranger Hive policies to a specific Hive Catalog |
| Enablement | FE setting `access_controller_type=ranger-doris` | Catalog property `access_controller.class` |
| Ranger service type | Doris; requires the Doris Ranger plugin and service definition | Hive; uses Ranger's built-in Hive service definition |
| Resource hierarchy | Doris Global, Catalog, Database, Table, Column, and other resources | Hive Database, Table, and Column resources |
| Scope | The default Access Controller for the Doris cluster | Only the external Catalog that declares the controller |
| Policy sharing | Doris policies are not converted to Hive policies | Hive policies do not read Ranger-Doris policies |

Both can be used in the same Doris cluster. For example, Ranger-Doris can be the default Access Controller while `hive_ctl` uses Ranger-Hive. Whenever a Hive Catalog enables Ranger-Hive, requests are routed as follows. The "default Access Controller" can be Doris built-in authorization or Ranger-Doris.

### Authorization boundaries

| Permission scope | Controller | Notes |
| --- | --- | --- |
| Global | Default Access Controller | Ranger-Hive has no Doris Global resource |
| Catalog | Default Access Controller | Ranger Hive has no Doris Catalog resource |
| Database | Ranger-Hive for the current Catalog | The Ranger resource is the Hive database name |
| Table / View | Ranger-Hive for the current Catalog | The Ranger resource is the Hive database and table name |
| Column | Ranger-Hive for the current Catalog | Each referenced column is checked separately |
| Row Level Filter | Ranger-Hive for the current Catalog | Doris obtains the filter expression from Ranger; policies are not applied to `root` or `admin` |
| Data Masking | Ranger-Hive for the current Catalog | Doris obtains the column masking rule from Ranger; policies are not applied to `root` or `admin` |
| Resource, Storage Vault, Compute Group | Default Access Controller | These resources are outside the Ranger-Hive model |
| HDFS, S3, and other storage | Not checked by Ranger-Hive | Doris still reads data with the storage credentials configured for the Catalog |

:::warning
If the default Access Controller grants the corresponding Global permission, the final database, table, or column check succeeds even when Ranger-Hive denies the resource. Test deny policies with a regular user that has neither `ADMIN_PRIV` nor Global `SELECT_PRIV`; do not use `root` or `admin`.
:::

## Prerequisites

- Ranger Admin is deployed and reachable from every Doris FE.
- A Hive service exists in Ranger. This guide uses `hive_prod` as its Service Name.
- You have permission to create Doris users and Catalogs. Ranger performs authorization; it does not create Doris users or authenticate their passwords.
- The Hive Catalog already has the network, authentication, and permission settings required to access Hive Metastore and the underlying storage.
- Every FE can read the Ranger configuration files. If a local policy cache is configured, the FE process user can create or write its directory.

## Configuration overview

The following procedure uses Hive service `hive_prod` in Ranger WebUI, Doris Catalog `hive_ctl`, and user `alice`:

1. Confirm or create the Hive service `hive_prod` in Ranger WebUI.
2. Deploy `ranger-hive-security.xml` and `ranger-hive-audit.xml` on every FE, create the policy cache directory, and restart the FEs.
3. Create Doris user `alice` and Hive Catalog `hive_ctl` with Ranger-Hive enabled.
4. Create an access policy for `alice` in the Ranger `hive_prod` service.
5. Log in to Doris as `alice` and verify both allowed and denied access.

If Ranger Admin uses Kerberos or HTTPS, complete the basic configuration first, then apply the corresponding security configuration later in this guide.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Basic Ranger-Hive Configuration -->

## Configure the Ranger service and FEs

### Confirm the Ranger Hive service

On the Service Manager page in Ranger WebUI, confirm or create a Hive service:

| Ranger WebUI field | Example | Description |
| --- | --- | --- |
| Service Type | `Hive` | Use Ranger's Hive service definition; the Doris Ranger plugin is not required |
| Service Name | `hive_prod` | The Ranger service instance that stores the Hive policies |

If HiveServer2 already uses `hive_prod`, Doris can read the same policies. Do not create another service only for Doris.

### Prepare the configuration files on all FEs

Place these files in the `fe/conf/` directory of every FE:

```text
fe/conf/
├── ranger-hive-security.xml
├── ranger-hive-audit.xml
└── ranger-policymgr-ssl.xml    # Only for custom HTTPS trust or mutual TLS
```

Deploy `ranger-hive-security.xml` and `ranger-hive-audit.xml` together. Keep the audit file and explicitly disable auditing even if it is not needed, so Ranger 2.7 does not enter its legacy audit-configuration fallback. `ranger-policymgr-ssl.xml` is only needed when Ranger Admin uses HTTPS with a custom truststore or client certificate.

#### Configure ranger-hive-security.xml

Save the following templates under `fe/conf/` on every FE and replace the service name, address, and paths.

Example `ranger-hive-security.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <!-- The Hive Service Name in Ranger WebUI -->
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <!-- Set an absolute ranger-policymgr-ssl.xml path for HTTPS; otherwise leave empty -->
    <property>
        <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
        <value></value>
    </property>
</configuration>
```

The properties in `ranger-hive-security.xml` are:

| Property | Required | Default | Description |
| --- | --- | --- | --- |
| `ranger.plugin.hive.service.name` | Yes | None | Its `<value>` must exactly match the Hive Service Name in Ranger WebUI, such as `hive_prod` |
| `ranger.plugin.hive.policy.source.impl` | No | Ranger Admin REST client | Implementation used to retrieve policies |
| `ranger.plugin.hive.policy.rest.url` | Yes | None | Ranger Admin root URL without a policy API path |
| `ranger.plugin.hive.policy.cache.dir` | Required for the production setup in this guide | No local cache | The template sets an example path; create the directory in advance and grant the FE process user write access |
| `ranger.plugin.hive.policy.pollIntervalMs` | No | `30000` milliseconds | Policy polling interval |
| `ranger.plugin.hive.policy.rest.client.connection.timeoutMs` | No | `120000` milliseconds | Connection timeout to Ranger Admin; the template overrides it to `60000` milliseconds |
| `ranger.plugin.hive.policy.rest.client.read.timeoutMs` | No | `30000` milliseconds | Ranger Admin response read timeout; the template overrides it to `60000` milliseconds |
| `ranger.plugin.hive.policy.rest.ssl.config.file` | Required for a custom HTTPS trust configuration | Empty | Absolute path of `ranger-policymgr-ssl.xml` |

#### Create the policy cache directory

Use separate `policy.cache.dir` paths for Ranger-Doris and Ranger-Hive, for example `/var/lib/doris/ranger/doris_prod/policy-cache` and `/var/lib/doris/ranger/hive_prod/policy-cache`. Catalogs that reuse the same Ranger Hive service read the same Hive plugin configuration and cache.

The example uses `/var/lib/doris/ranger/hive_prod/policy-cache`. Run the following on every FE as `root`, or add `sudo`:

```shell
mkdir -p /var/lib/doris/ranger/hive_prod/policy-cache
chown -R doris:doris /var/lib/doris/ranger/hive_prod
chmod 700 /var/lib/doris/ranger/hive_prod/policy-cache
```

The commands assume that the FE runs as user and group `doris:doris`. Replace them with the actual process identity. Verify write access with `sudo -u doris test -w /var/lib/doris/ranger/hive_prod/policy-cache`; if `sudo` is unavailable, run an equivalent check as the FE process user.

#### Configure ranger-hive-audit.xml

This guide disables Ranger audit by default. Even when audit is disabled, save this `fe/conf/ranger-hive-audit.xml` on every FE:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.audit.is.enabled</name>
        <value>false</value>
    </property>
</configuration>
```

`xasecure.audit.is.enabled=false` disables Ranger authorization audit output. For production auditing, start from the Hive audit template for your Ranger version, configure a centralized backend such as Solr, HDFS, or Kafka, and set the property to `true`. Log4j is not recommended as a production audit destination because audit records share the FE log rotation policy, making their retention period and total size difficult to control independently.

#### Restart the FEs

After configuring the XML files and cache directory, restart every FE before creating the Catalog. Ranger configuration is loaded when the Access Controller is initialized, and all FEs must use the same files and paths.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Creating a Hive Catalog with Ranger-Hive Enabled -->

## Create the user and Hive Catalog

### Create the Doris user

Create a Doris login user with the same name as the Ranger user:

```sql
CREATE USER 'alice' IDENTIFIED BY 'R8!mQ2#vL7@k';
```

### Create a Hive Catalog with Ranger-Hive

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

Ranger-Hive does not manage Doris Catalog-level permissions. With the default `skip_catalog_priv_check=false`, the default Access Controller must also let the user discover and use the newly created `hive_ctl`. When the default controller is Doris built-in authorization, run:

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

This grant only passes the Doris Catalog-level check. Database, table, and column access inside `hive_ctl` is still checked by its Ranger-Hive Access Controller.

In the Current version, you can instead set `skip_catalog_priv_check=true` in `fe.conf` to skip `SHOW` and `SELECT` Catalog-level checks for external Catalogs with a custom Access Controller. It does not skip Ranger-Hive database, table, or column checks, and does not skip Catalog-level checks for operations such as `CREATE`, `LOAD`, or `ALTER`.

The following names are easy to confuse:

| Location | Example | Meaning |
| --- | --- | --- |
| Catalog `access_controller.class` | `org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory` | Full class name of the Ranger-Hive Access Controller factory. Current and 4.x also accept the short identifier `ranger-hive`. Do not enter a Ranger Service Name |
| Catalog `access_controller.properties.ranger.service.name` | `hive` | Ranger plugin configuration prefix and service type. Doris removes `access_controller.properties.` and passes `ranger.service.name=hive` to Ranger |
| `ranger.plugin.hive.service.name` in `fe/conf/ranger-hive-security.xml` | `hive_prod` | Its `<value>` is the Hive Service Name that stores policies in Ranger WebUI |

:::caution
Do not set the Catalog property to `'access_controller.properties.ranger.service.name'='hive_prod'`. In this standard setup it must be `hive`. Put the actual Ranger WebUI Service Name in `ranger.plugin.hive.service.name` inside `ranger-hive-security.xml`, for example `<value>hive_prod</value>`.
:::

Configure Hive Metastore, HDFS, or object storage connectivity using the [Hive Catalog](../../../lakehouse/catalogs/hive-catalog) documentation. If Ranger Admin or HMS/HDFS uses Kerberos, see the Kerberos section below; those connections use different principals, keytabs, and configuration locations.

When the Catalog is created, the FE instantiates an Access Controller to validate its configuration. Other FEs initialize their active controller on demand when they first authorize a request for the Catalog.

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Creating and Verifying a Ranger Hive Access Policy -->

## Configure and verify Ranger policies

### Create a Ranger access policy

Open the Hive service `hive_prod` in Ranger WebUI and create an Access Policy:

| Field | Example |
| --- | --- |
| Policy Name | `alice_read_sales_orders` |
| Database | `sales` |
| Table | `orders` |
| Column | `*` |
| Select User | `alice` |
| Permissions | `select` |

Save the policy and wait for one polling interval, which is approximately 30 seconds in this example.

### Verify authorization

Log in to Doris as `alice` and run:

```sql
SHOW DATABASES FROM hive_ctl;
SELECT * FROM hive_ctl.sales.orders LIMIT 10;
```

Expected behavior:

- `alice` can see `sales` and query `orders`.
- Querying an unauthorized table such as `hive_ctl.sales.customers` returns a permission error.
- If centralized Ranger audit is enabled, its backend contains both allowed and denied requests.

<!-- Knowledge Type: Permission Mapping / Behavior Reference -->
<!-- Use Case: Ranger Policy Design / Authorization Troubleshooting -->

## Authorization behavior

### Permission mapping

The following table shows the base mapping in `RangerHiveAccessController` for Current and 4.x. The mappings are currently the same; 4.x additionally removes the Cluster Namespace prefix from user, role, and database names. A mapping does not imply that every SQL statement performs that specific check. Statement support also depends on the authorization path implemented in the corresponding Doris version.

| Doris permission predicate | Ranger access type |
| --- | --- |
| `SHOW` | `ANY_ACCESS`, meaning any allowed access on the resource |
| `SELECT` | `select` |
| `LOAD` | `update` |
| `ALTER` | `alter` |
| `CREATE` | `create` |
| `DROP` | `drop` |
| `ADMIN` / `ALL` | `all` |
| Other unmapped predicates | `none` |

Ranger-Hive resources only contain `database`, `table`, and `column`; they do not contain a Doris Catalog name. If two Doris Catalogs both use `hive_prod` and both contain `sales.orders`, the same Ranger policy matches that resource in both Catalogs.

### User and role matching

- After Doris authenticates a user, it sends the current Doris username in the Ranger request. The Ranger username must exactly match the Doris username.
- For a Catalog with Ranger-Hive, Ranger-Hive alone decides database, table, and column permissions; Doris object grants at those scopes are not combined with the decision. A Doris Global permission can still make the check succeed early, and Catalog permissions remain with the default Access Controller.
- Doris sends the names of the roles currently held by the Doris user as request context. Ranger policy `Roles` can match these names. This is only a Ranger policy condition; it does not cause Doris internal object grants to participate in the Ranger-Hive decision.
- Doris and Ranger do not synchronize roles. Only when policies are written against roles must the Doris request role names match the role names referenced by Ranger. User- or group-based Ranger policies are usually easier to maintain.
- Ranger UserSync does not create Doris login users. Even if Ranger contains `alice`, create `alice` in Doris or authenticate the user through LDAP or another configured provider.
- The Doris user host portion is used for login matching and audit client IP, not as part of the Ranger username. For example, Doris user `'alice'@'10.%'` maps to Ranger user `alice`.

<!-- Knowledge Type: Configuration Examples -->
<!-- Use Case: Row-Level Access Control / Sensitive Data Masking -->

## Row filtering and data masking

### Row Level Filter

Create a Row Level Filter Policy in `hive_prod`:

| Field | Example |
| --- | --- |
| Database | `sales` |
| Table | `orders` |
| User | `alice` |
| Row Level Filter | `region = 'CN'` |

The Access Policy must also grant `alice` `select` on `sales.orders`. A row filter only adds a filter expression; it does not replace base access authorization.

Run:

```sql
SELECT order_id, region FROM hive_ctl.sales.orders;
```

The result only contains rows where `region = 'CN'`.

### Data Masking

Create a Masking Policy in `hive_prod`:

| Field | Example |
| --- | --- |
| Database | `sales` |
| Table | `customers` |
| Column | `phone` |
| User | `alice` |
| Masking Option | A Ranger built-in type or Custom |
| Custom Expression | `concat(substr({col}, 1, 3), '****')` |

Also grant `alice` `select` on the column. When `phone` is queried, Doris replaces `{col}` in the Ranger expression with the actual column name and applies the masking expression.

:::caution
The Doris SQL engine parses row-filter and masking expressions. An expression written for HiveServer2 must be rewritten if it uses Hive UDFs or syntax that Doris does not support.
:::

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Kerberos-Enabled Ranger Admin / SPNEGO Policy Download -->

## When Ranger Admin uses Kerberos

This section configures the Ranger-Hive client in the FE to authenticate to Ranger Admin over HTTP/SPNEGO. Ranger Admin Kerberos is not the same service authentication as Hive/HMS Kerberos. They may use the same realm, but each connection has its own service principal, client principal, keytab, and configuration location.

| Connection | Server identity example | Doris client identity example | Purpose and configuration |
| --- | --- | --- | --- |
| FE to Ranger Admin | `HTTP/ranger-admin.example.com@EXAMPLE.COM` | `doris/ranger-client.example.com@EXAMPLE.COM` | Download policies; server settings are in Ranger Admin and client settings are in `fe/conf/ranger-hive-security.xml` |
| FE to HMS | `hive/hms.example.com@EXAMPLE.COM` | `doris/hive-client.example.com@EXAMPLE.COM` | Read metadata; configured with Hive Catalog `hive.metastore.*` properties |
| FE/BE to HDFS | NameNode/DataNode service principals | `doris/hive-client.example.com@EXAMPLE.COM` | Read data; configured with Hive Catalog `hdfs.authentication.*` properties |

:::caution Version requirement
Doris 4.x requires **4.0.2 or later**. Doris 4.0.0 and 4.0.1 include Ranger 2.4, which does not contain the Ranger plugin UGI keytab login used here. Doris 4.0.2 upgrades Ranger to 2.7. The Ranger version in Current includes this capability.
:::

### 1. Confirm the Ranger Admin and FE Kerberos identities

First check the Ranger Admin server configuration. Apache Ranger commonly loads `core-site.xml` and `ranger-admin-site.xml` from the deployed web application's `WEB-INF/classes/conf/` directory. Distribution-specific paths can differ, so use the Ranger Admin startup arguments or installation layout as the authority.

| File | Property | Meaning |
| --- | --- | --- |
| `core-site.xml` | `hadoop.security.authentication` | Hadoop authentication used by the Ranger Admin SPNEGO filter; use `kerberos` for secure plugin download |
| `ranger-admin-site.xml` | `ranger.service.host` | Ranger Admin service hostname and the value substituted for `_HOST` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.principal` | HTTP/SPNEGO service principal, for example `HTTP/_HOST@EXAMPLE.COM` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.keytab` | Server-side SPNEGO keytab path read by Ranger Admin |

`ranger.authentication.method` controls Ranger WebUI login and does not by itself prove that the secure plugin-download endpoint uses SPNEGO. Check the effective `ranger-admin-site.xml` and Ranger Admin startup logs.

On the Ranger Admin server, run `klist -kt <actual ranger.spnego.kerberos.keytab path>` and confirm that the keytab contains the HTTP principal after `_HOST` expansion, such as `HTTP/ranger-admin.example.com@EXAMPLE.COM`. The hostname in `ranger.plugin.hive.policy.rest.url` must match this principal.

Ranger does not create the FE client principal or keytab. A Kerberos administrator must create an identity such as `doris/ranger-client.example.com@EXAMPLE.COM`, export it to `/etc/security/keytabs/doris-ranger.keytab`, deploy it to every FE, and make it readable by the FE process user. Do not give the Ranger Admin HTTP principal or server SPNEGO keytab to the FE.

This section uses:

| Item | Example |
| --- | --- |
| Ranger Hive Service Name | `hive_prod` |
| Ranger Admin URL | `http://ranger-admin.example.com:6080` |
| Kerberos realm | `EXAMPLE.COM` |
| Ranger Admin HTTP service principal | `HTTP/ranger-admin.example.com@EXAMPLE.COM` |
| FE policy-download principal | `doris/ranger-client.example.com@EXAMPLE.COM` |
| FE client keytab | `/etc/security/keytabs/doris-ranger.keytab` |

The HTTP principal is Ranger Admin's server identity. Do not put it in FE `ugi.keytab.principal`; that property must contain the FE client identity.

### 2. Initialize Hadoop UGI in Kerberos mode

Adding only the `ugi.*` properties to `ranger-hive-security.xml` is insufficient. Ranger calls `UserGroupInformation.loginUserFromKeytab()`, and keytab login produces Kerberos credentials only when global Hadoop authentication is set to `kerberos`.

Create `core-site.xml` in `fe/conf/` on every FE:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>hadoop.security.authentication</name>
        <value>kerberos</value>
    </property>
</configuration>
```

`start_fe.sh` adds the FE `conf` directory to the Java classpath, so `fe/conf/core-site.xml` is recommended. To use a shared Hadoop configuration directory instead, set the following in `fe.conf`:

```text
HADOOP_CONF_DIR=/etc/hadoop/conf
```

In that case, `/etc/hadoop/conf/core-site.xml` must exist and be readable by the FE process user before all FEs are restarted.

### 3. Configure krb5.conf and the Ranger Admin HTTP SPN

Configure the realm, KDC, and `domain_realm` mapping for the Ranger Admin URL hostname in `/etc/krb5.conf` on every FE:

```ini
[libdefaults]
    default_realm = EXAMPLE.COM
    dns_lookup_realm = false
    dns_lookup_kdc = false
    rdns = false

[realms]
    EXAMPLE.COM = {
        kdc = kdc.example.com:88
        admin_server = kdc.example.com
    }

[domain_realm]
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

The hostname in `ranger.plugin.hive.policy.rest.url` must match the SPN in the Ranger Admin HTTP/SPNEGO keytab. For URL host `ranger-admin.example.com`, the server keytab should contain:

```text
HTTP/ranger-admin.example.com@EXAMPLE.COM
```

Do not mix a short hostname, FQDN, CNAME, VIP, or IP. If the URL uses a short hostname such as `http://ranger-admin:6080`, add an exact mapping in addition to the domain mapping:

```ini
[domain_realm]
    ranger-admin = EXAMPLE.COM
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

Install Kerberos client tools that provide `kinit`, `klist`, `kdestroy`, and `kvno`. Run the following as the FE process user. It uses a separate ticket cache and does not clear existing credentials. Replace the principal, keytab, and hostname first:

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_test_$$
kdestroy 2>/dev/null || true
klist -kt /etc/security/keytabs/doris-ranger.keytab
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM
kvno HTTP/ranger-admin.example.com@EXAMPLE.COM
klist
kdestroy
```

`klist -kt` should list the FE client principal. A successful `kinit` is normally silent. A successful `kvno` followed by `klist` showing both `krbtgt/...` and the Ranger Admin HTTP ticket confirms the client keytab, realm mapping, and HTTP SPN. The final `kdestroy` removes only the temporary cache used by this check.

### 4. Configure the complete ranger-hive-security.xml

Configure policy access and UGI login together in `fe/conf/ranger-hive-security.xml` on every FE:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <!-- The hostname must match the Ranger Admin HTTP SPN -->
    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.initialize</name>
        <value>true</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.login.type</name>
        <value>keytab</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.principal</name>
        <value>doris/ranger-client.example.com@EXAMPLE.COM</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.file</name>
        <value>/etc/security/keytabs/doris-ranger.keytab</value>
    </property>
</configuration>
```

Kerberos-specific properties:

| Property | Description |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | Perform a Hadoop UGI login when the Ranger-Hive plugin initializes |
| `ranger.plugin.hive.ugi.login.type` | Set to `keytab` for keytab login |
| `ranger.plugin.hive.ugi.keytab.principal` | Client principal used by the FE to download Ranger policies; it must exist in the keytab |
| `ranger.plugin.hive.ugi.keytab.file` | Absolute client keytab path, identical and readable by the FE process user on every FE |

`ranger.plugin.hive.policy.rest.secure=true` is not what selects the Kerberos download path. The Ranger client checks whether Hadoop UGI is in secure mode and whether the login user has Kerberos credentials. Use `secureMode` in the FE log to confirm the selected mode.

### 5. Allow the FE service identity to download hive_prod policies

This step authorizes the **service account used by the FE to download policies**. It is not the Doris query user `alice`, and it does not grant this account access to Hive data.

After Ranger Admin enables Kerberos, a policy download passes two checks:

1. Ranger Admin authenticates the FE keytab principal over SPNEGO.
2. Ranger Admin verifies that the authenticated login ID may download data for `hive_prod`.

The identity conversion in this example is:

| Stage | Example | Purpose |
| --- | --- | --- |
| Principal in the FE keytab | `doris/ranger-client.example.com@EXAMPLE.COM` | SPNEGO authentication |
| Ranger Admin login ID | `doris` | Account after principal conversion by `auth_to_local` |
| Recommended Hive service config | `policy.download.auth.users=doris` | Allow this FE account to download policy and role data |

For a normal FE service account, use the Hive service's `policy.download.auth.users` for least-privilege download access. Edit the Hive service `hive_prod` in Ranger WebUI and confirm that its configs contain:

```text
policy.download.auth.users=doris
```

Here `doris` is the login ID in the authenticated Ranger Admin session, not a Doris query user. The Ranger Admin SPNEGO filter applies `hadoop.security.auth_to_local` from its `core-site.xml`; only use `doris` when that rule maps the example principal to `doris`. Confirm the actual login ID in Ranger Admin authentication logs instead of assuming a full principal or a fixed short name.

Apache Ranger 2.7 splits `policy.download.auth.users` on commas and compares each entry to the login ID using a case-insensitive exact match. Use a comma-separated list without spaces for multiple accounts, such as `doris,hive`. Ranger administrators and users listed in `policy.grantrevoke.auth.users` can also pass download authorization, but an FE only needs download access and should not receive the broader grant/revoke privilege for this purpose.

### 6. Restart the FEs and verify secure policy download

Restart all FEs and first check the FE log for a message like:

```text
secureMode=true, user=doris/ranger-client.example.com@EXAMPLE.COM (auth:KERBEROS)
```

Then call the secure policy endpoint using the FE process user and the same keytab. Before running it, confirm that `curl --version` reports GSS-API, Kerberos, or SPNEGO support:

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_download_test_$$
kdestroy 2>/dev/null || true
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM

curl --negotiate -u : -sS -i \
    'http://ranger-admin.example.com:6080/service/plugins/secure/policies/download/hive_prod?lastKnownVersion=-1&lastActivationTime=0'

kdestroy
```

HTTP 200 with a complete policy JSON response is the end-to-end success criterion. A successful `kinit`, `kvno`, or `secureMode=true` validates only part of the path and cannot replace the download result.

After policies load, the example cache directory should contain:

```text
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod.json
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod_roles.json
```

### 7. When Ranger Admin, HMS, and HDFS all use Kerberos

If Hive Metastore and HDFS also use Kerberos, use the following Catalog definition **instead of** the `CREATE CATALOG hive_ctl` statement in the quick start. Do not create the same Catalog twice. Here `doris-ranger.keytab` is only for FE policy download, while `doris-hive.keytab` is for HMS and HDFS access:

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'hive.metastore.authentication.type' = 'kerberos',
    'hive.metastore.client.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hive.metastore.client.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'hive.metastore.service.principal' = 'hive/hms.example.com@EXAMPLE.COM',
    'hdfs.authentication.type' = 'kerberos',
    'hdfs.authentication.kerberos.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hdfs.authentication.kerberos.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'fs.defaultFS' = 'hdfs://nameservice1',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

The two client identities have separate purposes:

- `doris-ranger.keytab` lets the FE download policies from Ranger Admin over SPNEGO and only needs to be deployed to the FEs.
- `doris-hive.keytab` accesses HMS and HDFS. Deploy the HMS client keytab to every FE. Deploy the HDFS client keytab, at the same readable absolute path, to every FE and BE that accesses HDFS. HMS and HDFS can use different client identities by setting the corresponding properties separately.

Obtain the HMS server principal from the Hive Metastore Kerberos configuration. The example `hive/hms.example.com@EXAMPLE.COM` is not the Ranger Admin HTTP principal. The connections can use the same realm, but their principals and keytabs are not interchangeable.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Ranger Admin over HTTPS / Custom CA / Mutual TLS -->

## When Ranger Admin uses HTTPS

In `fe/conf/ranger-hive-security.xml` on every FE, change the Ranger Admin URL to HTTPS and point `ranger.plugin.hive.policy.rest.ssl.config.file` to the SSL configuration file:

```xml
<property>
    <name>ranger.plugin.hive.policy.rest.url</name>
    <value>https://ranger-admin.example.com:6182</value>
</property>
<property>
    <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
    <value>/opt/apache-doris/fe/conf/ranger-policymgr-ssl.xml</value>
</property>
```

The following example uses Ranger Admin CA certificate `/tmp/ranger-admin-ca.pem` and FE process identity `doris:doris`. Prepare the truststore and JCEKS credential provider on every FE. The commands require JDK `keytool` and Hadoop `hadoop credential`:

```shell
sudo install -d -o doris -g doris -m 700 /etc/security/ranger
sudo -u doris keytool -importcert -noprompt \
    -alias ranger-admin-ca \
    -file /tmp/ranger-admin-ca.pem \
    -storetype JKS \
    -keystore /etc/security/ranger/ranger-truststore.jks
sudo -u doris hadoop credential create sslTrustStore \
    -provider jceks://file/etc/security/ranger/ranger-ssl.jceks
sudo chmod 600 /etc/security/ranger/ranger-truststore.jks \
    /etc/security/ranger/ranger-ssl.jceks
```

`keytool` prompts for a truststore password, and `hadoop credential` prompts for the value of `sslTrustStore`. Enter the same password in both places. Replace the temporary CA path with the certificate-management path for your deployment and verify that the FE process user can read both files.

Example `ranger-policymgr-ssl.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.policymgr.clientssl.truststore</name>
        <value>/etc/security/ranger/ranger-truststore.jks</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.type</name>
        <value>JKS</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.credential.file</name>
        <value>jceks://file/etc/security/ranger/ranger-ssl.jceks</value>
    </property>
</configuration>
```

The Ranger client reads the truststore password from the fixed `sslTrustStore` alias. Mutual TLS additionally requires `xasecure.policymgr.clientssl.keystore` and an `sslKeyStore` alias in JCEKS. Do not put plaintext truststore or keystore passwords in XML.

<!-- Knowledge Type: Architecture Constraints / Best Practices -->
<!-- Use Case: Multiple Hive Catalogs / Ranger-Doris and Ranger-Hive Coexistence -->

## Multiple Catalogs and runtime constraints

### Reuse one Hive policy service across Catalogs

Multiple Catalogs that correspond to `hive_prod` can use the same controller configuration:

```sql
CREATE CATALOG hive_prod_a PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-a.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);

CREATE CATALOG hive_prod_b PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-b.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

Ranger Hive resources have no Catalog dimension, so identical database, table, and column names match the same policy. Reuse a service only when the two Metastores intentionally share resource names and authorization boundaries.

### Different Ranger Hive service instances

The standard `hive` prefix corresponds to one `ranger-hive-security.xml`, so all Ranger-Hive Catalogs in the same FE read the same `ranger.plugin.hive.service.name`. The current Catalog interface does not let each Catalog select a different Ranger Hive Service Name. Do not put a WebUI service name such as `hive_prod_a` in the Catalog `ranger.service.name`; Ranger would then look for `ranger-hive_prod_a-security.xml` and `ranger.plugin.hive_prod_a.*`, which is outside the standard Hive configuration described here. To isolate independent Ranger Hive services, use separate Doris clusters or make the Catalogs share one Ranger Hive policy service.

### Runtime constraints and best practices

- Use Ranger-Hive only for Hive/HMS Catalogs; it is not a generic Ranger controller for every external Catalog.
- Ranger-Hive and Ranger-Doris policies do not synchronize. Keep their configuration files and policy cache directories separate.
- Ranger audit providers are shared globally within an FE process. The first Ranger plugin initialized determines the audit switch and destination. When Ranger-Doris and Ranger-Hive are enabled together, keep both audit XML files aligned to the same switch and centralized destination so the result does not depend on initialization order.
- Hadoop UGI login state is global within an FE JVM. When Ranger-Doris and Ranger-Hive, or multiple Kerberos-enabled Ranger Catalogs, coexist, use the same Ranger client principal and keytab. A later login with another identity can replace the process login and destabilize policy download.
- Ranger-Hive does not check Ranger HDFS, S3, or object-storage policies. Storage access still uses the credentials configured for the Doris Catalog.
- Ranger Hive resources do not include a Doris Catalog dimension. Evaluate conflicts for same-named databases and tables across Metastores.
- Doris and Ranger do not synchronize users or roles. Define a consistent naming convention and test both allowed and denied requests with regular accounts.
- If the first policy download fails, the plugin can use its local cache. Monitor cache freshness and Ranger audit so stale policy does not remain unnoticed.
- Every FE that initializes the Access Controller downloads and caches policies independently. Keep configuration files, keytabs, truststores, and directory permissions consistent on every FE.
- Policy changes are not instantaneous. Maximum delay is normally close to `policy.pollIntervalMs`, plus Ranger Admin and network latency.

<!-- Knowledge Type: FAQ / Troubleshooting -->
<!-- Use Case: Configuration Loading Failure / Policy Download Failure / Authorization Failure -->

## Troubleshooting

Use the symptom table to identify the first check, then follow the corresponding section for the cause and complete procedure:

| Symptom | First check |
| --- | --- |
| Catalog creation cannot find the Access Controller | Verify that `access_controller.class` is the full factory class or `ranger-hive` |
| The log cannot find `ranger-hive-security.xml` | Verify that the Catalog prefix is fixed to `hive` and the file exists under `fe/conf/` on every FE |
| The security XML is ineffective when audit is disabled | Deploy `ranger-hive-audit.xml` and disable audit explicitly |
| Ranger Admin is reachable, but no policy is loaded | Check Service Name, REST URL, network access, cache directory, and policy status |
| Policy download fails after Kerberos is enabled | Check UGI secure mode, HTTP SPN, download authorization, HTTP status, and policy cache |
| Ranger allows the user, but the Catalog is not visible | Check Catalog-level permission in the default Access Controller |
| A Ranger deny policy does not take effect | Check for Global permissions and avoid testing as `root` or `admin` |
| A policy works in HiveServer2 but not in Doris | Check Service Name, user and role names, and expression compatibility |
| A user can read HDFS or S3 directly | Ranger-Hive does not enforce underlying storage access control |

### Catalog creation reports that the Access Controller cannot be found

Use the current factory class name:

```sql
'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory'
```

Current and 4.x also support the short identifier:

```sql
'access_controller.class' = 'ranger-hive'
```

Do not use `hive`, `hive_prod`, or the old class name `org.apache.doris.catalog.authorizer.RangerHiveAccessControllerFactory`. Confirm that every FE runs the same Doris version and search the FE log for `Access Controller Plugin Factory`.

### The log says ranger-hive-security.xml cannot be found

Two settings are commonly confused:

- Catalog `'access_controller.properties.ranger.service.name' = 'hive'` selects the Ranger Hive plugin and must remain `hive`. Doris uses it to find `ranger-hive-security.xml` and read `ranger.plugin.hive.*` settings.
- `ranger.plugin.hive.service.name` inside `ranger-hive-security.xml` is the actual Hive Service Name in Ranger WebUI, such as `hive_prod`.

If `hive_prod` is incorrectly entered in the Catalog, Ranger looks for `ranger-hive_prod-security.xml`. Verify that `ranger-hive-security.xml` exists under `fe/conf/` on every FE and restart all FEs after correcting it.

### Why ranger-hive-audit.xml is required when audit is disabled

When Ranger 2.7 cannot find `ranger-hive-audit.xml`, it enters a legacy fallback that searches for `hive-site.xml`, `hbase-site.xml`, or `hdfs-site.xml`, then attempts to load `xasecure-audit.xml` from the same directory. If that file does not exist, the later `ranger-hive-security.xml` may also fail to take effect. Always deploy `ranger-hive-security.xml` and `ranger-hive-audit.xml` together; set `xasecure.audit.is.enabled=false` when audit is not needed. `core-site.xml` is not in this legacy audit-file search list and is not the direct trigger.

### Ranger Admin is reachable but no policy is downloaded

Check in order:

1. `ranger.plugin.hive.service.name` exactly matches the WebUI Service Name `hive_prod`.
2. `ranger.plugin.hive.policy.rest.url` is the Ranger Admin root URL.
3. FE network, DNS, and HTTPS truststore access to Ranger Admin work.
4. The cache directory exists and is writable by the FE process user.
5. The Ranger service is enabled and its policies are saved.

If Ranger Admin uses Kerberos, continue with the next troubleshooting item.

### Policy download fails after Ranger Admin enables Kerberos

Check the download path in order:

1. **Confirm Kerberos mode.** The FE log should contain `secureMode=true` and `(auth:KERBEROS)`. If it shows `secureMode=false` or `(auth:SIMPLE)`, verify `hadoop.security.authentication=kerberos` in `core-site.xml`, place the file in `fe/conf/` or a directory on the classpath through `HADOOP_CONF_DIR`, and restart every FE. Do not rely only on the default `hadoop_config_dir` under `plugins/hadoop_conf/`; that directory is primarily for Catalog/Hadoop connectivity and is not guaranteed to be visible when the Ranger plugin initializes global UGI. For 4.x, use 4.0.2 or later and make sure `ranger.plugin.hive.forceNonKerberos=true` was not set accidentally.
2. **Confirm the HTTP service ticket.** As the FE process user, run the `kinit` and `kvno HTTP/ranger-admin.example.com@EXAMPLE.COM` checks from the main Kerberos procedure. For `Server not found in Kerberos database`, `No service creds`, or a request for the wrong `krbtgt/<REALM>`, compare the URL hostname, Ranger Admin HTTP SPN, DNS, and `/etc/krb5.conf` mappings. The URL and SPN must use the same exact hostname.
3. **Confirm download authorization.** After SPNEGO authentication, find the actual login ID in Ranger Admin logs. For the regular FE account used here, put that ID in the `hive_prod` service's `policy.download.auth.users`. Apache Ranger 2.7 also allows Ranger administrators and accounts in `policy.grantrevoke.auth.users`, but do not grant broader grant/revoke access only for FE downloads. If WebUI does not show `policy.download.auth.users`, inspect or update it through the distribution's Ranger plugin installation configuration or Ranger Service REST API. Preserve every existing service config when updating through REST.
4. **Inspect the secure endpoint status.** Repeat the `curl --negotiate` command from Kerberos step 6 and keep the response body. In stock Apache Ranger 2.7, HTTP 401 means SPNEGO authentication failed; 403 means the login ID authenticated but is not an administrator and is absent from both authorized-user lists; 404 usually means the XML Service Name does not match Ranger WebUI; only 200 with complete policy JSON confirms success. Vendor distributions can change status handling, so also inspect Ranger Admin logs. A successful `kinit` only proves that a client TGT was obtained.
5. **Inspect the policy cache.** A successful download creates both `hive_hive_prod.json` and `hive_hive_prod_roles.json`. If only a small roles file exists, the main policy still failed to load. Check the `getServicePoliciesIfUpdated` response and FE log messages such as `policy engine initialization failed` or cache write errors.

### Ranger allows the user, but SHOW CATALOGS does not show the Catalog

The default Access Controller owns the Catalog-level check. With Doris built-in authorization, grant a permission on the Catalog:

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

Current can also evaluate `skip_catalog_priv_check=true`, which only affects `SHOW` and `SELECT` Catalog-level checks for external Catalogs with custom Access Controllers.

### A Ranger deny policy does not take effect

Check whether the user has a Doris Global permission. A matching Global permission from the default Access Controller can make the final check succeed even if Ranger-Hive has not allowed the database, table, or column. Test with a regular user that has neither `ADMIN_PRIV` nor Global `SELECT_PRIV`.

### A policy works in HiveServer2 but not in Doris

Confirm that Doris and HiveServer2 read the same Ranger Hive Service Name, and that policy expressions use SQL syntax supported by Doris. Also confirm that the username and role names in the Doris request exactly match those referenced by the Ranger policy.

### Does Ranger-Hive prevent direct HDFS or S3 access?

No. Ranger-Hive only authorizes Hive database, table, and column requests at the Doris SQL layer. Access to HDFS, S3, and other storage uses the Catalog's storage authentication settings and requires separate storage-side access control and credential isolation.

<!-- Knowledge Type: Production Checklist -->
<!-- Use Case: Production Deployment Acceptance -->

## Production checklist

- Ranger WebUI uses Service Type Hive, and its Service Name exactly matches the XML value.
- Every FE has parseable `ranger-hive-security.xml` and `ranger-hive-audit.xml`; audit is explicitly disabled in the audit XML when not needed.
- Ranger-Doris and Ranger-Hive use separate policy cache directories writable by the FE process user.
- Catalog `access_controller.class` uses the full Ranger-Hive factory class or supported `ranger-hive` identifier, and the configuration-prefix value is `hive`.
- The regular Doris user matches the Ranger username. If Doris roles participate in Ranger policies, the referenced role names match.
- Allowed access, denied access, column permissions, row filtering, and data masking have each been tested.
- Catalog-level permission comes from the default Access Controller, and test users have no Global permission that bypasses the intended Ranger-Hive checks.
- With Ranger Admin Kerberos or HTTPS, all FEs use consistent keytabs, truststores, `krb5.conf`, and absolute paths.
- Same-named databases and tables across Catalogs have been reviewed to prevent unintended policy expansion.
- When audit is enabled, the configured destination contains Doris allow and deny records; Ranger WebUI audit viewing also requires the corresponding centralized backend, such as Solr.
