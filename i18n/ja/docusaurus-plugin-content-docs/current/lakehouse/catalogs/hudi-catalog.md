---
{
    "title": "Hudi Catalog",
    "language": "ja",
    "description": "Hudi Catalog は Hive Catalog を再利用し、Hive Metastore または Hive Metastore と互換性のあるメタデータサービスに接続します。"
}
---

Hudi Catalog は Hive Catalog を再利用します。Hive Metastore または Hive Metastore と互換性のあるメタデータサービスに接続することで、Doris は Hudi のデータベースとテーブルの情報を自動的に取得し、データをクエリできます。

[Apache Doris と Apache Hudi のクイックスタート](../best-practices/doris-hudi.md)。

## 適用シナリオ

| シナリオ | 説明 |
| -------- | ----------- |
| クエリの高速化 | Doris の分散コンピューティングエンジンから Hudi データに直接アクセスし、クエリを高速化します。 |
| データ統合 | Hudi データを読み取って Doris の内部テーブルに書き込むか、Doris のコンピューティングエンジンを使用して ZeroETL 操作を実行します。 |
| データの書き戻し | サポートしていません。 |

## Catalog の設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'hms', -- required
    'hive.metastore.uris' = '<metastore_thrift_url>', -- required
    {MetaStoreProperties},
    {StorageProperties},
    {HudiProperties},
    {CommonProperties}
);
```

* `[MetaStoreProperties]`

  MetaStoreProperties セクションには、Metastore メタデータサービスへの接続情報と認証情報を指定します。詳細は「[サポートするメタデータサービス]」セクションを参照してください。

* `[StorageProperties]`

  StorageProperties セクションには、ストレージシステムに関する接続情報と認証情報を指定します。詳細は「[サポートするストレージシステム]」セクションを参照してください。

* `[CommonProperties]`

  CommonProperties セクションには、共通プロパティを指定します。[Data Catalog の概要](../catalog-overview.md)の「[共通プロパティ]」セクションを参照してください。

* `{HudiProperties}`

  | パラメータ名                  | 旧名称                | 説明                                                                                                                                               | デフォルト値 |
  | ------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
  | `hudi.use_hive_sync_partition`  | `use_hive_sync_partition`  | Hive Metastore に同期済みのパーティション情報を使用するかどうかを指定します。true の場合、パーティション情報を Hive Metastore から直接取得します。それ以外の場合は、ファイルシステム上のメタデータファイルから取得します。Hive Metastore からの取得はより効率的ですが、最新のメタデータが Hive Metastore に同期されていることをユーザーが確認する必要があります。 | false |

## メタデータキャッシュ {#meta-cache}

外部データソースへのアクセス性能を向上させるため、Apache Doris は Hudi テーブルが依存する Hive Metastore のメタデータをキャッシュします。対象はテーブルオブジェクト、パーティション名、パーティションオブジェクト、カラム統計です。

:::tip
Doris 4.1.x より前のバージョンでは、メタデータキャッシュは主に FE の設定項目によってグローバルに制御されます。詳細は[メタデータキャッシュ](../meta-cache.md)を参照してください。
Doris 4.1.x 以降では、Hudi Catalog の外部メタデータキャッシュを統一された `meta.cache.*` キーで設定します。以下の項目は現在のバージョンを説明しています。Doris 4.1.x と 4.2.x では別の項目セットを使用します。詳しくは、このページの 4.x バージョンを参照してください。
:::

### キャッシュプロパティの設定 {#meta-cache-unified-model}

各キャッシュ項目は、`meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}` という統一された設定キー形式を使用します。Hudi Catalog のキャッシュはシステムテーブル上では `hudi` エンジンに属しますが、共有の Hive Metastore キャッシュであるため、設定には `hive` エンジントークンを使用します：`meta.cache.hive.<entry>.*`。

| プロパティ | 例 | 意味 |
|---|---|---|
| `enable` | `true/false` | このキャッシュ項目を有効にするかどうか。 |
| `ttl-second` | `600`, `0`, `-1` | `0` は項目を無効にします（即座に反映され、最新データの確認に使用できます）。`-1` は期限切れにならないことを意味し、その他の正の整数はアクセス時刻を基準とする TTL（秒）を意味します。 |
| `capacity` | `10000` | キャッシュ項目数の上限。`0` は項目を無効にします。 |
| `max-weight` | `1GB` | Doris 4.1.4 以降でサポートします。保持メモリの推定量に対する任意の上限です。正の値が必要で、`0` は拒否されます。以下で示す項目にのみ指定できます。 |

**有効化の条件：** `enable=true`、`ttl-second != 0`、`capacity > 0` の場合に項目が有効になります。FE 全体、Catalog、または項目単位のメモリ制限も、推定メモリ量に基づいてキャッシュへの登録を制御します。[外部メタデータキャッシュのメモリ管理](../external-meta-cache-memory-management)を参照してください。

### キャッシュモジュール {#meta-cache-unified-modules}

Hudi Catalog には次のキャッシュ項目があります。すべての項目で `max-weight` を指定できます。

| 項目 (`<entry>`) | プロパティキーの接頭辞 | `ENTRY_NAME` | キャッシュされる内容と影響 | デフォルトの enable / TTL / capacity |
|---|---|---|---|---|
| `table` | `meta.cache.hive.table.` | `hive-table` | Hive Metastore のテーブルオブジェクト。 | `true` / 86400 s / 10000 |
| `partition_names` | `meta.cache.hive.partition_names.` | `hive-partition-names` | パーティション名の一覧。パーティションの検出とプルーニングに影響します。無効にすると、新しいパーティションがすぐに見えるようになります。 | `true` / 86400 s / 10000 |
| `partition` | `meta.cache.hive.partition.` | `hive-partition` | 保存場所や入力形式などのパーティションオブジェクト。 | `true` / 86400 s / 100000 |
| `column_stats` | `meta.cache.hive.column_stats.` | `hive-column-stats` | Hive Metastore のカラム統計。 | `true` / 86400 s / 10000 |

Hudi テーブルのカラムスキーマは、共有の `default` エンジン（`meta.cache.default.schema.*`）によってキャッシュされます。

### 旧パラメータとの対応関係と変換 {#meta-cache-mapping}

| 旧プロパティキー | 統一されたキー | 説明 |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.default.schema.ttl-second` と `meta.cache.hive.table.ttl-second` | テーブルスキーマとテーブルオブジェクトのキャッシュの有効期限 |
| `partition.cache.ttl-second` | `meta.cache.hive.partition_names.ttl-second` | パーティション名一覧の有効期限 |

