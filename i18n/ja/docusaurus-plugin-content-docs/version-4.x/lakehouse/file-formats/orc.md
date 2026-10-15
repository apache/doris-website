---
{
    "title": "ORC | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Doris での ORC ファイル形式の読み書きへの対応について説明します。対象となる機能は次のとおりです。",
    "sidebar_label": "ORC"
}
---

# ORC

このドキュメントでは、Doris での ORC ファイル形式の読み書きへの対応について説明します。対象となる機能は次のとおりです。

* Catalog でのデータの読み書き。
* テーブル値関数を使用したデータの読み取り。
* Broker Load によるデータの読み取り。
* Export 実行時のデータの書き出し。
* Outfile によるデータの書き出し。

## 対応する圧縮形式

* uncompressed
* snappy
* lz4
* zstd
* lzo
* zlib

## パラメータ

### セッション変数

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    ORC Reader が遅延実体化を有効にするかどうかを制御します。デフォルトは true です。

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    Hive テーブルから ORC データ型を読み取る際、Doris はデフォルトで、Hive テーブルの列と同じ名前を持つ ORC ファイル内の列からデータを読み取ります。この変数を `false` に設定すると、列名にかかわらず、Hive テーブルの列順に基づいて ORC ファイルからデータを読み取ります。これは Hive の `orc.force.positional.evolution` 変数と同様です。このパラメータが適用されるのは最上位の列名のみで、Struct 内の列には効果がありません。

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    ORC ファイル内で Stripe のバイト数が `orc_tiny_stripe_threshold` より小さい場合、その Stripe は Tiny Stripe と見なされます。連続する複数の Tiny Stripe に対しては、I/O 操作の回数を減らすために、それらを一度に読み取る最適化が行われます。この最適化を使用しない場合は、この値を 0 に設定できます。デフォルトは 8M です。

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe の読み取り最適化では、複数の Tiny Stripe が一度の I/O 操作にまとめられます。このパラメータは、各 I/O リクエストの最大バイト数を制御します。この値を `orc_tiny_stripe_threshold` より小さく設定しないでください。デフォルトは 8M です。

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe の読み取り最適化では、読み取る二つの Tiny Stripe が連続しているとは限りません。両者の間隔がこのパラメータの値を超える場合、一度の I/O 操作にはまとめられません。デフォルトは 1M です。

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    ORC ファイルに多数の列があり、クエリではそのうちの少数しか使用しない場合、Tiny Stripe の最適化によって読み取り量が大幅に増えることがあります。Stripe 全体に対する実際に読み取るバイト数の割合がこのパラメータの値を超えると、Tiny Stripe の読み取り最適化が使用されます。デフォルト値は 0.4、最小値は 0 です。

* `check_orc_init_sargs_success` (3.1.0+)

    ORC の述語プッシュダウンが成功したかどうかを確認します。デバッグに使用します。デフォルトは false です。

### BE の設定

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Reader が一度に読み取る最大バイト数です。デフォルトは 8 MB です。
