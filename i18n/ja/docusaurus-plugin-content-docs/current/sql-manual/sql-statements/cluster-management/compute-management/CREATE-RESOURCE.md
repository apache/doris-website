---
{
    "title": "CREATE RESOURCE",
    "language": "ja",
    "description": "このステートメントはリソースの作成に使用します。リソースを作成できるのは root または admin ユーザーのみです。現在、Spark、ODBC、S3 の外部リソースをサポートしています。"
}
---

## 説明

このステートメントはリソースの作成に使用します。リソースを作成できるのは root または admin ユーザーのみです。現在、Spark、ODBC、S3 の外部リソースをサポートしています。
今後、クエリ用の Spark/GPU、外部ストレージ用の HDFS/S3、ETL 用の MapReduce など、ほかの外部リソースが Doris に追加される可能性があります。

## 構文

```sql
CREATE [EXTERNAL] RESOURCE "<resource_name>"
PROPERTIES (
   `<property>`
    [ , ... ]
);
```

## パラメータ

1.`<property>`

`<property>` の形式は `<key>` = `<value>` です。`<key>` に指定できる値は次のとおりです。

| パラメータ | 説明 | 必須 |
| -- | -- | -- |
| `<type>` | リソースの種類を指定します。サポートされる値は spark/odbc_catalog/s3/jdbc/hdfs/hms/es です。 | Y |

`<type>` によって、PROPERTIES のパラメータは異なります。詳細は例を参照してください。


## 例

**1. yarn クラスターモードで、spark0 という名前の Spark リソースを作成します。**

   ```sql
   CREATE EXTERNAL RESOURCE "spark0"
   PROPERTIES
   (
     "type" = "spark",
     "spark.master" = "yarn",
     "spark.submit.deployMode" = "cluster",
     "spark.jars" = "xxx.jar,yyy.jar",
     "spark.files" = "/tmp/aaa,/tmp/bbb",
     "spark.executor.memory" = "1g",
     "spark.yarn.queue" = "queue0",
     "spark.hadoop.yarn.resourcemanager.address" = "127.0.0.1:9999",
     "spark.hadoop.fs.defaultFS" = "hdfs://127.0.0.1:10000",
     "working_dir" = "hdfs://127.0.0.1:10000/tmp/doris",
     "broker" = "broker0",
     "broker.username" = "user0",
     "broker.password" = "password0"
   );
   ```

