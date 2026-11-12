---
{
    "title": "セッション変数一覧",
    "language": "ja",
    "description": "Doris のセッション変数の値、デフォルト値、効果。"
}
---

:::caution このページは作成中で、まだ完全ではありません

このページでは Doris のセッション変数をまとめています。現在は、最近のバージョンで**追加、デフォルト値が変更、または削除された**変数のみを収録しており、完全なリファレンスではありません。ここに記載されていない変数の現在値を確認するには、`SHOW VARIABLES LIKE '<pattern>'` を使用してください。

変数の分類、スコープ、設定方法については [変数](./variables.md) を参照してください。

:::

## 確認と設定 {#inspect-and-set}

```sql
-- Inspect
SHOW VARIABLES LIKE 'enable_file_scanner_v2';

-- Current session only
SET enable_file_scanner_v2 = false;

-- Globally (applies to sessions created afterwards)
SET GLOBAL enable_file_scanner_v2 = false;
```

## 4.1.5 での変更点 {#what-changed-in-415}

| カテゴリ | 変数 |
| --- | --- |
| 追加 | `enable_hyperscan_fallback` |
| デフォルト値の変更 | `enable_file_cache`：`false` から `true` |
| 動作修正 | `profile_level` は Master FE に転送される；`return_object_data_as_binary` は SQL Cache の結果を区別する |

## 4.1.4 での変更点 {#what-changed-in-414}

| カテゴリ | 変数 |
| --- | --- |
| 追加 | `enable_file_scanner_v2`、`enable_external_scan_task_reuse`、`file_split_size_on_fe`、`file_split_size_on_be`、`enable_expr_zonemap_filter`、`enable_local_exchange_before_agg`、`enable_local_exchange_before_streaming_agg`、`runtime_filter_broadcast_join_producer_num`、`runtime_filter_tree_publish_max_send_bytes`、`bucket_shuffle_downgrade_ratio`、`eager_aggregation_on_broadcast_join`、`eager_agg_broadcast_row_count`、`force_eager_agg_hint`、`enable_topn_lazy_mat_phase2_no_write_file_cache`、`file_cache_query_limit_bytes`、`file_presigned_url_ttl_seconds`、`force_forward_all_queries` |
| デフォルト値またはセマンティクスの変更 | `max_scanners_concurrency`、`enable_runtime_filter_partition_prune`、`enable_nereids_distribute_planner` |
| 削除 | `eager_aggregation_on_join`、`plan_nereids_dump` |

## 外部テーブルスキャン {#external-table-scan}

### `enable_file_cache` {#enable_file_cache}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `true`（4.1.5 より前は `false`） |
| バージョン | 4.1.5 でデフォルト値を変更 |

クエリが File Cache を使用するかどうかを指定します。同名の BE 設定も有効にする必要があります。BE 設定が `false` の場合、セッション変数だけを有効にしてもキャッシュは使用されません。4.1.5 では両方のデフォルト値が `true` に変更されました。アップグレード後は、明示的な設定と永続化されたグローバル変数を確認してください。パス、容量、制限については [File Cache](../../compute-storage-decoupled/file-cache/file-cache.md) を参照してください。

### `enable_file_scanner_v2` {#enable_file_scanner_v2}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `true` |
| バージョン | 4.1.4 で追加 |

外部ファイルのスキャンに File Scanner V2 を使用するかどうかを指定します。有効にすると、`FileScanNode` は対応するクエリシナリオで新しいネイティブスキャンエンジンを使用します。対象は Parquet、ORC、CSV、JSON 形式、および Hive、Iceberg、Paimon、Hudi テーブル形式です。JDBC カタログと Iceberg システムテーブルでは、引き続き従来のスキャンパスが使用されます。

新しいスキャナーがクエリの問題に関係していると思われる場合は、`false` に設定して動作を比較できます。[データレイククエリチューニング](../../lakehouse/best-practices/optimization.md) を参照してください。

