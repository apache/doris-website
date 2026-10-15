---
{
    "title": "セッション変数一覧",
    "language": "ja",
    "description": "Doris のセッション変数の値、デフォルト値、および動作への影響。"
}
---

:::caution このページは作成中であり、まだ完全ではありません

このページでは Doris のセッション変数をまとめています。現在は、最近のバージョンで
**追加された変数、デフォルト値が変更された変数、削除された変数**のみを掲載しており、
すべての変数を網羅したリファレンスではありません。ここにない変数の現在値を調べるには、
`SHOW VARIABLES LIKE '<pattern>'` を使用してください。

変数の分類、適用範囲、設定方法については、[変数](./variables.md)を参照してください。

:::

## 値の確認と設定

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
| 追加 | `enable_file_scanner_v2`, `enable_external_scan_task_reuse`, `file_split_size_on_fe`, `file_split_size_on_be`, `enable_expr_zonemap_filter`, `enable_local_exchange_before_agg`, `enable_local_exchange_before_streaming_agg`, `runtime_filter_broadcast_join_producer_num`, `runtime_filter_tree_publish_max_send_bytes`, `bucket_shuffle_downgrade_ratio`, `eager_aggregation_on_broadcast_join`, `eager_agg_broadcast_row_count`, `force_eager_agg_hint`, `enable_topn_lazy_mat_phase2_no_write_file_cache`, `file_cache_query_limit_bytes`, `file_presigned_url_ttl_seconds`, `force_forward_all_queries` |
| デフォルト値または動作の変更 | `max_scanners_concurrency`, `enable_runtime_filter_partition_prune`, `enable_nereids_distribute_planner` |
| 削除 | `eager_aggregation_on_join`, `plan_nereids_dump` |

## 外部テーブルのスキャン

### `enable_file_scanner_v2`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

外部ファイルのスキャンに File Scanner V2 を使用するかどうかを指定します。有効にすると、
`FileScanNode` は対応するクエリで新しいネイティブスキャンエンジンを使用します。対象には
Parquet、ORC、CSV、JSON の各形式と、Hive、Iceberg、Paimon、Hudi のテーブル形式が
含まれます。JDBC カタログと Iceberg システムテーブルでは、引き続き従来のスキャン処理を
使用します。

クエリの問題が新しいスキャナーに関係していると思われる場合は、`false` に設定して動作を
比較してください。[データレイクのクエリチューニング](../../lakehouse/best-practices/optimization.md)も参照してください。

### `enable_external_scan_task_reuse`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

単一のステートメント内で等価な外部テーブルのスキャンノードが、生成したスプリットを再利用するかどうかを
指定します。有効にすると、同じ外部テーブルに対する自己結合や、複数回参照される CTE で
スプリットが再計画されなくなり、FE のプランニング時間が短縮されます。Hive、Hudi、
Iceberg、Paimon に適用されます。

### `file_split_size_on_fe`

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト値 | `536870912`（512 MB） |
| バージョン | 4.1.4 で追加 |

BE でさらに細分化できる場合に、FE が生成する粗い粒度のファイルスプリットの目標サイズです。
値が正でない場合、BE 側での細分化を無効にし、従来の FE のスプリット方式に戻ります。

### `file_split_size_on_be`

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト値 | `67108864`（64 MB） |
| バージョン | 4.1.4 で追加 |

BE が Parquet の行グループまたは ORC のストライプごとに生成する、細かい粒度のスプリットの
目標サイズです。行グループやストライプは分割できないため、個々のスプリットがこの目標サイズを
超えることがあります。

### `enable_expr_zonemap_filter`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.4 で追加 |

この変数に従うスキャナーで、式に対する ZoneMap フィルタリングを行うかどうかを制御します。

File Scanner V2 は安全な形式の式 ZoneMap フィルタリングを常に実行するため、この変数の
影響を受けません。

### `enable_runtime_filter_partition_prune`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で動作を変更 |

この変数に従うスキャナーで、ランタイムフィルターによるパーティションの枝刈りを制御します。

4.1.4 以降、File Scanner V2 は安全な形式のパーティションの枝刈りを常に実行するため、
この変数を `false` に設定しても File Scanner V2 には影響しません。

### `max_scanners_concurrency`

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト値 | `8`（`4` は 4.1.4 より前の値） |
| バージョン | 4.1.4 でデフォルト値を変更 |

ScanNode の最大スキャン並列数です。スキャンスレッドがボトルネックになっている場合の
スループットを向上させるため、4.1.4 ではデフォルト値が `4` から `8` に引き上げられました。
従来の動作を維持するには `4` に戻してください。

## クエリのプランニングと実行

### `enable_nereids_distribute_planner`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 でアップグレード時の動作を変更 |

Nereids 分散プランナーを使用するかどうかを指定します。

