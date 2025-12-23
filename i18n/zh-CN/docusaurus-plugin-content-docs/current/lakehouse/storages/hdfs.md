---
{
    "title": "HDFS",
    "language": "zh-CN",
    "description": "本文档用于介绍访问 HDFS 时所需的参数。这些参数适用于："
}
---

本文档用于介绍访问 HDFS 时所需的参数。这些参数适用于：

* Catalog 属性。
* Table Valued Function 属性。
* Broker Load 属性。
* Export 属性。
* Outfile 属性。
* 备份恢复。

## 参数总览

|属性名称 | 曾用名 | 描述 | 默认值 | 是否必须 |
| --- | --- | --- | --- | --- | 
| hdfs.authentication.type | hadoop.security.authentication | 用于指定认证类型。可选值为 kerberos 或 simple。如果选择 kerberos，系统将使用 Kerberos 认证同 HDFS 交互；如果使用 simple，表示不使用认证，适用于开放的 HDFS 集群。选择 kerberos 需要配置相应的 principal 和 keytab。 | simple | 否 |
| hdfs.authentication.kerberos.principal | hadoop.kerberos.principal | 当认证类型为 kerberos 时，指定 Kerberos 的 principal。Kerberos principal 是一个唯一标识身份的字符串，通常包括服务名、主机名和域名。 | - | 否 |
| hdfs.authentication.kerberos.keytab | hadoop.kerberos.keytab | 该参数指定用于 Kerberos 认证的 keytab 文件路径。keytab 文件用于存储加密的凭证，允许系统自动进行认证，无需用户手动输入密码。 | - | 否 |
| hdfs.impersonation.enabled | - | 如果为 true，将开启 HDFS 的 impersonation 功能。会使用 core-site.xml 中配置的代理用户，来代理 Doris 的登录用户，执行 HDFS 操作 | 尚未支持 | - |
| hadoop.username | - | 当认证类型为 simple 时，会使用此用户来访问 HDFS。默认情况下，会使用运行 Doris 进程的 Linux 系统用户进行访问 | - | - |
| hadoop.config.resources | - | 指定 HDFS 相关配置文件目录（需包含 hdfs-site.xml 和 core-site.xml )，需使用相对路径，默认目录为（FE/BE）部署目录下的 /plugins/hadoop/conf/（可修改 fe.conf/be.conf 中的 hadoop_config_dir，来更改默认路径）。所有 FE 和 BE 节点需配置相同相对路径。示例：hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml | - | - |
| dfs.nameservices | - | 手动配置 HDFS 高可用集群的参数。若使用 hadoop.config.resources 配置，则会自动从 hdfs-site.xml 读取参数。需配合以下参数：dfs.ha.namenodes.your-nameservice、dfs.namenode.rpc-address.your-nameservice.nn1、dfs.client.failover.proxy.provider 等 | - | - | 

> 3.1 之前的版本，请使用曾用名。

## 认证配置

HDFS 支持两种认证方式：即

* Simple
* Kerberos

### Simple 认证

Simple 认证适用于未开启 Kerberos 的 HDFS 集群。

使用 Simple 认证方式，可以设置以下参数，或直接使用默认值：

```sql
"hdfs.authentication.type" = "simple"
```

Simple 认证模式下，可以使用 `hadoop.username` 参数来指定用户名。如不指定，则默认使用当前进程运行的用户名。

示例：

使用 `lakers` 用户名访问 HDFS

```sql
"hdfs.authentication.type" = "simple",
"hadoop.username" = "lakers"
```

使用默认系统用户访问 HDFS

```sql
"hdfs.authentication.type" = "simple"
```

### Kerberos 认证

Kerberos 认证适用于已开启 Kerberos 的 HDFS 集群。

使用 Kerberos 认证方式，需要设置以下参数：

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "<your_principal>",
"hdfs.authentication.kerberos.keytab" = "<your_keytab>"
```

Kerberos 认证模式下，需要设置 Kerberos 的 principal 和 keytab 文件路径。

Doris 将以该 `hdfs.authentication.kerberos.principal` 属性指定的主体身份访问 HDFS，使用 keytab 指定的 keytab 对该 Principal 进行认证。

> 注意：
>
> Keytab 文件需要在每个 FE 和 BE 节点上均存在，且路径相同，同时运行 Doris 进程的用户必须具有该 keytab 文件的读权限。

示例：

```sql
"hdfs.authentication.type" = "kerberos",
"hdfs.authentication.kerberos.principal" = "hdfs/hadoop@HADOOP.COM",
"hdfs.authentication.kerberos.keytab" = "/etc/security/keytabs/hdfs.keytab",
```

## 高可用配置（HDFS HA）

如 HDFS 开启了 HA 模式，需要配置 `dfs.nameservices` 相关参数：

```sql
'dfs.nameservices' = '<your-nameservice>',
'dfs.ha.namenodes.<your-nameservice>' = '<nn1>,<nn2>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn1>' = '<nn1_host:port>',
'dfs.namenode.rpc-address.<your-nameservice>.<nn2>' = '<nn2_host:port>',
'dfs.client.failover.proxy.provider.<your-nameservice>' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

示例：

```sql
'dfs.nameservices' = 'nameservice1',
'dfs.ha.namenodes.nameservice1' = 'nn1,nn2',
'dfs.namenode.rpc-address.nameservice1.nn1' = '172.21.0.2:8088',
'dfs.namenode.rpc-address.nameservice1.nn2' = '172.21.0.3:8088',
'dfs.client.failover.proxy.provider.nameservice1' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
```

