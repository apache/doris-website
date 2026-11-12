---
{
    "title": "Parquet | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Doris における Parquet ファイル形式の読み書きへの対応について説明します。対象となる機能は次のとおりです。",
    "sidebar_label": "Parquet"
}
---

# Parquet {#parquet}

このドキュメントでは、Doris における Parquet ファイル形式の読み書きへの対応について説明します。対象となる機能は次のとおりです。

* Catalog でのデータの読み書き。
* テーブル値関数を使用したデータの読み取り。
* Broker Load によるデータの読み取り。
* Export によるデータの書き込み。
* Outfile によるデータの書き込み。

## 対応する圧縮形式 {#supported-compression-formats}

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

## パラメータ {#parameters}

### タイムスタンプと日付の互換性（4.1.5 以降） {#timestamp-and-date-compatibility}

4.1.5 以降、Parquet の読み書きでは、時計上の日時と絶対時刻の区別が維持されます。タイムゾーンを持たない論理タイムスタンプは `DATETIME` に、`isAdjustedToUTC=true` の論理タイムスタンプは `TIMESTAMPTZ` にマッピングされます。Catalog の互換性プロパティを使用しても、ファイル TVF で `enable_mapping_timestamp_tz=false` を設定しても、後者を `DATETIME` にマッピングするようには戻せません。

Parquet INT96 にはタイムゾーンの注釈がないため、`DATETIME(6)` と推論されます。Hive Catalog とファイル TVF では、INT96 の書き込み元のタイムゾーンを指定するために、任意の `hive.parquet.time-zone` プロパティを使用できます。デフォルトは空文字列で、この場合は時計上の日時が維持されます。IANA タイムゾーン、または `-12:00` から `+14:00` までの UTC オフセットを使用してください。`UTC` と `GMT` は使用できますが、`CST` や `PRC` のような短い別名は使用できません。書き込み元のタイムゾーンが分かっている場合にのみ設定してください。たとえば、`"hive.parquet.time-zone" = "Asia/Shanghai"` と指定します。

4.1.5 以降、Outfile と Export では `enable_int96_timestamps` のデフォルトが `false` になり、論理 INT64 タイムスタンプが書き込まれます。INT96 を必要とする読み取り側のシステム向けの場合にのみ、`true` に設定してください。Hive テーブルへの書き込みでは別の互換性設定を使用します。詳しくは [Hive Catalog](../catalogs/hive-catalog.mdx) を参照してください。

旧版の Doris のエンコーディングで書き込まれ、`0000-01-01` から `0000-02-28` までの日付を含む DATE ファイルは、書き込み元に応じた移行が必要です。読み取り側をアップグレードするだけでは修復できません。詳しくは [年ゼロの DATE ファイルの移行](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration) を参照してください。

### セッション変数 {#session-variables}

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Parquet Reader で遅延マテリアライゼーションを有効にするかどうかを制御します。デフォルトは true です。

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Hive テーブルから Parquet のデータ型を読み取る際、Doris はデフォルトで、Hive テーブルの列と同じ名前を持つ Parquet ファイル内の列からデータを読み取ります。この変数を `false` に設定すると、列名に関係なく、Hive テーブルの列順に基づいて Parquet ファイルからデータを読み取ります。これは Hive の `parquet.column.index.access` 変数と同様です。このパラメータはトップレベルの列名にのみ適用され、Struct 内の列には効果がありません。

### BE 設定 {#be-configuration}

* `parquet_metadata_size_limit` (4.1.5 以降)

    ネイティブ Parquet V2 Reader における、シリアライズされたフッターのメタデータサイズの上限です。デフォルトは `268435456` バイト（256 MiB）で、`0` より大きい値を指定する必要があります。動的な更新に対応しています。この上限は Page Header の上限とは別です。超過すると `Parquet v2 footer size ... exceeds metadata limit ...` が返されます。詳しくは [BE 設定](../../admin-manual/config/be-config.md#parquet_metadata_size_limit) を参照してください。

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader が Page Index を使用してデータをフィルタリングするかどうかを指定します。Page Index が誤ったデータを除外する場合に備えたデバッグ用途の設定です。デフォルト値は false です。

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Page ヘッダーの読み取り時に割り当てるバッファの最大サイズです。デフォルトは 1M です。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group の読み取り時に割り当てるバッファの最大サイズです。デフォルトは 128M です。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group 内の列を読み取る際に割り当てるバッファの最大サイズです。デフォルトは 8M です。
