---
{
    "title": "セッション変数一覧",
    "language": "ja",
    "description": "Doris のセッション変数の値、デフォルト値、効果。"
}
---

:::caution このページは作成中であり、まだ完全ではありません

このページでは Doris のセッション変数をまとめています。現時点では、最近のバージョンで
**追加された変数、デフォルト値が変更された変数、削除された変数**のみを扱っており、
完全なリファレンスではありません。ここに掲載されていない変数の現在の値は、
`SHOW VARIABLES LIKE '<pattern>'` で確認してください。

変数の分類、適用範囲、設定方法については、[変数](./variables.md)を参照してください。

:::

## 確認と設定

```sql
-- Inspect
SHOW VARIABLES LIKE 'enable_file_scanner_v2';

-- Current session only
SET enable_file_scanner_v2 = false;

-- Globally (applies to sessions created afterwards)
SET GLOBAL enable_file_scanner_v2 = false;
```

## 4.1.4 での変更点

| 分類 | 変数 |
| --- | --- |
| 追加 | `enable_file_scanner_v2`, `enable_expr_zonemap_filter`, `enable_local_exchange_before_agg`, `enable_local_exchange_before_streaming_agg`, `runtime_filter_broadcast_join_producer_num`, `runtime_filter_tree_publish_max_send_bytes`, `bucket_shuffle_downgrade_ratio`, `eager_aggregation_on_broadcast_join`, `eager_agg_broadcast_row_count`, `force_eager_agg_hint`, `enable_topn_lazy_mat_phase2_no_write_file_cache`, `file_cache_query_limit_bytes`, `file_presigned_url_ttl_seconds`, `force_forward_all_queries` |
| 動作の変更 | `enable_runtime_filter_partition_prune`, `enable_nereids_distribute_planner` |
| 削除 | `eager_aggregation_on_join`, `plan_nereids_dump` |

## 外部テーブルのスキャン

### `enable_file_scanner_v2`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

外部ファイルのスキャンに File Scanner V2 を使用するかどうかを指定します。有効にすると、
`FileScanNode` は、対応するクエリシナリオで新しいネイティブスキャンエンジンを使用します。
対象には Parquet、ORC、CSV、JSON の各形式と、Hive、Iceberg、Paimon、Hudi の
テーブル形式が含まれます。JDBC カタログと Iceberg システムテーブルでは、引き続き従来の
スキャン処理が使用されます。

クエリの問題が新しいスキャナーに関係していると思われる場合は、`false` に設定して
動作を比較してください。[データレイクのクエリチューニング](../../lakehouse/best-practices/optimization.md)を参照してください。

### `enable_expr_zonemap_filter`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

この変数に対応するスキャナーで、式による ZoneMap フィルタリングを制御します。

File Scanner V2 では常に安全な方式の式による ZoneMap フィルタリングが行われ、
この変数の影響を受けません。

### `enable_runtime_filter_partition_prune`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で動作が変更 |

この変数に対応するスキャナーで、ランタイムフィルターによるパーティションプルーニングを
制御します。

4.1.4 以降、File Scanner V2 では常に安全な方式のパーティションプルーニングが行われるため、
この変数を `false` に設定しても File Scanner V2 には影響しません。

## クエリの計画と実行

### `enable_nereids_distribute_planner`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 でアップグレード時の動作が変更 |

Nereids 分散プランナーを使用するかどうかを指定します。

