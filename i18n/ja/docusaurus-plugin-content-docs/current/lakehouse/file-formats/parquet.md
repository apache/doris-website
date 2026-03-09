---
{
  "title": "Parquet | ファイル形式",
  "language": "ja",
  "description": "この文書では、DorisにおけるParquetファイル形式の読み書きサポートについて紹介します。以下の機能に適用されます：",
  "sidebar_label": "Parquet"
}
---
# Parquet

このドキュメントでは、DorisでのParquetファイル形式の読み取りと書き込みのサポートについて紹介します。以下の機能に適用されます：

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

    HiveテーブルからParquetデータ型を読み取る際、Dorisはデフォルトで、Hiveテーブルのカラムと同じ名前を持つParquetファイル内のカラムからデータを読み取ります。この変数が`false`に設定されている場合、Dorisはカラム名に関係なく、Hiveテーブル内のカラムの順序に基づいてParquetファイルからデータを読み取ります。これはHiveの`parquet.column.index.access`変数と同様です。このパラメータはトップレベルのカラム名にのみ適用され、Struct内のカラムには効果がありません。

### BE設定

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet ReaderがPage Indexを使用してデータをフィルタリングするかどうかを決定します。これはデバッグ目的のみで、page indexが時々間違ったデータをフィルタリングする場合に使用します。デフォルト値はfalseです。

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Pageヘッダーを読み取る際に割り当てられる最大バッファサイズ。デフォルトは1Mです。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Groupを読み取る際に割り当てられる最大バッファサイズ。デフォルトは128Mです。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group内のColumnを読み取る際に割り当てられる最大バッファサイズ。デフォルトは8Mです。
