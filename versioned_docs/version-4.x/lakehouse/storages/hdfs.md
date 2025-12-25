---
{
    "title": "HDFS | Storages",
    "language": "en",
    "description": "This document describes the parameters required for accessing HDFS. These parameters apply to:"
}
---

This document describes the parameters required for accessing HDFS. These parameters apply to:

* Catalog properties
* Table Valued Function properties
* Broker Load properties
* Export properties
* Outfile properties
* Backup and restore

## Parameter Overview

|Property Name | Legacy Name | Description | Default Value | Required |
| --- | --- | --- | --- | --- | 
| hdfs.authentication.type | hadoop.security.authentication | Specifies the authentication type. Optional values are kerberos or simple. If kerberos is selected, the system will use Kerberos authentication to interact with HDFS; if simple is used, it means no authentication is used, suitable for open HDFS clusters. Selecting kerberos requires configuring the corresponding principal and keytab. | simple | No |
| hdfs.authentication.kerberos.principal | hadoop.kerberos.principal | When the authentication type is kerberos, specify the Kerberos principal. A Kerberos principal is a unique identity string that typically includes service name, hostname, and domain name. | - | No |
| hdfs.authentication.kerberos.keytab | hadoop.kerberos.keytab | This parameter specifies the keytab file path for Kerberos authentication. The keytab file stores encrypted credentials, allowing the system to authenticate automatically without requiring users to manually enter passwords. | - | No |
| hdfs.impersonation.enabled | - | If true, enables HDFS impersonation functionality. Uses the proxy user configured in core-site.xml to proxy Doris login users for HDFS operations | Not supported yet | - |
| hadoop.username | - | When the authentication type is simple, this user will be used to access HDFS. By default, the Linux system user running the Doris process will be used for access | - | - |
| hadoop.config.resources | - | Specifies the HDFS configuration file directory (must include hdfs-site.xml and core-site.xml), using relative paths. The default directory is /plugins/hadoop/conf/ under the (FE/BE) deployment directory (can be changed by modifying hadoop_config_dir in fe.conf/be.conf to change the default path). All FE and BE nodes need to configure the same relative path. Example: hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml | - | - |
| dfs.nameservices | - | Manually configure HDFS high availability cluster parameters. If using hadoop.config.resources configuration, parameters will be automatically read from hdfs-site.xml. Need to be used with the following parameters: dfs.ha.namenodes.your-nameservice, dfs.namenode.rpc-address.your-nameservice.nn1, dfs.client.failover.proxy.provider, etc. | - | - | 

> For versions before 3.1, please use the legacy names.

## Authentication Configuration

HDFS supports two authentication methods:

* Simple
* Kerberos

### Simple Authentication

Simple authentication is suitable for HDFS clusters that have not enabled Kerberos.

Using Simple authentication, you can set the following parameters or use the default values directly:

```sql
"hdfs.authentication.type" = "simple"
```

In Simple authentication mode, you can use the `hadoop.username` parameter to specify the username. If not specified, it defaults to the username of the current process.

Examples:

Using `lakers` username to access HDFS

```sql
"hdfs.authentication.type" = "simple",
"hadoop.username" = "lakers"
```

Using default system user to access HDFS

```sql
"hdfs.authentication.type" = "simple"
```

### Kerberos Authentication

Kerberos authentication is suitable for HDFS clusters with Kerberos enabled.

Using Kerberos authentication, you need to set the following parameters:

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "<your_principal>",
"hdfs.authentication.kerberos.keytab" = "<your_keytab>"
```

In Kerberos authentication mode, you need to set the Kerberos principal and keytab file path.

Doris will access HDFS with the identity specified by the `hdfs.authentication.kerberos.principal` property, using the keytab specified by keytab to authenticate the Principal.

> Note:
>
> The keytab file must exist on every FE and BE node with the same path, and the user running the Doris process must have read permissions for the keytab file.

Example:

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "hdfs/hadoop@HADOOP.COM",
"hdfs.authentication.kerberos.keytab" = "/etc/security/keytabs/hdfs.keytab",
```

## HDFS HA Configuration

If HDFS HA mode is enabled, need to configure `dfs.nameservices` related parameters:

```sql
'dfs.nameservices' = '<your-nameservice>',
'dfs.ha.namenodes.<your-nameservice>' = '<nn1>,<nn2>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn1>' = '<nn1_host:port>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn2>' = '<nn2_host:port>',
'dfs.client.failover.proxy.provider.<your-nameservice>' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

Example:

```sql
'dfs.nameservices' = 'nameservice1',
'dfs.ha.namenodes.nameservice1' = 'nn1,nn2',
'dfs.namenode.rpc-address.nameservice1.nn1' = '172.21.0.2:8088',
'dfs.namenode.rpc-address.nameservice1.nn2' = '172.21.0.3:8088',
'dfs.client.failover.proxy.provider.nameservice1' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

