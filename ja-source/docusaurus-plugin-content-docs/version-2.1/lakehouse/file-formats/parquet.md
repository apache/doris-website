---
{
  "title": "Parquet | ファイル形式",
  "language": "ja",
  "description": "このドキュメントでは、DorisにおけるParquetファイル形式の読み取りおよび書き込みのサポートについて紹介します。以下の機能に適用されます：",
  "sidebar_label": "Parquet"
}
---
# Parquet

この文書では、DorisにおけるParquetファイル形式の読み書きサポートについて説明します。以下の機能に適用されます：

* カタログでのデータの読み書き
* table Valued Functionsを使用したデータの読み込み
* Broker Loadでのデータの読み込み
* Export時のデータの書き出し
* Outfileでのデータの書き出し

## サポートされている圧縮形式

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

## パラメータ

### セッション変数

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Parquet Readerが遅延実体化を有効にするかどうかを制御します。デフォルトはtrueです。

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    HiveテーブルからParquetデータ型を読み込む際、Dorisはデフォルトで、Hiveテーブルの列と同じ名前を持つParquetファイル内の列からデータを読み込みます。この変数が`false`に設定されている場合、Dorisは列名に関係なく、Hiveテーブルの列順序に基づいてParquetファイルからデータを読み込みます。これはHiveの`parquet.column.index.access`変数と似ています。このパラメータはトップレベルの列名にのみ適用され、Struct内の列には効果がありません。

### BE 設定

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet ReaderがPage Indexを使用してデータをフィルタリングするかどうかを決定します。これはデバッグ目的のみで、page indexが時々不正確なデータをフィルタリングする場合に使用します。デフォルト値はfalseです。

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Pageヘッダーを読み込む際に割り当てられる最大バッファサイズ。デフォルトは1Mです。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Groupを読み込む際に割り当てられる最大バッファサイズ。デフォルトは128Mです。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group内のColumnを読み込む際に割り当てられる最大バッファサイズ。デフォルトは8Mです。
