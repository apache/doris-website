---
{
  "title": "ブローカーロード",
  "language": "ja",
  "description": "Broker LoadはMySQL APIから開始されます。DorisはLOAD文の情報に基づいて、ソースからデータを能動的に取得します。"
}
---
Broker LoadはMySQL APIから開始されます。DorisはLOAD文の情報に基づいて、ソースからデータを能動的にプルします。Broker Loadは非同期インポート方式です。Broker Loadタスクの進捗と結果は、SHOW LOAD文で確認できます。

Broker Loadは、ソースデータがHDFSなどのリモートストレージシステムに保存されており、データ量が比較的大きいシナリオに適しています。

HDFSやS3からの直接読み取りは、[Lakehouse/TVF](../../../lakehouse/file-analysis)のHDFS TVFまたはS3 TVFを通じてインポートすることも可能です。現在のTVFベースの「Insert Into」は同期インポートですが、Broker Loadは非同期インポート方式です。

Dorisの初期バージョンでは、S3 LoadとHDFS Loadの両方が`WITH BROKER`を使用して特定のBrokerプロセスに接続することで実装されていました。
新しいバージョンでは、S3 LoadとHDFS Loadは最も一般的に使用されるインポート方式として最適化されており、追加のBrokerプロセスに依存しなくなりましたが、Broker Loadと類似した構文を引き続き使用しています。
歴史的な理由と構文の類似性により、S3 Load、HDFS Load、およびBroker Loadは総称してBroker Loadと呼ばれています。

## 制限事項

サポートされているデータソース:

- S3プロトコル
- HDFSプロトコル
- カスタムプロトコル（brokerプロセスが必要）

サポートされているファイルパスパターン:

- ワイルドカード: `*`、`?`、`[abc]`、`[a-z]`
- 範囲展開: `{1..10}`、`{a,b,c}`
- 完全な構文については[File Path Pattern](../../../sql-manual/basic-element/file-path-pattern)を参照してください

サポートされているデータタイプ:

- CSV
- JSON
- PARQUET
- ORC

サポートされている圧縮タイプ:

- PLAIN
- GZ
- LZO
- BZ2
- LZ4FRAME
- DEFLATE
- LZOP
- LZ4BLOCK
- SNAPPYBLOCK
- ZLIB
- ZSTD

## 基本原理

ユーザーがインポートタスクを投入すると、Frontend（FE）が対応するプランを生成します。現在のBackend（BE）ノード数とファイルサイズに基づいて、プランが複数のBEノードに配布されて実行され、各BEノードがインポートデータの一部を処理します。

実行中、BEノードはBrokerからデータをプルし、必要な変換を実行してから、システムにデータをインポートします。すべてのBEノードがインポートを完了すると、FEがインポートが成功したかどうかの最終判定を行います。

![Broker Load](/images/broker-load.png)

図で見るように、BEノードは対応するリモートストレージシステムからデータを読み取るためにBrokerプロセスに依存しています。Brokerプロセスの導入は主に、異なるリモートストレージシステムに対応することを目的としています。ユーザーは確立された標準に従って独自のBrokerプロセスを開発できます。Javaを使用して開発できるこれらのBrokerプロセスは、ビッグデータエコシステムの様々なストレージシステムとの互換性が向上します。BrokerプロセスをBEノードから分離することで、両者間のエラー分離が保証され、BEの安定性が向上します。

現在、BEノードにはHDFSおよびS3 Brokerのサポートが組み込まれています。したがって、HDFSやS3からデータをインポートする場合、追加でBrokerプロセスを起動する必要はありません。ただし、カスタマイズされたBroker実装が必要な場合は、対応するBrokerプロセスをデプロイする必要があります。

## クイックスタート

このセクションでは、S3 Loadのデモを示します。
使用法の具体的な構文については、SQLマニュアルの[BROKER LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/BROKER-LOAD)を参照してください。

### 前提条件の確認

1. テーブルへの権限付与

Broker Loadはターゲットテーブルに対する`INSERT`権限が必要です。`INSERT`権限がない場合は、[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)コマンドを通じてユーザーに付与できます。

2. S3認証および接続情報

ここでは主に、AWS S3に保存されたデータのインポート方法を紹介します。S3プロトコルをサポートする他のオブジェクトストレージシステムからのデータインポートについては、AWS S3の手順を参照できます。

- AKとSK: まず、AWSの`Access Keys`を見つけるか再生成する必要があります。生成方法の手順は、AWSコンソールの`My Security Credentials`で確認できます。

