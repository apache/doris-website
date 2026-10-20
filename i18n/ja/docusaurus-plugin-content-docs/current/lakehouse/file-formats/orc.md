---
{
    "title": "ORC | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Doris における ORC ファイル形式の読み書きのサポートについて説明します。対象となる機能は次のとおりです。",
    "sidebar_label": "ORC"
}
---

# ORC {#orc}

このドキュメントでは、Doris における ORC ファイル形式の読み書きのサポートについて説明します。対象となる機能は次のとおりです。

* Catalog でのデータの読み書き。
* Table Valued Functions を使用したデータの読み取り。
* Broker Load によるデータの読み取り。
* Export 時のデータの書き込み。
* Outfile によるデータの書き込み。

## タイムスタンプの小数秒精度 {#timestamp-fractional-second-precision}

ORC のタイムスタンプはナノ秒まで格納できますが、Doris の `DATETIMEV2` と `TIMESTAMPTZ` がサポートするのはマイクロ秒までです。FileScannerV2 は、Catalog のスキャン、Table Valued Functions、Broker Load で、ORC の小数秒を half up 方式で最も近いマイクロ秒に丸めます。

| ORC の値 | Doris の値 |
|---|---|
| `2024-01-01 00:00:00.123456499` | `2024-01-01 00:00:00.123456` |
| `2024-01-01 00:00:00.123456500` | `2024-01-01 00:00:00.123457` |
| `2024-01-01 00:00:00.999999500` | `2024-01-01 00:00:01.000000` |

`DATETIMEV2` と `TIMESTAMPTZ` のどちらへのマッピングにも、次の秒への繰り上がりを含め、この規則が適用されます。行のデコード、統計情報の変換、述語のプッシュダウンでも同じ境界を使用します。ORC の統計情報に、丸め後の境界を正確に表すだけの精度がない場合、Doris はプルーニングの境界を安全側に広げます。`!=` などのタイムスタンプ述語を安全に表せない場合、Doris はその検索条件を使用せず、デコードした行に対して述語を評価します。その述語によるプルーニングは減る可能性がありますが、有効な行が誤って除外されることを防げます。

## UUID 型のマッピング {#uuid-type-mapping}

Doris は `UUID` カラムを、ARRAY、MAP、STRUCT にネストされた UUID 要素も含め、正規の 16 バイトのビッグエンディアン値を保持する `BINARY` として書き込み、ネイティブ UUID であることを示す `doris.logical_type=uuid` 属性を付加します。ORC には標準の UUID 型がないため、Doris 以外のツールからは、UUID としての意味を持たない通常のバイナリカラムに見えます。OUTFILE で ORC の `schema` プロパティを明示的に指定する場合、UUID カラムは `binary` として宣言してください。`string` などの別の型は拒否されます。

`doris.logical_type=uuid` 属性を持つ `BINARY` カラムを読み取ると、ネストされた要素を含め、どちらのファイルリーダーでもネイティブ UUID 型が復元されます。そのため、Table Valued Function はこれらのカラムの型を `uuid`、`array<uuid>`、`struct<k:uuid>` と報告します。開発版では、この属性のない `BINARY` は `VARBINARY` にマッピングされ、`STRING` は `STRING` のままです。

OUTFILE と EXPORT における UUID の出力マッピングの全体については、[エクスポートされるファイルのカラム型マッピング](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files)を参照してください。

## サポートされる圧縮形式 {#supported-compression-formats}

* uncompressed
* snappy
* lz4
* zstd
* lzo
* zlib

## パラメータ {#parameters}

### タイムスタンプと日付の互換性（4.1.5 以降） {#timestamp-and-date-compatibility-since-415}

4.1.5 以降、ORC の `TIMESTAMP` はタイムゾーンを持たない壁時計時刻を表し、`TIMESTAMP_INSTANT` は特定の瞬間を表して `TIMESTAMPTZ` にマッピングされます。読み取り時には、ナノ秒をマイクロ秒に丸めます。範囲外の値や無効なナノ秒値ではエラーが発生します。

ORC への書き込み時、Unix エポックの直前にある負の小数秒付きタイムスタンプの一部は、データを失わずに表現できません。Doris は `ORC cannot represent pre-epoch timestamp fractions in [-0.999, 0) seconds without data loss; use Parquet for these values` を返します。これらの値を含むデータには Parquet を使用してください。

古い Doris のエンコーディングで書き込まれ、`0000-01-01` から `0000-02-28` までの日付を含む DATE ファイルは、明示的な移行が必要です。[西暦ゼロ年の DATE ファイルの移行](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)を参照してください。

### セッション変数 {#session-variables}

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    ORC Reader で遅延マテリアライゼーションを有効にするかどうかを制御します。デフォルトは true です。

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    Hive テーブルから ORC データ型を読み取る際、Doris はデフォルトで、Hive テーブルのカラムと同じ名前の ORC ファイル内のカラムからデータを読み取ります。この変数を `false` に設定すると、カラム名に関係なく、Hive テーブルのカラム順序に基づいて ORC ファイルからデータを読み取ります。これは Hive の `orc.force.positional.evolution` 変数に似ています。このパラメータが適用されるのは最上位のカラム名だけで、Struct 内のカラムには効果がありません。

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    ORC ファイルでは、Stripe のバイトサイズが `orc_tiny_stripe_threshold` より小さい場合、Tiny Stripe とみなされます。Tiny Stripe が複数連続する場合は、複数の Tiny Stripe を一度に読み取って IO 操作の回数を減らす読み取り最適化が行われます。この最適化を使用しない場合は、この値を 0 に設定できます。デフォルトは 8M です。

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe の読み取り最適化を使用すると、複数の Tiny Stripe が単一の IO 操作にまとめられます。このパラメータは、各 IO リクエストの最大バイト数を制御します。この値を `orc_tiny_stripe_threshold` より小さく設定しないでください。デフォルトは 8M です。

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe の読み取り最適化では、読み取る Tiny Stripe 同士が連続していない場合があります。Tiny Stripe 間の距離がこのパラメータを超えると、単一の IO 操作にはまとめられません。デフォルトは 1M です。

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    Tiny Stripe の最適化では、ORC ファイルに多数のカラムがあり、クエリで使用するカラムが少ない場合、読み取り量が大幅に増える可能性があります。Stripe 全体に対する実際に読み取るバイト数の割合がこのパラメータを超えると、Tiny Stripe の読み取り最適化が使用されます。デフォルト値は 0.4、最小値は 0 です。

* `check_orc_init_sargs_success` (3.1.0+)

    ORC の述語プッシュダウンが成功したかどうかを確認します。デバッグに使用します。デフォルトは false です。

### BE の設定 {#be-configuration}

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Reader が一度に読み取る最大バイト数です。デフォルトは 8 MB です。
