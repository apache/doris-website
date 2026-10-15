---
{
    "title": "Parquet | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Doris における Parquet ファイル形式の読み書きのサポートについて説明します。対象となる機能は次のとおりです。",
    "sidebar_label": "Parquet"
}
---

# Parquet

このドキュメントでは、Doris における Parquet ファイル形式の読み書きのサポートについて説明します。対象となる機能は次のとおりです。

* Catalog でのデータの読み書き。
* テーブル値関数を使用したデータの読み取り。
* Broker Load によるデータの読み取り。
* Export によるデータの書き込み。
* Outfile によるデータの書き込み。

## サポートされる圧縮形式

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

    Parquet Reader で遅延マテリアライゼーションを有効にするかどうかを制御します。デフォルトは true です。

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Hive テーブルから Parquet 形式のデータを読み取る際、Doris はデフォルトで、Hive テーブルのカラムと同じ名前を持つ Parquet ファイル内のカラムからデータを読み取ります。この変数を `false` に設定すると、カラム名に関係なく、Hive テーブルのカラム順に従って Parquet ファイルからデータを読み取ります。これは Hive の `parquet.column.index.access` 変数と同様です。このパラメータが適用されるのは最上位のカラム名のみで、Struct 内のカラムには効果がありません。

### BE の設定

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader が Page Index を使用してデータをフィルタリングするかどうかを指定します。Page Index がデータを誤ってフィルタリングする場合の調査にのみ使用する、デバッグ用の設定です。デフォルト値は false です。

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Page のヘッダーを読み取る際に割り当てるバッファーの最大サイズです。デフォルトは 1M です。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group を読み取る際に割り当てるバッファーの最大サイズです。デフォルトは 128M です。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group 内のカラムを読み取る際に割り当てるバッファーの最大サイズです。デフォルトは 8M です。