## 配置文件

> 该功能自 3.1.0 版本支持

Doris 支持通过 `hadoop.config.resources` 参数来指定 HDFS 相关配置文件目录。

配置文件目录需包含 `hdfs-site.xml` 和 `core-site.xml` 文件，默认目录为（FE/BE）部署目录下的 `/plugins/hadoop_conf/`。所有 FE 和 BE 节点需配置相同的相对路径。

如果配置文件包含文档上述参数，则优先使用用户显示配置的参数。配置文件可以指定多个文件，多个文件以逗号分隔。如 `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。

**示例：**

```sql
-- 多个配置文件
'hadoop.config.resources'='hdfs-cluster-1/core-site.xml,hdfs-cluster-1/hdfs-site.xml'
-- 单个配置文件
'hadoop.config.resources'='hdfs-cluster-2/hdfs-site.xml'
```

## HDFS IO 优化

在某些情况下，HDFS 的负载较高可能导致读取某个 HDFS 上的数据副本的时间较长，从而拖慢整体的查询效率。下面介绍一些相关的优化配置。

### Hedged Read

HDFS Client 提供了 Hedged Read 功能。该功能可以在一个读请求超过一定阈值未返回时，启动另一个读线程读取同一份数据，哪个先返回就是用哪个结果。

注意：该功能可能会增加 HDFS 集群的负载，请酌情使用。

可以通过以下方式开启这个功能：

```sql
"dfs.client.hedged.read.threadpool.size" = "128",
"dfs.client.hedged.read.threshold.millis" = "500"
```

* `dfs.client.hedged.read.threadpool.size`

	表示用于 Hedged Read 的线程数，这些线程由一个 HDFS Client 共享。通常情况下，针对一个 HDFS 集群，BE 节点会共享一个 HDFS Client。

* `dfs.client.hedged.read.threshold.millis`

	读取阈值，单位毫秒。当一个读请求超过这个阈值未返回时，会触发 Hedged Read。

开启后，可以在 Query Profile 中看到相关参数：

* `TotalHedgedRead`

	发起 Hedged Read 的次数。

* `HedgedReadWins`

	Hedged Read 成功的次数（发起并且比原请求更快返回的次数）

注意，这里的值是单个 HDFS Client 的累计值，而不是单个查询的数值。同一个 HDFS Client 会被多个查询复用。

### dfs.client.socket-timeout

`dfs.client.socket-timeout` 是 Hadoop HDFS 中的一个客户端配置参数，用于设置客户端与 DataNode 或 NameNode 之间建立连接或读取数据时的套接字（socket）超时时间，单位为毫秒。该参数的默认值通常为 60,000 毫秒。

将该参数的值调小，可以使客户端在遇到网络延迟、DataNode 响应慢或连接异常等问题时，更快地超时并进行重试或切换到其他节点。这有助于减少等待时间，提高系统的响应速度。例如，在某些测试中，将 `dfs.client.socket-timeout` 设置为较小的值（如 5000 毫秒），可以迅速检测到 DataNode 的延迟或故障，从而避免长时间的等待。

注意：

* 将超时时间设置得过小可能导致在网络波动或节点负载较高时频繁出现超时错误，影响任务的稳定性。

* 建议根据实际网络环境和系统负载情况，合理调整该参数的值，以在响应速度和系统稳定性之间取得平衡。

* 该参数应在客户端配置文件（如 `hdfs-site.xml`）中设置，确保客户端在与 HDFS 通信时使用正确的超时时间。

总之，合理配置 `dfs.client.socket-timeout` 参数，可以在提高 I/O 响应速度的同时，确保系统的稳定性和可靠性。

## HDFS 访问端口要求（仅 NameNode 与 DataNode）

说明：Doris 访问 HDFS 最少需保证以下端口连通。

| 服务     | 端口用途             | 默认端口 | 协议           |
|----------|------------------|----------|--------------|
| NameNode | RPC（客户端／元数据访问）   | 8020     | TCP          |
| DataNode | 数据传输（Block 读写）   | 9866     | TCP          |


注意：
- 端口可能被 `core-site.xml`／`hdfs-site.xml` 自定义，请以实际配置为准。
- 当启用 Kerberos 认证时，需要保证 Doris 到 Kerberos KDC 的网络连通。KDC 默认监听 TCP 88 端口，如有自定义请以实际配置为准。


## 调试 HDFS

Hadoop 环境配置复杂，某些情况下可能出现无法连通、访问性能不佳等问题。这里提供一些第三方工具帮助用户快速排查连通性问题和基础的性能问题。

### HDFS Client

* Java:<https://github.com/morningman/hdfs-client-java>

* CPP: <https://github.com/morningman/hdfs-client-cpp>

这两个工具可以用于快速验证 HDFS 连通性和读取性能。其中的大部分 Hadoop 依赖项和 Doris 本身的 Hadoop 依赖相同，因此可以最大程度模拟 Doris 访问 HDFS 的场景。

Java 版本使用通过 Java 访问 HDFS，可以模拟 Doris FE 侧访问 HDFS 的逻辑。

CPP 版本通过 C++ 调用 libhdfs 访问 HDFS，可以模拟 Doris BE 侧访问 HDFS 的逻辑。

具体使用方式可以各自代码库的 README。