### `enable_external_scan_task_reuse` {#enable_external_scan_task_reuse}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `true` |
| バージョン | 4.1.4 で追加 |

同一ステートメント内の同等な外部テーブルスキャンノードが生成する split を再利用するかどうかを指定します。有効にすると、同じ外部テーブルを自己結合または CTE で複数回参照しても split の計画を繰り返さないため、FE の計画時間を短縮できます。Hive、Hudi、Iceberg、Paimon に適用されます。

### `file_split_size_on_fe` {#file_split_size_on_fe}

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト | `536870912`（512 MB） |
| バージョン | 4.1.4 で追加 |

BE がさらに細かく分割できる場合に、FE が生成する粗粒度ファイル split の目標サイズです。0 以下の値を指定すると BE 側の再分割が無効になり、従来の FE split ポリシーに戻ります。

### `file_split_size_on_be` {#file_split_size_on_be}

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト | `67108864`（64 MB） |
| バージョン | 4.1.4 で追加 |

BE が Parquet の row group または ORC の stripe ごとに生成する細粒度 split の目標サイズです。row group または stripe は分割できないため、個々の split がこの目標値を超える場合があります。

### `enable_expr_zonemap_filter` {#enable_expr_zonemap_filter}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `false` |
| バージョン | 4.1.4 で追加 |

この変数に従うスキャナーでの式 ZoneMap フィルタリングを制御します。

File Scanner V2 は常に安全な形式の式 ZoneMap フィルタリングを実行するため、この変数の影響を受けません。

### `enable_runtime_filter_partition_prune` {#enable_runtime_filter_partition_prune}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `true` |
| バージョン | 4.1.4 でセマンティクスを変更 |

この変数に従うスキャナーでのランタイムフィルターによるパーティションプルーニングを制御します。

4.1.4 以降、File Scanner V2 は常に安全な形式のパーティションプルーニングを実行するため、この変数を `false` に設定しても File Scanner V2 には影響しません。

### `max_scanners_concurrency` {#max_scanners_concurrency}

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト | `8`（4.1.4 より前は `4`） |
| バージョン | 4.1.4 でデフォルト値を変更 |

ScanNode の最大スキャン同時実行数です。4.1.4 では、スキャンスレッドがボトルネックになる場合のスループットを向上させるため、デフォルト値が `4` から `8` に引き上げられました。以前の動作を維持するには `4` に戻してください。

## クエリ計画と実行 {#query-planning-and-execution}

### `enable_nereids_distribute_planner` {#enable_nereids_distribute_planner}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `true` |
| バージョン | 4.1.4 でアップグレード時の動作を変更 |

Nereids 分散プランナーを使用するかどうかを指定します。

