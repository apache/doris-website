---
{
    "title": "セッション変数一覧",
    "language": "ja",
    "description": "Doris のセッション変数の値、デフォルト値、効果。"
}
---

:::caution このページは作成中で、まだ完成していません

このページでは、Doris のセッション変数をまとめています。現在掲載しているのは、最近のバージョンで
**追加された変数、デフォルト値が変更された変数、削除された変数**のみで、完全なリファレンスではありません。
ここに掲載されていない変数の現在の値は、`SHOW VARIABLES LIKE '<pattern>'` で確認してください。

変数の分類、適用範囲、設定方法については、[変数](./variables.md)を参照してください。

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
| デフォルト値の変更 | `enable_file_cache`: `false` から `true` |
| 動作の修正 | `profile_level` が Master FE に転送されるようになりました。`return_object_data_as_binary` の値によって SQL Cache の結果が区別されるようになりました |

## 4.1.4 での変更点 {#what-changed-in-414}

| カテゴリ | 変数 |
| --- | --- |
| 追加 | `enable_file_scanner_v2`, `enable_expr_zonemap_filter`, `enable_local_exchange_before_agg`, `enable_local_exchange_before_streaming_agg`, `runtime_filter_broadcast_join_producer_num`, `runtime_filter_tree_publish_max_send_bytes`, `bucket_shuffle_downgrade_ratio`, `eager_aggregation_on_broadcast_join`, `eager_agg_broadcast_row_count`, `force_eager_agg_hint`, `enable_topn_lazy_mat_phase2_no_write_file_cache`, `file_cache_query_limit_bytes`, `file_presigned_url_ttl_seconds`, `force_forward_all_queries` |
| 意味の変更 | `enable_runtime_filter_partition_prune`, `enable_nereids_distribute_planner` |
| 削除 | `eager_aggregation_on_join`, `plan_nereids_dump` |

## 外部テーブルのスキャン {#external-table-scan}

### `enable_file_cache` {#enable_file_cache}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true`（4.1.5 より前は `false`） |
| バージョン | 4.1.5 でデフォルト値を変更 |

クエリで File Cache を使用するかどうかを指定します。同名の BE 設定も有効にする必要があります。BE 側の設定が `false` の場合、セッション変数だけを有効にしてもキャッシュは使用されません。4.1.5 では両方のデフォルト値が `true` に変更されました。アップグレード後は、明示的な設定と永続化されたグローバル変数を確認してください。パス、容量、制限については[File Cache](../../compute-storage-decoupled/file-cache/file-cache.md)を参照してください。

### `external_scan_consistent_hash_spread_num` {#external_scan_consistent_hash_spread_num}

このオプションは、外部スプリットの分散をサポートする開発ビルド向けです。同じリモートファイルのスプリットについて独立して計画されたクエリを、対象となる複数のバックエンドに分散し、スキャン負荷が特定のバックエンドに集中し続ける状況を緩和できます。

| 項目 | 値 |
| --- | --- |
| 型 | Integer |
| デフォルト値 | `1` |
| 有効な値 | `0` から `2147483647` |
| 適用範囲 | セッション。`SET GLOBAL` は新しいセッションに適用されます |

| 値 | 動作 |
| --- | --- |
| `1`（デフォルト） | 従来のスケジューリング方式、設定済みの候補数、グローバルなスプリット再分配を維持します。スキャンをバックエンド台数 `1` に制限するわけでは**ありません**。 |
| `0` | クエリのコンピュートグループ内で、対象となるすべてのバックエンドへの自動分散を有効にします。`enable_file_cache` または `use_consistent_hash_for_external_scan` が有効な場合はコンシステントハッシュを使用し、それ以外の場合はランダム方式を使用します。 |
| `N > 1` | ファイルキャッシュまたはコンシステントハッシュが有効な場合、対象バックエンドの台数を上限として、最大 N 個の異なるコンシステントハッシュ候補内に分散します。それ以外の場合はラウンドロビン方式のスケジューリングを維持します。 |

```sql
-- Enable automatic spreading for this session, without requiring file cache or hash scheduling.
SET external_scan_consistent_hash_spread_num = 0;

-- Limit the hash candidate set. This does not require the cluster to have exactly three backends.
SET use_consistent_hash_for_external_scan = true;
SET external_scan_consistent_hash_spread_num = 3;

-- Preserve the original scheduling.
SET external_scan_consistent_hash_spread_num = 1;
-- Restore the compiled default, also 1.
UNSET VARIABLE external_scan_consistent_hash_spread_num;
```

