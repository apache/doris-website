---
{
    "title": "Kerberos Best Practices",
    "language": "en",
    "description": "When users use Doris for federated analytical queries across multiple data sources,"
}
---

When users use Doris for federated analytical queries across multiple data sources, different clusters may use different Kerberos authentication credentials.

Take a large fund company as an example. Its internal data platform is divided into multiple functional clusters, maintained by different technical or business teams, each configured with independent Kerberos Realms for identity authentication and access control:

- Production cluster is used for daily net asset value calculations and risk assessments, with strictly isolated data that only allows authorized service access (Realm: PROD.FUND.COM).
- Analysis cluster is used for strategy research and model backtesting, where Doris implements temporary queries to this cluster through TVF (Realm: ANALYSIS.FUND.COM).
- Data lake cluster integrates Iceberg Catalog for archiving and analyzing large volumes of historical market data, logs, and other data (Realm: LAKE.FUND.COM).

Since these clusters have not established cross-domain trust relationships and authentication information cannot be shared, unified access to these heterogeneous data sources requires simultaneous support for authentication and context management of multiple Kerberos instances.

**This document focuses on how to configure and access data sources in multi-Kerberos environments.**

> This feature is supported since 3.1+

## Multi-Kerberos Cluster Authentication Configuration

### krb5.conf

`krb5.conf` contains Kerberos configuration information, KDC locations, some **default values** for Kerberos services, and hostname-to-Realm mapping information.

When applying krb5.conf, ensure it is placed on every node. The default location is `/etc/krb5.conf`.

### realms

Contains KDC and Kerberos networks of many clients, such as EXAMPLE.COM.

When configuring multiple clusters, you need to configure multiple Realms in one `krb5.conf`. KDC and `admin_server` can also be domain names.

```
[realms]
EMR-IP.EXAMPLE = {
    kdc = 172.21.16.8:88
    admin_server = 172.21.16.8
}
EMR-HOST.EXAMPLE = {
    kdc = emr_hostname
    admin_server = emr_hostname
}
```

### domain_realm

Configures the mapping from domain to Realm for nodes where Kerberos services are located.

```toml
[libdefaults]
dns_lookup_realm = true
dns_lookup_kdc = true
[domain_realm]
172.21.16.8 = EMR-IP.EXAMPLE
emr-host.example = EMR-HOST.EXAMPLE
```

For example, for principal `emr1/domain_name@realm.com`, when looking up KDC, use `domain_name` to find the corresponding Realm. If it doesn't match, the KDC for the Realm cannot be found.

You will typically see two types of errors in Doris's `log/be.out` or `log/fe.out` that are related to `domain_realm`:

```
* Unable to locate KDC for realm/Cannot locate KDC

* No service creds
```

### keytab and principal

In multi-Kerberos cluster environments, keytab files usually use different paths, such as: `/path/to/serverA.keytab`, `/path/to/serverB.keytab`. When accessing different clusters, you need to use the corresponding keytab.

If the HDFS cluster has Kerberos authentication enabled, you can generally see the `hadoop.security.auth_to_local` property in the `core-site.xml` file, which is used to map Kerberos principals to shorter local usernames, and Hadoop reuses Kerberos syntax rules.

If not configured, you may encounter a `NoMatchingRule("No rules applied to` exception. See code:

