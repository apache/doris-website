---
{
    "title": "データレイクのクエリ最適化",
    "language": "ja",
    "description": "Hive、Iceberg、Paimon などのデータレイク上のデータをクエリする際の最適化方法と戦略を説明します。"
}
---

このドキュメントでは、Hive、Iceberg、Paimon などのデータレイク上のデータをクエリする際の最適化方法と戦略を説明します。

## パーティションプルーニング

クエリでパーティション列の条件を指定すると、不要なパーティションを除外し、読み取るデータ量を減らせます。

`EXPLAIN <SQL>` を実行し、`partition` 項目を `XXX_SCAN_NODE` 内で確認すると、パーティションプルーニングが有効かどうか、およびそのクエリでスキャンする必要があるパーティションの数を調べられます。

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

キャッシュ機能はデフォルトで無効です。設定と有効化の方法は、[Data Cache](../data-cache.md) のドキュメントを参照してください。

バージョン 4.0.2 以降ではキャッシュのウォームアップ機能を利用でき、データキャッシュを事前に活用してクエリ性能をさらに向上させられます。

## HDFS 読み取りの最適化

[HDFS のドキュメント](../storages/hdfs.md) の **HDFS IO の最適化** セクションを参照してください。

## スプリット数の制限

外部テーブル（Hive、Iceberg、Paimon など）をクエリする際、Doris は並列処理のためにファイルを複数のスプリットに分割します。状況によっては、特に小さなファイルが大量にある場合、スプリットが多くなりすぎて次の問題が生じることがあります。

1. メモリ負荷：スプリットが多すぎると、FE のメモリを大量に消費します。
2. OOM：スプリット数が過剰になると、OutOfMemoryError が発生する可能性があります。
3. 性能低下：大量のスプリットを管理すると、クエリプランニングの負荷が増えます。

セッション変数 `max_file_split_num` を使用すると、テーブルスキャンごとに許可するスプリット数の上限を設定できます（バージョン 4.0.4 以降でサポート）。

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

この上限を設定すると、Doris はスプリット数が指定値を超えないように、最小スプリットサイズを動的に計算します。

## File Scanner V2

> バージョン 4.1.4 以降でサポートされています。

File Scanner V2 は、外部テーブルのファイルをスキャンする新しい実行エンジンです。Parquet、ORC、CSV、JSON 形式に加え、Hive、Iceberg、Paimon、Hudi などのテーブル形式の読み取りに対応します。従来のスキャナーと比べて、データのプルーニング、並列スプリット処理、メモリ使用量が改善されています。

セッション変数 `enable_file_scanner_v2` で制御します。

- 型：`boolean`
- デフォルト：`true`（デフォルトで有効）
- 説明：有効にすると、`FileScanNode` は対応するクエリスキャンに File Scanner V2 を使用します。JDBC Catalog や Iceberg のシステムテーブルなどは、引き続き従来のスキャン経路を使用します。

クエリの問題が新しいスキャナーに関係していると思われる場合は、一時的に無効にして比較できます。

```sql
SET enable_file_scanner_v2 = false;
```

### データプルーニングの動作

File Scanner V2 は、**安全なパーティションプルーニングと式に基づく ZoneMap プルーニングを常に実行します**。以下のセッション変数では制御されません。これらの変数が影響するのは従来のスキャナーだけで、従来のスキャナーでは引き続き設定に従います。

| 変数 | デフォルト | 説明 |
| --- | --- | --- |
| `enable_runtime_filter_partition_prune` | `true` | Runtime Filter によるパーティションプルーニングを有効にするかどうか。File Scanner V2 は安全なパーティションプルーニングを常に有効にするため、`false` に設定してもこのスキャナーには影響しません。 |
| `enable_expr_zonemap_filter` | `false` | 式に基づく ZoneMap フィルタリングを有効にするかどうか。File Scanner V2 は安全な式に基づく ZoneMap フィルタリングを常に有効にします。 |

### BE 側での細粒度スプリットの再分割

> バージョン 4.1.4 以降でサポートされています。

File Scanner V2 が有効な場合、FE はファイルを粗い粒度で分割し、BE は各スプリットを Parquet の Row Group または ORC の Stripe に基づいてさらに細かく分割して、同じスキャンインスタンス内で並列実行します。隣接する Row Group または Stripe は、対象サイズに近づくまで結合されます。

| セッション変数 | デフォルト | 説明 |
| --- | --- | --- |
| `file_split_size_on_fe` | `536870912` (512MB) | BE 側での再分割が適用される場合に、FE が生成する粗い粒度のファイルスプリットの目標サイズ（バイト単位）。 |
| `file_split_size_on_be` | `67108864` (64MB) | BE が生成する細かい粒度のファイルスプリットの目標サイズ（バイト単位）。 |

適用範囲：Hive、Iceberg、ネイティブの Paimon RawFile、およびファイルベースのテーブル値関数が生成するネイティブの Parquet / ORC スプリット。File Scanner V2 が有効で、生成されたタスクを少なくとも二つのスキャナーが処理できることが条件です。

以下の場合は適用されず、`file_split_size`、`max_initial_file_split_size`、`max_file_split_size`、`max_file_split_num` で制御される従来の FE 分割方式に戻ります。