分散モードでは、このクエリのスケジューリング方針によって割り当て済みのスキャン負荷が最も小さい候補を選びます。同点の場合は一様ランダムに選びます。各スプリットの割り当ては一度だけ行われます。稼働中のバックエンドの CPU 使用率を基準に選ぶわけではなく、スループットの向上率も保証しません。ファイルのデータロードとスキーマスキャンの動作は変わりません。

分散モードで最適化されたローカルスケジューリングが有効な場合、リモートからアクセス可能なスプリットは、ホストヒントに一致するバックエンドの割り当て済みスキャン負荷が、対象となるすべてのバックエンドの最小値以下であるときに限り、そのバックエンドを優先します。それ以外の場合は、設定されたスケジューリング方式に従います。このローカル優先により、リモートスプリットのハッシュ候補に含まれないバックエンドが選ばれる場合があります。リモートからアクセスできないスプリットには、引き続き必要なホストに一致するバックエンドを使用する必要があります。

分散を有効にすると、後続のグローバルなスプリット再分配が無効になります。そのため、割り当て先は各スプリットの対象候補とローカリティの制約内に収まります。複数のスプリットがある場合、負荷分散は各スプリットの候補内に限られ、従来のグローバル再分配より偏ることがあります。

このオプションはファイルキャッシュを有効にしません。ファイルキャッシュが有効な場合、`0` を指定すると対象となるすべてのバックエンドにキャッシュコピーが作られ、ウォームアップ時の読み取り量とキャッシュの使用量が増える可能性があります。N を明示的に指定するとリモートスプリットのハッシュ候補が制限されますが、ローカリティの優先が適用されます。キャッシュのレプリカを事前に作成することはありません。まず `1` を使用し、繰り返し実行するクエリが負荷の高いバックエンドに集中する一方で、ほかの対象バックエンドに余力がある場合に分散を有効にしてください。同じクエリ、キャッシュの状態、リソースを使って両方のモードを比較してください。

アップグレード時には、永続化されたグローバル値が維持されます。コンパイル時のデフォルト値を変更しても、保存済みのグローバル値 `0` はリセットされません。新しいセッションで従来のスケジューリングを維持するには、`SET GLOBAL external_scan_consistent_hash_spread_num = 1` を使用してください。既存のセッションでは、セッション値を別途変更する必要があります。負の値、整数以外の値、範囲外の値は拒否されます。

### `enable_file_scanner_v2` {#enable_file_scanner_v2}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

外部ファイルのスキャンに File Scanner V2 を使用するかどうかを指定します。有効な場合、`FileScanNode` は対応するクエリで新しいネイティブスキャンエンジンを使用します。対象には Parquet、ORC、CSV、JSON の形式と、Hive、Iceberg、Paimon、Hudi のテーブル形式が含まれます。JDBC カタログと Iceberg のシステムテーブルには、引き続き従来のスキャン経路が使用されます。

クエリの問題が新しいスキャナーに関係している疑いがある場合は、`false` に設定して動作を比較してください。[データレイクのクエリチューニング](../../lakehouse/best-practices/optimization.md)を参照してください。

### `enable_expr_zonemap_filter` {#enable_expr_zonemap_filter}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

この変数に従うスキャナーで、式に対する ZoneMap フィルタリングを制御します。

File Scanner V2 は常に安全な方式で式に対する ZoneMap フィルタリングを実行するため、この変数の影響を受けません。

### `enable_runtime_filter_partition_prune` {#enable_runtime_filter_partition_prune}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で意味を変更 |

この変数に従うスキャナーで、ランタイムフィルターによるパーティションの枝刈りを制御します。

4.1.4 以降、File Scanner V2 は常に安全な方式でパーティションの枝刈りを実行するため、この変数を `false` に設定しても File Scanner V2 には影響しません。

## クエリの計画と実行 {#query-planning-and-execution}

### `enable_nereids_distribute_planner` {#enable_nereids_distribute_planner}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 でアップグレード時の動作を変更 |

Nereids 分散プランナーを使用するかどうかを指定します。

開発版でのデフォルト値は `true` です。分散プランナーを明示的に無効にするには、`SET GLOBAL enable_nereids_distribute_planner = false;` を実行し、現在のセッションも別途設定してください。4.1 シリーズのバージョン移行時の動作は開発版と異なります。アップグレードによって保存済みのグローバル設定が必ず上書きされるとは限りません。

