---
{
  "title": "OUTFILE",
  "description": "SELECT INTO OUTFILE コマンドは、クエリ結果をファイルにエクスポートするために使用されます。現在、HDFS、S3、BOS などのリモートストレージへのエクスポートをサポートしています。",
  "language": "ja"
}
---
## デスクリプション

`SELECT INTO OUTFILE` コマンドは、クエリ結果をファイルにエクスポートするために使用されます。現在、Brokerプロセス、S3プロトコル、またはHDFSプロトコルを通じて、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

## Syntax:

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

ファイルの保存パスとファイルプレフィックス。ファイルの保存パスとファイルプレフィックスを指定します。例：`hdfs://path/to/my_file_`
最終的なファイル名は、`my_file_`、ファイルシーケンス番号、およびファイル形式のサフィックスで構成されます。ファイルシーケンス番号は0から開始し、数量は分割されるファイル数です。例：
- my_file_abcdefg_0.csv
- my_file_abcdefg_1.csv
- my_file_abcdegf_2.csv

ファイルプレフィックスを省略して、ファイルディレクトリのみを指定することも可能です。例：`hdfs://path/to/`

## オプションパラメータ

**1. `<format_as>`**

   エクスポート形式を指定します。現在、以下の形式をサポートしています：
   - `CSV`（デフォルト）
   - `PARQUET`
   - `CSV_WITH_NAMES`
   - `CSV_WITH_NAMES_AND_TYPES`
   - `ORC`

   >   注意：PARQUET、CSV_WITH_NAMES、CSV_WITH_NAMES_AND_TYPES、ORCはバージョン1.2以降でサポートされています。

**2. `<properties>`**

```sql
[ PROPERTIES ("<key>"="<value>" [, ... ]) ]
```  
現在、Brokerプロセスまたは S3/HDFS プロトコルを通じたエクスポートをサポートしています。

**エクスポートファイル自体に関連するプロパティ**
- `column_separator`: カラム区切り文字。CSV関連フォーマットでのみ使用。バージョン1.2以降、マルチバイト区切り文字をサポートします。例: "\\x01", "abc"。
- `line_delimiter`: 行区切り文字。CSV関連フォーマットでのみ使用。バージョン1.2以降、マルチバイト区切り文字をサポートします。例: "\\x01", "abc"。
- `max_file_size`: 単一ファイルサイズ制限。結果がこの値を超える場合、複数のファイルに分割されます。`max_file_size` の値の範囲は [5MB, 2GB] で、デフォルトは `1GB` です。（ORCファイル形式でエクスポートを指定する場合、実際の分割ファイルサイズは64MBの倍数になります。例: `max_file_size = 5MB` を指定した場合、実際には64MBで分割され、`max_file_size = 65MB` を指定した場合、実際には128MBで分割されます）
- `delete_existing_files`: デフォルトは `false` です。`true` を指定すると、最初に `file_path` で指定されたディレクトリ下のすべてのファイルを削除してから、そのディレクトリにデータをエクスポートします。例: "file_path" = "/user/tmp" の場合、"/user/" 下のすべてのファイルとディレクトリを削除します。"file_path" = "/user/tmp/" の場合、"/user/tmp/" 下のすべてのファイルとディレクトリを削除します。
- `file_suffix`: エクスポートファイルの拡張子を指定します。このパラメータが指定されない場合、ファイル形式のデフォルトの拡張子が使用されます。
- `compress_type`: エクスポートファイル形式を Parquet / ORC ファイルとして指定する場合、Parquet / ORC ファイルで使用される圧縮方法を指定できます。Parquetファイル形式では、SNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAIN の圧縮方法を指定でき、デフォルト値は SNAPPY です。ORCファイル形式では、PLAIN、SNAPPY、ZLIB、ZSTD の圧縮方法を指定でき、デフォルト値は ZLIB です。このパラメータはバージョン2.1.5以降でサポートされます。（PLAIN は圧縮なしを意味します）。バージョン3.1.1以降、CSV形式の圧縮アルゴリズムの指定をサポートし、現在 "plain", "gz", "bz2", "snappyblock", "lz4block", "zstd" をサポートします。