4.1.4 以降の 4.1 系列では、移行時に**グローバルデフォルトを `true` に更新**するのは、`variable_version < 400` の場合（通常は 3.x からのアップグレード時）だけです。以前に `false` が永続化されていても、この条件に該当すれば更新されます。アップグレード後にプランの分散方法が変わった場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` を実行してロールバックしてください。

### `runtime_filter_broadcast_join_producer_num` {#runtime_filter_broadcast_join_producer_num}

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト | `3` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合における各ランタイムフィルターのプロデューサー BE の最大数です。0 以下の値を指定すると制限がなくなります。

ブロードキャスト結合では、ビルド側のすべての BE が同じランタイムフィルター内容を生成するため、プロデューサー数を制限すると大規模クラスタでの RPC オーバーヘッドを大幅に削減できます。これは Nereids の分散計画パスにのみ影響し、従来の Coordinator パスでは既存の動作が維持されます。

### `runtime_filter_tree_publish_max_send_bytes` {#runtime_filter_tree_publish_max_send_bytes}

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト | `268435456`（256 MB） |
| バージョン | 4.1.4 で追加 |

グローバルランタイムフィルターを公開するときに、単一の RPC で送信できる最大バイト数です。このしきい値を超えると Doris はツリー形式（複数レベル）の公開に切り替えるため、マージノードが同じ大きなフィルターをすべてのスキャンノードに送信する必要がなくなります。

値 `0` はツリー形式の公開を無効にし、直接公開に戻します。値は `0` 以上でなければならず、それ以外の場合は設定に失敗します。

### `bucket_shuffle_downgrade_ratio` {#bucket_shuffle_downgrade_ratio}

| 項目 | 値 |
| --- | --- |
| 型 | Double |
| デフォルト | `0.8` |
| バージョン | 4.1.4 で追加（実験的） |

基テーブル側の合計バケット数が、全インスタンス数にこの比率を掛けた値より小さい場合に、バケットシャッフル結合を通常のシャッフル結合へダウングレードします。0 以下の値ではダウングレードされません。デフォルトの `0.8` では元の動作が維持されます。

### `enable_local_exchange_before_agg` {#enable_local_exchange_before_agg}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `true` |
| バージョン | 4.1.4 で追加 |

集約演算子の前にローカル交換を挿入するかどうかを指定します。

:::caution
これを無効にすることは推奨されません。4.1.4 より前は、シリアルまたは非ハッシュのローカル交換でこの動作を無効にすると、**誤った結果**が返される可能性がありました。この問題は 4.1.4 で修正されています。
:::

### `enable_local_exchange_before_streaming_agg` {#enable_local_exchange_before_streaming_agg}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `false` |
| バージョン | 4.1.4 で追加 |

ストリーミング集約演算子の前にローカル交換を挿入するかどうかを指定します。

### `eager_aggregation_on_broadcast_join` {#eager_aggregation_on_broadcast_join}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `true` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合で早期集約（集約のプッシュダウン）を許可するかどうかを指定します。

### `eager_agg_broadcast_row_count` {#eager_agg_broadcast_row_count}

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト | `250000` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合で早期集約を適用するかどうかを判断するための行数しきい値です。

### `force_eager_agg_hint` {#force_eager_agg_hint}

| 項目 | 値 |
| --- | --- |
| 型 | String |
| デフォルト | `""`（空） |
| バージョン | 4.1.4 で追加 |

早期集約のプッシュダウンを強制する一致ヒントです。テストとデバッグを目的としています。**本番環境での使用は推奨されません。**

形式は `<func>:<qualifier.column | *>=<push|nopush>` で、エントリは `;` で区切ります。

```sql
SET force_eager_agg_hint = 'sum:t1.a=push; sum:t2.a=nopush; count:*=push';
```

エントリは集約関数ごとに照合されますが、効果は個々の集約関数に独立して適用されるのではなく、現在の候補プッシュダウンブランチまたはサブツリーに適用されます。ブランチ内で一致したエントリのいずれかが `nopush` なら、そのブランチはプッシュダウンされません。そうでなければ、一致したエントリのいずれかが `push` の場合、そのブランチは強制的にプッシュダウンされ、同じブランチ内の他の集約関数もブランチ単位の決定に従います。

### `force_forward_all_queries` {#force_forward_all_queries}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `false` |
| バージョン | 4.1.4 で追加 |

有効にすると、現在のセッション内のすべてのクエリが Master FE に転送されます。Master FE とフォロワー FE のメタデータ不整合が原因の問題を診断する場合に役立ちます。この変数は、同名の FE 設定に対応するセッションレベルの変数です。

## キャッシュ {#cache}

### `file_cache_query_limit_bytes` {#file_cache_query_limit_bytes}

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト | `-1` |
| バージョン | 4.1.4 で追加 |

単一のクエリが各 BE 上で read-through により File Cache に書き込めるリモートスキャンバイト数の最大値です。

- `0` 未満：制限なし（機能は無効）。
- `0` と等しい：クエリは File Cache に書き込みません。
- `0` より大きい：累積リモートスキャン量がこのしきい値に達すると、クエリは File Cache への書き込みを停止します。

一度きりの大規模スキャンによってキャッシュのホットデータが追い出されるのを防ぐために使用します。

### `enable_topn_lazy_mat_phase2_no_write_file_cache` {#enable_topn_lazy_mat_phase2_no_write_file_cache}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `false` |
| バージョン | 4.1.4 で追加 |

有効にすると、TopN の遅延マテリアライズにおける phase-2 の読み取りは、File Cache がミスした場合にリモートストレージへ直接アクセスし、**ミスした範囲を File Cache に書き戻しません**。phase-2 の読み取りパターンがランダムで、キャッシュヒット率が低い場合に役立ちます。

## AI 関数 {#ai-functions}

### `file_presigned_url_ttl_seconds` {#file_presigned_url_ttl_seconds}

| 項目 | 値 |
| --- | --- |
| 型 | Long（秒） |
| デフォルト | `3600` |
| バージョン | 4.1.4 で追加 |

マルチモーダルな `EMBED()` シナリオで、S3 互換ストレージ内のオブジェクトに対して生成される事前署名 URL の有効期間です。メディアファイルが大きく、プロバイダーによる取得に時間がかかる場合は値を増やしてください。[EMBED](../sql-functions/ai-functions/distance-functions/embed.md) を参照してください。

## プロファイルと結果出力 {#profile-and-result-output}

### `profile_level` {#profile_level}

| 項目 | 値 |
| --- | --- |
| 型 | Integer（`1`、`2`、または `3`） |
| デフォルト | `2` |
| バージョン | 4.1.5 で転送動作を修正 |

Query Profile の詳細度を制御します。`1` はマージされたカウンターを収集し、`2` は詳細情報を出力し、`3` はパフォーマンスに影響する可能性がある追加カウンターを有効にします。4.1.5 以降、Master FE に転送されるクエリでは現在のセッションのレベルが維持されます。[Query Profile](../../query-acceleration/query-profile.md) を参照してください。

### `return_object_data_as_binary` {#return_object_data_as_binary}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `false` |
| バージョン | 4.1.5 で SQL Cache の区別動作を修正 |

MySQL の結果で HLL、BITMAP、QUANTILE_STATE オブジェクトの生のバイナリデータを返すかどうかを指定します。`false` の場合、これらの値は NULL を返します。4.1.5 以降、この変数によって SQL 結果キャッシュのエントリが区別されるため、バイナリ出力を有効にしたセッションが、無効にしたセッションによってキャッシュされた NULL 結果を再利用することを防ぎます。

## 正規表現 {#regular-expressions}

### `enable_hyperscan_fallback` {#enable_hyperscan_fallback}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト | `true` |
| バージョン | 4.1.5 で追加 |

Hyperscan がパターンをコンパイルできない場合に、RE2 にフォールバックするかどうかを指定します。`true` の場合は RE2 を試し、`false` の場合は Hyperscan のコンパイルエラーを返します。フォールバックしても、RE2 自体がサポートしていない構文が追加されることはありません。この変数は、高度な Boost.Regex 構文を有効にする `enable_extended_regex` とは異なるパスを制御します。[REGEXP](../sql-functions/scalar-functions/string-functions/regexp.md) を参照してください。

## 削除された変数 {#removed-variables}

| 変数 | 削除バージョン | 注記 |
| --- | --- | --- |
| `eager_aggregation_on_join` | 4.1.4 | 集約プッシュダウン戦略が見直されました。代わりに `eager_aggregation_on_broadcast_join` と `eager_agg_broadcast_row_count` を使用してください。この変数を設定しているスクリプトが残っている場合は削除してください |
| `plan_nereids_dump` | 4.1.4 | 現在は内部状態であり、minidump のリプレイ中にのみ有効化されます。`SET` で設定することはできません |
