---
{
  "title": "Data Lake Query最適化",
  "description": "このドキュメントでは、主にレイクデータ（Hive、Iceberg、Paimon など）をクエリするための最適化手法と戦略について紹介します。",
  "language": "ja"
}
---
この資料は主にレイクデータ（Hive、Iceberg、Paimon等）のクエリ最適化手法と戦略について紹介します。

## パーティション Pruning

クエリでパーティションカラムの条件を指定することで、不要なパーティションをpruneし、読み取る必要があるデータ量を削減できます。

`EXPLAIN <SQL>`を使用して`XXX_SCAN_NODE`の`partition`セクションを確認することで、partition pruningが有効かどうか、このクエリでスキャンする必要があるパーティション数を確認できます。

例えば：

```
0:VPAIMON_SCAN_NODE(88)
    table: paimon_ctl.db.table
    predicates: (user_id[#4] = 431304818)
    inputSplitNum=15775, totalFileSize=951754154566, scanRanges=15775
    partition=203/0
```
## Local Data Cache

Data Cacheは、リモートストレージシステム（HDFSまたはオブジェクトストレージ）から最近アクセスされたデータファイルをローカルディスクにキャッシュすることで、同じデータにアクセスする後続のクエリを高速化します。

キャッシュ機能はデフォルトで無効になっています。設定と有効化については、[Data Cache](../data-cache.md)のドキュメントを参照してください。

バージョン4.0.2以降、cache warmup機能がサポートされており、data cacheをより積極的に活用してクエリパフォーマンスを向上させることができます。

## HDFS Read 最適化

[HDFS Documentation](../storages/hdfs.md)の**HDFS IO 最適化**セクションを参照してください。

## Split Count Limit

外部Table（Hive、Iceberg、Paimonなど）をクエリする際、Dorisは並列処理のためにファイルを複数のsplitに分割します。一部のシナリオ、特に大量の小さなファイルがある場合、あまりにも多くのsplitが生成される可能性があり、以下の問題を引き起こします：

1. メモリ圧迫：あまりにも多くのsplitが大量のFEメモリを消費する
2. OOM問題：過度のsplit数がOutOfMemoryErrorを引き起こす可能性がある
3. パフォーマンス低下：あまりにも多くのsplitの管理がクエリ計画のオーバーヘッドを増加させる

Tableスキャンあたりで許可される最大split数を制限するために、`max_file_split_num`セッション変数を使用できます（4.0.4以降でサポート）：

- タイプ: `int`
- Default: `100000`
- デスクリプション: 非バッチモードにおいて、あまりにも多くのsplitによって引き起こされるOOMを防ぐため、Tableスキャンあたりで許可される最大split数。

使用例：

```sql
-- Set maximum split count to 50000
SET max_file_split_num = 50000;

-- Disable this limit (set to 0 or negative number)
SET max_file_split_num = 0;
```
この制限が設定されると、Dorisは分割数が指定された制限を超えないように最小分割サイズを動的に計算します。

## Merge IO最適化

HDFSやオブジェクトストレージなどのリモートストレージシステムに対して、DorisはMerge IO技術によってIOアクセスを最適化します。Merge IO技術は本質的に、隣接する複数の小さなIOリクエストを1つの大きなIOリクエストにマージし、IOPSを削減してIOスループットを向上させることができます。

例えば、元のリクエストがファイル`file1`の[0, 10]と[20, 50]の部分を読み取る必要がある場合：

```
Request Range: [0, 10], [20, 50]
```
Merge IOを通じて、1つのリクエストにマージされます：

```
Request Range: [0, 50]
```
この例では、2つのIOリクエストが1つにマージされていますが、追加データ（10-20間のデータ）も読み取ります。したがって、Merge IOはIO操作の回数を減らしますが、潜在的なリード増幅の問題をもたらす可能性があります。

Query Profileを通じて具体的なMerge IO情報を表示できます：

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```
`RequestBytes`と`RequestIO`は、元のリクエストのデータ量とリクエスト数を示します。`MergedBytes`と`MergedIO`は、マージ後のデータ量とリクエスト数を示します。

`MergedBytes`が`RequestBytes`よりもかなり大きいことがわかった場合、深刻な読み取り増幅が発生していることを示します。以下のパラメータを通じて調整できます：

- `merge_io_read_slice_size_bytes`

    セッション変数、バージョン3.1.3以降でサポート。デフォルトは8MBです。深刻な読み取り増幅が見つかった場合、このパラメータを64KBなどに削減し、変更されたIOリクエストとクエリレイテンシが改善されるかを観察できます。

## Parquet Page Cache

:::info
バージョン4.1.0以降でサポート。
:::

Parquet Page Cacheは、Parquetファイルのページレベルキャッシングメカニズムです。この機能はDorisの既存のPage Cacheフレームワークと統合され、展開された（または圧縮された）データページをメモリにキャッシュすることで、クエリパフォーマンスを大幅に向上させます。

### 主要機能

1. **統合Page Cache統合**
    - Doris内部Tableで使用される同じ基盤`StoragePageCache`フレームワークを共有
    - メモリプールと退避ポリシーを共有
    - 統一されたパフォーマンス監視のために既存のキャッシュ統計とRuntimeProfileを再利用

2. **インテリジェントキャッシング戦略**
    - **圧縮比認識**：`parquet_page_cache_decompress_threshold`パラメータに基づいて、圧縮データまたは展開データをキャッシュするかを自動的に決定
    - **柔軟なストレージアプローチ**：`展開サイズ / 圧縮サイズ ≤ 閾値`の場合は展開データをキャッシュし、そうでなければ`enable_parquet_cache_compressed_pages`に基づいて圧縮データをキャッシュするかを決定
    - **キャッシュキー設計**：ファイル変更後のキャッシュ一貫性を確保するために`file_path::mtime::offset`をキャッシュキーとして使用

### 設定パラメータ

以下はBE設定パラメータです：

- `enable_parquet_page_cache`

    Parquet Page Cache機能を有効にするかどうか。デフォルトは`false`です。

- `parquet_page_cache_decompress_threshold`

    圧縮データまたは展開データをキャッシュするかを制御する閾値。デフォルトは`1.5`です。`展開サイズ / 圧縮サイズ`の比率がこの閾値以下の場合、展開データがキャッシュされます。そうでなければ、`enable_parquet_cache_compressed_pages`設定に基づいて圧縮データをキャッシュするかを決定します。

- `enable_parquet_cache_compressed_pages`

    圧縮比が閾値を超える場合に圧縮データページをキャッシュするかどうか。デフォルトは`true`です。

### パフォーマンス監視

Query Profileを通じてParquet Page Cacheの使用状況を確認できます：

```
ParquetPageCache:
    - PageCacheHitCount: 1024
    - PageCacheMissCount: 128
```
`PageCacheHitCount`はキャッシュヒット数を示し、`PageCacheMissCount`はキャッシュミス数を示します。