**Broker関連プロパティ** _(プレフィックス `broker.` を追加する必要があります)_
- `broker.name: broker`: 名前
- `broker.hadoop.security.authentication`: 認証方法を kerberos として指定
- `broker.kerberos_principal`: kerberos principal を指定
- `broker.kerberos_keytab`: kerberos keytab ファイルパスを指定。このファイルは、Brokerプロセスが配置されているサーバー上のファイルの絶対パスである必要があり、Brokerプロセスによってアクセス可能である必要があります

**HDFS関連プロパティ**
- `fs.defaultFS`: namenode のアドレスとポート
- `hadoop.username`: hdfs ユーザー名
- `dfs.nameservices`: name service 名。hdfs-site.xml と一致
- `dfs.ha.namenodes.[nameservice ID]`: namenode id リスト。hdfs-site.xml と一致
- `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name node rpc アドレス。namenode数と同じ数で、hdfs-site.xml と一致
- `dfs.client.failover.proxy.provider.[nameservice ID]`: HDFSクライアントがアクティブ namenode に接続するための Java クラス。通常は "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"

**kerberos認証が有効なHadoopクラスターの場合、追加のPROPERTIES属性を設定する必要があります:**
- `dfs.namenode.kerberos.principal`: HDFS namenode サービスのプリンシパル名
- `hadoop.security.authentication`: 認証方法を kerberos に設定
- `hadoop.kerberos.principal`: Doris が HDFS に接続する際に使用する Kerberos プリンシパルを設定
- `hadoop.kerberos.keytab`: keytab ローカルファイルパスを設定

S3プロトコルの場合、S3プロトコル設定を直接設定します:
 - `s3.endpoint`
 - `s3.access_key`
 - `s3.secret_key`
 - `s3.region`
 - `use_path_style`: (オプション) デフォルトは `false` です。S3 SDK はデフォルトで Virtual-hosted Style を使用します。ただし、一部のオブジェクトストレージシステムでは Virtual-hosted Style アクセスが有効化されていないか、サポートされていない場合があります。この場合、`use_path_style` パラメータを追加して、Path Style アクセスの使用を強制できます。

> 注意: `delete_existing_files` パラメータを使用するには、`fe.conf` に設定 `enable_delete_existing_files = true` を追加してfeを再起動する必要があり、その後 delete_existing_files が有効になります。delete_existing_files = true は危険な操作であり、テスト環境でのみ使用することを推奨します。

## 戻り値

Outfile文が返す結果の各カラムの意味は以下の通りです:

| カラム名    | 型       | 説明                                            |
|-------------|----------|-------------------------------------------------|
| FileNumber  | int      | 最終的に生成されたファイル数                    |
| TotalRows   | int      | 結果セットの行数                                |
| FileSize    | int      | エクスポートされたファイルの総サイズ。単位: bytes。|
| URL         | string   | エクスポートファイルパスのプレフィックス。複数ファイルの場合、`_0`,`_1` の接尾辞で順次番号付けされます。|

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります:

| 権限        | オブジェクト  | 説明                              |
|:------------|:-------------|:-------------------------------|
| SELECT_PRIV | Database     | データベースとTableの読み取り権限が必要。|

## 注意事項

### データ型マッピング

- すべてのファイル型は基本データ型のエクスポートをサポートしますが、複合データ型（ARRAY/MAP/STRUCT）については、現在 `csv`, `orc`, `csv_with_names`, `csv_with_names_and_types` のみが複合型のエクスポートをサポートし、ネストした複合型はサポートしません。

- ParquetとORCファイル形式には独自のデータ型があり、Dorisのエクスポート機能はDorisデータ型をParquet/ORCファイル形式の対応するデータ型に自動的にエクスポートできます。以下は、Apache Dorisデータ型とParquet/ORCファイル形式間のデータ型マッピングTableです:

1. **DorisからORCファイル形式データ型マッピングTable:**
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

2. **DorisからParquetファイル形式データ型マッピングTable:**

   DorisがParquetファイル形式にエクスポートする際、最初にDorisメモリデータをArrowメモリデータ形式に変換し、その後ArrowがParquetファイル形式に書き込みます。Dorisデータ型とArrowデータ型間のマッピング関係は:
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

   この機能は本質的にSQLクエリコマンドを実行します。最終結果はシングルスレッドで出力されます。そのため、総エクスポート時間にはクエリ実行時間と最終結果セット書き込み時間が含まれます。クエリが大規模な場合、セッション変数 `query_timeout` を設定してクエリタイムアウトを適切に延長する必要があります。

### エクスポートファイル管理

   Dorisはエクスポートされたファイルを管理しません。正常にエクスポートされたファイルやエクスポート失敗後の残留ファイルを含め、すべてユーザー自身で処理する必要があります。

### ローカルファイルへのエクスポート
   ローカルファイルにエクスポートするには、まず `fe.conf` で `enable_outfile_to_local=true` を設定する必要があります

   ```sql
   select * from tbl1 limit 10 
   INTO OUTFILE "file:///home/work/path/result_";
   ```
ローカルファイルへのエクスポート機能は、パブリッククラウドユーザーには適していません。プライベートデプロイメントを持つユーザーのみが対象です。また、ユーザーがクラスターノードを完全に制御できることを前提としています。Dorisは、ユーザーが入力したエクスポートパスの有効性チェックを実行しません。Dorisプロセスユーザーがパスへの書き込み権限を持たない場合、またはパスが存在しない場合、エラーが報告されます。また、セキュリティ上の考慮により、パスに同じ名前のファイルが既に存在する場合、エクスポートも失敗します。

   Dorisは、ローカルにエクスポートされたファイルを管理せず、ディスク容量などもチェックしません。これらのファイルは、クリーンアップなど、ユーザー自身で管理する必要があります。

### 結果整合性保証

   このコマンドは同期コマンドであるため、実行中にタスク接続が切断され、エクスポートされたデータが正常に終了したか、または完全であるかを知ることができない可能性があります。この場合、`success_file_name`パラメータを使用して、正常完了後にタスクがディレクトリ内に成功ファイル識別子を生成するよう要求できます。ユーザーはこのファイルを使用して、エクスポートが正常に終了したかを判断できます。

### 並行エクスポート

   Sessionvariable `set enable_parallel_outfile = true;`を設定して、Outfile並行エクスポートを有効にします。

## 例

- Broker方式を使用してエクスポートし、シンプルなクエリ結果をファイル`hdfs://path/to/result.txt`にエクスポートします。エクスポート形式をCSVとして指定します。`my_broker`を使用し、kerberos認証情報を設定します。列区切り文字を`,`、行区切り文字を`\n`として指定します。

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

