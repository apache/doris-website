---
{
    "title": "Kerberos 最佳实践",
    "language": "zh-CN",
    "description": "当用户使用 Doris 进行多数据源的联邦分析查询时，不同的集群可能使用不同的 Kerberos 认证凭据。"
}
---

当用户使用 Doris 进行多数据源的联邦分析查询时，不同的集群可能使用不同的 Kerberos 认证凭据。

以某大型基金公司为例，其内部数据平台划分为多个功能集群，分别由不同的技术或业务团队维护，并配置了独立的 Kerberos Realm 用于身份认证和访问控制。其中：

- 生产集群用于日常净值计算和风险评估，数据严格隔离，仅允许授权服务访问（Realm：PROD.FUND.COM）。
- 分析集群则用于策略研究与模型回测，Doris 通过 TVF 实现对该集群的临时查询（Realm：ANALYSIS.FUND.COM）。
- 数据湖集群接入了 Iceberg Catalog，用于归档和分析历史行情、日志等大体量数据（Realm：LAKE.FUND.COM）。

由于各集群未建立跨域信任关系，认证信息无法共享，若希望统一访问这些异构数据源，就必须同时支持多个 Kerberos 实例的认证与上下文管理。

**本文档重点介绍如何在多 Kerberos 环境下配置和访问数据源。**

> 本文档适用于 Doris 3.1+ 

## 多 Kerberos 集群认证配置

### krb5.conf

`krb5.conf` 包含 Kerberos 配置信息、KDC 位置、Kerberos 服务的一些**默认值**，以及主机名到 Realm 的映射信息等。

应用 krb5.conf 时，要确保将它放到每个节点。默认位置在 `/etc/krb5.conf`。

### realms

包含 KDC 和许多客户端的 Kerberos 网络，例如 EXAMPLE.COM。

配置多集群时，需要把多个 Realm 配置到一个 `krb5.conf` 里。KDC 和 `admin_server` 也可以是域名。

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

配置 Kerberos 服务所在节点的 domain 到 Realm 的映射。

```toml
[libdefaults]
dns_lookup_realm = true
dns_lookup_kdc = true
[domain_realm]
172.21.16.8 = EMR-IP.EXAMPLE
emr-host.example = EMR-HOST.EXAMPLE
```

例如，对于 principal `emr1/domain_name@realm.com`，查找 KDC 时使用 `domain_name` 去找相对应的 Realm，如果匹配不上，会找不到 Realm 所在的 KDC。

通常会在 Doris 的 `log/be.out` 或者 `log/fe.out` 看到两种错误都与 `domain_realm` 有关：

```
* Unable to locate KDC for realm/Cannot locate KDC

* No service creds
```

### keytab 和 principal

在多 Kerberos 集群的环境下，keytab 通常会使用不同的路径，比如：`/path/to/serverA.keytab`，`/path/to/serverB.keytab`。访问不同集群时，需要使用对应的 keytab。

如果 HDFS 集群开启了 Kerberos 认证，我们一般在 `core-site.xml` 文件中能看到 `hadoop.security.auth_to_local` 属性，用于将 Kerberos 的 principal 映射为比较短的本地用户名称，并且 Hadoop 复用了 Kerberos 语法规则。

如未配置，则可能遇到 `NoMatchingRule("No rules applied to` 异常，见代码：

