---
{
    "title": "BE 設定",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "このドキュメントでは、BE に関連する設定項目を主に説明します。"
}
---

# BE 設定

このドキュメントでは、BE に関連する設定項目を主に説明します。

BE の設定ファイル `be.conf` は、通常、BE のデプロイ先の `conf/` ディレクトリにあります。バージョン 0.14 では、別の設定ファイル `be_custom.conf` が導入されます。このファイルには、運用中にユーザーが動的に設定し、永続化した設定項目が記録されます。

BE プロセスの起動後、まず `be.conf` の設定項目を読み込み、次に `be_custom.conf` の設定項目を読み込みます。`be_custom.conf` の設定項目は、`be.conf` にある同じ項目を上書きします。

`be_custom.conf` ファイルの場所は、`be.conf` の設定項目 `custom_config_dir` で指定できます。

## 設定項目の確認

BE の設定項目を確認する方法は二つあります。

1. BE の Web ページ

    BE の Web ページにアクセスすると、現在の設定項目を確認できます。

    `http://be_host:be_webserver_port/varz`

2. コマンドで確認

   MySQL クライアントで次のコマンドを実行すると、BE の設定項目を確認できます。具体的な構文については [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください。

    `SHOW BACKEND CONFIG;`

    結果の各列の意味は次のとおりです。

    1. BackendId: Backend の ID。
    2. Host: Backend の IP アドレス。
    3. Key: 設定項目の名前。
    4. Value: 現在の設定値。
    5. Type: 設定値の型（整数や文字列など）。
    6. IsMutable: 動的に設定できるかどうか。true の場合は実行時に動的に設定できます。false の場合は be.conf でのみ設定でき、BE の再起動後に有効になります。

## 設定項目の変更

BE の設定項目を変更する方法は二つあります。

1. 静的な設定

   `conf/be.conf` ファイルに設定項目を追加して値を指定します。BE の起動時に `be.conf` の設定項目が読み込まれます。`be.conf` にない項目にはデフォルト値が使用されます。

2. 動的な設定

   BE の起動後、次のコマンドで設定項目を動的に変更できます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   バージョン 0.13 以前では、この方法で変更した設定項目は BE プロセスの再起動後に無効になります。バージョン 0.14 以降では、次のコマンドで変更内容を永続化できます。変更した設定項目は `be_custom.conf` ファイルに保存されます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## 例

1. `max_base_compaction_threads` を静的に変更する

   `be.conf` ファイルに次を追加します。

   ```max_base_compaction_threads=5```

   BE プロセスを再起動すると、設定が有効になります。

2. `streaming_load_max_mb` を動的に変更する

   BE の起動後、次のコマンドで設定項目 `streaming_load_max_mb` を動的に変更します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   次の戻り値は、設定が成功したことを示します。

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   BE の再起動後、この設定は無効になります。変更内容を永続化するには、次のコマンドを使用します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## 設定項目

### サービス

#### `deploy_mode`

* 型: string
* 説明: BE の実行モードです。`cloud` はストレージとコンピューティングを分離するモードを示します。
* デフォルト値: ""

#### `be_port`

* 型: int32
* 説明: FE からの要求を受け取る BE の Thrift サーバーのポートです。
* デフォルト値: 9060

#### `heartbeat_service_port`

* 型: int32
* 説明: FE からハートビートを受け取る BE のハートビートサービス（Thrift）のポートです。
* デフォルト値: 9050

#### `webserver_port`

* 型: int32
* 説明: BE の HTTP サーバーのサービスポートです。
* デフォルト値: 8040

#### `brpc_port`

* 型: int32
* 説明: BE 間の通信に使用する BRPC ポートです。
* デフォルト値: 8060

#### `arrow_flight_sql_port`

* 型: int32
* 説明: Arrow Flight クライアントと BE 間の通信に使用する、BE の Arrow Flight SQL サーバーのポートです。
* デフォルト値: -1

#### `enable_https`

* 型: bool
* 説明: HTTPS をサポートするかどうかを指定します。有効にする場合は、be.conf で `ssl_certificate_path` と `ssl_private_key_path` を設定してください。
* デフォルト値: false

#### `priority_networks`

* 説明: 複数の IP アドレスを持つサーバーで、使用するアドレスの選択方法を指定します。このリストに一致する IP アドレスは最大一つにしてください。CIDR 表記の値をセミコロンで区切ります（例: 10.10.10.0/24）。一致する IP アドレスがない場合は、ランダムに一つ選択されます。
* デフォルト値: 空欄

#### `storage_root_path`

* 型: string

* 説明: データのルートパスを ; で区切って指定します。各パスのストレージ媒体として HDD または SSD を指定でき、各パスの末尾に , で区切って容量制限を追加できます。SSD と HDD を併用しない場合は、以下の例 1、例 2 の設定方法を使う必要はなく、ストレージディレクトリを指定するだけでかまいません。その場合、FE のデフォルトのストレージ媒体設定も変更する必要はありません。

  例 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1./home/disk1/doris.HDD は、ストレージ媒体が HDD であることを示します。
    - 2./home/disk2/doris.SSD は、ストレージ媒体が SSD であることを示します。
    - 3./home/disk2/doris は、デフォルトでストレージ媒体が HDD であることを示します。

  例 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1./home/disk1/doris,medium:hdd は、ストレージ媒体が HDD であることを示します。
    - 2./home/disk2/doris,medium:ssd は、ストレージ媒体が SSD であることを示します。

* デフォルト値: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count`

* 型: int32
* 説明: BE でハートビートサービスを実行するスレッド数です。デフォルトは 1 で、変更は推奨されません。
* デフォルト値: 1

#### `ignore_broken_disk`

* 型: bool
* 説明: BE の起動時に、`storage_root_path` に設定されたすべてのパスを確認します。

    -  `ignore_broken_disk=true`

  パスが存在しない場合、またはそのパスにあるファイルを読み書きできない場合（ディスク障害）、そのパスは無視されます。他に利用可能なパスがあれば、起動は中断されません。

    -  `ignore_broken_disk=false`

  パスが存在しない場合、またはそのパスにあるファイルを読み書きできない場合（ディスク障害）、起動は失敗し、プロセスは終了します。

* デフォルト値: false

#### `mem_limit`

* 型: string
* 説明: BE プロセスが使用するメモリの上限を、サーバーの最大メモリに対する割合で指定します。BE がマシンのメモリを占有しすぎることを防ぎます。0 より大きい値を指定してください。100% を超える割合を指定すると、100% が使用されます。
* デフォルト値: 90%

#### `cluster_id`

* 型: int32
* 説明: BE が属するクラスターの ID を指定します。
    - 通常、この値は FE から BE にハートビートで渡されるため、設定する必要はありません。BE が特定の Doris クラスターに属すると確認できた場合は設定できます。その際、データディレクトリ内の cluster_id ファイルも、このパラメータと同じ値になるよう変更する必要があります。
* デフォルト値: -1

#### `custom_config_dir`

* 説明: `be_custom.conf` ファイルの場所を指定します。デフォルトでは `conf/` ディレクトリにあります。
    - 一部のデプロイ環境では、システムのアップグレード時に `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目も失われることがあります。これを防ぐには、`be_custom.conf` を別の指定したディレクトリに保存します。
* デフォルト値: 空欄

#### `trash_file_expire_time_sec`

* 説明: ごみ箱のクリーンアップ間隔は 24 時間です。ディスク容量が不足している場合、trash 内のファイルの保持期間はこの値に従わないことがあります。
* デフォルト値: 86400

#### `es_http_timeout_ms`

* 説明: HTTP 経由で ES に接続する際のタイムアウトです。
* デフォルト値: 5000 (ms)

#### `es_scroll_keepalive`

* 説明: ES Scroll の keep-alive 維持時間です。
* デフォルト値: 5 (m)

#### `external_table_connect_timeout_sec`

* 型: int32
* 説明: ODBC テーブルなどの外部テーブルとの接続を確立する際のタイムアウトです。
* デフォルト値: 5 秒

#### `pipeline_status_report_interval`

* 説明: プロファイルを報告する間隔です。
* デフォルト値: 5 秒

#### `brpc_max_body_size`

* 説明: 主に BRPC の `max_body_size` パラメータを変更するための設定です。

  - クエリが失敗し、BE ログに `body_size is too large` と表示されることがあります。これは「multi distinct + no group by + 1T を超えるデータ」の SQL モードで発生する可能性があります。このエラーは BRPC のパケットサイズが設定値を超えたことを示します。設定値を増やすと回避できます。

#### `brpc_socket_max_unwritten_bytes`

* 説明: 主に BRPC の `socket_max_unwritten_bytes` パラメータを変更するための設定です。
  - クエリが失敗し、BE ログに `The server is overcrowded` と表示されることがあります。これは送信側でバッファーに保持するメッセージが多すぎることを意味し、SQL が大きな bitmap 値を送信する場合などに発生します。設定値を増やすと回避できます。

#### `transfer_large_data_by_brpc`

* 型: bool
* 説明: Tuple/Block データの長さが 1.8G を超える場合、protoBuf リクエストをシリアライズし、そのデータをコントローラーの attachment に入れて HTTP BRPC で送信するかどうかを制御します。これにより、protoBuf リクエストが 2G を超えたときの Bad request, error_text=[E1003]Fail to compress request エラーを回避します。以前のバージョンでは、Tuple/Block データを attachment に入れた後、デフォルトの baidu_std BRPC で送信していましたが、attachment が 2G を超えると切り詰められます。HTTP BRPC での送信には 2G の制限がありません。
* デフォルト値: true

#### `brpc_num_threads`

* 説明: BRPC の bthread 数を変更するための設定です。デフォルト値は 256 です。
  - この設定を大きくすると、QPS 性能が向上する可能性があります。詳細は `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md` を参照してください。
* デフォルト値: 256

#### `thrift_rpc_timeout_ms`

* 説明: Thrift のデフォルトのタイムアウトです。
* デフォルト値: 60000

#### `thrift_client_retry_interval_ms`

* 型: int64
* 説明: FE の Thrift サーバーに過負荷が集中するのを防ぐため、BE の Thrift クライアントの再試行間隔を設定します。単位は ms です。
* デフォルト値: 1000

#### `thrift_connect_timeout_seconds`

* 説明: Thrift クライアントのデフォルトの接続タイムアウトです。
* デフォルト値: 3 (s)

#### `thrift_server_type_of_fe`

* 型: string
* 説明: FE の Thrift サービスで使用するサービスモデルを指定します。文字列型で、大文字と小文字は区別されません。FE の thrift_server_type パラメータと一致させる必要があります。現在設定できる値は `THREADED` と `THREAD_POOL` です。

    - `THREADED` の場合は、ノンブロッキング I/O モデルです。

    - `THREAD_POOL` の場合は、ブロッキング I/O モデルです。

#### `thrift_max_message_size`

デフォルト: 100MB

Thrift サーバーが受信するメッセージの最大サイズです。単位はバイトです。クライアントが送信したメッセージがこの上限を超えると、Thrift サーバーは要求を拒否して接続を閉じます。その結果、クライアントでは connection has been closed by peer. エラーが発生します。この場合は、パラメータの値を増やしてみてください。

#### `txn_commit_rpc_timeout_ms`

* 説明: トランザクションのコミット RPC のタイムアウトです。
* デフォルト値: 60,000 (ms)

#### `txn_map_shard_size`

* 説明: txn_map_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。トランザクション管理の性能を向上させます。
* デフォルト値: 128

#### `txn_shard_size`

* 説明: txn_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。トランザクションのコミットと公開の性能を向上させます。
* デフォルト値: 1024

#### `unused_rowset_monitor_interval`

* 説明: 期限切れ Rowset を削除する間隔です。
* デフォルト値: 30 (s)

#### `max_client_cache_size_per_host`

* 説明: ホストごとのクライアントキャッシュの最大数です。BE には複数のクライアントキャッシュがありますが、現在は同じキャッシュサイズ設定を使用します。必要に応じて、キャッシュごとに異なる設定を使用してください。
* デフォルト値: 10

#### `string_type_length_soft_limit_bytes`

* 型: int32
* 説明: String 型の最大長のソフトリミットです。
* デフォルト値: 1,048,576

#### `big_column_size_buffer`

* 型: int64
* 説明: ODBC 外部テーブルの使用時、ソーステーブルの列型が HLL、CHAR、VARCHAR のいずれかで、列値の長さがこの値を超えると、クエリは column value length longer than buffer length エラーになります。この値を増やすことで対処できます。
* デフォルト値: 65535

#### `small_column_size_buffer`

* 型: int64
* 説明: ODBC 外部テーブルの使用時、ソーステーブルの列型が HLL、CHAR、VARCHAR のいずれでもなく、列値の長さがこの値を超えると、クエリは column value length longer than buffer length エラーになります。この値を増やすことで対処できます。
* デフォルト値: 100

### クエリ

#### `fragment_mgr_asynic_work_pool_queue_size`

* 説明: 単一ノードで処理できる非同期作業の上限です。
* デフォルト値: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min`

* 説明: 非同期作業を実行するスレッド数です。デフォルトの最小スレッド数は 16 です。
* デフォルト値: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max`

* 説明: 非同期作業に応じてスレッドを動的に作成します。作成されるスレッドの最大数は 512 です。
* デフォルト値: 512

#### `doris_scanner_row_num`

* 説明: 各スキャンスレッドが一度の実行で返すデータ行数の上限です。
* デフォルト値: 16384

#### `doris_scanner_row_bytes`

* 説明: 一度の読み取りで実行フラグメントが扱う行のバイト数です。
    - 注意: テーブルの列数が多く、`select *` が停止する場合は、この設定を調整できます。
* デフォルト値: 10485760

#### `doris_scanner_thread_pool_queue_size`

* 型: int32
* 説明: Scanner スレッドプールのキュー長です。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに投入され、スケジュールを待ちます。投入済みタスク数がキュー長を超えると、キューに空きができるまで後続のタスク投入はブロックされます。
* デフォルト値: 102400

#### `doris_scanner_thread_pool_thread_num`

* 型: int32
* 説明: Scanner スレッドプールのスレッド数です。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに投入され、スケジュールされます。このパラメータでプールのサイズを決定します。
* デフォルト値: CPU コア数に依存します。 `max(48, 2 * num_of_cpu_cores)`

#### `doris_max_remote_scanner_thread_pool_thread_num`

* 型: int32
* 説明: Remote Scanner スレッドプールの最大スレッド数です。このプールはすべての外部データソースのスキャンタスクに使用されます。
* デフォルト: 512

#### `exchg_node_buffer_size_bytes`

* 型: int32
* 説明: ExchangeNode のバッファーキューのサイズです。単位はバイトです。Sender 側から送信されたデータ量が ExchangeNode のバッファーサイズを超えると、書き込み可能な空きができるまで後続のデータ送信はブロックされます。
* デフォルト値: 10485760

#### `doris_scan_range_max_mb`

* 型: int32
* 説明: 各 OlapScanner が読み取るデータ量の上限です。
* デフォルト値: 1024

### Compaction

#### `disable_auto_compaction`

* 型: bool
* 説明: 自動 compaction タスクを無効にするかどうかを指定します。
  - 通常は無効にします。デバッグ環境またはテスト環境で compaction タスクを手動で実行する場合は、この設定を有効にできます。
* デフォルト値: false

#### `enable_vertical_compaction`

* 型: bool
* 説明: 垂直 compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `vertical_compaction_num_columns_per_group`

* 型: int32
* 説明: 垂直 compaction での各グループの列数です。
* デフォルト値: 5

#### `vertical_compaction_max_row_source_memory_mb`

* 型: int32
* 説明: 垂直 compaction で row_source_buffer が使用するメモリの上限です。単位は MB です。
* デフォルト値: 200

#### `vertical_compaction_max_segment_size`

* 型: int32
* 説明: 垂直 compaction での出力先セグメントファイルの最大サイズです。単位は m bytes です。
* デフォルト値: 268435456

#### `enable_ordered_data_compaction`

* 型: bool
* 説明: 順序付きデータの compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `ordered_data_compaction_min_segment_size`

* 型: int32
* 説明: 順序付きデータの compaction で、入力 rowset のセグメントの最小サイズです。単位は m bytes です。
* デフォルト値: 10485760

#### `max_base_compaction_threads`

* 型: int32
* 説明: Base Compaction スレッドプールの最大スレッド数です。-1 はディスクごとにスレッドを一つ使用することを意味します。
* デフォルト値: 4

#### `generate_compaction_tasks_interval_ms`

* 説明: compaction タスクを生成する最小間隔です。単位は ms です。
* デフォルト値: 10 (ms)

#### `base_compaction_min_rowset_num`

* 説明: Base Compaction の実行条件の一つです。Cumulative ファイルの数がこの上限に達すると、Base Compaction が実行されます。
* デフォルト値: 5

#### `base_compaction_min_data_ratio`

* 説明: Base Compaction の実行条件の一つです。Cumulative ファイルのサイズが Base ファイルに対して指定した割合に達すると実行されます。
* デフォルト値: 0.3 (30%)

#### `total_permits_for_compaction_score`

* 型: int64
* 説明: すべての compaction タスクが保持する「permits」の上限です。compaction のメモリ消費量を制限するために設定できます。
* デフォルト値: 10000
* 動的変更: 可

#### `compaction_promotion_size_mbytes`

* 型: int64
* 説明: Cumulative Compaction の出力 rowset の合計ディスクサイズがこの値を超えると、その rowset が Base Compaction の対象になります。単位は m bytes です。
  - 通常、Cumulative Compaction に時間がかかりすぎてバージョンが滞留しないよう、2G 未満に設定します。
* デフォルト値: 1024

#### `compaction_promotion_ratio`

* 型: double
* 説明: Cumulative Compaction の出力 rowset の合計ディスクサイズが、Base バージョンの rowset に対して指定した割合を超えると、その rowset が Base Compaction の対象になります。
  - 通常は 0.02 以上、0.1 以下の値を推奨します。
* デフォルト値: 0.05

#### `compaction_promotion_min_size_mbytes`

* 型: int64
* 説明: Cumulative Compaction の出力 rowset の合計ディスクサイズがこの値より小さい場合、その rowset は Base Compaction の対象にならず、Cumulative Compaction の処理に残ります。単位は m bytes です。
  - 通常は 512m 以下に設定します。値が大きすぎると、初期の Base バージョンが小さすぎて Base Compaction が実行されないことがあります。
* デフォルト値: 128

#### `compaction_min_size_mbytes`

* 型: int64
* 説明: Cumulative Compaction で選択された rowset のディスクサイズがこの値より大きい場合、レベルポリシーに従って分割してマージします。小さい場合は直接マージします。単位は m bytes です。
  - 通常は 128m 以下に設定します。値が大きすぎると、Cumulative Compaction の書き込み増幅が増加します。
* デフォルト値: 64

#### `default_rowset_type`

* 型: string
* 説明: BE がデフォルトで選択するストレージ形式を指定します。設定可能な値は「**ALPHA**」と「**BETA**」です。主に次の二つの用途があります。
  - テーブルの storage_format が Default の場合、この設定で BE のストレージ形式を選択します。
  - BE が Compaction を実行するときのストレージ形式を選択します。
* デフォルト値: BETA

#### `cumulative_compaction_min_deltas`

* 説明: Cumulative Compaction 戦略での増分ファイル数の最小値です。
* デフォルト値: 5

#### `cumulative_compaction_max_deltas`

* 説明: Cumulative Compaction 戦略での増分ファイル数の最大値です。
* デフォルト値: 1000

#### `base_compaction_trace_threshold`

* 型: int32
* 説明: Base Compaction のトレース情報をログに記録するしきい値です。単位は秒です。
* デフォルト値: 10

Base Compaction は実行に時間がかかるバックグラウンドタスクです。この設定は、トレース情報をログに記録するしきい値です。ログファイルのトレース情報は次のようになります。

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
* 説明: Cumulative Compaction のトレース情報をログに記録するしきい値です。単位は秒です。
  - `base_compaction_trace_threshold` と同様です。
* デフォルト値: 2

#### `compaction_task_num_per_disk`

* 型: int32
* 説明: ディスク（HDD）で並列に実行する compaction タスクの数です。
* デフォルト値: 4

#### `compaction_task_num_per_fast_disk`

* 型: int32
* 説明: 高速ディスク（SSD）で並列に実行する compaction タスクの数です。
* デフォルト値: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round`

* 型: int32
* 説明: compaction タスクの生成時、Base Compaction の各ラウンドに対して実行する Cumulative Compaction のラウンド数です。
* デフォルト値: 9

#### `max_cumu_compaction_threads`

* 型: int32
* 説明: Cumulative Compaction スレッドプールの最大スレッド数です。-1 はディスクごとに一つのスレッドを意味します。
* デフォルト値: -1

#### `enable_segcompaction`

* 型: bool
* 説明: ロード中にセグメント compaction を使用し、-238 エラーを回避します。
* デフォルト値: true

#### `segcompaction_batch_size`

* 型: int32
* 説明: セグメント数がこのしきい値を超えると、セグメント compaction が実行されます。また、単一のセグメント compaction タスクに含める元のセグメント数の上限も指定します。
* デフォルト値: 10

#### `segcompaction_candidate_max_rows`

* 型: int32
* 説明: 単一の入力セグメントで許容される最大行数です。これより大きいセグメントはスキップされます。
* デフォルト値: 1048576

#### `segcompaction_candidate_max_bytes`

* 型: int64
* 説明: 単一の入力セグメントで許容される最大ファイルサイズです。これより大きいセグメントはスキップされます。
* デフォルト値: 104857600

#### `segcompaction_task_max_rows`

* 型: int32
* 説明: 単一のセグメント compaction タスクで許容される合計行数の上限です。
* デフォルト値: 1572864

#### `segcompaction_task_max_bytes`

* 型: int64
* 説明: 単一のセグメント compaction タスクで許容される合計ファイルサイズの上限です。
* デフォルト値: 157286400

#### `segcompaction_num_threads`

* 型: int32
* 説明: グローバルなセグメント compaction スレッドプールのサイズです。
* デフォルト値: 5

#### `disable_compaction_trace_log`

* 型: bool
* 説明: compaction のトレースログを無効にします。
  - true にすると、`cumulative_compaction_trace_threshold` と `base_compaction_trace_threshold` は機能せず、ログ出力が無効になります。
* デフォルト値: true

#### `pick_rowset_to_compact_interval_sec`

* 型: int64
* 説明: compaction 対象の rowset を選択する間隔です。単位は秒です。
* デフォルト値: 86400

#### `update_replica_infos_interval_seconds`

* 説明: ピアレプリカの情報を更新する最小間隔です。単位は秒です。
* デフォルト値: 60 (s)

#### `cold_data_compaction_score_threshold`

* 型: int32
* 説明: 冷データの compaction を実行する前に必要な最小 compaction スコアです。冷データのスコアがこのしきい値を超えると、compaction が検討されます。この値を調整すると、リモートストレージ上の冷データに対する compaction の頻度と実行度を制御できます。3.1.3 以降でサポートされます。
* デフォルト値: 100

#### `cold_data_compaction_thread_num`

* 型: int32
* 説明: 冷データの compaction に使用するスレッド数です。この設定でタスクの並列度を制御します。値を増やすと同時実行タスク数が増え、スループットが向上する可能性がある一方で、リソース消費量も増えます。
* デフォルト値: 2

#### `cold_data_compaction_interval_sec`

* 型: int32
* 説明: 冷データの compaction を実行する間隔です。単位は秒です。間隔を短くすると、より頻繁に compaction が検討され、クリーンアップは速くなる可能性がありますが、リソース消費量も増えます。
* デフォルト値: 1800 (秒)

#### `enable_compaction_pause_on_high_memory`

* 型: bool
* 説明: プロセスのメモリ使用量が多いときに compaction タスクを一時停止するかどうかを指定します。動的に変更できます。
  - 有効にすると、メモリ使用量が高い間は BE が compaction を一時停止し、クエリとロードを優先します。
  - ただし、compaction を一時停止すると、compaction スコアが高いタブレットほどマージしにくくなり、解消しようとしたメタデータとメモリの滞留がかえって悪化します。**バージョン 4.0.8 からデフォルト値は `true` から `false` に変更されました。** このため、メモリ使用量が高くても、デフォルトでは compaction は一時停止しません。
  - 従来の動作を維持するには `true` に設定してください。
* デフォルト値: false （4.0.8 より前は true）

### ロード

#### `enable_table_memtable_flush_backpressure`

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。この BE 上で、あるテーブルのフラッシュ待ち MemTable が多すぎる場合、そのテーブルへの新しい書き込みをブロックするかどうかを指定します。FE の設定 `enable_adaptive_random_bucket_load` と併用し、適応型ランダムバケットロード中に MemTable が蓄積してメモリ使用量が増えることを防ぎます。
* デフォルト値: true

#### `table_memtable_flush_pending_count_limit`

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。この BE 上で、単一のテーブルについてフラッシュ待ちにできる MemTable の最大数です。上限を超えると、待機数が上限を下回るまで新しい書き込みはブロックされます。`enable_table_memtable_flush_backpressure = true` の場合にのみ有効です。
* デフォルト値: 10

#### `group_commit_max_wal_num_per_table`

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。単一のテーブルに存在できる Group Commit WAL ファイルの最大数です。`0` は無制限を意味します。WAL の再生が失敗し続け、WAL の数が上限を超えると、そのテーブルの `async_mode` Group Commit ロードは `EXCEEDED_LIMIT` エラーで拒否されます。エラーメッセージは `Too many group commit async WALs for table ...` のようになります。この制限により、WAL が際限なく増加してディスクを使い切ることを防ぎます。
* デフォルト値: 10

#### `enable_stream_load_record`

* 型: bool
* 説明: Stream Load の記録機能を有効にするかどうかを指定します。デフォルトは false です。
* デフォルト値: false

#### `load_data_reserve_hours`

* 説明: Mini Load に使用します。Mini Load のデータファイルは、この時間が経過すると削除されます。
* デフォルト値: 4 (h)

#### `push_worker_count_high_priority`

* 説明: 優先度 HIGH のインポートタスクを処理するスレッド数です。
* デフォルト値: 3

#### `push_worker_count_normal_priority`

* 説明: 優先度 NORMAL のインポートタスクを処理するスレッド数です。
* デフォルト値: 3

#### `enable_single_replica_load`

* 説明: 単一レプリカでのデータロード機能を有効にするかどうかを指定します。
* デフォルト値: true

#### `load_error_log_reserve_hours`

* 説明: ロードエラーログは、この時間が経過すると削除されます。
* デフォルト値: 48 (h)

#### `load_error_log_limit_bytes`

* 説明: この値を超えるロードエラーログは切り詰められます。
* デフォルト値: 209715200 (バイト)

#### `load_process_max_memory_limit_percent`

* 説明: 単一ノード上のすべてのロードスレッドが使用できるメモリ上限の割合です。デフォルトは 50% です。
  - Doris のアップグレード時にロード性能へ影響しないよう、これらのデフォルト値は大きく設定されています。必要に応じて適切な値に設定してください。
* デフォルト値: 50 (%)

#### `load_process_soft_mem_limit_percent`

* 説明: ソフトリミットは、単一ノードのロードメモリ上限に対する割合です。たとえば、すべてのロードタスクのメモリ上限が 20GB の場合、デフォルトのソフトリミットはその 50% にあたる 10GB です。使用量がソフトリミットを超えると、メモリ消費量が最大のジョブが選択され、フラッシュによってメモリが解放されます。デフォルトは 50% です。
* デフォルト値: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec`

* 型: int32
* 説明: 単一レプリカロードで使用する、マスターレプリカとスレーブレプリカ間の BRPC のタイムアウトを変更します。
* デフォルト値: 60

#### `max_segment_num_per_rowset`

* 型: int32
* 説明: ロード時に新しく生成される rowset のセグメント数を制限します。しきい値を超えると、ロードは -238 エラーで失敗します。セグメント数が多すぎると compaction が大量のメモリを消費し、OOM エラーを引き起こします。
* デフォルト値: 200

#### `high_priority_flush_thread_num_per_store`

* 型: int32
* 説明: 優先度の高いロードタスクに割り当てる、ストレージパスごとのフラッシュスレッド数です。
* デフォルト値: 1

#### `routine_load_consumer_pool_size`

* 型: int32
* 説明: Routine Load で使用するデータコンシューマーのキャッシュ数です。
* デフォルト値: 10

#### `multi_table_batch_plan_threshold`

* 型: int32
* 説明: 単一ストリームの複数テーブルへのロードで使用します。Kafka から受信したメッセージバッチのサイズがこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。
* デフォルト値: 200

#### `multi_table_max_wait_tables`

* 型: int32
* 説明: 単一ストリームの複数テーブルへのロードで使用します。Kafka からメッセージバッチを受信したとき、プランを待つテーブル数がこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。このパラメータは、一度に要求・実行するプランが多すぎるのを防ぎます。ロード中に複数のテーブルを小さなバッチで処理することで、単一 RPC の負荷を減らし、データ処理のリアルタイム性を向上できます。
* デフォルト値: 5

#### `single_replica_load_download_num_workers`

* 型: int32
* 説明: 単一レプリカロードでセグメントをダウンロードする HTTP ワーカースレッド数です。ロードの同時実行数が増えた場合、この値を調整すると、スレーブレプリカがマスターレプリカからデータファイルを適時に同期できます。必要に応じて、I/O 性能を高めるために `webserver_num_workers` も増やしてください。
* デフォルト値: 64

#### `load_task_high_priority_threshold_second`

* 型: int32
* 説明: ロードタスクのタイムアウトがこのしきい値より短い場合、Doris は高優先度タスクとして扱います。高優先度タスクは専用のフラッシュスレッドプールを使用します。
* デフォルト: 120

#### `min_load_rpc_timeout_ms`

* 型: int32
* 説明: ロードジョブの各 RPC に適用する最小タイムアウトです。
* デフォルト: 20

#### `kafka_api_version_request`

* 型: bool
* 説明: 使用する Kafka のバージョンが 0.10.0.0 より古い場合は、false に設定してください。
* デフォルト: true

#### `kafka_broker_version_fallback`

* 説明: 使用する Kafka のバージョンが 0.10.0.0 より古く、kafka_api_version_request を false にした場合、フォールバックバージョン kafka_broker_version_fallback の設定値が使用されます。有効な値は 0.9.0.x と 0.8.x.y です。
* デフォルト: 0.10.0

#### `max_consumer_num_per_group`

* 説明: Routine Load で使用するデータコンシューマーグループ内の最大コンシューマー数です。
* デフォルト: 3

#### `streaming_load_max_mb`

* 型: int64
* 説明: 一度の Stream Load で許容される CSV データ量の上限です。
  - Stream Load は通常、数 GB 未満のデータのロードに適しており、大きすぎるデータには適していません。
* デフォルト値: 10240 (MB)
* 動的変更: 可

#### `streaming_load_json_max_mb`

* 型: int64
* 説明: 一度の Stream Load で許容される JSON データ量の上限です。単位は MB です。
  - JSON などの一部のデータ形式は分割できません。Doris は解析を始める前にすべてのデータをメモリに読み込む必要があります。そのため、この値で一度の Stream Load にロードできるデータ量を制限します。
* デフォルト値: 100
* 動的変更: 可

#### `olap_table_sink_send_interval_microseconds`

* 説明: ロード中、Coordinator の sink ノードから対応する BE にデータを送り続けるポーリングスレッドがあります。このスレッドは `olap_table_sink_send_interval_microseconds` マイクロ秒ごとに送信可能なデータがあるか確認します。
* デフォルト値: 1000

#### `olap_table_sink_send_interval_auto_partition_factor`

* 説明: 自動パーティションを有効にしたテーブルにデータをロードする場合、`olap_table_sink_send_interval_microseconds` の間隔では遅すぎます。この場合、実際の間隔にはこの係数が乗じられます。
* デフォルト値: 0.001

#### `enable_group_commit_streamload_be_forward`

* 型: bool
* 説明: ストレージとコンピューティングを分離したモードで、Group Commit の Stream Load を BE 間で転送するかどうかを指定します。Doris 4.0 系ではバージョン 4.0.8、4.1 系ではバージョン 4.1.4 で追加されました。動的に変更できます。
  - ロードバランサーが同じテーブルの Group Commit 要求を異なる BE にランダムに分散すると、効率的なバッチ処理ができなくなります。この機能を有効にすると、BE は要求を単一の対象 BE に転送します。
  - **バージョン 4.0.8 から、BE エンドポイント `/api/{db}/{table}/_stream_load_forward` はこの設定によって制御されます。`false` の場合、このエンドポイントへの要求は `403 Forbidden` を返し、`Stream load forward is disabled` というメッセージを伴います。`true` の場合でも認証を通過し、グローバルな `LOAD` 権限を持つ必要があります。**
  - この転送を使用するデプロイでは、FE と BE の両方で設定を `true` にしてください（同名の FE 設定については [FE 設定](./fe-config) を参照）。
* デフォルト値: false

### スレッド

#### `delete_worker_count`

* 説明: データ削除タスクを実行するスレッド数です。
* デフォルト値: 3

#### `clear_transaction_task_worker_count`

* 説明: トランザクションをクリーンアップするスレッド数です。
* デフォルト値: 1

#### `clone_worker_count`

* 説明: クローンタスクを実行するスレッド数です。
* デフォルト値: 3

#### `be_service_threads`

* 型: int32
* 説明: BE の Thrift サーバーサービスの実行スレッド数です。FE からの要求を実行するために使用できるスレッド数を表します。
* デフォルト値: 64

#### `download_worker_count`

* 説明: ダウンロード用スレッド数です。
* デフォルト値: 1

#### `drop_tablet_worker_count`

* 説明: タブレットを削除するスレッド数です。
* デフォルト値: 3

#### `flush_thread_num_per_store`

* 説明: ストレージごとに MemTable のフラッシュに使用するスレッド数です。
* デフォルト値: 2

#### `publish_version_worker_count`

* 説明: バージョンを公開するスレッド数です。
* デフォルト値: 8

#### `upload_worker_count`

* 説明: ファイルのアップロードに使用する最大スレッド数です。
* デフォルト値: 1

#### `webserver_num_workers`

* 説明: Web サーバーのデフォルトのワーカースレッド数です。
* デフォルト値: 48

#### `send_batch_thread_pool_thread_num`

* 型: int32
* 説明: SendBatch スレッドプールのスレッド数です。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてプールに投入され、スケジュールされます。このパラメータで SendBatch スレッドプールのサイズを決定します。
* デフォルト値: 64

#### `send_batch_thread_pool_queue_size`

* 型: int32
* 説明: SendBatch スレッドプールのキュー長です。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてプールに投入され、スケジュールを待ちます。投入済みタスク数がキュー長を超えると、キューに空きができるまで後続のタスク投入はブロックされます。
* デフォルト値: 102400

#### `make_snapshot_worker_count`

* 説明: スナップショットを作成するスレッド数です。
* デフォルト値: 5

#### `release_snapshot_worker_count`

* 説明: スナップショットを解放するスレッド数です。
* デフォルト値: 5

### メモリ

#### `madvise_huge_pages`

* 型: bool
* 説明: Linux の Huge Page を使用するかどうかを指定します。
* デフォルト値: false

#### `max_memory_sink_batch_count`

* 説明: 外部スキャンのキャッシュに保持するバッチ数の上限です。キャッシュには max_memory_cache_batch_count * batch_size 行が保持されます。デフォルトは 20 で、batch_size のデフォルトは 1024 です。したがって、20 * 1024 行がキャッシュされます。
* デフォルト値: 20

#### `memory_max_alignment`

* 説明: メモリの最大アラインメントです。
* デフォルト値: 16

#### `mmap_buffers`

* 説明: メモリの割り当てに mmap を使用するかどうかを指定します。
* デフォルト値: false

#### `memtable_mem_tracker_refresh_interval_ms`

* 説明: MemTable フラッシュマネージャーの更新処理間の間隔です。単位はミリ秒です。
* デフォルト値: 100

#### `zone_map_row_num_threshold`

* 型: int32
* 説明: ページ内の行数がこの値より少ない場合、データ量の増加を抑えるため ZoneMap を作成しません。
* デフォルト値: 20

#### `memory_mode`

* 型: string
* 説明: TCMalloc の GC を制御します。performance モードでは使用量が 90% * mem_limit 以上になると TCMalloc キャッシュのメモリを解放します。それ以外のモードでは 50% * mem_limit 以上になると解放します。
* デフォルト値: performance

#### `max_sys_mem_available_low_water_mark_bytes`

* 型: int64
* 説明: システムの `/proc/meminfo/MemAvailable` に対する下限の最大値です。単位はバイトで、デフォルトは 1.6G です。実際の下限は min(1.6G, MemTotal * 10%) で、16G を超える大容量メモリのマシンでメモリを無駄にしないための設定です。最大値を上げると、16G を超えるマシンでは Full GC 用に確保されるメモリバッファーが増えます。下げると、利用可能なメモリをより多く使用します。
* デフォルト値: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes`

* 説明: 単一のスキーマ変更タスクで許容される最大メモリ量です。
* デフォルト値: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes`

* 型: int32
* 説明: MemTracker の consume/release 時に TCMalloc Hook が扱う最小長です。この値より小さい消費量は累積され、MemTracker の consume/release を頻繁に呼び出さないようにします。値を小さくすると呼び出し頻度が増え、大きくすると MemTracker の統計値が不正確になります。理論上、統計値と実際の値の差は、mem_tracker_consume_min_size_bytes にその MemTracker が属する BE スレッド数を掛けた値です。
* デフォルト値: 1,048,576

#### `min_buffer_size`

* 説明: 読み取りバッファーの最小サイズです。
* デフォルト値: 1024 (バイト)

#### `write_buffer_size`

* 説明: フラッシュ前のバッファーサイズです。
  - ロードデータはまず BE 上のメモリブロックに書き込まれ、そのブロックがしきい値に達した時点でディスクに書き戻されます。デフォルトは 200MB です。しきい値が小さすぎると BE 上に小さなファイルが多数作成される可能性があります。値を増やすとファイル数を減らせますが、大きすぎると RPC のタイムアウトを引き起こす可能性があります。
* デフォルト値: 209,715,200

#### `remote_storage_read_buffer_mb`

* 型: int32
* 説明: HDFS またはオブジェクトストレージのファイルを読み取る際に使用するキャッシュサイズです。
  - この値を増やすとリモートデータの読み取り回数を減らせますが、メモリのオーバーヘッドは増えます。
* デフォルト値: 16 (MB)

#### `file_cache_type`

* 型: string
* 説明: キャッシュファイルの種類です。`whole_file_cache` はセグメントファイル全体をダウンロードし、`sub_file_cache` はサイズに応じてセグメントファイルを複数のファイルに分割します。"" に設定するとキャッシュされません。キャッシュが必要な場合は、このパラメータを設定してください。
* デフォルト値: ""

#### `path_gc_check`

* 型: bool
* 説明: リサイクルスキャンデータスレッドのチェックを有効にするかどうかを指定します。
* デフォルト値: true

#### `path_gc_check_interval_second`

* 説明: リサイクルスキャンデータスレッドのチェック間隔です。
* デフォルト値: 86400 (s)

#### `path_gc_check_step`

* デフォルト値: 1000

#### `path_gc_check_step_interval_ms`

* デフォルト値: 10 (ms)

#### `scan_context_gc_interval_min`

* 説明: コンテキスト GC スレッドの実行周期です。単位は分で、デフォルトは 5 分です。
* デフォルト値: 5

### ストレージ

#### `default_num_rows_per_column_file_block`

* 型: int32
* 説明: 単一の RowBlock に含めるデータ行数を設定します。
* デフォルト値: 1024

#### `disable_storage_page_cache`

* 型: bool
* 説明: インデックスのキャッシュにページキャッシュを使用しないかどうかを指定します。BETA ストレージ形式でのみ有効で、通常は false が推奨されます。
* デフォルト値: false

#### `disk_stat_monitor_interval`

* 説明: ディスクの状態を確認する間隔です。
* デフォルト値: 5 (s)

#### `max_free_io_buffers`

* 説明: IoMgr が各 I/O バッファーサイズについて保持するバッファーの最大数です。バッファーサイズは 1024B から 8MB までで、バッファーの合計は最大約 2GB です。
* デフォルト値: 128

#### `max_garbage_sweep_interval`

* 説明: ディスクのガベージクリーンアップの最大間隔です。
* デフォルト値: 3600 (s)

#### `max_percentage_of_error_disk`

* 型: int32
* 説明: ストレージエンジンが許容する故障ディスクの割合です。故障ディスクの割合がこの値を超えると、BE は自動的に終了します。
* デフォルト値: 0

#### `min_garbage_sweep_interval`

* 説明: ディスクのガベージクリーンアップの最小間隔です。
* デフォルト値: 180 (s)

#### `pprof_profile_dir`

* 説明: pprof プロファイルの保存ディレクトリです。
* デフォルト値: ${DORIS_HOME}/log

#### `small_file_dir`

* 説明: SmallFileMgr がダウンロードしたファイルの保存先です。
* デフォルト値: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir`

* 説明: UDF 関数のディレクトリです。
* デフォルト値: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes`

* 説明: データディレクトリに残しておく必要がある最小空き容量です。単位はバイトです。
* デフォルト値: 1073741824

#### `storage_flood_stage_usage_percent`

* 説明: storage_flood_stage_usage_percent と storage_flood_stage_left_capacity_bytes で、データディレクトリの最大使用量を制限します。
* デフォルト値: 90 (90%)

#### `storage_medium_migrate_count`

* 説明: クローン処理に使用するスレッド数です。
* デフォルト値: 1

#### `storage_page_cache_limit`

* 説明: ストレージページキャッシュのサイズです。
* デフォルト値: 20%

#### `storage_page_cache_shard_size`

* 説明: StoragePageCache のシャードサイズです。値は二の累乗にする必要があります。ロック競合を減らすため、BE の CPU コア数に近い値を推奨します。
* デフォルト値: 16

#### `index_page_cache_percentage`

* 型: int32
* 説明: ストレージページキャッシュ全体に対するインデックスページキャッシュの割合です。値の範囲は [0, 100] です。
* デフォルト値: 10

#### `segment_cache_capacity`
* 型: int32
* 説明: セグメントキャッシュのエントリ数の上限です。キーは rowset ID です。-1 は下位互換性のため fd_number * 2/5 として扱われます。
* デフォルト値: -1

#### `storage_strict_check_incompatible_old_format`

* 型: bool
* 説明: 互換性のない旧形式を厳密にチェックします。
* デフォルト値: true
* 動的変更: false

#### `sync_tablet_meta`

* 説明: ストレージエンジンで同期を有効にし、ディスクへ永続化するかどうかを指定します。
* デフォルト値: true

#### `pending_data_expire_time_sec`

* 説明: ストレージエンジンが未検証データを保持する最大時間です。
* デフォルト値: 1800 (s)

#### `ignore_rowset_stale_unconsistent_delete`

* 型: boolean
* 説明: 一貫したバージョンパスを構築できない場合に、期限切れのマージ済み rowset を削除するかどうかを指定します。
  - マージ済みの期限切れ rowset のバージョンパスは 半時間後に削除されます。異常な状況では、これらのバージョンを削除するとクエリの一貫したパスを構築できなくなることがあります。false の場合は厳密にチェックし、エラーを報告して終了します。true の場合はこのエラーを無視して動作を続けます。通常、エラーを無視してもクエリに影響しませんが、FE がマージ済みバージョンを割り当てると -230 エラーが発生します。
* デフォルト値: false

#### `create_tablet_worker_count`

* 説明: BE がタブレットを作成するワーカースレッド数です。
* デフォルト値: 3

#### `check_consistency_worker_count`

* 説明: タブレットのチェックサムを計算するワーカースレッド数です。
* デフォルト値: 1

#### `max_tablet_version_num`

* 型: int
* 説明: 単一のタブレットのバージョン数を制限します。ロードの頻度が高すぎる、または compaction が間に合わない場合にバージョンが大量に蓄積することを防ぎます。上限を超えるとロードタスクは拒否されます。
* デフォルト値: 2000

#### `tablet_map_shard_size`

* 説明: tablet_map_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）で、タブレット管理の性能を向上させます。
* デフォルト値: 4

#### `tablet_meta_checkpoint_min_interval_secs`

* 説明: TabletMeta Checkpoint スレッドのポーリング間隔です。
* デフォルト値: 600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num`

* 説明: TabletMeta Checkpoint の保存に必要な Rowset の最小数です。
* デフォルト値: 10

#### `tablet_rowset_stale_sweep_time_sec`

* 型: int64
* 説明: マージ済み rowset のバージョンを削除するまでの時間を制御します。現在時刻 now() から、バージョンパス内で最も新しく作成された rowset の作成時刻を引いた値が tablet_rowset_stale_sweep_time_sec を超えると、そのパスがクリーンアップされ、マージ済み rowset が削除されます。単位は秒です。
  - 書き込み頻度が高すぎると、FE がマージ済みバージョンを参照できず、クエリで -230 エラーが発生することがあります。このパラメータを増やすと回避できます。
* デフォルト値: 300

#### `tablet_writer_open_rpc_timeout_sec`

* 説明: タブレット状態キャッシュの更新間隔です。
    - ロード中に Batch（1024 行）を送信する RPC のタイムアウトです。デフォルトは 60 秒です。この RPC では複数のメモリバッチを書き込む場合があり、それがタイムアウトの原因になることがあります。値を調整すると、send batch fail などのタイムアウトエラーを減らせます。write_buffer_size を増やす場合は、このパラメータも増やしてください。
* デフォルト値: 60

#### `tablet_writer_ignore_eovercrowded`

* 型: bool
* 説明: データ書き込み時の BRPC エラー '[E1011]The server is overcrowded' を無視するための設定です。
* デフォルト値: false

#### `streaming_load_rpc_max_alive_time_sec`

* 説明: TabletsChannel の存続時間です。この間にデータを受信しなければ、チャネルは削除されます。
* デフォルト値: 1200

#### `alter_tablet_worker_count`

* 説明: スキーマ変更を実行するスレッド数です。
* デフォルト値: 3

#### `alter_index_worker_count`

* 説明: インデックス変更を実行するスレッド数です。
* デフォルト値: 3

#### `ignore_load_tablet_failure`

* 型: bool
* 説明: タブレットのロードに失敗した場合に、エラーを無視して BE の起動を続けるかどうかを指定します。
* デフォルト値: false

BE の起動時、各データディレクトリに個別のスレッドが起動し、タブレットヘッダーのメタ情報を読み込みます。デフォルト設定では、いずれかのディレクトリでタブレットの読み込みに失敗すると、起動処理が終了します。同時に、BE の INFO ログに次のエラーメッセージが表示されます（原文のコード表記: ` be The following error message is seen in the INFO `）。

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

このメッセージは、データディレクトリ内で読み込みに失敗したタブレットの数を示します。ログには失敗した各タブレットの詳細も記録されます。原因を調査するために手動での対応が必要です。調査後の復旧方法は通常、次の二つです。
  - タブレット情報を修復できない場合、他のレプリカが正常であれば、`meta_tool` ツールで問題のあるタブレットを削除します。
  - `ignore_load_tablet_failure` を true に設定すると、BE は問題のあるタブレットを無視して正常に起動します。

#### `report_disk_state_interval_seconds`

* 説明: エージェントが FE にディスクの状態を報告する間隔です。
* デフォルト値: 60 (s)

#### `result_buffer_cancelled_interval_time`

* 説明: 結果バッファーをキャンセルするまでの時間です。
* デフォルト値: 300 (s)

#### `snapshot_expire_time_sec`

* 説明: スナップショットファイルのクリーンアップ間隔です。
* デフォルト値:172800 (48 時間)

### ログ

#### `sys_log_dir`

* 型: string
* 説明: BE ログデータの保存ディレクトリです。
* デフォルト値: `${DORIS_HOME}/log`

#### `sys_log_level`

* 説明: ログレベルです: INFO < WARNING < ERROR < FATAL。
* デフォルト値: INFO

#### `sys_log_roll_mode`

* 説明: ログファイルの分割サイズです。1G ごとに分割されます。
* デフォルト値: SIZE-MB-1024

#### `sys_log_roll_num`

* 説明: 保持するログファイルの数です。
* デフォルト値: 10

#### `sys_log_verbose_level`

* 説明: ログの詳細表示レベルです。コード内の VLOG で始まるログの出力を制御します。
* デフォルト値: 10

#### `sys_log_verbose_modules`

* 説明: ログを出力するモジュールです。olap を指定すると、olap モジュールのログだけが出力されます。
* デフォルト値: 空

#### `aws_log_level`

* 型: int32
* 説明: AWS SDK のログレベルです。
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

* 説明: ログのフラッシュ方針です。デフォルトではメモリ内に保持します。
* デフォルト値: 空

### その他

#### `enable_arrow_input_validation`

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。Arrow データを Doris の内部列に変換する前に、Arrow の入力バッファーを検証するかどうかを指定します。有効にすると、不正な Arrow データによる BE のクラッシュを防げますが、検証に少量の追加処理が必要です。
* デフォルト値: true

#### `report_tablet_interval_seconds`

* 説明: エージェントが FE に OLAP テーブルを報告する間隔です。
* デフォルト値: 60 (s)

#### `report_task_interval_seconds`

* 説明: エージェントが FE にタスクシグネチャーを報告する間隔です。
* デフォルト値: 10 (s)

#### `periodic_counter_update_period_ms`

* 説明: レートカウンターとサンプリングカウンターの更新周期です。
* デフォルト値: 500 (ms)

#### `enable_metric_calculator`

* 説明: true にするとメトリクス計算器が動作し、BE 関連の指標情報を収集します。false にすると動作しません。
* デフォルト値: true

#### `enable_system_metrics`

* 説明: システム指標を有効または無効にします。
* デフォルト値: true

#### `enable_token_check`

* 説明: 将来の互換性のための設定で、後で削除されます。
* デフォルト値: true

#### `max_runnings_transactions_per_txn_map`

* 説明: トランザクションマネージャーの各 txn_partition_map に対するトランザクション数の上限です。大量のトランザクションを保持しないための保護機能です。
* デフォルト値: 2000

#### `max_download_speed_kbps`

* 説明: ダウンロード速度の上限です。
* デフォルト値: 50000 (kb/s)

#### `download_low_speed_time`

* 説明: ダウンロードの時間制限です。
* デフォルト値: 300 (s)

#### `download_low_speed_limit_kbps`

* 説明: ダウンロード速度の下限です。
* デフォルト値: 50 (KB/s)

#### `enable_batch_download`

* 説明: ファイルをバッチでダウンロードするかどうかを指定します。Binlog を有効にしている場合は、有効化を推奨します。
* デフォルト値: false

#### `priority_queue_remaining_tasks_increased_frequency`

* 説明: BlockingPriorityQueue 内の残りのタスクの優先度を上げる頻度です。
* デフォルト値: 512


#### `jdbc_drivers_dir`

* 説明: JDBC ドライバーを配置するデフォルトのディレクトリです。
* デフォルト値: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader`

* 説明: Stream Load 中の JSON 解析に simdjson を使用するかどうかを指定します。
* デフォルト値: true

#### `user_files_secure_path`

* 説明: `local` テーブル値関数が照会するファイルの保存ディレクトリです。
* デフォルト値: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes`

* 説明: BRPC ストリーミングクライアントがデータを送信する際のバッチサイズです。
* デフォルト値: 262144

#### `grace_shutdown_wait_seconds`

* 説明: クラウドネイティブのデプロイでは、BE がクラスターに追加されたり、クラスターから削除されたりする頻度が高くなります。停止中の BE でフラグメントが実行中の場合、ユーザーのクエリは失敗します。stop_be.sh --grace を使用すると、BE は実行中のすべてのクエリが停止するまで待ち、クエリの失敗を防ぎます。ただし、待機時間がこの上限を超えると、BE は直ちに終了します。待機中、FE はその BE に新しいクエリを送信しません。
* デフォルト値: 120

#### `enable_java_support`

* 説明: BE で Java JNI を使用するかどうかを指定します。有効にすると、C++ と Java の相互呼び出しができます。現在は Hudi、Java UDF、JDBC、MaxCompute、Paimon、preload、Avro をサポートします。
* デフォルト値: true

#### `group_commit_wal_path`

* Group Commit の `WAL` ディレクトリです。
* デフォルト: `wal` という名前のディレクトリが `storage_root_path` の各ディレクトリの下に作成されます。設定例:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### ストレージとコンピューティングの分離モード

#### `deploy_mode`

* デフォルト: ""

* 説明: BE の実行モードです。`cloud` はストレージとコンピューティングを分離するモードを示します。

#### `meta_service_endpoint`

デフォルト: ""

* 説明: メタサービスのエンドポイントを 'host1:port,host2:port' 形式で指定します。通常、この値は FE から BE へハートビートで渡されるため、設定する必要はありません。

#### `enable_file_cache`

デフォルト: true（Doris 4.2 以降はデフォルトで有効。cloud モードでは常に有効）。
* 説明: ファイルキャッシュを使用するかどうかを指定します。

#### `file_cache_path`

デフォルト: [{"path":"${DORIS_HOME}/file_cache"}]
* 説明: ファイルキャッシュに使用するディスクパスとその他のパラメータを配列で指定します。ディスクごとに個別のエントリを設定します。`path` はディスクパスを指定し、`total_size` はキャッシュサイズを制限します。-1 または 0 を指定するとディスク容量全体を使用します。
* 形式: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write`

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュに非同期で書き込むかどうかを指定します。有効にすると、リモートデータのファイルキャッシュへの書き込みがバックグラウンドのスレッドプールに渡され、読み取り処理をブロックしなくなるため、コールドリードのレイテンシーが下がります。
* デフォルト値: false

#### `async_file_cache_write_workers_per_disk`

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュに非同期で書き込む場合、キャッシュディスクごとに使用する書き込みスレッド数です。`enable_async_file_cache_write = true` の場合にのみ有効です。
* デフォルト値: 16

#### `async_file_cache_write_max_pending_bytes`

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュへの非同期書き込み待ちデータの合計サイズの上限です。単位はバイトです。上限を超えた書き戻し要求は破棄されます。クエリの正しさには影響しませんが、そのデータはキャッシュされません。`-1` は無制限を意味します。
* デフォルト値: -1

#### `enable_file_cache_write_from_s3_file_writer`

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージへの書き込みと同時にローカルのファイルキャッシュにもデータを書き込み、新しく書き込まれたデータをキャッシュから直接読み取れるようにするかどうかを指定します。
* デフォルト値: true

#### `enable_file_cache_write_index_file_only`

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。インデックスファイルだけをファイルキャッシュに書き込むかどうかを指定します。有効にすると、キャッシュ容量が限られている場合にインデックスが優先してキャッシュに残ります。
* デフォルト値: false

#### `enable_cache_read_from_peer`

* 型: bool
* 説明: ピアキャッシュ読み取りのマスタースイッチです。有効にすると、ローカルの File Cache でミスした場合、まず別の BE（同じコンピュートグループまたは別のグループ）の File Cache からブロックを読み取り、どの BE にもない場合にのみオブジェクトストレージにフォールバックします。同じグループ内とグループ間のピア読み取りは、このスイッチでまとめて制御されます。グループ間の読み取りだけを無効にすることはできません。グループ間のピア読み取りはバージョン 4.2.0 からサポートされ、同時に設定項目 `cache_read_from_peer_expired_seconds` は削除されました。[ピアキャッシュ読み取り](../../compute-storage-decoupled/file-cache/file-cache-peer-read)を参照してください。
* デフォルト値: true

#### `enable_peer_s3_race`

* 型: bool
* 説明: バージョン 4.2.0 で追加されました。ピアからの読み取りとオブジェクトストレージからの読み取りを競合させ、先に返った結果を使用するかどうかを指定します。無効にすると、ピア候補を順に試し、すべて失敗してからオブジェクトストレージを読み取ります。
* デフォルト値: true

#### `peer_race_hedge_delay_ms`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。競合時にピア読み取りを先行させる時間です。単位はミリ秒です。この時間内にピアから応答があれば、オブジェクトストレージへの読み取りは送信しません。`0` にすると両方の読み取りが同時に始まります。
* デフォルト値: 20

#### `max_concurrent_peer_races`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。単一の BE で並列実行できる、ピアとオブジェクトストレージの読み取り競合の最大数です。上限を超えたキャッシュミスでは順次読み取ります。
* デフォルト値: 64

#### `peer_cache_fill_compute_group_id`

* 型: string
* 説明: バージョン 4.2.0 で追加されました。読み取りを発行する BE に設定します。グループ間のキャッシュ補充を担当するコンピュートグループの ID です。グループ名ではなく、`compute_group_id` を指定します。この値は `Tag` 列に含まれ、`SHOW BACKENDS` で確認できます。選択されたピア候補がこのグループに属し、ブロックを保持していない場合、オブジェクトストレージからブロックを取得して自身の File Cache に書き込むよう要求します。空文字列は補充を使用しないことを意味します。
* デフォルト値: ""

#### `enable_peer_server_cache_fill`

* 型: bool
* 説明: バージョン 4.2.0 で追加されました。キャッシュを提供する BE に設定します。補充フラグ付きのピア読み取り要求を受け入れるかどうかを指定します。無効にすると、ローカルにキャッシュされていないブロックは未検出として報告され、要求元 BE はオブジェクトストレージにフォールバックします。
* デフォルト値: true

#### `peer_server_cache_fill_timeout_ms`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側で一度の補充を待つ最大時間です。単位はミリ秒です。タイムアウトすると、要求元 BE はオブジェクトストレージにフォールバックします。
* デフォルト値: 6000

#### `max_concurrent_peer_server_fills`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側で並列実行できる補充の最大数です。上限を超えた補充要求は拒否され、要求元 BE はオブジェクトストレージにフォールバックします。
* デフォルト値: 32

#### `peer_rpc_failure_eviction_threshold`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピア候補で RPC が連続してこの回数失敗すると、候補リストから削除されます。
* デフォルト値: 3

#### `peer_all_miss_cooldown_threshold`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。すべてのピア候補でミスする読み取りがこの回数連続すると、タブレットはクールダウンに入ります。その間の読み取りは直接オブジェクトストレージに向かいます。
* デフォルト値: 5

#### `peer_all_miss_cooldown_duration_s`

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。ピア読み取りのクールダウン時間です。単位は秒です。
* デフォルト値: 300

#### `peer_candidate_expiry_s`

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。ピア候補エントリの有効期間です。単位は秒で、最後の使用時点から計測します。期限切れのエントリはメモリから削除され、次のキャッシュミス時に FE から再取得されます。
* デフォルト値: 3600

#### `peer_candidate_cleanup_interval_s`

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。期限切れのピア候補を削除するバックグラウンドジョブの実行間隔です。単位は秒です。
* デフォルト値: 3600

#### `peer_fetch_queue_timeout_ms`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピア読み取り要求が提供側の処理キューで待機できる最大時間です。単位はミリ秒です。これを超えて待機した要求は拒否され、要求元 BE が速やかにオブジェクトストレージにフォールバックできるようにします。
* デフォルト値: 100

#### `brpc_peer_fetch_pool_threads`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側でピア読み取り要求を処理するスレッドプールのサイズです。ロードなど負荷の高い RPC のスレッドプールとは分離されています。`-1` は `max(64, 2 × CPU cores)` を意味します。動的には変更できません。
* デフォルト値: -1

#### `brpc_peer_fetch_pool_max_queue_size`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側のピア読み取りスレッドプールのキュー長です。`-1` は `max(4096, 128 × CPU cores)` を意味します。動的には変更できません。
* デフォルト値: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num`

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピアとオブジェクトストレージの読み取り競合中に、要求側でオブジェクトストレージの読み取りを実行するプールの最小／最大スレッド数です。動的には変更できません。
* デフォルト値: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core`

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コアごとに計算する、オブジェクトストレージへの GET／PUT 要求の QPS 上限です。負の値はこのモードを無効にし、従来の絶対トークン設定にフォールバックします。`0` は QPS 無制限を意味します。
* デフォルト値: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max`

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から算出された GET／PUT QPS の厳密な上限です。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core`

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コアごとに計算する、オブジェクトストレージへの GET／PUT の帯域幅上限です。単位はコアあたりのバイト/秒です。`0` 以下の値は帯域幅無制限を意味します。
* デフォルト値: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max`

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から算出された GET／PUT 帯域幅の厳密な上限です。単位はバイト/秒です。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_rate_limiter_cpu_cores_override`

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。上記のレート制限の算出に使用する CPU コア数です。`0` 以下の値は、マシンのコア数を自動検出することを意味します。
* デフォルト値: 0

#### `s3_rate_limiter_log_interval`

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージのレート制限が発動したときに出力するログエントリ間の最小間隔です。単位はミリ秒です。
* デフォルト値: 1000

#### `file_cache_mem_storage_shard_num`

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュのメモリストレージのシャード数です。同時アクセス時のロック競合を減らすために使用します。
* デフォルト値: 1024

#### `time_series_max_tablet_version_num`

* 型: int
* 説明: 時系列 compaction ポリシーを使用する 単一のタブレットのバージョン数を制限します。ロードの頻度が高すぎる、または compaction が間に合わない場合にバージョンが大量に蓄積することを防ぎます。上限を超えるとロードタスクは拒否されます。
* デフォルト値: 20000
