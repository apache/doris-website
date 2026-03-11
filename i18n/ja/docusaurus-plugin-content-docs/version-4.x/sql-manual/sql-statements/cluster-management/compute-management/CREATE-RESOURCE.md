---
{
  "title": "リソースの作成",
  "description": "このステートメントはリソースを作成するために使用されます。rootまたはadminユーザーのみがリソースを作成できます。現在、Spark、ODBC、S3外部リソースをサポートしています。",
  "language": "ja"
}
---
## デスクリプション

このステートメントはリソースを作成するために使用されます。rootまたはadminユーザーのみがリソースを作成できます。現在はSpark、ODBC、S3外部リソースをサポートしています。
将来的には、クエリ用のSpark/GPU、外部ストレージ用のHDFS/S3、ETL用のMapReduceなど、他の外部リソースがDorisに追加される可能性があります。

## Syntax

```sql
CREATE [EXTERNAL] RESOURCE "<resource_name>"
PROPERTIES (
   `<property>`
    [ , ... ]
);
```
## パラメータ

1.`<type>`

`<property>` は `<key>` = `<value>` の形式で、`<key>` に使用可能な具体的な値は以下の通りです：

| パラメータ | 説明 | 必須 |
| -- | -- | -- |
| `<type>` | リソースのタイプを指定します。サポート対象: spark/odbc_catalog/s3/jdbc/hdfs/hms/es。 | Y |

`<type>` に応じて、PROPERTIES のパラメータは異なります。詳細は例を参照してください。


## 例