- Parquet / ORC 以外の形式。
- File Scanner V2 が無効の場合。
- `max_file_scanners_concurrency = 1` の場合、または小さい LIMIT のクエリに対して BE がスキャナーを一つしか使用しない場合。
- トランザクション対応（Full ACID）の Hive テーブルのスキャン。
- テーブルレベルのメタデータ COUNT によって最適化されるスキャン。
- 削除ファイルを伴う Iceberg データファイル。
- シリアライズされた Paimon の論理スプリットまたは JNI スプリット。
- `file_split_size_on_fe` または `file_split_size_on_be` に正でない値が設定されている場合。

:::tip 注
Row Group または Stripe は分割できない最小単位です。そのため、単一のスプリットの実際のサイズが `file_split_size_on_be` の目標値を超えることがあります。
:::

## 外部スキャンタスクの再利用

> バージョン 4.1.4 以降でサポートされています。

一つの SQL 文で同じ外部テーブルを複数回参照する場合（自己結合や、同じ CTE を複数回参照する場合など）、同等のスキャンノードは生成済みのスプリット群を再利用できます。これにより、FE がスプリットのプランニングを繰り返す必要がなくなります。

セッション変数 `enable_external_scan_task_reuse` で制御します。

- 型：`boolean`
- デフォルト：`true`
- 説明：同じ SQL 文内で、同一の外部テーブルスキャンノードが生成したスプリットを再利用するかどうか。Hive、Hudi、Iceberg、Paimon に適用されます。

## Merge IO の最適化

HDFS やオブジェクトストレージなどのリモートストレージシステムに対し、Doris は Merge IO によって IO アクセスを最適化します。Merge IO は、隣接する複数の小さな IO リクエストを一つの大きなリクエストにまとめ、IOPS を減らして IO スループットを高めます。

たとえば、元のリクエストでファイル `file1` の [0, 10] と [20, 50] の範囲を読み取る場合：

```
Request Range: [0, 10], [20, 50]
```

Merge IO によって、これらは一つのリクエストにまとめられます。

```
Request Range: [0, 50]
```

この例では、二つの IO リクエストが一つになりますが、追加のデータ（10～20 の間）も読み取ります。そのため、Merge IO は IO 操作の回数を減らす一方で、読み取り量が増幅する可能性があります。

Query Profile で Merge IO の詳細を確認できます。

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```

`RequestBytes` と `RequestIO` は、元のリクエストにおけるデータ量とリクエスト数を示します。`MergedBytes` と `MergedIO` は、結合後のデータ量とリクエスト数を示します。

`MergedBytes` が `RequestBytes` より大幅に大きい場合、読み取り量が大きく増幅しています。次のパラメータで調整できます。

- `merge_io_read_slice_size_bytes`

    バージョン 3.1.3 以降でサポートされるセッション変数です。デフォルトは 8MB です。読み取り量が大きく増幅している場合は、この値を 64KB などに小さくし、変更後の IO リクエストとクエリのレイテンシーが改善するか確認してください。

## Parquet Page Cache

:::info
バージョン 4.1.0 以降でサポートされています。
:::

Parquet Page Cache は、Parquet ファイル向けのページ単位のキャッシュ機構です。Doris の既存の Page Cache フレームワークと統合されており、展開後（または圧縮されたまま）のデータページをメモリにキャッシュすることで、クエリ性能を大幅に向上させます。

### 主な機能

1. **共通の Page Cache との統合**
    - Doris の内部テーブルと同じ `StoragePageCache` フレームワークを共有します。
    - メモリプールと退避ポリシーを共有します。
    - 既存のキャッシュ統計と RuntimeProfile を再利用し、性能を一元的に監視できます。

2. **適応的なキャッシュ戦略**
    - **圧縮率を考慮**：`parquet_page_cache_decompress_threshold` パラメータに基づき、圧縮データと展開済みデータのどちらをキャッシュするかを自動的に判断します。
    - **柔軟な保存方法**：`decompressed size / compressed size ≤ threshold` の場合は展開済みデータをキャッシュします。それ以外の場合は、`enable_parquet_cache_compressed_pages` に基づいて圧縮データをキャッシュするか判断します。
    - **キャッシュキーの設計**：`file_path::mtime::offset` をキャッシュキーとして使用し、ファイル変更後もキャッシュの整合性を保ちます。

### 設定パラメータ

以下は BE の設定パラメータです。

- `enable_parquet_page_cache`

    Parquet Page Cache 機能を有効にするかどうかを指定します。デフォルトは `false` です。

- `parquet_page_cache_decompress_threshold`

    圧縮データと展開済みデータのどちらをキャッシュするかを制御するしきい値です。デフォルトは `1.5` です。`decompressed size / compressed size` の比率がこのしきい値以下の場合は展開済みデータをキャッシュします。それ以外の場合は、`enable_parquet_cache_compressed_pages` の設定に基づいて圧縮データをキャッシュするか判断します。

- `enable_parquet_cache_compressed_pages`

    圧縮率がしきい値を超えた場合に、圧縮されたデータページをキャッシュするかどうかを指定します。デフォルトは `false` です。

### 性能の監視

Query Profile で Parquet Page Cache の使用状況を確認できます。

```
ParquetPageCache:
    - PageCacheHitCount: 1024
    - PageCacheMissCount: 128
```

`PageCacheHitCount` はキャッシュヒット数、`PageCacheMissCount` はキャッシュミス数を示します。
