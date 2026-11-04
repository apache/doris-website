---
{
    "title": "Parquet | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Doris における Parquet ファイル形式の読み取りと書き込みのサポートについて説明します。対象となる機能は次のとおりです。",
    "sidebar_label": "Parquet"
}
---

# Parquet {#parquet}

このドキュメントでは、Doris における Parquet ファイル形式の読み取りと書き込みのサポートについて説明します。対象となる機能は次のとおりです。

* Catalog でのデータの読み取りと書き込み。
* Table Valued Functions を使用したデータの読み取り。
* Broker Load によるデータの読み取り。
* Export 中のデータの書き込み。
* Outfile によるデータの書き込み。

## INT96 タイムスタンプのデコード {#int96-timestamp-decoding}

Parquet `INT96` は、タイムゾーン注釈なしで日付と時刻のフィールドを格納します。そのため FileScannerV2 はデフォルトで、SQL セッションのタイムゾーンによるシフトを行わず、生のウォールクロック値を保持します。たとえば、生の `2021-01-01 10:11:00` は `DATETIMEV2` にマッピングされても `10:11:00` のままで、Catalog スキャン、table-valued functions、Broker Load でも同様です。

この動作は `INT96` にのみ適用されます。タイムスタンプ論理型を持つ Parquet `INT64` 値は、引き続き論理型のセマンティクスに従います。旧式の Hive writer が既知のタイムゾーンで `INT96` 値を正規化していた場合は、[Hive Catalog](../catalogs/hive-catalog.mdx#timestamp-compatibility) で `hive.parquet.time-zone` を設定してください。外部ファイルの table-valued functions もこのプロパティを受け付けます。その他の FileScannerV2 エントリポイントは生の `INT96` ウォールクロック値を保持します。ただし Hudi は例外で、native スキャンと JNI スキャンの両方で以前からの SQL セッションタイムゾーン動作を意図的に維持し、`hive.parquet.time-zone` を無視します。

`INT96` 列を `TIMESTAMPTZ` にマッピングする場合、Doris は互換性タイムゾーンを適用せず UTC の時点を保持します。

## UUID 型マッピング {#uuid-type-mapping}

読み取りでは、標準のビッグエンディアンバイト順で plain エンコーディングまたは dictionary エンコーディングを使用する UUID 注釈付き `FIXED_LEN_BYTE_ARRAY(16)` をサポートします。dev バージョンでは、通常の Parquet TVF と Iceberg Catalog は、旧来のバイナリマッピングオプションに依存せず、UUID 注釈付き列を直接 native `UUID` にマッピングします。Doris 4.1.5 の Parquet TVF は、引き続き `enable_mapping_varbinary` に従って標準 UUID 文字列または VARBINARY を返します。そのリリースでは、Iceberg の UUID は `VARBINARY(16)` にマッピングされます。

Doris の `UUID` 列を書き込むと、ARRAY、MAP、STRUCT にネストされた UUID 要素も含め、UUID 論理注釈付きの `FIXED_LEN_BYTE_ARRAY(16)` が生成されます。そのため、この注釈を理解する他のエンジンは値を UUID として復元できます。dev バージョンでは、ネストされた UUID 要素を含め、これらのファイルの読み取り時に native UUID が復元されます。

OUTFILE および EXPORT における UUID 出力の完全なマッピングについては、[エクスポートファイルの列型マッピング](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files) を参照してください。

## サポートされる圧縮形式 {#supported-compression-formats}

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

## ページインデックスの書き込み（Dev バージョン） {#writing-page-indexes-dev-version}

Doris は、OUTFILE または EXPORT でエクスポートするとき、または Parquet として保存されている Hive および Iceberg テーブルに挿入するときに、Parquet `ColumnIndex` および `OffsetIndex` メタデータをオプションで書き込めます。これらのインデックスをサポートする Reader は、値によって候補ページを特定し、列間で行の位置を揃えて保持できます。既存のファイルは変更されません。

書き込みステートメントの前に、次のセッション変数を設定します。これらは Parquet 出力にのみ適用され、読み取り側のページインデックスフィルタリングは有効にしません。

| 変数 | 型 | デフォルト | 動作 |
| --- | --- | --- | --- |
| `enable_parquet_write_page_index` | Boolean | `true` | 新しい Parquet ファイルにページインデックスを書き込みます。`ColumnIndex` は列で統計情報を利用できることを前提とし、`OffsetIndex` はデータページの位置と行位置を記録します。 |
| `parquet_write_data_page_size` | Integer、バイト | `1048576`（1 MiB） | 非圧縮データページの目標サイズで、範囲は `1` から `2147483647` です。インデックス書き込みの有効・無効にかかわらず適用されます。Row Group のサイズや dictionary ページのサイズは設定しません。 |

ページサイズは目標値であり、単一の値または書き込みバッチによって超えることがあります。Hive/Iceberg の `lz4` 出力で使用される Hadoop フレーム LZ4 では、Doris は Hadoop Reader との互換性を維持するため、この目標値を `131072` バイト（128 KiB）に制限します。Raw LZ4 出力には、このコーデック固有の上限は適用されません。

たとえば、[OUTFILE](../../data-operate/export/outfile.md) の説明どおりに書き込み可能な S3 バケットと認証情報を準備した後、インデックス付きで 256 KiB のページ目標値を指定してクエリ結果をエクスポートします。ストレージのプレースホルダーは独自の構成に置き換えてください。

```sql
SET enable_parquet_write_page_index = true;
SET parquet_write_data_page_size = 262144;

SELECT 1 AS id, 'example' AS label
INTO OUTFILE 's3://example-bucket/export/result_'
FORMAT AS PARQUET
PROPERTIES (
    "s3.endpoint" = "https://s3.example.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<access_key>",
    "s3.secret_key" = "<secret_key>"
);
```

生成されたファイルには、条件を満たす列のページインデックスメタデータが含まれます。Hive または Iceberg の場合は、`INSERT INTO` または `INSERT OVERWRITE` の前にセッションで同じ変数を設定します。宛先テーブルは、あらかじめ Parquet を書き込むように構成しておく必要があります。EXPORT の場合は、ジョブを送信する前に設定します。

インデックス書き込みのデフォルトは `true` で、既存の dev writer の動作を維持します。以降の出力にページインデックスを含めない場合は、書き込み前に次のオプションを設定します。

```sql
SET enable_parquet_write_page_index = false;
```

現在のセッションでデフォルト値に戻すには、次のようにします。

```sql
SET enable_parquet_write_page_index = true;
SET parquet_write_data_page_size = 1048576;
```

インデックスはメタデータと書き込み側の処理負荷を増加させます。ページを小さくすると、特に値がクラスタ化されている場合に、選択性の高い読み取りを改善できる可能性がありますが、インデックスエントリとページヘッダーも増加します。効果は使用するエンジンとデータ分布に依存するため、インデックスを有効にしてもクエリが高速化されるとは限りません。読み取り側は、オプションのインデックスを使用せずにファイルを読み取ることもできます。これらの設定は、Parquet 形式のバージョンやデータページのバージョンを変更しません。

## パラメータ {#parameters}

### タイムスタンプと日付の互換性（4.1.5 以降） {#timestamp-and-date-compatibility}

4.1.5 以降、Parquet の読み取りと書き込みでは、ウォールクロック時刻と時点の違いが保持されます。タイムゾーンのない論理タイムスタンプは `DATETIME` に、`isAdjustedToUTC=true` の論理タイムスタンプは `TIMESTAMPTZ` にマッピングされます。Catalog の互換性プロパティも、ファイル TVF の `enable_mapping_timestamp_tz=false` も、後者を `DATETIME` マッピングに戻すことはできません。

Parquet INT96 にはタイムゾーン注釈がなく、`DATETIME(6)` として推論されます。Hive Catalog とファイル TVF は、INT96 の書き込み元のタイムゾーンを指定するためのオプションプロパティ `hive.parquet.time-zone` を受け付けます。デフォルトは空文字列で、ウォールクロック時刻を保持します。IANA タイムゾーン、または `-12:00` から `+14:00` までの UTC オフセットを使用してください。`UTC` と `GMT` は受け付けられますが、`CST` や `PRC` などの短い別名は拒否されます。書き込み元のタイムゾーンが判明している場合にのみ設定してください。たとえば、`"hive.parquet.time-zone" = "Asia/Shanghai"` のように設定します。

4.1.5 以降、Outfile と Export では `enable_int96_timestamps` のデフォルトが `false` で、論理 INT64 タイムスタンプが書き込まれます。INT96 を必要とするコンシューマーの場合にのみ `true` に設定してください。Hive テーブルへの書き込みでは互換性の選択が異なります。[Hive Catalog](../catalogs/hive-catalog.mdx) を参照してください。

旧 Doris エンコーディングで書き込まれ、`0000-01-01` から `0000-02-28` を含む DATE ファイルは、書き込み元に応じた移行が必要です。Reader だけをアップグレードしても修復できません。[年ゼロ DATE ファイルの移行](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration) を参照してください。

### セッション変数 {#session-variables}

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Parquet Reader が lazy materialization を有効にするかどうかを制御します。デフォルトは true です。

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Doris は、Hive テーブルから Parquet データ型を読み取るとき、デフォルトでは Hive テーブルの列と同じ名前を持つ Parquet ファイル内の列からデータを読み取ります。この変数を `false` に設定すると、Doris は列名に関係なく、Hive テーブル内の列順序に基づいて Parquet ファイルからデータを読み取ります。これは Hive の `parquet.column.index.access` 変数に似ています。このパラメータはトップレベルの列名にのみ適用され、Struct 内の列には効果がありません。

### BE 設定 {#be-configuration}

* `parquet_metadata_size_limit`（4.1.5 以降）

    native Parquet V2 Reader のシリアライズ済み footer メタデータの最大サイズです。デフォルトは `268435456` バイト（256 MiB）で、`0` より大きくする必要があり、動的更新をサポートします。これは Page Header の制限とは別です。超過すると `Parquet v2 footer size ... exceeds metadata limit ...` が返されます。[BE 設定](../../admin-manual/config/be-config.md#parquet_metadata_size_limit) を参照してください。

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader が Page Index を使用してデータをフィルタリングするかどうかを決定します。これは、ページインデックスが誤ったデータをフィルタリングすることがある場合のデバッグ専用です。デフォルト値は false です。

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Page header の読み取り時に割り当てられる最大バッファサイズです。デフォルトは 1M です。

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group の読み取り時に割り当てられる最大バッファサイズです。デフォルトは 128M です。

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group 内の Column の読み取り時に割り当てられる最大バッファサイズです。デフォルトは 8M です。
