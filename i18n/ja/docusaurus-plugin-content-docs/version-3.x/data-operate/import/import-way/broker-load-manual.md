---
{
  "title": "Broker Load",
  "description": "Broker Loadは MySQL API から開始されます。DorisはLOAD文の情報に基づいて、ソースから積極的にデータを取得します。",
  "language": "ja"
}
---
Broker Loadは MySQL API から開始されます。Doris は LOAD ステートメントの情報に基づいて、ソースから能動的にデータを取得します。Broker Load は非同期のインポート方式です。Broker Load タスクの進行状況と結果は SHOW LOAD ステートメントで確認できます。

Broker Load は、HDFS などのリモートストレージシステムにソースデータが保存されており、データ量が比較的大きいシナリオに適しています。

HDFS や S3 からの直接読み取りは、レイクハウス/TVF の HDFS TVF や S3 TVF を通じてもインポートできます。現在の TVF ベースの「Insert Into」は同期インポートですが、Broker Load は非同期のインポート方式です。

Doris の初期バージョンでは、S3 Load と HDFS Load はどちらも `WITH BROKER` を使用して特定の Broker プロセスに接続することで実装されていました。
新しいバージョンでは、S3 Load と HDFS Load は最もよく使用されるインポート方式として最適化されており、追加の Broker プロセスに依存しなくなりましたが、Broker Load と似た構文を使用しています。
歴史的な理由と構文の類似性により、S3 Load、HDFS Load、Broker Load は総称して Broker Load と呼ばれています。

## 制限事項

サポートされているデータソース：

- S3 プロトコル
- HDFS プロトコル
- カスタムプロトコル（broker プロセスが必要）

サポートされているデータ形式：

- CSV
- JSON
- PARQUET
- ORC

サポートされている圧縮形式：

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

ユーザーがインポートタスクを送信した後、Frontend（FE）は対応するプランを生成します。現在の Backend（BE）ノード数とファイルサイズに基づいて、プランは複数の BE ノードに配布され実行されます。各 BE ノードはインポートデータの一部を処理します。

実行中、BE ノードは Broker からデータを取得し、必要な変換を実行してから、システムにデータをインポートします。すべての BE ノードがインポートを完了すると、FE がインポートの成功可否について最終的な判断を行います。

![Broker Load](/images/broker-load.png)

図に示されているように、BE ノードは対応するリモートストレージシステムからデータを読み取るために Broker プロセスに依存しています。Broker プロセスの導入は主に、さまざまなリモートストレージシステムに対応することを目的としています。ユーザーは確立された標準に従って独自の Broker プロセスを開発できます。Java を使用して開発できるこれらの Broker プロセスは、ビッグデータエコシステム内のさまざまなストレージシステムとの互換性を向上させます。Broker プロセスを BE ノードから分離することで、両者間のエラー分離が保証され、BE の安定性が向上します。

現在、BE ノードには HDFS と S3 Broker のサポートが組み込まれています。そのため、HDFS や S3 からデータをインポートする際は、追加で Broker プロセスを開始する必要はありません。ただし、カスタマイズされた Broker 実装が必要な場合は、対応する Broker プロセスをデプロイする必要があります。

## クイックスタート

このセクションでは S3 Load のデモを示します。
使用方法の具体的な構文については、SQL マニュアルの BROKER LOAD を参照してください。

### 前提条件の確認

1. tableへの権限付与

Broker Load には対象tableへの `INSERT` 権限が必要です。`INSERT` 権限がない場合は、GRANT コマンドを通じてユーザーに権限を付与できます。

2. S3 認証と接続情報

ここでは主に AWS S3 に保存されているデータのインポート方法を紹介します。S3 プロトコルをサポートする他のオブジェクトストレージシステムからデータをインポートする場合は、AWS S3 の手順を参考にしてください。

- AK と SK：まず、AWS `Access Keys` を見つけるか再生成する必要があります。それらの生成方法については、AWS コンソールの `My Security Credentials` で手順を確認できます。

