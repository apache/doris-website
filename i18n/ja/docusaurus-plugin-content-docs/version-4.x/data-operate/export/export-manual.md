---
{
    "title": "EXPORT による非同期エクスポート",
    "language": "ja",
    "description": "EXPORT コマンドを使用して、Doris のテーブルまたはパーティションのデータを HDFS、S3、またはオブジェクトストレージへ非同期にエクスポートします。Parquet、ORC、CSV 形式に対応しています。",
    "keywords": [
        "Doris EXPORT",
        "非同期エクスポート",
        "S3 へのエクスポート",
        "HDFS へのエクスポート",
        "Parquet エクスポート",
        "ORC エクスポート",
        "CSV エクスポート",
        "SHOW EXPORT",
        "CANCEL EXPORT",
        "SELECT INTO OUTFILE"
    ]
}
---

<!-- Knowledge type: Operating procedure / Configuration parameters / Architectural selection decision -->
<!-- Applicable scenarios: Data export / Data archiving / Cross-system data movement -->

このドキュメントでは、`EXPORT` コマンドを使用して Doris に保存されたデータを外部ストレージシステムへ非同期にエクスポートする方法を説明します。

`EXPORT` は Doris が提供する**非同期データエクスポート**機能です。指定したテーブルまたはパーティションのデータを、指定したファイル形式でオブジェクトストレージ、HDFS、またはローカルファイルシステムへエクスポートします。

コマンドはジョブの送信後すぐに応答します。`SHOW EXPORT` でジョブの状態を確認できます。

## 適用シナリオ

| シナリオ | EXPORT の推奨度 | 説明 |
| --- | --- | --- |
| 単一の大きなテーブルのエクスポート | 推奨 | 単純なフィルター条件のみが必要な場合 |
| 非同期ジョブの送信 | 推奨 | コマンドはすぐに応答し、クライアントをブロックしません |
| SELECT の結果セットのエクスポート | 非対応 | 代わりに [OUTFILE によるエクスポート](../../data-operate/export/outfile.md) を使用してください |
| 圧縮テキストファイルのエクスポート | 非対応 | 現行バージョンは圧縮テキスト形式に対応していません |

`SELECT INTO OUTFILE` と `EXPORT` の選び方については、[エクスポートの概要](../../data-operate/export/export-overview.md)を参照してください。

`EXPORT` コマンドの完全な構文については、[EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT)を参照してください。

## 機能の概要

### 対応するデータソース

`EXPORT` は、次の種類のテーブルとビューのエクスポートに対応しています。

- Doris の内部テーブル
- Doris の論理ビュー
- External Catalog 内のテーブル（Hive の外部テーブルなど）

### 対応する保存先

| ストレージの種類 | 対応する保存先 |
| --- | --- |
| オブジェクトストレージ | Amazon S3、Tencent Cloud COS、Alibaba Cloud OSS、Huawei Cloud OBS、Google GCS |
| 分散ファイルシステム | HDFS |
| ローカルファイルシステム | ローカルでのデバッグと開発に限ります。手動で有効にする必要があります |

### 対応するファイル形式

- Parquet
- ORC
- CSV
- csv\_with\_names
- csv\_with\_names\_and\_types

## クイックスタート

<!-- Knowledge type: Operating procedure -->

### ステップ 1：テーブルを作成してデータをロードする

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");

INSERT INTO tbl VALUES
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, NULL, NULL);
```

### ステップ 2：エクスポートジョブを作成する

#### HDFS へエクスポートする

`tbl` テーブルの全データを、デフォルトの CSV 形式、列区切り文字 `,` で HDFS へエクスポートします。

```sql
EXPORT TABLE tbl
TO "hdfs://host/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS"="hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```

#### オブジェクトストレージ（S3）へエクスポートする

`tbl` テーブルの全データを、デフォルトの CSV 形式、列区切り文字 `,` で S3 オブジェクトストレージへエクスポートします。