[hadoop/src/core/org/apache/hadoop/security/KerberosName.java](https://github.com/hanborq/hadoop/blob/master/src/core/org/apache/hadoop/security/KerberosName.java#L399)

`hadoop.security.auth_to_local` 参数中包含一组映射规则，将 principal 由上至下逐一匹配 RULE，当找到匹配的映射规则后，会输出一个用户名称，同时忽略未进行匹配的规则。具体的配置格式：

```
RULE:[<principal translation>](acceptance filter)<short name substitution>
```

为了在多集群环境下，能匹配到不同 Kerberos 服务用到的 principal，推荐配置如下：

```xml
<property>
    <name>hadoop.security.auth_to_local</name>
    <value>RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
           DEFAULT</value>
</property>
```

以上配置可以用于添加或者替换 `core-site.xml` 中的 `hadoop.security.auth_to_local` 属性，将 `core-site.xml` 放到 `fe/conf` 以及 `be/conf` 下，使其在 Doris 环境中生效。

如果需要在 OUTFILE、EXPORT、Broker Load、Catalog（Hive、Iceberg、Hudi）、TVF 等功能中单独生效，可以直接配置在他们的 properties 中：

```sql
"hadoop.security.auth_to_local" = "RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                   DEFAULT"
```

检验映射规则是否能正确匹配，只要看访问不同集群时是否出现这个错误：

```
NoMatchingRule: No rules applied to hadoop/domain\_name@EMR-REALM.COM
```

如果出现，则表示匹配不成功。

## 最佳实践

本小节介绍如何基于 [Apache Doris 官方仓库](https://github.com/apache/doris/tree/master/docker/thirdparties) 提供的 Docker 环境，使用 Docker 启动带 Kerberos 的 Hive/HDFS 服务，并通过 Doris 创建支持 Kerberos 的 Hive Catalog。

### 环境说明

* 使用 Doris 提供的 Kerberos 服务（两套 HIVE，两套 KDC）：

  * Docker 启动目录：`docker/thirdparties`

  * krb5.conf 模板：

    [`docker-compose/kerberos/common/conf/doris-krb5.conf`](https://github.com/apache/doris/blob/master/docker/thirdparties/docker-compose/kerberos/common/conf/doris-krb5.conf)

### 1. 准备 keytab 文件和权限

拷贝 keytab 文件到本地目录：

```bash
mkdir -p ~/doris-keytabs
cp <hive-presto-master.keytab> ~/doris-keytabs/
cp <other-hive-presto-master.keytab> ~/doris-keytabs/
```

设置文件权限，防止认证失败：

```bash
chmod 400 ~/doris-keytabs/*.keytab
```

### 2. 准备 krb5.conf 文件

1. 使用 Doris 提供的 `krb5.conf` 模板文件

2. 如果需要同时访问多个 Kerberos HDFS 集群，需要 **合并 krb5.conf**，基本要求：

   * `[realms]`：写入所有集群的 Realm 和 KDC IP。

   * `[domain_realm]`：写入 domain 或 IP 和 Realm 的映射。

   * `[libdefaults]`：统一加密算法（如 des3-cbc-sha1）。

3. 示例：

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

4. 拷贝 `krb5.conf` 到 Docker 对应目录：

    ```bash
    cp doris-krb5.conf ~/doris-kerberos/krb5.conf
    ```

### 3. 启动 Docker Kerberos 环境

1. 进入目录：

    ```bash
    cd docker/thirdparties
    ```

2. 启动 Kerberos 环境：

    ```bash
    ./run-thirdparties-docker.sh -c kerberos
    ```

3. 启动后服务包括：

   * Hive Metastore 1:9583
   * Hive Metastore 2:9683
   * HDFS 1:8520
   * HDFS 2:8620

### 4. 获取容器 IP

使用命令查看 Docker IP：

```bash
docker inspect <container-name> | grep IPAddress
```

或直接使用 127.0.0.1（前提是服务已经映射到宿主机网络）。

### 5. 创建 Kerberos Hive Catalog

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

至此，完成多 Kerberos 集群访问配置，您可以查看两个 Hive 集群中的数据，并使用不同的 Kerberos 凭证。
## 联通性检测工具
对于 Kerberos 等外部依赖的联通性检查，可使用开源工具 **Pulse** 进行验证。

**Pulse 是一个独立的开源联通性测试工具，相关使用方式、安装说明及版本发布，请参考其项目文档。**

相关文档 [Kerberos Connectivity Tool](https://github.com/CalvinKirs/Pulse/tree/main/kerberos-tools)
安装包 [Kerberos Connectivity Tool](https://github.com/CalvinKirs/Pulse/releases/tag/v1.0.0)
## FAQ
1. javax.security.sasl.SaslException: No common protection layer between client and server
   - 原因: 客户端的 hadoop.rpc.protection 配置与 HDFS 集群上的配置不一致。
   - 解决: 检查并统一客户端与 HDFS Server 的 hadoop.rpc.protection 配置。

2. No valid credentials provided (Mechanism level: Illegal key size)
   - 原因: Java 默认不支持大于 128 位的加密密钥长度。
   - 解决: 下载并安装 Java Cryptography Extension (JCE) Unlimited Strength Jurisdiction Policy Files。将下载的 JAR 文件解压并放置到 $JAVA_HOME/jre/lib/security 目录下，然后重启相关服务。

3. Encryption type AES256 CTS mode with HMAC SHA1-96 is not supported/enabled
   - 原因: 当前 Java 环境不支持 AES256 加密，而 Kerberos 默认可能使用此加密方式。
   - 解决:修改 Kerberos 配置文件 (/etc/krb5.conf)，在 [libdefaults] 部分指定一个当前环境支持的加密算法。 或者，安装 JCE 扩展包以启用对 AES256 的支持（同上一个问题）。

4. No valid credentials provided (Mechanism level: Failed to find any Kerberos tgt)
   - 原因: Kerberos 无法找到有效的票据授权票据 (Ticket Granting Ticket, TGT)。 对于已正常运行过的环境: 票据（Ticket）已过期或 Kerberos 服务端（KDC）已重启。 对于首次配置的环境: krb5.conf 配置文件有误，或 keytab 文件不正确/已损坏。
   - 解决: 检查 krb5.conf 和 keytab 文件的正确性，并确保票据在有效期内。可以尝试使用 kinit 命令重新获取票据。

5. Failure unspecified at GSS-API level (Mechanism level: Checksum failed)
   - 原因: GSS-API 校验和失败。 kinit 时使用的密码错误。 keytab 文件无效或包含过期的密钥版本，导致 JVM 回退到尝试使用用户密码登录。
   - 解决: 确认 kinit 使用的密码正确，并检查 keytab 文件是否为最新且有效。

6. Receive timed out
   - 原因: 使用 UDP 协议与 KDC 通信时，网络不稳定或数据包较大，容易导致超时。
   - 解决: 强制 Kerberos 使用 TCP 协议。在 /etc/krb5.conf 的 [libdefaults] 部分添加以下配置：
```shell
   - [libdefaults]
   udp_preference_limit = 1
```
7. javax.security.auth.login.LoginException: Unable to obtain password from user
   - 原因: Principal 和 keytab 文件不匹配，或者应用程序无法读取 krb5.conf 或 keytab 文件。
   - 解决:
      - 使用 klist -kt <keytab_file> 和 kinit -kt <keytab_file> <principal> 命令验证 keytab 和 principal 是否匹配。
      - 检查 krb5.conf 和 keytab 文件的路径和文件权限，确保运行程序的用户有权读取它们。
      - 确认 JVM 启动参数中是否正确指定了配置文件路径。

8. Principal not found 或 Could not resolve Kerberos principal name
   - 原因:
      - Principal 名称中的主机名无法被正确解析。
      - Principal 格式 user/_HOST@REALM 中的 _HOST 占位符被替换为了一个 KDC 无法识别的主机名。
      - DNS 或 /etc/hosts 文件配置不正确，导致主机名解析失败。
   - 解决:
      - 检查 Principal 名称的拼写是否正确。
      - 确保在所有相关节点（包括 Doris FE、BE 和 KDC）的 /etc/hosts 文件中都包含了正确的主机名和 IP 地址映射。

9. Cannot find KDC for realm "XXX"
   - 原因: 在 krb5.conf 文件中找不到指定 Realm 的 KDC 配置。
   - 解决:
      - 检查 krb5.conf 文件中 [realms] 部分的 Realm 名称是否拼写正确。
      - 确认该 Realm 下的 kdc 地址是否配置正确。
      - 如果修改或新增了 /etc/krb5.conf，需要重启 BE&FE 才能使配置生效。

10. Request is a replay
   - 原因: KDC 认为收到了一个重复的认证请求，这可能是攻击行为。 时间不同步: 集群中各节点（包括 KDC）的时钟不一致。 Principal 共享: 多个服务或进程共享了同一个 Principal（例如 service@REALM），导致认证请求冲突。
   - 解决:
   - 在所有节点上配置并启用 NTP 服务，确保时间同步。
   - 为每个服务实例使用特定的 Principal，格式为 service/_HOST@REALM，避免共享。

11. Client not found in Kerberos database
   - 原因: 客户端 Principal 在 Kerberos 数据库中不存在。
   - 解决: 确认使用的 Principal 是否已在 KDC 中正确创建。

12. Message stream modified (41)
   - 原因: 这通常是特定操作系统（如 CentOS 7）与 Kerberos/Java 组合下的已知问题。
   - 解决: 联系操作系统供应商或查找相关的安全补丁。

13. Pre-authentication information was invalid (24)
   - 原因:
   - 预认证信息无效。
   - 客户端和 KDC 之间的时钟不同步。
   - 客户端 JDK 的加密算法与 KDC 不匹配。
   - 解决:
      - 检查并同步所有节点的时间。
      - 检查并统一加密算法配置。