4.1.4 以降、アップグレード時には**この変数のグローバルデフォルト値が `true` に更新されます**。
クラスターメタデータに以前 `false` が保存されていた場合も同様です。アップグレード後にプランの
分散が変わった場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` を実行して
元に戻してください。

### `runtime_filter_broadcast_join_producer_num`

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト値 | `3` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合において、各ランタイムフィルターを生成する BE の最大数です。
`0` 以下の値を指定すると、この制限はなくなります。

ブロードキャスト結合では、ビルド側の各 BE が同じ内容のランタイムフィルターを生成するため、
生成する BE の数を制限すると、大規模クラスタでの RPC オーバーヘッドを大幅に削減できます。
この設定が影響するのは Nereids の分散プランニング経路のみです。従来の Coordinator 経路は
既存の動作を維持します。

### `runtime_filter_tree_publish_max_send_bytes`

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト値 | `268435456`（256 MB） |
| バージョン | 4.1.4 で追加 |

グローバルランタイムフィルターの配布時に、単一の RPC で送信する最大バイト数です。
このしきい値を超えると、Doris はツリー型の多段階配布に切り替えます。そのため、
マージノードが同じ大きなフィルターをすべてのスキャンノードへ送信することはなくなります。

値を `0` にするとツリー型配布が無効になり、直接配布に戻ります。値は `0` 以上である必要があり、
それ以外の値を設定しようとすると失敗します。

### `bucket_shuffle_downgrade_ratio`

| 項目 | 値 |
| --- | --- |
| 型 | Double |
| デフォルト値 | `0.8` |
| バージョン | 4.1.4 で追加（実験的） |

基準テーブル側の総バケット数が、総インスタンス数にこの比率を掛けた値より小さい場合に、
バケットシャッフル結合を通常のシャッフル結合に切り替えます。`0` 以下の値では切り替えません。
デフォルト値の `0.8` では従来の動作が維持されます。

### `enable_local_exchange_before_agg`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

集約オペレーターの前にローカルエクスチェンジを挿入するかどうかを指定します。

:::caution
この設定を無効にすることは推奨しません。4.1.4 より前は、この動作を無効にすると、
シリアルまたは非ハッシュのローカルエクスチェンジで**誤った結果**が返されることがありました。
この問題は 4.1.4 で修正されています。
:::

### `enable_local_exchange_before_streaming_agg`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.4 で追加 |

ストリーミング集約オペレーターの前にローカルエクスチェンジを挿入するかどうかを指定します。

### `eager_aggregation_on_broadcast_join`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合で先行集約（集約のプッシュダウン）を許可するかどうかを指定します。

### `eager_agg_broadcast_row_count`

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト値 | `250000` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合に先行集約を適用するかどうかの判断に使用する行数のしきい値です。

### `force_eager_agg_hint`

| 項目 | 値 |
| --- | --- |
| 型 | String |
| デフォルト値 | `""`（空文字列） |
| バージョン | 4.1.4 で追加 |

一致した場合に先行集約のプッシュダウンを強制するヒントです。テストとデバッグを目的としています。
**本番環境での使用は推奨しません。**

形式は `<func>:<qualifier.column | *>=<push|nopush>` で、複数のエントリは `;` で区切ります。

```sql
SET force_eager_agg_hint = 'sum:t1.a=push; sum:t2.a=nopush; count:*=push';
```

エントリの照合は集約関数ごとに行われますが、その効果は個々の集約関数に独立して適用されるのではなく、
現在のプッシュダウン候補の分岐またはサブツリーに適用されます。ある分岐で一致したエントリのいずれかが
`nopush` なら、その分岐はプッシュダウンされません。それ以外で、一致したエントリのいずれかが
`push` なら、その分岐のプッシュダウンが強制される場合があり、同じ分岐内のほかの集約も
その分岐単位の判断に従います。

### `force_forward_all_queries`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.4 で追加 |

有効にすると、現在のセッションのすべてのクエリがマスター FE に転送されます。
マスター FE とフォロワー FE の間でメタデータが不整合になったことによる問題を診断する際に役立ちます。
この変数は、同名の FE 設定項目に対応するセッションレベルの設定です。

## キャッシュ

### `file_cache_query_limit_bytes`

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト値 | `-1` |
| バージョン | 4.1.4 で追加 |

単一のクエリが、各 BE でリードスルーを通じてファイルキャッシュに書き込めるリモートスキャンの
最大バイト数です。

- `0` 未満: 制限なし（機能は無効）。
- `0` と等しい: クエリはファイルキャッシュに書き込みません。
- `0` より大きい: リモートスキャンの累積データ量がこのしきい値に達すると、クエリは
  ファイルキャッシュへの書き込みを停止します。

一度限りの大規模スキャンによって、頻繁に利用するデータがキャッシュから追い出されるのを防ぐために
使用します。

### `enable_topn_lazy_mat_phase2_no_write_file_cache`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.4 で追加 |

有効にすると、TopN の遅延マテリアライズにおける第 2 フェーズの読み取りでファイルキャッシュに
データがない場合、リモートストレージから直接読み取り、**キャッシュに存在しなかった範囲を
ファイルキャッシュに書き戻しません**。第 2 フェーズの読み取りがランダムで、キャッシュヒット率が
低い場合に役立ちます。

## AI 関数

### `file_presigned_url_ttl_seconds`

| 項目 | 値 |
| --- | --- |
| 型 | Long（秒） |
| デフォルト値 | `3600` |
| バージョン | 4.1.4 で追加 |

マルチモーダルの `EMBED()` のシナリオで、S3 互換ストレージ内のオブジェクトに対して生成される
署名付き URL の有効期間です。メディアファイルが大きく、プロバイダーによる取得に時間がかかる場合は、
この値を増やしてください。[EMBED](../sql-functions/ai-functions/distance-functions/embed.md)を参照してください。

## 削除された変数

| 変数 | 削除されたバージョン | 備考 |
| --- | --- | --- |
| `eager_aggregation_on_join` | 4.1.4 | 集約のプッシュダウン戦略が見直されました。代わりに `eager_aggregation_on_broadcast_join` と `eager_agg_broadcast_row_count` を使用してください。この変数を設定しているスクリプトから削除してください |
| `plan_nereids_dump` | 4.1.4 | 現在はミニダンプの再生時にのみ有効になる内部状態です。`SET` では設定できません |
