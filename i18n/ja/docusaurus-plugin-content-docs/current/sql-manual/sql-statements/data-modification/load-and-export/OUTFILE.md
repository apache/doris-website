---
{
  "title": "OUTFILE",
  "language": "ja",
  "description": "SELECT INTO OUTFILE コマンドは、クエリ結果をファイルにエクスポートするために使用されます。現在、HDFS、S3、BOS などのリモートストレージへのエクスポートをサポートしています。"
}
---
## 説明

`SELECT INTO OUTFILE`コマンドは、クエリ結果をファイルにエクスポートするために使用されます。現在、Brokerプロセス、S3プロトコル、またはHDFSプロトコルを通じて、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

## 構文:

```sql
<query_stmt>
INTO OUTFILE "<file_path>"
[ FORMAT AS <format_as> ]
[ <properties> ]
```
## 必須パラメータ

**1. `<query_stmt>`**   

クエリ文、有効なSQLである必要があります。[クエリ文ドキュメント](../../data-query/SELECT.md)を参照してください。

**2. `<file_path>`**

ファイル保存パスとファイルプレフィックス。ファイル保存パスとファイルプレフィックスを指定します。例：`hdfs://path/to/my_file_`  
最終的なファイル名は`my_file_`、ファイルシーケンス番号、ファイル形式のサフィックスで構成されます。ファイルシーケンス番号は0から始まり、数量は分割されるファイル数になります。例：  
- my_file_abcdefg_0.csv
- my_file_abcdefg_1.csv
- my_file_abcdegf_2.csv  

ファイルプレフィックスを省略してファイルディレクトリのみを指定することもできます。例：`hdfs://path/to/`

## オプションパラメータ

**1. `<format_as>`**

   エクスポート形式を指定します。現在、以下の形式をサポートしています：  
   - `CSV` (デフォルト)
   - `PARQUET`
   - `CSV_WITH_NAMES`
   - `CSV_WITH_NAMES_AND_TYPES`
   - `ORC`

   >   注意：PARQUET、CSV_WITH_NAMES、CSV_WITH_NAMES_AND_TYPES、ORCはバージョン1.2以降でサポートされています。

**2. `<properties>`**

```sql
[ PROPERTIES ("<key>"="<value>" [, ... ]) ]
```  
現在、Brokerプロセス経由、またはS3/HDFSプロトコル経由でのエクスポートをサポートしています。

**エクスポートファイル自体に関連するプロパティ**
- `column_separator`: カラム区切り文字、CSV関連フォーマットでのみ使用されます。バージョン1.2から、マルチバイト区切り文字をサポート、例："\\x01"、"abc"。
- `line_delimiter`: 行区切り文字、CSV関連フォーマットでのみ使用されます。バージョン1.2から、マルチバイト区切り文字をサポート、例："\\x01"、"abc"。
- `max_file_size`: 単一ファイルサイズ制限、結果がこの値を超える場合、複数のファイルに分割されます。`max_file_size`の値範囲は[5MB, 2GB]、デフォルトは`1GB`です。（ORCファイルフォーマットとしてエクスポートを指定する場合、実際の分割ファイルサイズは64MBの倍数になります。例：`max_file_size = 5MB`を指定すると、実際には64MBで分割されます；`max_file_size = 65MB`を指定すると、実際には128MBで分割されます）
- `delete_existing_files`: デフォルトは`false`、`true`と指定すると、まず`file_path`で指定されたディレクトリ下のすべてのファイルを削除してから、そのディレクトリにデータをエクスポートします。例："file_path" = "/user/tmp"の場合、"/user/"下のすべてのファイルとディレクトリを削除します；"file_path" = "/user/tmp/"の場合、"/user/tmp/"下のすべてのファイルとディレクトリを削除します。
- `file_suffix`: エクスポートファイルのサフィックスを指定、このパラメータを指定しない場合、ファイルフォーマットのデフォルトサフィックスが使用されます。
- `compress_type`: エクスポートファイルフォーマットをParquet / ORC ファイルと指定する際、Parquet / ORCファイルが使用する圧縮方法を指定できます。ParquetファイルフォーマットはSNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAINの圧縮方法を指定でき、デフォルト値はSNAPPYです。ORCファイルフォーマットはPLAIN、SNAPPY、ZLIB、ZSTDの圧縮方法を指定でき、デフォルト値はZLIBです。このパラメータはバージョン2.1.5からサポートされています。（PLAINは無圧縮を意味します）。バージョン3.1.1から、CSVフォーマットの圧縮アルゴリズムの指定をサポート、現在"plain"、"gz"、"bz2"、"snappyblock"、"lz4block"、"zstd"をサポートしています。