### `runtime_filter_broadcast_join_producer_num` {#runtime_filter_broadcast_join_producer_num}

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト値 | `3` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合の各ランタイムフィルターについて、生成元となる BE の最大数を指定します。`0` 以下の値を指定すると、上限がなくなります。

ブロードキャスト結合では、ビルド側の各 BE が同じ内容のランタイムフィルターを生成します。そのため、生成元の数を制限すると、大規模なクラスターでは RPC のオーバーヘッドを大幅に削減できます。この設定が影響するのは Nereids の分散計画経路だけで、従来の Coordinator 経路の動作は変わりません。

### `runtime_filter_tree_publish_max_send_bytes` {#runtime_filter_tree_publish_max_send_bytes}

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト値 | `268435456`（256 MB） |
| バージョン | 4.1.4 で追加 |

グローバルランタイムフィルターを配信する際に、単一の RPC で送信する最大バイト数を指定します。このしきい値を超えると、Doris はツリー方式の多段階配信に切り替え、マージノードが同じ大きなフィルターをすべてのスキャンノードに送信することを避けます。

`0` を指定するとツリー方式の配信が無効になり、直接配信に戻ります。値は `0` 以上である必要があり、それ以外の場合は設定に失敗します。

### `bucket_shuffle_downgrade_ratio` {#bucket_shuffle_downgrade_ratio}

| 項目 | 値 |
| --- | --- |
| 型 | Double |
| デフォルト値 | `0.8` |
| バージョン | 4.1.4 で追加（実験的機能） |

ベーステーブル側のバケット総数がインスタンス総数にこの比率を掛けた値より小さい場合、バケットシャッフル結合を通常のシャッフル結合に切り替えます。`0` 以下の値では切り替えを行いません。デフォルト値の `0.8` では従来の動作が維持されます。

### `enable_local_exchange_before_agg` {#enable_local_exchange_before_agg}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

集約演算子の前にローカルエクスチェンジを挿入するかどうかを指定します。

:::caution
この設定を無効にすることは推奨されません。4.1.4 より前は、この動作を無効にすると、シリアルまたはハッシュを使用しないローカルエクスチェンジで**誤った結果**が返される場合がありました。この問題は 4.1.4 で修正されました。
:::

### `enable_local_exchange_before_streaming_agg` {#enable_local_exchange_before_streaming_agg}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.4 で追加 |

ストリーミング集約演算子の前にローカルエクスチェンジを挿入するかどうかを指定します。

### `eager_aggregation_on_broadcast_join` {#eager_aggregation_on_broadcast_join}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合で早期集約（集約のプッシュダウン）を許可するかどうかを指定します。

### `eager_agg_broadcast_row_count` {#eager_agg_broadcast_row_count}

| 項目 | 値 |
| --- | --- |
| 型 | Int |
| デフォルト値 | `250000` |
| バージョン | 4.1.4 で追加 |

ブロードキャスト結合に早期集約を適用するかどうかの判断に使用する行数のしきい値です。

### `force_eager_agg_hint` {#force_eager_agg_hint}

| 項目 | 値 |
| --- | --- |
| 型 | String |
| デフォルト値 | `""`（空文字列） |
| バージョン | 4.1.4 で追加 |

一致した場合に早期集約のプッシュダウンを強制するヒントです。テストとデバッグを目的としています。
**本番環境での使用は推奨されません。**

形式は `<func>:<qualifier.column | *>=<push|nopush>` で、各エントリを `;` で区切ります。

```sql
SET force_eager_agg_hint = 'sum:t1.a=push; sum:t2.a=nopush; count:*=push';
```

エントリは集約関数ごとに照合されますが、効果は個々の集約関数に独立して適用されるのではなく、現在のプッシュダウン候補の分岐またはサブツリーに適用されます。分岐内で一致したエントリに `nopush` が含まれる場合、その分岐はプッシュダウンされません。それ以外で `push` が含まれる場合、その分岐のプッシュダウンが強制されることがあり、同じ分岐内のほかの集約もその分岐単位の判断に従います。

### `force_forward_all_queries` {#force_forward_all_queries}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.4 で追加 |

有効にすると、現在のセッションのすべてのクエリが Master FE に転送されます。Master FE とフォロワー FE の間でメタデータに不整合があることが原因の問題を診断する際に役立ちます。この変数は、同名の FE 設定項目に対応するセッション単位の設定です。

## キャッシュ {#cache}

