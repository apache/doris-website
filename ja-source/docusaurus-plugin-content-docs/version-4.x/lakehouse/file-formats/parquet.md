---
{
  "title": "Parquet | ファイル形式",
  "language": "ja",
  "description": "このドキュメントは、DorisにおけるParquetファイル形式の読み取りと書き込みのサポートについて紹介します。以下の機能に適用されます：",
  "sidebar_label": "Parquet"
}
---
# Parquet

このドキュメントでは、DorisにおけるParquetファイル形式の読み取りと書き込みのサポートについて説明します。以下の機能に適用されます：

* Catalogでのデータの読み取りと書き込み
* Table Valued Functionsを使用したデータの読み取り
* Broker Loadでのデータの読み取り
* Export時のデータの書き込み
* Outfileでのデータの書き込み

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

    Parquet Readerが遅延マテリアライゼーションを有効にするかどうかを制御します。デフォルトはtrueです。

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    HiveテーブルからParquetデータタイプを読み取る際、Dorisはデフォルトで、Hiveテーブルの列と同じ名前を持つParquetファイル内の列からデータを読み取ります。この変数が`false`に設定された場合、Dorisは列名に関係なく、Hiveテーブルの列順序に基づいてParquetファイルからデータを読み取ります。これはHiveの`parquet.column.index.access`変数と似ています。このパラメータはトップレベルの列名にのみ適用され、Struct内の列には効果がありません。

### BE設定

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet ReaderがPage Indexを使用してデータをフィルタリングするかどうかを決定します。これはデバッグ目的のみであり、ページインデックスが時々誤ったデータをフィルタリングする場合に備えています。デフォルト値はfalseです。

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Pageヘッダーを読み取る際に割り当てられる最大バッファサイズ。デフォルトは1Mです。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Groupを読み取る際に割り当てられる最大バッファサイズ。デフォルトは128Mです。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group内のColumnを読み取る際に割り当てられる最大バッファサイズ。デフォルトは8Mです。
