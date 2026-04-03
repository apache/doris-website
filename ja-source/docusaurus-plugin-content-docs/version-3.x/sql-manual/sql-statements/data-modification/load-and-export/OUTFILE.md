---
{
  "title": "OUTFILE",
  "description": "SELECT INTO OUTFILE コマンドは、クエリ結果をファイルにエクスポートするために使用されます。現在、HDFS、S3、BOS などのリモートストレージへのエクスポートをサポートしています。",
  "language": "ja"
}
---
## 説明

`SELECT INTO OUTFILE`コマンドは、クエリ結果をファイルにエクスポートするために使用されます。現在、Brokerプロセス、S3プロトコル、またはHDFSプロトコルを通じて、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

## 構文：

```sql
<query_stmt>
INTO OUTFILE "<file_path>"
[ FORMAT AS <format_as> ]
[ <properties> ]
```
## 必須パラメータ

**1. `<query_stmt>`**   

クエリステートメント。有効なSQLである必要があります。[query statement ドキュメント](../../data-query/SELECT.md)を参照してください。

**2. `<file_path>`**

ファイル保存パスとファイルプレフィックス。ファイル保存パスとファイルプレフィックスを指定します。例：`hdfs://path/to/my_file_`  
最終的なファイル名は、`my_file_`、ファイルシーケンス番号、ファイル形式の拡張子で構成されます。ファイルシーケンス番号は0から開始され、数量は分割されたファイル数となります。例：
- my_file_abcdefg_0.csv
- my_file_abcdefg_1.csv
- my_file_abcdegf_2.csv  

ファイルプレフィックスを省略し、ファイルディレクトリのみを指定することも可能です。例：`hdfs://path/to/`

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
現在、Broker プロセス経由、または S3/HDFS プロトコル経由でのエクスポートをサポートしています。

**エクスポートファイル自体に関連するプロパティ**
- `column_separator`: 列区切り文字、CSV 関連フォーマットでのみ使用されます。バージョン 1.2 以降、マルチバイト区切り文字をサポートします。例: "\\x01", "abc"。
- `line_delimiter`: 行区切り文字、CSV 関連フォーマットでのみ使用されます。バージョン 1.2 以降、マルチバイト区切り文字をサポートします。例: "\\x01", "abc"。
- `max_file_size`: 単一ファイルサイズ制限、結果がこの値を超える場合、複数のファイルに分割されます。`max_file_size` の値の範囲は [5MB, 2GB]、デフォルトは `1GB` です。（ORC ファイル形式としてエクスポートを指定する場合、実際の分割ファイルサイズは 64MB の倍数になります。例: `max_file_size = 5MB` を指定した場合、実際には 64 MB で分割されます; `max_file_size = 65MB` を指定した場合、実際には 128 MB で分割されます）
- `delete_existing_files`: デフォルトは `false`、`true` を指定すると、`file_path` で指定されたディレクトリ下のすべてのファイルを最初に削除してから、そのディレクトリにデータをエクスポートします。例: "file_path" = "/user/tmp" の場合、"/user/" 下のすべてのファイルとディレクトリを削除します; "file_path" = "/user/tmp/" の場合、"/user/tmp/" 下のすべてのファイルとディレクトリを削除します。
- `file_suffix`: エクスポートされるファイルの拡張子を指定します。このパラメータが指定されない場合、ファイル形式のデフォルト拡張子が使用されます。
- `compress_type`: エクスポートされるファイル形式を Parquet / ORC ファイルとして指定する場合、Parquet / ORC ファイルで使用される圧縮方法を指定できます。Parquet ファイル形式では SNAPPY, GZIP, BROTLI, ZSTD, LZ4 および PLAIN を圧縮方法として指定でき、デフォルト値は SNAPPY です。ORC ファイル形式では PLAIN, SNAPPY, ZLIB および ZSTD を圧縮方法として指定でき、デフォルト値は ZLIB です。このパラメータはバージョン 2.1.5 以降でサポートされています。（PLAIN は圧縮なしを意味します）。バージョン 3.1.1 以降、CSV 形式の圧縮アルゴリズムの指定をサポートし、現在 "plain", "gz", "bz2", "snappyblock", "lz4block", "zstd" をサポートします。

**Broker 関連プロパティ** _（プレフィックス `broker.` を追加する必要があります）_
- `broker.name: broker`: 名前
- `broker.hadoop.security.authentication`: 認証方法を kerberos として指定
- `broker.kerberos_principal`: kerberos principal を指定
- `broker.kerberos_keytab`: kerberos keytab ファイルパスを指定。このファイルは Broker プロセスが配置されているサーバー上のファイルの絶対パスである必要があります。そして Broker プロセスからアクセス可能である必要があります