### ベストプラクティス {#meta-cache-best-practices}

* **最新データへのリアルタイムアクセス**：各クエリで Hudi テーブルの最新のパーティションを参照する場合は、パーティション名キャッシュの TTL を `0` に設定します。
  ```sql
  -- Disable the partition name cache to detect the latest partitions of Hudi tables
  ALTER CATALOG hudi_ctl SET PROPERTIES ("meta.cache.hive.partition_names.ttl-second" = "0");
  ```
* **性能の最適化**：Catalog プロパティの変更が成功すると、影響を受けるメタデータキャッシュが削除され、次回のアクセス時に新しい設定で再構築されます。`meta.cache.max-weight` または `schema.cache.ttl-second` を変更すると、その Catalog のすべてのキャッシュが削除されます。`meta.cache.<engine>.<entry>.*` を変更すると、そのエンジンのキャッシュが削除されます。実行中のクエリには影響しません。

### 可観測性 {#meta-cache-unified-observability}

キャッシュのメトリクスは、`information_schema.catalog_meta_cache_statistics` システムテーブルで確認できます。`ENTRY_NAME` には上の表に記載した名前が表示され、`default` エンジンの行は共有のテーブルスキーマキャッシュを表します。

```sql
SELECT engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, max_weight, estimated_weight
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'hudi_ctl'
ORDER BY engine_name, entry_name;
```

このシステムテーブルの詳細は、[catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md)を参照してください。

### サポートする Hudi のバージョン

現在依存している Hudi のバージョンは 0.15 です。Hudi 0.14 以降のデータへのアクセスを推奨します。

### サポートするクエリの種類

| テーブルの種類    | サポートするクエリの種類                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Copy On Write | スナップショットクエリ、タイムトラベル、増分読み取り                            |
| Merge On Read | スナップショットクエリ、読み取り最適化クエリ、タイムトラベル、増分読み取り  |

### サポートするメタデータサービス

* [Hive Metastore](../metastores/hive-metastore.md)

### サポートするストレージシステム

* [HDFS](../storages/hdfs.md)
* [AWS S3](../storages/s3.md)
* [Google Cloud Storage](../storages/gcs.md)
* [Alibaba Cloud OSS](../storages/aliyun-oss.md)
* [Tencent Cloud COS](../storages/tencent-cos.md)
* [Huawei Cloud OBS](../storages/huawei-obs.md)
* [MINIO](../storages/minio.md)

### サポートするデータ形式

* [Parquet](../file-formats/parquet.md)
* [ORC](../file-formats/orc.md)

## カラム型のマッピング

| Hudi の型     | Doris の型    | 備考                                                   |
| ------------- | ------------- | --------------------------------------------------------- |
| boolean       | boolean       |                                                           |
| int           | int           |                                                           |
| long          | bigint        |                                                           |
| float         | float         |                                                           |
| double        | double        |                                                           |
| decimal(P, S) | decimal(P, S) |                                                           |
| bytes         | string        |                                                           |
| string        | string        |                                                           |
| date          | date          |                                                           |
| timestamp     | datetime(N)   | 精度に応じて datetime(3) または datetime(6) に自動的にマッピングされます |
| array         | array         |                                                           |
| map           | map           |                                                           |
| struct        | struct        |                                                           |
| other         | UNSUPPORTED   |                                                           |