Spark 関連のパラメータは次のとおりです。
   - spark.master: 必須です。現在サポートしている値は次のとおりです: yarn、spark://host:port.
   - spark.submit.deployMode: Spark プログラムのデプロイモードです。必須で、cluster と client の両方をサポートしています。
   - spark.hadoop.yarn.resourcemanager.address: master が yarn の場合は必須です。
   - spark.hadoop.fs.defaultFS: master が yarn の場合は必須です。
   - その他のパラメータは任意です。詳細は[こちら](http://spark.apache.org/docs/latest/configuration.html)を参照してください。

   

   Spark を ETL に使用する場合は、Working_dir と broker を指定する必要があります。各パラメータの説明は次のとおりです。

   - working_dir: ETL が使用するディレクトリです。Spark を ETL リソースとして使用する場合は必須です。例: hdfs://host:port/tmp/doris.
   - broker: broker の名前です。Spark を ETL リソースとして使用する場合は必須です。事前に `ALTER SYSTEM ADD BROKER` コマンドで設定する必要があります。
   - broker.property_key: ETL によって生成された中間ファイルを読み取る際に、broker に指定する必要がある認証情報です。

**2. ODBC リソースを作成します。**

   ```sql
   CREATE EXTERNAL RESOURCE `oracle_odbc`
   PROPERTIES (
   "type" = "odbc_catalog",
   "host" = "192.168.0.1",
   "port" = "8086",
   "user" = "test",
   "password" = "test",
   "database" = "test",
   "odbc_type" = "oracle",
   "driver" = "Oracle 19 ODBC driver"
   );
   ```

   ODBC 関連のパラメータは次のとおりです。
   - hosts: 外部データベースの IP アドレスです。
   - driver: ODBC のドライバー名です。be/conf/odbcinst.ini の Driver 名と同じである必要があります。
   - odbc_type: 外部データベースの種類です。現在、oracle、mysql、postgresql をサポートしています。
   - user: 外部データベースのユーザー名です。
   - password: 対応するユーザーのパスワード情報です。
   - charset: 接続の文字セットです。
   - ODBC ドライバーごとのカスタムパラメータも指定できます。詳細は、対応する ODBC ドライバーの説明を参照してください。

**3. S3 リソースを作成します。**

   ```sql
   CREATE RESOURCE "remote_s3"
   PROPERTIES
   (
      "type" = "s3",
      "s3.endpoint" = "bj.s3.com",
      "s3.region" = "bj",
      "s3.access_key" = "bbb",
      "s3.secret_key" = "aaaa",
      -- the followings are optional
      "s3.connection.maximum" = "50",
      "s3.connection.request.timeout" = "3000",
      "s3.connection.timeout" = "1000"
   );
   ```

   S3 リソースを[階層化ストレージ](../../../../table-design/tiered-storage/overview)に使用する場合は、追加の必須フィールドを指定する必要があります。
   ```sql
   CREATE RESOURCE "remote_s3"
   PROPERTIES
   (
      "type" = "s3",
      "s3.endpoint" = "bj.s3.com",
      "s3.region" = "bj",
      "s3.access_key" = "bbb",
      "s3.secret_key" = "aaaa",
      -- required by cooldown
      "s3.root.path" = "/path/to/root",
      "s3.bucket" = "test-bucket"
   );
   ```

   S3 関連のパラメータは次のとおりです。
   - 必須パラメータ
       - `s3.endpoint`: S3 のエンドポイントです。
       - `s3.region`: S3 のリージョンです。
       - `s3.root.path`: S3 のルートディレクトリです。
       - `s3.access_key`: S3 のアクセスキーです。
       - `s3.secret_key`: S3 のシークレットキーです。
       - `s3.bucket`：S3 のバケットです。
   - 任意のパラメータ
       - `s3.connection.maximum`: S3 接続の最大数です。デフォルトは 50 です。
       - `s3.connection.request.timeout`: S3 リクエストのタイムアウトです。単位はミリ秒で、デフォルトは 3000 です。
       - `s3.connection.timeout`: S3 接続のタイムアウトです。単位はミリ秒で、デフォルトは 1000 です。

    Doris also supported `AWS Assume Role` for creating S3 Resource , please refer to [AWS integration](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).

**4. JDBC リソースを作成します。**

   ```sql
   CREATE RESOURCE mysql_resource PROPERTIES (
      "type"="jdbc",
      "user"="root",
      "password"="123456",
      "jdbc_url" = "jdbc:mysql://127.0.0.1:3316/doris_test?useSSL=false",
      "driver_url" = "https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.25/mysql-connector-java-8.0.25.jar",
   "driver_class" = "com.mysql.cj.jdbc.Driver"
   );
   ```

   JDBC 関連のパラメータは次のとおりです。
   - user：データベースへの接続に使用するユーザー名です。
   - password：データベースへの接続に使用するパスワードです。
   - jdbc_url: 指定したデータベースへの接続に使用する識別子です。
   - driver_url: JDBC ドライバーパッケージの URL です。
   - driver_class: JDBC ドライバーのクラスです。

**5. HDFS リソースを作成します。**

   ```sql
   CREATE RESOURCE hdfs_resource PROPERTIES (
      "type"="hdfs",
      "hadoop.username"="user",
      "dfs.nameservices" = "my_ha",
      "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
      "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
      "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
      "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
   );
   ```

   HDFS 関連のパラメータは次のとおりです。
   - fs.defaultFS: NameNode のアドレスとポートです。
   - hadoop.username: HDFS のユーザー名です。
   - dfs.nameservices: Hadoop で HA が有効な場合は、ファイルシステムの nameservice を設定します。hdfs-site.xml を参照してください。
   - dfs.ha.namenodes.[nameservice ID]：nameservice 内の各 NameNode を識別する一意の ID です。hdfs-site.xml を参照してください。
   - dfs.namenode.rpc-address.[nameservice ID].[name node ID]`：各 NameNode が待ち受ける完全修飾 RPC アドレスです。hdfs-site.xml を参照してください。
   - dfs.client.failover.proxy.provider.[nameservice ID]：HDFS クライアントが Active NameNode に接続するために使用する Java クラスです。通常は org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider です。

**6. HMS リソースを作成します。**

   HMS リソースは [HMS カタログ](../../../../lakehouse/catalogs/hive-catalog.mdx)の作成に使用します。
   ```sql
   CREATE RESOURCE hms_resource PROPERTIES (
      'type'='hms',
      'hive.metastore.uris' = 'thrift://127.0.0.1:7004',
      'dfs.nameservices'='HANN',
      'dfs.ha.namenodes.HANN'='nn1,nn2',
      'dfs.namenode.rpc-address.HANN.nn1'='nn1_host:rpc_port',
      'dfs.namenode.rpc-address.HANN.nn2'='nn2_host:rpc_port',
      'dfs.client.failover.proxy.provider.HANN'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
   );
   ```

   HMS 関連のパラメータは次のとおりです。
   - hive.metastore.uris: Hive Metastore サーバーのアドレスです。
   任意:
   - dfs.*: Hive のデータが HDFS にある場合は、HDFS リソースのパラメータを追加するか、hive-site.xml を fe/conf にコピーします。
   - s3.*: Hive のデータが S3 にある場合は、S3 リソースのパラメータを追加します。[Aliyun Data Lake Formation](https://www.aliyun.com/product/bigdata/dlf) を使用する場合は、hive-site.xml を fe/conf にコピーします。

**7. ES リソースを作成します。**

   ```sql
   CREATE RESOURCE es_resource PROPERTIES (
      "type"="es",
      "hosts"="http://127.0.0.1:29200",
      "nodes_discovery"="false",
      "enable_keyword_sniff"="true"
   );
   ```

   ES 関連のパラメータは次のとおりです。
   - hosts: ES の接続先アドレスです。単一または複数のノードを指定できます。ロードバランサーも使用できます。
   - user: ES のユーザー名です。
   - password: ユーザーのパスワードです。
   - enable_docvalue_scan: ES/Lucene の列ストレージを使用してクエリ対象フィールドの値を取得するかどうかを指定します。デフォルトは true です。
   - enable_keyword_sniff: ES の文字列の分割型である text.fields を検出し、キーワードでクエリするかどうかを指定します。デフォルトは true で、false の場合は分割後の内容に一致させます。
   - nodes_discovery: ES ノードの検出を有効にするかどうかを指定します。デフォルトは true です。ネットワークが分離されている場合は、このパラメータを false に設定します。その場合、指定したノードにのみ接続します。
   - http_ssl_enabled: ES クラスターで HTTPS アクセスモードを有効にするかどうかを指定します。現在の FE/BE 実装ではすべてを信頼します。
