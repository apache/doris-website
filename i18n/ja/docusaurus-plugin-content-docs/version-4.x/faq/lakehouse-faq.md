---
{
    "title": "データレイクハウス FAQ",
    "language": "ja",
    "description": "Apache Doris のデータレイクハウスに関する FAQ とトラブルシューティングガイド。証明書の問題、Kerberos 認証、JDBC Catalog、Hive Catalog、HDFS、DLF Catalog、診断ツールを扱います。"
}
---

## 証明書の問題

1. クエリ実行時に `curl 77: Problem with the SSL CA cert.` エラーが発生する場合、現在のシステム証明書が古いため、ローカルで更新する必要があります。
    - 最新の CA 証明書は `https://curl.se/docs/caextract.html` からダウンロードできます。
    - ダウンロードした `cacert-xxx.pem` を `/etc/ssl/certs/` ディレクトリに配置します。例: `sudo cp cacert-xxx.pem /etc/ssl/certs/ca-certificates.crt`。

2. クエリ実行時に次のエラーが発生する場合: `ERROR 1105 (HY000): errCode = 2, detailMessage = (x.x.x.x)[CANCELLED][INTERNAL_ERROR]error setting certificate verify locations: CAfile: /etc/ssl/certs/ca-certificates.crt CApath: none`。

    ```
    yum install -y ca-certificates
    ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
    ```

## Kerberos

1. Kerberos 認証を使用する Hive Metastore への接続時に `GSS initiate failed` エラーが発生する場合。

    通常は Kerberos 認証情報に誤りがあります。次の手順で確認してください。

    1. 1.2.1 より前のバージョンでは、Doris が依存する libhdfs3 ライブラリで gsasl が有効になっていませんでした。1.2.2 以降に更新してください。
    2. 各コンポーネントに正しい keytab と principal が設定されていること、およびすべての FE ノードと BE ノードに keytab ファイルが存在することを確認してください。

        1. `hadoop.kerberos.keytab`/`hadoop.kerberos.principal`: Hadoop HDFS へのアクセスに使用します。HDFS に対応する値を設定してください。
        2. `hive.metastore.kerberos.principal`: Hive Metastore に使用します。

    3. principal 内の IP アドレスをドメイン名に置き換えてみてください。デフォルトの `_HOST` プレースホルダーは使用しないでください。
    4. すべての FE ノードと BE ノードに `/etc/krb5.conf` ファイルが存在することを確認してください。

2. Hive Catalog 経由で Hive データベースに接続すると、`RemoteException: SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]` エラーが発生する場合。

    `show databases` と `show tables` は正常に実行でき、クエリ中にエラーが発生する場合は、次の二つの手順を実行してください。
    - `core-site.xml` と `hdfs-site.xml` を `fe/conf` と `be/conf` の各ディレクトリに配置します。
    - BE ノードで Kerberos の `kinit` を実行し、BE を再起動してからクエリを実行します。

