---
{
    "title": "データレイクのクエリ最適化",
    "language": "ja",
    "description": "このドキュメントでは、レイク上のデータ（Hive、Iceberg、Paimon など）をクエリする際の最適化手法と戦略を主に紹介します。"
}
---

このドキュメントでは、レイク上のデータ（Hive、Iceberg、Paimon など）をクエリする際の最適化手法と戦略を主に紹介します。

## パーティションの枝刈り {#partition-pruning}

クエリでパーティション列の条件を指定すると、不要なパーティションを除外し、読み取るデータ量を減らせます。

`EXPLAIN <SQL>` を使用し、`XXX_SCAN_NODE` の `partition` セクションを確認すると、パーティションの枝刈りが有効かどうか、およびそのクエリでスキャンが必要なパーティション数を調べられます。

例：

```
0:VPAIMON_SCAN_NODE(88)
    table: paimon_ctl.db.table
    predicates: (user_id[#4] = 431304818)
    inputSplitNum=15775, totalFileSize=951754154566, scanRanges=15775
    partition=203/0
```

## ローカルデータキャッシュ {#local-data-cache}

Data Cache は、リモートストレージシステム（HDFS またはオブジェクトストレージ）から最近アクセスしたデータファイルをローカルディスクにキャッシュし、同じデータにアクセスする後続のクエリを高速化します。

キャッシュ機能はデフォルトで無効です。設定して有効にする方法については、[Data Cache](../data-cache.md) のドキュメントを参照してください。

バージョン 4.0.2 以降はキャッシュのウォームアップ機能に対応しており、データキャッシュを積極的に活用してクエリの性能をさらに向上できます。

## 外部スプリットの分散 {#external-split-spreading}

外部スプリットの分散に対応した開発ビルドでは、同じリモートファイルのスプリットに対する繰り返しのクエリを、対象となる複数の BE に分散できます。ある BE にクエリが集中する一方で、対象となるほかの BE に余力がある場合は、有効化を検討してください。

```sql
-- Enable automatic spreading for the current session.
SET external_scan_consistent_hash_spread_num = 0;
```

