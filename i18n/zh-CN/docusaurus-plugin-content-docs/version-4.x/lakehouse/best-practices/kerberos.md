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
