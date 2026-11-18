---
{
    "title": "BE の設定",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "このドキュメントでは、主に BE の設定項目について説明します。"
}
---

# BE の設定 {#be-configuration}

このドキュメントでは、主に BE の設定項目について説明します。

BE の設定ファイル `be.conf` は通常、BE のデプロイ先にある `conf/` ディレクトリに保存されます。バージョン 0.14 では、別の設定ファイル `be_custom.conf` が導入されます。このファイルには、ユーザーが運用中に動的に設定し、永続化した設定項目が記録されます。

BE プロセスの起動後、まず `be.conf` の設定項目が読み込まれ、次に `be_custom.conf` の設定項目が読み込まれます。`be_custom.conf` の設定項目は、`be.conf` にある同じ設定項目を上書きします。

`be_custom.conf` ファイルの場所は、`be.conf` の設定項目 `custom_config_dir` で指定できます。

## 設定項目の確認 {#view-configuration-items}

BE の設定項目を確認する方法は次のとおりです。

1. BE の Web ページ

    BE の Web ページにアクセスすると、現在の設定項目を確認できます。

    `http://be_host:be_webserver_port/varz`

2. コマンドによる確認

   MySQL クライアントで次のコマンドを実行すると、BE の設定項目を確認できます。具体的な構文については [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください。

    `SHOW BACKEND CONFIG;`

    結果の各列の意味は次のとおりです。

    1. BackendId: backend の ID。
    2. Host: backend の IP アドレス。
    3. Key: 設定項目の名前。
    4. Value: 現在の設定値。
    5. Type: 整数や文字列など、設定値の型。
    6. IsMutable: 動的に設定できるかどうか。true の場合、実行中に動的に設定できます。false の場合、`be.conf` でのみ設定でき、BE の再起動後に有効になります。

## 設定項目の設定 {#set-configuration-items}

BE の設定項目は次の方法で設定できます。

1. 静的設定

   `conf/be.conf` ファイルに設定項目を追加して値を指定します。`be.conf` の設定項目は BE の起動時に読み込まれます。`be.conf` にない設定項目にはデフォルト値が使用されます。

2. 動的設定

   BE の起動後、次のコマンドで設定項目を動的に設定できます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   バージョン 0.13 以前では、この方法で変更した設定項目は BE プロセスの再起動後に無効になります。バージョン 0.14 以降では、次のコマンドで変更内容を永続化できます。変更した設定項目は `be_custom.conf` ファイルに保存されます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## 例 {#examples}

1. `max_base_compaction_threads` を静的に変更する

   `be.conf` ファイルに次を追加します。

   ```max_base_compaction_threads=5```

   その後、BE プロセスを再起動すると設定が有効になります。

2. `streaming_load_max_mb` を動的に変更する

   BE の起動後、次のコマンドで設定項目 `streaming_load_max_mb` を動的に設定します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   次の戻り値は、設定に成功したことを示します。

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   この設定は BE の再起動後に無効になります。変更を永続化するには、次のコマンドを使用します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## 設定項目 {#configurations}

### サービス {#services}

#### `deploy_mode` {#deploy_mode}

* 型: string
* 説明: BE の実行モード。`cloud` はストレージとコンピューティングを分離したモードを示します。
* デフォルト値: ""

#### `bvar_max_dump_multi_dimension_metric_num` {#bvar_max_dump_multi_dimension_metric_num}

* 型: string
* 説明: バージョン 4.1.5 以降でサポートされます。`/brpc_metrics` がエクスポートする多次元 bvar メトリクスのサンプル数の上限です。`0` に設定すると、これらのサンプルは無効になります。変更を有効にするには BE の再起動が必要です。
* デフォルト値: 5000

#### `be_port` {#be_port}

* 型: int32
* 説明: FE からのリクエストを受け取る、BE 上の Thrift サーバーのポートです。
* デフォルト値: 9060

#### `heartbeat_service_port` {#heartbeat_service_port}

* 型: int32
* 説明: FE からのハートビートを受け取る、BE 上のハートビートサービスのポート（Thrift）です。
* デフォルト値: 9050

#### `webserver_port` {#webserver_port}

* 型: int32
* 説明: BE 上の HTTP サーバーのサービスポートです。
* デフォルト値: 8040

#### `brpc_port` {#brpc_port}

* 型: int32
* 説明: BE 間の通信に使用する、BE 上の BRPC のポートです。
* デフォルト値: 8060

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

* 型: int32
* 説明: Arrow Flight Client と BE の通信に使用する、BE 上の Arrow Flight SQL サーバーのポートです。
* デフォルト値: -1

#### `enable_https` {#enable_https}

* 型: bool
* 説明: HTTPS をサポートするかどうかを指定します。有効にする場合は、be.conf で `ssl_certificate_path` と `ssl_private_key_path` を設定します。
* デフォルト値: false

#### `priority_networks` {#priority_networks}

* 説明: 複数の IP アドレスを持つサーバーの選択方法を指定します。このリストに一致する IP アドレスは最大でも 1 つにしてください。10.10.10.0/24 のような CIDR 表記をセミコロンで区切って指定します。規則に一致する IP アドレスがない場合は、ランダムに選択されます。
* デフォルト値: 空欄

#### `storage_root_path` {#storage_root_path}

* 型: string

* 説明: データのルートパスを `;` で区切って指定します。各ルートパスのストレージメディアとして HDD または SSD を指定できます。また、各ルートパスの末尾に `,` で区切って容量制限を追加できます。SSD と HDD を混在させない場合は、以下の例 1 と例 2 の指定方法を使う必要はなく、ストレージディレクトリを指定するだけで構いません。FE のデフォルトのストレージメディア設定を変更する必要もありません。

  例 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1./home/disk1/doris.HDD は、ストレージメディアが HDD であることを示します。
    - 2./home/disk2/doris.SSD は、ストレージメディアが SSD であることを示します。
    - 3./home/disk2/doris は、ストレージメディアがデフォルトの HDD であることを示します。

  例 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1./home/disk1/doris,medium:hdd は、ストレージメディアが HDD であることを示します。
    - 2./home/disk2/doris,medium:ssd は、ストレージメディアが SSD であることを示します。

* デフォルト値: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count` {#heartbeat_service_thread_count}

* 型: int32
* 説明: BE 上でハートビートサービスを実行するスレッド数です。デフォルトは 1 で、変更は推奨されません。
* デフォルト値: 1

#### `ignore_broken_disk` {#ignore_broken_disk}

* 型: bool
* 説明: BE の起動時に、``storage_root_path`` で設定されたすべてのパスを確認します。

    -  `ignore_broken_disk=true`

  パスが存在しない場合や、そのパスでファイルを読み書きできない場合（ディスク障害）は、そのパスを無視します。他に利用可能なパスがあれば、起動は中断されません。

    -  `ignore_broken_disk=false`

  パスが存在しない場合や、そのパスでファイルを読み書きできない場合（ディスク障害）は、起動を中止して終了します。

* デフォルト値: false

#### `mem_limit` {#mem_limit}

* 型: string
* 説明: BE プロセスが使用するメモリを、サーバーの最大メモリに対する割合で制限します。BE がマシンのメモリを過度に占有することを防ぎます。このパラメータは 0 より大きくする必要があります。割合が 100% を超える場合、値はデフォルトで 100% になります。
* デフォルト値: 90%

#### `cluster_id` {#cluster_id}

* 型: int32
* 説明: BE が属するクラスター ID を設定します。
    - 通常、この値は FE からハートビートを通じて BE に送られるため、設定は不要です。BE が特定の Doris クラスターに属することが確認できた場合は設定できます。その際、データディレクトリ内の cluster_id ファイルも、このパラメータと同じ値になるよう変更する必要があります。
* デフォルト値: -1

#### `custom_config_dir` {#custom_config_dir}

* 説明: `be_custom.conf` ファイルの場所を設定します。デフォルトでは `conf/` ディレクトリにあります。
    - デプロイ環境によっては、システムのアップグレード時に `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目も失われることがあります。その場合、`be_custom.conf` を別の指定ディレクトリに保存すると、設定ファイルの上書きを防げます。
* デフォルト値: 空欄

#### `trash_file_expire_time_sec` {#trash_file_expire_time_sec}

* 説明: ごみ箱のクリーンアップ間隔は 24 時間です。ディスク容量が不足している場合、trash 内のファイルの保持期間はこのパラメータに従わないことがあります。
* デフォルト値: 86400

#### `es_http_timeout_ms` {#es_http_timeout_ms}

* 説明: HTTP 経由で ES に接続する際のタイムアウトです。
* デフォルト値: 5000 (ms)

#### `es_scroll_keepalive` {#es_scroll_keepalive}

* 説明: ES scroll の keep-alive 保持時間です。
* デフォルト値: 5 (m)

#### `external_table_connect_timeout_sec` {#external_table_connect_timeout_sec}

* 型: int32
* 説明: ODBC テーブルなどの外部テーブルとの接続を確立する際のタイムアウトです。
* デフォルト値: 5 秒

#### `pipeline_status_report_interval` {#pipeline_status_report_interval}

* 説明: profile レポートの報告間隔です。
* デフォルト値: 5 秒

#### `brpc_max_body_size` {#brpc_max_body_size}

* 説明: 主に brpc の `max_body_size` パラメータを変更するための設定です。

  - クエリが失敗し、BE のログに `body_size is too large` というエラーが表示されることがあります。SQL のパターンが「multi distinct + group by なし + データ量が 1T 超」の場合などに発生します。このエラーは、brpc のパケットサイズが設定値を超えたことを示します。設定値を大きくすると回避できます。

#### `brpc_socket_max_unwritten_bytes` {#brpc_socket_max_unwritten_bytes}

* 説明: 主に brpc の `socket_max_unwritten_bytes` パラメータを変更するための設定です。
  - クエリが失敗し、BE のログに `The server is overcrowded` というエラーが表示されることがあります。これは送信側でバッファリングするメッセージが多すぎることを意味し、SQL が大きな bitmap 値を送信する場合などに発生します。設定値を大きくすると回避できます。

#### `transfer_large_data_by_brpc` {#transfer_large_data_by_brpc}

* 型: bool
* 説明: Tuple/Block データの長さが 1.8G を超える場合に、protoBuf リクエストをシリアライズし、Tuple/Block データを controller attachment に埋め込んで HTTP brpc 経由で送信するかどうかを制御します。これにより、protoBuf リクエストの長さが 2G を超えたときのエラー「Bad request, error_text=[E1003]Fail to compress request」を回避します。以前のバージョンでは、Tuple/Block データを attachment に入れた後、デフォルトの baidu_std brpc 経由で送信していましたが、attachment が 2G を超えると切り詰められました。HTTP brpc 経由の送信には 2G の制限がありません。
* デフォルト値: true

#### `brpc_num_threads` {#brpc_num_threads}

* 説明: 主に brpc の bthreads の数を変更するための設定です。デフォルト値は 256 です。
  - 値を大きくすると QPS 性能が向上する場合があります。詳細は `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md` を参照してください。
* デフォルト値: 256

#### `thrift_rpc_timeout_ms` {#thrift_rpc_timeout_ms}

* 説明: Thrift のデフォルトのタイムアウトです。
* デフォルト値: 60000

#### `thrift_client_retry_interval_ms` {#thrift_client_retry_interval_ms}

* 型: int64
* 説明: FE の Thrift サーバーでリクエストが集中する事態を避けるため、BE の Thrift クライアントの再試行間隔を設定します。単位は ms です。
* デフォルト値: 1000

#### `thrift_connect_timeout_seconds` {#thrift_connect_timeout_seconds}

* 説明: Thrift クライアント接続のデフォルトのタイムアウトです。
* デフォルト値: 3 (s)

#### `thrift_server_type_of_fe` {#thrift_server_type_of_fe}

* 型: string
* 説明: FE の Thrift サービスが使用するサービスモデルを示します。値は文字列で、大文字と小文字は区別されません。FE の thrift_server_type パラメータの設定と一致させる必要があります。指定できる値は `THREADED` と `THREAD_POOL` です。

    - `THREADED` の場合は、ノンブロッキング I/O モデルです。

    - `THREAD_POOL` の場合は、ブロッキング I/O モデルです。

#### `thrift_max_message_size` {#thrift_max_message_size}

デフォルト: 100MB

Thrift サーバーが受信するメッセージの最大サイズをバイト単位で指定します。クライアントが送信したメッセージがこの制限を超えると、Thrift サーバーはリクエストを拒否して接続を閉じます。その結果、クライアントでは「connection has been closed by peer.」というエラーが発生します。この場合は、パラメータの値を大きくしてみてください。

#### `txn_commit_rpc_timeout_ms` {#txn_commit_rpc_timeout_ms}

* 説明: txn のコミット RPC のタイムアウトです。
* デフォルト値: 60,000 (ms)

#### `txn_map_shard_size` {#txn_map_shard_size}

* 説明: txn_map_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。txn の管理性能を向上させるための設定です。
* デフォルト値: 128

#### `txn_shard_size` {#txn_shard_size}

* 説明: txn_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。txn のコミットと公開の性能を向上させるための設定です。
* デフォルト値: 1024

#### `unused_rowset_monitor_interval` {#unused_rowset_monitor_interval}

* 説明: 期限切れの Rowset を削除する間隔です。
* デフォルト値: 30 (s)

#### `max_client_cache_size_per_host` {#max_client_cache_size_per_host}

* 説明: ホストごとのクライアントキャッシュの最大数です。BE には複数のクライアントキャッシュがありますが、現在は同じキャッシュサイズ設定を使用しています。必要に応じて、クライアントキャッシュごとに異なる設定を使用してください。
* デフォルト値: 10

#### `string_type_length_soft_limit_bytes` {#string_type_length_soft_limit_bytes}

* 型: int32
* 説明: String 型の最大長に対するソフトリミットです。
* デフォルト値: 1,048,576

#### `big_column_size_buffer` {#big_column_size_buffer}

* 型: int64
* 説明: ODBC 外部テーブルを使用する際、ODBC ソーステーブルの列の型が HLL、CHAR、VARCHAR のいずれかで、列値の長さがこの値を超えると、クエリは「column value length longer than buffer length」というエラーを返します。この値を大きくすることができます。
* デフォルト値: 65535

#### `small_column_size_buffer` {#small_column_size_buffer}

* 型: int64
* 説明: ODBC 外部テーブルを使用する際、ODBC ソーステーブルの列の型が HLL、CHAR、VARCHAR のいずれでもなく、列値の長さがこの値を超えると、クエリは「column value length longer than buffer length」というエラーを返します。この値を大きくすることができます。
* デフォルト値: 100

### クエリ {#query}

#### `ignore_not_found_file_in_external_table` {#ignore_not_found_file_in_external_table}

* 型: bool
* 説明: 外部テーブルのリーダーが見つからないファイルをスキップできるかどうかを指定します。動的な設定に対応しています。バージョン 4.1.5 以降、コミット済みの Iceberg スナップショット内でデータファイルまたは削除ファイルが欠落している場合は、`true` であってもクエリが失敗します。これにより、不完全なスナップショットが気付かれずに返されることを防ぎます。
* デフォルト値: true

#### `parquet_metadata_size_limit` {#parquet_metadata_size_limit}

* 型: int64
* 説明: バージョン 4.1.5 以降でサポートされます。ネイティブ Parquet V2 リーダーが扱う、シリアライズされたファイルフッターメタデータの最大サイズをバイト単位で指定します。`0` より大きい値にする必要があります。上限を超えると `Parquet v2 footer size ... exceeds metadata limit ...` が返されます。動的な設定に対応しています。フッターが大きい有効なファイルに対しては、メモリ予算の範囲内で値を大きくしてください。
* デフォルト値: 268435456 (256 MiB)

#### `fragment_mgr_asynic_work_pool_queue_size` {#fragment_mgr_asynic_work_pool_queue_size}

* 説明: 単一ノードで処理できる非同期作業の上限です。
* デフォルト値: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min` {#fragment_mgr_asynic_work_pool_thread_num_min}

* 説明: 非同期作業を実行するスレッド数です。デフォルトの最小スレッド数は 16 です。
* デフォルト値: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max` {#fragment_mgr_asynic_work_pool_thread_num_max}

* 説明: 非同期作業に応じてスレッドを動的に作成します。作成されるスレッドの上限は 512 です。
* デフォルト値: 512

#### `doris_scanner_row_num` {#doris_scanner_row_num}

* 説明: 各スキャンスレッドが一度の実行で返すデータ行の最大数です。
* デフォルト値: 16384

#### `doris_scanner_row_bytes` {#doris_scanner_row_bytes}

* 説明: 一度の読み取りで実行フラグメントが扱う行データのバイト数です。
    - 注: テーブルの列数が多く、`select *` が停止する場合は、この設定を調整できます。
* デフォルト値: 10485760

#### `doris_scanner_thread_pool_queue_size` {#doris_scanner_thread_pool_queue_size}

* 型: int32
* 説明: Scanner スレッドプールのキュー長です。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに投入され、スケジュールを待ちます。投入済みタスクの数がキュー長を超えると、後続の投入はキューに空きができるまでブロックされます。
* デフォルト値: 102400

#### `doris_scanner_thread_pool_thread_num` {#doris_scanner_thread_pool_thread_num}

* 型: int32
* 説明: Scanner スレッドプールのスレッド数です。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに投入され、スケジュールされます。このパラメータで Scanner スレッドプールのサイズを決めます。
* デフォルト値: CPU コア数によって決まり、`max(48, 2 * num_of_cpu_cores)` と等しくなります。

#### `doris_max_remote_scanner_thread_pool_thread_num` {#doris_max_remote_scanner_thread_pool_thread_num}

* 型: int32
* 説明: Remote scanner スレッドプールの最大スレッド数です。このプールは、すべての外部データソースのスキャンタスクに使用されます。
* デフォルト: 512

#### `exchg_node_buffer_size_bytes` {#exchg_node_buffer_size_bytes}

* 型: int32
* 説明: ExchangeNode ノードの Buffer キューのサイズをバイト単位で指定します。Sender 側から送られたデータ量が ExchangeNode の Buffer サイズを超えると、Buffer に書き込み用の空きができるまで後続の送信はブロックされます。
* デフォルト値: 10485760

#### `doris_scan_range_max_mb` {#doris_scan_range_max_mb}

* 型: int32
* 説明: 各 OlapScanner が読み取るデータ量の上限です。
* デフォルト値: 1024

### compaction {#compaction}

#### `disable_auto_compaction` {#disable_auto_compaction}

* 型: bool
* 説明: 自動 compaction タスクを無効にするかどうかを指定します。
  - 通常は無効化しない設定にします。デバッグ環境やテスト環境で compaction タスクを手動操作する場合は、この設定を有効にできます。
* デフォルト値: false

#### `enable_vertical_compaction` {#enable_vertical_compaction}

* 型: bool
* 説明: vertical compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `vertical_compaction_num_columns_per_group` {#vertical_compaction_num_columns_per_group}

* 型: int32
* 説明: vertical compaction における各グループの列数です。
* デフォルト値: 5

#### `vertical_compaction_max_row_source_memory_mb` {#vertical_compaction_max_row_source_memory_mb}

* 型: int32
* 説明: vertical compaction における row_source_buffer の最大メモリ使用量です。単位は MB です。
* デフォルト値: 200

#### `vertical_compaction_max_segment_size` {#vertical_compaction_max_segment_size}

* 型: int32
* 説明: vertical compaction で出力する segment ファイルの最大サイズです。単位は m バイトです。
* デフォルト値: 268435456

#### `enable_ordered_data_compaction` {#enable_ordered_data_compaction}

* 型: bool
* 説明: 順序付きデータの compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `ordered_data_compaction_min_segment_size` {#ordered_data_compaction_min_segment_size}

* 型: int32
* 説明: 順序付きデータの compaction で、入力 rowset に必要な segment の最小サイズです。単位は m バイトです。
* デフォルト値: 10485760

#### `max_base_compaction_threads` {#max_base_compaction_threads}

* 型: int32
* 説明: base compaction スレッドプールの最大スレッド数です。-1 はディスクごとにスレッドを割り当てることを示します。
* デフォルト値: 4

#### `generate_compaction_tasks_interval_ms` {#generate_compaction_tasks_interval_ms}

* 説明: compaction タスクを生成する最小間隔（ms）です。
* デフォルト値: 10 (ms)

#### `base_compaction_min_rowset_num` {#base_compaction_min_rowset_num}

* 説明: BaseCompaction の起動条件の一つである、Cumulative ファイル数のしきい値です。この数に達すると BaseCompaction が起動します。
* デフォルト値: 5

#### `base_compaction_min_data_ratio` {#base_compaction_min_data_ratio}

* 説明: BaseCompaction の起動条件の一つである、Cumulative ファイルサイズの Base ファイルに対する割合です。
* デフォルト値: 0.3 (30%)

#### `total_permits_for_compaction_score` {#total_permits_for_compaction_score}

* 型: int64
* 説明: すべての compaction タスクが保持できる「permits」の上限です。この設定で compaction のメモリ消費を制限できます。
* デフォルト値: 10000
* 動的な変更: 可能

#### `compaction_promotion_size_mbytes` {#compaction_promotion_size_mbytes}

* 型: int64
* 説明: cumulative compaction の出力 rowset のディスク上の合計サイズがこの設定値を超えると、その rowset が base compaction に使用されます。単位は m バイトです。
  - 通常、cumulative compaction に時間がかかりすぎてバージョンが滞留することを防ぐため、設定値を 2G 未満にします。
* デフォルト値: 1024

#### `compaction_promotion_ratio` {#compaction_promotion_ratio}

* 型: double
* 説明: cumulative compaction の出力 rowset のディスク上の合計サイズが、base バージョンの rowset に対する設定割合を超えると、その rowset が base compaction に使用されます。
  - 通常、設定値は 0.1 以下かつ 0.02 以上が推奨されます。
* デフォルト値: 0.05

#### `compaction_promotion_min_size_mbytes` {#compaction_promotion_min_size_mbytes}

* 型: int64
* 説明: cumulative compaction の出力 rowset のディスク上の合計サイズがこの設定値未満の場合、その rowset は base compaction に進まず、cumulative compaction の対象にとどまります。単位は m バイトです。
  - 通常は 512m 以内に設定します。値が大きすぎると、初期の base バージョンのサイズが小さすぎて base compaction が実行されません。
* デフォルト値: 128

#### `compaction_min_size_mbytes` {#compaction_min_size_mbytes}

* 型: int64
* 説明: cumulative compaction で選択された rowset のディスク上の合計サイズがこの設定値を超える場合、レベルポリシーに従って分割し、マージします。設定値未満の場合は直接マージします。単位は m バイトです。
  - 通常は 128m 以内に設定します。大きすぎる設定値は cumulative compaction の書き込み増幅を増やします。
* デフォルト値: 64

#### `default_rowset_type` {#default_rowset_type}

* 型: string
* 説明: BE がデフォルトで選択するストレージ形式を指定します。設定可能な値は「**ALPHA**」と「**BETA**」です。主に次の用途があります。
  - テーブルの storage_format が Default に設定されている場合に、BE のストレージ形式を選択します。
  - BE が Compaction を実行する際のストレージ形式を選択します。
* デフォルト値: BETA

#### `cumulative_compaction_min_deltas` {#cumulative_compaction_min_deltas}

* 説明: cumulative compaction 戦略における増分ファイルの最小数です。
* デフォルト値: 5

#### `cumulative_compaction_max_deltas` {#cumulative_compaction_max_deltas}

* 説明: cumulative compaction 戦略における増分ファイルの最大数です。
* デフォルト値: 1000

#### `base_compaction_trace_threshold` {#base_compaction_trace_threshold}

* 型: int32
* 説明: base compaction のトレース情報をログに出力するしきい値です。単位は秒です。
* デフォルト値: 10

Base compaction は時間のかかるバックグラウンドタスクです。この設定は、トレース情報をログに出力するしきい値です。ログファイル内のトレース情報は次のようになります。

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

#### `cumulative_compaction_trace_threshold` {#cumulative_compaction_trace_threshold}

* 型: int32
* 説明: cumulative compaction のトレース情報をログに出力するしきい値です。単位は秒です。
  - `base_compaction_trace_threshold` と同様です。
* デフォルト値: 2

#### `compaction_task_num_per_disk` {#compaction_task_num_per_disk}

* 型: int32
* 説明: ディスク（HDD）ごとに並列実行できる compaction タスクの数です。
* デフォルト値: 4

#### `compaction_task_num_per_fast_disk` {#compaction_task_num_per_fast_disk}

* 型: int32
* 説明: 高速ディスク（SSD）ごとに並列実行できる compaction タスクの数です。
* デフォルト値: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round` {#cumulative_compaction_rounds_for_each_base_compaction_round}

* 型: int32
* 説明: compaction タスクの生成時に、base compaction の各ラウンドに対して実行する cumulative compaction のラウンド数です。
* デフォルト値: 9

#### `max_cumu_compaction_threads` {#max_cumu_compaction_threads}

* 型: int32
* 説明: cumulative compaction スレッドプールの最大スレッド数です。-1 はディスクごとにスレッドを割り当てることを示します。
* デフォルト値: -1

#### `enable_segcompaction` {#enable_segcompaction}

* 型: bool
* 説明: ロード中に segment compaction を使用し、-238 エラーを回避します。
* デフォルト値: true

#### `segcompaction_batch_size` {#segcompaction_batch_size}

* 型: int32
* 説明: segment 数がこのしきい値を超えると segment compaction が起動します。また、この設定は単一の segment compaction タスクに含める元の segment 数の上限も定めます。
* デフォルト値: 10

#### `segcompaction_candidate_max_rows` {#segcompaction_candidate_max_rows}

* 型: int32
* 説明: 単一のソース segment に許される最大行数です。これを超える segment はスキップされます。
* デフォルト値: 1048576

#### `segcompaction_candidate_max_bytes` {#segcompaction_candidate_max_bytes}

* 型: int64
* 説明: 単一のソース segment に許される最大ファイルサイズです。これを超える segment はスキップされます。
* デフォルト値: 104857600

#### `segcompaction_task_max_rows` {#segcompaction_task_max_rows}

* 型: int32
* 説明: 単一の segcompaction タスクに許される合計行数の上限です。
* デフォルト値: 1572864

#### `segcompaction_task_max_bytes` {#segcompaction_task_max_bytes}

* 型: int64
* 説明: 単一の segcompaction タスクに許される合計ファイルサイズの上限です。
* デフォルト値: 157286400

#### `segcompaction_num_threads` {#segcompaction_num_threads}

* 型: int32
* 説明: グローバルな segcompaction スレッドプールのサイズです。
* デフォルト値: 5

#### `disable_compaction_trace_log` {#disable_compaction_trace_log}

* 型: bool
* 説明: compaction のトレースログを無効にします。
  - true に設定すると、`cumulative_compaction_trace_threshold` と `base_compaction_trace_threshold` は機能せず、ログ出力が無効になります。
* デフォルト値: true

#### `pick_rowset_to_compact_interval_sec` {#pick_rowset_to_compact_interval_sec}

* 型: int64
* 説明: compaction 対象の rowset を選択する時間間隔を秒単位で指定します。
* デフォルト値: 86400

#### `update_replica_infos_interval_seconds` {#update_replica_infos_interval_seconds}

* 説明: peer replica の情報を更新する最小間隔（秒）です。
* デフォルト値: 60 (s)

#### `cold_data_compaction_score_threshold` {#cold_data_compaction_score_threshold}

* 型: int32
* 説明: 冷データの compaction を検討する最小 compaction スコアのしきい値です。冷データのスコアがこの値を超えると compaction が検討されます。この値を調整すると、リモートストレージ上の冷データに対する compaction の頻度と積極度を制御できます。バージョン 3.1.3 以降でサポートされます。
* デフォルト値: 100

#### `cold_data_compaction_thread_num` {#cold_data_compaction_thread_num}

* 型: int32
* 説明: 冷データの compaction に使用するスレッド数です。冷データの compaction タスクの並列度を制御します。値を大きくすると、同時に実行できるタスクが増えてスループットが向上する可能性がありますが、リソース使用量も増えます。
* デフォルト値: 2

#### `cold_data_compaction_interval_sec` {#cold_data_compaction_interval_sec}

* 型: int32
* 説明: 冷データの compaction の起動を検討する間隔を秒単位で指定します。間隔が短いほど検討頻度が上がり、クリーンアップが早まる可能性がありますが、リソース消費も増えます。
* デフォルト値: 1800 (秒)

#### `enable_compaction_pause_on_high_memory` {#enable_compaction_pause_on_high_memory}

* 型: bool
* 説明: プロセスのメモリ使用量が多いときに compaction タスクを一時停止するかどうかを指定します。動的な変更に対応しています。
  - 有効にすると、メモリが逼迫した際に BE は compaction を一時停止し、クエリとデータロードを優先します。
  - ただし、compaction の一時停止によって compaction スコアの高い tablet のマージがさらに難しくなり、解消しようとしていたメタデータとメモリの滞留が悪化します。そのため、**バージョン 4.0.8 からデフォルト値は `true` から `false` に変更されました**。デフォルトではメモリ使用量の増加によって compaction は一時停止されません。
  - 以前の動作を維持するには `true` に設定します。
* デフォルト値: false (4.0.8 より前は true)

### データロード {#load}

#### `request_cdc_client_timeout_ms` {#request_cdc_client_timeout_ms}

* 型: int32
* 説明: CDC クライアントのリクエストタイムアウトをミリ秒単位で指定します。動的な設定に対応しています。バージョン 4.1.5 では、遅い CDC リクエストにも対応できるよう、デフォルト値が `60000` から `120000` に引き上げられました。
* デフォルト値: 120000 (4.1.5 より前は 60000)

#### `enable_table_memtable_flush_backpressure` {#enable_table_memtable_flush_backpressure}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。この BE 上で、同じテーブルのフラッシュ待ち MemTable が多すぎる場合に、そのテーブルへの新規書き込みをブロックするかどうかを指定します。FE の設定 `enable_adaptive_random_bucket_load` と併用し、適応型ランダムバケットへのデータロード中に MemTable が蓄積してメモリ使用量が増えることを防ぎます。
* デフォルト値: true

#### `table_memtable_flush_pending_count_limit` {#table_memtable_flush_pending_count_limit}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。この BE 上で、単一テーブルのフラッシュ待ち MemTable に許される最大数です。上限を超えると、その数が上限を下回るまで新規書き込みがブロックされます。`enable_table_memtable_flush_backpressure = true` の場合にのみ有効です。
* デフォルト値: 10

#### `group_commit_max_wal_num_per_table` {#group_commit_max_wal_num_per_table}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。単一テーブルに存在できる Group Commit WAL ファイルの最大数です。`0` は制限なしを意味します。WAL の再生が失敗し続け、WAL の数がこの上限を超えると、そのテーブルの `async_mode` Group Commit データロードは `EXCEEDED_LIMIT` エラーで拒否されます。メッセージは `Too many group commit async WALs for table ...` のようになります。この制限により、WAL が際限なく増えてディスクを使い尽くすことを防ぎます。
* デフォルト値: 10

#### `enable_stream_load_record` {#enable_stream_load_record}

* 型: bool
* 説明: Stream Load の記録機能を有効にするかどうかを指定します。デフォルトでは無効です。
* デフォルト値: false

#### `load_data_reserve_hours` {#load_data_reserve_hours}

* 説明: mini load に使用します。mini load のデータファイルは、この時間が経過すると削除されます。
* デフォルト値: 4 (h)

#### `push_worker_count_high_priority` {#push_worker_count_high_priority}

* 説明: HIGH 優先度のタスクを処理するデータロード用スレッド数です。
* デフォルト値: 3

#### `push_worker_count_normal_priority` {#push_worker_count_normal_priority}

* 説明: NORMAL 優先度のタスクを処理するデータロード用スレッド数です。
* デフォルト値: 3

#### `enable_single_replica_load` {#enable_single_replica_load}

* 説明: 単一レプリカでのデータロード機能を有効にするかどうかを指定します。
* デフォルト値: true

#### `load_error_log_reserve_hours` {#load_error_log_reserve_hours}

* 説明: データロードのエラーログは、この時間が経過すると削除されます。
* デフォルト値: 48 (h)

#### `load_error_log_limit_bytes` {#load_error_log_limit_bytes}

* 説明: データロードのエラーログがこの値を超えると切り詰められます。
* デフォルト値: 209715200 (byte)

#### `load_process_max_memory_limit_percent` {#load_process_max_memory_limit_percent}

* 説明: 単一ノード上のすべてのデータロード用スレッドが占められる、メモリ上限に対する割合です。デフォルトは 50% です。
  - Doris のアップグレード時にデータロード性能へ影響しないよう、これらのデフォルト値は大きく設定されています。必要に応じて適切に設定してください。
* デフォルト値: 50 (%)

#### `load_process_soft_mem_limit_percent` {#load_process_soft_mem_limit_percent}

* 説明: ソフトリミットは、単一ノードのデータロード用メモリ上限に対する割合です。たとえば、すべてのデータロードタスクのメモリ上限が 20GB の場合、デフォルトのソフトリミットはその 50%、つまり 10GB です。メモリ使用量がソフトリミットを超えると、使用量が最も大きいジョブが選択され、フラッシュによってメモリが解放されます。デフォルトは 50% です。
* デフォルト値: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec` {#slave_replica_writer_rpc_timeout_sec}

* 型: int32
* 説明: 単一レプリカでのデータロードに使用する、master レプリカと slave レプリカ間の brpc タイムアウトを変更します。
* デフォルト値: 60

#### `max_segment_num_per_rowset` {#max_segment_num_per_rowset}

* 型: int32
* 説明: データロード時に新しく生成される rowset 内の segment 数を制限します。しきい値を超えると、データロードはエラー -238 で失敗します。segment が多すぎると compaction が大量のメモリを使用し、OOM エラーを引き起こすことがあります。
* デフォルト値: 200

#### `high_priority_flush_thread_num_per_store` {#high_priority_flush_thread_num_per_store}

* 型: int32
* 説明: 高優先度のデータロードタスクに割り当てる、ストアパスごとのフラッシュスレッド数です。
* デフォルト値: 1

#### `routine_load_consumer_pool_size` {#routine_load_consumer_pool_size}

* 型: int32
* 説明: routine load で使用するデータコンシューマーのキャッシュ数です。
* デフォルト値: 10

#### `multi_table_batch_plan_threshold` {#multi_table_batch_plan_threshold}

* 型: int32
* 説明: 単一ストリームから複数テーブルへのデータロードに使用します。Kafka から受信したメッセージのバッチサイズがこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。
* デフォルト値: 200

#### `multi_table_max_wait_tables` {#multi_table_max_wait_tables}

* 型: int32
* 説明: 単一ストリームから複数テーブルへのデータロードに使用します。Kafka からメッセージのバッチを受信したとき、プランを待つテーブル数がこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。このパラメータは、一度に要求・実行するプランが多すぎることを防ぐためのものです。データロード中に複数テーブルを小さなバッチで処理すると、単一 RPC の負荷を減らし、データ処理のリアルタイム性を高められます。
* デフォルト値: 5

#### `single_replica_load_download_num_workers` {#single_replica_load_download_num_workers}

* 型: int32
* 説明: 単一レプリカでのデータロードに使用する、segment ダウンロード用 HTTP ワーカースレッド数を変更します。データロードの同時実行数が増えた場合は、Slave レプリカが Master レプリカからデータファイルを適時に同期できるよう、このパラメータを調整できます。必要に応じて、IO 性能を高めるために `webserver_num_workers` も増やしてください。
* デフォルト値: 64

#### `load_task_high_priority_threshold_second` {#load_task_high_priority_threshold_second}

* 型: int32
* 説明: データロードタスクのタイムアウトがこのしきい値未満の場合、Doris は高優先度タスクと見なします。高優先度タスクは専用のフラッシュスレッドプールを使用します。
* デフォルト: 120

#### `min_load_rpc_timeout_ms` {#min_load_rpc_timeout_ms}

* 型: int32
* 説明: データロードジョブ内の各 RPC の最小タイムアウトです。
* デフォルト: 20

#### `kafka_api_version_request` {#kafka_api_version_request}

* 型: bool
* 説明: 使用する Kafka のバージョンが 0.10.0.0 より古い場合は、false に設定してください。
* デフォルト: true

#### `kafka_broker_version_fallback` {#kafka_broker_version_fallback}

* 説明: 使用する Kafka のバージョンが 0.10.0.0 より古く、kafka_api_version_request が false の場合、フォールバックバージョンとして kafka_broker_version_fallback に設定した値が使用されます。有効な値は 0.9.0.x と 0.8.x.y です。
* デフォルト: 0.10.0

#### `max_consumer_num_per_group` {#max_consumer_num_per_group}

* 説明: routine load に使用する、データコンシューマーグループ内の最大コンシューマー数です。
* デフォルト: 3

#### `streaming_load_max_mb` {#streaming_load_max_mb}

* 型: int64
* 説明: 単一の Stream Load のリクエスト本文の最大サイズを制限します。`read_json_by_line=true` を設定していない JSON データロードには、`streaming_load_json_max_mb` も適用されます。
  - Stream Load は通常、数 GB 未満のデータのロードに適しており、非常に大きなデータのロードには適していません。
* デフォルト値: 102400 (MB)
* 動的な変更: 可能

これはソースコード上のデフォルト値であり、実際に有効な値はデプロイ時の設定によって異なります。ADMIN_PRIV を持つユーザーは `SHOW BACKEND CONFIG LIKE 'streaming_load_max_mb';` を実行し、各 BE で有効な値を確認できます。このパラメータは BE を再起動せずに動的に変更できます。マネージドクラウドサービスでは、サービスが提供する設定方法を使用するか、管理者に値の確認や調整を依頼してください。

**バージョン履歴:**

- 3.x 系列では、Doris 3.0.2 で `streaming_load_max_mb` のデフォルト値が 10240 MB (10 GB) から 102400 MB (100 GB) に引き上げられました。Doris 3.0.0 と 3.0.1 ではデフォルト値は 10 GB です。
- 2.1 系列では、同じ変更が 2.1.7 から有効になりました。
- Doris 4.x と dev でもデフォルト値は 100 GB です。実際に有効な値はデプロイ時の設定によって異なります。

#### `streaming_load_json_max_mb` {#streaming_load_json_max_mb}

* 型: int64
* 説明: 単一の Stream Load で許可する JSON データの最大量を制限します。単位は MB です。
  - JSON など一部のデータ形式は分割できません。Doris は解析を開始する前にデータ全体をメモリに読み込む必要があります。このため、この値で単一の Stream Load に許可するデータ量を制限します。
* デフォルト値: 100
* 動的な変更: 可能

#### `olap_table_sink_send_interval_microseconds` {#olap_table_sink_send_interval_microseconds}

* 説明: データロード中、Coordinator の sink ノードにあるポーリングスレッドが、対応する BE へ継続的にデータを送信します。このスレッドは `olap_table_sink_send_interval_microseconds` マイクロ秒ごとに送信するデータがあるか確認します。
* デフォルト値: 1000

#### `olap_table_sink_send_interval_auto_partition_factor` {#olap_table_sink_send_interval_auto_partition_factor}

* 説明: 自動パーティションが有効なテーブルへデータをロードする場合、`olap_table_sink_send_interval_microseconds` の間隔では遅すぎるため、実際の間隔にこの係数を掛けます。
* デフォルト値: 0.001

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

* 型: bool
* 説明: コンピューティングとストレージを分離したモードで、Group Commit 用の Stream Load BE 転送を有効にするかどうかを指定します。Doris 4.0 系列ではバージョン 4.0.8、4.1 系列ではバージョン 4.1.4 で追加されました。動的な変更に対応しています。
  - ロードバランサーが同じテーブルの Group Commit リクエストを異なる BE にランダムに振り分けると、効果的にバッチ化できません。有効にすると、BE はリクエストを単一の対象 BE に転送します。
  - **バージョン 4.0.8 以降、BE のエンドポイント `/api/{db}/{table}/_stream_load_forward` はこの設定によって制御されます。`false` の場合、このエンドポイントへのリクエストは `Stream load forward is disabled` とともに `403 Forbidden` を返します。`true` の場合も、このエンドポイントへのリクエストには認証とグローバルな `LOAD` 権限が必要です。**
  - この転送を使用するデプロイでは、FE と BE の両方で設定を `true` にする必要があります。FE 側の同名の設定については [FE の設定](./fe-config) を参照してください。
* デフォルト値: false

### スレッド {#thread}

#### `delete_worker_count` {#delete_worker_count}

* 説明: データ削除タスクを実行するスレッド数です。
* デフォルト値: 3

#### `clear_transaction_task_worker_count` {#clear_transaction_task_worker_count}

* 説明: トランザクションのクリーンアップに使用するスレッド数です。
* デフォルト値: 1

#### `clone_worker_count` {#clone_worker_count}

* 説明: クローンタスクを実行するスレッド数です。
* デフォルト値: 3

#### `be_service_threads` {#be_service_threads}

* 型: int32
* 説明: BE 上の Thrift サーバーサービスの実行スレッド数です。FE からのリクエストを実行できるスレッドの数を示します。
* デフォルト値: 64

#### `download_worker_count` {#download_worker_count}

* 説明: ダウンロード用スレッド数です。
* デフォルト値: 1

#### `drop_tablet_worker_count` {#drop_tablet_worker_count}

* 説明: tablet を削除するスレッド数です。
* デフォルト値: 3

#### `flush_thread_num_per_store` {#flush_thread_num_per_store}

* 説明: ストアごとにメモリテーブルをフラッシュするスレッド数です。
* デフォルト値: 2

#### `publish_version_worker_count` {#publish_version_worker_count}

* 説明: バージョンを公開するスレッド数です。
* デフォルト値: 8

#### `upload_worker_count` {#upload_worker_count}

* 説明: ファイルをアップロードするスレッドの最大数です。
* デフォルト値: 1

#### `webserver_num_workers` {#webserver_num_workers}

* 説明: Web サーバーのデフォルトのワーカースレッド数です。
* デフォルト値: 48

#### `send_batch_thread_pool_thread_num` {#send_batch_thread_pool_thread_num}

* 型: int32
* 説明: SendBatch スレッドプールのスレッド数です。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてプールに投入され、スケジュールされます。このパラメータで SendBatch スレッドプールのサイズを決めます。
* デフォルト値: 64

#### `send_batch_thread_pool_queue_size` {#send_batch_thread_pool_queue_size}

* 型: int32
* 説明: SendBatch スレッドプールのキュー長です。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてプールに投入され、スケジュールを待ちます。投入済みタスクの数がキュー長を超えると、後続の投入はキューに空きができるまでブロックされます。
* デフォルト値: 102400

#### `make_snapshot_worker_count` {#make_snapshot_worker_count}

* 説明: スナップショットを作成するスレッド数です。
* デフォルト値: 5

#### `release_snapshot_worker_count` {#release_snapshot_worker_count}

* 説明: スナップショットを解放するスレッド数です。
* デフォルト値: 5

### メモリ {#memory}

#### `madvise_huge_pages` {#madvise_huge_pages}

* 型: bool
* 説明: Linux の Huge Pages を使用するかどうかを指定します。
* デフォルト値: false

#### `max_memory_sink_batch_count` {#max_memory_sink_batch_count}

* 説明: 外部スキャンキャッシュの最大バッチ数です。キャッシュする行数は max_memory_cache_batch_count * batch_size で、デフォルトのバッチ数は 20、batch_size のデフォルト値は 1024 です。したがって、20 * 1024 行がキャッシュされます。
* デフォルト値: 20

#### `memory_max_alignment` {#memory_max_alignment}

* 説明: メモリの最大アラインメントです。
* デフォルト値: 16

#### `mmap_buffers` {#mmap_buffers}

* 説明: メモリの割り当てに mmap を使用するかどうかを指定します。
* デフォルト値: false

#### `memtable_mem_tracker_refresh_interval_ms` {#memtable_mem_tracker_refresh_interval_ms}

* 説明: memtable flush mgr の更新処理の間隔をミリ秒単位で指定します。
* デフォルト値: 100

#### `zone_map_row_num_threshold` {#zone_map_row_num_threshold}

* 型: int32
* 説明: ページ内の行数がこの値未満の場合、データ量の増加を抑えるため zone map を作成しません。
* デフォルト値: 20

#### `memory_mode` {#memory_mode}

* 型: string
* 説明: tcmalloc の GC を制御します。performance モードでは、メモリ使用量が mem_limit の 90% 以上になると Doris は tcmalloc キャッシュのメモリを解放します。それ以外のモードでは、mem_limit の 50% 以上になると解放します。
* デフォルト値: performance

#### `max_sys_mem_available_low_water_mark_bytes` {#max_sys_mem_available_low_water_mark_bytes}

* 型: int64
* 説明: システムの `/proc/meminfo/MemAvailable` に対する低水位の最大値です。単位はバイト、デフォルトは 1.6G で、実際の低水位は min(1.6G, MemTotal * 10%) です。これにより、メモリが 16G を超えるマシンでメモリが過剰に確保されることを防ぎます。最大値を上げると、メモリが 16G を超えるマシンでは Full GC 用に多くのメモリバッファが確保されます。下げると、利用可能なメモリをより多く使用します。
* デフォルト値: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes` {#memory_limitation_per_thread_for_schema_change_bytes}

* 説明: 単一の schema change タスクに許される最大メモリ量です。
* デフォルト値: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes` {#mem_tracker_consume_min_size_bytes}

* 型: int32
* 説明: TCMalloc Hook が MemTracker の consume/release を行う際の最小サイズです。この値より小さい消費量は、MemTracker の consume/release を頻繁に呼び出さないよう累積されます。値を下げると呼び出し頻度が増え、上げると MemTracker の統計精度が下がります。理論上、MemTracker の統計値と実際の値との差は、( mem_tracker_consume_min_size_bytes * その MemTracker が属する BE スレッド数) です。
* デフォルト値: 1,048,576

#### `min_buffer_size` {#min_buffer_size}

* 説明: 読み取りバッファの最小サイズです。
* デフォルト値: 1024 (byte)

#### `write_buffer_size` {#write_buffer_size}

* 説明: フラッシュ前のバッファサイズです。
  - ロードされたデータは、まず BE 上のメモリブロックに書き込まれ、そのブロックがしきい値に達してからディスクに書き戻されます。デフォルトのサイズは 200MB です。しきい値が小さすぎると、BE 上に多数の小さなファイルが生成される可能性があります。値を大きくするとファイル数を減らせますが、大きすぎると RPC がタイムアウトする可能性があります。
* デフォルト値: 209,715,200

#### `remote_storage_read_buffer_mb` {#remote_storage_read_buffer_mb}

* 型: int32
* 説明: HDFS またはオブジェクトストレージ上のファイルを読み取る際に使用するキャッシュサイズです。
  - 値を大きくするとリモートデータの読み取り呼び出し回数を減らせますが、メモリ使用量は増えます。
* デフォルト値: 16 (MB)

#### `file_cache_type` {#file_cache_type}

* 型: string
* 説明: キャッシュファイルの種類です。`whole_file_cache` は segment ファイル全体をダウンロードし、`sub_file_cache` は segment ファイルをサイズに応じて複数のファイルに分割します。"" に設定するとキャッシュを使用しません。キャッシュが必要な場合は、このパラメータを設定してください。
* デフォルト値: ""

#### `path_gc_check` {#path_gc_check}

* 型：bool
* 説明: 回収データのスキャンスレッドによるチェックを有効にするかどうかを指定します。
* デフォルト値：true

#### `path_gc_check_interval_second` {#path_gc_check_interval_second}

* 説明: 回収データのスキャンスレッドによるチェックの間隔です。
* デフォルト値：86400 (s)

#### `path_gc_check_step` {#path_gc_check_step}

* デフォルト値：1000

#### `path_gc_check_step_interval_ms` {#path_gc_check_step_interval_ms}

* デフォルト値：10 (ms)

#### `scan_context_gc_interval_min` {#scan_context_gc_interval_min}

* 説明: コンテキスト GC スレッドのスケジュール間隔です。単位は分で、デフォルトは 5 分です。
* デフォルト値：5

### ストレージ {#storage}

#### `enable_kuromoji_analyzer` {#enable_kuromoji_analyzer}

* 型: bool
* 説明: 転置インデックス用の kuromoji（日本語）アナライザーを有効にするかどうかを指定します。Doris 5.0.0 以降でサポートされます。
* デフォルト値: false

#### `inverted_index_skip_norms_for_variant` {#inverted_index_skip_norms_for_variant}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的な設定に対応しています。`true` の場合、VARIANT のサブパスに作成する転置インデックスでは、インデックスの `norms` プロパティに関係なく Norms を省略します。複数のサブパスに対するインデックスの保存容量を減らせますが、これらのインデックスでは Norms を必要とする BM25 `score()` の計算ができなくなります。デフォルトでは Norms を保持します。詳しくは [関連性スコアリング](../../table-design/index/inverted-index/scoring.md) を参照してください。
* デフォルト値: false

#### `default_num_rows_per_column_file_block` {#default_num_rows_per_column_file_block}

* 型: int32
* 説明: 単一の RowBlock に含めるデータ行数を設定します。
* デフォルト値: 1024

#### `disable_storage_page_cache` {#disable_storage_page_cache}

* 型: bool
* 説明: インデックスのキャッシュにページキャッシュを使用しないようにします。この設定は BETA ストレージ形式でのみ有効で、通常は false が推奨されます。
* デフォルト値: false

#### `disk_stat_monitor_interval` {#disk_stat_monitor_interval}

* 説明: ディスク状態を確認する間隔です。
* デフォルト値: 5 (s)

#### `max_free_io_buffers` {#max_free_io_buffers}

* 説明: IoMgr が各 IO バッファサイズについて保持するバッファ数の上限です。バッファサイズは 1024B から 8MB までで、バッファの合計は最大約 2GB です。
* デフォルト値: 128

#### `max_garbage_sweep_interval` {#max_garbage_sweep_interval}

* 説明: ディスクの不要データをクリーンアップする最大間隔です。
* デフォルト値: 3600 (s)

#### `max_percentage_of_error_disk` {#max_percentage_of_error_disk}

* 型: int32
* 説明: ストレージエンジンが許容する破損ディスクの割合です。破損ディスクの割合がこの値を超えると、BE は自動的に終了します。
* デフォルト値: 0

#### `min_garbage_sweep_interval` {#min_garbage_sweep_interval}

* 説明: ディスクの不要データをクリーンアップする最小間隔です。
* デフォルト値: 180 (s)

#### `pprof_profile_dir` {#pprof_profile_dir}

* 説明: pprof profile の保存ディレクトリです。
* デフォルト値: ${DORIS_HOME}/log

#### `small_file_dir` {#small_file_dir}

* 説明: SmallFileMgr がダウンロードしたファイルの保存先です。
* デフォルト値: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir` {#user_function_dir}

* 説明: UDF 関数のディレクトリです。
* デフォルト値: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

* 説明: データディレクトリに残しておく必要がある最小空き容量をバイト単位で指定します。
* デフォルト値: 1073741824

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

* 説明: storage_flood_stage_usage_percent と storage_flood_stage_left_capacity_bytes の設定で、データディレクトリの最大使用容量を制限します。
* デフォルト値: 90 (90%)

#### `storage_medium_migrate_count` {#storage_medium_migrate_count}

* 説明: クローンに使用するスレッド数です。
* デフォルト値: 1

#### `storage_page_cache_limit` {#storage_page_cache_limit}

* 説明: ストレージページキャッシュのサイズです。
* デフォルト値: 20%

#### `storage_page_cache_shard_size` {#storage_page_cache_shard_size}

* 説明: StoragePageCache のシャードサイズです。値は 2 のべき乗にする必要があります。ロック競合を減らすため、BE のコア数に近い値が推奨されます。
* デフォルト値: 16

#### `index_page_cache_percentage` {#index_page_cache_percentage}

* 型: int32
* 説明: ストレージページキャッシュ全体に占めるインデックスページキャッシュの割合です。値の範囲は [0, 100] です。
* デフォルト値: 10

#### `segment_cache_capacity` {#segment_cache_capacity}
* 型: int32
* 説明: segment キャッシュのエントリ数の上限です。キーは rowset ID です。-1 は後方互換性のため fd_number * 2/5 を使用します。
* デフォルト値: -1

#### `storage_strict_check_incompatible_old_format` {#storage_strict_check_incompatible_old_format}

* 型: bool
* 説明: 互換性のない古い形式を厳格にチェックするために使用します。
* デフォルト値: true
* 動的な変更: 不可

#### `sync_tablet_meta` {#sync_tablet_meta}

* 説明: ストレージエンジンが sync を有効にし、データをディスクに保持するかどうかを指定します。
* デフォルト値: true

#### `pending_data_expire_time_sec` {#pending_data_expire_time_sec}

* 説明: ストレージエンジンが未検証のデータを保持する最大時間です。
* デフォルト値: 1800 (s)

#### `ignore_rowset_stale_unconsistent_delete` {#ignore_rowset_stale_unconsistent_delete}

* 型: boolean
* 説明: 古くなったマージ済み rowset が一貫したバージョンパスを構成できない場合に、その rowset を削除するかどうかを決定します。
  - 期限切れのマージ済み rowset のバージョンパスは、30 分後に削除されます。異常な状況では、これらのバージョンを削除するとクエリ用の一貫したパスを構成できなくなる場合があります。false の場合、プログラムは厳格にチェックし、エラーを報告して終了します。true の場合はこのエラーを無視して正常に動作します。通常、エラーを無視してもクエリに影響しませんが、マージ済みバージョンが FE から割り当てられた場合は -230 エラーが発生します。
* デフォルト値: false

#### `create_tablet_worker_count` {#create_tablet_worker_count}

* 説明: BE が tablet を作成するワーカースレッド数です。
* デフォルト値: 3

#### `check_consistency_worker_count` {#check_consistency_worker_count}

* 説明: tablet のチェックサムを計算するワーカースレッド数です。
* デフォルト値: 1

#### `max_tablet_version_num` {#max_tablet_version_num}

* 型: int
* 説明: 単一 tablet のバージョン数を制限します。データロードの頻度が高すぎる場合や compaction が間に合わない場合に、多数のバージョンが蓄積することを防ぎます。上限を超えるとデータロードタスクは拒否されます。
* デフォルト値: 2000

#### `tablet_map_shard_size` {#tablet_map_shard_size}

* 説明: tablet_map_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）で、tablet の管理を改善するために使用します。
* デフォルト値: 4

#### `tablet_meta_checkpoint_min_interval_secs` {#tablet_meta_checkpoint_min_interval_secs}

* 説明: TabletMeta Checkpoint スレッドのポーリング間隔です。
* デフォルト値: 600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num` {#tablet_meta_checkpoint_min_new_rowsets_num}

* 説明: TabletMeta Checkpoint を保存するために必要な Rowset の最小数です。
* デフォルト値: 10

#### `tablet_rowset_stale_sweep_time_sec` {#tablet_rowset_stale_sweep_time_sec}

* 型: int64
* 説明: マージ済み rowset バージョンをクリーンアップするまでの有効期間を制御します。現在時刻 now() から、バージョンパス内で最も新しく作成された rowset の作成時刻を引いた値が tablet_rowset_stale_sweep_time_sec を超えると、そのパスがクリーンアップされ、マージ済み rowset が削除されます。単位は秒です。
  - 書き込みが頻繁すぎると、FE がマージ済みバージョンを参照できず、クエリで -230 エラーが発生することがあります。このパラメータを大きくすると回避できます。
* デフォルト値: 300

#### `tablet_writer_open_rpc_timeout_sec` {#tablet_writer_open_rpc_timeout_sec}

* 説明: tablet 状態キャッシュの更新間隔です。
    - データロード中に Batch（1024 行）を送信する RPC のタイムアウトです。デフォルトは 60 秒です。この RPC では複数のメモリバッチの書き込みが発生する場合があり、書き込みによってタイムアウトすることがあります。そのため、この値を調整すると send batch fail などのタイムアウトエラーを減らせます。`write_buffer_size` を大きくした場合は、このパラメータも大きくする必要があります。
* デフォルト値: 60

#### `tablet_writer_ignore_eovercrowded` {#tablet_writer_ignore_eovercrowded}

* 型: bool
* 説明: データの書き込み時に brpc エラー「[E1011]The server is overcrowded」を無視するために使用します。
* デフォルト値: false

#### `streaming_load_rpc_max_alive_time_sec` {#streaming_load_rpc_max_alive_time_sec}

* 説明: TabletsChannel の存続時間です。この時間内にチャネルがデータを受信しない場合、チャネルは削除されます。
* デフォルト値: 1200

#### `alter_tablet_worker_count` {#alter_tablet_worker_count}

* 説明: schema change を実行するスレッド数です。
* デフォルト値: 3

#### `alter_index_worker_count` {#alter_index_worker_count}

* 説明: インデックス変更を実行するスレッド数です。
* デフォルト値: 3

#### `ignore_load_tablet_failure` {#ignore_load_tablet_failure}

* 型: bool
* 説明: tablet のロードに失敗した場合に、エラーを無視して BE の起動を続けるかどうかを決定します。
* デフォルト値: false

BE の起動時には、データディレクトリごとに個別のスレッドが起動し、tablet ヘッダーのメタ情報をロードします。デフォルトの設定では、いずれかのデータディレクトリで tablet のロードに失敗すると、起動プロセスは終了します。同時に、` be The following error message is seen in the INFO ` ログには次のエラーメッセージが表示されます。

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

このメッセージは、そのデータディレクトリでロードに失敗した tablet の数を示します。ログには、ロードに失敗した tablet の詳細情報も記録されます。この場合は、手動で原因を調査する必要があります。調査後の復旧方法は通常、次のとおりです。
  - tablet の情報を修復できず、他のレプリカが正常な場合は、`meta_tool` ツールで問題のある tablet を削除できます。
  - `ignore_load_tablet_failure` を true に設定すると、BE は問題のある tablet を無視して正常に起動します。

#### `report_disk_state_interval_seconds` {#report_disk_state_interval_seconds}

* 説明: エージェントが FE にディスク状態を報告する間隔です。
* デフォルト値: 60 (s)

#### `result_buffer_cancelled_interval_time` {#result_buffer_cancelled_interval_time}

* 説明: 結果バッファがキャンセルされるまでの時間です。
* デフォルト値: 300 (s)

#### `snapshot_expire_time_sec` {#snapshot_expire_time_sec}

* 説明: スナップショットファイルのクリーンアップ間隔です。
* デフォルト値:172800 (48 時間)

### ログ {#log}

#### `sys_log_dir` {#sys_log_dir}

* 型: string
* 説明: BE のログデータを保存するディレクトリです。
* デフォルト値: `${DORIS_HOME}/log`

#### `sys_log_level` {#sys_log_level}

* 説明: ログレベルは INFO < WARNING < ERROR < FATAL の順です。
* デフォルト値: INFO

#### `sys_log_roll_mode` {#sys_log_roll_mode}

* 説明: ログファイルを分割するサイズです。1G ごとにファイルを分割します。
* デフォルト値: SIZE-MB-1024

#### `sys_log_roll_num` {#sys_log_roll_num}

* 説明: 保持するログファイルの数です。
* デフォルト値: 10

#### `sys_log_verbose_level` {#sys_log_verbose_level}

* 説明: コード内の VLOG で始まるログの出力を制御するログ表示レベルです。
* デフォルト値: 10

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

* 説明: ログ出力の対象モジュールです。olap を指定すると、olap モジュールのログのみを出力します。
* デフォルト値: 空

#### `aws_log_level` {#aws_log_level}

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

#### `log_buffer_level` {#log_buffer_level}

* 説明: ログのフラッシュ方法です。デフォルトではメモリ内に保持します。
* デフォルト値: 空

### その他 {#others}

#### `enable_arrow_input_validation` {#enable_arrow_input_validation}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。Arrow データを Doris の内部列に変換する前に、Arrow の入力バッファを検証するかどうかを指定します。有効にすると、不正な Arrow データによる BE のクラッシュを防げますが、検証のためのわずかな追加コストがかかります。
* デフォルト値: true

#### `report_tablet_interval_seconds` {#report_tablet_interval_seconds}

* 説明: エージェントが FE に OLAP テーブルを報告する間隔です。
* デフォルト値: 60 (s)

#### `report_task_interval_seconds` {#report_task_interval_seconds}

* 説明: エージェントが FE にタスクのシグネチャを報告する間隔です。
* デフォルト値: 10 (s)

#### `periodic_counter_update_period_ms` {#periodic_counter_update_period_ms}

* 説明: レートカウンターとサンプリングカウンターの更新周期です。
* デフォルト値: 500 (ms)

#### `enable_metric_calculator` {#enable_metric_calculator}

* 説明: true に設定すると、BE 関連の指標情報を収集する metric calculator が動作します。false の場合は動作しません。
* デフォルト値: true

#### `enable_system_metrics` {#enable_system_metrics}

* 説明: システム指標の有効・無効をユーザーが制御します。
* デフォルト値: true

#### `enable_token_check` {#enable_token_check}

* 説明: 将来の互換性のために使用されます。後で削除される予定です。
* デフォルト値: true

#### `max_runnings_transactions_per_txn_map` {#max_runnings_transactions_per_txn_map}

* 説明: txn マネージャー内の各 txn_partition_map に保持する txn の最大数です。マネージャーに txn が過度に蓄積することを防ぎます。
* デフォルト値: 2000

#### `max_download_speed_kbps` {#max_download_speed_kbps}

* 説明: ダウンロード速度の上限です。
* デフォルト値: 50000 (kb/s)

#### `download_low_speed_time` {#download_low_speed_time}

* 説明: ダウンロードの時間制限です。
* デフォルト値: 300 (s)

#### `download_low_speed_limit_kbps` {#download_low_speed_limit_kbps}

* 説明: ダウンロード速度の下限です。
* デフォルト値: 50 (KB/s)

#### `enable_batch_download` {#enable_batch_download}

* 説明: ファイルを一括ダウンロードするかどうかを指定します。binlog が有効な場合は、有効にすることが推奨されます。
* デフォルト値: false

#### `priority_queue_remaining_tasks_increased_frequency` {#priority_queue_remaining_tasks_increased_frequency}

* 説明: BlockingPriorityQueue 内の残りのタスクの優先度を上げる頻度です。
* デフォルト値: 512


#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

* 説明: JDBC ドライバーを置くデフォルトのディレクトリです。
* デフォルト値: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader` {#enable_simdjson_reader}

* 説明: Stream Load 中の JSON 解析に simdjson を使用するかどうかを指定します。
* デフォルト値: true

#### `user_files_secure_path` {#user_files_secure_path}

* 説明: `local` テーブル値関数でクエリするファイルの保存ディレクトリです。
* デフォルト値: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes` {#brpc_streaming_client_batch_bytes}

* 説明: brpc streaming クライアントがデータを送信するときのバッチサイズです。
* デフォルト値: 262144

#### `grace_shutdown_wait_seconds` {#grace_shutdown_wait_seconds}

* 説明: クラウドネイティブのデプロイでは、BE がクラスターに頻繁に追加・削除されることがあります。停止中の BE 上でフラグメントが実行されていると、ユーザーのクエリは失敗します。`stop_be.sh --grace` を使用すると、BE は実行中のすべてのクエリが終了するまで待機し、失敗を回避します。ただし、待機時間が上限を超えると BE はそのまま終了します。この間、FE はその BE に新しいクエリを送らず、実行中のクエリが終了するのを待ちます。
* デフォルト値: 120

#### `enable_java_support` {#enable_java_support}

* 説明: BE で java-jni を有効にするかどうかを指定します。有効にすると、c++ と java の相互呼び出しが可能になります。現在は hudi、java-udf、jdbc、max-compute、paimon、preload、avro をサポートしています。
* デフォルト値: true

#### `group_commit_wal_path` {#group_commit_wal_path}

* Group Commit の `WAL` ディレクトリです。
* デフォルト: `storage_root_path` の各ディレクトリの下に `wal` というディレクトリが作成されます。設定例:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### コンピューティングとストレージの分離モード {#compute-and-storage-disaggregated-mode}

#### `deploy_mode` {#deploy_mode-1}

* デフォルト: ""

* 説明: BE の実行モードです。`cloud` はストレージとコンピューティングを分離したモードを示します。

#### `meta_service_endpoint` {#meta_service_endpoint}

デフォルト: ""

* 説明: Meta Service のエンドポイントを 'host1:port,host2:port' の形式で指定します。通常、この値は FE からハートビートを通じて BE に送られるため、設定は不要です。

#### `enable_file_cache` {#enable_file_cache}

デフォルト: true (バージョン 4.1.5 以降はデフォルトで有効。それ以前は false。コンピューティングとストレージを分離したモードでは常に有効)。

* 説明: ファイルキャッシュを使用するかどうかを指定します。変更を有効にするには BE の再起動が必要です。セッション変数 `enable_file_cache` も有効にする必要があります。バージョン 4.1.5 では、BE の設定とセッション変数の両方のデフォルト値が `true` に変更されました。既存の明示的な設定と永続化されたグローバル変数は、それぞれ確認してください。

#### `enable_ms_rpc_host_level_rate_limit_dry_run` {#enable_ms_rpc_host_level_rate_limit_dry_run}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的な設定に対応しています。BE から Meta Service への RPC に対するホスト単位のレート制限を、待機せずに評価します。`enable_ms_rpc_host_level_rate_limit` とは独立しており、そちらが `false` でも評価は実行されます。両方が `true` の場合はドライランが優先されます。実際にレート制限を適用するには、`enable_ms_rpc_host_level_rate_limit` を有効にし、この設定を無効にします。
* デフォルト値: true

#### `enable_ms_backpressure_handling_dry_run` {#enable_ms_backpressure_handling_dry_run}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的な設定に対応しています。Meta Service の `MS_BUSY` 応答によって起動するテーブル単位の適応型レート制限を、待機せずに評価します。`enable_ms_backpressure_handling` とは独立しており、両方が `true` の場合はドライランが優先されます。実際にテーブル単位のレート制限を適用するには、`enable_ms_backpressure_handling` を有効にし、この設定を無効にします。
* デフォルト値: true

#### `cache_peer_read_failure_threshold` {#cache_peer_read_failure_threshold}

* 型: int32
* 説明: バージョン 4.2.0 以降でサポートされ、動的な設定に対応しています。peer アドレスへの接続または RPC が連続して失敗し、サーキットブレーカーが開くまでの回数です。実際の最小値は `1` です。このアドレス単位の状態は異なる tablet の peer 読み取り間で共有され、到達できないノードへの繰り返しの接続を防ぎます。
* デフォルト値: 3

#### `cache_peer_read_circuit_open_seconds` {#cache_peer_read_circuit_open_seconds}

* 型: int32
* 説明: バージョン 4.2.0 以降でサポートされ、動的な設定に対応しています。開いた peer サーキットブレーカーがそのアドレスへの読み取りを拒否する時間を秒単位で指定します。負の値は `0` として扱われます。この期間が過ぎると、復旧確認の試行が一度許可されます。
* デフォルト値: 30

#### `delete_bitmap_store_v2_max_bytes_in_fdb` {#delete_bitmap_store_v2_max_bytes_in_fdb}

* 型: int64
* 説明: コンピューティングとストレージを分離したモードで、Delete Bitmap V2 を FDB に直接保存する際のシリアライズ後の最大サイズをバイト単位で指定します。動的な設定に対応しています。非負のしきい値を超える値は、代わりにオブジェクトストレージのファイルへ保存されます。負の値は、サイズに基づく退避を無効にします。バージョン 4.1.5 ではデフォルト値が `1024` から `89000` に引き上げられ、90000 バイトのチャンク内に追加のメッセージフィールドを収める余地が確保されました。
* デフォルト値: 89000 (4.1.5 より前は 1024)

#### `enable_remove_agg_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_agg_pre_rowsets_delete_bitmap_by_keys}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的な設定に対応しています。コンピューティングとストレージを分離したモードで集約済みの過去の Delete Bitmap を置き換える際、終了バージョンのレコードをキー単位で削除します。`false` に設定すると範囲削除を使用します。この設定は既存のクリーンアップでの削除方法のみを変更し、追加のクリーンアップタスクは有効にしません。
* デフォルト値: true

#### `enable_remove_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_pre_rowsets_delete_bitmap_by_keys}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的な設定に対応しています。コンピューティングとストレージを分離したモードで集約範囲内の過去の Delete Bitmap をクリーンアップする際、開始バージョンを含み終了バージョンを含まない範囲のレコードをキー単位で削除します。`false` に設定すると範囲削除を使用します。既存のクリーンアップ用スイッチと前提条件は引き続き適用されます。
* デフォルト値: true

#### `file_cache_path` {#file_cache_path}

デフォルト: [{"path":"${DORIS_HOME}/file_cache"}]
* 説明: ファイルキャッシュに使用するディスクパスとその他のパラメータを、ディスクごとに一つのエントリを持つ配列で指定します。`path` はディスクパスを指定し、`total_size` はキャッシュのサイズを制限します。-1 または 0 を指定するとディスク容量全体を使用します。
* 形式: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write` {#enable_async_file_cache_write}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュへ非同期に書き込むかどうかを指定します。有効にすると、リモートデータをファイルキャッシュに書き戻す処理がバックグラウンドスレッドプールに渡され、読み取り処理をブロックしないため、コールドリードの遅延が減ります。
* デフォルト値: false

#### `async_file_cache_write_workers_per_disk` {#async_file_cache_write_workers_per_disk}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュへの非同期書き込み時に、キャッシュ用ディスクごとに使用する書き込みスレッド数です。`enable_async_file_cache_write = true` の場合にのみ有効です。
* デフォルト値: 16

#### `async_file_cache_write_max_pending_bytes` {#async_file_cache_write_max_pending_bytes}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュへの非同期書き込みを待つデータの合計サイズの上限をバイト単位で指定します。上限を超えた書き戻しリクエストは破棄されます。クエリの正しさには影響しませんが、そのデータはキャッシュされません。`-1` は制限なしを意味します。
* デフォルト値: -1

#### `enable_file_cache_write_from_s3_file_writer` {#enable_file_cache_write_from_s3_file_writer}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージへの書き込み時に、データをローカルのファイルキャッシュにも書き込むかどうかを指定します。これにより、書き込んだばかりのデータをキャッシュから直接読み取れます。
* デフォルト値: true

#### `enable_file_cache_write_index_file_only` {#enable_file_cache_write_index_file_only}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。インデックスファイルだけをファイルキャッシュへ書き込むかどうかを指定します。有効にすると、キャッシュ容量が限られている場合にインデックスを優先してキャッシュに保持できます。
* デフォルト値: false

#### `enable_cache_read_from_peer` {#enable_cache_read_from_peer}

* 型: bool
* 説明: peer キャッシュ読み取りのマスタースイッチです。有効な場合、ローカルの File Cache でキャッシュミスが発生すると、まず他の BE（同じコンピューティンググループまたは別のグループ）の File Cache からブロックを読み取ろうとします。どの BE にもない場合にのみ、オブジェクトストレージにフォールバックします。同一グループ内とグループ間の peer 読み取りは、このスイッチでまとめて制御され、グループ間の読み取りだけを無効にはできません。グループ間の peer 読み取りはバージョン 4.2.0 以降でサポートされ、同時に設定項目 `cache_read_from_peer_expired_seconds` が削除されました。詳しくは [Peer Cache Read](../../compute-storage-decoupled/file-cache/file-cache-peer-read) を参照してください。
* デフォルト値: false (必要な場合に明示的に有効化)

#### `enable_peer_s3_race` {#enable_peer_s3_race}

* 型: bool
* 説明: バージョン 4.2.0 で追加されました。peer からの読み取りとオブジェクトストレージからの読み取りを競合させ、先に得られた結果を使用するかどうかを指定します。無効な場合は順番に読み取り、peer 候補を一つずつ試して、すべて失敗した後にオブジェクトストレージから読み取ります。
* デフォルト値: true

#### `peer_race_hedge_delay_ms` {#peer_race_hedge_delay_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。読み取りを競合させる際に peer に与える先行時間をミリ秒単位で指定します。この時間内に peer が応答すれば、オブジェクトストレージへの読み取りは送信されません。`0` は両方の読み取りを同時に開始します。
* デフォルト値: 20

#### `max_concurrent_peer_races` {#max_concurrent_peer_races}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。単一 BE 上で、peer とオブジェクトストレージの読み取りを同時に競合させられる最大数です。この上限を超えたキャッシュミスは順番に読み取られます。
* デフォルト値: 64

#### `peer_cache_fill_compute_group_id` {#peer_cache_fill_compute_group_id}

* 型: string
* 説明: バージョン 4.2.0 で追加されました。読み取りを開始する BE に設定します。グループ間のキャッシュ充填を担当するコンピューティンググループの ID です。コンピューティンググループ名ではなく、`SHOW BACKENDS` の `Tag` 列にある `compute_group_id` を指定します。選択された peer 候補がこのグループに属し、そのブロックを持っていない場合、リクエストは peer にオブジェクトストレージからブロックを取得し、自身の File Cache に書き込むよう求めます。空の場合、充填は使用されません。
* デフォルト値: ""

#### `enable_peer_server_cache_fill` {#enable_peer_server_cache_fill}

* 型: bool
* 説明: バージョン 4.2.0 で追加されました。キャッシュを提供する BE に設定します。充填フラグを持つ peer 読み取りリクエストを受け付けるかどうかを指定します。無効な場合、ローカルにキャッシュされていないブロックは見つからないと報告され、要求元 BE はオブジェクトストレージにフォールバックします。
* デフォルト値: true

#### `peer_server_cache_fill_timeout_ms` {#peer_server_cache_fill_timeout_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側での充填一回あたりの最大待機時間をミリ秒単位で指定します。タイムアウトすると、要求元 BE はオブジェクトストレージにフォールバックします。
* デフォルト値: 6000

#### `max_concurrent_peer_server_fills` {#max_concurrent_peer_server_fills}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側で同時に実行できる充填の最大数です。上限を超える充填リクエストは拒否され、要求元 BE はオブジェクトストレージにフォールバックします。
* デフォルト値: 32

#### `peer_rpc_failure_eviction_threshold` {#peer_rpc_failure_eviction_threshold}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。peer 候補で RPC がこの回数だけ連続して失敗すると、候補リストから削除されます。
* デフォルト値: 3

#### `peer_all_miss_cooldown_threshold` {#peer_all_miss_cooldown_threshold}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。すべての peer 候補でキャッシュミスとなる読み取りが連続して発生し、tablet がクールダウンに入るまでの回数です。クールダウン中の読み取りは直接オブジェクトストレージに送られます。
* デフォルト値: 5

#### `peer_all_miss_cooldown_duration_s` {#peer_all_miss_cooldown_duration_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。peer 読み取りのクールダウン期間を秒単位で指定します。
* デフォルト値: 300

#### `peer_candidate_expiry_s` {#peer_candidate_expiry_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。peer 候補エントリの有効期間を、最後に使用した時点から秒単位で指定します。期限切れのエントリはメモリから削除され、次のキャッシュミス時に FE から再取得されます。
* デフォルト値: 3600

#### `peer_candidate_cleanup_interval_s` {#peer_candidate_cleanup_interval_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。期限切れの peer 候補を削除するバックグラウンドジョブの実行間隔を秒単位で指定します。
* デフォルト値: 3600

#### `peer_fetch_queue_timeout_ms` {#peer_fetch_queue_timeout_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。peer 読み取りリクエストが提供側の処理キューで待機できる最大時間をミリ秒単位で指定します。これを超えて待機したリクエストは拒否され、要求元 BE が速やかにオブジェクトストレージへフォールバックできるようにします。
* デフォルト値: 100

#### `brpc_peer_fetch_pool_threads` {#brpc_peer_fetch_pool_threads}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側で peer 読み取りリクエストを処理するスレッドプールのサイズです。このプールは、データロードなどの負荷の高い RPC を処理するプールから分離されています。`-1` は `max(64, 2 × CPU コア数)` を意味します。動的な変更には対応していません。
* デフォルト値: -1

#### `brpc_peer_fetch_pool_max_queue_size` {#brpc_peer_fetch_pool_max_queue_size}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側の peer 読み取りスレッドプールのキュー長です。`-1` は `max(4096, 128 × CPU コア数)` を意味します。動的な変更には対応していません。
* デフォルト値: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num` {#min_peer_race_s3_thread_num--max_peer_race_s3_thread_num}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。要求元で peer とオブジェクトストレージの読み取りを競合させる際に、オブジェクトストレージからの読み取りを実行するプールの最小 / 最大スレッド数です。動的な変更には対応していません。
* デフォルト値: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core` {#s3_get_requests_per_second_per_core--s3_put_requests_per_second_per_core}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コアごとに計算する、オブジェクトストレージへの GET / PUT リクエストの QPS 制限です。負の値はこの方式を無効にし、従来の絶対トークン数による設定にフォールバックします。`0` は QPS を制限しないことを意味します。
* デフォルト値: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max` {#s3_get_requests_per_second_max--s3_put_requests_per_second_max}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から算出される GET / PUT の QPS に対する絶対的な上限です。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core` {#s3_get_bytes_per_second_per_core--s3_put_bytes_per_second_per_core}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コアごとに計算する、オブジェクトストレージの GET / PUT 帯域幅の制限です。単位はコアごとのバイト/秒です。`0` 以下の値は帯域幅を制限しないことを意味します。
* デフォルト値: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max` {#s3_get_bytes_per_second_max--s3_put_bytes_per_second_max}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から算出される GET / PUT 帯域幅に対する絶対的な上限をバイト/秒単位で指定します。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_rate_limiter_cpu_cores_override` {#s3_rate_limiter_cpu_cores_override}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。上記のレート制限を算出するために使用する CPU コア数です。`0` 以下の場合は、マシンのコア数が自動検出されます。
* デフォルト値: 0

#### `s3_rate_limiter_log_interval` {#s3_rate_limiter_log_interval}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージのレート制限が発動したとき、ログエントリを出力する最小間隔をミリ秒単位で指定します。
* デフォルト値: 1000

#### `file_cache_mem_storage_shard_num` {#file_cache_mem_storage_shard_num}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュのメモリストレージのシャード数です。同時アクセス時のロック競合を減らすために使用します。
* デフォルト値: 1024

#### `time_series_max_tablet_version_num` {#time_series_max_tablet_version_num}

* 型: int
* 説明: 時系列 compaction ポリシーを使用する単一 tablet のバージョン数を制限します。データロードの頻度が高すぎる場合や compaction が間に合わない場合に、多数のバージョンが蓄積することを防ぎます。上限を超えるとデータロードタスクは拒否されます。
* デフォルト値: 20000
