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

* Catalog 内のデータの読み書き。
* Table Valued Functions を使用したデータの読み取り。
* Broker Load によるデータの読み取り。
* Export 時のデータの書き込み。
* Outfile によるデータの書き込み。

## 対応する圧縮形式 {#supported-compression-formats}

* uncompressed
* snappy
* lz4
* zstd
* lzo
* zlib

## パラメータ {#parameters}

### Timestamp と Date の互換性（4.1.5 以降） {#timestamp-and-date-compatibility-since-415}

4.1.5 以降、ORC の `TIMESTAMP` はタイムゾーンを持たない壁時計時刻を表し、`TIMESTAMP_INSTANT` は特定の時点を表して `TIMESTAMPTZ` にマッピングされます。読み取り時には、ナノ秒をマイクロ秒単位に丸めます。範囲外の値や無効なナノ秒の値はエラーになります。

ORC への書き込み時、Unix エポックの直前にある負の小数秒を持つタイムスタンプの一部は、データを失わずに表現できません。その場合、Doris は `ORC cannot represent pre-epoch timestamp fractions in [-0.999, 0) seconds without data loss; use Parquet for these values` を返します。これらの値を含むデータには Parquet を使用してください。

旧バージョンの Doris のエンコーディングで書き込まれ、`0000-01-01` から `0000-02-28` までの日付を含む DATE ファイルは、明示的な移行が必要です。[年ゼロの DATE ファイルの移行](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)を参照してください。

### セッション変数 {#session-variables}

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    ORC Reader で遅延マテリアライゼーションを有効にするかどうかを制御します。デフォルトは true です。

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    Hive テーブルから ORC データ型を読み取る際、Doris はデフォルトで、Hive テーブルの列と同じ名前を持つ ORC ファイル内の列からデータを読み取ります。この変数を `false` に設定すると、列名に関係なく、Hive テーブルの列順に基づいて ORC ファイルからデータを読み取ります。これは Hive の `orc.force.positional.evolution` 変数に似ています。このパラメータは最上位の列名にのみ適用され、Struct 内の列には効果がありません。

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    ORC ファイル内の Stripe のバイトサイズが `orc_tiny_stripe_threshold` より小さい場合、その Stripe は Tiny Stripe と見なされます。複数の Tiny Stripe が連続している場合は、複数の Tiny Stripe を一度に読み取る最適化を行い、IO 操作の回数を減らします。この最適化を使用しない場合は、この値を 0 に設定できます。デフォルトは 8M です。

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe の読み取り最適化を使用すると、複数の Tiny Stripe が単一の IO 操作にまとめられます。このパラメータは、各 IO リクエストの最大バイト数を制御します。この値を `orc_tiny_stripe_threshold` より小さく設定しないでください。デフォルトは 8M です。

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe の読み取り最適化では、読み取る Tiny Stripe 同士が連続していない場合があります。Tiny Stripe 間の距離がこのパラメータの値を超える場合、それらは単一の IO 操作にまとめられません。デフォルトは 1M です。

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    Tiny Stripe の最適化では、ORC ファイルに多くの列があっても、クエリで使用する列が少ない場合、読み取り量が大幅に増えることがあります。実際に読み取るバイト数が Stripe 全体に占める割合がこのパラメータの値を超える場合、Tiny Stripe の読み取り最適化が使用されます。デフォルト値は 0.4、最小値は 0 です。

* `check_orc_init_sargs_success` (3.1.0+)

    デバッグ用に、ORC の述語プッシュダウンが成功したかどうかを確認します。デフォルトは false です。

### BE 設定 {#be-configuration}

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Reader が一度に読み取る最大バイト数です。デフォルトは 8 MB です。
