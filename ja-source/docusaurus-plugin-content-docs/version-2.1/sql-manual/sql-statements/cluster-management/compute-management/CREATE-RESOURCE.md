---
{
  "title": "リソースを作成",
  "language": "ja",
  "description": "このステートメントはリソースを作成するために使用されます。rootまたはadminユーザーのみがリソースを作成できます。現在、Spark、ODBC、S3外部リソースをサポートしています。"
}
---
## 説明

このステートメントはリソースの作成に使用されます。rootまたはadminユーザーのみがリソースを作成できます。現在はSpark、ODBC、S3外部リソースをサポートしています。
将来的には、クエリ用のSpark/GPU、外部ストレージ用のHDFS/S3、ETL用のMapReduceなど、他の外部リソースがDorisに追加される可能性があります。

## 構文

```sql
CREATE [EXTERNAL] RESOURCE "<resource_name>"
PROPERTIES (
   `<property>`
    [ , ... ]
);
```
## パラメータ

1.`<type>`

`<property>` は `<key>` = `<value>` の形式で、`<key>` で使用可能な具体的な値は以下の通りです：

| Parameter | Description | Required |
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
Spark関連のパラメータは以下の通りです：
   - spark.master: 必須、現在yarn、spark://host:portをサポートしています。
   - spark.submit.deployMode: Sparkプログラムのデプロイメントモード、必須、clusterとclientの両方をサポートしています。
   - spark.hadoop.yarn.resourcemanager.address: masterがyarnの場合に必須。
   - spark.hadoop.fs.defaultFS: masterがyarnの場合に必須。
   - その他のパラメータはオプションです。[こちら](http://spark.apache.org/docs/latest/configuration.html)を参照してください

   

   SparkをETLに使用する場合、working_dirとbrokerを指定する必要があります。以下に説明します：

   - working_dir: ETLで使用されるディレクトリ。sparkをETLリソースとして使用する場合に必須。例：hdfs://host:port/tmp/doris。
   - broker: broker名。sparkをETLリソースとして使用する場合に必須。`ALTER SYSTEM ADD BROKER`コマンドを使用して事前に設定する必要があります。
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
   - driver: ODBCの外観のドライバ名で、be/conf/odbcinst.iniのDriver名と同じである必要があります
   - odbc_type: 外部データベースのタイプ、現在oracle、mysql、postgresqlをサポートしています
   - user: 外部データベースのユーザー名
   - password: 対応するユーザーのパスワード情報
   - charset: 接続文字セット
   - また、ODBCドライバごとにカスタムパラメータの実装もサポートしています。対応するODBCドライバの説明を参照してください

**3. S3リソースを作成する**

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
S3リソースが[cold hot separation](../../../../table-design/tiered-storage/overview)に使用される場合は、さらに必要なフィールドを追加する必要があります。

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
       - `s3.endpoint`: s3 endpoint
       - `s3.region`:s3 region
       - `s3.root.path`: s3 root directory
       - `s3.access_key`: s3 access key
       - `s3.secret_key`: s3 secret key
       - `s3.bucket`：s3 bucket
   - オプションパラメータ
       - `s3.connection.maximum`: s3接続の最大数、デフォルトは50
       - `s3.connection.request.timeout`: s3リクエストタイムアウト、ミリ秒単位、デフォルトは3000
       - `s3.connection.timeout`: s3接続タイムアウト、ミリ秒単位、デフォルトは1000

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
   - jdbc_url：指定されたデータベースへの接続に使用する識別子
   - driver_url：JDBCドライバパッケージのurl
   - driver_class：JDBCドライバのclass

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
HDFSに関連するパラメータは以下の通りです：
   - fs.defaultFS: namenodeのアドレスとポート
   - hadoop.username: hdfsのユーザー名
   - dfs.nameservices: hadoopでHAが有効になっている場合、fsのnameserviceを設定してください。hdfs-site.xmlを参照
   - dfs.ha.namenodes.[nameservice ID]：nameservice内の各NameNodeの一意の識別子。hdfs-site.xmlを参照
   - dfs.namenode.rpc-address.[nameservice ID].[name node ID]`：各NameNodeがリスンする完全修飾RPCアドレス。hdfs-site.xmlを参照
   - dfs.client.failover.proxy.provider.[nameservice ID]：HDFSクライアントがアクティブなNameNodeに接続するために使用するJavaクラス。通常はorg.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider

**6. HMSリソースの作成**

   HMSリソースは[hms catalog](../../../../lakehouse/datalake-analytics/hive)の作成に使用されます

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
   - s3.*: hiveデータがs3上にある場合、S3リソースパラメータを追加してください。[Aliyun Data Lake Formation](https://www.aliyun.com/product/bigdata/dlf)を使用している場合は、hive-site.xmlをfe/confにコピーしてください。

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
   - hosts: ES接続アドレス、1つまたは複数のノードが可能、負荷分散も受け入れられます
   - user: ESのユーザー名
   - password: ユーザーのパスワード
   - enable_docvalue_scan: クエリフィールドの値を取得するためにES/Lucene列ストレージを有効にするかどうか、デフォルトはtrue
   - enable_keyword_sniff: ESで文字列分割タイプtext.fieldsを調査し、keywordでクエリするかどうか（デフォルトはtrue、falseは分割後のコンテンツにマッチ）
   - nodes_discovery: ESノード検出を有効にするかどうか、デフォルトはtrue。ネットワーク分離環境では、このパラメータをfalseに設定。指定されたノードのみに接続
   - http_ssl_enabled: ESクラスターがhttpsアクセスモードを有効にするかどうか、現在のFE/BE実装はすべてを信頼
