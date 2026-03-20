---
{
  "title": "ORC | ファイル形式",
  "language": "ja",
  "description": "このドキュメントは、DorisにおけるORCファイル形式の読み取りと書き込みのサポートについて紹介します。以下の機能に適用されます：",
  "sidebar_label": "ORC"
}
---
# ORC

このドキュメントでは、DorisにおけるORCファイル形式の読み取りおよび書き込みサポートについて紹介します。以下の機能に適用されます：

* カタログでのデータの読み取りおよび書き込み
* table Valued Functionsを使用したデータの読み取り
* Broker Loadでのデータの読み取り
* Export中のデータの書き込み
* Outfileでのデータの書き込み

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

    ORC Readerで遅延マテリアライゼーションを有効にするかどうかを制御します。デフォルトはtrueです。

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    HiveテーブルからORCデータ型を読み取る際、Dorisはデフォルトで、Hiveテーブルの列と同じ名前を持つORCファイルの列からデータを読み取ります。この変数を`false`に設定すると、Dorisは列名に関係なく、Hiveテーブルの列順序に基づいてORCファイルからデータを読み取ります。これはHiveの`orc.force.positional.evolution`変数に似ています。このパラメータはトップレベルの列名にのみ適用され、Struct内の列には効果がありません。

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    ORCファイルにおいて、Stripeのバイトサイズが`orc_tiny_stripe_threshold`より小さい場合、Tiny Stripeとみなされます。複数の連続するTiny Stripeに対しては、読み取り最適化が実行されます。つまり、複数のTiny Stripeを一度に読み取ってIO操作の回数を削減します。この最適化を使用したくない場合は、この値を0に設定できます。デフォルトは8Mです。

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe読み取り最適化を使用する際、複数のTiny Stripeが単一のIO操作にマージされます。このパラメータは各IO要求の最大バイト数を制御します。この値を`orc_tiny_stripe_threshold`より小さく設定すべきではありません。デフォルトは8Mです。

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe読み取り最適化を使用する際、読み取る2つのTiny Stripeが連続していない可能性があるため、2つのTiny Stripe間の距離がこのパラメータより大きい場合、それらは単一のIO操作にマージされません。デフォルトは1Mです。

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    Tiny Stripe最適化において、ORCファイルに多くの列があるがクエリで使用されるのが少数の場合、Tiny Stripe最適化により深刻な読み取り増幅が生じる可能性があります。実際に読み取られるバイトの全Stripeに対する割合がこのパラメータを超える場合、Tiny Stripe読み取り最適化が使用されます。デフォルト値は0.4で、最小値は0です。

* `check_orc_init_sargs_success` (3.1.0+)

    ORC述語プッシュダウンが成功したかどうかをチェックし、デバッグに使用されます。デフォルトはfalseです。

### BE設定

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Readerが一度に読み取る最大バイト数。デフォルトは8 MBです。
