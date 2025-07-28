---
{
  "title": "HDFS",
  "language": "en"
}
---

This document describes the parameters required for accessing HDFS. These parameters apply to:
- Catalog properties.
- Table Valued Function properties.
- Broker Load properties.
- Export properties.
- Outfile properties.
- Backup and Restore

## Parameter Overview

| Property Name                        | Description                                                                                                                                                                                                                                 | Default Value | Required |
|--------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|----------|
| `hadoop.security.authentication`    | Authentication type for accessing HDFS. Supports `kerberos` and `simple`                                                                                                                                                                   | `simple`      | No       |
| `hadoop.kerberos.principal`          | Specify principal when authentication type is `kerberos`                                                                                                                                                                                   | -             | No       |
| `hadoop.kerberos.keytab`             | Specify keytab when authentication type is `kerberos`                                                                                                                                                                                      | -             | No       |
| `hadoop.username`                    | When authentication type is `simple`, this user will be used to access HDFS. By default, the Linux system user running the Doris process will be used for access                                                                        | -             | -        |
| `dfs.nameservices`                   | Manually configure parameters for HDFS high availability cluster. If using `hadoop.config.resources` configuration, parameters will be automatically read from `hdfs-site.xml`. Use with the following parameters:<br>`dfs.ha.namenodes.your-nameservice`<br>`dfs.namenode.rpc-address.your-nameservice.nn1`<br>`dfs.client.failover.proxy.provider` etc. | -             | -        |

### Parameter Examples

```
"hadoop.security.authentication" = "kerberos",
"hadoop.kerberos.keytab" = "keytab",   
"hadoop.kerberos.principal" = "principal"
```

## IO Optimization

### Hedged Read

In some cases, high HDFS load may cause reading certain data replicas on HDFS to take a long time, which can slow down overall query efficiency. HDFS Client provides the Hedged Read feature.
This feature can start another read thread to read the same data when a read request exceeds a certain threshold without returning, and use whichever result returns first.

Note: This feature may increase the load on the HDFS cluster, please use it judiciously.

You can enable this feature in the following way:

```
create catalog regression properties (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.16.47:7004',
    'dfs.client.hedged.read.threadpool.size' = '128',
    'dfs.client.hedged.read.threshold.millis' = "500"
);
```

`dfs.client.hedged.read.threadpool.size` represents the number of threads used for Hedged Read, which are shared by one HDFS Client. Typically, for one HDFS cluster, BE nodes will share one HDFS Client.

`dfs.client.hedged.read.threshold.millis` is the read threshold in milliseconds. When a read request exceeds this threshold without returning, it will trigger Hedged Read.

After enabling, you can see related parameters in the Query Profile:

`TotalHedgedRead`: Number of times Hedged Read was initiated.

`HedgedReadWins`: Number of successful Hedged Read attempts (initiated and returned faster than the original request)

Note that the values here are cumulative for a single HDFS Client, not values for a single query. The same HDFS Client will be reused by multiple queries.

### dfs.client.socket-timeout

`dfs.client.socket-timeout` is a client configuration parameter in Hadoop HDFS, used to set the socket timeout when the client establishes connections or reads data from DataNode or NameNode, in milliseconds. The default value for this parameter is typically 60,000 milliseconds.

Reducing the value of this parameter allows the client to timeout more quickly when encountering network delays, slow DataNode responses, or connection anomalies, and retry or switch to other nodes. This helps reduce waiting time and improve system response speed. For example, in some tests, setting `dfs.client.socket-timeout` to a smaller value (such as 5000 milliseconds) can quickly detect DataNode delays or failures, thus avoiding long waits.

Notes:

- Setting the timeout too small may cause frequent timeout errors during network fluctuations or high node load, affecting task stability.
- It is recommended to adjust this parameter value reasonably based on actual network environment and system load conditions to balance response speed and system stability.
- This parameter should be set in the client configuration file (such as `hdfs-site.xml`) to ensure the client uses the correct timeout when communicating with HDFS.

In summary, properly configuring the `dfs.client.socket-timeout` parameter can improve I/O response speed while ensuring system stability and reliability.

## Debugging HDFS

Hadoop environment configuration is complex, and in some cases, connectivity issues or poor access performance may occur. Here are some third-party tools to help users quickly troubleshoot connectivity issues and basic performance problems.

### HDFS Client

- Java: [https://github.com/morningman/hdfs-client-java](https://github.com/morningman/hdfs-client-java)

- CPP: [https://github.com/morningman/hdfs-client-cpp](https://github.com/morningman/hdfs-client-cpp)

These two tools can be used to quickly verify HDFS connectivity and read performance. Most of the Hadoop dependencies in these tools are the same as Doris's own Hadoop dependencies, so they can simulate Doris's access to HDFS scenarios to the greatest extent.

The Java version accesses HDFS through Java, which can simulate the logic of Doris FE side accessing HDFS.

The CPP version accesses HDFS through C++ calling libhdfs, which can simulate the logic of Doris BE side accessing HDFS.

For specific usage instructions, please refer to the README of each respective code repository.