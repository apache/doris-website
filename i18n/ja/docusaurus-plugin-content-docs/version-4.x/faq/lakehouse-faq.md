---
{
  "title": "データレイクハウス FAQ",
  "language": "ja",
  "description": "これは通常、誤ったKerberos認証情報が原因です。次の手順に従ってトラブルシューティングを行うことができます："
}
---
## 証明書の問題

1. クエリ実行時に `curl 77: Problem with the SSL CA cert.` エラーが発生します。これは現在のシステム証明書が古すぎることを示しており、ローカルで更新する必要があります。
   - 最新のCA証明書を `https://curl.se/docs/caextract.html` からダウンロードできます。
   - ダウンロードした `cacert-xxx.pem` を `/etc/ssl/certs/` ディレクトリに配置してください。例： `sudo cp cacert-xxx.pem /etc/ssl/certs/ca-certificates.crt`。

2. クエリ実行時に次のエラーが発生します： `ERROR 1105 (HY000): errCode = 2, detailMessage = (x.x.x.x)[CANCELLED][INTERNAL_ERROR]error setting certificate verify locations: CAfile: /etc/ssl/certs/ca-certificates.crt CApath: none`。

```
yum install -y ca-certificates
ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
```
## Kerberos

1. Kerberosで認証されたHive Metastoreに接続する際、`GSS initiate failed`エラーが発生します。

   これは通常、誤ったKerberos認証情報が原因です。以下の手順でトラブルシューティングできます：

    1. 1.2.1より前のバージョンでは、Dorisが依存するlibhdfs3ライブラリはgsaslを有効にしていませんでした。1.2.2以降のバージョンに更新してください。
    2. 各コンポーネントに正しいkeytabとprincipalが設定されていることを確認し、keytabファイルがすべてのFEおよびBEノードに存在することを検証してください。

        - `hadoop.kerberos.keytab`/`hadoop.kerberos.principal`: Hadoop hdfsアクセスに使用され、hdfsの対応する値を入力します。
        - `hive.metastore.kerberos.principal`: hive metastoreに使用されます。

    3. principalのIPをドメイン名に置き換えてみてください（デフォルトの`_HOST`プレースホルダーを使用しないでください）。
    4. `/etc/krb5.conf`ファイルがすべてのFEおよびBEノードに存在することを確認してください。