- REGION と ENDPOINT：REGION はバケット作成時に選択するか、バケット一覧で確認できます。各 REGION の S3 ENDPOINT は [AWS ドキュメント](https://docs.aws.amazon.com/general/latest/gr/s3.html#s3_region)で確認できます。

### load ジョブの作成

1. CSV ファイル brokerload_example.csv を作成します。このファイルは S3 に保存されており、内容は以下の通りです：

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
2. ロード用のDorisTableを作成する

Dorisにインポート用のTableを作成します。SQL文は以下の通りです：

```sql
CREATE TABLE testdb.test_brokerload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
3. Broker Loadを使用してS3からデータをインポートします。バケット名とS3認証情報は実際の状況に応じて入力してください：

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
サポートされているS3 Providerのリスト：

- "S3" (AWS, Amazon Web Services)
- "AZURE" (Microsoft Azure)
- "GCP" (GCP, Google Cloud Platform)
- "OSS" (Alibaba Cloud)
- "COS" (Tencent Cloud)
- "OBS" (Huawei Cloud)
- "BOS" (Baidu Cloud)

お使いのサービスがリストにない場合（MinIOなど）、"S3"（AWS互換モード）を使用することを試すことができます。

## インポート状況の確認

Broker Loadは非同期インポート方式であり、具体的なインポート結果はSHOW LOADコマンドで確認できます。

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
## Importのキャンセル

Broker Loadジョブのステータスが CANCELLED または FINISHED でない場合、ユーザーが手動でキャンセルすることができます。キャンセルするには、ユーザーはキャンセルするimportタスクのlabelを指定する必要があります。cancel importコマンドの構文は、CANCEL LOAD を実行することで確認できます。

例：DEMOデータベース上でlabelが"broker_load_2022_04_01"のimportジョブをキャンセルする場合。

```sql
CANCEL LOAD FROM demo WHERE LABEL = "broker_load_2022_04_01";
```
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
WITH句はストレージシステムへのアクセス方法を指定し、`broker_properties`はアクセス方法の設定パラメータです。

- `S3`: S3プロトコルを使用するストレージシステム
- `HDFS`: HDFSプロトコルを使用するストレージシステム
- `BROKER broker_name`: その他のプロトコルを使用するストレージシステム。現在利用可能なbroker_nameのリストは`SHOW BROKER`で確認できます。詳細については、よくある問題セクションの「その他のBrokerインポート」を参照してください。

### 関連設定

**Load Properties**

| Property Name | Type | デフォルト値 | デスクリプション |
| --- | --- | --- | --- |
| "timeout" | Long | 14400 | インポートのタイムアウトを秒単位で指定するために使用されます。設定可能な範囲は1秒から259200秒です。 |
| "max_filter_ratio" | Float | 0.0 | フィルタ可能な（不正またはその他問題のある）データの最大許容比率を指定するために使用され、デフォルトはゼロ許容です。値の範囲は0から1です。インポートされたデータのエラー率がこの値を超える場合、インポートは失敗します。不正データにはwhere条件でフィルタされた行は含まれません。 |
| "strict_mode" | Boolean | false | このインポートに対してstrict modeを有効にするかどうかを指定するために使用されます。 |
| "partial_columns" | Boolean | false | 部分列更新を有効にするかどうかを指定するために使用され、デフォルト値はfalseです。このパラメータはUnique Key + Merge on WriteTableでのみ利用可能です。 |
| "timezone" | String | "Asia/Shanghai" | このインポートで使用するタイムゾーンを指定するために使用されます。このパラメータはインポートに関わるすべてのタイムゾーン関連関数の結果に影響します。 |
| "load_parallelism" | Integer | 8 | 各backend上の最大並列インスタンス数を制限します。 |
| "send_batch_parallelism" | Integer | 1 | memtable_on_sink_nodeが無効な場合のsink nodeがデータを送信する際の並列度です。 |
| "load_to_single_tablet" | Boolean | "false" | パーティションに対応する単一のタブレットにのみデータをロードするかどうかを指定するために使用されます。このパラメータはランダムバケッティングを使用するOLAPTableにロードする場合のみ利用可能です。 |
| "priority" | oneof "HIGH", "NORMAL", "LOW" | "NORMAL" | タスクの優先度です。 |

**Format Properties**

| Property Name       | Type     | デフォルト値 | デスクリプション |
|---------------------|----------|----------------|-------------|
| `skip_lines`        | Integer  | `0`            | CSVファイルの開始時にスキップする行数。`csv_with_names`または`csv_with_names_and_types`を使用している場合は無視されます。 |
| `trim_double_quotes`| Boolean  | `false`        | `true`の場合、各フィールドから最も外側の二重引用符を取り除きます。 |
| `enclose`           | String   | `""`           | 区切り文字や改行文字を含むフィールドの囲み文字。例えば、区切り文字が`,`で囲み文字が`'`の場合、`'b,c'`は1つのフィールドとして解析されます。 |
| `escape`            | String   | `""`           | フィールドの内容に囲み文字を含めるためのエスケープ文字。例えば、`'`が囲み文字で`\`がエスケープ文字の場合、`'b,\'c'`は`'b,'c'`を1つのフィールドとして保持します。 |

注意: Format propertiesはソースファイルの解析方法（例：区切り文字、引用符の処理）を定義し、LOAD句内で設定する必要があります。Load propertiesは実行動作（例：タイムアウト、リトライ）を制御し、外側のPROPERTIESブロック内で設定する必要があります。

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

以下の設定はBroker loadのシステムレベル設定に属し、すべてのBroker loadインポートタスクに影響します。これらの設定は`fe.conf`ファイルを変更することで調整できます。

| Session Variable | Type | デフォルト値 | デスクリプション |
| --- | --- | --- | --- |
| min_bytes_per_broker_scanner | Long | 67108864 (64 MB) | Broker Loadジョブで単一のBEが処理するデータの最小量（バイト単位）。 |
| max_bytes_per_broker_scanner | Long | 536870912000 (500 GB) | Broker Loadジョブで単一のBEが処理するデータの最大量（バイト単位）。通常、インポートジョブでサポートされるデータの最大量は`max_bytes_per_broker_scanner * BEノード数`です。より大きな量のデータをインポートする必要がある場合は、`max_bytes_per_broker_scanner`パラメータのサイズを適切に調整する必要があります。 |
| max_broker_concurrency | Integer | 10 | ジョブの最大同時インポート数を制限します。 |
| default_load_parallelism | Integer | 8 | BEノードあたりの最大同時実行インスタンス数 |
| broker_load_default_timeout_second | 14400 | Broker Loadインポートのデフォルトタイムアウト（秒単位）。 |

注意：`min_bytes_per_broker_scanner`、`max_broker_concurrency`、ソースファイルのサイズ、および現在のクラスタ内のBE数が、このloadの同時実行インスタンス数を共同で決定します。

```Plain
Import Concurrency = Math.min(Source File Size / min_bytes_per_broker_scanner, max_broker_concurrency, Current Number of BE Nodes * load_parallelism)
Processing Volume per BE for this Import = Source File Size / Import Concurrency
```
**session variables**

| Session Variable | Type | Default | デスクリプション |
| --- | --- | --- | --- |
| time_zone | String | "Asia/Shanghai" | デフォルトのタイムゾーン。インポート時のタイムゾーン関連機能の結果に影響します。 |
| send_batch_parallelism | Integer | 1 | sinkノードがデータを送信する際の並行数。`enable_memtable_on_sink_node`がfalseに設定されている場合のみ有効です。 |

## よくある問題

### よくあるエラー

**1. インポートエラー: `Scan bytes per broker scanner exceed limit:xxx`**

ドキュメントのベストプラクティスセクションを参照し、FE設定項目の`max_bytes_per_broker_scanner`と`max_broker_concurrency`を変更してください。

**2. インポートエラー: `failed to send batch`または`TabletWriter add batch with unknown id`**

`query_timeout`と`streaming_load_rpc_max_alive_time_sec`の設定を適切に調整してください。

**3. インポートエラー: `LOAD_RUN_FAIL; msg:Invalid Column Name:xxx`**

PARQUETまたはORC形式のデータの場合、ファイルヘッダー内の列名はDorisTableの列名と一致する必要があります。例：

```sql
(tmp_c1,tmp_c2)
SET
(
    id=tmp_c2,
    name=tmp_c1
)
```
これはparquetまたはorcファイル内の(tmp_c1, tmp_c2)という名前の列を取得し、それらをDorisTableの(id, name)列にマッピングすることを表します。setが指定されていない場合、ファイルヘッダー内の列がマッピングに使用されます。

:::info Note

特定のHiveバージョンを使用してORCファイルが直接生成される場合、ORCファイル内の列ヘッダーはHiveメタデータではなく、(_col0, _col1, _col2, ...)となる可能性があり、Invalid Column Nameエラーが発生する可能性があります。この場合、SETを使用したマッピングが必要です。
:::

**5. インポートエラー: `Failed to get S3 FileSystem for bucket is null/empty`**

bucket情報が間違っているか存在しません。またはbucket形式がサポートされていません。GCSを使用してアンダースコアを含むbucket名を作成する場合（`s3://gs_bucket/load_tbl`など）、S3 ClientがGCSにアクセスする際にエラーを報告する可能性があります。bucket作成時にはアンダースコアを使用しないことを推奨します。

**6. インポートタイムアウト**

インポートのデフォルトタイムアウトは4時間です。タイムアウトが発生した場合、問題を解決するために最大インポートタイムアウトを直接増加させることは推奨されません。単一のインポート時間がデフォルトのインポートタイムアウトである4時間を超える場合、インポートするファイルを分割して複数回のインポートを実行することで問題を解決するのが最適です。過度に長いタイムアウト時間を設定すると、失敗したインポートの再試行に高いコストがかかる可能性があります。

以下の公式を使用してDorisクラスターの予想最大インポートファイルデータ量を計算できます：

予想最大インポートファイルデータ量 = 14400s * 10M/s * BEの数

例えば、クラスターに10のBEがある場合：

予想最大インポートファイルデータ量 = 14400s * 10M/s * 10 = 1440000M ≈ 1440G

:::info Note

一般的に、ユーザー環境では10M/sの速度に到達しない可能性があるため、500Gを超えるファイルはインポート前に分割することを推奨します。
:::

### S3 Load URL style

- S3 SDKは、デフォルトでvirtual-hosted styleメソッドを使用してオブジェクトにアクセスします。ただし、一部のオブジェクトストレージシステムでは、virtual-hosted styleアクセスが有効化またはサポートされていない可能性があります。このような場合、`use_path_style`パラメーターを追加してpath styleメソッドの使用を強制できます：

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
### S3 Load temporary credentials

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
### HDFS Simple 認証

Simple authenticationは、hadoop.security.authenticationが"simple"に設定されているHadoopの構成を指します。

```Plain
(
    "username" = "user",
    "password" = ""
);
```
usernameはアクセス対象のユーザーとして設定し、passwordは空白のままにしておくことができます。

### HDFS Kerberos認証

この認証方式では以下の情報が必要です：

- **hadoop.security.authentication:** 認証方式をKerberosとして指定します。

- **hadoop.kerberos.principal:** Kerberosプリンシパルを指定します。

- **hadoop.kerberos.keytab:** Kerberos keytabのファイルパスを指定します。このファイルはBrokerプロセスが配置されているサーバー上の絶対パスでなければならず、Brokerプロセスによってアクセス可能である必要があります。

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
Kerberos認証を使用するには、[krb5.conf (opens new window)](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html)ファイルが必要です。krb5.confファイルにはKerberos設定情報が含まれています。通常、krb5.confファイルは/etcディレクトリにインストールする必要があります。KRB5_CONFIG環境変数を設定することで、デフォルトの場所を上書きできます。krb5.confファイルの内容の例は以下の通りです：

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
### HDFS HA Mode

この設定は、HA（High Availability）モードでデプロイされたHDFSクラスタにアクセスするために使用されます。

- **dfs.nameservices:** HDFSサービスの名前を指定します。これはカスタマイズ可能です。例: "dfs.nameservices" = "my_ha"。

- **dfs.ha.namenodes.xxx:** namenodeの名前をカスタマイズします。複数の名前はカンマで区切ります。ここで、xxxはdfs.nameservicesで指定されたカスタム名を表します。例: "dfs.ha.namenodes.my_ha" = "my_nn"。

- **dfs.namenode.rpc-address.xxx.nn:** namenodeのRPCアドレス情報を指定します。この文脈で、nnはdfs.ha.namenodes.xxxで設定されたnamenode名を表します。例: "dfs.namenode.rpc-address.my_ha.my_nn" = "host:port"。

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
HAモードは、クラスターアクセスのために前述の2つの認証方法と組み合わせることができます。例えば、simple認証を通じてHA HDFSにアクセスする場合：

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

他のリモートストレージシステム用のBrokerは、Dorisクラスターのオプションプロセスであり、主にDorisがリモートストレージ上のファイルやディレクトリの読み書きを行うためのサポートに使用されます。
現在、Dorisは様々なリモートストレージシステム向けのBroker実装を提供しています。
以前のバージョンでは、異なるオブジェクトストレージBrokerも利用可能でしたが、現在はオブジェクトストレージからデータをインポートする際には`WITH S3`メソッドの使用が推奨されており、`WITH BROKER`メソッドはもはや推奨されていません。

- Tencent Cloud CHDFS
- Tencent Cloud GFS
- JuiceFS

BrokerはRPCサービスポートを通じてサービスを提供し、ステートレスなJavaプロセスとして動作します。その主要な責務は、open、pread、pwriteなどのリモートストレージに対するPOSIXライクなファイル操作をカプセル化することです。さらに、Brokerは他の情報を一切追跡しないため、リモートストレージに関連するすべての接続詳細、ファイル情報、権限詳細は、RPC呼び出し時にパラメータを通じてBrokerプロセスに渡す必要があります。これにより、Brokerが正しくファイルの読み書きを行えることが保証されます。

Brokerは純粋にデータの経路として機能し、計算タスクは一切含まないため、最小限のメモリ使用量しか必要としません。通常、Dorisシステムでは1つ以上のBrokerプロセスをデプロイします。さらに、同じタイプのBrokerはグループ化され、一意の名前（Broker name）が割り当てられます。

このセクションは主に、接続情報や認証詳細など、Brokerが異なるリモートストレージシステムにアクセスする際に必要なパラメータに焦点を当てています。これらのパラメータを理解し、正しく設定することは、Dorisとリモートストレージシステム間の成功的で安全なデータ交換にとって重要です。

**Broker情報**

Brokerの情報は2つの部分で構成されます：名前（Broker name）と認証情報です。通常の構文形式は以下の通りです：

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

通常、ユーザーは操作コマンドで`WITH BROKER "broker_name"`句を通じて既存のBroker Nameを指定する必要があります。Broker Nameは、`ALTER SYSTEM ADD BROKER`コマンドでBrokerプロセスを追加する際にユーザーが指定する名前です。1つの名前は通常1つ以上のBrokerプロセスに対応します。Dorisは名前に基づいて利用可能なBrokerプロセスを選択します。ユーザーは`SHOW BROKER`コマンドを通じて、現在クラスター内に存在するBrokerを確認できます。

:::info Note
Broker Nameは単にユーザー定義の名前であり、Brokerの種類を表すものではありません。
:::

**認証情報**
異なるBrokerの種類やアクセス方法には、異なる認証情報が必要です。認証情報は通常、`WITH BROKER "broker_name"`の後にKey-Value形式でProperty Mapに提供されます。

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
### HDFSにはNameNode HA（High Availability）の設定が必要です

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
### ワイルドカードを使用してHDFSから2つのファイルバッチにマッチするデータをインポートし、それらを2つの別々のTableにインポートする

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
HDFSからワイルドカード`file-10*`と`file-20*`にマッチする2つのバッチのファイルをインポートし、それらを2つの別々のTable`my_table1`と`my_table2`にロードします。この場合、my_table1はデータをパーティションp1にインポートすることを指定し、ソースファイルの2列目と3列目の値はインポート前に1ずつ増分されます。

### ワイルドカードを使用してHDFSからデータのバッチをインポートする

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
Hiveで一般的に使用されるデフォルトデリミタである\x01をデリミタとして指定し、ワイルドカード文字*を使用してデータディレクトリ下のすべてのディレクトリ内のすべてのファイルを参照します。

### Parquet形式のデータをインポートしFORMATを`parquet`として指定

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
デフォルトの方法は、ファイル拡張子によって決定することです。

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
`my_table`の列は`k1`、`k2`、`k3`、`city`、および`utc_date`です。

ディレクトリ`hdfs://hdfs_host:hdfs_port/user/doris/data/input/dir/city=beijing`には以下のファイルが含まれています：

```Plain
hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-01/0000.csv
hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-02/0000.csv
hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-03/0000.csv
hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-04/0000.csv
```
ファイルには`k1`、`k2`、`k3`の3つの列のデータのみが含まれています。他の2つの列である`city`と`utc_date`は、ファイルパスから抽出されます。

### インポートされたデータをフィルタリングする

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
k1 = 1である元データの行のうち、変換後にk1 > k2となる行のみがインポートされます。

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
時刻には"%3A"が含まれています。HDFSパスではコロン":"は許可されていないため、すべてのコロンが"%3A"に置換されます。
:::

このパスの下には以下のファイルがあります：

```Plain
/user/data/data_time=2020-02-17 00%3A00%3A00/test.txt
/user/data/data_time=2020-02-18 00%3A00%3A00/test.txt
```
Table構造は以下のとおりです：

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
### インポートにMergeモードを使用する

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
Merge modeをimportに使用するには、"my_table"はUnique Key tableである必要があります。importされるデータの"v2"列の値が100より大きい場合、その行は削除行として扱われます。importタスクのタイムアウトは3600秒で、最大10%のエラー率が許可されます。

### 置換の順序を確保するために、import時に"source_sequence"列を指定してください。

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
### 指定されたファイル形式を`json`としてインポートし、それに応じて`json_root`とjsonpathsを指定します。

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
`jsonpaths`は列リストや`SET (column_mapping)`と組み合わせて使用することもできます：

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
JSONファイルのルートノードでJSONオブジェクトを読み込む必要がある場合、jsonpathsは`$.`として指定する必要があります。例：`PROPERTIES("jsonpaths"="$.")`
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

  Brokerを使用してGCSにアクセスする場合、Project IDは必須ですが、その他のパラメータは任意です。すべてのパラメータ設定については、[GCS Config](https://github.com/GoogleCloudDataproc/hadoop-connectors/blob/branch-2.2.x/gcs/CONFIGURATION.md)を参照してください。

  ```sql
  (
      "fs.gs.project.id" = "Your Project ID",
      "fs.AbstractFileSystem.gs.impl" = "com.google.cloud.hadoop.fs.gcs.GoogleHadoopFS",
      "fs.gs.impl" = "com.google.cloud.hadoop.fs.gcs.GoogleHadoopFileSystem",
  )
  ```
## その他のヘルプ

Broker Load の使用に関するより詳細な構文とベストプラクティスについては、Broker Load コマンドマニュアルを参照してください。また、MySQL クライアントのコマンドラインで HELP BROKER LOAD を入力することで、より多くのヘルプ情報を取得できます。
