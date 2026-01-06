---
{
    "title": "常见数据湖问题",
    "language": "zh-CN",
    "description": "通常是因为 Kerberos 认证信息填写不正确导致的，可以通过以下步骤排查："
}
---

## 证书问题

1. 查询时报错 `curl 77: Problem with the SSL CA cert.`。说明当前系统证书过旧，需要更新本地证书。
   - 可以从 `https://curl.haxx.se/docs/caextract.html` 下载最新的 CA 证书。
   - 将下载后的 cacert-xxx.pem 放到`/etc/ssl/certs/`目录，例如：`sudo cp cacert-xxx.pem  /etc/ssl/certs/ca-certificates.crt`。

2. 查询时报错：`ERROR 1105 (HY000): errCode = 2, detailMessage = (x.x.x.x)[CANCELLED][INTERNAL_ERROR]error setting certificate verify locations:  CAfile: /etc/ssl/certs/ca-certificates.crt CApath: none`.

```
yum install -y ca-certificates
ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
```

## Kerberos

1. 连接 Kerberos 认证的 Hive Metastore 报错：`GSS initiate failed`

   通常是因为 Kerberos 认证信息填写不正确导致的，可以通过以下步骤排查：

    1. 1.2.1 之前的版本中，Doris 依赖的 libhdfs3 库没有开启 gsasl。请更新至 1.2.2 之后的版本。
    2. 确认对各个组件，设置了正确的 keytab 和 principal，并确认 keytab 文件存在于所有 FE、BE 节点上。

        1. `hadoop.kerberos.keytab`/`hadoop.kerberos.principal`：用于 Hadoop hdfs 访问，填写 hdfs 对应的值。
        2. `hive.metastore.kerberos.principal`：用于 hive metastore。

    3. 尝试将 principal 中的 ip 换成域名（不要使用默认的 `_HOST` 占位符）
    4. 确认 `/etc/krb5.conf` 文件存在于所有 FE、BE 节点上。

2. 通过 Hive Catalog 连接 Hive 数据库报错：`RemoteException: SIMPLE authentication is not enabled.  Available:[TOKEN, KERBEROS]`.

    如果在 `show databases` 和 `show tables` 都是没问题的情况下，查询的时候出现上面的错误，我们需要进行下面两个操作：
    - fe/conf、be/conf 目录下需放置 core-site.xml 和 hdfs-site.xml
    - BE 节点执行 Kerberos 的 kinit 然后重启 BE，然后再去执行查询即可。

