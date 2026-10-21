---
{
    "title": "Parquet | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Doris における Parquet ファイル形式の読み書きのサポートについて説明します。対象となる機能は次のとおりです。",
    "sidebar_label": "Parquet"
}
---

# Parquet {#parquet}

このドキュメントでは、Doris における Parquet ファイル形式の読み書きのサポートについて説明します。対象となる機能は次のとおりです。

* Catalog でのデータの読み書き。
* Table Valued Functions を使用したデータの読み取り。
* Broker Load を使用したデータの読み取り。
* Export 時のデータの書き込み。
* Outfile を使用したデータの書き込み。

## INT96 タイムスタンプのデコード {#int96-timestamp-decoding}

Parquet `INT96` は、タイムゾーンの注釈を付けずに日付と時刻のフィールドを格納します。そのため、FileScannerV2 はデフォルトで、SQL セッションのタイムゾーンに合わせて時刻を変換せず、元のローカル時刻を保持します。たとえば、元の `2021-01-01 10:11:00` の時刻部分は `10:11:00` であり、`DATETIMEV2` にマッピングした後も変わりません。Catalog のスキャン、テーブル値関数、Broker Load でも同様です。

この動作が適用されるのは `INT96` だけです。タイムスタンプの論理型を持つ Parquet `INT64` 値には、引き続きその論理型の意味が適用されます。従来の Hive ライターが既知のタイムゾーンを使って `INT96` 値を正規化していた場合は、[Hive Catalog](../catalogs/hive-catalog.mdx#timestamp-compatibility) で `hive.parquet.time-zone` を設定してください。外部ファイルのテーブル値関数でも、このプロパティを指定できます。FileScannerV2 のその他の読み取り経路では、元の `INT96` のローカル時刻が保持されます。ただし Hudi は例外で、ネイティブスキャンと JNI スキャンの両方で従来の SQL セッションのタイムゾーンに基づく動作を意図的に維持し、`hive.parquet.time-zone` を無視します。

`INT96` 列を `TIMESTAMPTZ` にマッピングする場合、Doris は互換性のためのタイムゾーンを適用せず、UTC 上の時点を保持します。

## UUID 型のマッピング {#uuid-type-mapping}

読み取りでは、UUID の注釈が付いた `FIXED_LEN_BYTE_ARRAY(16)` を、プレーンエンコーディングと辞書エンコーディングのどちらでも、標準のビッグエンディアンのバイト順でサポートします。開発版では、通常の Parquet TVF と Iceberg Catalog は、従来のバイナリマッピングのオプションに関係なく、UUID の注釈が付いた列をネイティブの `UUID` に直接マッピングします。Doris 4.1.5 の Parquet TVF は、`enable_mapping_varbinary` に応じて、引き続き標準形式の UUID 文字列または VARBINARY を返します。このリリースでは、Iceberg UUID は `VARBINARY(16)` にマッピングされます。

ARRAY、MAP、STRUCT の中にネストされた UUID 要素を含め、Doris の `UUID` 列を書き込むと、UUID の論理型注釈が付いた `FIXED_LEN_BYTE_ARRAY(16)` が生成されます。そのため、この注釈を解釈できるほかのエンジンでも、値を UUID として復元できます。開発版では、ネストされた UUID 要素を含め、これらのファイルを読み取る際にネイティブの UUID に復元します。

OUTFILE と EXPORT における UUID 出力のマッピングについては、[エクスポートされるファイルの列型マッピング](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files) を参照してください。

## サポートされる圧縮形式 {#supported-compression-formats}

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

## パラメータ {#parameters}

### タイムスタンプと日付の互換性（4.1.5 以降） {#timestamp-and-date-compatibility}

4.1.5 以降、Parquet の読み書きでは、ローカル時刻と時点の区別が保持されます。タイムゾーンのない論理タイムスタンプは `DATETIME` に、`isAdjustedToUTC=true` の論理タイムスタンプは `TIMESTAMPTZ` にマッピングされます。Catalog の互換性プロパティを使用しても、ファイル TVF で `enable_mapping_timestamp_tz=false` を指定しても、後者を `DATETIME` にマッピングする動作には戻せません。

Parquet INT96 にはタイムゾーンの注釈がなく、`DATETIME(6)` と推定されます。Hive Catalog とファイル TVF では、INT96 の書き込み元のタイムゾーンを指定するために、オプションの `hive.parquet.time-zone` プロパティを使用できます。デフォルトは空文字列で、ローカル時刻をそのまま保持します。IANA タイムゾーン、または `-12:00` から `+14:00` までの UTC オフセットを指定してください。`UTC` と `GMT` は使用できますが、`CST` や `PRC` のような短い別名は使用できません。書き込み元のタイムゾーンが分かっている場合にのみ設定してください。たとえば、`"hive.parquet.time-zone" = "Asia/Shanghai"` と指定します。

4.1.5 以降、Outfile と Export では `enable_int96_timestamps` のデフォルトが `false` となり、論理 INT64 タイムスタンプを書き込みます。INT96 を必要とする読み取り側がある場合にのみ `true` に設定してください。Hive テーブルへの書き込みには別の互換性設定が使用されます。詳しくは [Hive Catalog](../catalogs/hive-catalog.mdx) を参照してください。

旧来の Doris エンコーディングで書き込まれ、`0000-01-01` から `0000-02-28` までの日付を含む DATE ファイルは、書き込み元に応じた移行が必要です。読み取り側をアップグレードするだけでは修復できません。[ゼロ年の DATE ファイルの移行](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration) を参照してください。

### セッション変数 {#session-variables}

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Parquet Reader で遅延実体化を有効にするかどうかを制御します。デフォルトは true です。

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Hive テーブルから Parquet データ型を読み取る際、Doris はデフォルトで、Hive テーブルの列と同じ名前の Parquet ファイル内の列からデータを読み取ります。この変数を `false` に設定すると、列名に関係なく、Hive テーブルの列順に基づいて Parquet ファイルからデータを読み取ります。これは Hive の `parquet.column.index.access` 変数に似ています。このパラメータが適用されるのは最上位の列名だけで、Struct 内の列には効果がありません。

### BE 設定 {#be-configuration}

* `parquet_metadata_size_limit` (4.1.5 以降)

    ネイティブの Parquet V2 Reader で、シリアライズされたフッターのメタデータに許容される最大サイズです。デフォルトは `268435456` バイト（256 MiB）で、`0` より大きい値を指定する必要があり、動的な更新に対応しています。これは Page Header のサイズ制限とは別です。制限を超えると、`Parquet v2 footer size ... exceeds metadata limit ...` が返されます。[BE 設定](../../admin-manual/config/be-config.md#parquet_metadata_size_limit) を参照してください。

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader が Page Index を使用してデータをフィルタリングするかどうかを指定します。これは、ページインデックスによって誤ったデータがフィルタリングされる場合のデバッグ専用です。デフォルト値は false です。

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Page ヘッダーの読み取り時に割り当てられるバッファーの最大サイズです。デフォルトは 1M です。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group の読み取り時に割り当てられるバッファーの最大サイズです。デフォルトは 128M です。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group 内の列を読み取る際に割り当てられるバッファーの最大サイズです。デフォルトは 8M です。