4.1.4 以降、アップグレードすると、**この変数のグローバルデフォルト値は `true` に更新されます**。
クラスターメタデータに以前 `false` が保存されていた場合も同様です。アップグレード後にプランの
分散方法が変わった場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` を
実行して元に戻してください。

### `runtime_filter_broadcast_join_producer_num`

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト値 | `3` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合で、各ランタイムフィルターを生成する BE の最大数です。値が `0` 以下の
場合、上限はなくなります。

ブロードキャスト結合ではビルド側の各 BE が同じ内容のランタイムフィルターを生成します。
生成元の数に上限を設けることで、大規模クラスターでの RPC のオーバーヘッドを大幅に削減できます。
これは Nereids の分散プランニング経路にのみ影響し、従来の Coordinator 経路の動作は
変わりません。

### `runtime_filter_tree_publish_max_send_bytes`

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト値 | `268435456`（256 MB） |
| バージョン | 4.1.4 で追加 |

グローバルランタイムフィルターを配信する際、単一の RPC で送信する最大バイト数です。
このしきい値を超えると、Doris はツリー形式の多段階配信に切り替えるため、マージノードが
同じ大きなフィルターをすべてのスキャンノードに送信する必要がなくなります。

値を `0` にするとツリー形式の配信が無効になり、直接配信に戻ります。値は `0` 以上である
必要があり、負の値を設定しようとすると失敗します。

### `bucket_shuffle_downgrade_ratio`

| 項目 | 値 |
| --- | --- |
| 型 | Double |
| デフォルト値 | `0.8` |
| バージョン | 4.1.4 で追加（実験的機能） |

ベーステーブル側のバケット総数が、インスタンス総数にこの比率を掛けた値より小さい場合、
バケットシャッフル結合を通常のシャッフル結合に切り替えます。値が `0` 以下の場合は
切り替えません。デフォルト値の `0.8` では従来の動作が維持されます。

### `enable_local_exchange_before_agg`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

集約オペレーターの前にローカルエクスチェンジを挿入するかどうかを指定します。

:::caution
この設定を無効にすることは推奨しません。4.1.4 より前は、この動作を無効にすると、
シリアルまたは非ハッシュのローカルエクスチェンジで**誤った結果**が返される可能性が
ありました。この問題は 4.1.4 で修正されています。
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

ブロードキャスト結合で早期集約（集約のプッシュダウン）を許可するかどうかを指定します。

### `eager_agg_broadcast_row_count`

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト値 | `250000` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合で早期集約を適用するかどうかの判断に使う行数のしきい値です。

### `force_eager_agg_hint`

| 項目 | 値 |
| --- | --- |
| 型 | String |
| デフォルト値 | `""`（空文字列） |
| バージョン | 4.1.4 で追加 |

一致すると早期集約のプッシュダウンを強制するヒントです。テストとデバッグを目的としています。
**本番環境での使用は推奨しません。**

形式は `<func>:<qualifier.column | *>=<push|nopush>` で、複数のエントリは `;` で区切ります。

```sql
SET force_eager_agg_hint = 'sum:t1.a=push; sum:t2.a=nopush; count:*=push';
```

各エントリは集約関数ごとに照合されますが、その効果は個々の集約関数に独立して適用されるのではなく、
現在のプッシュダウン候補の分岐またはサブツリーに適用されます。分岐内で
`nopush` に一致するエントリがあれば、その分岐はプッシュダウンされません。そうでなければ、
`push` に一致するエントリがあれば、その分岐のプッシュダウンが強制される場合があり、同じ分岐内の
ほかの集約にも分岐単位の判断が適用されます。

### `force_forward_all_queries`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.4 で追加 |

有効にすると、現在のセッションのすべてのクエリがマスター FE に転送されます。マスター FE と
フォロワー FE の間のメタデータ不整合による問題を診断する際に役立ちます。この変数は、
同名の FE 設定項目に対応するセッションレベルの設定です。

## キャッシュ

### `file_cache_query_limit_bytes`

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト値 | `-1` |
| バージョン | 4.1.4 で追加 |

単一のクエリが各 BE でリードスルーによりファイルキャッシュへ書き込める、リモートスキャンの
最大バイト数です。

- `0` 未満: 上限なし（機能は無効）。
- `0` と等しい: クエリはファイルキャッシュに書き込みません。
- `0` より大きい: リモートスキャンの累積データ量がこのしきい値に達すると、クエリは
  ファイルキャッシュへの書き込みを停止します。

一度限りの大規模スキャンによって、頻繁に使われるデータがキャッシュから追い出されるのを
防ぐために使用します。

### `enable_topn_lazy_mat_phase2_no_write_file_cache`

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.4 で追加 |

有効にすると、TopN の遅延マテリアライズにおけるフェーズ 2 の読み取りでファイルキャッシュに
ヒットしなかった場合、リモートストレージから直接読み取り、**ヒットしなかった範囲をファイル
キャッシュに書き戻しません**。フェーズ 2 の読み取りがランダムで、キャッシュヒット率が低い
場合に役立ちます。

## AI 関数

### `file_presigned_url_ttl_seconds`

| 項目 | 値 |
| --- | --- |
| 型 | Long（秒） |
| デフォルト値 | `3600` |
| バージョン | 4.1.4 で追加 |

S3 互換ストレージ内のオブジェクトに対して、マルチモーダルの `EMBED()` 利用時に生成される
署名付き URL の有効期間です。メディアファイルが大きく、プロバイダーによる取得に時間が
かかる場合は、この値を増やしてください。[EMBED](../sql-functions/ai-functions/distance-functions/embed.md)を
参照してください。

## 削除された変数

| 変数 | 削除されたバージョン | 備考 |
| --- | --- | --- |
| `eager_aggregation_on_join` | 4.1.4 | 集約のプッシュダウン方式が見直されました。代わりに `eager_aggregation_on_broadcast_join` と `eager_agg_broadcast_row_count` を使用してください。まだこの変数を設定しているスクリプトからは削除してください |
| `plan_nereids_dump` | 4.1.4 | 現在はミニダンプの再生中にのみ有効になる内部状態であり、`SET` では設定できません |