3. 查询配置了 Kerberos 的外表，遇到该报错：`GSSException: No valid credentials provided (Mechanism level: Failed to find any Kerberos Ticket)`，一般重启 FE 和 BE 能够解决该问题。

    - 重启所有节点前可在`"${DORIS_HOME}/be/conf/be.conf"`中的 JAVA_OPTS 参数里配置`-Djavax.security.auth.useSubjectCredsOnly=false`，通过底层机制去获取 JAAS credentials 信息，而不是应用程序。
    - 在[JAAS Troubleshooting](https://docs.oracle.com/javase/8/docs/technotes/guides/security/jgss/tutorials/Troubleshooting.html)中可获取更多常见 JAAS 报错的解决方法。

4. 在 Catalog 中配置 Kerberos 时，报错`Unable to obtain password from user`的解决方法：

    - 用到的 principal 必须在 klist 中存在，使用`klist -kt your.keytab`检查。
    - 检查 catalog 配置是否正确，比如漏配`yarn.resourcemanager.principal`。
    - 若上述检查没问题，则当前系统 yum 或者其他包管理软件安装的 JDK 版本存在不支持的加密算法，建议自行安装 JDK 并设置`JAVA_HOME`环境变量。
    - Kerberos 默认使用 AES-256 来进行加密。如果使用 Oracle JDK，则必须安装 JCE。如果是 OpenJDK，OpenJDK 的某些发行版会自动提供无限强度的 JCE，因此不需要安装 JCE。
    - JCE 与 JDK 版本是对应的，需要根据 JDK 的版本来选择 JCE 版本，下载 JCE 的 zip 包并解压到`$JAVA_HOME/jre/lib/security`目录下：
      - JDK6：[JCE6](http://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
      - JDK7：[JCE7](http://www.oracle.com/technetwork/java/embedded/embedded-se/downloads/jce-7-download-432124.html)
      - JDK8：[JCE8](http://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)

5. 使用 KMS 访问 HDFS 时报错：`java.security.InvalidKeyException: Illegal key size`

   升级 JDK 版本到 >= Java 8 u162 的版本。或者下载安装 JDK 相应的 JCE Unlimited Strength Jurisdiction Policy Files。

6. 在 Catalog 中配置 Kerberos 时，如果报错`SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]`，那么需要将`core-site.xml`文件放到`"${DORIS_HOME}/be/conf"`目录下。

    如果访问 HDFS 报错`No common protection layer between client and server`，检查客户端和服务端的`hadoop.rpc.protection`属性，使他们保持一致。

    ```
        <?xml version="1.0" encoding="UTF-8"?>
        <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
        
        <configuration>
        
            <property>
                <name>hadoop.security.authentication</name>
                <value>kerberos</value>
            </property>
            
        </configuration>
    ```

7. 在使用 Broker Load 时，配置了 Kerberos，如果报错`Cannot locate default realm.`。

   将 `-Djava.security.krb5.conf=/your-path` 配置项添加到 Broker Load 启动脚本的 `start_broker.sh` 的 `JAVA_OPTS`里。

8. 当在 Catalog 里使用 Kerberos 配置时，不能同时使用`hadoop.username`属性。

9. 使用 JDK 17 访问 Kerberos

    如果使用 JDK 17 运行 Doris 并访问 Kerberos 服务，可能会出现因使用已废弃的加密算法而导致无法访问的现象。需要在 krb5.conf 中添加 `allow_weak_crypto=true` 属性。或升级 Kerberos 的加密算法。

    详情参阅：<https://seanjmullan.org/blog/2021/09/14/jdk17#kerberos>

## JDBC Catalog

1. 通过 JDBC Catalog 连接 SQLServer 报错：`unable to find valid certification path to requested target`

   请在 `jdbc_url` 中添加 `trustServerCertificate=true` 选项。

2. 通过 JDBC Catalog 连接 MySQL 数据库，中文字符乱码，或中文字符条件查询不正确

   请在 `jdbc_url` 中添加 `useUnicode=true&characterEncoding=utf-8`

   > 注：1.2.3 版本后，使用 JDBC Catalog 连接 MySQL 数据库，会自动添加这些参数。

3. 通过 JDBC Catalog 连接 MySQL 数据库报错：`Establishing SSL connection without server's identity verification is not recommended`

   请在 `jdbc_url` 中添加 `useSSL=true`

4. 使用 JDBC Catalog 将 MySQL 数据同步到 Doris 中，日期数据同步错误。需要校验下 MySQL 的版本是否与 MySQL 的驱动包是否对应，比如 MySQL8 以上需要使用驱动 com.mysql.cj.jdbc.Driver。
   
5. 单个字段过大，查询时 BE 侧 Java 内存 OOM

   Jdbc Scanner 在通过 jdbc 读取时，由 session variable `batch_size` 决定每批次数据在 JVM 中处理的数量，如果单个字段过大，导致 `字段大小 * batch_size`(近似值，由于 JVM 中 static 以及数据 copy 占用)超过 JVM 内存限制，就会出现 OOM。

   解决方法：

   - 减小 `batch_size` 的值，可以通过 `set batch_size = 512;` 来调整，默认值为 4064。
   - 增大 BE 的 JVM 内存，通过修改 `JAVA_OPTS` 参数中的 `-Xmx` 来调整 JVM 最大堆内存大小。例如：`"-Xmx8g`。

## Hive Catalog

1. 通过 Hive Catalog 访问 Iceberg 或 Hive 表报错：`failed to get schema` 或 `Storage schema reading not supported`

   可以尝试以下方法：

   * 在 Hive 的 lib/ 目录放上 `iceberg` 运行时有关的 jar 包。

   * 在 `hive-site.xml` 配置：

       ```
       metastore.storage.schema.reader.impl=org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader
       ```

       配置完成后需要重启 Hive Metastore。

   * 在 Catalog 属性中添加 `"get_schema_from_table" = "true"`

       该参数自 2.1.10 和 3.0.6 版本支持。

2. 连接 Hive Catalog 报错：`Caused by: java.lang.NullPointerException`

   如 fe.log 中有如下堆栈：

    ```
    Caused by: java.lang.NullPointerException
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.getFilteredObjects(AuthorizationMetaStoreFilterHook.java:78) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.filterDatabases(AuthorizationMetaStoreFilterHook.java:55) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1548) ~[doris-fe.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1542) ~[doris-fe.jar:3.1.3]
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[?:1.8.0_181]
    ```

   可以尝试在 `create catalog` 语句中添加 `"metastore.filter.hook" = "org.apache.hadoop.hive.metastore.DefaultMetaStoreFilterHookImpl"` 解决。

3. 如果创建 Hive Catalog 后能正常`show tables`，但查询时报`java.net.UnknownHostException: xxxxx`

    可以在 CATALOG 的 PROPERTIES 中添加

    ```
    'fs.defaultFS' = 'hdfs://<your_nameservice_or_actually_HDFS_IP_and_port>'
    ```

4. Hive 1.x 的 orc 格式的表可能会遇到底层 orc 文件 schema 中列名为 `_col0`，`_col1`，`_col2`... 这类系统列名，此时需要在 catalog 配置中添加 `hive.version` 为 1.x.x，这样就会使用 hive 表中的列名进行映射。

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'hive.version' = '1.x.x'
    );
    ```

5. 使用 Catalog 查询表数据时发现与 Hive Metastore 相关的报错：`Invalid method name`，需要设置`hive.version`参数。

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'hive.version' = '2.x.x'
    );
    ```

6. 查询 ORC 格式的表，FE 报错 `Could not obtain block` 或 `Caused by: java.lang.NoSuchFieldError: types`

   对于 ORC 文件，在默认情况下，FE 会访问 HDFS 获取文件信息，进行文件切分。部分情况下，FE 可能无法访问到 HDFS。可以通过添加以下参数解决：

   `"hive.exec.orc.split.strategy" = "BI"`

   其他选项：HYBRID（默认），ETL。

7. 在 hive 上可以查到 hudi 表分区字段的值，但是在 doris 查不到。

    doris 和 hive 目前查询 hudi 的方式不一样，doris 需要在 hudi 表结构的 avsc 文件里添加上分区字段，如果没加，就会导致 doris 查询 partition_val 为空（即使设置了 hoodie.datasource.hive_sync.partition_fields=partition_val 也不可以）

    ```
    {
        "type": "record",
        "name": "record",
        "fields": [{
            "name": "partition_val",
            "type": [
                "null",
                "string"
                ],
            "doc": "Preset partition field, empty string when not partitioned",
            "default": null
            },
            {
            "name": "name",
            "type": "string",
            "doc": "Name"
            },
            {
            "name": "create_time",
            "type": "string",
            "doc": "Creation time"
            }
        ]
    }
    ```

8. 查询 hive 外表，遇到该报错：`java.lang.ClassNotFoundException: Class com.hadoop.compression.lzo.LzoCodec not found`

   去 hadoop 环境搜索`hadoop-lzo-*.jar`放在`"${DORIS_HOME}/fe/lib/"`目录下并重启 fe。

   从 2.0.2 版本起，可以将这个文件放置在 FE 的 `custom_lib/` 目录下（如不存在，手动创建即可），以防止升级集群时因为 lib 目录被替换而导致文件丢失。

9. 创建 hive 表指定 serde 为 `org.apache.hadoop.hive.contrib.serde2.MultiDelimitserDe`，访问表时报错：`storage schema reading not supported`

   在 hive-site.xml 文件中增加以下配置，并重启 hms 服务：

   ```
   <property>
      <name>metastore.storage.schema.reader.impl</name>
      <value>org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader</value>
   </property> 
   ```

10. 报错：java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty

    FE日志中完整报错信息如下：

    ```
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path exception. path=s3://bucket/part-*, err: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.hadoop.fs.s3a.AWSClientIOException: listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: javax.net.ssl.SSLException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.lang.RuntimeException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    ```

    尝试更新FE节点CA证书，使用 `update-ca-trust（CentOS/RockyLinux）`，然后重启FE进程即可。

11. BE 报错：`java.lang.InternalError`

    如果在 `be.INFO` 中看到类似如下错误：

    ```
    W20240506 15:19:57.553396 266457 jni-util.cpp:259] java.lang.InternalError
            at org.apache.hadoop.io.compress.zlib.ZlibDecompressor.init(Native Method)
            at org.apache.hadoop.io.compress.zlib.ZlibDecompressor.<init>(ZlibDecompressor.java:114)
            at org.apache.hadoop.io.compress.GzipCodec$GzipZlibDecompressor.<init>(GzipCodec.java:229)
            at org.apache.hadoop.io.compress.GzipCodec.createDecompressor(GzipCodec.java:188)
            at org.apache.hadoop.io.compress.CodecPool.getDecompressor(CodecPool.java:183)
            at org.apache.parquet.hadoop.CodecFactory$HeapBytesDecompressor.<init>(CodecFactory.java:99)
            at org.apache.parquet.hadoop.CodecFactory.createDecompressor(CodecFactory.java:223)
            at org.apache.parquet.hadoop.CodecFactory.getDecompressor(CodecFactory.java:212)
            at org.apache.parquet.hadoop.CodecFactory.getDecompressor(CodecFactory.java:43)
    ```

    是因为 Doris 自带的 libz.a 和系统环境中的 libz.so 冲突了。

    为了解决这个问题，需要先执行 `export LD_LIBRARY_PATH=/path/to/be/lib:$LD_LIBRARY_PATH` 然后重启 BE 进程。

12. 在插入 hive 数据的时候报错：`HiveAccessControlException Permission denied: user [user_a] does not have [UPDATE] privilege on [database/table]`。

    因为插入数据之后，需要更新对应的统计信息，这个更新的操作需要 alter 权限，所以要在 ranger 上给该用户新增 alter 权限。

## HDFS

1. 访问 HDFS 3.x 时报错：`java.lang.VerifyError: xxx`

   1.2.1 之前的版本中，Doris 依赖的 Hadoop 版本为 2.8。需更新至 2.10.2。或更新 Doris 至 1.2.2 之后的版本。

2. 使用 Hedged Read 优化 HDFS 读取慢的问题。

    在某些情况下，HDFS 的负载较高可能导致读取某个 HDFS 上的数据副本的时间较长，从而拖慢整体的查询效率。HDFS Client 提供了 Hedged Read 功能。
    该功能可以在一个读请求超过一定阈值未返回时，启动另一个读线程读取同一份数据，哪个先返回就是用哪个结果。

    注意：该功能可能会增加 HDFS 集群的负载，请酌情使用。

    可以通过以下方式开启这个功能：

    ```
    create catalog regression properties (
        'type'='hms',
        'hive.metastore.uris' = 'thrift://172.21.16.47:7004',
        'dfs.client.hedged.read.threadpool.size' = '128',
        'dfs.client.hedged.read.threshold.millis' = "500"
    );
    ```

    `dfs.client.hedged.read.threadpool.size` 表示用于 Hedged Read 的线程数，这些线程由一个 HDFS Client 共享。通常情况下，针对一个 HDFS 集群，BE 节点会共享一个 HDFS Client。

    `dfs.client.hedged.read.threshold.millis` 是读取阈值，单位毫秒。当一个读请求超过这个阈值未返回时，会触发 Hedged Read。

    开启后，可以在 Query Profile 中看到相关参数：

    `TotalHedgedRead`: 发起 Hedged Read 的次数。

    `HedgedReadWins`：Hedged Read 成功的次数（发起并且比原请求更快返回的次数）

    注意，这里的值是单个 HDFS Client 的累计值，而不是单个查询的数值。同一个 HDFS Client 会被多个查询复用。

3. `Couldn't create proxy provider class org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider`

    在 FE 和 BE 的 start 脚本中，会将环境变量 `HADOOP_CONF_DIR` 加入 CLASSPATH。如果 `HADOOP_CONF_DIR` 设置错误，比如指向了不存在的路径或错误路径，则可能加载到错误的 xxx-site.xml 文件，从而读取到错误的信息。

    需检查 `HADOOP_CONF_DIR` 是否配置正确，或将这个环境变量删除。

4. `BlockMissingExcetpion: Could not obtain block: BP-XXXXXXXXX No live nodes contain current block`

    可能的处理方式有：
    - 通过 `hdfs fsck file -files -blocks -locations` 来查看具体该文件是否健康。
    - 通过 `telnet` 来检查与 datanode 的连通性。

        在错误日志中可能会打印如下错误：

        ```
        No live nodes contain current block Block locations: DatanodeInfoWithStorage[10.70.150.122:50010,DS-7bba8ffc-651c-4617-90e1-6f45f9a5f896,DISK]
        ```

        可以先检查 Doris 集群与 `10.70.150.122:50010` 的连通性。

        另外，某些情况下，HDFS 集群会使用双网卡，有对内和对外 IP。此时，需使用域名来进行通信，需要在 Catalog 属性中添加：`"dfs.client.use.datanode.hostname" = "true"`。

        同时，请检查 `fe/conf` 和 `be/conf` 下放置的 `hdfs-site.xml` 文件中，该参数是否为 true。

    - 查看 datanode 日志。

        如果出现以下错误：

        ```
        org.apache.hadoop.hdfs.server.datanode.DataNode: Failed to read expected SASL data transfer protection handshake from client at /XXX.XXX.XXX.XXX:XXXXX. Perhaps the client is running an older version of Hadoop which does not support SASL data transfer protection
        ```

        则为当前 hdfs 开启了加密传输方式，而客户端未开启导致的错误。

        使用下面的任意一种解决方案即可：
        - 拷贝 `hdfs-site.xml` 以及 `core-site.xml` 到 `fe/conf` 和 `be/conf` 目录。(推荐)
        - 在 `hdfs-site.xml` 找到相应的配置 `dfs.data.transfer.protection`，并且在 catalog 里面设置该参数。

## DLF Catalog

1. 使用 DLF Catalog 时，BE 读在取 JindoFS 数据出现`Invalid address`，需要在`/ets/hosts`中添加日志中出现的域名到 IP 的映射。

2. 读取数据无权限时，使用`hadoop.username`属性指定有权限的用户。

3. DLF Catalog 中的元数据和 DLF 保持一致。当使用 DLF 管理元数据时，Hive 新导入的分区，可能未被 DLF 同步，导致出现 DLF 和 Hive 元数据不一致的情况，对此，需要先保证 Hive 元数据被 DLF 完全同步。

## 其他问题

1. Binary 类型映射到 Doris 后，查询乱码

    Doris 原生不支持 Binary 类型，所以各类数据湖或数据库中的 Binary 类型映射到 Doris 中，通常使用 String 类型进行映射。String 类型只能展示可打印字符。如果需要查询 Binary 的内容，可以使用 `TO_BASE64()` 函数转换为 Base64 编码后，在进行下一步处理。

2. 分析 Parquet 文件

    在查询 Parquet 文件时，由于不同系统生成的 Parquet 文件格式可能有所差异，比如 RowGroup 的数量，索引的值等，有时需要检查 Parquet 文件的元数据进行问题定位或性能分析。这里提供一个工具帮助用户更方便的分析 Parquet 文件：

    1. 下载并解压 [Apache Parquet Cli 1.14.0](https://github.com/morningman/tools/releases/download/apache-parquet-cli-1.14.0/apache-parquet-cli-1.14.0.tar.xz)
    2. 将需要分析的 Parquet 文件下载到本地，假设路径为 `/path/to/file.parquet`
    3. 使用如下命令分析 Parquet 文件元信息：

        `./parquet-tools meta /path/to/file.parquet`

    4. 更多功能，可参阅 [Apache Parquet Cli 文档](https://github.com/apache/parquet-java/tree/apache-parquet-1.14.0/parquet-cli)
