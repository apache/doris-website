---
{
    "title": "Parquet | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Doris における Parquet 形式ファイルの読み書きのサポートについて説明します。対象となる機能は次のとおりです。",
    "sidebar_label": "Parquet"
}
---

# Parquet

このドキュメントでは、Doris における Parquet 形式ファイルの読み書きのサポートについて説明します。対象となる機能は次のとおりです。

* Catalog でのデータの読み書き。
* テーブル値関数を使用したデータの読み取り。
* Broker Load によるデータの読み取り。
* Export 時のデータの書き込み。
* Outfile によるデータの書き込み。

## INT96 タイムスタンプのデコード

Parquet の `INT96` には、タイムゾーンの注釈なしで日付と時刻のフィールドが格納されます。そのため、FileScannerV2 はデフォルトで SQL セッションのタイムゾーンによる時刻の変換を行わず、ファイルに記録された日時をそのまま保持します。たとえば、生の `2021-01-01 10:11:00` は、`10:11:00` のまま `DATETIMEV2` にマッピングされます。この動作は Catalog のスキャン、テーブル値関数、Broker Load にも適用されます。

この動作が適用されるのは `INT96` のみです。タイムスタンプの論理型を持つ Parquet の `INT64` 値には、引き続きその論理型のセマンティクスが適用されます。従来の Hive ライターが既知のタイムゾーンに基づいて `INT96` の値を正規化していた場合は、`hive.parquet.time-zone` を [Hive Catalog](../catalogs/hive-catalog.mdx#timestamp-compatibility) で設定してください。外部ファイルを読み取るテーブル値関数でも、このプロパティを指定できます。その他の FileScannerV2 の読み取り経路では、`INT96` に記録された日時がそのまま保持されます。ただし Hudi は例外です。Hudi はネイティブスキャンと JNI スキャンの両方で従来からの SQL セッションのタイムゾーンに従う動作を維持し、`hive.parquet.time-zone` を無視します。

`INT96` 列を `TIMESTAMPTZ` にマッピングする場合、Doris は互換性のためのタイムゾーンを適用せず、UTC 上の時点を保持します。

## UUID 型のマッピング

読み取りでは、正規のビッグエンディアンのバイト順で格納され、UUID の注釈が付いた `FIXED_LEN_BYTE_ARRAY(16)` をサポートします。エンコーディングは plain と dictionary の両方に対応します。通常の Parquet TVF では、`enable_mapping_varbinary=false` の場合、標準形式の UUID 文字列として公開され、`CAST(value AS UUID)` で変換できます。`true` に設定すると、生の VARBINARY バイト列が保持されます。この場合は `CAST(HEX(value) AS UUID)` を使用してください。Iceberg Catalog では、STRING と VARBINARY のどちらにマッピングしても生のバイト列が保持されるため、HEX を使う方法を使用してください。

Doris の `UUID` 列を書き込むと、ARRAY、MAP、STRUCT にネストされた UUID 要素を含め、UUID 論理型の注釈が付いた `FIXED_LEN_BYTE_ARRAY(16)` が生成されます。このため、注釈を理解する他のエンジンでは、その値を UUID として復元できます。Doris 自身は、このようなファイルも前述の STRING / VARBINARY マッピングを通じて読み取ります。

OUTFILE と EXPORT における UUID の出力マッピングの全容については、[エクスポートファイルの列型マッピング](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files)を参照してください。

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

    Parquet Reader で遅延マテリアライズを有効にするかどうかを制御します。デフォルトは true です。

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Hive テーブルから Parquet データ型を読み取る場合、Doris はデフォルトで、Hive テーブルの列と同じ名前を持つ Parquet ファイル内の列からデータを読み取ります。この変数を `false` に設定すると、列名に関係なく、Hive テーブルの列順に基づいて Parquet ファイルからデータを読み取ります。これは Hive の `parquet.column.index.access` 変数に似ています。このパラメータは最上位の列名にのみ適用され、Struct 内の列には影響しません。

### BE の設定

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader が Page Index を使用してデータをフィルタリングするかどうかを決定します。Page Index によってデータが誤って除外される場合のデバッグ専用です。デフォルト値は false です。

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Page ヘッダーの読み取り時に割り当てられるバッファーの最大サイズです。デフォルトは 1M です。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group の読み取り時に割り当てられるバッファーの最大サイズです。デフォルトは 128M です。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group 内の Column の読み取り時に割り当てられるバッファーの最大サイズです。デフォルトは 8M です。
