---
{
  "title": "データレイクハウス FAQ",
  "language": "ja",
  "description": "これは通常、不正確なKerberos認証情報が原因です。以下の手順に従ってトラブルシューティングを行うことができます："
}
---
## 証明書の問題

1. クエリ実行時に `curl 77: Problem with the SSL CA cert.` エラーが発生する場合、現在のシステム証明書が古すぎるため、ローカルで更新する必要があります。
   - 最新のCA証明書を `https://curl.se/docs/caextract.html` からダウンロードできます。
   - ダウンロードした `cacert-xxx.pem` を `/etc/ssl/certs/` ディレクトリに配置します。例：`sudo cp cacert-xxx.pem /etc/ssl/certs/ca-certificates.crt`

2. クエリ実行時に次のエラーが発生する場合：`ERROR 1105 (HY000): errCode = 2, detailMessage = (x.x.x.x)[CANCELLED][INTERNAL_ERROR]error setting certificate verify locations: CAfile: /etc/ssl/certs/ca-certificates.crt CApath: none`

```
yum install -y ca-certificates
ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
```
## Kerberos

1. Kerberosで認証されたHive Metastoreに接続する際、`GSS initiate failed`エラーが発生します。

   これは通常、Kerberos認証情報が正しくないことが原因です。以下の手順でトラブルシューティングできます：

    1. 1.2.1より前のバージョンでは、Dorisが依存するlibhdfs3ライブラリでgsaslが有効になっていませんでした。1.2.2以降のバージョンにアップデートしてください。
    2. 各コンポーネントに正しいkeytabとprincipalが設定されていることを確認し、keytabファイルがすべてのFEおよびBEノードに存在することを確認してください。

        - `hadoop.kerberos.keytab`/`hadoop.kerberos.principal`：Hadoop hdfsアクセスに使用され、hdfsに対応する値を入力します。
        - `hive.metastore.kerberos.principal`：hive metastoreに使用されます。

    3. principalのIPをドメイン名に置き換えてみてください（デフォルトの`_HOST`プレースホルダーは使用しないでください）。
    4. `/etc/krb5.conf`ファイルがすべてのFEおよびBEノードに存在することを確認してください。