**Broker関連プロパティ**  _（プレフィックス `broker.` を追加する必要があります）_  
- `broker.name: broker`: name
- `broker.hadoop.security.authentication`: 認証方法をkerberosと指定
- `broker.kerberos_principal`: kerberos principalを指定
- `broker.kerberos_keytab`: kerberos keytabファイルパスを指定。このファイルはBrokerプロセスが存在するサーバー上のファイルの絶対パスである必要があります。そして、Brokerプロセスがアクセス可能である必要があります

**HDFS関連プロパティ**
- `fs.defaultFS`: namenodeアドレスとポート
- `hadoop.username`: hdfsユーザー名
- `dfs.nameservices`: name service名、hdfs-site.xmlと一致
- `dfs.ha.namenodes.[nameservice ID]`: namenode idリスト、hdfs-site.xmlと一致
- `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name node rpcアドレス、namenodeの数と同じ、hdfs-site.xmlと一致
- `dfs.client.failover.proxy.provider.[nameservice ID]`: HDFSクライアントがアクティブなnamenodeに接続するためのJavaクラス、通常"org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"

**kerberos認証が有効なHadoopクラスターの場合、追加のPROPERTIES属性を設定する必要があります:**
- `dfs.namenode.kerberos.principal`: HDFS namenodeサービスのPrincipal名
- `hadoop.security.authentication`: 認証方法をkerberosに設定
- `hadoop.kerberos.principal`: DorisがHDFSに接続する際に使用するKerberos principalを設定
- `hadoop.kerberos.keytab`: keytabローカルファイルパスを設定

S3プロトコルの場合、直接S3プロトコル設定を構成します:
 - `s3.endpoint`
 - `s3.access_key`
 - `s3.secret_key`
 - `s3.region`
 - `use_path_style`: （オプション）デフォルトは`false`。S3 SDKはデフォルトでVirtual-hosted Styleを使用します。しかし、一部のオブジェクトストレージシステムではVirtual-hosted Styleアクセスが有効でないか、サポートされていない場合があります。この場合、`use_path_style`パラメータを追加してPath Styleアクセスを強制的に使用できます。

> 注意: `delete_existing_files`パラメータを使用するには、`fe.conf`に`enable_delete_existing_files = true`設定を追加してfeを再起動する必要があり、その後delete_existing_filesが有効になります。delete_existing_files = trueは危険な操作です、テスト環境でのみ使用することを推奨します。

## 戻り値

Outfileステートメントによって返される結果、各カラムの意味は以下の通りです:

| カラム名 | 型     | 説明                                     |
|-------------|----------|-------------------------------------------------|
| FileNumber  | int      | 最終的に生成されるファイル数               |
| TotalRows   | int      | 結果セットの行数                    |
| FileSize    | int      | エクスポートファイルの総サイズ。単位: bytes。     |
| URL         | string   | エクスポートファイルパスのプレフィックス、複数ファイルはサフィックス `_0`,`_1` で順次番号付けされます。 |

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります:

| 権限  | オブジェクト        | 説明                    |
|:------------|:-------------|:-------------------------------|
| SELECT_PRIV | Database     | データベースとテーブルの読み取り権限が必要です。 |

## 注意事項

### データ型マッピング

- すべてのファイル型は基本データ型のエクスポートをサポートしますが、複合データ型（ARRAY/MAP/STRUCT）については、現在`csv`、`orc`、`csv_with_names`、`csv_with_names_and_types`のみが複合型のエクスポートをサポートしており、ネストした複合型はサポートされていません。

- ParquetとORCファイルフォーマットには独自のデータ型があり、Dorisのエクスポート機能はDorisデータ型をParquet/ORCファイルフォーマットの対応するデータ型に自動的にエクスポートできます。以下は、Apache Dorisデータ型とParquet/ORCファイルフォーマット間のデータ型マッピングテーブルです:

1. **DorisからORCファイルフォーマットデータ型マッピングテーブル:**
   | Doris Type              | Orc Type  |
   |-------------------------|-----------|
   | boolean                 | boolean   |
   | tinyint                 | tinyint   |
   | smallint                | smallint  |
   | int                     | int       |
   | bigint                  | bigint    |
   | largeInt                | string    |
   | date                    | string    |
   | datev2                  | string    |
   | datetime                | string    |
   | datetimev2              | timestamp |
   | float                   | float     |
   | double                  | double    |
   | char / varchar / string | string    |
   | decimal                 | decimal   |
   | struct                  | struct    |
   | map                     | map       |
   | array                   | array     |

2. **DorisからParquetファイルフォーマットデータ型マッピングテーブル:**

   DorisがParquetファイルフォーマットにエクスポートする際、まずDorisメモリデータをArrowメモリデータフォーマットに変換し、その後ArrowがParquetファイルフォーマットに書き込みます。Dorisデータ型とArrowデータ型間のマッピング関係は:
   | Doris Type              | Arrow Type |
   |-------------------------|------------|
   | boolean                 | boolean    |
   | tinyint                 | int8       |
   | smallint                | int16      |
   | int                     | int32      |
   | bigint                  | int64      |
   | largeInt                | utf8       |
   | date                    | utf8       |
   | datev2                  | utf8       |
   | datetime                | utf8       |
   | datetimev2              | utf8       |
   | float                   | float32    |
   | double                  | float64    |
   | char / varchar / string | utf8       |
   | decimal                 | decimal128 |
   | struct                  | struct     |
   | map                     | map        |
   | array                   | list       |

### エクスポートデータ量とエクスポート効率

   この機能は本質的にSQLクエリコマンドを実行します。最終結果は単一スレッドで出力されます。そのため、総エクスポート時間にはクエリ実行時間と最終結果セット書き込み時間が含まれます。クエリが大きい場合、セッション変数`query_timeout`を設定してクエリタイムアウトを適切に延長する必要があります。

### エクスポートファイル管理

   Dorisはエクスポートファイルを管理しません。正常にエクスポートされたファイルやエクスポート失敗後の残存ファイルを含め、すべてユーザー自身で処理する必要があります。

### ローカルファイルへのエクスポート
   ローカルファイルにエクスポートするには、まず`fe.conf`で`enable_outfile_to_local=true`を設定する必要があります

   ```sql
   select * from tbl1 limit 10 
   INTO OUTFILE "file:///home/work/path/result_";
   ```
ローカルファイルへのエクスポート機能は、パブリッククラウドユーザーには適していません。プライベートデプロイメントを行うユーザーのみが対象となります。この機能は、ユーザーがクラスターノードを完全に制御できることを前提としています。Dorisは、ユーザーが入力したエクスポートパスの有効性チェックを実行しません。Dorisプロセスユーザーがパスへの書き込み権限を持たない場合、またはパスが存在しない場合、エラーが報告されます。また、セキュリティ上の考慮から、パスに同じ名前のファイルが既に存在する場合も、エクスポートは失敗します。

   Dorisは、ローカルにエクスポートされたファイルを管理せず、ディスク容量などのチェックも行いません。これらのファイルはユーザー自身で管理する必要があります（クリーンアップなど）。

### 結果整合性保証

   このコマンドは同期コマンドであるため、実行中にタスク接続が切断される可能性があり、エクスポートされたデータが正常に終了したか、または完全であるかを知ることができません。この場合、`success_file_name`パラメータを使用して、タスクが正常に完了した後にディレクトリ内に成功ファイル識別子を生成するよう要求できます。ユーザーはこのファイルを使用して、エクスポートが正常に終了したかどうかを判断できます。

### 並行エクスポート

   Session变数`set enable_parallel_outfile = true;`を設定して、Outfile並行エクスポートを有効にします。

## 例

- Broker方式を使用したエクスポート、簡単なクエリ結果をファイル`hdfs://path/to/result.txt`にエクスポートします。エクスポート形式をCSVとして指定します。`my_broker`を使用し、kerberos認証情報を設定します。列区切り文字を`,`、行区切り文字を`\n`として指定します。

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "100MB"
    );
    ```
最終的に生成されるファイルは、100MBを超えない場合は`result_0.csv`になります。
   100MBを超える場合は、`result_0.csv, result_1.csv, ...`のようになる可能性があります。

- 単純なクエリ結果をファイル`hdfs://path/to/result.parquet`にエクスポートします。エクスポート形式をPARQUETとして指定します。`my_broker`を使用し、kerberos認証情報を設定します。

    ```sql
    SELECT c1, c2, c3 FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab"
    );
    ```