2. Hive Catalogを通じてHiveデータベースに接続する際、エラーが発生します：`RemoteException: SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]`。

    `show databases`と`show tables`に問題がない場合にクエリ実行時にエラーが発生する場合は、以下の2つの手順に従ってください：
    - core-site.xmlとhdfs-site.xmlをfe/confとbe/confディレクトリに配置してください。
    - BEノードでKerberos kinitを実行し、BEを再起動してから、クエリを実行してください。
    
    Kerberosで設定されたテーブルをクエリする際に`GSSException: No valid credentials provided (Mechanism level: Failed to find any Kerberos Ticket)`エラーが発生した場合、通常FEとBEノードを再起動することで問題が解決されます。
    
    - すべてのノードを再起動する前に、`"${DORIS_HOME}/be/conf/be.conf"`のJAVA_OPTSパラメータに`-Djavax.security.auth.useSubjectCredsOnly=false`を設定して、アプリケーションではなく基盤メカニズムを通じてJAAS認証情報を取得してください。
    - 一般的なJAASエラーの解決策については、[JAAS Troubleshooting](https://docs.oracle.com/javase/8/docs/technotes/guides/security/jgss/tutorials/Troubleshooting.html)を参照してください。
    
    CatalogでKerberosを設定する際の`Unable to obtain password from user`エラーを解決するには：
    
    - 使用されているprincipalが`klist -kt your.keytab`でklistに記載されていることを確認してください。
    - `yarn.resourcemanager.principal`などの設定の不足がないか、catalogの設定を確認してください。
    - 上記のチェックで問題がない場合、システムのパッケージマネージャによってインストールされたJDKバージョンが特定の暗号化アルゴリズムをサポートしていない可能性があります。手動でJDKをインストールし、`JAVA_HOME`環境変数を設定することを検討してください。
    - Kerberosは通常、暗号化にAES-256を使用します。Oracle JDKの場合、JCEをインストールする必要があります。一部のOpenJDKディストリビューションは自動的に無制限強度JCEを提供するため、個別のインストールは不要です。
    - JCEバージョンはJDKバージョンに対応します。JDKバージョンに基づいて適切なJCE zipパッケージをダウンロードし、`$JAVA_HOME/jre/lib/security`ディレクトリに抽出してください：
      - JDK6: [JCE6](http://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
      - JDK7: [JCE7](http://www.oracle.com/technetwork/java/embedded/embedded-se/downloads/jce-7-download-432124.html)
      - JDK8: [JCE8](http://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)
    
    KMSでHDFSにアクセスする際に`java.security.InvalidKeyException: Illegal key size`エラーが発生した場合、JDKバージョンをJava 8 u162以上にアップグレードするか、対応するJCE Unlimited Strength Jurisdiction Policy Filesをインストールしてください。
    
    CatalogでKerberosを設定して`SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]`エラーが発生した場合、`core-site.xml`ファイルを`"${DORIS_HOME}/be/conf"`ディレクトリに配置してください。
    
    HDFSにアクセスして`No common protection layer between client and server`エラーが発生した場合、クライアントとサーバーの`hadoop.rpc.protection`プロパティが一致していることを確認してください。

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
Broker LoadでKerberosを設定して使用する際に`Cannot locate default realm.`エラーが発生した場合：
    
    Broker Loadの`start_broker.sh`スクリプトの`JAVA_OPTS`に設定項目`-Djava.security.krb5.conf=/your-path`を追加してください。

3. CatalogでKerberos設定を使用する場合、`hadoop.username`プロパティを同時に使用することはできません。

4. JDK 17でKerberosにアクセスする

    JDK 17でDorisを実行してKerberosサービスにアクセスする際、非推奨の暗号化アルゴリズムの使用によりアクセスに問題が発生する場合があります。krb5.confに`allow_weak_crypto=true`プロパティを追加するか、Kerberosの暗号化アルゴリズムをアップグレードする必要があります。

    詳細については、以下を参照してください：<https://seanjmullan.org/blog/2021/09/14/jdk17#kerberos>

## JDBC Catalog

1. JDBC Catalog経由でSQLServerへの接続エラー：`unable to find valid certification path to requested target`

   `jdbc_url`に`trustServerCertificate=true`オプションを追加してください。

2. JDBC Catalog経由でMySQLデータベースに接続すると中国語文字が文字化けするか、中国語文字のクエリ条件が正しくない

   `jdbc_url`に`useUnicode=true&characterEncoding=utf-8`を追加してください。

   > 注意：バージョン1.2.3以降、JDBC Catalog経由でMySQLデータベースに接続する際、これらのパラメータは自動的に追加されます。

3. JDBC Catalog経由でMySQLデータベースへの接続エラー：`Establishing SSL connection without server's identity verification is not recommended`

   `jdbc_url`に`useSSL=true`を追加してください。

4. JDBC Catalogを使用してMySQLデータをDorisに同期する際、日付データの同期エラーが発生します。MySQLバージョンがMySQLドライバパッケージと一致するかを確認してください。例えば、MySQL 8以降ではドライバcom.mysql.cj.jdbc.Driverが必要です。

5. 単一のフィールドが大きすぎる場合、クエリ中にBE側でJavaメモリOOMが発生します。

   Jdbc ScannerがJDBC経由でデータを読み取る際、セッション変数`batch_size`がJVMで1バッチあたりに処理される行数を決定します。単一のフィールドが大きすぎる場合、`field_size * batch_size`（概算値、JVM静的メモリとデータコピーオーバーヘッドを考慮）がJVMメモリ制限を超えてOOMが発生する可能性があります。

   解決策：

   - `set batch_size = 512;`を実行して`batch_size`値を削減してください。デフォルト値は4064です。
   - `JAVA_OPTS`の`-Xmx`パラメータを変更してBE JVMメモリを増加してください。例：`-Xmx8g`。

## Hive Catalog

1. Hive Catalog経由でIcebergまたはHiveテーブルにアクセスするとエラーが報告される：`failed to get schema`または`Storage schema reading not supported`

    以下の方法を試すことができます：
    
    * `iceberg`ランタイム関連のjarパッケージをHiveのlib/ディレクトリに配置する。
    
    * `hive-site.xml`で設定する：

        ```
        metastore.storage.schema.reader.impl=org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader
        ```
設定が完了した後、Hive Metastoreを再起動する必要があります。

* Catalogプロパティに`"get_schema_from_table" = "true"`を追加してください

    このパラメータはバージョン2.1.10および3.0.6以降でサポートされています。

2. Hive Catalogへの接続エラー: `Caused by: java.lang.NullPointerException`

   fe.logに以下のスタックトレースが含まれている場合:

    ```
    Caused by: java.lang.NullPointerException
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.getFilteredObjects(AuthorizationMetaStoreFilterHook.java:78) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.filterDatabases(AuthorizationMetaStoreFilterHook.java:55) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1548) ~[doris-fe.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1542) ~[doris-fe.jar:3.1.3]
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[?:1.8.0_181]
    ```
`create catalog`文で`"metastore.filter.hook" = "org.apache.hadoop.hive.metastore.DefaultMetaStoreFilterHookImpl"`を追加して解決してみてください。

3. Hive Catalogを作成した後、`show tables`は正常に動作するがクエリ実行時に`java.net.UnknownHostException: xxxxx`が発生する場合

    CATALOGのPROPERTIESに以下を追加してください：

    ```
    'fs.defaultFS' = 'hdfs://<your_nameservice_or_actually_HDFS_IP_and_port>'
    ```
4. Hive 1.xのorc形式のテーブルでは、基礎となるorcファイルスキーマのシステムカラム名が`_col0`、`_col1`、`_col2`などとして現れる場合があります。この場合、hiveテーブルのカラム名とマッピングするために、カタログ設定で`hive.version`を1.x.xとして追加してください。

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'hive.version' = '1.x.x'
    );
    ```
5. Catalogを使用してテーブルデータをクエリする際に、`Invalid method name`などのHive Metastoreに関連するエラーが発生した場合は、`hive.version`パラメータを設定してください。

6. ORC形式のテーブルをクエリする際に、FEが`Could not obtain block`や`Caused by: java.lang.NoSuchFieldError: types`を報告する場合、FEがデフォルトでHDFSにアクセスしてファイル情報を取得し、ファイル分割を実行することが原因の可能性があります。場合によっては、FEがHDFSにアクセスできない可能性があります。これは次のパラメータを追加することで解決できます：`"hive.exec.orc.split.strategy" = "BI"`。その他のオプションには、HYBRID（デフォルト）およびETLがあります。

7. Hiveでは、Hudiテーブルのパーティションフィールド値を見つけることができますが、Dorisでは見つけることができません。DorisとHiveは現在、Hudiをクエリする方法が異なります。Dorisでは、Hudiテーブルのavscファイル構造にパーティションフィールドを追加する必要があります。追加されていない場合、Dorisはpartition_valが空の状態でクエリします（`hoodie.datasource.hive_sync.partition_fields=partition_val`が設定されていても）。

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
8. Hive外部テーブルをクエリする際に、エラー`java.lang.ClassNotFoundException: Class com.hadoop.compression.lzo.LzoCodec not found`が発生した場合は、Hadoop環境で`hadoop-lzo-*.jar`を検索し、`"${DORIS_HOME}/fe/lib/"`ディレクトリに配置してFEを再起動してください。バージョン2.0.2以降では、このファイルをFEの`custom_lib/`ディレクトリ（存在しない場合は手動で作成）に配置することで、libディレクトリが置き換えられることによるクラスターアップグレード時のファイル損失を防ぐことができます。

9. serdeを`org.apache.hadoop.hive.contrib.serde2.MultiDelimitserDe`として指定してHiveテーブルを作成し、テーブルにアクセスする際にエラー`storage schema reading not supported`が発生した場合は、hive-site.xmlファイルに以下の設定を追加してHMSサービスを再起動してください：

    ```
    <property>
      <name>metastore.storage.schema.reader.impl</name>
      <value>org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader</value>
   </property> 
    ```
10. エラー: `java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty`。FEログの完全なエラーメッセージは以下の通りです:

    ```
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path exception. path=s3://bucket/part-*, err: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.hadoop.fs.s3a.AWSClientIOException: listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: javax.net.ssl.SSLException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.lang.RuntimeException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    ```
`update-ca-trust (CentOS/RockyLinux)`を使用してFEノード上のCA証明書を更新し、その後FEプロセスを再起動してみてください。

11. BEエラー：`java.lang.InternalError`。`be.INFO`に以下のようなエラーが表示される場合：

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
Doris の組み込み `libz.a` がシステム環境の `libz.so` と競合するためです。この問題を解決するには、まず `export LD_LIBRARY_PATH=/path/to/be/lib:$LD_LIBRARY_PATH` を実行し、その後 BE プロセスを再起動してください。

12. Hive にデータを挿入する際に `HiveAccessControlException Permission denied: user [user_a] does not have [UPDATE] privilege on [database/table]` エラーが発生しました。

    データを挿入した後、対応する統計情報を更新する必要があり、この更新操作には alter 権限が必要です。したがって、Ranger でこのユーザーに alter 権限を追加する必要があります。

13. ORC ファイルをクエリする際に  
   `Orc row reader nextBatch failed. reason = Can't open /usr/share/zoneinfo/+08:00`  
   のようなエラーが発生する場合。

   まず現在のセッションの `time_zone` 設定を確認してください。`Asia/Shanghai` などの地域ベースのタイムゾーン名の使用を推奨します。

   セッションタイムゾーンが既に `Asia/Shanghai` に設定されているにもかかわらずクエリが失敗する場合は、ORC ファイルがタイムゾーン `+08:00` で生成されたことを示しています。クエリ実行中に ORC フッターを解析する際にこのタイムゾーンが必要になります。この場合、`/usr/share/zoneinfo/` ディレクトリ配下に `+08:00` を同等のタイムゾーンにポイントするシンボリックリンクを作成してみてください。

## HDFS

1. HDFS 3.x にアクセスする際に `java.lang.VerifyError: xxx` エラーが発生する場合、1.2.1 より前のバージョンでは、Doris は Hadoop バージョン 2.8 に依存しています。2.10.2 にアップデートするか、Doris を 1.2.2 以降のバージョンにアップグレードする必要があります。

2. 低速な HDFS 読み取りを最適化するために Hedged Read を使用する。場合によっては、HDFS の高負荷により特定の HDFS 上のデータレプリカの読み取り時間が長くなり、全体的なクエリ効率が低下することがあります。HDFS Client は Hedged Read 機能を提供しています。この機能は、読み取りリクエストが一定の閾値を超えても戻らない場合に、同じデータを読み取る別の読み取りスレッドを開始し、最初に返された結果を使用します。

    注意：この機能は HDFS クラスターの負荷を増加させる可能性があるため、慎重に使用してください。

    この機能は以下により有効にできます：

    ```
    create catalog regression properties (
        'type'='hms',
        'hive.metastore.uris' = 'thrift://172.21.16.47:7004',
        'dfs.client.hedged.read.threadpool.size' = '128',
        'dfs.client.hedged.read.threshold.millis' = "500"
    );
    ```
`dfs.client.hedged.read.threadpool.size`はHedged Readに使用されるスレッド数を表し、これらはHDFS Clientによって共有されます。通常、HDFSクラスターでは、BEノードがHDFS Clientを共有します。

`dfs.client.hedged.read.threshold.millis`は読み取り閾値をミリ秒で表します。読み取りリクエストがこの閾値を超えても戻らない場合、Hedged Readがトリガーされます。

有効にすると、Query Profileで関連パラメータを確認できます：

`TotalHedgedRead`: Hedged Readが開始された回数。

`HedgedReadWins`: 成功したHedged Readの回数（リクエストが開始され、元のリクエストより速く戻った回数）

これらの値は単一のクエリではなく、単一のHDFS Clientに対する累積値であることに注意してください。同じHDFS Clientは複数のクエリで再利用される可能性があります。

3. `Couldn't create proxy provider class org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider`

    FEとBEの起動スクリプトでは、環境変数`HADOOP_CONF_DIR`がCLASSPATHに追加されます。`HADOOP_CONF_DIR`が存在しないパスや誤ったパスを指すなど、正しく設定されていない場合、間違ったxxx-site.xmlファイルを読み込み、不正な情報を読み取る可能性があります。

    `HADOOP_CONF_DIR`が正しく設定されているか確認するか、この環境変数を削除してください。

4. `BlockMissingExcetpion: Could not obtain block: BP-XXXXXXXXX No live nodes contain current block`

    可能な解決策は以下の通りです：
    - `hdfs fsck file -files -blocks -locations`を使用してファイルが正常かチェックしてください。
    - `telnet`を使用してdatanodeとの接続性をチェックしてください。

        以下のエラーがエラーログに出力される場合があります：

        ```
        No live nodes contain current block Block locations: DatanodeInfoWithStorage[10.70.150.122:50010,DS-7bba8ffc-651c-4617-90e1-6f45f9a5f896,DISK]
        ```
Dorisクラスタと`10.70.150.122:50010`間の接続性をまず確認できます。

さらに、HDFSクラスタが内部IPと外部IPでデュアルネットワークを使用している場合があります。この場合、通信にはドメイン名が必要で、以下をCatalogプロパティに追加する必要があります：`"dfs.client.use.datanode.hostname" = "true"`。

同時に、`fe/conf`と`be/conf`の下に配置された`hdfs-site.xml`ファイルで、このパラメータがtrueになっているかを確認してください。

- datanodeログを確認してください。

以下のエラーが発生した場合：

        ```
        org.apache.hadoop.hdfs.server.datanode.DataNode: Failed to read expected SASL data transfer protection handshake from client at /XXX.XXX.XXX.XXX:XXXXX. Perhaps the client is running an older version of Hadoop which does not support SASL data transfer protection
        ```
これは、現在のhdfsが暗号化された転送を有効にしているが、クライアントが有効にしていないため、エラーが発生していることを意味します。

        以下のいずれかの解決策を使用してください：
        - `hdfs-site.xml`と`core-site.xml`を`fe/conf`と`be/conf`にコピーする。（推奨）
        - `hdfs-site.xml`で、対応する設定`dfs.data.transfer.protection`を見つけ、このパラメータをcatalogに設定する。

## DLF Catalog

1. DLF Catalogを使用する際、BEがJindoFSデータを読み取り中に`Invalid address`が発生する場合は、ログに表示されるドメイン名をIPマッピングに`/etc/hosts`に追加してください。

2. データを読み取る権限がない場合は、`hadoop.username`プロパティを使用して権限を持つユーザーを指定してください。

3. DLF Catalogのメタデータは、DLFと一致している必要があります。DLFを使用してメタデータを管理する場合、Hiveで新しくインポートされたパーティションがDLFによって同期されない可能性があり、DLFとHiveメタデータ間の不整合が生じます。これに対処するため、HiveメタデータがDLFによって完全に同期されていることを確認してください。

## その他の問題

1. Binary型をDorisにマッピングした後、クエリ結果が文字化けする

    DorisはネイティブでBinary型をサポートしていないため、さまざまなデータレイクやデータベースからのBinary型をDorisにマッピングする際、通常はString型を使用して行われます。String型は印刷可能文字のみを表示できます。Binaryデータの内容をクエリする必要がある場合は、`TO_BASE64()`関数を使用してBase64エンコーディングに変換してから、さらなる処理を行うことができます。

2. Parquetファイルの分析

    Parquetファイルをクエリする際、異なるシステムによって生成されるParquetファイルの形式の潜在的な違い（RowGroupsの数、インデックス値など）により、問題の特定やパフォーマンス分析のためにParquetファイルのメタデータを確認する必要がある場合があります。以下は、ユーザーがParquetファイルをより便利に分析できるよう提供されるツールです：

    1. [Apache Parquet Cli 1.14.0](https://github.com/morningman/tools/releases/download/apache-parquet-cli-1.14.0/apache-parquet-cli-1.14.0.tar.xz)をダウンロードして解凍する
    2. 分析するParquetファイルをローカルマシンにダウンロードし、パスを`/path/to/file.parquet`と仮定する
    3. 以下のコマンドを使用してParquetファイルのメタデータを分析する：

        `./parquet-tools meta /path/to/file.parquet`

    4. その他の機能については、[Apache Parquet Cliドキュメント](https://github.com/apache/parquet-java/tree/apache-parquet-1.14.0/parquet-cli)を参照してください
