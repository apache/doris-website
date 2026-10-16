---
{
    "title": "データレイクのクエリ最適化",
    "language": "ja",
    "description": "このドキュメントでは、レイク上のデータ（Hive、Iceberg、Paimon など）をクエリする際の最適化方法と戦略を主に紹介します。"
}
---

このドキュメントでは、レイク上のデータ（Hive、Iceberg、Paimon など）をクエリする際の最適化方法と戦略を主に紹介します。

## パーティションプルーニング

クエリでパーティション列に条件を指定すると、不要なパーティションを除外し、読み取るデータ量を削減できます。

`EXPLAIN <SQL>` を使用し、`partition` 項目を `XXX_SCAN_NODE` の出力で確認すると、パーティションプルーニングが有効かどうか、およびそのクエリでスキャンする必要があるパーティション数を確認できます。

例：

```
0:VPAIMON_SCAN_NODE(88)
    table: paimon_ctl.db.table
    predicates: (user_id[#4] = 431304818)
    inputSplitNum=15775, totalFileSize=951754154566, scanRanges=15775
    partition=203/0
```

## ローカルデータキャッシュ

Data Cache は、リモートストレージシステム（HDFS またはオブジェクトストレージ）から最近アクセスしたデータファイルをローカルディスクにキャッシュし、同じデータにアクセスする後続のクエリを高速化します。

キャッシュ機能はデフォルトで無効です。設定して有効にする方法については、[Data Cache](../data-cache.md) のドキュメントを参照してください。

バージョン 4.0.2 以降ではキャッシュのウォームアップがサポートされており、データキャッシュを能動的に活用してクエリ性能をさらに向上させることができます。

## HDFS 読み取りの最適化

[HDFS ドキュメント](../storages/hdfs.md)の「HDFS IO の最適化」セクションを参照してください。

## スプリット数の制限

外部テーブル（Hive、Iceberg、Paimon など）をクエリするとき、Doris は並列処理のためにファイルを複数のスプリットに分割します。特に小さいファイルが大量にある場合など、スプリットが多すぎると、次の問題が発生する可能性があります。

1. メモリ負荷：スプリットが多すぎると、FE のメモリを大量に消費します
2. OOM：スプリット数が過剰になると、OutOfMemoryError が発生する可能性があります
3. 性能低下：スプリットの管理によってクエリプランの作成にかかるオーバーヘッドが増加します

セッション変数 `max_file_split_num` を使用すると、テーブルスキャンごとに許可するスプリット数の上限を設定できます（4.0.4 以降でサポート）。

- 型：`int`
- デフォルト：`100000`
- 説明：非バッチモードで、テーブルスキャンごとに許可するスプリット数の上限です。スプリット数が多すぎることによる OOM を防ぎます。

使用例：

```sql
-- Set maximum split count to 50000
SET max_file_split_num = 50000;

-- Disable this limit (set to 0 or negative number)
SET max_file_split_num = 0;
```

この上限を設定すると、Doris はスプリット数が指定された上限を超えないように、スプリットの最小サイズを動的に計算します。

## File Scanner V2

> バージョン 4.1.4 以降でサポートされます。

File Scanner V2 は、外部テーブルのファイルをスキャンする新しい実行エンジンです。Parquet、ORC、CSV、JSON 形式に加え、Hive、Iceberg、Paimon、Hudi などのテーブル形式の読み取りに対応します。従来のスキャナーと比べて、データの絞り込み、並列分割、メモリ使用量が改善されています。

セッション変数 `enable_file_scanner_v2` で制御します。

- 型：`boolean`
- デフォルト：`true`（デフォルトで有効）
- 説明：有効にすると、`FileScanNode` は対応するクエリスキャンに File Scanner V2 を使用します。JDBC Catalog や Iceberg のシステムテーブルなどでは、引き続き従来のスキャン経路が使用されます。

クエリの問題が新しいスキャナーに関連していると思われる場合は、一時的に無効にして比較できます。

```sql
SET enable_file_scanner_v2 = false;
```

### データの絞り込み動作

File Scanner V2 は**安全なパーティションプルーニングと式に基づく ZoneMap プルーニングを常に実行**し、以下のセッション変数による制御は受けません。これらの変数は従来のスキャナーにのみ影響し、従来のスキャナーでは引き続き適用されます。