- CTE文クエリの結果をファイル`hdfs://path/to/result.txt`にエクスポートします。デフォルトのエクスポート形式はCSVです。`my_broker`を使用し、HDFS高可用性情報を設定します。デフォルトの行および列区切り文字を使用します。

    ```sql
    WITH
    x1 AS
    (SELECT k1, k2 FROM tbl1),
    x2 AS
    (SELECT k3 FROM tbl2)
    SELEC k1 FROM x1 UNION SELECT k3 FROM x2
    INTO OUTFILE "hdfs://path/to/result_"
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.username"="user",
        "broker.password"="passwd",
        "broker.dfs.nameservices" = "my_ha",
        "broker.dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "broker.dfs.client.failover.proxy.provider" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
    ```
最終的に生成されるファイルは、1GBを超えない場合は`result_0.csv`になります。
   1GBを超える場合は、`result_0.csv, result_1.csv, ...`になる可能性があります。

- UNION文のクエリ結果をファイル`bos://bucket/result.txt`にエクスポートします。エクスポート形式をPARQUETとして指定します。`my_broker`を使用し、HDFS高可用性情報を設定します。PARQUET形式では列区切り文字を指定する必要はありません。
   エクスポート完了後、識別子ファイルを生成します。

    ```sql
    SELECT k1 FROM tbl1 UNION SELECT k2 FROM tbl1
    INTO OUTFILE "bos://bucket/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.bos_endpoint" = "http://bj.bcebos.com",
        "broker.bos_accesskey" = "xxxxxxxxxxxxxxxxxxxxxxxxxx",
        "broker.bos_secret_accesskey" = "yyyyyyyyyyyyyyyyyyyyyyyyyy"
    );
    ```
