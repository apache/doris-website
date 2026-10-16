---
{
    "title": "ピアキャッシュ読み取り: 他の BE やコンピュートグループの File Cache を読み取る（コンピュートとストレージの分離）",
    "sidebar_label": "ピアキャッシュ読み取り",
    "language": "ja",
    "description": "ローカル File Cache にないデータを、オブジェクトストレージにフォールバックする前に、別のコンピュートグループを含む他の BE から取得する方法。デフォルト設定、キャッシュへの格納、パラメータ、トラブルシューティングを説明します。",
    "keywords": ["ピアキャッシュ読み取り", "ピア読み取り", "コンピュートグループ間のキャッシュ", "File Cache のミス", "キャッシュミス時のフォールバック", "コールドリード", "低速なコールドクエリ", "コンピュートグループのスケーリング", "peer_read_async_warmup", "enable_cache_read_from_peer", "peer_cache_fill_compute_group_id", "グループ間のキャッシュへの格納", "ピアと S3 の競合", "AZ 間トラフィック", "コンピュートとストレージの分離"]
}
---

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Cold read optimization in compute-storage decoupled mode / Compute group scaling / Cache reuse across compute groups -->

ピアキャッシュ読み取りは、コンピュートとストレージを分離した構成で、File Cache にデータがない場合の読み取り方法です。BE のローカル File Cache にブロックがないとき、同じコンピュートグループまたは別のコンピュートグループにある他の BE の File Cache に問い合わせます。どのピアにもブロックがなければ、オブジェクトストレージから読み取ります。この機能が影響するのはコールドリードの経路だけで、ローカルキャッシュにヒットする読み取りは変わりません。

:::caution 実験的な機能

ピアキャッシュ読み取りは Doris 4.2.0 から利用できる実験的な機能で、デフォルトで有効です。無効にするには、BE で `enable_cache_read_from_peer = false` を設定します。

:::

## ユースケース

<!-- Knowledge type: Architecture decision -->

| シナリオ | ピア読み取りの動作 | 利点 |
|---|---|---|
| コンピュートグループ内でのスケーリング | スケールアウトまたはタブレットのリバランス後、新しい BE の最初の読み取りでは、オブジェクトストレージではなく、以前そのタブレットを処理していた BE からキャッシュ済みブロックを取得します | リバランス後の性能低下を短縮し、オブジェクトストレージへのアクセスを減らせます |
| コンピュートグループ間のコールドリード | このコンピュートグループにキャッシュがなくても、別のグループが同じデータをすでに読み取っていれば、そのグループの BE からブロックを取得します | コールドクエリのレイテンシーとオブジェクトストレージからの読み取りを減らせます |
| グループ間のキャッシュへの格納 | 「格納先コンピュートグループ」を指定します。そのグループの BE にもブロックがない場合、その BE がオブジェクトストレージからブロックを取得し、自身の File Cache に書き込んでから、要求元の BE に返します | 指定したグループがオブジェクトストレージへのアクセス負荷を引き受け、キャッシュにコピーを保持します |

## 性能の目安

TPC-H の 1 TB データセットを使ったコールドリードのテストでは、ピアキャッシュ読み取りはオブジェクトストレージからの直接読み取りの約二倍の速度でした。実際の効果は、他の BE がすでにデータを保持しているかどうか、およびピア間ネットワークのレイテンシーとオブジェクトストレージのレイテンシーの差によって変わります。

## 前提条件