| 変数 | デフォルト | 説明 |
| --- | --- | --- |
| `enable_runtime_filter_partition_prune` | `true` | Runtime Filter によるパーティションプルーニングを有効にするかどうか。File Scanner V2 は安全なパーティションプルーニングを常に有効にするため、`false` に設定しても影響しません |
| `enable_expr_zonemap_filter` | `true` | 式に基づく ZoneMap フィルタリングを有効にするかどうか。File Scanner V2 は安全な式に基づく ZoneMap フィルタリングを常に有効にします |

## Merge IO の最適化

HDFS やオブジェクトストレージなどのリモートストレージシステムに対して、Doris は Merge IO 技術で IO アクセスを最適化します。Merge IO は、隣接する複数の小さな IO リクエストを一つの大きな IO リクエストにまとめることで、IOPS を減らし、IO スループットを向上させます。

たとえば、元のリクエストでファイル `file1` の [0, 10] と [20, 50] の範囲を読み取る場合：

```
Request Range: [0, 10], [20, 50]
```

Merge IO によって、一つのリクエストに統合されます。

```
Request Range: [0, 50]
```

この例では、二つの IO リクエストが一つに統合されますが、追加のデータ（10～20 の範囲）も読み取ります。そのため、Merge IO は IO 操作の回数を減らす一方で、読み取り増幅を引き起こす可能性があります。

Merge IO の詳細は Query Profile で確認できます。

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```

`RequestBytes` と `RequestIO` は、元のリクエストのデータ量とリクエスト数を示します。`MergedBytes` と `MergedIO` は、統合後のデータ量とリクエスト数を示します。

`MergedBytes` が `RequestBytes` よりも大幅に大きい場合は、読み取り増幅が深刻であることを示します。次のパラメータで調整できます。

- `merge_io_read_slice_size_bytes`

    バージョン 3.1.3 以降でサポートされるセッション変数です。デフォルトは 8MB です。読み取り増幅が深刻な場合は、このパラメータを 64KB などに小さくし、変更後の IO リクエストとクエリのレイテンシーが改善するかどうかを確認できます。

## Parquet Page Cache

:::info
バージョン 4.1.0 以降でサポートされます。
:::

Parquet Page Cache は、Parquet ファイル向けのページ単位のキャッシュ機構です。この機能は Doris の既存の Page Cache フレームワークと統合されており、展開済み（または圧縮された）データページをメモリにキャッシュすることで、クエリ性能を大幅に向上させます。

### 主な機能

1. **統合された Page Cache**
    - Doris の内部テーブルで使用される `StoragePageCache` フレームワークを共有します
    - メモリプールと退避ポリシーを共有します
    - 既存のキャッシュ統計と RuntimeProfile を再利用し、性能を一元的に監視できます

2. **インテリジェントなキャッシュ戦略**
    - **圧縮率の考慮**：`parquet_page_cache_decompress_threshold` パラメータに基づいて、圧縮済みデータと展開済みデータのどちらをキャッシュするかを自動的に決定します
    - **柔軟な保存方法**：`decompressed size / compressed size ≤ threshold` の場合は展開済みデータをキャッシュします。それ以外の場合は、`enable_parquet_cache_compressed_pages` に基づいて圧縮済みデータをキャッシュするかどうかを決定します
    - **キャッシュキーの設計**：`file_path::mtime::offset` をキャッシュキーに使用し、ファイル変更後もキャッシュの整合性を保ちます

### 設定パラメータ

以下は BE の設定パラメータです。

- `enable_parquet_page_cache`

    Parquet Page Cache 機能を有効にするかどうかを指定します。デフォルトは `false` です。

- `parquet_page_cache_decompress_threshold`

    圧縮済みデータと展開済みデータのどちらをキャッシュするかを制御するしきい値です。デフォルトは `1.5` です。`decompressed size / compressed size` の比率がこのしきい値以下の場合は展開済みデータをキャッシュします。それ以外の場合は、`enable_parquet_cache_compressed_pages` の設定に基づいて圧縮済みデータをキャッシュするかどうかを決定します。

- `enable_parquet_cache_compressed_pages`

    圧縮率がしきい値を超えた場合に圧縮済みデータページをキャッシュするかどうかを指定します。デフォルトは `false` です。

### 性能の監視

Query Profile で Parquet Page Cache の使用状況を確認できます。

```
ParquetPageCache:
    - PageCacheHitCount: 1024
    - PageCacheMissCount: 128
```

`PageCacheHitCount` はキャッシュヒット数、`PageCacheMissCount` はキャッシュミス数を示します。