- Select文のクエリ結果をファイル`s3a://${bucket_name}/path/result.txt`にエクスポートします。エクスポート形式はCSVとして指定します。
   エクスポート完了後、識別子ファイルを生成します。

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "s3a://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "hdfs_broker",
        "broker.fs.s3a.access.key" = "xxx",
        "broker.fs.s3a.secret.key" = "xxxx",
        "broker.fs.s3a.endpoint" = "https://cos.xxxxxx.myqcloud.com/",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```
最終生成されるファイルは、1GBより小さい場合は `my_file_0.csv` になります。
   1GBより大きい場合は、`my_file_0.csv, result_1.csv, ...` のようになる可能性があります。
   cosでの検証:

        1. 存在しないパスは自動的に作成されます
        2. access.key/secret.key/endpointはcosの同僚と確認する必要があります。特にendpoint値については、bucket_nameを入力する必要はありません。

- S3プロトコルを使用してbosにエクスポートし、並行エクスポートが有効になっています。

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```
最終的に生成されるファイルのプレフィックスは `my_file_{fragment_instance_id}_` になります。

- 同時エクスポートSession変数を有効にして、S3プロトコルを使用してbosにエクスポートします。
   注意：ただし、クエリ文にトップレベルのソートノードが含まれているため、同時エクスポートSession変数が有効になっていても、このクエリは同時エクスポートを使用できません。

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 order by k1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```
- HDFS方式を使用してエクスポートし、単純なクエリ結果をファイル`hdfs://${host}:${fileSystem_port}/path/to/result.txt`にエクスポートします。エクスポート形式をCSVとして指定し、ユーザー名をworkとして指定します。列区切り文字を`,`、行区切り文字を`\n`として指定します。

    ```sql
    -- fileSystem_port default value is 9000
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://${host}:${fileSystem_port}/path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "fs.defaultFS" = "hdfs://ip:port",
        "hadoop.username" = "work"
    );
    ```
Hadoopクラスターで高可用性が有効になっており、Kerberos認証を使用している場合は、以下のSQL文を参照してください：

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
    'fs.defaultFS'='hdfs://hacluster/',
    'dfs.nameservices'='hacluster',
    'dfs.ha.namenodes.hacluster'='n1,n2',
    'dfs.namenode.rpc-address.hacluster.n1'='192.168.0.1:8020',
    'dfs.namenode.rpc-address.hacluster.n2'='192.168.0.2:8020',
    'dfs.client.failover.proxy.provider.hacluster'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'dfs.namenode.kerberos.principal'='hadoop/_HOST@REALM.COM'
    'hadoop.security.authentication'='kerberos',
    'hadoop.kerberos.principal'='doris_test@REALM.COM',
    'hadoop.kerberos.keytab'='/path/to/doris_test.keytab'
    );
    ```
最終的に生成されるファイルは、100MBを超えない場合は `result_0.csv` になります。
   100MBを超える場合は、`result_0.csv, result_1.csv, ...` のようになる可能性があります。

- Select文のクエリ結果をTencent Cloud cosファイル `cosn://${bucket_name}/path/result.txt` にエクスポートします。エクスポート形式としてCSVを指定します。
   エクスポート完了後、識別子ファイルを生成します。

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "cosn://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "broker_name",
        "broker.fs.cosn.userinfo.secretId" = "xxx",
        "broker.fs.cosn.userinfo.secretKey" = "xxxx",
        "broker.fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxx.myqcloud.com",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```