```sql
EXPORT TABLE tbl TO "s3://bucket/export/export_" 
PROPERTIES (
    "line_delimiter" = ","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### ステップ 3：エクスポートジョブの状態を確認する

[SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT) コマンドを使用して、エクスポートジョブの進行状況と結果を確認します。

```sql
mysql> SHOW EXPORT\G
*************************** 1. row ***************************
      JobId: 143265
      Label: export_0aa6c944-5a09-4d0b-80e1-cb09ea223f65
      State: FINISHED
   Progress: 100%
   TaskInfo: {"partitions":[],"parallelism":5,"data_consistency":"partition","format":"csv","broker":"S3","column_separator":"\t","line_delimiter":"\n","max_file_size":"2048MB","delete_existing_files":"","with_bom":"false","db":"tpch1","tbl":"lineitem"}
       Path: s3://bucket/export/export_
 CreateTime: 2024-06-11 18:01:18
  StartTime: 2024-06-11 18:01:18
 FinishTime: 2024-06-11 18:01:31
    Timeout: 7200
   ErrorMsg: NULL
OutfileInfo: [
  [
    {
      "fileNumber": "1",
      "totalRows": "6001215",
      "fileSize": "747503989",
      "url": "s3://bucket/export/export_6555cd33e7447c1-baa9568b5c4eb0ac_*"
    }
  ]
]
1 row in set (0.00 sec)
```

結果の各列の意味については、[SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT)を参照してください。

### ステップ 4：エクスポートジョブをキャンセルする（任意）

エクスポートジョブが成功または失敗する前であれば、[CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT) コマンドでキャンセルできます。

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```

## 高度な使用例

<!-- Knowledge type: Operating procedure -->

### 高可用性 HDFS クラスターへエクスポートする

HDFS で高可用性（HA）が有効な場合は、HA 関連のパラメーターを追加で指定する必要があります。

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### HA と Kerberos 認証を使用する HDFS クラスターへエクスポートする