[hadoop/src/core/org/apache/hadoop/security/KerberosName.java](https://github.com/hanborq/hadoop/blob/master/src/core/org/apache/hadoop/security/KerberosName.java#L399)

The `hadoop.security.auth_to_local` parameter contains a set of mapping rules that match principals against RULEs from top to bottom. When a matching mapping rule is found, it outputs a username and ignores unmatched rules. The specific configuration format:

```
RULE:[<principal translation>](acceptance filter)<short name substitution>
```

To match principals used by different Kerberos services in multi-cluster environments, the recommended configuration is:

```xml
<property>
    <name>hadoop.security.auth_to_local</name>
    <value>RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           DEFAULT</value>
</property>
```

The above configuration can be used to add or replace the `hadoop.security.auth_to_local` property in `core-site.xml`. Place `core-site.xml` in `fe/conf` and `be/conf` to make it effective in the Doris environment.

If you need it to take effect separately in OUTFILE, EXPORT, Broker Load, Catalog (Hive, Iceberg, Hudi), TVF, and other functions, you can configure it directly in their properties:

```sql
"hadoop.security.auth_to_local" = "RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   DEFAULT"
```

To verify whether mapping rules can match correctly, check if this error occurs when accessing different clusters:

```
NoMatchingRule: No rules applied to hadoop/domain\_name@EMR-REALM.COM
```

If it appears, it indicates unsuccessful matching.

## Best Practices

This section introduces how to use the Docker environment provided by the [Apache Doris official repository](https://github.com/apache/doris/tree/master/docker/thirdparties) to start Hive/HDFS services with Kerberos using Docker, and create Kerberos-enabled Hive Catalogs through Doris.

### Environment Description

* Use Kerberos services provided by Doris (two sets of HIVE, two sets of KDC):

  * Docker startup directory: `docker/thirdparties`

  * krb5.conf template:

    [`docker-compose/kerberos/common/conf/doris-krb5.conf`](https://github.com/apache/doris/blob/master/docker/thirdparties/docker-compose/kerberos/common/conf/doris-krb5.conf)

### 1. Prepare keytab files and permissions

Copy keytab files to local directory:

```bash
mkdir -p ~/doris-keytabs
cp <hive-presto-master.keytab> ~/doris-keytabs/
cp <other-hive-presto-master.keytab> ~/doris-keytabs/
```

Set file permissions to prevent authentication failure:

```bash
chmod 400 ~/doris-keytabs/*.keytab
```

### 2. Prepare krb5.conf file

1. Use the `krb5.conf` template file provided by Doris

2. If you need to access multiple Kerberos HDFS clusters simultaneously, you need to **merge krb5.conf**, with basic requirements:

   * `[realms]`: Write Realms and KDC IPs for all clusters.

   * `[domain_realm]`: Write domain or IP to Realm mappings.

   * `[libdefaults]`: Unified encryption algorithms (such as des3-cbc-sha1).

3. Example:

    ```toml
    [libdefaults]
        default_realm = LABS.TERADATA.COM
        allow_weak_crypto = true
        dns_lookup_realm = true
        dns_lookup_kdc = true

    [realms]
        LABS.TERADATA.COM = {
            kdc = 127.0.0.1
            admin_server = 127.0.0.1
        }
        OTHERREALM.COM = {
            kdc = 127.0.0.1
            admin_server = 127.0.0.1
        }

    [domain_realm]
        presto-master.docker.cluster = LABS.TERADATA.COM
        hadoop-master-2 = OTHERREALM.COM
        .labs.teradata.com = LABS.TERADATA.COM
        .otherrealm.com = OTHERREALM.COM
    ```

4. Copy `krb5.conf` to the corresponding Docker directory:

    ```bash
    cp doris-krb5.conf ~/doris-kerberos/krb5.conf
    ```

### 3. Start Docker Kerberos environment

1. Enter directory:

    ```bash
    cd docker/thirdparties
    ```

2. Start Kerberos environment:

    ```bash
    ./run-thirdparties-docker.sh -c kerberos
    ```

3. Services after startup include:

   * Hive Metastore 1:9583
   * Hive Metastore 2:9683
   * HDFS 1:8520
   * HDFS 2:8620

### 4. Get container IP

Use command to view Docker IP:

```bash
docker inspect <container-name> | grep IPAddress
```

Or directly use 127.0.0.1 (provided that the service has been mapped to the host network).

### 5. Create Kerberos Hive Catalog

1. Hive Catalog1

    ```sql
    CREATE CATALOG IF NOT EXISTS multi_kerberos_one
    PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9583",
    "fs.defaultFS" = "hdfs://127.0.0.1:8520",
    "hadoop.kerberos.min.seconds.before.relogin" = "5",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "hive/presto-master.docker.cluster@LABS.TERADATA.COM",
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/keytabs/hive-presto-master.keytab",
    "hive.metastore.sasl.enabled " = "true",
    "hadoop.security.auth_to_local" = "RULE:[2:$1@$0](.*@LABS.TERADATA.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERREALM.COM)s/@.*//
                                        DEFAULT",
    "hive.metastore.kerberos.principal" = "hive/hadoop-master@LABS.TERADATA.COM"
    );
    ```

2. Hive Catalog2

    ```sql
    CREATE CATALOG IF NOT EXISTS multi_kerberos_two
    PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9683",
    "fs.defaultFS" = "hdfs://127.0.0.1:8620",
    "hadoop.kerberos.min.seconds.before.relogin" = "5",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "hive/presto-master.docker.cluster@OTHERREALM.COM",
    "hadoop.kerberos.keytab" = "/mnt/disk1/gq/keytabs/keytabs/other-hive-presto-master.keytab",
    "hive.metastore.sasl.enabled " = "true",
    "hadoop.security.auth_to_local" = "RULE:[2:$1@$0](.*@OTHERREALM.COM)s/@.*//
                                        RULE:[2:$1@$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                                        DEFAULT",
    "hive.metastore.kerberos.principal" = "hive/hadoop-master-2@OTHERREALM.COM"
    );
    ```

At this point, the multi-Kerberos cluster access configuration is complete. You can view data from both Hive clusters and use different Kerberos credentials.
