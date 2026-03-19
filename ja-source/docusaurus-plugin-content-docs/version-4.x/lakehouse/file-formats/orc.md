---
{
  "title": "ORC | ファイル形式",
  "language": "ja",
  "description": "このドキュメントは、DorisにおけるORCファイル形式の読み書きサポートについて紹介します。以下の機能に適用されます：",
  "sidebar_label": "ORC"
}
---
# ORC

この文書では、DorisにおけるORCファイル形式の読み取りと書き込みのサポートについて説明します。以下の機能に適用されます：

* Catalogでのデータの読み取りと書き込み
* Table Valued Functionsを使用したデータの読み取り
* Broker Loadによるデータの読み取り
* Export時のデータの書き込み
* Outfileによるデータの書き込み

## サポートされている圧縮形式

* uncompressed
* snappy
* lz4
* zstd
* lzo
* zlib

## パラメータ

### セッション変数

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    ORC Readerが遅延マテリアライゼーションを有効にするかどうかを制御します。デフォルトはtrueです。

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    HiveテーブルからORCデータ型を読み取る際、Dorisはデフォルトで、Hiveテーブルのカラムと同じ名前を持つORCファイル内のカラムからデータを読み取ります。この変数が`false`に設定されると、Dorisはカラム名に関係なく、Hiveテーブル内のカラム順序に基づいてORCファイルからデータを読み取ります。これはHiveの`orc.force.positional.evolution`変数と似ています。このパラメータは最上位レベルのカラム名にのみ適用され、Struct内のカラムには効果がありません。

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    ORCファイルにおいて、Stripeのバイトサイズが`orc_tiny_stripe_threshold`未満の場合、Tiny Stripeとみなされます。連続する複数のTiny Stripeに対しては、読み取り最適化が実行されます。つまり、複数のTiny Stripeを一度に読み取ってIO操作数を減らします。この最適化を使用したくない場合は、この値を0に設定できます。デフォルトは8Mです。

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe読み取り最適化を使用する際、複数のTiny Stripeが単一のIO操作にマージされます。このパラメータは各IOリクエストの最大バイト数を制御します。この値を`orc_tiny_stripe_threshold`より小さく設定すべきではありません。デフォルトは8Mです。

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe読み取り最適化を使用する際、読み取り対象の2つのTiny Stripeが連続していない場合があるため、2つのTiny Stripe間の距離がこのパラメータを超える場合、それらは単一のIO操作にマージされません。デフォルトは1Mです。

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    Tiny Stripe最適化において、ORCファイルに多くのカラムがあるがクエリで使用されるのが少数の場合、Tiny Stripe最適化により深刻な読み取り増幅が発生する可能性があります。実際に読み取られるバイト数がStripe全体に占める割合がこのパラメータを超える場合、Tiny Stripe読み取り最適化が使用されます。デフォルト値は0.4で、最小値は0です。

* `check_orc_init_sargs_success` (3.1.0+)

    ORC述語プッシュダウンが成功したかどうかをチェックします。デバッグに使用されます。デフォルトはfalseです。

### BE設定

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Readerが一度に読み取る最大バイト数。デフォルトは8 MBです。
