---
{
    "title": "SELECT INTO OUTFILE",
    "language": "ja",
    "description": "SELECT INTO OUTFILE を使用して Doris のクエリ結果を S3、HDFS などのストレージに同期的にエクスポートする方法を、Parquet、ORC、CSV の例とともに説明します。",
    "keywords": [
        "SELECT INTO OUTFILE",
        "Doris のエクスポート",
        "クエリ結果のエクスポート",
        "S3 へのエクスポート",
        "HDFS へのエクスポート",
        "Parquet エクスポート",
        "ORC エクスポート",
        "CSV エクスポート",
        "並列エクスポート",
        "enable_parallel_outfile",
        "max_file_size",
        "success_file_name"
    ]
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Data export / Query result persistence / Offline analysis data delivery -->

このドキュメントでは、`SELECT INTO OUTFILE` コマンドを使用して、Doris のクエリ結果を指定したファイル形式でオブジェクトストレージまたは HDFS に同期的にエクスポートする方法を説明します。

`SELECT INTO OUTFILE` は、Doris が提供する**同期エクスポートコマンド**です。`SELECT` クエリの結果を、Parquet、ORC、CSV などの形式でオブジェクトストレージ（S3/COS/OSS/OBS/GCS）または HDFS に書き込みます。コマンドが返った時点で、エクスポートは完了しています。

- 成功した場合: エクスポートしたファイル数、サイズ、パスなどの情報を返します。
- 失敗した場合: エラーメッセージを返します。

> `SELECT INTO OUTFILE` と `EXPORT` の使い分けについては、[エクスポートの概要](./export-overview.md)を参照してください。
> コマンドの完全なリファレンスについては、[SELECT INTO OUTFILE の構文](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE)を参照してください。

## 適用シナリオ

<!-- Knowledge type: Architecture selection decision -->

`SELECT INTO OUTFILE` は、次のデータエクスポートのシナリオに適しています。

| シナリオ | 説明 |
| --- | --- |
| 複雑な計算結果のエクスポート | エクスポートするデータにフィルタリング、集計、結合（JOIN）などの複雑な計算処理が必要な場合。 |
| 同期処理 | 後続の処理を行う前に、業務ワークフローがエクスポートの完了を待つ必要がある場合。 |

### 制限事項

- 圧縮されたテキスト形式でのエクスポートはサポートされていません。
- バージョン 2.1 のパイプラインエンジンは並列エクスポートをサポートしていません。

## 機能の概要

<!-- Knowledge type: Configuration parameters -->

### 対応する保存先

| ストレージの種類 | 対応する保存先 |
| --- | --- |
| オブジェクトストレージ | Amazon S3、Tencent Cloud COS、Alibaba Cloud OSS、Huawei Cloud OBS、Google GCS |
| 分散ファイルシステム | HDFS |
| ローカルファイルシステム | デバッグ専用。手動で有効化する必要があります（付録を参照）。 |

### 対応するファイル形式

- Parquet
- ORC
- csv
- csv\_with\_names
- csv\_with\_names\_and\_types

## クイックスタート

<!-- Knowledge type: Operation steps -->

### ステップ 1: テーブルを作成してデータをロードする

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");

insert into tbl values
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, null, null);
```

### ステップ 2: HDFS にエクスポートする

クエリ結果を `hdfs://path/to/` ディレクトリに Parquet 形式でエクスポートします。

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://ip:port/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://ip:port",
    "hadoop.username" = "hadoop"
);
```

### ステップ 3: オブジェクトストレージにエクスポートする

クエリ結果を `s3://bucket/export/` ディレクトリに ORC 形式でエクスポートします。`ak` や `sk` などのアクセス認証情報を指定する必要があります。

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

## 高度な機能

### 並列エクスポートを有効にする（エクスポート効率の向上）

<!-- Applicable scenarios: Large data volume export / Performance tuning -->

セッション変数 `enable_parallel_outfile` を使用して並列エクスポートを有効にします。

```sql
SET enable_parallel_outfile=true;
```

| 項目 | 説明 |
| --- | --- |
| 動作の仕組み | 複数の BE ノードと複数のスレッドを使用して、結果データを並行してエクスポートします。 |
| 利点 | エクスポート全体の効率が大幅に向上します。 |
| 副作用 | 生成されるファイルが増える可能性があります。 |
| 適用されない場合 | クエリにグローバルソートが含まれる場合、このパラメータを有効にしても並列エクスポートは機能しません。 |
| 有効になったことの確認方法 | エクスポートコマンドが複数行を返した場合、並列エクスポートが機能しています。 |

## 代表的なシナリオの例

### シナリオ 1: 高可用性が有効な HDFS クラスターへのエクスポート

<!-- Applicable scenarios: HA HDFS environment -->

HDFS で HA が有効な場合は、ネームサービスと NameNode に関する設定も指定する必要があります。

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://HDFS8000871/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### シナリオ 2: HA と Kerberos 認証が有効な HDFS クラスターへのエクスポート

<!-- Applicable scenarios: Kerberos secure authentication environment -->

HDFS クラスターで高可用性と Kerberos 認証の両方が有効な場合は、次の SQL を参照してください。

