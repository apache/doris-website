---
{
  "title": "データレイクQuery最適化",
  "language": "ja",
  "description": "この文書は主にレイクデータ（Hive、Iceberg、Paimon等）のクエリに関する最適化手法と戦略について紹介します。"
}
---
この文書では、主にレイクデータ（Hive、Iceberg、Paimon等）のクエリ最適化手法と戦略について説明します。

## Partition Pruning

クエリでパーティション列の条件を指定することで、不要なパーティションをpruningし、読み取る必要があるデータ量を削減できます。

`EXPLAIN <SQL>`を使用して、`XXX_SCAN_NODE`の`partition`セクションを確認することで、partition pruningが有効かどうか、およびこのクエリでスキャンする必要があるパーティション数を確認できます。

例：

```
0:VPAIMON_SCAN_NODE(88)
    table: paimon_ctl.db.table
    predicates: (user_id[#4] = 431304818)
    inputSplitNum=15775, totalFileSize=951754154566, scanRanges=15775
    partition=203/0
```
## ローカルデータキャッシュ

Data Cacheは、リモートストレージシステム（HDFSまたはオブジェクトストレージ）から最近アクセスされたデータファイルをローカルディスクにキャッシュすることで、同じデータにアクセスする後続のクエリを高速化します。

キャッシュ機能はデフォルトで無効になっています。設定と有効化については、[Data Cache](../data-cache.md)のドキュメントを参照してください。

バージョン4.0.2以降、キャッシュウォームアップ機能がサポートされており、データキャッシュをより積極的に活用してクエリパフォーマンスを向上させることができます。

## HDFS読み取り最適化

[HDFSドキュメント](../storages/hdfs.md)の**HDFS IO最適化**セクションを参照してください。

## Split数の制限

外部テーブル（Hive、Iceberg、Paimonなど）をクエリする際、Dorisは並列処理のためにファイルを複数のsplitに分割します。特に小さなファイルが大量にある場合など、一部のシナリオでは、あまりにも多くのsplitが生成され、以下の問題が発生する可能性があります：

1. メモリ圧迫：過度のsplitがFEメモリを大量消費
2. OOMの問題：過剰なsplit数がOutOfMemoryErrorを引き起こす可能性
3. パフォーマンス低下：過度のsplit管理によりクエリプランニングのオーバーヘッドが増加

`max_file_split_num`セッション変数を使用して、テーブルスキャンあたりの最大split数を制限できます（4.0.4以降でサポート）：

- 型：`int`
- デフォルト：`100000`
- 説明：非バッチモードにおいて、テーブルスキャンあたりで許可される最大split数。過度のsplitによるOOMを防ぐため。

使用例：

```sql
-- Set maximum split count to 50000
SET max_file_split_num = 50000;

-- Disable this limit (set to 0 or negative number)
SET max_file_split_num = 0;
```
この制限が設定されると、Dorisは分割数が指定された制限を超えないよう、最小分割サイズを動的に計算します。

## Merge IO最適化

HDFSやオブジェクトストレージのようなリモートストレージシステムに対して、DorisはMerge IO技術を通じてIOアクセスを最適化します。Merge IO技術は本質的に、隣接する複数の小さなIOリクエストを1つの大きなIOリクエストにマージするもので、これによりIOPSを削減し、IOスループットを向上させることができます。

例えば、元のリクエストでファイル`file1`の部分[0, 10]と[20, 50]を読み取る必要がある場合：

```
Request Range: [0, 10], [20, 50]
```
Merge IOを通じて、1つのリクエストにマージされます：

```
Request Range: [0, 50]
```
この例では、2つのIOリクエストが1つにマージされていますが、追加のデータ（10-20間のデータ）も読み取られています。そのため、Merge IOはIO操作の数を削減する一方で、潜在的な読み取り増幅の問題をもたらす可能性があります。

Query Profileを通じて具体的なMerge IO情報を確認できます：

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```
`RequestBytes` と `RequestIO` は元のリクエストのデータ量とリクエスト数を示します。`MergedBytes` と `MergedIO` はマージ後のデータ量とリクエスト数を示します。

`MergedBytes` が `RequestBytes` よりもはるかに大きい場合、深刻な読み取り増幅が発生していることを示します。以下のパラメータで調整できます：

- `merge_io_read_slice_size_bytes`

    セッション変数、バージョン3.1.3以降でサポート。デフォルトは8MBです。深刻な読み取り増幅が発生している場合、このパラメータを64KBなどに減らし、変更されたIOリクエストとクエリレイテンシが改善されるかを観察できます。

## Parquet Page Cache

:::info
バージョン4.1.0以降でサポート。
:::

Parquet Page CacheはParquetファイル用のページレベルキャッシュメカニズムです。この機能はDorisの既存のPage Cacheフレームワークと統合され、解凍された（または圧縮された）データページをメモリにキャッシュすることで、クエリパフォーマンスを大幅に向上させます。

### 主な機能

1. **統合Page Cache統合**
    - Doris内部テーブルで使用される同じ基盤の`StoragePageCache`フレームワークを共有
    - メモリプールと削除ポリシーを共有
    - 統合されたパフォーマンス監視のために既存のキャッシュ統計とRuntimeProfileを再利用

2. **インテリジェントキャッシュ戦略**
    - **圧縮率認識**: `parquet_page_cache_decompress_threshold`パラメータに基づいて、圧縮データまたは解凍データのどちらをキャッシュするかを自動的に決定
    - **柔軟なストレージアプローチ**: `解凍サイズ / 圧縮サイズ ≤ 閾値`の場合は解凍データをキャッシュ。そうでない場合は`enable_parquet_cache_compressed_pages`に基づいて圧縮データをキャッシュするかを決定
    - **キャッシュキー設計**: ファイル変更後のキャッシュ整合性を保証するために`file_path::mtime::offset`をキャッシュキーとして使用

### 設定パラメータ

以下はBE設定パラメータです：

- `enable_parquet_page_cache`

    Parquet Page Cache機能を有効にするかどうか。デフォルトは`false`です。

- `parquet_page_cache_decompress_threshold`

    圧縮データまたは解凍データのどちらをキャッシュするかを制御する閾値。デフォルトは`1.5`です。`解凍サイズ / 圧縮サイズ`の比率がこの閾値以下の場合、解凍データがキャッシュされます。そうでない場合は、`enable_parquet_cache_compressed_pages`設定に基づいて圧縮データをキャッシュするかを決定します。

- `enable_parquet_cache_compressed_pages`

    圧縮率が閾値を超えた場合に圧縮データページをキャッシュするかどうか。デフォルトは`false`です。

### パフォーマンス監視

Query ProfileでParquet Page Cacheの使用状況を確認できます：

```
ParquetPageCache:
    - PageCacheHitCount: 1024
    - PageCacheMissCount: 128
```
`PageCacheHitCount`はキャッシュヒット数を示し、`PageCacheMissCount`はキャッシュミス数を示します。