3. Kerberos を設定したテーブルのクエリ時に `GSSException: No valid credentials provided (Mechanism level: Failed to find any Kerberos Ticket)` エラーが発生する場合、通常は FE ノードと BE ノードを再起動すると解決します。

    - すべてのノードを再起動する前に、JAVA_OPTS パラメータに `-Djavax.security.auth.useSubjectCredsOnly=false` を設定します。設定先は `"${DORIS_HOME}/be/conf/be.conf"` です。これにより、JAAS の認証情報をアプリケーションではなく基盤となるメカニズムから取得します。
    - 一般的な JAAS エラーの解決方法については、[JAAS のトラブルシューティング](https://docs.oracle.com/javase/8/docs/technotes/guides/security/jgss/tutorials/Troubleshooting.html)を参照してください。
    
4. Catalog で Kerberos を設定する際に発生する `Unable to obtain password from user` エラーを解決するには、次を確認してください。

    - `klist -kt your.keytab` で、使用する principal が一覧に表示されることを確認します。
    - Catalog の設定に `yarn.resourcemanager.principal` などの不足項目がないか確認します。
    - 上記に問題がない場合、システムのパッケージマネージャーでインストールした JDK が一部の暗号化アルゴリズムに対応していない可能性があります。JDK を手動でインストールし、`JAVA_HOME` 環境変数を設定することを検討してください。
    - Kerberos では通常、暗号化に AES-256 を使用します。Oracle JDK には JCE のインストールが必要です。一部の OpenJDK ディストリビューションには強度制限のない JCE が含まれているため、別途インストールする必要はありません。
    - JCE のバージョンは JDK のバージョンに対応します。JDK のバージョンに合った JCE の zip パッケージをダウンロードし、`$JAVA_HOME/jre/lib/security` ディレクトリに展開してください。
        - JDK6: [JCE6](http://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
        - JDK7: [JCE7](http://www.oracle.com/technetwork/java/embedded/embedded-se/downloads/jce-7-download-432124.html)
        - JDK8: [JCE8](http://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)

5. KMS を使用して HDFS にアクセスする際に `java.security.InvalidKeyException: Illegal key size` エラーが発生する場合、JDK を >= Java 8 u162 にアップグレードするか、対応する JCE Unlimited Strength Jurisdiction Policy Files をインストールしてください。

6. Catalog で Kerberos を設定した際に `SIMPLE authentication is not enabled. Available:[TOKEN, KERBEROS]` エラーが発生する場合は、`core-site.xml` ファイルを `"${DORIS_HOME}/be/conf"` ディレクトリに配置してください。

    HDFS へのアクセス時に `No common protection layer between client and server` エラーが発生する場合は、クライアントとサーバーで `hadoop.rpc.protection` プロパティが一致していることを確認してください。

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>

    <configuration>

        <property>
            <name>hadoop.security.authentication</name>
            <value>kerberos</value>
        </property>

    </configuration>
    ```

7. Kerberos を設定した Broker Load の使用時に `Cannot locate default realm.` エラーが発生する場合。

    Broker Load 用の `-Djava.security.krb5.conf=/your-path` を `JAVA_OPTS`（`start_broker.sh` スクリプト内）に追加してください。

8. Catalog で Kerberos を設定する場合、`hadoop.username` プロパティは併用できません。

9. JDK 17 から Kerberos にアクセスする場合

    JDK 17 で Doris を実行して Kerberos サービスにアクセスすると、非推奨の暗号化アルゴリズムが原因で問題が発生する場合があります。`allow_weak_crypto=true` プロパティを `krb5.conf` に追加するか、Kerberos の暗号化アルゴリズムを更新してください。

    詳細は <https://seanjmullan.org/blog/2021/09/14/jdk17#kerberos> を参照してください。

## JDBC Catalog

1. JDBC Catalog 経由で SQLServer に接続すると `unable to find valid certification path to requested target` エラーが発生する場合。

    `trustServerCertificate=true` オプションを `jdbc_url` に追加してください。

2. JDBC Catalog 経由で MySQL データベースに接続すると、中国語の文字が文字化けするか、中国語の文字を使ったクエリ条件が正しく機能しない場合。

    `useUnicode=true&characterEncoding=utf-8` を `jdbc_url` に追加してください。

    > 注: バージョン 1.2.3 以降では、JDBC Catalog 経由で MySQL データベースに接続する際、これらのパラメータが自動的に追加されます。

3. JDBC Catalog 経由で MySQL データベースに接続すると `Establishing SSL connection without server's identity verification is not recommended` エラーが発生する場合。

    `useSSL=true` を `jdbc_url` に追加してください。

4. JDBC Catalog を使用して MySQL のデータを Doris に同期する際に日付データの同期エラーが発生する場合は、MySQL のバージョンと MySQL ドライバーパッケージが対応しているか確認してください。たとえば、MySQL 8 以降には `com.mysql.cj.jdbc.Driver` ドライバーが必要です。

5. 単一のフィールドが大きすぎると、クエリ中に BE 側で Java メモリの OOM が発生する場合があります。

    JDBC Scanner が JDBC 経由でデータを読み込む際、セッション変数 `batch_size` によって、JVM がバッチごとに処理する行数が決まります。単一のフィールドが大きすぎると、`field_size * batch_size`（JVM の静的メモリやデータコピーのオーバーヘッドを考慮した概算値）が JVM のメモリ上限を超え、OOM が発生する可能性があります。

    対処方法:

    - `batch_size` の値を `set batch_size = 512;` の実行によって小さくします。デフォルト値は 4064 です。
    - `-Xmx` パラメータを `JAVA_OPTS` で変更して BE の JVM メモリを増やします。例: `-Xmx8g`。

## Hive Catalog

1. Hive Catalog 経由で Iceberg または Hive テーブルにアクセスすると、`failed to get schema` または `Storage schema reading not supported` エラーが発生する場合。

    次の方法を試してください。

    - `iceberg` の実行時に必要な jar パッケージを Hive の `lib/` ディレクトリに配置します。

    - `hive-site.xml` に次のように設定します。

        ```
        metastore.storage.schema.reader.impl=org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader
        ```

        設定後、Hive Metastore を再起動する必要があります。

    - Catalog のプロパティに `"get_schema_from_table" = "true"` を追加します。

        このパラメータはバージョン 2.1.10 および 3.0.6 以降でサポートされています。

2. Hive Catalog への接続時に `Caused by: java.lang.NullPointerException` エラーが発生する場合。

    fe.log に次のスタックトレースが記録されている場合:

    ```
    Caused by: java.lang.NullPointerException
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.getFilteredObjects(AuthorizationMetaStoreFilterHook.java:78) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook.filterDatabases(AuthorizationMetaStoreFilterHook.java:55) ~[hive-exec-3.1.3-core.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1548) ~[doris-fe.jar:3.1.3]
        at org.apache.hadoop.hive.metastore.HiveMetaStoreClient.getAllDatabases(HiveMetaStoreClient.java:1542) ~[doris-fe.jar:3.1.3]
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[?:1.8.0_181]
    ```

    `"metastore.filter.hook" = "org.apache.hadoop.hive.metastore.DefaultMetaStoreFilterHookImpl"` を `CREATE CATALOG` 文に追加してみてください。

3. Hive Catalog の作成後、`show tables` は正常に実行できるものの、クエリ時に `java.net.UnknownHostException: xxxxx` が発生する場合。

    Catalog の PROPERTIES に次を追加してください。

    ```
    'fs.defaultFS' = 'hdfs://<your_nameservice_or_actually_HDFS_IP_and_port>'
    ```

4. Hive 1.x の ORC 形式のテーブルでは、基になる ORC ファイルのスキーマに `_col0`、`_col1`、`_col2` などのシステム列名が含まれる場合があります。この場合、Hive テーブルの列名と対応付けるため、Catalog の設定で `hive.version` に 1.x.x を指定してください。

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'hive.version' = '1.x.x'
    );
    ```

5. Catalog を使用してテーブルデータをクエリする際に `Invalid method name` などの Hive Metastore 関連のエラーが発生する場合は、`hive.version` パラメータを設定してください。

6. ORC 形式のテーブルのクエリ時に FE が `Could not obtain block` または `Caused by: java.lang.NoSuchFieldError: types` を報告する場合、デフォルトで FE がファイル情報の取得とファイル分割のために HDFS にアクセスすることが原因の可能性があります。環境によっては FE から HDFS にアクセスできません。この場合、`"hive.exec.orc.split.strategy" = "BI"` を追加すると解決できます。ほかの選択肢には HYBRID（デフォルト）と ETL があります。

7. Hive では Hudi テーブルのパーティションフィールドの値を取得できるのに、Doris では取得できない場合があります。現在、Doris と Hive では Hudi のクエリ方法が異なります。Doris では、Hudi テーブルの avsc ファイル構造にパーティションフィールドを追加する必要があります。追加しない場合、`hoodie.datasource.hive_sync.partition_fields=partition_val` を設定していても、Doris は partition_val が空の状態でクエリします。

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

8. Hive 外部テーブルのクエリ時に `java.lang.ClassNotFoundException: Class com.hadoop.compression.lzo.LzoCodec not found` エラーが発生する場合は、Hadoop 環境で `hadoop-lzo-*.jar` を探し、`"${DORIS_HOME}/fe/lib/"` ディレクトリに配置して FE を再起動してください。バージョン 2.0.2 以降では、このファイルを FE の `custom_lib/` ディレクトリに配置できます。ディレクトリが存在しない場合は手動で作成してください。これにより、クラスタのアップグレード時に `lib` ディレクトリが置き換わってもファイルが失われません。

9. serde に `org.apache.hadoop.hive.contrib.serde2.MultiDelimitserDe` を指定して Hive テーブルを作成し、そのテーブルへのアクセス時に `storage schema reading not supported` エラーが発生する場合は、`hive-site.xml` ファイルに次の設定を追加して HMS サービスを再起動してください。

    ```xml
    <property>
        <name>metastore.storage.schema.reader.impl</name>
        <value>org.apache.hadoop.hive.metastore.SerDeStorageSchemaReader</value>
    </property>
    ```

10. `java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty` エラーが発生する場合。FE ログに記録されるエラーメッセージの全文は次のとおりです。

    ```
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.doris.common.UserException: errCode = 2, detailMessage = S3 list path exception. path=s3://bucket/part-*, err: errCode = 2, detailMessage = S3 list path failed. path=s3://bucket/part-*,msg=errors while get file status listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    org.apache.hadoop.fs.s3a.AWSClientIOException: listStatus on s3://bucket: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: com.amazonaws.SdkClientException: Unable to execute HTTP request: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: javax.net.ssl.SSLException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.lang.RuntimeException: Unexpected error: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    Caused by: java.security.InvalidAlgorithmParameterException: the trustAnchors parameter must be non-empty
    ```

    FE ノードで `update-ca-trust`（CentOS/RockyLinux）を使用して CA 証明書を更新し、FE プロセスを再起動してみてください。

11. BE で `java.lang.InternalError` が発生する場合。`be.INFO` に次のようなエラーが記録されているときは:

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

    Doris に組み込まれた `libz.a` とシステム環境の `libz.so` が競合しています。解決するには、まず `export LD_LIBRARY_PATH=/path/to/be/lib:$LD_LIBRARY_PATH` を実行し、その後 BE プロセスを再起動してください。

12. Hive へのデータ挿入時に `HiveAccessControlException Permission denied: user [user_a] does not have [UPDATE] privilege on [database/table]` エラーが発生する場合。

    データ挿入後には対応する統計情報を更新する必要があり、この更新操作には ALTER 権限が必要です。そのため、Ranger でこのユーザーに ALTER 権限を付与してください。

13. ORC ファイルのクエリ時に、次のようなエラーが
    `Orc row reader nextBatch failed. reason = Can't open /usr/share/zoneinfo/+08:00`
    発生する場合。

    まず、現在のセッションの `time_zone` 設定を確認してください。`Asia/Shanghai` のような地域名によるタイムゾーンを使用することを推奨します。

    セッションのタイムゾーンがすでに `Asia/Shanghai` に設定されていてもクエリが失敗する場合、ORC ファイルはタイムゾーン `+08:00` で生成されたと考えられます。クエリ実行時に ORC フッターを解析するため、このタイムゾーンが必要です。この場合、`/usr/share/zoneinfo/` ディレクトリ内に、`+08:00` から同等のタイムゾーンを指すシンボリックリンクを作成してみてください。

14. JSON SerDe（例: `org.openx.data.jsonserde.JsonSerDe`）を使用する Hive テーブルのクエリ時に、`failed to get schema` または `Storage schema reading not supported` エラーが発生する場合。

    Hive テーブルが JSON 形式で保存されている場合（ROW FORMAT SERDE が `org.openx.data.jsonserde.JsonSerDe`）、Hive Metastore がデフォルトの方法でテーブルのスキーマ情報を読み取れず、Doris からのクエリ時に次のエラーが発生することがあります。

    ```
    errCode = 2, detailMessage = failed to get schema for table xxx in db xxx.
    reason: org.apache.hadoop.hive.metastore.api.MetaException:
    java.lang.UnsupportedOperationException: Storage schema reading not supported
    ```

    Catalog のプロパティに `"get_schema_from_table" = "true"` を追加すると解決できます。このパラメータを設定すると、Doris は基盤となるストレージの Schema Reader に依存せず、Hive テーブルのメタデータからスキーマを直接取得します。

    ```sql
    CREATE CATALOG hive PROPERTIES (
        'type' = 'hms',
        'hive.metastore.uris' = 'thrift://x.x.x.x:9083',
        'get_schema_from_table' = 'true'
    );
    ```

    このパラメータはバージョン 2.1.10 および 3.0.6 以降でサポートされています。

15. Hive Catalog テーブルのクエリ計画が極端に遅く、`nereids cost too much time` エラーが発生し、HMS へのアクセスに毎回ほぼ同じ長い時間（例: 約 10 秒）がかかる場合。

    **根本原因の分析:**

    通常、この問題は HMS RPC 自体の実行が遅いことによるものではありません。最も一般的な根本原因は、**Doris FE ノードの DNS 設定が正しくないこと**です。
    Hive Metastore Client の初期化時にはホスト名の解決が行われます。設定された DNS サーバーに到達できないか応答がない場合、新しい HMS クライアント接続を確立するたびに DNS 名前解決がタイムアウトし（通常は 10 秒）、メタデータの取得が大幅に遅くなります。

    **典型的な症状:**

    - **ネットワーク接続は正常:** HMS のポートには到達できるものの、Doris からのメタデータへのアクセスが極端に遅くなります。
    - **一定の遅延:** 遅延は毎回、一定のタイムアウト値（例: 10 秒）に達します。
    - **回避策が効かない:** Catalog プロパティで HMS クライアントのタイムアウト値を増やすだけではエラーを覆い隠すだけで、各接続で発生する一定の 10 秒の遅延は解消されません。

    **トラブルシューティング手順:**

    Doris FE ノードで次のコマンドを実行し、DNS とホスト名の解決を確認してください。

    ```bash
    # Check current DNS server configuration
    cat /etc/resolv.conf
    # Test if the DNS server is reachable and measure resolution latency
    ping <nameserver_ip>
    dig @<nameserver_ip> example.com
    dig @<nameserver_ip> -x <hms_ip>
    ```

    **対処方法（いずれかを選択）:**
    1. **DNS 設定を修正する（推奨）:** `nameserver` の設定を Doris FE ノードの `/etc/resolv.conf` で修正し、DNS サービスに到達できて迅速に応答することを確認します。ローカルネットワークで DNS が不要な場合は、無効なネームサーバーをコメントアウトすることを検討してください。
    2. **静的なホストマッピングを設定する:** FE ノードの `/etc/hosts` に HMS ノードの IP アドレスとホスト名の対応関係を追加します。
    3. **Catalog プロパティを統一する:** Catalog の作成時には、`hive.metastore.uris` プロパティに IP アドレスを直接指定するのではなく、名前解決可能なホスト名を使用することを強く推奨します。

16. Hive Catalog テーブルへのクエリが時折長時間応答しなくなるか、オプティマイザーのタイムアウトエラー `nereids cost too much time` を直接報告する一方で、その直後のクエリは正常に動作する場合。

    **問題の説明:**

    この問題は通常、Catalog がしばらく使用されていなかった後に発生します。HMS RPC の開始時にプール内の古い接続を再利用すると、ソケットのタイムアウト時間（デフォルトは 10 秒）が経過するまでリクエストが停止します。Hive Client の内部再試行機構により、複数回再試行すると合計の待機時間が 20～30 秒になることがあります。その結果、クエリ計画段階が極端に遅くなり、Doris FE オプティマイザーの `nereids cost too much time` タイムアウトエラーが発生しやすくなります。接続が破棄され、再確立されると、性能は正常に戻ります。

    **根本原因の分析:**

    Doris は HMS Catalog ごとにクライアントプールを維持し、接続を再利用します。複雑なネットワーク環境（VPC をまたぐ場合や、ファイアウォール、NAT ゲートウェイを経由する場合など）では、アイドル状態の TCP 接続が `idle timeout` の後にネットワーク機器によって通知なしに破棄されることがあります。通常、これらの機器はエンドポイントに FIN/RST パケットを送信しないため、Doris は接続がまだ有効だと判断します。このような無効な接続を再利用すると、障害を検出して再試行を開始するまで、ソケットのタイムアウト時間が経過するのを待つ必要があります。

    **トラブルシューティング手順:**

    - Doris FE と HMS の間にファイアウォール、NAT ゲートウェイ、ロードバランサーがあるか確認します。
    - 診断ツール **Pulse（hms-tools）**を使用します。ネットワーク接続は速いのに、長時間アイドル状態が続いた後の RPC 実行で 10 秒の倍数にあたる一定の遅延が発生する場合、アイドル接続が通知なしに破棄されていることを確認できます。

    **対処方法:**

    Catalog プロパティで接続の有効期間をネットワーク機器のアイドルタイムアウトより少し短く設定します。Hive 標準のソケット有効期間プロパティの使用を推奨します。

    ```sql
    CREATE CATALOG hive_catalog PROPERTIES (
        "type" = "hms",
        "hive.metastore.uris" = "thrift://<hms_host>:<port>",
        -- Set a value shorter than your network's idle timeout (e.g., 300s)
        "hive.metastore.client.socket.lifetime" = "300s"
    );
    ```

    この設定を行うと、HMS Client は RPC を送信する前に接続の経過時間を確認します。`lifetime` を超えている場合は先に再接続するため、古い接続による長時間の停止やオプティマイザーのタイムアウトを回避できます。

## HDFS

1. HDFS 3.x へのアクセス時に `java.lang.VerifyError: xxx` エラーが発生する場合、1.2.1 より前のバージョンの Doris は Hadoop 2.8 に依存しています。2.10.2 に更新するか、Doris を 1.2.2 より後のバージョンにアップグレードする必要があります。

2. Hedged Read を使用して HDFS の読み取り遅延を改善する場合。HDFS の負荷が高いと、特定の HDFS 上のデータレプリカの読み取りに時間がかかり、クエリ全体の効率が低下することがあります。HDFS Client は Hedged Read 機能を提供しています。読み取りリクエストが一定時間内に応答しない場合、この機能は同じデータを読み取る別のスレッドを起動し、先に返ってきた結果を使用します。

    注: この機能は HDFS クラスタの負荷を増やす可能性があるため、慎重に使用してください。

    この機能は次のように有効にできます。

    ```sql
    CREATE CATALOG regression PROPERTIES (
        'type' = 'hms',
        'hive.metastore.uris' = 'thrift://172.21.16.47:7004',
        'dfs.client.hedged.read.threadpool.size' = '128',
        'dfs.client.hedged.read.threshold.millis' = '500'
    );
    ```

    `dfs.client.hedged.read.threadpool.size` は Hedged Read に使用するスレッド数を表します。これらのスレッドは HDFS Client で共有されます。通常、一つの HDFS クラスタに対して BE ノードは HDFS Client を共有します。
    
    `dfs.client.hedged.read.threshold.millis` は読み取りのしきい値をミリ秒単位で指定します。読み取りリクエストが応答しないままこのしきい値を超えると、Hedged Read が起動します。
    
    有効にすると、Query Profile に関連する指標が表示されます。
    
    `TotalHedgedRead`: Hedged Read を開始した回数。
    
    `HedgedReadWins`: Hedged Read が成功した回数（起動した追加リクエストが元のリクエストより早く結果を返した回数）。
    
    これらの値は単一のクエリではなく、単一の HDFS Client に対する累計値です。同じ HDFS Client が複数のクエリで再利用される場合があります。

3. `Couldn't create proxy provider class org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider`

    FE と BE の起動スクリプトでは、環境変数 `HADOOP_CONF_DIR` が CLASSPATH に追加されます。`HADOOP_CONF_DIR` が存在しないパスや誤ったパスを指している場合、誤った `xxx-site.xml` ファイルが読み込まれ、設定情報を正しく取得できないことがあります。

    `HADOOP_CONF_DIR` が正しく設定されているか確認するか、この環境変数を削除してください。

4. `BlockMissingExcetpion: Could not obtain block: BP-XXXXXXXXX No live nodes contain current block`

    考えられる対処方法は次のとおりです。
    - `hdfs fsck file -files -blocks -locations` を使用して、ファイルに問題がないか確認します。
    - `telnet` を使用して DataNode との接続を確認します。

        エラーログに次のエラーが出力される場合があります。
        
        ```
        No live nodes contain current block Block locations: DatanodeInfoWithStorage[10.70.150.122:50010,DS-7bba8ffc-651c-4617-90e1-6f45f9a5f896,DISK]
        ```
        
        まず、Doris クラスタと `10.70.150.122:50010` の間の接続を確認してください。
        
        また、HDFS クラスタが内部 IP と外部 IP の二つのネットワークを使用している場合があります。この場合は通信にドメイン名が必要なため、Catalog のプロパティに `"dfs.client.use.datanode.hostname" = "true"` を追加してください。
        
        あわせて、`hdfs-site.xml`（`fe/conf` と `be/conf` に配置済み）でも、このパラメータが true に設定されているか確認してください。

    - DataNode のログを確認します。

        次のエラーが発生する場合:

        ```
        org.apache.hadoop.hdfs.server.datanode.DataNode: Failed to read expected SASL data transfer protection handshake from client at /XXX.XXX.XXX.XXX:XXXXX. Perhaps the client is running an older version of Hadoop which does not support SASL data transfer protection
        ```

        現在の HDFS では暗号化通信が有効になっていますが、クライアント側では有効になっていないことを示しています。

        次のいずれかの方法で対処してください。
        - `hdfs-site.xml` と `core-site.xml` を `fe/conf` と `be/conf` にコピーします。（推奨）
        - `hdfs-site.xml` で該当する `dfs.data.transfer.protection` の設定を確認し、そのパラメータを Catalog に設定します。

5. Hive Catalog テーブルのクエリ時に `RPC response has a length of xxx exceeds maximum data length` エラーが発生する場合。

    例:

    ```
    RPC response has a length of 1213486160 exceeds maximum data length
    ```

    `1213486160` を十六進数で表すと `0x48545450` となり、ASCII 文字列の `"HTTP"` に相当します。これは、Doris FE が HDFS NameNode の RPC ポートへの接続を試みたものの、代わりに HTTP 応答を受信したことを示しています。

    根本原因は、Catalog または `hdfs-site.xml` に設定された HDFS NameNode のポートが誤っており、RPC ポートが必要な箇所に HTTP ポートが指定されていることです。HDFS NameNode は通常、次の二種類のポートを公開します。

    - **RPC ポート**（デフォルト: `8020` または `9000`）: HDFS クライアントの通信に使用します。Doris に指定するのはこちらです。
    - **HTTP ポート**（デフォルト: `9870` または `50070`）: NameNode Web UI に使用します。

    Catalog のプロパティ、または `hdfs-site.xml`（`fe/conf` と `be/conf` に配置）の HDFS NameNode ポート設定を確認し、RPC ポート（`dfs.namenode.rpc-address`）が指定され、HTTP ポート（`dfs.namenode.http-address`）が指定されていないことを確認してください。

## DLF Catalog

1. DLF Catalog の使用時に BE が JindoFS データを読み取る際、`Invalid address` エラーが発生する場合は、ログに表示されたドメイン名と IP アドレスの対応関係を `/etc/hosts` に追加してください。

2. データを読み取る権限がない場合は、`hadoop.username` プロパティで権限のあるユーザーを指定してください。

3. DLF Catalog のメタデータは DLF と一致している必要があります。DLF でメタデータを管理する場合、Hive に新しく取り込まれたパーティションが DLF に同期されず、DLF と Hive のメタデータに不一致が生じることがあります。これを解決するには、Hive のメタデータが DLF に完全に同期されていることを確認してください。

## その他の問題

1. Binary 型を Doris にマッピングした後、クエリ結果が文字化けする場合。

    Doris は Binary 型をネイティブにサポートしていません。そのため、各種データレイクやデータベースの Binary 型を Doris にマッピングする際は、通常 String 型を使用します。String 型では印字可能な文字しか表示できません。Binary データの内容をクエリする必要がある場合は、`TO_BASE64()` 関数で Base64 にエンコードしてから処理できます。

2. Parquet ファイルを分析する場合。

    Parquet ファイルのクエリでは、生成したシステムによって RowGroup の数やインデックス値など、ファイル形式の細部が異なる場合があります。そのため、問題の特定や性能分析のために Parquet ファイルのメタデータを確認する必要があることがあります。次のツールを使用すると、Parquet ファイルを分析できます。

    1. [Apache Parquet Cli 1.14.0](https://github.com/morningman/tools/releases/download/apache-parquet-cli-1.14.0/apache-parquet-cli-1.14.0.tar.xz) をダウンロードして展開します。
    2. 分析する Parquet ファイルをローカルマシンにダウンロードします。ここでは、パスを `/path/to/file.parquet` とします。
    3. 次のコマンドで Parquet ファイルのメタデータを分析します。

        `./parquet-tools meta /path/to/file.parquet`

    4. その他の機能については、[Apache Parquet Cli のドキュメント](https://github.com/apache/parquet-java/tree/apache-parquet-1.14.0/parquet-cli)を参照してください。

## 診断ツール

### Pulse

[Pulse](https://github.com/CalvinKirs/Pulse) は、データレイク環境でインフラストラクチャへの依存関係を診断するための軽量な接続テストツールキットです。複数の専用ツールを備え、外部テーブルへのアクセスに関する環境由来の問題を素早く特定できます。

Pulse には主に次のツール群があります。

1.  **HMS 診断ツール（`hms-tools`）**:
    *   Hive Metastore（HMS）の問題を調査するために設計されています。
    *   ヘルスチェック、ping テスト、オブジェクトのメタデータ取得、設定診断をサポートします。
    *   **性能ベンチマーク**: `bench` モードで HMS の応答時間の分布とレイテンシーを測定し、メタデータ層がボトルネックかどうかを判断できます。

2.  **Kerberos 診断ツール（`kerberos-tools`）**:
    *   Kerberos 認証を使用する環境で `krb5.conf` の設定を検証します。
    *   KDC への到達確認、keytab ファイルの調査、ログインテストをサポートし、セキュリティ層が接続を妨げていないか確認できます。

3.  **オブジェクトストレージ診断ツール（`s3-tools`、`gcs-tools`、`azure-blob-cpp`）**:
    *   主要なクラウドストレージサービス（AWS S3、Google GCS、Azure Blob Storage）向けの診断ツールです。
    *   "Access Denied" や "Bucket Not Found" など、外部テーブルへのアクセス時によくある問題を調査します。
    *   認証情報の取得元や STS ID の検証、バケット単位の操作テストをサポートします。

**コマンド例（HMS）:**

```bash
# Test basic HMS connectivity and latency details using hms-tools
java -jar hms-tools.jar ping --uris thrift://<hms_host>:<port> --count 3 --verbose

# Benchmark actual metadata RPC response distribution using hms-tools
java -jar hms-tools.jar bench --uris thrift://<hms_host>:<port> --rpc get_all_databases --iterations 10
```

メタデータへのアクセスが遅い場合や外部テーブルに接続できない場合は、問題の種類（認証失敗、メタデータ取得の遅延、ストレージへの到達可否など）に応じた Pulse ツールで調査することを推奨します。`connect` フェーズは非常に速いのに初期化全体で大きな一定の遅延が発生する場合は、上記の FAQ を参照して FE ノードの DNS とホスト名の解決設定を確認してください。