```sql
SELECT * FROM tbl
INTO OUTFILE "hdfs://path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
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

### シナリオ 3: エクスポート成功を示すマーカーファイルを生成する

<!-- Applicable scenarios: Synchronous task integrity verification / Avoiding unknown status caused by network disconnection -->

**背景**: `SELECT INTO OUTFILE` は同期コマンドです。SQL の実行中に接続が切断された場合、エクスポートが完了したかどうか判断できません。

**対処方法**: `success_file_name` パラメータを使用します。エクスポートが成功すると、ディレクトリ内にマーカーファイル（Hive の `_SUCCESS` に相当）が生成されます。このファイルの有無を確認することで、エクスポートの完全性を確認できます。

次の例では、クエリ結果を CSV 形式で S3 にエクスポートし、完了後に `SUCCESS` という名前のマーカーファイルを生成します。

```sql
SELECT k1,k2,v1 FROM tbl1 LIMIT 100000
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "success_file_name" = "SUCCESS"
);
```

### シナリオ 4: エクスポート前に出力先ディレクトリを空にする

<!-- Applicable scenarios: Overwrite-style export / Periodic full replacement -->

`delete_existing_files` パラメータを使用して、エクスポート前に出力先ディレクトリ内の既存ファイルを削除します。

```sql
SELECT * FROM tbl1
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "delete_existing_files" = "true"
);
```

**条件とリスク**:

| 項目 | 説明 |
| --- | --- |
| 動作 | まず `s3://bucket/export/` 配下のすべてのファイルとサブディレクトリを削除し、その後データをエクスポートします。 |
| 有効化の条件 | `enable_delete_existing_files = true` の設定を `fe.conf` に追加し、FE を再起動する必要があります。 |
| リスクに関する警告 | この操作は外部システムのデータを削除します。リスクの高い操作であるため、外部システムの権限とデータの安全性を自身で確保する必要があります。 |

### シナリオ 5: エクスポートするファイルごとのサイズを制御する

`max_file_size` パラメータを使用して、エクスポートする各ファイルの最大サイズを制御します。

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://path/to/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "max_file_size" = "2048MB"
);
```

**補足**:

- 最終的に生成されるデータが 2 GB 以下の場合、ファイルは一つだけ生成されます。
- 2 GB を超える場合、データは複数のファイルに分割されます。
- 各行のデータは必ず単一のファイル内に収まるように分割されるため、実際のファイルサイズは厳密には `max_file_size` と一致しません。

## 注意事項

<!-- Knowledge type: Configuration parameters / Troubleshooting -->

### パフォーマンスとタイムアウト

| 項目 | 説明 |
| --- | --- |
| エクスポート時間の内訳 | `SELECT INTO OUTFILE` は基本的に SQL クエリであるため、合計時間 = クエリ時間 + 結果セットの書き出し時間です。 |
| 単一スレッドのボトルネック | 並列エクスポートが有効でない場合、クエリ結果は単一の BE ノード上の単一スレッドで書き出されます。 |
| パフォーマンスの最適化 | `enable_parallel_outfile` を有効にすると並列エクスポートを使用でき、所要時間を大幅に短縮できます。 |
| エクスポートのタイムアウト | エクスポートコマンドのタイムアウトはクエリのタイムアウトと同じです。データ量が多い場合は、`query_timeout` を設定して適切に延長できます。 |

### ファイル管理

- **Doris はエクスポート済みファイルを管理しません**: エクスポートが成功した場合も、失敗後にファイルが残った場合も、自身でクリーンアップする必要があります。
- **パスやファイルの存在確認は行いません**: `SELECT INTO OUTFILE` はファイルやパスの存在を確認しません。パスが自動的に作成されるか、既存ファイルが上書きされるかは、リモートストレージシステムの仕様によって決まります。

### データと形式

- **空の結果セット**: クエリの結果セットが空でも、空のファイルが生成されます。
- **ファイル分割のルール**: 各行のデータは必ず単一のファイル内に収まるため、ファイルサイズは厳密には `max_file_size` と一致しません。
- **印字できない文字を出力する関数**: `BITMAP` や `HLL` など、印字できない文字を出力する関数の値は、CSV へのエクスポート時に `\N` として書き込まれます。

## 付録

### ローカルファイルシステムへのエクスポート（デバッグ専用）

<!-- Applicable scenarios: Local debugging / Development verification -->
<!-- Knowledge type: Configuration parameters -->

:::caution
この機能はローカルでのデバッグと開発専用です。**本番環境では使用しないでください**。また、エクスポート先ディレクトリの権限とデータの安全性を自身で確保する必要があります。
:::

**有効化方法**: `enable_outfile_to_local=true` の設定を `fe.conf` に追加し、FE を再起動します。

**例**: `tbl` テーブルのすべてのデータをローカルファイルシステムに CSV 形式（デフォルトの形式）でエクスポートします。列区切り文字には `,` を使用します。

```sql
SELECT c1, c2 FROM db.tbl
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

**動作に関する注意事項**:

- データは BE ノードのローカルディスクに書き込まれます。
- 複数の BE ノードがある環境では、エクスポートタスクの並行度に応じて、データが異なる BE ノードに分散されます。
- `result_c6df5f01bd664dde-a2168b019b6c2b3f_0.csv` のようなファイルが、BE ノード上の `/path/to/` ディレクトリに生成されます。
- 対象の BE ノードの IP アドレスは、返される結果に表示されます。

**戻り値の例**:

```text
+------------+-----------+----------+--------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                      |
+------------+-----------+----------+--------------------------------------------------------------------------+
|          1 |   1195072 |  4780288 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b3f_* |
|          1 |   1202944 |  4811776 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b40_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b43_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b45_* |
+------------+-----------+----------+--------------------------------------------------------------------------+
```