### `file_cache_query_limit_bytes` {#file_cache_query_limit_bytes}

| 項目 | 値 |
| --- | --- |
| 型 | Long（バイト） |
| デフォルト値 | `-1` |
| バージョン | 4.1.4 で追加 |

単一のクエリが各 BE でリードスルーによってファイルキャッシュに書き込める、リモートスキャンの最大バイト数を指定します。

- `0` 未満：制限なし（機能は無効）。
- `0` と等しい：そのクエリはファイルキャッシュに書き込みません。
- `0` より大きい：リモートスキャンの累積データ量がこのしきい値に達すると、そのクエリはファイルキャッシュへの書き込みを停止します。

一度限りの大規模スキャンによって、頻繁に使われるデータがキャッシュから追い出されるのを防ぐために使用します。

### `enable_topn_lazy_mat_phase2_no_write_file_cache` {#enable_topn_lazy_mat_phase2_no_write_file_cache}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.4 で追加 |

有効にすると、TopN の遅延マテリアライゼーションのフェーズ 2 の読み取りでファイルキャッシュにヒットしなかった場合、リモートストレージから直接読み取り、**キャッシュにない範囲をファイルキャッシュに書き戻しません**。フェーズ 2 の読み取りがランダムで、キャッシュのヒット率が低い場合に役立ちます。

## AI 関数 {#ai-functions}

### `file_presigned_url_ttl_seconds` {#file_presigned_url_ttl_seconds}

| 項目 | 値 |
| --- | --- |
| 型 | Long（秒） |
| デフォルト値 | `3600` |
| バージョン | 4.1.4 で追加 |

マルチモーダルの `EMBED()` で、S3 互換ストレージ内のオブジェクトに対して生成される署名付き URL の有効期間です。メディアファイルが大きく、プロバイダーによる取得に時間がかかる場合は、この値を増やしてください。[EMBED](../sql-functions/ai-functions/distance-functions/embed.md)を参照してください。

## Profile と結果の出力 {#profile-and-result-output}

### `profile_level` {#profile_level}

| 項目 | 値 |
| --- | --- |
| 型 | Integer（`1`、`2`、`3` のいずれか） |
| デフォルト値 | `2` |
| バージョン | 4.1.5 で転送時の動作を修正 |

Query Profile の詳細度を制御します。`1` ではマージされたカウンターを収集し、`2` では詳細情報を出力し、`3` ではパフォーマンスに影響する可能性がある追加のカウンターを有効にします。4.1.5 以降、Master FE に転送されたクエリでも現在のセッションのレベルが維持されます。[Query Profile](../../query-acceleration/query-profile.md)を参照してください。

### `return_object_data_as_binary` {#return_object_data_as_binary}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `false` |
| バージョン | 4.1.5 で SQL Cache における区別を修正 |

MySQL の結果で HLL、BITMAP、QUANTILE_STATE オブジェクトの生のバイナリデータを返すかどうかを指定します。`false` の場合、これらの値は NULL として返されます。4.1.5 以降、この変数の値によって SQL の結果キャッシュのエントリが区別されるため、バイナリ出力を有効にしたセッションが、無効にしたセッションによってキャッシュされた NULL の結果を再利用することを防ぎます。

## 正規表現 {#regular-expressions}

### `enable_hyperscan_fallback` {#enable_hyperscan_fallback}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| バージョン | 4.1.5 で追加 |

Hyperscan がパターンをコンパイルできない場合に RE2 にフォールバックするかどうかを指定します。`true` の場合、Doris は RE2 を試します。`false` の場合は、Hyperscan のコンパイルエラーを返します。フォールバックしても、RE2 自体がサポートしていない構文を使用できるようにはなりません。この変数が制御する経路は、高度な Boost.Regex 構文を有効にする `enable_extended_regex` とは異なります。[REGEXP](../sql-functions/scalar-functions/string-functions/regexp.md)を参照してください。

## 削除された変数 {#removed-variables}

| 変数 | 削除されたバージョン | 備考 |
| --- | --- | --- |
| `eager_aggregation_on_join` | 4.1.4 | 集約のプッシュダウン方式が見直されました。代わりに `eager_aggregation_on_broadcast_join` と `eager_agg_broadcast_row_count` を使用してください。この変数を設定しているスクリプトがあれば、削除してください |
| `plan_nereids_dump` | 4.1.4 | 現在は minidump の再生中にのみ有効になる内部状態です。`SET` では設定できなくなりました |