**1. yarn cluster モードで spark0 という名前の Spark リソースを作成する。**

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
Spark関連のパラメータは以下の通りです:
   - spark.master: 必須、現在yarn、spark://host:portをサポートします。
   - spark.submit.deployMode: Sparkプログラムのデプロイメントモード、必須、clusterとclientの両方をサポートします。
   - spark.hadoop.yarn.resourcemanager.address: masterがyarnの場合は必須。
   - spark.hadoop.fs.defaultFS: masterがyarnの場合は必須。
   - その他のパラメータはオプションです。[こちら](http://spark.apache.org/docs/latest/configuration.html)を参照してください

   

   SparkをETLに使用する場合、working_dirとbrokerを指定する必要があります。詳細は以下の通りです:

   - working_dir: ETLで使用されるディレクトリ。sparkをETLリソースとして使用する場合は必須です。例: hdfs://host:port/tmp/doris。
   - broker: broker名。sparkをETLリソースとして使用する場合は必須です。事前に`ALTER SYSTEM ADD BROKER`コマンドを使用して設定する必要があります。
   - broker.property_key: ETLによって生成された中間ファイルを読み取る際にbrokerが指定する必要がある認証情報。

**2. ODBCリソースの作成**

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
ODBCの関連パラメータは以下の通りです：
   - hosts: 外部データベースのIPアドレス
   - driver: ODBC外観のドライバ名。be/conf/odbcinst.iniのDriver名と同じである必要があります。
   - odbc_type: 外部データベースの種類。現在oracle、mysql、postgresqlをサポートしています
   - user: 外部データベースのユーザ名
   - password: 対応するユーザのパスワード情報
   - charset: 接続文字セット
   - ODBC Driverごとにカスタムパラメータを実装することもサポートしています。対応するODBC Driverの説明を参照してください

**3. S3リソースの作成**

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
S3リソースが[cold hot separation](../../../../table-design/tiered-storage/overview)に使用される場合、より多くの必須フィールドを追加する必要があります。

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
S3関連のパラメータは以下の通りです：
   - 必須パラメータ
       - `s3.endpoint`: s3エンドポイント
       - `s3.region`: s3リージョン
       - `s3.root.path`: s3ルートディレクトリ
       - `s3.access_key`: s3アクセスキー
       - `s3.secret_key`: s3シークレットキー
       - `s3.bucket`: s3バケット
   - オプションパラメータ
       - `s3.connection.maximum`: s3接続の最大数、デフォルトは50
       - `s3.connection.request.timeout`: s3リクエストタイムアウト、ミリ秒単位、デフォルトは3000
       - `s3.connection.timeout`: s3接続タイムアウト、ミリ秒単位、デフォルトは1000

    DorisはS3 Resourceの作成において`AWS Assume Role`もサポートしています。AWS統合を参照してください。

**4. JDBCリソースの作成**

   ```sql
   CREATE RESOURCE mysql_resource PROPERTIES (
      "type"="jdbc",
      "user"="root",
      "password"="123456",
      "jdbc_url" = "jdbc:mysql://127.0.0.1:3316/doris_test?useSSL=false",
      "driver_url" = "https://doris-community-test-1308700295.cos.ap-hongkong.myqcloud.com/jdbc_driver/mysql-connector-java-8.0.25.jar",
   "driver_class" = "com.mysql.cj.jdbc.Driver"
   );
   ```
JDBC関連のパラメータは以下の通りです：
   - user：データベースへの接続に使用するユーザー名
   - password：データベースへの接続に使用するパスワード
   - jdbc_url: 指定されたデータベースへの接続に使用する識別子
   - driver_url: JDBCドライバーパッケージのurl
   - driver_class: JDBCドライバーのclass

**5. HDFSリソースを作成する**

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
HDFS関連のパラメータは以下の通りです:
   - fs.defaultFS: namenodeのアドレスとポート
   - hadoop.username: hdfsのユーザー名
   - dfs.nameservices: hadoopでHAが有効な場合、fsのnameserviceを設定してください。hdfs-site.xmlを参照
   - dfs.ha.namenodes.[nameservice ID]：nameservice内の各NameNodeの一意識別子。hdfs-site.xmlを参照
   - dfs.namenode.rpc-address.[nameservice ID].[name node ID]`：各NameNodeがリッスンする完全修飾RPCアドレス。hdfs-site.xmlを参照
   - dfs.client.failover.proxy.provider.[nameservice ID]：HDFSクライアントがアクティブNameNodeに接続するために使用するJavaクラス、通常はorg.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider

**6. HMSリソースの作成**

   HMSリソースは[hms catalog](../../../../lakehouse/catalogs/hive-catalog.mdx)の作成に使用されます

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
HMS関連のパラメータは以下の通りです：
   - hive.metastore.uris: hive metastoreサーバーアドレス
   オプション：
   - dfs.*: hiveデータがhdfs上にある場合、HDFSリソースパラメータを追加するか、hive-site.xmlをfe/confにコピーしてください。
   - s3.*: hiveデータがs3上にある場合、S3リソースパラメータを追加してください。[Aliyun Data Lake Formation](https://www.aliyun.com/product/bigdata/dlf)を使用する場合は、hive-site.xmlをfe/confにコピーしてください。

**7. ESリソースの作成**

   ```sql
   CREATE RESOURCE es_resource PROPERTIES (
      "type"="es",
      "hosts"="http://127.0.0.1:29200",
      "nodes_discovery"="false",
      "enable_keyword_sniff"="true"
   );
   ```
ES関連のパラメータは以下の通りです：
   - hosts: ES接続アドレス。1つまたは複数のノードが可能で、ロードバランスも受け入れられます
   - user: ESのユーザー名
   - password: ユーザーのパスワード
   - enable_docvalue_scan: クエリフィールドの値を取得するためにES/Lucene列ストレージを有効にするかどうか。デフォルトはtrueです
   - enable_keyword_sniff: ESの文字列分割タイプtext.fieldsを探査し、keywordでクエリするかどうか（デフォルトはtrue、falseは分割後のコンテンツにマッチします）
   - nodes_discovery: ESノード発見を有効にするかどうか。デフォルトはtrueです。ネットワーク分離時は、このパラメータをfalseに設定してください。指定されたノードのみに接続されます
   - http_ssl_enabled: ESクラスターがhttpsアクセスモードを有効にするかどうか。現在のFE/BE実装では、すべてを信頼します