- 簡単なクエリ結果をファイル `hdfs://path/to/result.parquet` にエクスポートします。エクスポート形式をPARQUETとして指定します。`my_broker` を使用し、kerberos認証情報を設定します。

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
- CTE文のクエリ結果をファイル`hdfs://path/to/result.txt`にエクスポートします。デフォルトのエクスポート形式はCSVです。`my_broker`を使用し、HDFS高可用性情報を設定します。デフォルトの行および列区切り文字を使用します。

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
最終的に生成されるファイルは、1GBを超えない場合は `result_0.csv` になります。
   1GBを超える場合は、`result_0.csv, result_1.csv, ...` となる可能性があります。

- UNION文のクエリ結果をファイル `bos://bucket/result.txt` にエクスポートします。エクスポート形式をPARQUETとして指定します。`my_broker` を使用し、HDFS高可用性情報を設定します。PARQUET形式では列区切り文字を指定する必要はありません。
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
最終的に生成されるファイルは、1GBより大きくない場合は`my_file_0.csv`になります。
   1GBより大きい場合は、`my_file_0.csv, result_1.csv, ...`のようになる可能性があります。
   cosでの検証：

        1. 存在しないパスは自動的に作成されます
        2. access.key/secret.key/endpointはcos担当者との確認が必要です。特にendpoint値については、bucket_nameを入力する必要はありません。

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
最終生成されるファイルのプレフィックスは`my_file_{fragment_instance_id}_`になります。

- S3プロトコルを使用してbosにエクスポートし、concurrent export Sessionの変数を有効にします。
   注意：ただし、クエリステートメントにトップレベルのソートノードが含まれているため、concurrent export Sessionの変数が有効になっていても、このクエリはconcurrent exportを使用できません。

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
- HDFS方式を使用してエクスポートし、シンプルなクエリ結果を`hdfs://${host}:${fileSystem_port}/path/to/result.txt`ファイルにエクスポートします。エクスポート形式をCSVとして指定し、ユーザー名をworkとして指定します。列区切り文字を`,`、行区切り文字を`\n`として指定します。

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
Hadoopクラスターで高可用性が有効になっており、Kerberos認証を使用している場合は、以下のSQL文を参照できます：

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