デフォルト値の `1` では、従来のスケジューリングが維持されます。分散処理では BE の現在の CPU 使用率は考慮されず、スループットが一定倍率で向上する保証もありません。また、キャッシュのコピーやウォームアップ時の読み取りが増える可能性があります。同じクエリ、キャッシュの状態、リソースを使ってスループットを比較してください。対象 BE 数の上限、データの局所性に関するルール、設定のリセットコマンドについては、[`external_scan_consistent_hash_spread_num`](../../sql-manual/basic-element/session-variables.md#external_scan_consistent_hash_spread_num) を参照してください。

## HDFS の読み取り最適化 {#hdfs-read-optimization}

[HDFS のドキュメント](../storages/hdfs.md)の **HDFS IO Optimization** セクションを参照してください。

## スプリット数の制限 {#split-count-limit}

外部テーブル（Hive、Iceberg、Paimon など）をクエリする際、Doris は並列処理のためにファイルを複数のスプリットに分割します。特に小さなファイルが大量にある場合など、生成されるスプリットが多すぎると、次の問題が生じる可能性があります。

1. メモリへの負荷：スプリットが多すぎると、FE のメモリを大量に消費します
2. OOM：スプリット数が過剰になると、OutOfMemoryError が発生する可能性があります
3. 性能の低下：大量のスプリットを管理すると、クエリプランニングの負荷が増えます

セッション変数 `max_file_split_num` を使用すると、テーブルスキャンごとに許容するスプリットの最大数を制限できます（4.0.4 以降で対応）。

- 型：`int`
- デフォルト値：`100000`
- 説明：非バッチモードで、スプリットが多すぎることによる OOM を防ぐため、テーブルスキャンごとに許容するスプリットの最大数を指定します。

使用例：

```sql
-- Set maximum split count to 50000
SET max_file_split_num = 50000;

-- Disable this limit (set to 0 or negative number)
SET max_file_split_num = 0;
```

この上限を設定すると、Doris はスプリット数が指定した上限を超えないよう、スプリットの最小サイズを動的に計算します。

## File Scanner V2 {#file-scanner-v2}

> バージョン 4.1.4 以降で対応しています。

File Scanner V2 は、外部テーブルのファイルをスキャンするための新しい実行エンジンです。Parquet、ORC、CSV、JSON 形式のほか、Hive、Iceberg、Paimon、Hudi などのテーブル形式の読み取りに対応します。従来のスキャナーと比べ、データの枝刈り、並列分割、メモリ使用量が改善されています。

セッション変数 `enable_file_scanner_v2` で制御します。

- 型：`boolean`
- デフォルト値：`true`（デフォルトで有効）
- 説明：有効にすると、`FileScanNode` は対応するクエリのスキャンに File Scanner V2 を使用します。JDBC Catalog や Iceberg のシステムテーブルなどでは、引き続き従来のスキャン経路を使用します。

クエリの問題が新しいスキャナーに関係していると思われる場合は、一時的に無効にして比較できます。

```sql
SET enable_file_scanner_v2 = false;
```

### データの枝刈りの動作 {#data-pruning-behavior}

File Scanner V2 は**安全なパーティションの枝刈りと式による ZoneMap の枝刈りを常に実行**し、以下のセッション変数の制御を受けなくなりました。これらの変数が影響するのは従来のスキャナーのみで、従来のスキャナーでは引き続き設定が適用されます。

| 変数 | デフォルト値 | 説明 |
| --- | --- | --- |
| `enable_runtime_filter_partition_prune` | `true` | Runtime Filter によるパーティションの枝刈りを有効にするかどうか。File Scanner V2 は安全なパーティションの枝刈りを常に有効にするため、`false` に設定しても影響しません |
| `enable_expr_zonemap_filter` | `true` | 式による ZoneMap フィルタリングを有効にするかどうか。File Scanner V2 は安全な式による ZoneMap フィルタリングを常に有効にします |

## Merge IO の最適化 {#merge-io-optimization}

HDFS やオブジェクトストレージなどのリモートストレージシステムに対し、Doris は Merge IO 技術によって IO アクセスを最適化します。Merge IO は、隣接する複数の小さな IO リクエストを大きな単一の IO リクエストにまとめることで、IOPS を削減し、IO スループットを向上させます。

たとえば、元のリクエストでファイル `file1` の範囲 [0, 10] と [20, 50] を読み取る必要がある場合：

```
Request Range: [0, 10], [20, 50]
```

Merge IO により、次の単一のリクエストにまとめられます。

```
Request Range: [0, 50]
```

この例では、二つの IO リクエストが一つにまとまりますが、追加のデータ（10～20 の間のデータ）も読み取ります。そのため、Merge IO は IO 操作の回数を減らせる一方、読み取り量の増幅を招く可能性があります。

Merge IO の詳細は Query Profile で確認できます。

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```

`RequestBytes` と `RequestIO` は、それぞれ元のリクエストのデータ量とリクエスト数を示します。`MergedBytes` と `MergedIO` は、それぞれ統合後のデータ量とリクエスト数を示します。

`MergedBytes` が `RequestBytes` を大幅に上回る場合は、読み取り量の増幅が深刻であることを示します。次のパラメータで調整できます。

- `merge_io_read_slice_size_bytes`

    セッション変数で、バージョン 3.1.3 以降で対応しています。デフォルト値は 8MB です。読み取り量の増幅が深刻な場合は、このパラメータを 64KB などに下げ、変更後の IO リクエストとクエリのレイテンシーが改善するか確認してください。

## Parquet Page Cache {#parquet-page-cache}

:::info
バージョン 4.1.0 以降で対応しています。
:::

Parquet Page Cache は、Parquet ファイル向けのページ単位のキャッシュ機構です。この機能は Doris の既存の Page Cache フレームワークと統合されており、展開済み（または圧縮済み）のデータページをメモリにキャッシュすることで、クエリ性能を大幅に向上させます。

### 主な機能 {#key-features}

1. **統合された Page Cache との連携**
    - Doris の内部テーブルと同じ基盤の `StoragePageCache` フレームワークを共有します
    - メモリプールとキャッシュの退避ポリシーを共有します
    - 既存のキャッシュ統計と RuntimeProfile を再利用し、性能を一元的に監視できます

2. **インテリジェントなキャッシュ戦略**
    - **圧縮率に応じた判断**：`parquet_page_cache_decompress_threshold` パラメータに基づき、圧縮済みデータと展開済みデータのどちらをキャッシュするかを自動的に決定します
    - **柔軟な保存方法**：`decompressed size / compressed size ≤ threshold` の場合は展開済みデータをキャッシュします。それ以外の場合は、`enable_parquet_cache_compressed_pages` に基づき、圧縮済みデータをキャッシュするかどうかを決定します
    - **キャッシュキーの設計**：`file_path::mtime::offset` をキャッシュキーに使用し、ファイルの変更後もキャッシュの整合性を確保します

### 設定パラメータ {#configuration-parameters}

以下は BE の設定パラメータです。

- `enable_parquet_page_cache`

    Parquet Page Cache 機能を有効にするかどうかを指定します。デフォルト値は `false` です。

- `parquet_page_cache_decompress_threshold`

    圧縮済みデータと展開済みデータのどちらをキャッシュするかを制御するしきい値です。デフォルト値は `1.5` です。`decompressed size / compressed size` の比率がこのしきい値以下の場合は、展開済みデータをキャッシュします。しきい値を超える場合は、`enable_parquet_cache_compressed_pages` の設定に基づき、圧縮済みデータをキャッシュするかどうかを決定します。

- `enable_parquet_cache_compressed_pages`

    圧縮率がしきい値を超えた場合に、圧縮済みデータページをキャッシュするかどうかを指定します。デフォルト値は `false` です。

### 性能の監視 {#performance-monitoring}

Parquet Page Cache の使用状況は Query Profile で確認できます。

```
ParquetPageCache:
    - PageCacheHitCount: 1024
    - PageCacheMissCount: 128
```

`PageCacheHitCount` はキャッシュヒット数、`PageCacheMissCount` はキャッシュミス数を示します。