**HDFS 関連プロパティ**
- `fs.defaultFS`: namenode アドレスとポート
- `hadoop.username`: hdfs ユーザー名
- `dfs.nameservices`: ネームサービス名、hdfs-site.xml と一致
- `dfs.ha.namenodes.[nameservice ID]`: namenode id リスト、hdfs-site.xml と一致
- `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: ネームノード rpc アドレス、namenode 数と同じ数、hdfs-site.xml と一致
- `dfs.client.failover.proxy.provider.[nameservice ID]`: HDFS クライアントがアクティブな namenode に接続するための Java クラス、通常 "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"

**kerberos 認証が有効になっている Hadoop クラスターの場合、追加の PROPERTIES 属性を設定する必要があります:**
- `dfs.namenode.kerberos.principal`: HDFS namenode サービスのプリンシパル名
- `hadoop.security.authentication`: 認証方法を kerberos に設定
- `hadoop.kerberos.principal`: Doris が HDFS に接続する際に使用する Kerberos プリンシパルを設定
- `hadoop.kerberos.keytab`: keytab ローカルファイルパスを設定

S3 プロトコルの場合、S3 プロトコル設定を直接設定します:
 - `s3.endpoint`
 - `s3.access_key`
 - `s3.secret_key`
 - `s3.region`
 - `use_path_style`: （オプション）デフォルトは `false`。S3 SDK はデフォルトで Virtual-hosted Style を使用します。ただし、一部のオブジェクトストレージシステムでは Virtual-hosted Style アクセスが有効になっていないかサポートされていない可能性があります。この場合、`use_path_style` パラメータを追加して Path Style アクセスの使用を強制できます。

> 注意: `delete_existing_files` パラメータを使用するには、`fe.conf` で `enable_delete_existing_files = true` 設定を追加し、fe を再起動する必要があります。その後 delete_existing_files が有効になります。delete_existing_files = true は危険な操作のため、テスト環境でのみ使用することをお勧めします。

## 戻り値

Outfile ステートメントが返す結果、各列の意味は以下の通りです:

| 列名 | 型     | 説明                                     |
|-------------|----------|-------------------------------------------------|
| FileNumber  | int      | 最終的に生成されたファイル数               |
| TotalRows   | int      | 結果セットの行数                    |
| FileSize    | int      | エクスポートされたファイルの合計サイズ。単位: バイト     |
| URL         | string   | エクスポートされたファイルパスのプレフィックス、複数のファイルは `_0`,`_1` の順に番号付きサフィックスが付けられます。 |

## 権限制御

この SQL コマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります:

| 権限  | オブジェクト        | 説明                    |
|:------------|:-------------|:-------------------------------|
| SELECT_PRIV | Database     | データベースとTableに対する読み取り権限が必要です。 |

## 注意事項

### データ型マッピング

- すべてのファイル型は基本データ型のエクスポートをサポートしていますが、複合データ型（ARRAY/MAP/STRUCT）については、現在 `csv`, `orc`, `csv_with_names` および `csv_with_names_and_types` のみが複合型のエクスポートをサポートしており、ネストした複合型はサポートされていません。

- Parquet および ORC ファイル形式には独自のデータ型があり、Doris のエクスポート機能は Doris データ型を Parquet/ORC ファイル形式の対応するデータ型に自動的にエクスポートできます。以下は Apache Doris データ型と Parquet/ORC ファイル形式間のデータ型マッピングTableです:

1. **Doris から ORC ファイル形式データ型マッピングTable:**
   | Doris タイプ              | Orc タイプ  |
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

2. **Doris から Parquet ファイル形式データ型マッピングTable:**

   Doris が Parquet ファイル形式にエクスポートする場合、まず Doris メモリデータを Arrow メモリデータ形式に変換し、その後 Arrow が Parquet ファイル形式に書き込みます。Doris データ型と Arrow データ型間のマッピング関係は:
   | Doris タイプ              | Arrow タイプ |
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

   この機能は本質的に SQL クエリコマンドを実行します。最終結果は単一スレッドで出力されます。そのため、総エクスポート時間にはクエリ実行時間と最終結果セット書き込み時間が含まれます。クエリが大きい場合、セッション変数 `query_timeout` を設定してクエリタイムアウトを適切に延長する必要があります。

### エクスポートされたファイル管理

   Doris はエクスポートされたファイルを管理しません。正常にエクスポートされたファイルやエクスポート失敗後の残存ファイルを含め、すべてユーザー自身で処理する必要があります。

### ローカルファイルへのエクスポート
   ローカルファイルにエクスポートするには、まず `fe.conf` で `enable_outfile_to_local=true` を設定する必要があります

   ```sql
   select * from tbl1 limit 10 
   INTO OUTFILE "file:///home/work/path/result_";
   ```
ローカルファイルへのエクスポート機能は、パブリッククラウドのユーザーには適さず、プライベート配置のユーザーのみを対象としています。また、ユーザーがクラスターノードを完全に制御できることを前提としています。Dorisは、ユーザーが入力したエクスポートパスの妥当性チェックを実行しません。Dorisプロセスユーザーがそのパスに対する書き込み権限を持たない場合、またはパスが存在しない場合、エラーが報告されます。また、セキュリティの観点から、パスに同じ名前のファイルがすでに存在する場合も、エクスポートは失敗します。

   Dorisはローカルにエクスポートされたファイルを管理せず、ディスク容量のチェックなども行いません。これらのファイルは、クリーンアップなど、ユーザー自身が管理する必要があります。

### 結果の整合性保証

   このコマンドは同期コマンドであるため、実行中にタスク接続が切断され、エクスポートされたデータが正常に終了したか、または完全であるかを知ることができない可能性があります。この場合、`success_file_name`パラメータを使用して、正常完了後にディレクトリ内に成功ファイル識別子を生成するようタスクに要求できます。ユーザーはこのファイルを使用して、エクスポートが正常に終了したかを判定できます。

### 並行エクスポート

   Session変数`set enable_parallel_outfile = true;`を設定して、Outfileの並行エクスポートを有効にします。

## 例

- Broker方式を使用したエクスポート、単純なクエリ結果をファイル`hdfs://path/to/result.txt`にエクスポート。エクスポート形式をCSVとして指定。`my_broker`を使用してkerberos認証情報を設定。列区切り文字を`,`、行区切り文字を`\n`として指定。

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
最終的に生成されるファイルは、100MBを超えない場合は `result_0.csv` になります。
   100MBを超える場合は、`result_0.csv, result_1.csv, ...` のようになる可能性があります。

