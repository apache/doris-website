---
{
    "title": "BE 設定",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "BE に関する設定項目について説明します。"
}
---

# BE 設定

このドキュメントでは、BE に関する設定項目について説明します。

BE の設定ファイル `be.conf` は通常、BE のデプロイ先にある `conf/` ディレクトリに配置されます。バージョン 0.14 では、別の設定ファイル `be_custom.conf` が導入されます。このファイルには、稼働中にユーザーが動的に設定し、永続化した設定項目が記録されます。

BE プロセスは起動後、まず `be.conf` の設定項目を読み込み、次に `be_custom.conf` の設定項目を読み込みます。`be_custom.conf` の設定項目は、`be.conf` 内の同じ項目を上書きします。

`be_custom.conf` の配置先は、`be.conf` の設定項目 `custom_config_dir` で指定できます。

## 設定項目の確認

BE の設定項目は、次の二つの方法で確認できます。

1. BE の Web ページ

    BE の Web ページにアクセスすると、現在の設定項目を確認できます。

    `http://be_host:be_webserver_port/varz`

2. コマンドでの確認

   MySQL クライアントで次のコマンドを実行すると、BE の設定項目を確認できます。SQL 構文については [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください。

    `SHOW BACKEND CONFIG;`

    結果の各列の意味は次のとおりです。

    1. BackendId: Backend の ID。
    2. Host: Backend の IP アドレス。
    3. Key: 設定項目の名前。
    4. Value: 現在の設定値。
    5. Type: 設定値の型。整数や文字列など。
    6. IsMutable: 動的に設定できるかどうか。true の場合は実行中に設定できます。false の場合は be.conf でのみ設定でき、BE の再起動後に反映されます。

## 設定項目の変更

BE の設定項目は、次の二つの方法で変更できます。

1. 静的設定

   `conf/be.conf` ファイルに設定項目を追加して値を指定します。`be.conf` の設定項目は BE の起動時に読み込まれます。`be.conf` にない項目にはデフォルト値が使用されます。

2. 動的設定

   BE の起動後、次のコマンドで設定項目を動的に変更できます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   バージョン 0.13 以前では、この方法で変更した設定は BE プロセスの再起動後に失われます。バージョン 0.14 以降では、次のコマンドで変更した設定を永続化できます。変更した設定項目は `be_custom.conf` ファイルに保存されます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## 例

1. `max_base_compaction_threads` を静的に変更する

   `be.conf` ファイルに次の行を追加します。

   ```max_base_compaction_threads=5```

   BE プロセスを再起動すると、設定が反映されます。

2. `streaming_load_max_mb` を動的に変更する

   BE の起動後、次のコマンドで設定項目 `streaming_load_max_mb` を動的に変更します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   設定が成功すると、次の値が返されます。

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   BE を再起動すると、この設定は失われます。変更を永続化するには、次のコマンドを使用します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## 設定項目

### サービス

#### `deploy_mode`

* 型: string
* 説明: BE の動作モード。`cloud` はコンピューティングとストレージを分離したモードを示します。
* デフォルト値: ""

#### `be_port`

* 型: int32
* 説明: FE からのリクエストを受け付ける BE の Thrift サーバーのポート。
* デフォルト値: 9060

#### `heartbeat_service_port`

* 型: int32
* 説明: FE からのハートビートを受け付ける BE のハートビートサービス（Thrift）のポート。
* デフォルト値: 9050

#### `webserver_port`

* 型: int32
* 説明: BE の HTTP サーバーのサービスポート。
* デフォルト値: 8040

#### `brpc_port`

* 型: int32
* 説明: BE 間の通信に使用する BRPC のポート。
* デフォルト値: 8060

#### `arrow_flight_sql_port`

* 型: int32
* 説明: Arrow Flight Client と BE の通信に使用する、BE 上の Arrow Flight SQL サーバーのポート。
* デフォルト値: -1

#### `enable_https`

* 型: bool
* 説明: HTTPS を有効にするかどうか。有効にする場合は、be.conf で `ssl_certificate_path` と `ssl_private_key_path` を設定します。
* デフォルト値: false

#### `priority_networks`

* 説明: 複数の IP アドレスを持つサーバーで使用するアドレスの選択規則。該当する IP は最大一つにしてください。10.10.10.0/24 のような CIDR 表記をセミコロンで区切って指定します。一致する IP がなければ、ランダムに一つ選択されます。
* デフォルト値: 空欄

#### `storage_root_path`

* 型: string

* 説明: データのルートパス。複数のパスは「;」で区切ります。各パスに HDD または SSD のストレージメディアを指定でき、末尾に「,」区切りで容量上限も追加できます。SSD と HDD を混在させない場合、以下の例 1、例 2 の形式は不要で、ストレージディレクトリだけを指定します。FE のデフォルトのストレージメディア設定も変更する必要はありません。

  例 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1./home/disk1/doris.HDD は、ストレージメディアが HDD であることを示します。
    - 2./home/disk2/doris.SSD は、ストレージメディアが SSD であることを示します。
    - 3./home/disk2/doris は、デフォルトでストレージメディアが HDD であることを示します。

  例 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1./home/disk1/doris,medium:hdd は、ストレージメディアが HDD であることを示します。
    - 2./home/disk2/doris,medium:ssd は、ストレージメディアが SSD であることを示します。

* デフォルト値: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count`

* 型: int32
* 説明: BE のハートビートサービスを実行するスレッド数。デフォルトは 1 で、変更は推奨されません。
* デフォルト値: 1

#### `ignore_broken_disk`

* 型: bool
* 説明: BE の起動時に、``storage_root_path`` に設定されたすべてのパスを確認します。

    -  `ignore_broken_disk=true`

  パスが存在しない場合、またはパス上のファイル（障害のあるディスク）を読み書きできない場合は、そのパスを無視します。ほかに利用可能なパスがあれば、起動は中断されません。

    -  `ignore_broken_disk=false`

  パスが存在しない場合、またはパス上のファイル（障害のあるディスク）を読み書きできない場合は、起動を中止して終了します。

* デフォルト値: false

#### `mem_limit`

* 型: string
* 説明: BE プロセスが使用するサーバーの最大メモリの割合を制限します。BE がマシンのメモリを過度に使用するのを防ぎます。値は 0 より大きくする必要があります。100% を超える割合は 100% として扱われます。
* デフォルト値: 90%

#### `cluster_id`

* 型: int32
* 説明: BE が属するクラスターの ID を設定します。
    - 通常、この値は FE からのハートビートで BE に渡されるため、設定する必要はありません。BE が特定の Doris クラスターに属することが確認できた場合に設定できます。データディレクトリ内の cluster_id ファイルも、この値と一致するように変更する必要があります。
* デフォルト値: -1

#### `custom_config_dir`

* 説明: `be_custom.conf` ファイルの配置先。デフォルトでは `conf/` ディレクトリです。
    - デプロイ環境によっては、システムのアップグレードで `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目が失われることがあります。`be_custom.conf` を別のディレクトリに保存すると、設定ファイルの上書きを防げます。
* デフォルト値: 空欄

#### `trash_file_expire_time_sec`

* 説明: ごみ箱のクリーンアップ間隔は 24 時間です。ディスク容量が不足している場合、trash 内のファイルの保持期間はこの設定値どおりにならないことがあります。
* デフォルト値: 86400

#### `es_http_timeout_ms`

* 説明: HTTP 経由で ES に接続する際のタイムアウト。
* デフォルト値: 5000 (ms)

#### `es_scroll_keepalive`

* 説明: ES scroll の keep-alive 保持時間。
* デフォルト値: 5 (m)

#### `external_table_connect_timeout_sec`

* 型: int32
* 説明: ODBC テーブルなどの外部テーブルへの接続を確立する際のタイムアウト。
* デフォルト値: 5 秒

#### `pipeline_status_report_interval`

* 説明: プロファイルの報告間隔。
* デフォルト値: 5 秒

#### `brpc_max_body_size`

* 説明: BRPC の `max_body_size` パラメーターを変更します。

  - クエリが失敗し、BE ログに `body_size is too large` と表示されることがあります。SQL が「multi distinct + no group by + 1T を超えるデータ」の場合に発生することがあります。このエラーは、BRPC のパケットサイズが設定値を超えたことを示します。設定値を増やすと、このエラーを回避できます。

#### `brpc_socket_max_unwritten_bytes`

* 説明: BRPC の `socket_max_unwritten_bytes` パラメーターを変更します。
  - クエリが失敗し、BE ログに `The server is overcrowded` と表示されることがあります。これは送信側でバッファリングするメッセージが多すぎることを意味し、SQL で大きな bitmap 値を送る場合に発生することがあります。設定値を増やすと、このエラーを回避できます。

#### `transfer_large_data_by_brpc`

* 型: bool
* 説明: Tuple/Block データが 1.8G を超える場合に、protoBuf リクエストをシリアライズし、Tuple/Block データを controller attachment に入れて HTTP BRPC で送信するかを制御します。protoBuf リクエストが 2G を超えたときの Bad request, error_text=[E1003]Fail to compress request エラーを防ぎます。以前のバージョンでは、attachment に入れたデータをデフォルトの baidu_std BRPC で送信していましたが、attachment が 2G を超えると切り捨てられました。HTTP BRPC での送信には 2G の制限がありません。
* デフォルト値: true

#### `brpc_num_threads`

* 説明: BRPC の bthread 数を変更します。デフォルトは 256 です。
  - QPS を向上させるには、この設定値を増やせます。詳細は `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md` を参照してください。
* デフォルト値: 256

#### `thrift_rpc_timeout_ms`

* 説明: Thrift のデフォルトタイムアウト。
* デフォルト値: 60000

#### `thrift_client_retry_interval_ms`

* 型: int64
* 説明: FE の Thrift サーバーでリトライ集中が発生するのを防ぐため、BE の Thrift クライアントの再試行間隔を設定します。単位は ms です。
* デフォルト値: 1000

#### `thrift_connect_timeout_seconds`

* 説明: Thrift クライアントのデフォルトの接続タイムアウト。
* デフォルト値: 3 (s)

#### `thrift_server_type_of_fe`

* 型: string
* 説明: FE の Thrift サービスが使用するサービスモデル。文字列型で、大文字と小文字を区別しません。FE の thrift_server_type パラメーターと一致させる必要があります。指定できる値は `THREADED` と `THREAD_POOL` です。

    - `THREADED` の場合は、ノンブロッキング I/O モデルです。

    - `THREAD_POOL` の場合は、ブロッキング I/O モデルです。

#### `thrift_max_message_size`

デフォルト値: 100MB

Thrift サーバーが受信するメッセージの最大サイズ（バイト）。クライアントから送られたメッセージがこの上限を超えると、Thrift サーバーはリクエストを拒否して接続を閉じます。その結果、クライアントには connection has been closed by peer. エラーが発生します。この場合は、このパラメーターを増やしてみてください。

#### `txn_commit_rpc_timeout_ms`

* 説明: トランザクション送信 RPC のタイムアウト。
* デフォルト値: 60,000 (ms)

#### `txn_map_shard_size`

* 説明: txn_map_lock のシャードサイズ。値は 2^n（n=0,1,2,3,4）です。トランザクション管理の性能を改善します。
* デフォルト値: 128

#### `txn_shard_size`

* 説明: txn_lock のシャードサイズ。値は 2^n（n=0,1,2,3,4）です。トランザクションの送信と公開の性能を改善します。
* デフォルト値: 1024

#### `unused_rowset_monitor_interval`

* 説明: 期限切れの Rowset を削除する間隔。
* デフォルト値: 30 (s)

#### `max_client_cache_size_per_host`

* 説明: ホストごとのクライアントキャッシュの最大数。BE には複数のクライアントキャッシュがありますが、現在は同じキャッシュサイズ設定を使用します。必要に応じて、それぞれに異なる設定を使用します。
* デフォルト値: 10

#### `string_type_length_soft_limit_bytes`

* 型: int32
* 説明: String 型の最大長に対するソフトリミット。
* デフォルト値: 1,048,576

#### `big_column_size_buffer`

* 型: int64
* 説明: ODBC 外部テーブルを使用し、元テーブルの列型が HLL、CHAR、VARCHAR のいずれかで、列値の長さがこの値を超えると、クエリは column value length longer than buffer length エラーを返します。この値を増やせます。
* デフォルト値: 65535

#### `small_column_size_buffer`

* 型: int64
* 説明: ODBC 外部テーブルを使用し、元テーブルの列型が HLL、CHAR、VARCHAR 以外で、列値の長さがこの値を超えると、クエリは column value length longer than buffer length エラーを返します。この値を増やせます。
* デフォルト値: 100

### クエリ

#### `fragment_mgr_asynic_work_pool_queue_size`

* 説明: 単一ノードで処理できる非同期処理の上限。
* デフォルト値: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min`

* 説明: 非同期処理を実行するスレッド数。デフォルトの最小値は 16 です。
* デフォルト値: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max`

* 説明: 非同期処理に応じてスレッドを動的に作成します。最大 512 スレッドです。
* デフォルト値: 512

#### `doris_scanner_row_num`

* 説明: 各スキャンスレッドが一回の実行で返すデータ行の最大数。
* デフォルト値: 16384

#### `doris_scanner_row_bytes`

* 説明: 一回の読み取りで実行するフラグメントの行バイト数。
    - 注: テーブルの列が多く、`select *` が進まない場合は、この設定を調整できます。
* デフォルト値: 10485760

#### `doris_scanner_thread_pool_queue_size`

* 型: int32
* 説明: Scanner スレッドプールのキュー長。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに投入され、スケジュールを待ちます。投入したタスク数がキュー長を超えると、後続のタスクはキューに空きができるまでブロックされます。
* デフォルト値: 102400

#### `doris_scanner_thread_pool_thread_num`

* 型: int32
* 説明: Scanner スレッドプールのスレッド数。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに投入され、スケジュールされます。この設定でプールのサイズを決めます。
* デフォルト値: CPU コア数に依存。`max(48, 2 * num_of_cpu_cores)` に等しい値

#### `doris_max_remote_scanner_thread_pool_thread_num`

* 型: int32
* 説明: Remote scanner スレッドプールの最大スレッド数。このプールはすべての外部データソースのスキャンタスクに使用されます。
* デフォルト値: 512

#### `exchg_node_buffer_size_bytes`

* 型: int32
* 説明: ExchangeNode のバッファキューのサイズ（バイト）。Sender 側から送信したデータ量が ExchangeNode のバッファサイズを超えると、書き込み用の空きができるまで後続の送信はブロックされます。
* デフォルト値: 10485760

#### `doris_scan_range_max_mb`

* 型: int32
* 説明: 各 OlapScanner が読み取るデータ量の最大値。
* デフォルト値: 1024

### コンパクション

#### `disable_auto_compaction`

* 型: bool
* 説明: 自動 compaction タスクを無効にするかどうか。
  - 通常は無効にしておく必要があります。デバッグ環境やテスト環境で compaction タスクを手動で操作する場合に有効にできます。
* デフォルト値: false

#### `enable_vertical_compaction`

* 型: bool
* 説明: vertical compaction を有効にするかどうか。
* デフォルト値: true

#### `vertical_compaction_num_columns_per_group`

* 型: int32
* 説明: vertical compaction における各グループの列数。
* デフォルト値: 5

#### `vertical_compaction_max_row_source_memory_mb`

* 型: int32
* 説明: vertical compaction における row_source_buffer の最大メモリ使用量。単位は MB です。
* デフォルト値: 200

#### `vertical_compaction_max_segment_size`

* 型: int32
* 説明: vertical compaction における出力先 segment ファイルの最大サイズ。単位は m バイトです。
* デフォルト値: 268435456

#### `enable_ordered_data_compaction`

* 型: bool
* 説明: ordered data compaction を有効にするかどうか。
* デフォルト値: true

#### `ordered_data_compaction_min_segment_size`

* 型: int32
* 説明: ordered data compaction における入力 rowset の最小 segment サイズ。単位は m バイトです。
* デフォルト値: 10485760

#### `max_base_compaction_threads`

* 型: int32
* 説明: base compaction スレッドプールの最大スレッド数。-1 はディスクごとにスレッドを一本割り当てることを意味します。
* デフォルト値: 4

#### `generate_compaction_tasks_interval_ms`

* 説明: compaction タスクを生成する最小間隔（ms）。
* デフォルト値: 10 (ms)

#### `base_compaction_min_rowset_num`

* 説明: BaseCompaction のトリガー条件の一つ。Cumulative ファイルの数がこの上限に達すると、BaseCompaction が実行されます。
* デフォルト値: 5

#### `base_compaction_min_data_ratio`

* 説明: BaseCompaction のトリガー条件の一つ。Cumulative ファイルのサイズが Base ファイルに対してこの比率に達することを示します。
* デフォルト値: 0.3 (30%)

#### `total_permits_for_compaction_score`

* 型: int64
* 説明: すべての compaction タスクが保持する「permit」の上限。この設定で compaction のメモリ消費を制限できます。
* デフォルト値: 10000
* 動的変更可能: はい

#### `compaction_promotion_size_mbytes`

* 型: int64
* 説明: cumulative compaction が出力した rowset の合計ディスクサイズがこの値を超えると、その rowset は base compaction に使用されます。単位は m バイトです。
  - 通常、cumulative compaction の処理時間が長くなりすぎてバージョンが滞留するのを防ぐため、この値は 2G 未満にします。
* デフォルト値: 1024

#### `compaction_promotion_ratio`

* 型: double
* 説明: cumulative compaction が出力した rowset の合計ディスクサイズが、base バージョンの rowset に対してこの比率を超えると、その rowset は base compaction に使用されます。
  - 通常は 0.02 以上 0.1 以下の値が推奨されます。
* デフォルト値: 0.05

#### `compaction_promotion_min_size_mbytes`

* 型: int64
* 説明: cumulative compaction が出力した rowset の合計ディスクサイズがこの値未満の場合、rowset は base compaction の対象とならず、cumulative compaction の対象に残ります。単位は m バイトです。
  - 通常は 512m 以内に設定します。値が大きすぎると、初期の base バージョンのサイズが小さすぎて base compaction が実行されません。
* デフォルト値: 128

#### `compaction_min_size_mbytes`

* 型: int64
* 説明: cumulative compaction で選択した rowset のディスクサイズがこの値を超える場合は、level ポリシーに従って分割・マージします。小さい場合は直接マージします。単位は m バイトです。
  - 通常は 128m 以内に設定します。値が大きすぎると cumulative compaction の書き込み増幅が増えます。
* デフォルト値: 64

#### `default_rowset_type`

* 型: string
* 説明: BE がデフォルトで選択するストレージ形式。設定できる値は「**ALPHA**」と「**BETA**」で、主に次の二つの用途があります。
  - テーブルの storage_format を Default に設定した場合、この設定に従って BE のストレージ形式を選択します。
  - BE が Compaction を実行する際のストレージ形式を選択します。
* デフォルト値: BETA

#### `cumulative_compaction_min_deltas`

* 説明: cumulative compaction ポリシーにおける増分ファイルの最小数。
* デフォルト値: 5

#### `cumulative_compaction_max_deltas`

* 説明: cumulative compaction ポリシーにおける増分ファイルの最大数。
* デフォルト値: 1000

#### `base_compaction_trace_threshold`

* 型: int32
* 説明: base compaction のトレース情報をログに記録するしきい値（秒）。
* デフォルト値: 10

Base compaction は時間のかかるバックグラウンドタスクです。この設定は、トレース情報をログに記録するしきい値です。ログ内のトレース情報は次のようになります。

```
W0610 11:26:33.804431 56452 storage_engine.cpp:552] execute base compaction cost 0.00319222
BaseCompaction:546859:
  - filtered_rows: 0
   - input_row_num: 10
   - input_rowsets_count: 10
   - input_rowsets_data_size: 2.17 KB
   - input_segments_num: 10
   - merge_rowsets_latency: 100000.510ms
   - merged_rows: 0
   - output_row_num: 10
   - output_rowset_data_size: 224.00 B
   - output_segments_num: 1
0610 11:23:03.727535 (+     0us) storage_engine.cpp:554] start to perform base compaction
0610 11:23:03.728961 (+  1426us) storage_engine.cpp:560] found best tablet 546859
0610 11:23:03.728963 (+     2us) base_compaction.cpp:40] got base compaction lock
0610 11:23:03.729029 (+    66us) base_compaction.cpp:44] rowsets picked
0610 11:24:51.784439 (+108055410us) compaction.cpp:46] got concurrency lock and start to do compaction
0610 11:24:51.784818 (+   379us) compaction.cpp:74] prepare finished
0610 11:26:33.359265 (+101574447us) compaction.cpp:87] merge rowsets finished
0610 11:26:33.484481 (+125216us) compaction.cpp:102] output rowset built
0610 11:26:33.484482 (+     1us) compaction.cpp:106] check correctness finished
0610 11:26:33.513197 (+ 28715us) compaction.cpp:110] modify rowsets finished
0610 11:26:33.513300 (+   103us) base_compaction.cpp:49] compaction finished
0610 11:26:33.513441 (+   141us) base_compaction.cpp:56] unused rowsets have been moved to GC queue
```

#### `cumulative_compaction_trace_threshold`

* 型: int32
* 説明: cumulative compaction のトレース情報をログに記録するしきい値（秒）。
  - `base_compaction_trace_threshold` と同様です。
* デフォルト値: 2

#### `compaction_task_num_per_disk`

* 型: int32
* 説明: ディスク（HDD）ごとに並列実行する compaction タスク数。
* デフォルト値: 4

#### `compaction_task_num_per_fast_disk`

* 型: int32
* 説明: 高速ディスク（SSD）ごとに並列実行する compaction タスク数。
* デフォルト値: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round`

* 型: int32
* 説明: compaction タスクの生成時、base compaction を一回実行するごとに実行する cumulative compaction の回数。
* デフォルト値: 9

#### `max_cumu_compaction_threads`

* 型: int32
* 説明: cumulative compaction スレッドプールの最大スレッド数。-1 はディスクごとにスレッドを一本割り当てることを意味します。
* デフォルト値: -1

#### `enable_segcompaction`

* 型: bool
* 説明: ロード中に segment compaction を使用して -238 エラーを防ぐかどうか。
* デフォルト値: true

#### `segcompaction_batch_size`

* 型: int32
* 説明: segment 数がこのしきい値を超えると segment compaction が実行されます。一つの segment compaction タスクに含められる元の segment 数の上限も指定します。
* デフォルト値: 10

#### `segcompaction_candidate_max_rows`

* 型: int32
* 説明: 元の segment 一つに許容する最大行数。これを超える segment はスキップされます。
* デフォルト値: 1048576

#### `segcompaction_candidate_max_bytes`

* 型: int64
* 説明: 元の segment 一つに許容する最大ファイルサイズ。これを超える segment はスキップされます。
* デフォルト値: 104857600

#### `segcompaction_task_max_rows`

* 型: int32
* 説明: 単一の segment compaction タスクに許容する最大合計行数。
* デフォルト値: 1572864

#### `segcompaction_task_max_bytes`

* 型: int64
* 説明: 単一の segment compaction タスクに許容する最大合計ファイルサイズ。
* デフォルト値: 157286400

#### `segcompaction_num_threads`

* 型: int32
* 説明: segment compaction のグローバルスレッドプールサイズ。
* デフォルト値: 5

#### `disable_compaction_trace_log`

* 型: bool
* 説明: compaction のトレースログを無効にするかどうか。
  - true にすると `cumulative_compaction_trace_threshold` と `base_compaction_trace_threshold` が機能せず、トレースログが無効になります。
* デフォルト値: true

#### `pick_rowset_to_compact_interval_sec`

* 型: int64
* 説明: compaction の対象 rowset を選択する間隔（秒）。
* デフォルト値: 86400

#### `update_replica_infos_interval_seconds`

* 説明: ピアレプリカの情報を更新する最小間隔（秒）。
* デフォルト値: 60 (s)

#### `cold_data_compaction_score_threshold`

* 型: int32
* 説明: コールドデータの compaction を実行するための最小スコアしきい値。スコアがこの値を超えると compaction が検討されます。値を調整すると、リモートストレージのコールドデータに対する compaction の頻度と強度を制御できます。3.1.3 以降でサポートされます。
* デフォルト値: 100

#### `cold_data_compaction_thread_num`

* 型: int32
* 説明: コールドデータの compaction に使用するスレッド数。並列度を制御します。値を増やすと同時に実行できるタスクが増え、スループットが向上する可能性がありますが、リソース使用量も増えます。
* デフォルト値: 2

#### `cold_data_compaction_interval_sec`

* 型: int32
* 説明: コールドデータの compaction を起動する間隔（秒）。短くすると compaction の検討頻度が増え、クリーンアップが速くなる可能性がありますが、リソース消費も増えます。
* デフォルト値: 1800（秒）

#### `enable_compaction_pause_on_high_memory`

* 型: bool
* 説明: プロセスのメモリ使用量が多いときに compaction タスクを一時停止するかどうか。動的に変更できます。
  - 有効にすると、BE はメモリ使用量が逼迫したときに compaction を一時停止し、クエリとロードを優先します。
  - ただし、compaction を一時停止すると、スコアが高い tablet のマージがさらに難しくなり、解消しようとしていたメタデータとメモリの滞留が悪化します。**バージョン 4.0.8 からデフォルト値は `true` から `false` に変更されました。** そのため、デフォルトではメモリ使用量が多くても compaction は一時停止しません。
  - 以前の動作を維持するには、`true` に戻します。
* デフォルト値: false（4.0.8 より前は true）

### ロード

#### `enable_table_memtable_flush_backpressure`

* 型: bool
* 説明: バージョン 4.1.4 で追加。この BE 上でフラッシュ待ちの MemTable が多すぎる場合に、テーブルへの新しい書き込みをブロックするかどうか。FE の設定 `enable_adaptive_random_bucket_load` と併用し、adaptive random bucket load 中に MemTable が蓄積してメモリ使用量が増えるのを防ぎます。
* デフォルト値: true

#### `table_memtable_flush_pending_count_limit`

* 型: int32
* 説明: バージョン 4.1.4 で追加。この BE 上で、単一のテーブルあたりフラッシュ待ちにできる MemTable の最大数。上限を超えると、件数が上限未満に戻るまで新しい書き込みがブロックされます。`enable_table_memtable_flush_backpressure = true` の場合のみ有効です。
* デフォルト値: 10

#### `group_commit_max_wal_num_per_table`

* 型: int32
* 説明: バージョン 4.1.4 で追加。単一のテーブルに存在できる Group Commit WAL ファイルの最大数。`0` は無制限を意味します。WAL の再生が失敗し続けてファイル数が上限を超えると、そのテーブルの `async_mode` Group Commit ロードは `EXCEEDED_LIMIT` エラーで拒否されます。メッセージは `Too many group commit async WALs for table ...` のようになります。この上限は、WAL が無制限に増えてディスクを埋めることを防ぎます。
* デフォルト値: 10

#### `enable_stream_load_record`

* 型: bool
* 説明: Stream Load の記録機能を有効にするかどうか。デフォルトは false です。
* デフォルト値: false

#### `load_data_reserve_hours`

* 説明: mini load に使用します。この期間が経過すると mini load のデータファイルが削除されます。
* デフォルト値: 4 (h)

#### `push_worker_count_high_priority`

* 説明: HIGH 優先度のインポートタスクを処理するスレッド数。
* デフォルト値: 3

#### `push_worker_count_normal_priority`

* 説明: NORMAL 優先度のインポートタスクを処理するスレッド数。
* デフォルト値: 3

#### `enable_single_replica_load`

* 説明: 単一レプリカでのデータロード機能を有効にするかどうか。
* デフォルト値: true

#### `load_error_log_reserve_hours`

* 説明: この期間が経過すると、ロードエラーログが削除されます。
* デフォルト値: 48 (h)

#### `load_error_log_limit_bytes`

* 説明: この値を超えるロードエラーログは切り詰められます。
* デフォルト値: 209715200（バイト）

#### `load_process_max_memory_limit_percent`

* 説明: 単一ノードのすべてのロードスレッドが使用できるメモリ上限の割合。デフォルトは 50% です。
  - Doris のアップグレード時にロード性能に影響しないよう、これらのデフォルト値は大きく設定されています。必要に応じて、適切な値に変更してください。
* デフォルト値: 50 (%)

#### `load_process_soft_mem_limit_percent`

* 説明: 単一ノードのロード用メモリ上限に対するソフトリミットの割合。たとえば全ロードタスクのメモリ上限が 20GB の場合、デフォルトのソフトリミットはその 50% の 10GB です。使用量がソフトリミットを超えると、最もメモリを消費するジョブが選択され、フラッシュしてメモリを解放します。デフォルトは 50% です。
* デフォルト値: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec`

* 型: int32
* 説明: 単一レプリカロードにおける、Master レプリカと Slave レプリカ間の BRPC タイムアウトを変更します。
* デフォルト値: 60

#### `max_segment_num_per_rowset`

* 型: int32
* 説明: ロード時に新しく生成される rowset の segment 数を制限します。しきい値を超えると、ロードは -238 エラーで失敗します。segment が多すぎると compaction のメモリ使用量が増え、OOM エラーの原因になります。
* デフォルト値: 200

#### `high_priority_flush_thread_num_per_store`

* 型: int32
* 説明: 高優先度のロードタスクに割り当てる、ストアパスごとのフラッシュスレッド数。
* デフォルト値: 1

#### `routine_load_consumer_pool_size`

* 型: int32
* 説明: Routine Load で使用するデータコンシューマーのキャッシュ数。
* デフォルト値: 10

#### `multi_table_batch_plan_threshold`

* 型: int32
* 説明: 単一ストリーム・複数テーブルのロードで使用します。Kafka から受信したメッセージのバッチサイズがこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。
* デフォルト値: 200

#### `multi_table_max_wait_tables`

* 型: int32
* 説明: 単一ストリーム・複数テーブルのロードで使用します。Kafka からメッセージのバッチを受信し、プラン待ちのテーブル数がこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。この設定は、一度に大量のプランを要求・実行するのを防ぎます。ロード中に複数テーブルを小さなバッチで処理すると、単一の RPC の負荷が減り、データ処理のリアルタイム性が向上します。
* デフォルト値: 5

#### `single_replica_load_download_num_workers`

* 型: int32
* 説明: 単一レプリカロードで segment をダウンロードする HTTP ワーカースレッド数を変更します。ロードの並列度が上がった場合、この値を調整すると Slave レプリカが Master レプリカから適時にデータファイルを同期できます。必要に応じて、I/O 性能を高めるために `webserver_num_workers` も増やします。
* デフォルト値: 64

#### `load_task_high_priority_threshold_second`

* 型: int32
* 説明: ロードタスクのタイムアウトがこのしきい値未満の場合、Doris は高優先度タスクと見なします。高優先度タスクは専用のフラッシュスレッドプールを使用します。
* デフォルト値: 120

#### `min_load_rpc_timeout_ms`

* 型: int32
* 説明: ロードジョブ内の各 RPC の最小タイムアウト。
* デフォルト値: 20

#### `kafka_api_version_request`

* 型: bool
* 説明: 依存する Kafka のバージョンが 0.10.0.0 未満の場合は false に設定します。
* デフォルト値: true

#### `kafka_broker_version_fallback`

* 説明: 依存する Kafka のバージョンが 0.10.0.0 未満で、kafka_api_version_request を false に設定した場合、フォールバックバージョンとして kafka_broker_version_fallback の値が使用されます。有効な値は 0.9.0.x と 0.8.x.y です。
* デフォルト値: 0.10.0

#### `max_consumer_num_per_group`

* 説明: Routine Load で使用する、データコンシューマーグループごとの最大コンシューマー数。
* デフォルト値: 3

#### `streaming_load_max_mb`

* 型: int64
* 説明: 一度の Stream Load で許可する CSV データ量の上限。
  - Stream Load は通常、数 GB 未満のデータのロードに適しています。大きすぎるデータのロードには適していません。
* デフォルト値: 10240 (MB)
* 動的変更可能: はい

#### `streaming_load_json_max_mb`

* 型: int64
* 説明: 一度の Stream Load で許可する JSON データ量の上限。単位は MB です。
  - JSON などの形式は分割できません。Doris は解析を始める前にデータ全体をメモリに読み込む必要があります。そのため、この値で一度の Stream Load でロードできるデータ量の上限を定めます。
* デフォルト値: 100
* 動的変更可能: はい

#### `olap_table_sink_send_interval_microseconds`

* 説明: ロード中、ポーリングスレッドが Coordinator の sink ノードから対応する BE にデータを送信し続けます。このスレッドは `olap_table_sink_send_interval_microseconds` マイクロ秒ごとに送信するデータがあるか確認します。
* デフォルト値: 1000

#### `olap_table_sink_send_interval_auto_partition_factor`

* 説明: 自動パーティションを有効にしたテーブルへのロードでは、`olap_table_sink_send_interval_microseconds` の間隔は長すぎます。その場合、実際の間隔にはこの係数が掛けられます。
* デフォルト値: 0.001

#### `enable_group_commit_streamload_be_forward`

* 型: bool
* 説明: コンピューティングとストレージを分離したモードで、Group Commit の Stream Load を BE 間で転送するかどうか。Doris 4.0 系では 4.0.8、4.1 系では 4.1.4 で追加されました。動的に変更できます。
  - ロードバランサーが同じテーブルの Group Commit リクエストを別々の BE にランダムに振り分けると、効率的なバッチ処理ができなくなります。有効にすると、BE はリクエストを単一の対象 BE に転送します。
  - **バージョン 4.0.8 以降、BE エンドポイント `/api/{db}/{table}/_stream_load_forward` はこの設定で制御されます。`false` の場合、このエンドポイントへのリクエストは `403 Forbidden` を返し、`Stream load forward is disabled` というメッセージが表示されます。`true` の場合も、リクエストは認証を通過し、グローバルな `LOAD` 権限が必要です。**
  - この転送を使用するデプロイでは、FE と BE の両方でこの設定を `true` にしてください（同名の FE 設定については [FE 設定](./fe-config) を参照）。
* デフォルト値: false

### スレッド

#### `delete_worker_count`

* 説明: データ削除タスクを実行するスレッド数。
* デフォルト値: 3

#### `clear_transaction_task_worker_count`

* 説明: トランザクションのクリーンアップに使用するスレッド数。
* デフォルト値: 1

#### `clone_worker_count`

* 説明: クローンタスクを実行するスレッド数。
* デフォルト値: 3

#### `be_service_threads`

* 型: int32
* 説明: BE の Thrift サーバーサービスの実行スレッド数。FE のリクエスト処理に使用できるスレッド数を表します。
* デフォルト値: 64

#### `download_worker_count`

* 説明: ダウンロードスレッド数。
* デフォルト値: 1

#### `drop_tablet_worker_count`

* 説明: tablet を削除するスレッド数。
* デフォルト値: 3

#### `flush_thread_num_per_store`

* 説明: ストアごとのメモリテーブルのフラッシュに使用するスレッド数。
* デフォルト値: 2

#### `publish_version_worker_count`

* 説明: バージョンを公開するスレッド数。
* デフォルト値: 8

#### `upload_worker_count`

* 説明: ファイルをアップロードする最大スレッド数。
* デフォルト値: 1

#### `webserver_num_workers`

* 説明: Web サーバーのデフォルトのワーカースレッド数。
* デフォルト値: 48

#### `send_batch_thread_pool_thread_num`

* 型: int32
* 説明: SendBatch スレッドプールのスレッド数。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてプールに投入され、スケジュールされます。この設定でプールのサイズを決めます。
* デフォルト値: 64

#### `send_batch_thread_pool_queue_size`

* 型: int32
* 説明: SendBatch スレッドプールのキュー長。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてプールに投入され、スケジュールを待ちます。投入したタスク数がキュー長を超えると、後続のタスクはキューに空きができるまでブロックされます。
* デフォルト値: 102400

#### `make_snapshot_worker_count`

* 説明: スナップショットを作成するスレッド数。
* デフォルト値: 5

#### `release_snapshot_worker_count`

* 説明: スナップショットを解放するスレッド数。
* デフォルト値: 5

### メモリ

#### `madvise_huge_pages`

* 型: bool
* 説明: Linux の huge page を使用するかどうか。
* デフォルト値: false

#### `max_memory_sink_batch_count`

* 説明: 外部スキャンキャッシュの最大バッチ数。キャッシュされる行数は max_memory_cache_batch_count * batch_size です。デフォルトは 20 で、batch_size のデフォルトは 1024 なので、20 * 1024 行がキャッシュされます。
* デフォルト値: 20

#### `memory_max_alignment`

* 説明: メモリの最大アラインメント。
* デフォルト値: 16

#### `mmap_buffers`

* 説明: メモリの割り当てに mmap を使用するかどうか。
* デフォルト値: false

#### `memtable_mem_tracker_refresh_interval_ms`

* 説明: MemTable flush manager の更新間隔（ミリ秒）。
* デフォルト値: 100

#### `zone_map_row_num_threshold`

* 型: int32
* 説明: ページ内の行数がこの値未満の場合、データ量の増加を抑えるため ZoneMap を作成しません。
* デフォルト値: 20

#### `memory_mode`

* 型: string
* 説明: TCMalloc の GC を制御します。performance モードでは使用量が 90% * mem_limit 以上になると TCMalloc のキャッシュメモリを解放し、それ以外では 50% * mem_limit 以上になると解放します。
* デフォルト値: performance

#### `max_sys_mem_available_low_water_mark_bytes`

* 型: int64
* 説明: システムの `/proc/meminfo/MemAvailable` に対する low water mark の上限。単位はバイトで、デフォルトは 1.6G です。実際の low water mark は min(1.6G, MemTotal * 10%) で、16G を超える大容量メモリのマシンでメモリを無駄に確保しないようにします。上限を上げると、16G 超のマシンで Full GC 用のメモリバッファが多く確保されます。下げると、使用可能なメモリをより多く活用します。
* デフォルト値: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes`

* 説明: 単一のスキーマ変更タスクに許可する最大メモリ量。
* デフォルト値: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes`

* 型: int32
* 説明: MemTracker の consume/release における TCMalloc Hook の最小サイズ。この値未満の消費量は蓄積され、MemTracker の consume/release の頻繁な呼び出しを防ぎます。値を下げると呼び出し頻度が増え、上げると統計の精度が低下します。理論上、MemTracker の統計値と実際の値の差は mem_tracker_consume_min_size_bytes × その MemTracker が存在する BE スレッド数 です。
* デフォルト値: 1,048,576

#### `min_buffer_size`

* 説明: 読み取りバッファの最小サイズ。
* デフォルト値: 1024（バイト）

#### `write_buffer_size`

* 説明: フラッシュ前のバッファサイズ。
  - ロードしたデータはまず BE のメモリブロックに書き込まれ、ブロックがしきい値に達するとディスクにフラッシュされます。デフォルトは 200MB です。しきい値が小さすぎると、BE に小さなファイルが大量に作成されることがあります。値を上げるとファイル数を減らせますが、大きすぎると RPC がタイムアウトすることがあります。
* デフォルト値: 209,715,200

#### `remote_storage_read_buffer_mb`

* 型: int32
* 説明: HDFS またはオブジェクトストレージからファイルを読み取る際のキャッシュサイズ。
  - 値を上げるとリモートデータの読み取り呼び出し回数を減らせますが、メモリ使用量は増えます。
* デフォルト値: 16 (MB)

#### `file_cache_type`

* 型: string
* 説明: キャッシュファイルの種類。`whole_file_cache` は segment ファイル全体をダウンロードし、`sub_file_cache` はサイズに応じて segment ファイルを複数のファイルに分割します。空文字列 "" にするとキャッシュしません。キャッシュが必要な場合はこの設定を指定してください。
* デフォルト値: ""

#### `path_gc_check`

* 型：bool
* 説明: リサイクルデータをスキャンするスレッドのチェックを有効にするかどうか。
* デフォルト値：true

#### `path_gc_check_interval_second`

* 説明: リサイクルデータをスキャンするスレッドのチェック間隔。
* デフォルト値：86400 (s)

#### `path_gc_check_step`

* デフォルト値：1000

#### `path_gc_check_step_interval_ms`

* デフォルト値：10 (ms)

#### `scan_context_gc_interval_min`

* 説明: コンテキスト GC スレッドのスケジュール間隔。単位は分で、デフォルトは 5 分です。
* デフォルト値：5

### ストレージ

#### `enable_kuromoji_analyzer`

* 型: bool
* 説明: 日本語の転置インデックス用 kuromoji アナライザーを有効にするかどうか。Doris 5.0.0 以降でサポートされます。
* デフォルト値: false

#### `default_num_rows_per_column_file_block`

* 型: int32
* 説明: 単一の RowBlock に含まれるデータ行数。
* デフォルト値: 1024

#### `disable_storage_page_cache`

* 型: bool
* 説明: インデックスのキャッシュにページキャッシュを使用しないかどうか。BETA ストレージ形式でのみ有効です。通常は false が推奨されます。
* デフォルト値: false

#### `disk_stat_monitor_interval`

* 説明: ディスク状態の確認間隔。
* デフォルト値: 5 (s)

#### `max_free_io_buffers`

* 説明: I/O バッファの各サイズについて IoMgr が保持するバッファの最大数。バッファサイズは 1024B から 8MB までで、合計で約 2GB まで保持します。
* デフォルト値: 128

#### `max_garbage_sweep_interval`

* 説明: ディスク上の不要データをクリーンアップする最大間隔。
* デフォルト値: 3600 (s)

#### `max_percentage_of_error_disk`

* 型: int32
* 説明: ストレージエンジンが許容する破損ディスクの割合。破損ディスクの割合がこの値を超えると、BE は自動的に終了します。
* デフォルト値: 0

#### `min_garbage_sweep_interval`

* 説明: ディスク上の不要データをクリーンアップする最小間隔。
* デフォルト値: 180 (s)

#### `pprof_profile_dir`

* 説明: pprof プロファイルの保存ディレクトリ。
* デフォルト値: ${DORIS_HOME}/log

#### `small_file_dir`

* 説明: SmallFileMgr がダウンロードしたファイルの保存先。
* デフォルト値: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir`

* 説明: UDF 関数のディレクトリ。
* デフォルト値: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes`

* 説明: データディレクトリに残しておく必要がある最小バイト数。
* デフォルト値: 1073741824

#### `storage_flood_stage_usage_percent`

* 説明: storage_flood_stage_usage_percent と storage_flood_stage_left_capacity_bytes は、データディレクトリの容量の最大使用量を制限します。
* デフォルト値: 90 (90%)

#### `storage_medium_migrate_count`

* 説明: クローン処理に使用するスレッド数。
* デフォルト値: 1

#### `storage_page_cache_limit`

* 説明: ストレージページキャッシュのサイズ。
* デフォルト値: 20%

#### `storage_page_cache_shard_size`

* 説明: StoragePageCache のシャードサイズ。値は二のべき乗である必要があります。ロック競合を減らすため、BE のコア数に近い値が推奨されます。
* デフォルト値: 16

#### `index_page_cache_percentage`

* 型: int32
* 説明: ストレージページキャッシュ全体に占めるインデックスページキャッシュの割合。範囲は [0, 100] です。
* デフォルト値: 10

#### `segment_cache_capacity`
* 型: int32
* 説明: segment キャッシュのエントリーの最大数。キーは rowset ID です。-1 は旧バージョンとの互換性のため fd_number * 2/5 を意味します。
* デフォルト値: -1

#### `storage_strict_check_incompatible_old_format`

* 型: bool
* 説明: 互換性のない旧形式を厳密にチェックします。
* デフォルト値: true
* 動的変更可能: false

#### `sync_tablet_meta`

* 説明: ストレージエンジンが sync を有効にし、ディスクに保持するかどうか。
* デフォルト値: true

#### `pending_data_expire_time_sec`

* 説明: ストレージエンジンが未検証データを保持する最長時間。
* デフォルト値: 1800 (s)

#### `ignore_rowset_stale_unconsistent_delete`

* 型: boolean
* 説明: 期限切れのマージ済み rowset が一貫したバージョンパスを形成できない場合に、その rowset を削除するかどうかを決めます。
  - マージ済みの期限切れ rowset のバージョンパスは 半時間後に削除されます。異常時にこれらのバージョンを削除すると、クエリに必要な一貫したパスを構築できなくなることがあります。false の場合、プログラムは厳密にチェックし、エラーを報告して終了します。true の場合はこのエラーを無視して実行を続けます。通常、エラーを無視してもクエリには影響しませんが、FE がマージ済みバージョンを指定した場合には -230 エラーが発生します。
* デフォルト値: false

#### `create_tablet_worker_count`

* 説明: BE が tablet を作成するワーカースレッド数。
* デフォルト値: 3

#### `check_consistency_worker_count`

* 説明: tablet のチェックサムを計算するワーカースレッド数。
* デフォルト値: 1

#### `max_tablet_version_num`

* 型: int
* 説明: 単一の tablet のバージョン数を制限します。ロードの頻度が高すぎる場合や compaction が間に合わない場合のバージョン蓄積を防ぎます。上限を超えるとロードタスクは拒否されます。
* デフォルト値: 2000

#### `tablet_map_shard_size`

* 説明: tablet_map_lock のシャードサイズ。値は 2^n（n=0,1,2,3,4）で、tablet 管理の性能を改善します。
* デフォルト値: 4

#### `tablet_meta_checkpoint_min_interval_secs`

* 説明: TabletMeta Checkpoint スレッドのポーリング間隔。
* デフォルト値: 600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num`

* 説明: TabletMeta Checkpoint を保存するための Rowset の最小数。
* デフォルト値: 10

#### `tablet_rowset_stale_sweep_time_sec`

* 型: int64
* 説明: マージ済み rowset バージョンの削除までの有効期間を制御します。現在時刻 now() から、バージョンパス内で最も新しく作成された rowset の作成時刻を引いた値が tablet_rowset_stale_sweep_time_sec を超えると、そのパスとマージ済み rowset が削除されます。単位は秒です。
  - 書き込みが頻繁すぎると、FE がマージ済みバージョンを参照できず、クエリで -230 エラーが発生することがあります。このパラメーターを増やすと回避できます。
* デフォルト値: 300

#### `tablet_writer_open_rpc_timeout_sec`

* 説明: tablet 状態キャッシュの更新間隔。
    - ロード中に Batch（1024 行）を送信する RPC のタイムアウト。デフォルトは 60 秒です。この RPC はメモリへの複数バッチの書き込みを含む場合があるため、書き込みが原因でタイムアウトすることがあります。この値を調整すると、send batch fail などのタイムアウトエラーを減らせます。write_buffer_size を増やした場合も、このパラメーターを増やす必要があります。
* デフォルト値: 60

#### `tablet_writer_ignore_eovercrowded`

* 型: bool
* 説明: データ書き込み時の BRPC エラー [E1011]The server is overcrowded を無視するかどうか。
* デフォルト値: false

#### `streaming_load_rpc_max_alive_time_sec`

* 説明: TabletsChannel の存続時間。この間にデータを受信しなければ、チャネルは削除されます。
* デフォルト値: 1200

#### `alter_tablet_worker_count`

* 説明: スキーマ変更を行うスレッド数。
* デフォルト値: 3

#### `alter_index_worker_count`

* 説明: インデックス変更を行うスレッド数。
* デフォルト値: 3

#### `ignore_load_tablet_failure`

* 型: bool
* 説明: tablet のロードに失敗した場合、エラーを無視して BE の起動を続行するかどうか。
* デフォルト値: false

BE の起動時、データディレクトリごとに専用のスレッドが起動し、tablet ヘッダーのメタ情報を読み込みます。デフォルトの設定では、いずれかのデータディレクトリで tablet の読み込みに失敗すると、起動処理は終了します。同時に、BE の INFO ログに次のエラーメッセージが記録されます（原文の表記: `be The following error message is seen in the INFO`）。

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

これは、データディレクトリ内で読み込みに失敗した tablet の数を示します。ログには、失敗した tablet の詳細情報も記録されます。原因を調査するには手動での対応が必要です。調査後は通常、次の二つの方法で復旧します。
  - tablet の情報を修復できない場合、ほかのレプリカが正常なら `meta_tool` で問題のある tablet を削除できます。
  - `ignore_load_tablet_failure` を true に設定すると、BE は問題のある tablet を無視して正常に起動します。

#### `report_disk_state_interval_seconds`

* 説明: agent が FE にディスク状態を報告する間隔。
* デフォルト値: 60 (s)

#### `result_buffer_cancelled_interval_time`

* 説明: 結果バッファをキャンセルするまでの時間。
* デフォルト値: 300 (s)

#### `snapshot_expire_time_sec`

* 説明: スナップショットファイルのクリーンアップ間隔。
* デフォルト値:172800（48 時間）

### ログ

#### `sys_log_dir`

* 型: string
* 説明: BE のログデータの保存ディレクトリ。
* デフォルト値: `${DORIS_HOME}/log`

#### `sys_log_level`

* 説明: ログレベル: INFO < WARNING < ERROR < FATAL。
* デフォルト値: INFO

#### `sys_log_roll_mode`

* 説明: ログの分割サイズ。ログファイルは 1G ごとに分割されます。
* デフォルト値: SIZE-MB-1024

#### `sys_log_roll_num`

* 説明: 保持するログファイル数。
* デフォルト値: 10

#### `sys_log_verbose_level`

* 説明: ログの詳細表示レベル。コード内の VLOG で始まるログの出力を制御します。
* デフォルト値: 10

#### `sys_log_verbose_modules`

* 説明: ログを出力するモジュール。olap を指定すると、olap モジュールのログのみが出力されます。
* デフォルト値: 空

#### `aws_log_level`

* 型: int32
* 説明: AWS SDK のログレベル。
  ```
     Off = 0,
     Fatal = 1,
     Error = 2,
     Warn = 3,
     Info = 4,
     Debug = 5,
     Trace = 6
  ```
* デフォルト値: 3

#### `log_buffer_level`

* 説明: ログのフラッシュ方法。デフォルトではメモリ内に保持されます。
* デフォルト値: 空

### その他

#### `enable_arrow_input_validation`

* 型: bool
* 説明: バージョン 4.1.4 で追加。Arrow データを Doris の内部列に変換する前に、入力バッファを検証するかどうか。有効にすると、少量の追加検証コストはかかりますが、不正な Arrow データによる BE のクラッシュを防げます。
* デフォルト値: true

#### `report_tablet_interval_seconds`

* 説明: agent が FE に OLAP テーブルを報告する間隔。
* デフォルト値: 60 (s)

#### `report_task_interval_seconds`

* 説明: agent が FE にタスクシグネチャを報告する間隔。
* デフォルト値: 10 (s)

#### `periodic_counter_update_period_ms`

* 説明: レートカウンターとサンプリングカウンターの更新周期。
* デフォルト値: 500 (ms)

#### `enable_metric_calculator`

* 説明: true の場合はメトリクス計算処理を実行し、BE 関連の指標を収集します。false の場合は実行しません。
* デフォルト値: true

#### `enable_system_metrics`

* 説明: システム指標を有効または無効にするかどうか。
* デフォルト値: true

#### `enable_token_check`

* 説明: 将来の互換性のために使用され、後で削除される予定です。
* デフォルト値: true

#### `max_runnings_transactions_per_txn_map`

* 説明: トランザクションマネージャー内の各 txn_partition_map が保持するトランザクションの最大数。過剰なトランザクションを保持しないための保護機能です。
* デフォルト値: 2000

#### `max_download_speed_kbps`

* 説明: ダウンロード速度の上限。
* デフォルト値: 50000 (kb/s)

#### `download_low_speed_time`

* 説明: ダウンロードの時間制限。
* デフォルト値: 300 (s)

#### `download_low_speed_limit_kbps`

* 説明: ダウンロード速度の下限。
* デフォルト値: 50 (KB/s)

#### `enable_batch_download`

* 説明: ファイルを一括ダウンロードするかどうか。binlog を有効にしている場合は、有効にすることを推奨します。
* デフォルト値: false

#### `priority_queue_remaining_tasks_increased_frequency`

* 説明: BlockingPriorityQueue に残っているタスクの優先度を上げる頻度。
* デフォルト値: 512


#### `jdbc_drivers_dir`

* 説明: JDBC ドライバーを配置するデフォルトのディレクトリ。
* デフォルト値: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader`

* 説明: Stream Load 時に JSON の解析に simdjson を使用するかどうか。
* デフォルト値: true

#### `user_files_secure_path`

* 説明: `local` テーブル値関数で参照するファイルの保存ディレクトリ。
* デフォルト値: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes`

* 説明: BRPC streaming クライアントが送信するデータのバッチサイズ。
* デフォルト値: 262144

#### `grace_shutdown_wait_seconds`

* 説明: クラウドネイティブのデプロイでは、BE がクラスターに頻繁に追加・削除されます。停止する BE でクエリの fragment が実行中だと、クエリが失敗します。stop_be.sh --grace を使用すると、BE は実行中のクエリが停止するまで待機し、失敗を防げます。ただし、待機時間がこの上限を超えると BE は終了します。待機中、FE はその BE に新しいクエリを送らず、実行中のクエリの終了を待ちます。
* デフォルト値: 120

#### `enable_java_support`

* 説明: BE で java-jni の使用を有効にするかどうか。有効にすると C++ と Java 間の相互呼び出しが可能になります。現在、hudi、java-udf、jdbc、max-compute、paimon、preload、avro をサポートします。
* デフォルト値: true

#### `group_commit_wal_path`

* Group Commit の `WAL` ディレクトリ。
* デフォルト値: `wal` という名前のディレクトリが、`storage_root_path` の各ディレクトリ内に作成されます。設定例:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### コンピューティングとストレージを分離したモード

#### `deploy_mode`

* デフォルト値: ""

* 説明: BE の動作モード。`cloud` はコンピューティングとストレージを分離したモードを示します。

#### `meta_service_endpoint`

デフォルト値: ""

* 説明: meta service のエンドポイントを host1:port,host2:port の形式で指定します。通常、この値は FE からハートビートで BE に渡されるため、設定は不要です。

#### `enable_file_cache`

デフォルト値: true（Doris 4.2 以降はデフォルトで有効。cloud モードでは常に有効）。
* 説明: ファイルキャッシュを使用するかどうか。

#### `file_cache_path`

デフォルト値: [{"path":"${DORIS_HOME}/file_cache"}]
* 説明: ファイルキャッシュに使用するディスクパスとその他のパラメーター。ディスクごとに一件の配列として指定します。`path` はディスクパス、`total_size` はキャッシュサイズの上限です。-1 または 0 を指定すると、ディスク容量全体を使用します。
* 形式: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write`

* 型: bool
* 説明: バージョン 4.1.4 で追加。ファイルキャッシュへ非同期で書き込むかどうか。有効にすると、リモートデータをファイルキャッシュに書き戻す処理が、読み取り経路をブロックせずにバックグラウンドのスレッドプールへ渡され、コールドリードのレイテンシーが下がります。
* デフォルト値: false

#### `async_file_cache_write_workers_per_disk`

* 型: int32
* 説明: バージョン 4.1.4 で追加。ファイルキャッシュを非同期で書き込む際、キャッシュディスクごとに使用する書き込みスレッド数。`enable_async_file_cache_write = true` の場合のみ有効です。
* デフォルト値: 16

#### `async_file_cache_write_max_pending_bytes`

* 型: int64
* 説明: バージョン 4.1.4 で追加。非同期のファイルキャッシュ書き込み待ちデータの合計サイズの上限（バイト）。上限を超えた書き戻しリクエストは破棄されます。クエリの正しさには影響しませんが、そのデータはキャッシュされません。`-1` は無制限を意味します。
* デフォルト値: -1

#### `enable_file_cache_write_from_s3_file_writer`

* 型: bool
* 説明: バージョン 4.1.4 で追加。オブジェクトストレージへの書き込み時に、ローカルのファイルキャッシュにもデータを書き込むかどうか。書き込んだばかりのデータをキャッシュから直接読み取れるようになります。
* デフォルト値: true

#### `enable_file_cache_write_index_file_only`

* 型: bool
* 説明: バージョン 4.1.4 で追加。ファイルキャッシュにインデックスファイルだけを書き込むかどうか。有効にすると、キャッシュ容量が限られている場合にインデックスを優先してキャッシュに保持できます。
* デフォルト値: false

#### `enable_cache_read_from_peer`

* 型: bool
* 説明: ピアキャッシュ読み取りの主スイッチ。有効にすると、ローカルの File Cache にブロックがない場合、まず同じコンピュートグループまたは別のグループの BE の File Cache から読み取り、どの BE にもない場合のみオブジェクトストレージにフォールバックします。同一グループ内とグループ間のピア読み取りはこのスイッチでまとめて制御され、グループ間の読み取りだけを無効にはできません。グループ間のピア読み取りはバージョン 4.2.0 以降でサポートされ、同バージョンで `cache_read_from_peer_expired_seconds` 設定項目が削除されました。[ピアキャッシュ読み取り](../../compute-storage-decoupled/file-cache/file-cache-peer-read) を参照してください。
* デフォルト値: true

#### `enable_peer_s3_race`

* 型: bool
* 説明: バージョン 4.2.0 で追加。ピアからの読み取りとオブジェクトストレージからの読み取りを競合させ、先に返った結果を採用するかどうか。無効にすると、ピア候補を順に試し、すべて失敗した場合のみオブジェクトストレージから読み取ります。
* デフォルト値: true

#### `peer_race_hedge_delay_ms`

* 型: int32
* 説明: バージョン 4.2.0 で追加。競合時にピア読み取りを先行させる時間（ミリ秒）。その間にピアが応答した場合は、オブジェクトストレージへの読み取りを送信しません。`0` は両方の読み取りを同時に開始します。
* デフォルト値: 20

#### `max_concurrent_peer_races`

* 型: int32
* 説明: バージョン 4.2.0 で追加。単一の BE で同時に実行できる、ピアとオブジェクトストレージ間の読み取り競合の最大数。上限を超えたキャッシュミスは順次読み取ります。
* デフォルト値: 64

#### `peer_cache_fill_compute_group_id`

* 型: string
* 説明: バージョン 4.2.0 で追加。読み取りを要求する BE に設定します。グループ間のキャッシュ補充を担当するコンピュートグループの ID です。グループ名ではなく、`compute_group_id` を指定します。この値は `Tag` 列に含まれ、`SHOW BACKENDS` で確認できます。選択したピア候補がこのグループに属する場合、要求側は、ブロックがピアにないときにオブジェクトストレージから取得してピア自身の File Cache に書き込むよう要求します。空文字列の場合、補充は使用しません。
* デフォルト値: ""

#### `enable_peer_server_cache_fill`

* 型: bool
* 説明: バージョン 4.2.0 で追加。キャッシュを提供する BE に設定します。補充フラグ付きのピア読み取りリクエストを受け付けるかどうか。無効な場合、ローカルにキャッシュされていないブロックは見つからないと報告され、要求側の BE はオブジェクトストレージにフォールバックします。
* デフォルト値: true

#### `peer_server_cache_fill_timeout_ms`

* 型: int32
* 説明: バージョン 4.2.0 で追加。提供側で 一回の補充を待つ最大時間（ミリ秒）。タイムアウトすると、要求側の BE はオブジェクトストレージにフォールバックします。
* デフォルト値: 6000

#### `max_concurrent_peer_server_fills`

* 型: int32
* 説明: バージョン 4.2.0 で追加。提供側で同時に実行できる補充の最大数。上限を超えた補充リクエストは拒否され、要求側の BE はオブジェクトストレージにフォールバックします。
* デフォルト値: 32

#### `peer_rpc_failure_eviction_threshold`

* 型: int32
* 説明: バージョン 4.2.0 で追加。ピア候補が連続してこの回数の RPC 失敗を起こすと、候補リストから削除されます。
* デフォルト値: 3

#### `peer_all_miss_cooldown_threshold`

* 型: int32
* 説明: バージョン 4.2.0 で追加。すべてのピア候補でキャッシュミスになった読み取りの連続回数。この回数に達すると tablet はクールダウンに入り、その間はオブジェクトストレージから直接読み取ります。
* デフォルト値: 5

#### `peer_all_miss_cooldown_duration_s`

* 型: int64
* 説明: バージョン 4.2.0 で追加。ピア読み取りのクールダウン期間（秒）。
* デフォルト値: 300

#### `peer_candidate_expiry_s`

* 型: int64
* 説明: バージョン 4.2.0 で追加。ピア候補エントリーの有効期間（秒）。最後に使用した時点から計測します。期限切れのエントリーはメモリから削除され、次のキャッシュミス時に FE から再取得されます。
* デフォルト値: 3600

#### `peer_candidate_cleanup_interval_s`

* 型: int64
* 説明: バージョン 4.2.0 で追加。期限切れのピア候補を削除するバックグラウンドジョブの実行間隔（秒）。
* デフォルト値: 3600

#### `peer_fetch_queue_timeout_ms`

* 型: int32
* 説明: バージョン 4.2.0 で追加。提供側の処理キューでピア読み取りリクエストが待てる最大時間（ミリ秒）。これを超えるリクエストは拒否され、要求側の BE は速やかにオブジェクトストレージにフォールバックします。
* デフォルト値: 100

#### `brpc_peer_fetch_pool_threads`

* 型: int32
* 説明: バージョン 4.2.0 で追加。提供側でピア読み取りリクエストを処理するスレッドプールのサイズ。ロードなど負荷の高い RPC のスレッドプールとは分離されています。`-1` は `max(64, 2 × CPU cores)` を意味します。動的に変更できません。
* デフォルト値: -1

#### `brpc_peer_fetch_pool_max_queue_size`

* 型: int32
* 説明: バージョン 4.2.0 で追加。提供側のピア読み取りスレッドプールのキュー長。`-1` は `max(4096, 128 × CPU cores)` を意味します。動的に変更できません。
* デフォルト値: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num`

* 型: int32
* 説明: バージョン 4.2.0 で追加。ピアとオブジェクトストレージの読み取り競合中に、要求側でオブジェクトストレージから読み取るスレッドプールの最小／最大スレッド数。動的に変更できません。
* デフォルト値: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core`

* 型: int64
* 説明: バージョン 4.1.4 で追加。CPU コアごとに算出するオブジェクトストレージへの GET／PUT リクエストの QPS 上限。負の値にするとこのモードが無効になり、従来の絶対トークン設定にフォールバックします。`0` は QPS を制限しません。
* デフォルト値: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max`

* 型: int64
* 説明: バージョン 4.1.4 で追加。CPU コア数から算出した GET／PUT の QPS の絶対上限。`0` 以下は上限なしを意味します。
* デフォルト値: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core`

* 型: int64
* 説明: バージョン 4.1.4 で追加。CPU コアごとに算出する、オブジェクトストレージへの GET／PUT の帯域幅上限（コアごとの毎秒バイト数）。`0` 以下は帯域幅を制限しません。
* デフォルト値: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max`

* 型: int64
* 説明: バージョン 4.1.4 で追加。CPU コア数から算出した GET／PUT 帯域幅の絶対上限（毎秒バイト数）。`0` 以下は上限なしを意味します。
* デフォルト値: 0

#### `s3_rate_limiter_cpu_cores_override`

* 型: int32
* 説明: バージョン 4.1.4 で追加。上記のレート制限の算出に使用する CPU コア数。`0` 以下の場合、マシンのコア数を自動検出します。
* デフォルト値: 0

#### `s3_rate_limiter_log_interval`

* 型: int64
* 説明: バージョン 4.1.4 で追加。オブジェクトストレージのレート制限が発生したときに出力するログエントリーの最小間隔（ミリ秒）。
* デフォルト値: 1000

#### `file_cache_mem_storage_shard_num`

* 型: int32
* 説明: バージョン 4.1.4 で追加。ファイルキャッシュのメモリストレージのシャード数。同時アクセス時のロック競合を減らすために使用します。
* デフォルト値: 1024

#### `time_series_max_tablet_version_num`

* 型: int
* 説明: time-series compaction ポリシーにおける、単一の tablet のバージョン数を制限します。ロードの頻度が高すぎる場合や compaction が間に合わない場合のバージョン蓄積を防ぎます。上限を超えるとロードタスクは拒否されます。
* デフォルト値: 20000