## Configuration Files

> This feature is supported since version 3.1.0

Doris supports specifying the HDFS configuration file directory through the `hadoop.config.resources` parameter.

The configuration file directory must contain `hdfs-site.xml` and `core-site.xml` files. The default directory is `/plugins/hadoop_conf/` under the (FE/BE) deployment directory. All FE and BE nodes need to configure the same relative path.

If the configuration files contain the above parameters mentioned in this document, user-explicitly configured parameters take priority. Configuration files can specify multiple files, separated by commas, such as `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`.

**Examples:**

```sql
-- Multiple configuration files
'hadoop.config.resources'='hdfs-cluster-1/core-site.xml,hdfs-cluster-1/hdfs-site.xml'
-- Single configuration file
'hadoop.config.resources'='hdfs-cluster-2/hdfs-site.xml'
```

## HDFS IO Optimization

In some cases, high HDFS load may cause reading data replicas on HDFS to take a long time, thereby slowing down overall query efficiency. The following introduces some related optimization configurations.

### Hedged Read

HDFS Client provides Hedged Read functionality. This feature can start another read thread to read the same data when a read request exceeds a certain threshold without returning, using whichever returns first.

Note: This feature may increase the load on the HDFS cluster, please use it judiciously.

You can enable this feature in the following way:

```sql
"dfs.client.hedged.read.threadpool.size" = "128",
"dfs.client.hedged.read.threshold.millis" = "500"
```

* `dfs.client.hedged.read.threadpool.size`

    Represents the number of threads used for Hedged Read, which are shared by one HDFS Client. Usually, for one HDFS cluster, BE nodes share one HDFS Client.

* `dfs.client.hedged.read.threshold.millis`

    Read threshold in milliseconds. When a read request exceeds this threshold without returning, it will trigger Hedged Read.

After enabling, you can see related parameters in Query Profile:

* `TotalHedgedRead`

    Number of times Hedged Read was initiated.

* `HedgedReadWins`

    Number of successful Hedged Read attempts (initiated and returned faster than the original request).

Note that the values here are cumulative values for a single HDFS Client, not values for a single query. The same HDFS Client is reused by multiple queries.

### dfs.client.socket-timeout

`dfs.client.socket-timeout` is a client configuration parameter in Hadoop HDFS used to set the socket timeout when the client establishes connections or reads data with DataNode or NameNode, in milliseconds. The default value of this parameter is usually 60,000 milliseconds.

Reducing this parameter value allows the client to timeout faster and retry or switch to other nodes when encountering network delays, slow DataNode responses, or connection exceptions. This helps reduce wait times and improve system response speed. For example, in some tests, setting `dfs.client.socket-timeout` to a smaller value (such as 5000 milliseconds) can quickly detect DataNode delays or failures, avoiding long waits.

Note:

* Setting the timeout too small may cause frequent timeout errors during network fluctuations or high node load, affecting task stability.

* It is recommended to reasonably adjust this parameter value based on actual network environment and system load conditions to balance response speed and system stability.

* This parameter should be set in the client configuration file (such as `hdfs-site.xml`) to ensure the client uses the correct timeout when communicating with HDFS.

In summary, properly configuring the `dfs.client.socket-timeout` parameter can improve I/O response speed while ensuring system stability and reliability.

## HDFS Access Port Requirements (NameNode \& DataNode only)

Doris requires the following ports to be open to access HDFS:

| Service   | Port Purpose                  | Default Port | Protocol|
|-----------|-------------------------------|--------------|---------|
| NameNode  | RPC (client/metadata access)  | 8020         |TCP      |
| DataNode  | Data transfer (block I/O)     | 9866         |TCP       |

Notes:
- Ports may be customized in `core-site.xml` \& `hdfs-site.xml`. Use actual configs.
- When Kerberos authentication is enabled, Doris must also be able to reach the Kerberos KDC service. The KDC listens on TCP port 88 by default, but the actual port should follow your KDC configuration.

## Debugging HDFS

Hadoop environment configuration is complex, and in some cases, connectivity issues and poor access performance may occur. Here are some third-party tools to help users quickly troubleshoot connectivity issues and basic performance problems.

### HDFS Client

* Java: <https://github.com/morningman/hdfs-client-java>

* CPP: <https://github.com/morningman/hdfs-client-cpp>

These two tools can be used to quickly verify HDFS connectivity and read performance. Most of their Hadoop dependencies are the same as Doris's own Hadoop dependencies, so they can simulate Doris's HDFS access scenarios to the greatest extent.

The Java version uses Java to access HDFS and can simulate the logic of Doris FE side accessing HDFS.

The CPP version accesses HDFS through C++ calling libhdfs and can simulate the logic of Doris BE side accessing HDFS.

For specific usage, please refer to the README in each code repository.