- 単純なクエリ結果をファイル `hdfs://path/to/result.parquet` にエクスポートします。エクスポート形式をPARQUETとして指定します。`my_broker` を使用し、kerberos認証情報を設定します。

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
- CTE文のクエリ結果をファイル `hdfs://path/to/result.txt` にエクスポートします。デフォルトのエクスポート形式はCSVです。`my_broker` を使用し、HDFS高可用性情報を設定します。デフォルトの行および列区切り文字を使用します。

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
最終的に生成されるファイルは、1GBを超えない場合は`result_0.csv`となります。
   1GBを超える場合は、`result_0.csv, result_1.csv, ...`となる可能性があります。

- UNION文のクエリ結果をファイル`bos://bucket/result.txt`にエクスポートします。エクスポート形式をPARQUETとして指定します。`my_broker`を使用し、HDFSの高可用性情報を設定します。PARQUET形式では列区切り文字を指定する必要はありません。
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
- Select文のクエリ結果をファイル`s3a://${bucket_name}/path/result.txt`にエクスポートします。エクスポート形式はCSVを指定してください。
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
最終的に生成されるファイルは、1GBより大きくない場合は`my_file_0.csv`になります。
   1GBより大きい場合は、`my_file_0.csv, result_1.csv, ...`になる可能性があります。
   cosでの検証：

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
最終的に生成されるファイルプレフィックスは`my_file_{fragment_instance_id}_`になります。

- S3プロトコルを使用してbosにエクスポートし、concurrent export Session変数を有効にします。
   注意: ただし、クエリ文にトップレベルのソートノードが含まれているため、concurrent export Session変数が有効になっていても、このクエリはconcurrent exportを使用できません。

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
Hadoopクラスタで高可用性が有効になっており、Kerberos認証を使用している場合は、以下のSQL文を参照してください：

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
最終的に生成されるファイルは、100 MBを超えない場合は `result_0.csv` になります。
   100 MBを超える場合は、`result_0.csv, result_1.csv, ...` のようになる可能性があります。

- Select文のクエリ結果をTencent Cloud cosファイル `cosn://${bucket_name}/path/result.txt` にエクスポートします。エクスポート形式をCSVとして指定します。
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