- REGIONとENDPOINT: REGIONはバケット作成時に選択するか、バケットリストで確認できます。各REGIONのS3 ENDPOINTは[AWSドキュメント](https://docs.aws.amazon.com/general/latest/gr/s3.html#s3_region)で確認できます。

### ロードジョブの作成

1. CSVファイルbrokerload_example.csvを作成します。ファイルはS3に保存され、その内容は以下のとおりです:

```
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```
2. 読み込み用のDorisテーブルを作成する

Dorisでインポート用のテーブルを作成します。SQL文は以下の通りです：

```sql
CREATE TABLE testdb.test_brokerload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
3. Broker Loadを使用してS3からデータをインポートします。バケット名とS3認証情報は実際の状況に応じて入力する必要があります：

```sql
    LOAD LABEL broker_load_2022_04_01
    (
        DATA INFILE("s3://your_bucket_name/brokerload_example.csv")
        INTO TABLE test_brokerload
        COLUMNS TERMINATED BY ","
        FORMAT AS "CSV"
        (user_id, name, age)
    )
    WITH S3
    (
        "provider" = "S3",
        "AWS_ENDPOINT" = "s3.us-west-2.amazonaws.com",
        "AWS_ACCESS_KEY" = "<your-ak>",
        "AWS_SECRET_KEY"="<your-sk>",
        "AWS_REGION" = "us-west-2",
        "compress_type" = "PLAIN"
    )
    PROPERTIES
    (
        "timeout" = "3600"
    );
```
`provider`はS3サービスのベンダーを指定します。
サポートされているS3 Providerリスト：

- "S3" (AWS, Amazon Web Services)
- "AZURE" (Microsoft Azure)
- "GCP" (GCP, Google Cloud Platform)
- "OSS" (Alibaba Cloud)
- "COS" (Tencent Cloud)
- "OBS" (Huawei Cloud)
- "BOS" (Baidu Cloud)

お使いのサービスがリストにない場合（MinIOなど）、"S3"（AWS互換モード）を使用してみてください。

## インポートステータスの確認

Broker Loadは非同期インポート方式であり、具体的なインポート結果は[SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD)コマンドで確認できます。

```sql
mysql> show load order by createtime desc limit 1\G;
*************************** 1. row ***************************
         JobId: 41326624
         Label: broker_load_2022_04_01
         State: FINISHED
      Progress: ETL:100%; LOAD:100%
          Type: BROKER
       EtlInfo: unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=27
      TaskInfo: cluster:N/A; timeout(s):1200; max_filter_ratio:0.1
      ErrorMsg: NULL
    CreateTime: 2022-04-01 18:59:06
  EtlStartTime: 2022-04-01 18:59:11
 EtlFinishTime: 2022-04-01 18:59:11
 LoadStartTime: 2022-04-01 18:59:11
LoadFinishTime: 2022-04-01 18:59:11
           URL: NULL
    JobDetails: {"Unfinished backends":{"5072bde59b74b65-8d2c0ee5b029adc0":[]},"ScannedRows":27,"TaskNumber":1,"All backends":{"5072bde59b74b65-8d2c0ee5b029adc0":[36728051]},"FileNumber":1,"FileSize":5540}
1 row in set (0.01 sec)
```
## インポートのキャンセル

Broker Loadジョブのステータスが CANCELLED または FINISHED でない場合、ユーザーが手動でキャンセルできます。キャンセルするには、ユーザーはキャンセルするインポートタスクのlabelを指定する必要があります。cancel importコマンドの構文は、[CANCEL LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-LOAD)を実行することで確認できます。

例：DEMOデータベースでlabelが "broker_load_2022_04_01" のインポートジョブをキャンセルする場合。

```sql
CANCEL LOAD FROM demo WHERE LABEL = "broker_load_2022_04_01";
```
### Compute Groupの選択
ストレージ・コンピュート分離モードでは、Broker LoadがCompute Groupを選択する優先順位ロジックは以下の通りです：
1. ```use db@cluster statement```で指定されたCompute Groupを選択する
2. ユーザープロパティ```default_compute_group```で指定されたCompute Groupを選択する
3. 現在のユーザーがアクセス権限を持つCompute Groupの中から1つを選択する

統合ストレージ・コンピュートモードでは、ユーザープロパティ```resource_tags.location```で指定されたCompute Groupを選択します。
ユーザープロパティで指定されていない場合は、```default```という名前のCompute Groupを使用します。

## リファレンスマニュアル

### broker loadのSQL構文

```sql
LOAD LABEL load_label
(
data_desc1[, data_desc2, ...]
[format_properties]
)
WITH [S3|HDFS|BROKER broker_name] 
[broker_properties]
[load_properties]
[COMMENT "comments"];
```
WITH句はストレージシステムへのアクセス方法を指定し、`broker_properties`はアクセス方法の設定パラメータです

- `S3`: S3プロトコルを使用するストレージシステム
- `HDFS`: HDFSプロトコルを使用するストレージシステム
- `BROKER broker_name`: その他のプロトコルを使用するストレージシステム。`SHOW BROKER`で現在利用可能なbroker_nameリストを確認できます。詳細については、よくある問題セクションの「Other Broker Import」を参照してください。

### 関連設定

**Load Properties**

| プロパティ名 | 型 | デフォルト値 | 説明 |
| --- | --- | --- | --- |
| "timeout" | Long | 14400 | インポートのタイムアウトを秒単位で指定するために使用されます。設定可能範囲は1秒から259200秒です。 |
| "max_filter_ratio" | Float | 0.0 | フィルタリング可能な（不正またはその他の問題のある）データの最大許容比率を指定するために使用されます。デフォルトは許容なしです。値の範囲は0から1です。インポートされたデータのエラー率がこの値を超える場合、インポートは失敗します。不正データには、where条件によってフィルタリングされた行は含まれません。 |
| "strict_mode" | Boolean | false | このインポートでストリクトモードを有効にするかどうかを指定するために使用されます。 |
| "partial_columns" | Boolean | false | 部分列更新を有効にするかどうかを指定するために使用され、デフォルト値はfalseです。このパラメータはUnique Key + Merge on Writeテーブルでのみ利用可能です。 |
| "timezone" | String | "Asia/Shanghai" | このインポートで使用するタイムゾーンを指定するために使用されます。このパラメータは、インポートに関与するすべてのタイムゾーン関連関数の結果に影響します。 |
| "load_parallelism" | Integer | 8 | 各backend上の最大並列インスタンス数を制限します。 |
| "send_batch_parallelism" | Integer | 1 | memtable_on_sink_nodeが無効な場合の、sinkノードがデータを送信する際の並列度です。 |
| "load_to_single_tablet" | Boolean | "false" | パーティションに対応する単一のタブレットにのみデータをロードするかどうかを指定するために使用されます。このパラメータは、ランダムバケッティングを使用するOLAPテーブルにロードする場合にのみ利用可能です。 |
| "priority" | oneof "HIGH", "NORMAL", "LOW" | "NORMAL" | タスクの優先度です。 |

**Format Properties**

| プロパティ名 | 型 | デフォルト値 | 説明 |
|-----|-----|-----|-----|
| `skip_lines` | Integer | `0` | CSVファイルの開始時にスキップする行数。`csv_with_names`または`csv_with_names_and_types`を使用する場合は無視されます。 |
| `trim_double_quotes` | Boolean | `false` | `true`の場合、各フィールドから最外側の二重引用符を削除します。 |
| `enclose` | String | `""` | デリミタや改行を含むフィールドの囲み文字。例：デリミタが`,`で囲み文字が`'`の場合、`'b,c'`は1つのフィールドとして解析されます。 |
| `escape` | String | `""` | フィールド内容に囲み文字を含めるためのエスケープ文字。例：`'`が囲み文字で`\`がエスケープ文字の場合、`'b,\'c'`は`'b,'c'`を1つのフィールドとして保持します。 |

注意：Format propertiesはソースファイルの解析方法（デリミタ、引用符の処理など）を定義し、LOAD句内で設定する必要があります。Load propertiesは実行動作（タイムアウト、再試行など）を制御し、外側のPROPERTIESブロックで設定する必要があります。

```sql
LOAD LABEL s3_load_example (
    DATA INFILE("s3://bucket/path/file.csv")
    INTO TABLE users
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
    PROPERTIES (
        "trim_double_quotes" = "true"  -- format property
    )
)
WITH S3 (
    ...
)
PROPERTIES (
    "timeout" = "3600"  -- load property
);
```
**fe.conf**

以下の設定は、すべてのBrokerロードインポートタスクに影響するBrokerロードのシステムレベル設定に属します。これらの設定は`fe.conf`ファイルを変更することで調整できます。

| Session Variable | Type | Default Value | Description |
| --- | --- | --- | --- |
| min_bytes_per_broker_scanner | Long | 67108864 (64 MB) | Broker Loadジョブで単一のBEが処理するデータの最小量（バイト単位）。 |
| max_bytes_per_broker_scanner | Long | 536870912000 (500 GB) | Broker Loadジョブで単一のBEが処理するデータの最大量（バイト単位）。通常、インポートジョブでサポートされるデータの最大量は`max_bytes_per_broker_scanner * BEノード数`です。より大量のデータをインポートする必要がある場合は、`max_bytes_per_broker_scanner`パラメータのサイズを適切に調整する必要があります。 |
| max_broker_concurrency | Integer | 10 | ジョブの最大同時インポート数を制限します。 |
| default_load_parallelism | Integer | 8 | BEノードあたりの最大同時インスタンス数 |
| broker_load_default_timeout_second | 14400 | Broker Loadインポートのデフォルトタイムアウト（秒単位）。 |

注意：`min_bytes_per_broker_scanner`、`max_broker_concurrency`、ソースファイルのサイズ、および現在のクラスター内のBE数が、このロードの同時実行インスタンス数を共同で決定します。

```Plain
Import Concurrency = Math.min(Source File Size / min_bytes_per_broker_scanner, max_broker_concurrency, Current Number of BE Nodes * load_parallelism)
Processing Volume per BE for this Import = Source File Size / Import Concurrency
```
**session variables**

| Session Variable | Type | Default | Description |
| --- | --- | --- | --- |
| time_zone | String | "Asia/Shanghai" | デフォルトのタイムゾーン。インポート時のタイムゾーン関連関数の結果に影響します。 |
| send_batch_parallelism | Integer | 1 | sinkノードのデータ送信の並行数。`enable_memtable_on_sink_node`がfalseに設定されている場合のみ有効です。 |

## よくある問題

### よくあるエラー

**1. インポートエラー: `Scan bytes per broker scanner exceed limit:xxx`**

ドキュメントのベストプラクティスセクションを参照し、FE設定項目`max_bytes_per_broker_scanner`と`max_broker_concurrency`を変更してください。

**2. インポートエラー: `failed to send batch`または`TabletWriter add batch with unknown id`**

`query_timeout`と`streaming_load_rpc_max_alive_time_sec`の設定を適切に調整してください。

**3. インポートエラー: `LOAD_RUN_FAIL; msg:Invalid Column Name:xxx`**

PARQUETまたはORC形式のデータの場合、ファイルヘッダーのカラム名はDorisテーブルのカラム名と一致する必要があります。例：

```sql
(tmp_c1,tmp_c2)
SET
(
    id=tmp_c2,
    name=tmp_c1
)
```
これは、parquetファイルやorcファイル内の(tmp_c1, tmp_c2)という名前のカラムを取得し、Dorisテーブルの(id, name)カラムにマッピングすることを表します。setが指定されていない場合、ファイルヘッダー内のカラムがマッピングに使用されます。

:::info Note

特定のHiveバージョンを使用してORCファイルを直接生成する場合、ORCファイル内のカラムヘッダーはHiveメタデータではなく、(_col0, _col1, _col2, ...)となる可能性があり、これによりInvalid Column Nameエラーが発生する場合があります。この場合、SETを使用したマッピングが必要です。
:::

**5. インポートエラー: `Failed to get S3 FileSystem for bucket is null/empty`**

bucketの情報が正しくないか、存在しません。またはbucketの形式がサポートされていません。GCSを使用して`s3://gs_bucket/load_tbl`のようにアンダースコア付きのbucket名を作成すると、S3 ClientがGCSにアクセスする際にエラーを報告する場合があります。bucket作成時にはアンダースコアを使用しないことを推奨します。

**6. インポートタイムアウト**

インポートのデフォルトタイムアウトは4時間です。タイムアウトが発生した場合、問題を解決するために最大インポートタイムアウトを直接増加させることは推奨されません。単一のインポート時間がデフォルトのインポートタイムアウトである4時間を超える場合、インポートするファイルを分割して複数回のインポートを実行することで問題を解決するのが最適です。過度に長いタイムアウト時間を設定すると、失敗したインポートの再試行時に高いコストが発生する可能性があります。

以下の公式を使用してDorisクラスターの予想最大インポートファイルデータ量を計算できます：

予想最大インポートファイルデータ量 = 14400s * 10M/s * BEの数

例えば、クラスターに10個のBEがある場合：

予想最大インポートファイルデータ量 = 14400s * 10M/s * 10 = 1440000M ≈ 1440G

:::info Note

一般的に、ユーザー環境では10M/sの速度に達しない場合があるため、500Gを超えるファイルはインポート前に分割することを推奨します。
:::

### S3 Load URL style

- S3 SDKはデフォルトでvirtual-hosted styleの方法を使用してオブジェクトにアクセスします。ただし、一部のオブジェクトストレージシステムではvirtual-hosted styleアクセスが有効化またはサポートされていない場合があります。このような場合、`use_path_style`パラメータを追加してpath styleの方法を強制的に使用できます：

  ```sql
    WITH S3
    (
          "AWS_ENDPOINT" = "AWS_ENDPOINT",
          "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
          "AWS_SECRET_KEY"="AWS_SECRET_KEY",
          "AWS_REGION" = "AWS_REGION",
          "use_path_style" = "true"
    )
  ```
### S3 Load一時認証情報

- 一時認証情報（TOKEN）を使用してS3プロトコルをサポートするすべてのオブジェクトストレージシステムにアクセスするためのサポートが利用可能です。使用方法は以下の通りです：

  ```sql
    WITH S3
    (
          "AWS_ENDPOINT" = "AWS_ENDPOINT",
          "AWS_ACCESS_KEY" = "AWS_TEMP_ACCESS_KEY",
          "AWS_SECRET_KEY" = "AWS_TEMP_SECRET_KEY",
          "AWS_TOKEN" = "AWS_TEMP_TOKEN",
          "AWS_REGION" = "AWS_REGION"
    )
  ```
### HDFS Simple認証

Simple認証とは、hadoop.security.authenticationが"simple"に設定されているHadoopの設定を指します。

```Plain
(
    "username" = "user",
    "password" = ""
);
```
ユーザー名はアクセス対象のユーザーとして設定し、パスワードは空白のままにしておくことができます。

### HDFS Kerberos認証

この認証方法には以下の情報が必要です：

- **hadoop.security.authentication:** 認証方法をKerberosとして指定します。

- **hadoop.kerberos.principal:** Kerberosプリンシパルを指定します。

- **hadoop.kerberos.keytab:** Kerberos keytabのファイルパスを指定します。このファイルはBrokerプロセスが配置されているサーバー上の絶対パスである必要があり、Brokerプロセスからアクセス可能である必要があります。

- **kerberos_keytab_content:** base64でエンコードされたKerberos keytabファイルの内容を指定します。これはkerberos_keytab設定の代替として使用できます。

設定例：

```Plain
(
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "doris@YOUR.COM",
    "hadoop.kerberos.keytab" = "/home/doris/my.keytab"
)
(
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "doris@YOUR.COM",
    "kerberos_keytab_content" = "ASDOWHDLAWIDJHWLDKSALDJSDIWALD"
)
```
Kerberos認証を使用するには、[krb5.conf (opens new window)](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html)ファイルが必要です。krb5.confファイルにはKerberos設定情報が含まれています。通常、krb5.confファイルは/etcディレクトリにインストールする必要があります。KRB5_CONFIG環境変数を設定することで、デフォルトの場所を上書きできます。krb5.confファイルの内容例は以下の通りです：

```Plain
[libdefaults]
    default_realm = DORIS.HADOOP
    default_tkt_enctypes = des3-hmac-sha1 des-cbc-crc
    default_tgs_enctypes = des3-hmac-sha1 des-cbc-crc
    dns_lookup_kdc = true
    dns_lookup_realm = false

[realms]
    DORIS.HADOOP = {
        kdc = kerberos-doris.hadoop.service:7005
    }
```
### HDFS HAモード

この設定は、HA（高可用性）モードでデプロイされたHDFSクラスターにアクセスするために使用されます。

- **dfs.nameservices:** HDFSサービスの名前を指定します。これはカスタマイズ可能です。例：「dfs.nameservices」= "my_ha"。

- **dfs.ha.namenodes.xxx:** namenodeの名前をカスタマイズします。複数の名前はカンマで区切ります。ここで、xxxはdfs.nameservicesで指定されたカスタム名を表します。例：「dfs.ha.namenodes.my_ha」= "my_nn"。

- **dfs.namenode.rpc-address.xxx.nn:** namenodeのRPCアドレス情報を指定します。この文脈において、nnはdfs.ha.namenodes.xxxで設定されたnamenode名を表します。例：「dfs.namenode.rpc-address.my_ha.my_nn」= "host:port"。

- **dfs.client.failover.proxy.provider.[nameservice ID]:** namenodeへのクライアント接続のプロバイダーを指定します。デフォルトはorg.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProviderです。

設定例は以下の通りです：

```sql
(
    "fs.defaultFS" = "hdfs://my_ha",
    "dfs.nameservices" = "my_ha",
    "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
    "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
    "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
    "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
)
```
HAモードは、クラスターアクセスのために前述の2つの認証方式と組み合わせることができます。例えば、シンプル認証を通じてHA HDFSにアクセスする場合：

```sql
(
    "username"="user",
    "password"="passwd",
    "fs.defaultFS" = "hdfs://my_ha",
    "dfs.nameservices" = "my_ha",
    "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
    "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
    "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
    "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
)
```
### 他のブローカーでの読み込み

他のリモートストレージシステム用のBrokerは、Dorisクラスターにおけるオプションのプロセスで、主にDorisがリモートストレージ上のファイルやディレクトリを読み書きすることをサポートするために使用されます。
現在、Dorisは様々なリモートストレージシステム用のBroker実装を提供しています。
以前のバージョンでは、異なるオブジェクトストレージBrokerも利用可能でしたが、現在はオブジェクトストレージからデータをインポートする際は`WITH S3`方式の使用が推奨されており、`WITH BROKER`方式はもはや推奨されません。

- Tencent Cloud CHDFS
- Tencent Cloud GFS
- JuiceFS

BrokerはRPCサービスポートを通じてサービスを提供し、ステートレスなJavaプロセスとして動作します。その主な責務は、open、pread、pwrite等のリモートストレージ向けのPOSIXライクなファイル操作をカプセル化することです。さらに、Brokerは他の情報を追跡しないため、リモートストレージに関連するすべての接続詳細、ファイル情報、権限詳細は、RPC呼び出し時にパラメータを通じてBrokerプロセスに渡される必要があります。これにより、Brokerが正しくファイルを読み書きできることが保証されます。

Brokerは純粋にデータの経路として機能し、計算タスクには関与しないため、最小限のメモリ使用量しか必要としません。通常、Dorisシステムでは1つ以上のBrokerプロセスをデプロイします。さらに、同じタイプのBrokerはグループ化され、一意の名前（Broker name）が割り当てられます。

このセクションでは主に、接続情報や認証詳細等、異なるリモートストレージシステムにアクセスする際にBrokerが必要とするパラメータに焦点を当てています。これらのパラメータを理解し正しく設定することは、Dorisとリモートストレージシステム間の成功的で安全なデータ交換にとって重要です。

**Broker情報**

Brokerの情報は2つの部分で構成されています：名前（Broker name）と認証情報です。通常の構文形式は以下の通りです：

```sql
WITH BROKER "broker_name" 
(
    "username" = "xxx",
    "password" = "yyy",
    "other_prop" = "prop_value",
    ...
);
```
**Broker Name**

通常、ユーザーは操作コマンドで`WITH BROKER "broker_name"`句を通じて既存のBroker Nameを指定する必要があります。Broker Nameは、`ALTER SYSTEM ADD BROKER`コマンドでBrokerプロセスを追加する際にユーザーが指定する名前です。1つの名前は通常、1つ以上のBrokerプロセスに対応します。Dorisは名前に基づいて利用可能なBrokerプロセスを選択します。ユーザーは`SHOW BROKER`コマンドでクラスター内に現在存在するBrokerを確認できます。

:::info Note
Broker Nameは単なるユーザー定義の名前であり、Brokerのタイプを表すものではありません。
:::

**認証情報**
異なるBrokerタイプとアクセス方法には、異なる認証情報が必要です。認証情報は通常、`WITH BROKER "broker_name"`の後のProperty MapでKey-Value形式で提供されます。

## Broker Loadの例

### HDFSからのTXTファイルのインポート

  ```sql
  LOAD LABEL demo.label_20220402
  (
      DATA INFILE("hdfs://host:port/tmp/test_hdfs.txt")
      INTO TABLE `load_hdfs_file_test`
      COLUMNS TERMINATED BY "\t"            
      (id,age,name)
  ) 
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username" = "user"
  )
  PROPERTIES
  (
      "timeout"="1200",
      "max_filter_ratio"="0.1"
  );
  ```
### HDFSではNameNode HA（High Availability）の設定が必要です

  ```sql
  LOAD LABEL demo.label_20220402
  (
      DATA INFILE("hdfs://hafs/tmp/test_hdfs.txt")
      INTO TABLE `load_hdfs_file_test`
      COLUMNS TERMINATED BY "\t"            
      (id,age,name)
  ) 
  with HDFS
  (
      "hadoop.username" = "user",
      "fs.defaultFS"="hdfs://hafs"，
      "dfs.nameservices" = "hafs",
      "dfs.ha.namenodes.hafs" = "my_namenode1, my_namenode2",
      "dfs.namenode.rpc-address.hafs.my_namenode1" = "nn1_host:rpc_port",
      "dfs.namenode.rpc-address.hafs.my_namenode2" = "nn2_host:rpc_port",
      "dfs.client.failover.proxy.provider.hafs" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
  )
  PROPERTIES
  (
      "timeout"="1200",
      "max_filter_ratio"="0.1"
  );
  ```
### ワイルドカードを使用してHDFSから2つのファイルバッチをマッチングし、それらを2つの別々のテーブルにインポートするデータインポート

Broker Loadはファイルパス内でワイルドカード（`*`、`?`、`[...]`）および範囲パターン（`{1..10}`）をサポートしています。詳細な構文については、[File Path Pattern](../../../sql-manual/basic-element/file-path-pattern)を参照してください。

  ```sql
  LOAD LABEL example_db.label2
  (
      DATA INFILE("hdfs://host:port/input/file-10*")
      INTO TABLE `my_table1`
      PARTITION (p1)
      COLUMNS TERMINATED BY ","
      (k1, tmp_k2, tmp_k3)
      SET (
          k2 = tmp_k2 + 1,
          k3 = tmp_k3 + 1
      ),
      DATA INFILE("hdfs://host:port/input/file-20*")
      INTO TABLE `my_table2`
      COLUMNS TERMINATED BY ","
      (k1, k2, k3)
  )
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username" = "user"
  );
  ```
HDFSからワイルドカード`file-10*`と`file-20*`にマッチする2つのバッチのファイルをインポートし、それらを2つの別々のテーブル`my_table1`と`my_table2`にロードします。この場合、my_table1はデータをパーティションp1にインポートするよう指定され、ソースファイルの2列目と3列目の値はインポート前に1ずつ増分されます。

### ワイルドカードを使用してHDFSからバッチデータをインポートする

  ```sql
  LOAD LABEL example_db.label3
  (
      DATA INFILE("hdfs://host:port/user/doris/data/*/*")
      INTO TABLE `my_table`
      COLUMNS TERMINATED BY "\\x01"
  )
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username" = "user"
  );
  ```
Hiveで一般的に使用されるデフォルトの区切り文字である\x01を区切り文字として指定し、ワイルドカード文字*を使用してdataディレクトリ下のすべてのディレクトリ内のすべてのファイルを参照します。

### Parquet形式のデータをインポートし、FORMATを`parquet`として指定する

  ```sql
  LOAD LABEL example_db.label4
  (
      DATA INFILE("hdfs://host:port/input/file")
      INTO TABLE `my_table`
      FORMAT AS "parquet"
      (k1, k2, k3)
  )
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username" = "user"
  );
  ```
デフォルトの方法は、ファイル拡張子によって判定することです。

### データをインポートし、ファイルパスからパーティションフィールドを抽出する

  ```sql
  LOAD LABEL example_db.label5
  (
      DATA INFILE("hdfs://host:port/input/city=beijing/*/*")
      INTO TABLE `my_table`
      FORMAT AS "csv"
      (k1, k2, k3)
      COLUMNS FROM PATH AS (city, utc_date)
  )
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username" = "user"
  );
  ```
`my_table`のカラムは`k1`、`k2`、`k3`、`city`、`utc_date`です。

ディレクトリ`hdfs://hdfs_host:hdfs_port/user/doris/data/input/dir/city=beijing`には以下のファイルが含まれています：

```Plain
hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-01/0000.csv
hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-02/0000.csv
hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-03/0000.csv
hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-04/0000.csv
```
ファイルには3つのデータ列のみが含まれています：`k1`、`k2`、および`k3`。他の2つの列である`city`と`utc_date`は、ファイルパスから抽出されます。

### インポートしたデータをフィルタリングする

  ```sql
  LOAD LABEL example_db.label6
  (
      DATA INFILE("hdfs://host:port/input/file")
      INTO TABLE `my_table`
      (k1, k2, k3)
      SET (
          k2 = k2 + 1
      )
      PRECEDING FILTER k1 = 1
      WHERE k1 > k2
  )
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username" = "user"
  );
  ```
元のデータでk1 = 1かつ変換後にk1 > k2となる行のみがインポートされます。

### データをインポートし、ファイルパスから時間パーティションフィールドを抽出する。

  ```sql
  LOAD LABEL example_db.label7
  (
      DATA INFILE("hdfs://host:port/user/data/*/test.txt") 
      INTO TABLE `tbl12`
      COLUMNS TERMINATED BY ","
      (k2,k3)
      COLUMNS FROM PATH AS (data_time)
      SET (
          data_time=str_to_date(data_time, '%Y-%m-%d %H%%3A%i%%3A%s')
      )
  )
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username" = "user"
  );
  ```
:::tip Tip
時刻には"%3A"が含まれています。HDFSパスではコロン":"が許可されていないため、すべてのコロンが"%3A"に置き換えられます。
:::

パス配下には以下のファイルがあります：

```Plain
/user/data/data_time=2020-02-17 00%3A00%3A00/test.txt
/user/data/data_time=2020-02-18 00%3A00%3A00/test.txt
```
テーブル構造は以下の通りです：

```sql
CREATE TABLE IF NOT EXISTS tbl12 (
    data_time DATETIME,
    k2        INT,
    k3        INT
) DISTRIBUTED BY HASH(data_time) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);
```
### インポートにマージモードを使用する

  ```sql
  LOAD LABEL example_db.label8
  (
      MERGE DATA INFILE("hdfs://host:port/input/file")
      INTO TABLE `my_table`
      (k1, k2, k3, v2, v1)
      DELETE ON v2 > 100
  )
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username"="user"
  )
  PROPERTIES
  (
      "timeout" = "3600",
      "max_filter_ratio" = "0.1"
  );
  ```
Merge モードでインポートを使用するには、"my_table" は Unique Key テーブルである必要があります。インポートされたデータの "v2" 列の値が 100 より大きい場合、その行は削除行として扱われます。インポートタスクのタイムアウトは 3600 秒で、最大 10% のエラー率が許可されます。

### 置換の順序を保証するために、インポート時に "source_sequence" 列を指定します。

  ```sql
  LOAD LABEL example_db.label9
  (
      DATA INFILE("hdfs://host:port/input/file")
      INTO TABLE `my_table`
      COLUMNS TERMINATED BY ","
      (k1,k2,source_sequence,v1,v2)
      ORDER BY source_sequence
  ) 
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username"="user"
  );
  The "my_table" must be a Unique Key model table and have a specified Sequence column. The data will maintain its order based on the values in the "source_sequence" column in the source data.
  ```
### 指定されたファイル形式を`json`としてインポートし、それに応じて`json_root`とjsonpathを指定します。

  ```sql
  LOAD LABEL example_db.label10
  (
      DATA INFILE("hdfs://host:port/input/file.json")
      INTO TABLE `my_table`
      FORMAT AS "json"
      PROPERTIES(
        "json_root" = "$.item",
        "jsonpaths" = "[\"$.id\", \"$.city\", \"$.code\"]"
      )       
  )
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username"="user"
  );
  ```
`jsonpaths`は、列リストおよび`SET (column_mapping)`と組み合わせて使用することもできます：

  ```sql
  LOAD LABEL example_db.label10
  (
      DATA INFILE("hdfs://host:port/input/file.json")
      INTO TABLE `my_table`
      FORMAT AS "json"
      (id, code, city)
      SET (id = id * 10)
      PROPERTIES(
        "json_root" = "$.item",
        "jsonpaths" = "[\"$.id\", \"$.city\", \"$.code\"]"
      )       
  )
  with HDFS
  (
    "fs.defaultFS"="hdfs://host:port",
    "hadoop.username"="user"
  );
  ```
:::info Note
JSON ファイルのルートノードで JSON オブジェクトを読み込む必要がある場合、jsonpaths は $. として指定する必要があります。例：`PROPERTIES("jsonpaths"="$.")`"
:::

### 他のブローカーからの読み込み

- Alibaba Cloud OSS

  ```sql
  (
      "fs.oss.accessKeyId" = "",
      "fs.oss.accessKeySecret" = "",
      "fs.oss.endpoint" = ""
  )
  ```
- JuiceFS

  ```sql
  (
      "fs.defaultFS" = "jfs://xxx/",
      "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
      "fs.AbstractFileSystem.jfs.impl" = "io.juicefs.JuiceFS",
      "juicefs.meta" = "xxx",
      "juicefs.access-log" = "xxx"
  )
  ```
- GCS

  BrokerでGCSにアクセスする場合、プロジェクトIDが必要ですが、その他のパラメータは任意です。すべてのパラメータ設定については、[GCS Config](https://github.com/GoogleCloudDataproc/hadoop-connectors/blob/branch-2.2.x/gcs/CONFIGURATION.md)を参照してください。

  ```sql
  (
      "fs.gs.project.id" = "Your Project ID",
      "fs.AbstractFileSystem.gs.impl" = "com.google.cloud.hadoop.fs.gcs.GoogleHadoopFS",
      "fs.gs.impl" = "com.google.cloud.hadoop.fs.gcs.GoogleHadoopFileSystem",
  )
  ```
## その他のヘルプ

[Broker Load](../../../sql-manual/sql-statements/data-modification/load-and-export/BROKER-LOAD)の使用に関するより詳細な構文とベストプラクティスについては、Broker Loadコマンドマニュアルを参照してください。また、MySQLクライアントのコマンドラインでHELP BROKER LOADを入力することで、より多くのヘルプ情報を取得できます。