## 例

Hudi Catalog の作成方法は Hive Catalog と似ています。その他の例は、[Hive Catalog](./hive-catalog.mdx)を参照してください。

```sql
CREATE CATALOG hudi_hms PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

## クエリ操作

### 基本的なクエリ

Catalog を設定したら、次の方法で Catalog 内のテーブルをクエリできます。

```sql
-- 1. switch to catalog, use database and query
SWITCH hudi_ctl;
USE hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 2. use hudi database directly
USE hudi_ctl.hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM hudi_ctl.hudi_db.hudi_tbl LIMIT 10;
```

### タイムトラベル

Hudi テーブルへの書き込み操作ごとに、新しいスナップショットが作成されます。Doris は Hudi テーブルの指定したスナップショットの読み取りをサポートします。デフォルトでは、クエリは最新のスナップショットのみを読み取ります。

`hudi_meta()` テーブル関数を使用して、指定した Hudi テーブルのタイムラインをクエリできます。

このテーブル関数は 3.1.0 以降でサポートされています。

```sql
SELECT * FROM hudi_meta(
    'table' = 'hudi_ctl.hudi_db.hudi_tbl',
    'query_type' = 'timeline'
);

+-------------------+--------+--------------------------+-----------+-----------------------+
| timestamp         | action | file_name                | state     | state_transition_time |
+-------------------+--------+--------------------------+-----------+-----------------------+
| 20241202171214902 | commit | 20241202171214902.commit | COMPLETED | 20241202171215756     |
| 20241202171217258 | commit | 20241202171217258.commit | COMPLETED | 20241202171218127     |
| 20241202171219557 | commit | 20241202171219557.commit | COMPLETED | 20241202171220308     |
| 20241202171221769 | commit | 20241202171221769.commit | COMPLETED | 20241202171222541     |
| 20241202171224269 | commit | 20241202171224269.commit | COMPLETED | 20241202171224995     |
| 20241202171226401 | commit | 20241202171226401.commit | COMPLETED | 20241202171227155     |
| 20241202171228827 | commit | 20241202171228827.commit | COMPLETED | 20241202171229570     |
| 20241202171230907 | commit | 20241202171230907.commit | COMPLETED | 20241202171231686     |
| 20241202171233356 | commit | 20241202171233356.commit | COMPLETED | 20241202171234288     |
| 20241202171235940 | commit | 20241202171235940.commit | COMPLETED | 20241202171236757     |
+-------------------+--------+--------------------------+-----------+-----------------------+
```

スナップショットのタイムスタンプを指定し、`FOR TIME AS OF` 文で過去のバージョンのデータを読み取れます。時刻の形式は Hudi のドキュメントに準拠します。例を以下に示します。

```sql
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07 17:20:37";
SELECT * FROM hudi_tbl FOR TIME AS OF "20221007172037";
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07";
```

Hudi テーブルでは `FOR VERSION AS OF` 文をサポートしていません。この構文を Hudi テーブルに使用すると、エラーが発生します。

### 増分クエリ

増分読み取りでは、指定した時間範囲内のデータ変更をクエリし、その期間の終了時点でのデータの最終状態を返します。

Doris は `@incr` 構文によって増分読み取りをサポートします。

```sql
SELECT * from hudi_table@incr('beginTime'='xxx', ['endTime'='xxx'], ['hoodie.read.timeline.holes.resolution.policy'='FAIL'], ...);
```

* `beginTime`

  必須です。時刻の形式は Hudi の公式ドキュメントにある [hudi\_table\_changes](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#incremental-query) と同じで、"earliest" を指定できます。

* `endTime`

  省略可能で、デフォルトは最新の commitTime です。

`@incr` 関数には、[Spark の読み取りオプション](https://hudi.apache.org/docs/0.14.0/configurations#Read-Options)と互換性のあるオプションも追加できます。

`desc` で実行計画を確認すると、Doris が `@incr` を `VHUDI_SCAN_NODE` にプッシュダウンする述語に変換していることが分かります。

```text
|   0:VHUDI_SCAN_NODE(113)                                                                                            |
|      table: lineitem_mor                                                                                            |
|      predicates: (_hoodie_commit_time[#0] > '20240311151019723'), (_hoodie_commit_time[#0] <= '20240311151606605') |
|      inputSplitNum=1, totalFileSize=13099711, scanRanges=1              
```

## よくある質問

1. JNI を介して増分データを読み取る際に、Java SDK を使用したクエリがブロックされる

    `-Djol.skipHotspotSAAttach=true` を `JAVA_OPTS_FOR_JDK_17` または `JAVA_OPTS` に追加してください。これらは `be.conf` で設定します。

## 付録

### 変更履歴

| Doris のバージョン | サポートされる機能                               |
| ------------- | ---------------------------------------------- |
| 2.1.8/3.0.4   | Hudi の依存バージョンを 0.15 に更新。Hadoop Hudi JNI Scanner を追加。 |
