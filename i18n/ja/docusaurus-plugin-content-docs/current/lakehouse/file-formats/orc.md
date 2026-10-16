---
{
    "title": "ORC | ファイル形式",
    "language": "ja",
    "description": "このドキュメントでは、Doris における ORC ファイル形式の読み書きへの対応について説明します。対象となる機能は次のとおりです。",
    "sidebar_label": "ORC"
}
---

# ORC

このドキュメントでは、Doris における ORC ファイル形式の読み書きへの対応について説明します。対象となる機能は次のとおりです。

* Catalog でのデータの読み書き。
* テーブル値関数を使用したデータの読み取り。
* Broker Load でのデータの読み取り。
* Export によるデータの書き込み。
* Outfile によるデータの書き込み。

## タイムスタンプの秒未満の精度

ORC のタイムスタンプはナノ秒まで格納できますが、Doris の `DATETIMEV2` と `TIMESTAMPTZ` がサポートするのはマイクロ秒までです。FileScannerV2 は、Catalog のスキャン、テーブル値関数、Broker Load で、ORC の秒未満の値を四捨五入（round half up）して最も近いマイクロ秒に丸めます。

| ORC の値 | Doris の値 |
|---|---|
| `2024-01-01 00:00:00.123456499` | `2024-01-01 00:00:00.123456` |
| `2024-01-01 00:00:00.123456500` | `2024-01-01 00:00:00.123457` |
| `2024-01-01 00:00:00.999999500` | `2024-01-01 00:00:01.000000` |

`DATETIMEV2` と `TIMESTAMPTZ` のどちらのマッピングにもこの規則が適用され、次の秒への繰り上がりも含まれます。行のデコード、統計情報の変換、述語プッシュダウンでは、一致する境界値を使用します。ORC の統計情報の精度が不足し、丸め後の境界値を正確に表現できない場合、Doris は枝刈りの境界を保守的に広げます。`!=` などのタイムスタンプ述語を安全に表現できない場合、Doris はその検索条件をスキップし、デコードした行に対して述語を評価します。これにより、その述語による枝刈りは減る可能性がありますが、有効な行が誤って除外されることは防げます。

## UUID 型のマッピング

Doris は `UUID` 列を、ARRAY、MAP、STRUCT 内にネストされた UUID 要素も含め、正規の 16 バイトのビッグエンディアン値を保持する `BINARY` として書き込み、ネイティブ UUID であることを示す `doris.logical_type=uuid` 属性を追加します。ORC には標準の UUID 型がないため、Doris 以外のツールでは UUID の意味を持たない通常のバイナリ列として認識されます。OUTFILE で ORC の `schema` プロパティを明示的に指定する場合、UUID 列は `binary` として宣言してください。`string` など、ほかの型を指定すると拒否されます。

`BINARY` 列を読み取る際、その列に `doris.logical_type=uuid` 属性があれば、ネストされた要素を含め、どちらのファイルリーダーでもネイティブ UUID 型が復元されます。そのため、テーブル値関数はそのような列を `uuid`、`array<uuid>`、または `struct<k:uuid>` として報告します。この属性を持たない `BINARY` 列と `STRING` 列には、従来どおり `STRING` へのマッピングが適用されます。

OUTFILE と EXPORT における UUID の出力マッピングの全容については、[エクスポートされるファイルの列型マッピング](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files)を参照してください。

## サポートされる圧縮形式

* uncompressed
* snappy
* lz4
* zstd
* lzo
* zlib

## パラメータ

### セッション変数

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    ORC Reader で遅延マテリアライゼーションを有効にするかどうかを制御します。デフォルトは true です。

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    Hive テーブルから ORC データ型を読み取る際、Doris はデフォルトで、Hive テーブルの列と同じ名前を持つ ORC ファイル内の列からデータを読み取ります。この変数を `false` に設定すると、列名に関係なく、Hive テーブルの列順に基づいて ORC ファイルからデータを読み取ります。これは Hive の `orc.force.positional.evolution` 変数に似ています。このパラメータはトップレベルの列名にのみ適用され、Struct 内の列には効果がありません。

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    ORC ファイルでは、Stripe のバイト数が `orc_tiny_stripe_threshold` より小さい場合、Tiny Stripe とみなされます。連続する Tiny Stripe が複数ある場合、IO 操作の回数を減らすため、一度に複数の Tiny Stripe を読み取る最適化が行われます。この最適化を使用しない場合は、値を 0 に設定できます。デフォルトは 8M です。

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe の読み取り最適化を使用する場合、複数の Tiny Stripe が単一の IO 操作にまとめられます。このパラメータは、各 IO リクエストの最大バイト数を制御します。`orc_tiny_stripe_threshold` より小さい値に設定しないでください。デフォルトは 8M です。

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe の読み取り最適化では、読み取る二つの Tiny Stripe が連続していない場合があります。二つの Tiny Stripe の間隔がこのパラメータより大きい場合、単一の IO 操作にはまとめられません。デフォルトは 1M です。

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    Tiny Stripe の最適化では、ORC ファイルに多数の列があり、クエリで使用する列が少ない場合、読み取り量が大幅に増えることがあります。実際に読み取るバイト数が Stripe 全体に占める割合がこのパラメータを超えると、Tiny Stripe の読み取り最適化が使用されます。デフォルト値は 0.4、最小値は 0 です。

* `check_orc_init_sargs_success` (3.1.0+)

    デバッグ用に、ORC の述語プッシュダウンが成功したかどうかを確認します。デフォルトは false です。

### BE の設定

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Reader が一度に読み取る最大バイト数です。デフォルトは 8 MB です。