- コンピュートとストレージを分離したデプロイメント。統合モードではピア読み取りは機能しません。
- すべての BE で File Cache が有効であること（`enable_file_cache = true`）。
- `enable_cache_read_from_peer` をデフォルト値の `true` のままにすること。
- グループ間のキャッシュへの格納を使う場合は、格納先コンピュートグループの ID（`compute_group_id`）。確認方法は[格納先コンピュートグループの指定](#designating-a-fill-compute-group)を参照してください。

## 制限事項

- Doris の内部テーブルだけをサポートします。外部テーブル（Hive、Iceberg など）のデータキャッシュではピア読み取りを使用しません。
- ピア読み取りはローカル File Cache にデータがない場合にだけ実行されます。ウォームアップジョブによる読み取り、および格納先サーバーが自身のために行うオブジェクトストレージからの読み取りは、再度ピア読み取りを経由しません。
- `enable_cache_read_from_peer` は、同じグループ内とグループ間の両方のピア読み取りを制御します。**現在、同じグループ内のピア読み取りを有効にしたまま、グループ間のピア読み取りだけを無効にすることはできません。** 候補は FE から取得され、他のコンピュートグループの BE も含まれます。
- 格納先サーバーは、小さいファイルのマージによって生成されたファイル（Packed File）にまだ対応していません。これらの要求は通常どおりオブジェクトストレージにフォールバックします。
- 複数の AZ にまたがるデプロイメントでは、グループ間のピア読み取りによって AZ 間のネットワークトラフィックが発生し、追加料金がかかる場合があります。
- ピア読み取りはベストエフォートです。ピアから読み取るかどうか、どの BE から読み取るかは、候補リスト、タイムアウト、フォールバックのロジックによって決まります。

## 動作の仕組み

<!-- Knowledge type: Architecture principle -->
<!-- Applicable scenarios: Performance analysis / Expected behavior -->

![ピアキャッシュ読み取りの流れ: ローカル File Cache にデータがない場合、ピアからの読み取りとオブジェクトストレージからの読み取りを競わせ、先に返った結果をローカルキャッシュに書き込む](/images/next/compute-storage-decoupled/peer-cache-read-flow.jpg)

### 読み取り経路

1. クエリがブロックを読み取る際、まずローカル File Cache を確認し、ヒットすればそのデータを返します。
2. キャッシュミスの場合、BE はそのタブレットのピア候補をすでに保持しているか確認します。候補がなければ、この読み取りはオブジェクトストレージに直接進み、BE はバックグラウンドで FE に候補を問い合わせます。現在の要求は候補の取得を待ちません。
3. 候補がある場合、ピアからの読み取りとオブジェクトストレージからの読み取りを競わせます（`enable_peer_s3_race` はデフォルトで有効です）。BE は先にピア読み取りを送信し、`peer_race_hedge_delay_ms`（デフォルト 20 ms）だけ先行させます。この時間内にピアが応答すれば、オブジェクトストレージへの読み取りは送信されません。
4. 先に結果を返した方が採用されます。どちらの場合もデータはローカル File Cache に書き込まれるため、以降の読み取りはローカルでヒットします。
5. ピア読み取りが失敗した場合、オブジェクトストレージにフォールバックし、クエリはエラーになりません。失敗には、候補がブロックを持っていない場合、RPC エラー、同時実行枠が満杯の場合、タイムアウトが含まれます。

`enable_peer_s3_race` が無効の場合、または同時に競合する読み取りの数が `max_concurrent_peer_races`（デフォルト 64）を超えた場合、BE は代わりに順次読み取ります。候補を一つずつ試し、すべて失敗した後にだけオブジェクトストレージから読み取ります。

通常、コールドクエリは多数の読み取りを並行して実行します。セグメントフッターの最初の読み取りで候補の取得がすでに始まるため、同じクエリ内で同じタブレットを後から読み取るときは、ピア読み取りを使用できます。最初のコールドリードがオブジェクトストレージに進むのは想定どおりの動作です。

### 候補の取得元

| 取得元 | 説明 | 優先順位 |
|---|---|---|
| リバランス元の BE | コンピュートグループのスケールアウトまたはタブレットのリバランス中、FE が移動先 BE に送るウォームアップ要求によって、移動元 BE が候補として記録されます。`balance_type` が `without_warmup` に設定されている場合、ウォームアップ要求は送信されず、候補も記録されません | 最高 |
| FE が返すタブレットの配置情報 | ローカルの候補がない場合、BE は各コンピュートグループでそのタブレットを保持する BE をバックグラウンドで FE に問い合わせ、リストの末尾に追加します | 低い |
| 手動設定 | HTTP インターフェース `/api/peer_cache?op=set` から書き込みます（[タブレットのピア情報の確認と調整](#inspecting-and-adjusting-the-peer-info-of-a-tablet)を参照）。通常、テストやトラブルシューティングにだけ使用します | 書き込んだ順序 |

### 候補の選択とローテーション

- BE は各タブレットを最後に正常に処理したコンピュートグループを記憶し、そのグループの候補を最初に試します。
- ブロックを持たない候補はリストの末尾に移されるため、次の読み取りでは別の候補を試します。RPC が `peer_rpc_failure_eviction_threshold`（デフォルト 3）回連続で失敗した候補は除外されます。
- すべての候補でキャッシュミスが発生する読み取りが `peer_all_miss_cooldown_threshold`（デフォルト 5）回連続すると、タブレットは `peer_all_miss_cooldown_duration_s`（デフォルト 300 秒）のクールダウンに入ります。クールダウン中、そのタブレットの読み取りはオブジェクトストレージに直接進みます。
- `peer_candidate_expiry_s`（デフォルト 3600 秒）の間使われていない候補エントリはメモリから削除されます。次のキャッシュミス時に FE から再取得します。

### グループ間のキャッシュへの格納

要求元 BE に `peer_cache_fill_compute_group_id` が設定されていて、選ばれた候補がそのコンピュートグループに属する場合、要求には格納フラグが付けられます。受信側 BE にブロックがなく、`enable_peer_server_cache_fill` が有効（デフォルト）なら、オブジェクトストレージからブロックを読み取り、自身の File Cache に書き込んでから返します。

格納処理には `max_concurrent_peer_server_fills`（デフォルト 32）と `peer_server_cache_fill_timeout_ms`（デフォルト 6000 ms）の上限があります。上限に達した場合やタイムアウトした場合、要求元 BE はオブジェクトストレージにフォールバックします。

## 設定

<!-- Knowledge type: Operations -->
<!-- Applicable scenarios: BE configuration / Bringing a compute group online -->

以下のパラメータはすべて BE の設定項目です。スレッドプールのパラメータを除き、実行時に変更できます。[実行時のパラメータ変更](#changing-parameters-at-runtime)を参照してください。

### ピア読み取りの確認と無効化

ピア読み取りはデフォルトで有効です。File Cache が有効になれば、同じグループ内とグループ間のどちらの読み取りでも動作します。FE が候補を自動的に提供します。MySQL クライアントから現在の値を確認します。

```sql
SHOW BACKEND CONFIG LIKE 'enable_cache_read_from_peer';
```

無効にするには、すべての BE の `be.conf` に次の設定を追加します。

```properties
enable_cache_read_from_peer = false
```

無効にすると、ローカルでのキャッシュミスはオブジェクトストレージに直接進み、`peer_read_async_warmup` などのピア読み取りに依存するバランス戦略は効果を失います。

### 格納先コンピュートグループの指定 {#designating-a-fill-compute-group}

グループ間のコールドリード時に特定のコンピュートグループがオブジェクトストレージからデータを取得し、自身のキャッシュに格納するには、次の三つの手順を実行します。

1. 対象のコンピュートグループの ID を確認します。`compute_group_id` は `Tag` 列にあり、`SHOW BACKENDS` で確認できます。`compute_group_name` ではありません。

    ```sql
    SHOW BACKENDS\G
    ```

    ```text
    *************************** 1. row ***************************
              BackendId: 10001
                   Host: 10.0.0.1
                    ...
                    Tag: {"cloud_unique_id" : "1:xxx:yyy", "compute_group_id" : "cg_write_01", "compute_group_name" : "write_group", "compute_group_status" : "NORMAL", "location" : "default"}
    ```

2. クエリを実行するコンピュートグループのすべての BE に、次のように設定します。

    ```properties
    peer_cache_fill_compute_group_id = cg_write_01
    ```

3. 格納先コンピュートグループの BE で、`enable_peer_server_cache_fill` が `true`（デフォルト）であることを確認します。

### 実行時のパラメータ変更 {#changing-parameters-at-runtime}

スレッドプールのパラメータを除き、このページのすべてのパラメータは実行時に変更できます。`persist=true` を追加すると、変更が `be_custom.conf` に永続化されます。

```bash
curl -X POST "http://<be_host>:<be_webserver_port>/api/update_config?enable_cache_read_from_peer=false&persist=true"
curl -X POST "http://<be_host>:<be_webserver_port>/api/update_config?peer_race_hedge_delay_ms=30"
```

## パラメータ

<!-- Knowledge type: Configuration reference -->

### 有効化と競合読み取り

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `enable_cache_read_from_peer` | `true` | ピア読み取りの主スイッチ。有効な場合、ローカル File Cache にデータがなければ、同じコンピュートグループ内と別のコンピュートグループの両方で他の BE を最初に試します |
| `enable_peer_s3_race` | `true` | ピア読み取りとオブジェクトストレージからの読み取りを競わせるかどうか。無効な場合は順次読み取ります。候補を一つずつ試し、すべて失敗した後にだけオブジェクトストレージから読み取ります |
| `peer_race_hedge_delay_ms` | `20` | ピア読み取りを先行させる時間（ミリ秒）。この時間内にピアが応答すれば、オブジェクトストレージへの読み取りは送信されません。`0` なら両方を同時に開始します |
| `max_concurrent_peer_races` | `64` | 一台の BE で同時に実行できる競合読み取りの最大数。上限を超えたキャッシュミスは順次処理されます |

### キャッシュへの格納の設定

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `peer_cache_fill_compute_group_id` | `""` | 要求元に設定します。格納処理を担当するコンピュートグループの ID（名前ではなく `compute_group_id`）。選ばれた候補がこのグループに属する場合、要求に格納フラグが付けられます |
| `enable_peer_server_cache_fill` | `true` | 提供側に設定します。格納フラグ付きの要求を受け入れるかどうか。有効な場合、ブロックがローカルにキャッシュされていなければ、オブジェクトストレージから読み取り、ローカル File Cache に書き込んで返します |
| `peer_server_cache_fill_timeout_ms` | `6000` | 提供側での一回の格納処理の最大待機時間（ミリ秒）。タイムアウトすると要求元はオブジェクトストレージにフォールバックします |
| `max_concurrent_peer_server_fills` | `32` | 提供側で同時に実行できる格納処理の最大数。上限を超えた要求は拒否され、要求元はオブジェクトストレージにフォールバックします |

### 候補の管理

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `peer_rpc_failure_eviction_threshold` | `3` | RPC がこの回数連続で失敗すると候補を除外します |
| `peer_all_miss_cooldown_threshold` | `5` | すべての候補でキャッシュミスが発生する読み取りが何回連続すると、タブレットがクールダウンに入るかを指定します |
| `peer_all_miss_cooldown_duration_s` | `300` | クールダウンの長さ（秒）。クールダウン中、そのタブレットの読み取りはオブジェクトストレージに直接進みます |
| `peer_candidate_expiry_s` | `3600` | 最後に使用してから候補エントリが失効するまでの時間（秒）。失効したエントリは削除され、次のキャッシュミス時に FE から再取得されます |
| `peer_candidate_cleanup_interval_s` | `3600` | 失効した候補を削除するバックグラウンドジョブの実行間隔（秒） |

### スレッドプールとキュー

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `peer_fetch_queue_timeout_ms` | `100` | 提供側の設定。ピア読み取り要求が処理キューでこの時間（ミリ秒）を超えて待機すると拒否され、要求元はすぐにオブジェクトストレージにフォールバックします |
| `brpc_peer_fetch_pool_threads` | `-1` | 提供側の設定。ロードなどの負荷の高い RPC とは分離して、ピア読み取り要求を処理するスレッド数。`-1` は `max(64, 2 × CPU cores)` を意味します。静的な設定で、変更には BE の再起動が必要です |
| `brpc_peer_fetch_pool_max_queue_size` | `-1` | そのスレッドプールのキュー長。`-1` は `max(4096, 128 × CPU cores)` を意味します。静的な設定です |
| `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num` | `0` / `32` | 要求元の設定。競合読み取り中にオブジェクトストレージから読み取るスレッドプールのサイズ。静的な設定です |

## 副作用と注意事項

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Evaluating compute group isolation / Cost evaluation -->

グループ間のピア読み取りを有効にすると、コンピュートグループ間の分離が弱まります。あるグループのクエリが別のグループのネットワーク、ディスク、File Cache の読み取り容量を使います。格納処理を設定した場合は、別のグループがそのクエリのためにオブジェクトストレージの帯域幅も消費します。クエリが消費するリソースは、そのクエリ自身のコンピュートグループ内に収まらなくなります。

格納処理では提供側 BE のローカル File Cache にデータを書き込むため、その BE 自身のホットデータが追い出されることがあります。

競合読み取りを有効にすると、一部のキャッシュミスではピア RPC とオブジェクトストレージからの読み取りが短時間、両方発生します。20 ms の先行時間はこの重複を減らしますが、なくすことはできません。

ピアへのヒットは保証されません。提供側の同時実行枠や格納処理枠が満杯の場合、ブロックがない場合、タイムアウトした場合は、いずれもオブジェクトストレージにフォールバックします。競合読み取りが有効なら、通常、コールドクエリはオブジェクトストレージからの直接読み取りより遅くなりませんが、必ず速くなるわけでもありません。

複数の AZ にまたがるデプロイメントでは、グループ間のピア読み取りに AZ 間トラフィックの料金がかかります。

## 観測とトラブルシューティング

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Confirming that peer read is working / Diagnosing slow cold reads -->

### クエリプロファイルのカウンター

ピア読み取りのカウンターは、プロファイルの `SegmentIterator` ノードで、他の File Cache カウンターの隣に表示されます。プロファイルの取得方法と読み方は、[クエリプロファイル](../../query-acceleration/query-profile)を参照してください。

| カウンター | 意味 | 確認できること |
|---|---|---|
| `NumPeerIOTotal` | ピアから提供された読み取りの回数 | クエリがピア読み取りを使用したかどうか |
| `PeerIOUseTimer` | ピア読み取り経路にかかった合計時間 | ピア読み取り経路自体が遅いかどうか |
| `SameCGPeerIOTotal` / `SameCGPeerBytesRead` / `SameCGPeerIOTime` | 同じグループ内のピア読み取りの回数、バイト数、時間 | ピア読み取りの大半がコンピュートグループ内に収まっているかどうか |
| `CrossCGPeerIOTotal` / `CrossCGPeerBytesRead` / `CrossCGPeerIOTime` | グループ間のピア読み取りの回数、バイト数、時間 | グループ間の読み取りが発生したか、どれだけのトラフィックが生じたか |
| `PeerRaceWin` / `S3RaceWin` | ピアまたはオブジェクトストレージが競合読み取りで勝った回数。`enable_peer_s3_race = true` の場合にだけ意味があります | `S3RaceWin` が大幅に多い場合、この環境ではピアの方が速い経路ではないことを示します |
| `PeerLazyFetch` / `PeerLazyFetchTime` | タブレットに候補がなかったときに実行された、FE からのバックグラウンド候補取得の回数と時間 | 最初の読み取りがピアに進まなかった理由を確認できます |
| `PeerCacheNodes` | クエリが実際に読み取ったピアノード | データの取得元 BE を確認できます |

`InvertedIndexNumPeerIOTotal` / `InvertedIndexPeerIOUseTimer` と `SegmentFooterIndexNumPeerIOTotal` / `SegmentFooterIndexPeerIOUseTimer` は、転置インデックスファイル、およびセグメントフッターと内部インデックスについて、ピア読み取りの回数と時間を計測します。インデックスの読み取りでもピアにヒットしたか確認できます。

### BE の bvar メトリクス

`curl http://<be_host>:<brpc_port>/vars` で取得します（`brpc_port` のデフォルトは 8060）。要求元（読み取りを発行する BE）のメトリクスは次のとおりです。

| メトリクス | 意味 |
|---|---|
| `cached_remote_reader_peer_read` | 発行されたピア読み取りの回数 |
| `cached_remote_reader_s3_read` | 発行されたオブジェクトストレージからの読み取りの回数 |
| `peer_race_peer_win` / `peer_race_s3_win` | ピアまたはオブジェクトストレージが競合読み取りで勝った回数 |
| `peer_same_compute_group_read` / `peer_cross_compute_group_read` | 成功した同じグループ内またはグループ間のピア読み取りの回数 |
| `peer_lazy_fetch_triggered` | FE からバックグラウンドで候補を取得した回数 |
| `peer_cache_reader_peer_latency` | ピア RPC のレイテンシー |

提供側（キャッシュを提供する BE）のメトリクスは次のとおりです。

| メトリクス | 意味 |
|---|---|
| `file_cache_get_by_peer_num` / `file_cache_get_by_peer_success_num` / `file_cache_get_by_peer_failed_num` | 受信したピア読み取り要求の回数と、その成功回数および失敗回数 |
| `file_cache_get_by_peer_queue_timeout_num` | キューで `peer_fetch_queue_timeout_ms` を超えて待機したために拒否された要求の回数 |
| `peer_server_fill_requested` / `peer_server_fill_success` | 要求された格納処理と完了した格納処理の回数 |
| `peer_server_fill_timeout` / `peer_server_fill_rejected` | タイムアウトした格納処理と、空き枠がないため拒否された格納処理の回数 |

読み方の例:

- `cached_remote_reader_peer_read` が多く、`cached_remote_reader_s3_read` が少ない: 全体としてピア読み取りが機能しています。
- `peer_race_s3_win` が `peer_race_peer_win` を明らかに上回る: この環境ではピアの方が速い経路ではありません。`peer_race_hedge_delay_ms` を増やすか、ピア読み取りを無効にします。
- `peer_cross_compute_group_read` が多い: グループ間のトラフィックが発生しています。分離への影響を確認してください。
- `peer_server_fill_requested` が多い一方、`peer_server_fill_success` が少なく、`peer_server_fill_timeout` が多い: 格納先コンピュートグループが過負荷か、設定が適切ではありません。

### タブレットのピア情報の確認と調整 {#inspecting-and-adjusting-the-peer-info-of-a-tablet}

BE は `/api/peer_cache` を `webserver_port`（デフォルト 8040）で公開し、一つのタブレットの候補を表示・変更できます。主にトラブルシューティング用のツールです。

一つのタブレットについて、候補、最後に成功したコンピュートグループ、連続キャッシュミス回数、クールダウン状態を表示します。

```bash
curl "http://<be_host>:<be_webserver_port>/api/peer_cache?op=show&tablet_id=<tablet_id>"
```

```json
{
    "tablet_id": 10086,
    "candidates": [
        {"host": "10.0.0.2", "brpc_port": 8060, "compute_group_id": "cg_write_01", "last_access_time_ms": 1758441600000, "consecutive_rpc_failures": 0}
    ],
    "last_successful_compute_group_id": "cg_write_01",
    "fetching_from_fe": false,
    "consecutive_all_miss": 0,
    "cooldown_until_ms": 0
}
```

この BE で候補を持つすべてのタブレットを一覧表示します。`limit` のデフォルトは 1000 です。

```bash
curl "http://<be_host>:<be_webserver_port>/api/peer_cache?op=show_all&limit=100"
```

タブレットの候補を強制的に設定します（JSON のリクエストボディ）。

```bash
curl -X POST "http://<be_host>:<be_webserver_port>/api/peer_cache?op=set&tablet_id=<tablet_id>" \
    -H "Content-Type: application/json" \
    -d '{
        "candidates": [
            {"host": "10.0.0.2", "brpc_port": 8060, "compute_group_id": "cg_write_01"}
        ],
        "last_successful_compute_group_id": "cg_write_01",
        "consecutive_all_miss": 0,
        "cooldown_until_ms": 0
    }'
```

タブレットの候補を削除するか、クールダウンを解除します。

```bash
curl -X POST "http://<be_host>:<be_webserver_port>/api/peer_cache?op=remove&tablet_id=<tablet_id>"
curl -X POST "http://<be_host>:<be_webserver_port>/api/peer_cache?op=reset_cooldown&tablet_id=<tablet_id>"
```

## ベストプラクティス

<!-- Knowledge type: Architecture decision -->

- [キャッシュのウォームアップ](./file-cache#cache-warmup)と併用します。ウォームアップは事前にオブジェクトストレージからデータを取得し、ピア読み取りはクエリの実行時に他の BE から取得します。既知のホットデータはウォームアップで準備し、ウォームアップされなかったコールドリードをピア読み取りで補います。
- スケーリング前からピア読み取りを有効にしておきます。スケールアウトまたはタブレットのリバランス後、新しい BE は移動元 BE のキャッシュを再利用できます。`balance_type = peer_read_async_warmup` と組み合わせると、マッピングがすぐに切り替わり、ピア読み取りが移行時の性能低下を和らげます。[コンピュートグループのスケーリング](../managing-compute-cluster#scale-compute-groups)を参照してください。
- 読み書き分離の構成では、書き込み用コンピュートグループを格納先グループにします。読み取り専用グループのコールドリードに応じて、書き込み用グループがオブジェクトストレージからデータを取得し、コピーを保持します。[読み書き分離における File Cache 最適化のベストプラクティス](../rw/file-cache-rw-compute-group-best-practice)を参照してください。
- コンピュートグループを厳密に分離する必要がある場合、またはクラスターが複数の AZ にまたがり、AZ 間トラフィックの料金が問題になる場合は、ピア読み取りを無効にします（`enable_cache_read_from_peer = false`）。
- 調整前にメトリクスを確認します。`PeerRaceWin` / `S3RaceWin` と bvar でピアが競合読み取りに勝っているか確認してから、`peer_race_hedge_delay_ms` を調整するか、競合読み取りを無効にするか判断します。

## よくある質問（FAQ）

<!-- Knowledge type: Troubleshooting -->

**Q: 最初のコールドリードがオブジェクトストレージに進んだのはなぜですか？**

BE がまだそのタブレットの候補を持っていない場合、現在の要求は FE からの取得を待ちません。バックグラウンドで候補を取得する間、オブジェクトストレージから読み取ります。同じクエリ内で同じタブレットを後から読み取る場合や、その後のクエリではピア読み取りを使用します。プロファイルで `PeerLazyFetch` が 0 より大きければ、このケースに該当します。

**Q: クエリがピア読み取りを使用したことを確認するには？**

プロファイルの `NumPeerIOTotal`、`SameCGPeerIOTotal`、`CrossCGPeerIOTotal`、`PeerCacheNodes` を確認します。BE でも `cached_remote_reader_peer_read` が増えているはずです。

**Q: コンピュートグループ内のピア読み取りだけを許可し、グループ間はブロックできますか？**

現在はできません。`enable_cache_read_from_peer` は両方のピア読み取りを制御し、FE が返す候補にはすべてのコンピュートグループの BE が含まれます。

**Q: ピア読み取りを無効にするには？**

すべての BE で `enable_cache_read_from_peer = false` を設定します。変更は実行時に適用できます。以降、ローカルでのキャッシュミスはオブジェクトストレージから直接読み取ります。

**Q: `S3RaceWin` が `PeerRaceWin` より大幅に多い場合はどうすればよいですか？**

この環境では、通常、ピア間ネットワークのレイテンシーが高いか、ピア BE が高負荷のため、ピアからの読み取りがオブジェクトストレージからの読み取りより速くありません。`peer_race_hedge_delay_ms` を大きくしてカウンターを確認するか、ピア読み取りを無効にします。

**Q: タブレットでピア読み取りがまったく使われません。**

`/api/peer_cache?op=show&tablet_id=<tablet_id>` を実行します。`candidates` リストが空なら、候補はまだ取得されていません。`cooldown_until_ms` がゼロ以外なら、そのタブレットはクールダウン中です。`op=reset_cooldown` で解除できます。

**Q: グループ間のキャッシュへの格納が機能しません。**

次の順に確認します。要求元の `peer_cache_fill_compute_group_id` が名前ではなくコンピュートグループの ID であること。選ばれた候補が実際にそのグループに属すること（`compute_group_id` を `op=show` の出力で確認）。格納先の `enable_peer_server_cache_fill` が `true` であること。`peer_server_fill_rejected` または `peer_server_fill_timeout` が増えていないかどうか。