Hadoop クラスターで高可用性と Kerberos 認証の両方が有効な場合は、次の SQL を参照してください。

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS"="hdfs://hacluster/",
    "hadoop.username" = "hadoop",
    "dfs.nameservices"="hacluster",
    "dfs.ha.namenodes.hacluster"="n1,n2",
    "dfs.namenode.rpc-address.hacluster.n1"="192.168.0.1:8020",
    "dfs.namenode.rpc-address.hacluster.n2"="192.168.0.2:8020",
    "dfs.client.failover.proxy.provider.hacluster"="org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "dfs.namenode.kerberos.principal"="hadoop/_HOST@REALM.COM",
    "hadoop.security.authentication"="kerberos",
    "hadoop.kerberos.principal"="doris_test@REALM.COM",
    "hadoop.kerberos.keytab"="/path/to/doris_test.keytab"
);
```

### 指定したパーティションのみをエクスポートする

Doris の内部テーブルから一部のパーティションのみをエクスポートします。たとえば、`p1` と `p2` のみを `test` テーブルからエクスポートする場合は、次のように指定します。

```sql
EXPORT TABLE test
PARTITION (p1,p2)
TO "s3://bucket/export/export_" 
PROPERTIES (
    "columns" = "k1,k2"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### 条件によって絞り込んでエクスポートする

`WHERE` 句を使用してデータを絞り込み、条件に一致する行だけをエクスポートします。たとえば、`k1 < 50` を満たす行だけをエクスポートします。

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "s3://bucket/export/export_"
PROPERTIES (
    "columns" = "k1,k2",
    "column_separator"=","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### External Catalog の外部テーブルからデータをエクスポートする

`EXPORT` は、External Catalog の外部テーブル（Hive の外部テーブルなど）からのデータエクスポートに対応しています。

```sql
-- Create a Hive Catalog
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);

-- Export the Hive table
EXPORT TABLE hive_catalog.sf1.lineitem TO "s3://bucket/export/export_"
PROPERTIES(
    "format" = "csv",
    "max_file_size" = "1024MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### エクスポート前に出力先ディレクトリを空にする

エクスポート前に出力先ディレクトリを空にするには、`delete_existing_files` パラメーターを使用します。

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

有効化の条件と動作は次のとおりです。

- `"delete_existing_files" = "true"` を設定すると、エクスポートジョブは**最初に** `s3://bucket/export/` ディレクトリ内のすべてのファイルとサブディレクトリを削除し、その後データをエクスポートします。
- このパラメーターを有効にするには、`enable_delete_existing_files = true` を `fe.conf` に追加し、FE を再起動する必要があります。

:::caution
この操作は外部システムのデータを削除する**高リスクな操作**です。外部システムの権限管理とデータ保護を適切に行ってください。
:::

### 単一のエクスポートファイルのサイズを制御する

`max_file_size` を使用して、単一のエクスポートファイルのサイズを制御します。設定値を超えるファイルは自動的に分割されます。

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

`max_file_size` の有効範囲は次のとおりです。

| バージョン範囲 | 最小値 | 最大値 |
| --- | --- | --- |
| 2.1.11 より前 / 3.0.7 より前 | 5MB | 2GB |
| 2.1.11 以降 / 3.0.7 以降 | 5MB | 無制限 |

## 注意事項とベストプラクティス

<!-- Knowledge type: Best practices / Troubleshooting -->
<!-- Applicable scenarios: Production usage / Fault diagnosis -->

| 項目 | 推奨事項と注意事項 |
| --- | --- |
| ジョブあたりのデータ量 | 単一の Export ジョブで処理するデータ量は、数十 GB 以下を推奨します。大きなテーブルはパーティションごとに分けてエクスポートし、不要なファイルの増加や再試行時の負担を避けてください |
| システムリソースへの影響 | エクスポートジョブはデータをスキャンして I/O リソースを消費するため、クエリのレイテンシーに影響する可能性があります |
| 失敗時のファイル管理 | ジョブが失敗しても、生成済みのファイルは自動で削除されません。手動で削除する必要があります |
| エクスポートのタイムアウト | データ量が非常に多い場合、タイムアウトすることがあります。Export コマンドの `timeout` パラメーターでタイムアウト時間を延長し、再試行できます |
| FE の再起動または master の切り替え | 実行中に FE が再起動したり、master が切り替わったりすると、ジョブは失敗します。`SHOW EXPORT` で状態を確認し、再送信してください |
| パーティション数の上限 | 単一の Export ジョブでエクスポートできるパーティションは最大 2000 個です。`maximum_number_of_export_partitions` を `fe.conf` で調整し、FE を再起動すると上限を変更できます |
| データの整合性確認 | エクスポート完了後に行数とデータの正確性を検証し、データ品質を確認してください |

## 付録

### 基本的な仕組み

<!-- Knowledge type: Architectural principles -->

`EXPORT` ジョブは内部的に `SELECT INTO OUTFILE` SQL 文を使用して実行されます。全体の流れは次のとおりです。

1. ユーザーが `EXPORT` ジョブを送信します。
2. Doris がエクスポート対象のテーブルに基づいて、一つ以上の `SELECT INTO OUTFILE` 実行プランを作成します。
3. これらの実行プランを Doris Job Schedule のタスクスケジューラーに送信します。
4. Job Schedule がジョブを自動的にスケジュールして実行し、最終的にエクスポートファイルを生成します。

### ローカルファイルシステムへエクスポートする

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Local debugging / Development environment -->

:::caution
ローカルファイルシステムへのエクスポートは、**ローカルでのデバッグと開発専用です。本番環境では使用しないでください**。エクスポート先ディレクトリの権限管理とデータ保護を適切に行ってください。
:::

#### 有効化の方法

この機能はデフォルトで無効です。有効にするには、次の操作を行います。

1. `enable_outfile_to_local=true` を `fe.conf` に追加します。
2. 設定を反映するために FE を再起動します。

#### 使用例

`tbl` テーブルの全データを、デフォルトの CSV 形式、列区切り文字 `,` でローカルファイルシステムへエクスポートします。

```sql
EXPORT TABLE db.tbl TO "file:///path/to/result_"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```

#### データの配置

- データは BE ノードのローカルディスクに書き込まれます。
- 複数の BE がある環境では、エクスポートジョブの並列度に応じて、データが異なる BE ノードに分散され、各ノードに一部のデータが保存されます。
- 上の例では、`result_7052bac522d840f5-972079771289e392_0.csv` などのファイルが BE ノードの `/path/to/` ディレクトリに生成されます。

#### 対象の BE ノードを特定する

対象の BE ノードの IP アドレスは、`OutfileInfo` 列（`SHOW EXPORT` の結果）で確認できます。

```text
[
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.136/path/to/result_7052bac522d840f5-972079771289e392_*"
        }
    ], 
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.137/path/to/result_22aba7ec933b4922-ba81e5eca12bf0c2_*"
        }
    ]
]
```