2. Hive CatalogからHiveデータベースに接続する際、エラーが発生します：`RemoteException: SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]`。

    `show databases`と`show tables`に問題がないのにクエリ中にエラーが発生する場合は、以下の2つの手順に従ってください：
    - core-site.xmlとhdfs-site.xmlをfe/confとbe/confディレクトリに配置します。
    - BEノードでKerberos kinitを実行し、BEを再起動してからクエリを実行してください。
    
    Kerberosで設定されたテーブルをクエリしている際に`GSSException: No valid credentials provided (Mechanism level: Failed to find any Kerberos Ticket)`エラーが発生した場合、FEとBEノードを再起動することで通常問題が解決されます。
    
    - すべてのノードを再起動する前に、`"${DORIS_HOME}/be/conf/be.conf"`のJAVA_OPTSパラメータで`-Djavax.security.auth.useSubjectCredsOnly=false`を設定して、アプリケーションではなく基盤メカニズムを通じてJAAS認証情報を取得してください。
    - 一般的なJAASエラーの解決方法については、[JAAS Troubleshooting](https://docs.oracle.com/javase/8/docs/technotes/guides/security/jgss/tutorials/Troubleshooting.html)を参照してください。
    
    CatalogでKerberosを設定する際の`Unable to obtain password from user`エラーを解決するには：
    
    - 使用するprincipalが`klist -kt your.keytab`で確認してklistに記載されていることを確認してください。
    - `yarn.resourcemanager.principal`などの設定不足がないかカタログ設定を確認してください。
    - 上記の確認で問題がない場合、システムのパッケージマネージャーでインストールされたJDKバージョンが特定の暗号化アルゴリズムをサポートしていない可能性があります。JDKを手動でインストールし、`JAVA_HOME`環境変数を設定することを検討してください。
    - Kerberosは通常暗号化にAES-256を使用します。Oracle JDKの場合、JCEをインストールする必要があります。一部のOpenJDKディストリビューションは無制限強度JCEを自動的に提供するため、別途インストールする必要がありません。
    - JCEバージョンはJDKバージョンに対応しています。JDKバージョンに基づいて適切なJCE zipパッケージをダウンロードし、`$JAVA_HOME/jre/lib/security`ディレクトリに展開してください：
      - JDK6: [JCE6](http://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
      - JDK7: [JCE7](http://www.oracle.com/technetwork/java/embedded/embedded-se/downloads/jce-7-download-432124.html)
      - JDK8: [JCE8](http://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)
    
    KMS付きHDFSにアクセスする際に`java.security.InvalidKeyException: Illegal key size`エラーが発生した場合、JDKバージョンをJava 8 u162以上にアップグレードするか、対応するJCE Unlimited Strength Jurisdiction Policy Filesをインストールしてください。
    
    CatalogでKerberosを設定した結果`SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]`エラーが発生する場合、`core-site.xml`ファイルを`"${DORIS_HOME}/be/conf"`ディレクトリに配置してください。
    
    HDFSにアクセスした結果`No common protection layer between client and server`エラーが発生する場合、クライアントとサーバーの`hadoop.rpc.protection`プロパティが一致していることを確認してください。

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
Kerberos が設定されたBroker Loadを使用する際に`Cannot locate default realm.`エラーが発生した場合：
    
    Broker Load用の`start_broker.sh`スクリプト内の`JAVA_OPTS`に設定項目`-Djava.security.krb5.conf=/your-path`を追加してください。

3. CatalogでKerberos設定を使用する場合、`hadoop.username`プロパティを同時に使用することはできません。

4. JDK 17でKerberosにアクセスする

    DorisをJDK 17で実行してKerberosサービスにアクセスする際、非推奨の暗号化アルゴリズムの使用によりアクセスに問題が発生することがあります。krb5.confに`allow_weak_crypto=true`プロパティを追加するか、Kerberosの暗号化アルゴリズムをアップグレードする必要があります。

    詳細については、以下を参照してください：<https://seanjmullan.org/blog/2021/09/14/jdk17#kerberos>

## JDBC Catalog

1. JDBC Catalog経由でSQLServerに接続する際のエラー：`unable to find valid certification path to requested target`

   `jdbc_url`に`trustServerCertificate=true`オプションを追加してください。

2. JDBC Catalog経由でMySQLデータベースに接続すると中国語文字が文字化けしたり、中国語文字のクエリ条件が正しく処理されない

   `jdbc_url`に`useUnicode=true&characterEncoding=utf-8`を追加してください。

   > 注意：バージョン1.2.3以降、JDBC Catalog経由でMySQLデータベースに接続する際、これらのパラメータは自動的に追加されます。

3. JDBC Catalog経由でMySQLデータベースに接続する際のエラー：`Establishing SSL connection without server's identity verification is not recommended`

   `jdbc_url`に`useSSL=true`を追加してください。

4. JDBC Catalogを使用してMySQLデータをDorisに同期する際、日付データの同期エラーが発生します。MySQLのバージョンとMySQLドライバパッケージが一致しているかを確認してください。例えば、MySQL 8以上では、ドライバcom.mysql.cj.jdbc.Driverが必要です。

5. 単一のフィールドが大きすぎる場合、クエリ中にBE側でJavaメモリOOMが発生します。

   Jdbc ScannerがJDBC経由でデータを読み取る際、セッション変数`batch_size`がJVMでバッチあたりに処理される行数を決定します。単一のフィールドが大きすぎる場合、`field_size * batch_size`（概算値、JVM静的メモリとデータコピーのオーバーヘッドを考慮）がJVMメモリ制限を超え、OOMが発生する可能性があります。

   解決策：

   - `set batch_size = 512;`を実行して`batch_size`の値を小さくしてください。デフォルト値は4064です。
   - `JAVA_OPTS`の`-Xmx`パラメータを変更してBE JVMメモリを増やしてください。例：`-Xmx8g`。

## Hive Catalog

1. Hive Catalog経由でIcebergまたはHiveテーブルにアクセスする際に`failed to get schema`または`Storage schema reading not supported`エラーが報告される

    以下の方法を試すことができます：
    
    * Hiveのlib/ディレクトリに`iceberg`ランタイム関連のjarパッケージを配置してください。
    
    * `hive-site.xml`で設定してください：

        ```
        metastore.storage.schema.reader.impl=org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader
        ```
設定が完了したら、Hive Metastoreを再起動する必要があります。

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

3. Hive Catalogを作成後、`show tables`は正常に動作するがクエリで`java.net.UnknownHostException: xxxxx`が発生する場合

    CATALOGのPROPERTIESに以下を追加してください：

    ```
    'fs.defaultFS' = 'hdfs://<your_nameservice_or_actually_HDFS_IP_and_port>'
    ```
4. Hive 1.xのorc形式のテーブルでは、基盤となるorcファイルスキーマ内のシステムカラム名が`_col0`、`_col1`、`_col2`などとして現れる場合があります。この場合、カタログ設定で`hive.version`を1.x.xとして追加し、hiveテーブル内のカラム名とマッピングしてください。

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'hive.version' = '1.x.x'
    );
    ```
5. Catalogを使用してテーブルデータをクエリする際に、`Invalid method name`などのHive Metastoreに関連するエラーが発生する場合は、`hive.version`パラメータを設定してください。

6. ORC形式のテーブルをクエリする際に、FEが`Could not obtain block`または`Caused by: java.lang.NoSuchFieldError: types`を報告する場合、これはFEがデフォルトでHDFSにアクセスしてファイル情報を取得し、ファイル分割を実行することが原因である可能性があります。場合によっては、FEがHDFSにアクセスできない場合があります。これは以下のパラメータを追加することで解決できます：`"hive.exec.orc.split.strategy" = "BI"`。その他のオプションには、HYBRID（デフォルト）およびETLがあります。

7. Hiveでは、HudiテーブルのパーティションフィールドValues を見つけることができますが、Dorisでは見つけることができません。DorisとHiveは現在、Hudiをクエリする方法が異なります。Dorisでは、Hudiテーブルのavscファイル構造にパーティションフィールドを追加する必要があります。追加しない場合、Dorisは（`hoodie.datasource.hive_sync.partition_fields=partition_val`が設定されていても）partition_valが空の状態でクエリを実行します。

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
8. Hive外部テーブルをクエリする際に、エラー`java.lang.ClassNotFoundException: Class com.hadoop.compression.lzo.LzoCodec not found`が発生した場合は、Hadoop環境で`hadoop-lzo-*.jar`を検索し、`"${DORIS_HOME}/fe/lib/"`ディレクトリに配置してFEを再起動してください。バージョン2.0.2以降では、このファイルをFEの`custom_lib/`ディレクトリ（存在しない場合は手動で作成）に配置することで、クラスタのアップグレード時にlibディレクトリが置き換えられることによるファイル損失を防ぐことができます。

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
FEノードで`update-ca-trust (CentOS/RockyLinux)`を使用してCA証明書を更新し、その後FEプロセスを再起動してください。

11. BEエラー：`java.lang.InternalError`。`be.INFO`で以下のようなエラーが表示される場合：

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
これは、Dorisに組み込まれた`libz.a`がシステム環境の`libz.so`と競合するためです。この問題を解決するには、まず`export LD_LIBRARY_PATH=/path/to/be/lib:$LD_LIBRARY_PATH`を実行してから、BEプロセスを再起動してください。

12. Hiveにデータを挿入する際に、`HiveAccessControlException Permission denied: user [user_a] does not have [UPDATE] privilege on [database/table]`というエラーが発生しました。

    データの挿入後に対応する統計情報を更新する必要があり、この更新操作にはalter権限が必要です。したがって、Rangerでこのユーザーにalter権限を追加する必要があります。

13. ORCファイルをクエリする際に、  
   `Orc row reader nextBatch failed. reason = Can't open /usr/share/zoneinfo/+08:00`  
   のようなエラーが発生する場合。

   まず現在のセッションの`time_zone`設定を確認してください。`Asia/Shanghai`などの地域ベースのタイムゾーン名を使用することをお勧めします。

   セッションのタイムゾーンが既に`Asia/Shanghai`に設定されているにも関わらずクエリが失敗する場合は、ORCファイルがタイムゾーン`+08:00`で生成されたことを示します。クエリ実行時に、ORCフッターを解析する際にこのタイムゾーンが必要になります。この場合、`/usr/share/zoneinfo/`ディレクトリ下に`+08:00`を等価なタイムゾーンにポイントするシンボリックリンクを作成してみてください。

## HDFS

1. HDFS 3.xにアクセスする際に`java.lang.VerifyError: xxx`エラーが発生した場合、1.2.1より前のバージョンでは、DorisはHadoopバージョン2.8に依存しています。2.10.2にアップデートするか、Dorisを1.2.2以降のバージョンにアップグレードする必要があります。

2. Hedged Readを使用して低速なHDFS読み取りを最適化します。場合によっては、HDFSへの高負荷により、特定のHDFS上のデータレプリカの読み取り時間が長くなり、全体のクエリ効率が低下する可能性があります。HDFS ClientはHedged Read機能を提供しています。この機能は、読み取り要求が一定の閾値を超えても結果が返されない場合に、同じデータを読み取る別の読み取りスレッドを開始し、最初に返された結果を使用します。

    注意：この機能はHDFSクラスタの負荷を増加させる可能性があるため、慎重に使用してください。

    この機能を有効にするには：

    ```
    create catalog regression properties (
        'type'='hms',
        'hive.metastore.uris' = 'thrift://172.21.16.47:7004',
        'dfs.client.hedged.read.threadpool.size' = '128',
        'dfs.client.hedged.read.threshold.millis' = "500"
    );
    ```
`dfs.client.hedged.read.threadpool.size`はHedged Readに使用されるスレッド数を表し、これらはHDFS Clientで共有されます。通常、HDFSクラスターでは、BEノードはHDFS Clientを共有します。

`dfs.client.hedged.read.threshold.millis`は読み取り閾値をミリ秒で表します。読み取りリクエストがこの閾値を超えても返されない場合、Hedged Readがトリガーされます。

有効にすると、Query Profileで関連パラメータを確認できます：

`TotalHedgedRead`: Hedged Readが開始された回数。

`HedgedReadWins`: 成功したHedged Readの回数（リクエストが開始され、元のリクエストよりも速く返された回数）

これらの値は単一のクエリではなく、単一のHDFS Clientの累積値であることに注意してください。同一のHDFS Clientは複数のクエリで再利用できます。

3. `Couldn't create proxy provider class org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider`

    FEとBEの起動スクリプトでは、環境変数`HADOOP_CONF_DIR`がCLASSPATHに追加されます。`HADOOP_CONF_DIR`が間違って設定されている場合、存在しないパスや不正なパスを指していると、間違ったxxx-site.xmlファイルを読み込み、不正な情報を読み取る結果となる可能性があります。

    `HADOOP_CONF_DIR`が正しく設定されているかを確認するか、この環境変数を削除してください。

4. `BlockMissingExcetpion: Could not obtain block: BP-XXXXXXXXX No live nodes contain current block`

    可能な解決策は以下を含みます：
    - `hdfs fsck file -files -blocks -locations`を使用してファイルが健全かを確認する。
    - `telnet`を使用してdatanodeとの接続性を確認する。

        以下のエラーがエラーログに出力される可能性があります：

        ```
        No live nodes contain current block Block locations: DatanodeInfoWithStorage[10.70.150.122:50010,DS-7bba8ffc-651c-4617-90e1-6f45f9a5f896,DISK]
        ```
まず、Dorisクラスターと`10.70.150.122:50010`間の接続性を確認できます。

さらに、場合によってはHDFSクラスターが内部IPと外部IPを持つデュアルネットワークを使用します。この場合、通信にはドメイン名が必要で、Catalogプロパティに以下を追加する必要があります：`"dfs.client.use.datanode.hostname" = "true"`。

同時に、`fe/conf`と`be/conf`の下に配置された`hdfs-site.xml`ファイルでパラメータがtrueになっているかを確認してください。

- datanodeログを確認してください。

以下のエラーが発生した場合：

        ```
        org.apache.hadoop.hdfs.server.datanode.DataNode: Failed to read expected SASL data transfer protection handshake from client at /XXX.XXX.XXX.XXX:XXXXX. Perhaps the client is running an older version of Hadoop which does not support SASL data transfer protection
        ```
現在のhdfsで暗号化送信が有効になっているが、クライアントでは有効になっていないため、エラーが発生していることを意味します。

        以下のいずれかの解決方法を使用してください：
        - `hdfs-site.xml` と `core-site.xml` を `fe/conf` と `be/conf` にコピーする。（推奨）
        - `hdfs-site.xml` で対応する設定 `dfs.data.transfer.protection` を見つけて、このパラメータをcatalogで設定する。

## DLF Catalog

1. DLF Catalogを使用する際、BEがJindoFSデータを読み取り中に `Invalid address` が発生した場合、ログに表示されるドメイン名をIPマッピングに `/etc/hosts` に追加してください。

2. データを読み取る権限がない場合、`hadoop.username` プロパティを使用して権限を持つユーザーを指定してください。

3. DLF Catalogのメタデータは、DLFと一致している必要があります。DLFを使用してメタデータを管理する際、Hiveで新しくインポートされたパーティションがDLFによって同期されず、DLFとHiveのメタデータ間で不整合が生じる可能性があります。これに対処するため、HiveメタデータがDLFによって完全に同期されていることを確認してください。

## その他の問題

1. Binary型をDorisにマッピングした後のクエリ結果の文字化け

    DorisはネイティブでBinary型をサポートしていないため、さまざまなデータレイクやデータベースからBinary型をDorisにマッピングする際、通常String型を使用して行われます。String型は印刷可能文字のみ表示できます。Binaryデータの内容をクエリする必要がある場合、`TO_BASE64()` 関数を使用してBase64エンコーディングに変換してから、さらなる処理を行うことができます。

2. Parquetファイルの解析

    Parquetファイルをクエリする際、異なるシステムによって生成されるParquetファイルの形式の潜在的な違い（RowGroupsの数、インデックス値など）により、問題の特定やパフォーマンス分析のためにParquetファイルのメタデータを確認する必要がある場合があります。ユーザーがより便利にParquetファイルを解析できるよう、以下のツールを提供します：

    1. [Apache Parquet Cli 1.14.0](https://github.com/morningman/tools/releases/download/apache-parquet-cli-1.14.0/apache-parquet-cli-1.14.0.tar.xz) をダウンロードして解凍する
    2. 解析するParquetファイルをローカルマシンにダウンロードし、パスを `/path/to/file.parquet` と仮定する
    3. 以下のコマンドを使用してParquetファイルのメタデータを解析する：

        `./parquet-tools meta /path/to/file.parquet`

    4. より多くの機能については、[Apache Parquet Cli documentation](https://github.com/apache/parquet-java/tree/apache-parquet-1.14.0/parquet-cli) を参照してください
