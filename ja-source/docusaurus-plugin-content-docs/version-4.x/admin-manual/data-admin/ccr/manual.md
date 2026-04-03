---
{
  "title": "操作マニュアル",
  "language": "ja",
  "description": "Syncerが同期を行う際、ユーザーはupstreamとdownstream両方のアカウントを提供する必要があり、これらは以下の権限を持つ必要があります："
}
---
## 使用要件

### ネットワーク要件

- Syncerは、上流と下流の両方のFEおよびBEと通信できる必要があります。
- 下流のBEは、Doris BEプロセスが使用するIPに直接アクセスできる必要があります（`show frontends/backends`で確認できます）。

### 権限要件

Syncerが同期を実行する際、ユーザーは上流と下流の両方のアカウントを提供する必要があり、これらのアカウントには以下の権限が必要です：

- Select_priv: データベースとテーブルの読み取り専用権限。
- Load_priv: データベースとテーブルの書き込み権限（Load、Insert、Deleteなどを含む）。
- Alter_priv: データベースとテーブルの変更権限（データベース/テーブルの名前変更、カラムの追加/削除/変更、パーティションの追加/削除などを含む）。
- Create_priv: データベース、テーブル、ビューの作成権限。
- Drop_priv: データベース、テーブル、ビューの削除権限。
- Admin権限（後で削除を検討）、enable binlog設定の確認に使用されます。

### バージョン要件

- Syncerバージョン >= 下流のDorisバージョン >= 上流のDorisバージョン。したがって、まずSyncerをアップグレードし、次に下流のDorisをアップグレードし、最後に上流のDorisをアップグレードしてください。
- Doris 2.0の最小バージョンは2.0.15で、Doris 2.1の最小バージョンは2.1.6です。
- Syncerバージョン2.1.8および3.0.4以降、SyncerはDoris 2.0をサポートしなくなりました。

### 設定およびプロパティ要件

**プロパティ要件**
- `light_schema_change`: Syncerでは、上流と下流の両方のテーブルで`light_schema_table`プロパティを設定する必要があります。そうしないと、データ同期エラーが発生する可能性があります。注意：最新バージョンのDorisでは、テーブル作成時にデフォルトで`light_schema_change`プロパティが設定されます。Dorisバージョン1.1以前を使用している場合、またはそこからアップグレードした場合は、Syncer同期を有効にする前に、既存のOLAPテーブルに`light_schema_change`プロパティを設定する必要があります。

**設定要件**
- `restore_reset_index_id`: 同期対象のテーブルに転置インデックスがある場合、ターゲットクラスターで`false`に設定する必要があります。
- `ignore_backup_tmp_partitions`: 上流が一時パーティションを作成した場合、Dorisはバックアップを禁止し、Syncer同期が中断される原因となります。FEで`ignore_backup_tmp_partitions=true`を設定することで、この問題を回避できます。

## データベース内のすべてのテーブルでbinlogを有効化

```shell
bash bin/enable_db_binlog.sh -h host -p port -u user -P password -d db
```
## Syncerの開始

環境変数 ${SYNCER_HOME} がSyncerの作業ディレクトリに設定されていると仮定します。`bin/start_syncer.sh`を使用してSyncerを開始できます。

| **オプション** | **説明** | **コマンド例** | **デフォルト値** |
|------------|-----------------|---------------------|--------------------|
| `--daemon` | Syncerをバックグラウンドで実行する | `bin/start_syncer.sh --daemon` | `false` |
| `--db_type` | Syncerはメタデータを保存するために2種類のデータベースを使用できます：`sqlite3`（ローカルストレージ）と`mysql`（ローカルまたはリモートストレージ）。メタデータを保存するために`mysql`を使用する場合、Syncerは`CREATE IF NOT EXISTS`を使用して`ccr`という名前のデータベースを作成し、メタデータテーブルがそこに保存されます。 | `bin/start_syncer.sh --db_type mysql` | `sqlite3` |
| `--db_dir` | **`sqlite3`を使用する場合のみ有効**；SQLite3で生成されるデータベースファイルのファイル名とパスを指定します。 | `bin/start_syncer.sh --db_dir /path/to/ccr.db` | `SYNCER_HOME/db/ccr.db` |
| `--db_host`<br>`--db_port`<br>`--db_user`<br>`--db_password` | **`mysql`を使用する場合のみ有効**；MySQLのホスト、ポート、ユーザー、パスワードを設定するために使用されます。 | `bin/start_syncer.sh --db_host 127.0.0.1 --db_port 3306 --db_user root --db_password "qwe123456"` | `db_host`と`db_port`は例の値がデフォルト；`db_user`と`db_password`は空がデフォルト。 |
| `--log_dir` | ログ出力パスを指定する | `bin/start_syncer.sh --log_dir /path/to/ccr_syncer.log` | `SYNCER_HOME/log/ccr_syncer.log` |
| `--log_level` | ログ出力レベルを指定する；ログ形式は次のとおりです：`time level msg hooks`。バックグラウンドで実行する場合のデフォルト値は`info`；フォアグラウンドで実行する場合、デフォルト値は`trace`で、`tee`を使用して`log_dir`にログが保存されます。 | `bin/start_syncer.sh --log_level info` | `info`（バックグラウンド）<br>`trace`（フォアグラウンド） |
| `--host`<br>`--port` | Syncerの`host`と`port`を指定する。`host`はクラスター内のSyncerインスタンスを区別するために使用され、Syncerの名前として理解できます；クラスター内のSyncerの命名形式は`host:port`です。 | `bin/start_syncer.sh --host 127.0.0.1 --port 9190` | `host`のデフォルトは`127.0.0.1`<br>`port`のデフォルトは`9190` |
| `--pid_dir` | PIDファイルを保存するパスを指定する。PIDファイルは`stop_syncer.sh`スクリプトがSyncerを停止するための認証情報で、対応するSyncerのプロセス番号を保存します。クラスター管理の利便性のため、パスをカスタマイズできます。 | `bin/start_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |

## Syncerの停止

`bin/stop_syncer.sh`を使用して3つの方法でSyncerを停止できます：

| **方法/オプション** | **説明** | **コマンド例** | **デフォルト値** |
|-------------------|-----------------|---------------------|--------------------|
| **方法1** 単一のSyncerを停止 | 停止するSyncerの`host`と`port`を指定する；開始時に使用した`host`と一致する必要があることに注意してください。 | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | なし |
| **方法2** Syncerを一括停止 | 停止するPIDファイル名をスペースで区切り、`"`で囲んで指定する。 | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | なし |
| **方法3** すべてのSyncerを停止 | デフォルトでは、`pid_dir`パス内のPIDファイルに対応するすべてのSyncerを停止します。 | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | なし |

方法3のオプション：

| **オプション** | **説明** | **コマンド例** | **デフォルト値** |
|------------|-----------------|---------------------|--------------------|
| `--pid_dir` | PIDファイルが置かれているディレクトリを指定する；3つの停止方法すべてがこのオプションに依存して実行されます。 | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |
| `--host`<br>`--port` | `pid_dir`パス内の`host:port`に対応するSyncerを停止する。`host`のみが指定された場合、**方法3**に降格します；`host`と`port`の両方が空でない場合、**方法1**として有効になります。 | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | `host`: 127.0.0.1<br>`port`: 空 |
| `--files` | `pid_dir`パス内の指定されたPIDファイル名に対応するSyncerを停止する、スペースで区切り`"`で囲んで指定。 | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | なし |

## Syncer操作一覧

**リクエストの一般テンプレート**

```shell
curl -X POST -H "Content-Type: application/json" -d {json_body} http://ccr_syncer_host:ccr_syncer_port/operator
```
json_body: 操作に必要な情報をJSON形式で送信します。

operator: Syncerの異なる操作に対応します。

したがって、インターフェースの戻り値はすべてJSONです。成功した場合、`success`フィールドはtrueになり、エラーがある場合はfalseになり、エラーメッセージは`ErrMsgs`フィールドに格納されます。

```JSON
{"success":true}

or

{"success":false,"error_msg":"job ccr_test not exist"}
```
### ジョブの作成

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "ccr_test",
    "src": {
    "host": "localhost",
    "port": "9030",
    "thrift_port": "9020",
    "user": "root",
    "password": "",
    "database": "demo",
    "table": "example_tbl"
    },
    "dest": {
    "host": "localhost",
    "port": "9030",
    "thrift_port": "9020",
    "user": "root",
    "password": "",
    "database": "ccrt",
    "table": "copy"
    }
}' http://127.0.0.1:9190/create_ccr
```
- name: CCR同期ジョブの名前。一意である必要があります。

- host, port: クラスターマスターのホストとMySQL（jdbc）のポートに対応します。

- thrift_port: FEのrpc_portに対応します。

- user, password: Syncerがトランザクションを開始し、データをプルする際などに使用するIDです。

- database, table:

  - データベースレベルの同期の場合は、dbNameを入力し、tableNameは空のままにしてください。

  - テーブルレベルの同期の場合は、dbNameとtableNameの両方を入力してください。

### 同期の進行状況を確認する

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/get_lag
```
job_name は create_ccr の実行時に作成された名前です。

### ジョブの一時停止

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/pause
```
### ジョブの再開

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/resume
```
### ジョブの削除

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/delete
```
### バージョンを取得

```shell
curl http://ccr_syncer_host:ccr_syncer_port/version

# > return
{"version": "2.0.1"}
```
### ジョブステータスの表示

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/job_status

{
"success": true,
"status": {
    "name": "ccr_db_table_alias",
    "state": "running",
    "progress_state": "TableIncrementalSync"
}
}
```
### 同期の終了

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/desync
```
### Job リストの取得

```shell
curl http://ccr_syncer_host:ccr_syncer_port/list_jobs

{"success":true,"jobs":["ccr_db_table_alias"]}
```
## Syncerの高可用性

Syncerの高可用性はMySQLに依存しています。MySQLがバックエンドストレージとして使用される場合、Syncerは他のSyncerを発見することができ、1つがクラッシュした場合、他のSyncerがそのジョブを引き継ぎます。

## アップグレード

### 1. Syncerのアップグレード
以下の環境変数が設定されていることを前提とします：
- ${SYNCER_HOME}: Syncerの作業ディレクトリ
- ${SYNCER_PACKAGE_DIR}: 新しいSyncerを含むディレクトリ

以下の手順に従って、すべてのSyncerをアップグレードします。

1.1. 開始コマンドの保存

以下のコマンドの出力をファイルに保存します。

```
ps -elf | grep ccr_syncer
```
1.2. 現在のSyncerを停止する

```shell
sh bin/stop_syncer.sh --pid_dir ${SYNCER_HOME}/bin
```
1.3. 既存のMetaServiceバイナリをバックアップする

```shell
mv ${SYNCER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
```
1.4. 新しいパッケージをデプロイする

```shell
cp ${SYNCER_PACKAGE_DIR}/bin ${SYNCER_HOME}/bin
```
1.5. 新しいSyncerを開始する

1.1で保存したコマンドを使用して新しいSyncerを開始します。

### 2. ダウンストリームDorisをアップグレードする（必要な場合）

[Upgrade Doris](../../../admin-manual/cluster-management/upgrade.md)ガイドの手順に従ってアップストリームシステムをアップグレードします。

### 3. アップストリームDorisをアップグレードする（必要な場合）

[Upgrade Doris](../../../admin-manual/cluster-management/upgrade.md)ガイドの手順に従ってアップストリームシステムをアップグレードします。

## 使用上の注意

:::caution

`is_being_synced`属性は通常の状況下ではSyncerによって完全に制御されてオン・オフされるべきです。ユーザーはこの属性を自分で変更してはいけません。

:::

### 重要な注意事項

- CCR同期中、backup/restoreジョブとbinlogはすべてFEメモリにあるため、FE（ソースクラスターとターゲットクラスターの両方）の各CCRジョブに少なくとも4GB以上のヒープメモリを割り当てることを推奨します。また、無関係なジョブのメモリ消費を削減するために以下の設定を変更してください：
    - FE設定`max_backup_restore_job_num_per_db`を変更：
        メモリ内の各DBのbackup/restoreジョブ数を記録します。デフォルト値は10ですが、2に設定すれば十分です。
    - ソースクラスターのdb/tableプロパティを変更してbinlog保持制限を設定：
        - `binlog.max_bytes`：binlogが占有する最大メモリ。少なくとも4GB保持することを推奨（デフォルトは無制限）。
        - `binlog.ttl_seconds`：binlog保持時間。バージョン2.0.5以前はデフォルトが無制限、それ以降はデフォルト値が1日（86400）。
        例えば、binlog ttl secondsを1時間保持に変更する場合：`ALTER TABLE table SET ("binlog.ttl_seconds"="3600")`。
- CCRの正確性はターゲットクラスターのトランザクション状態にも依存するため、同期中にトランザクションが早く回収されすぎないよう以下の設定を増やす必要があります：
    - `label_num_threshold`：TXN Labelの数を制御するために使用。
    - `stream_load_default_timeout_second`：TXNタイムアウト時間を制御するために使用。
    - `label_keep_max_second`：TXN終了後の保持時間を制御するために使用。
    - `streaming_label_keep_max_second`：上記と同じ。
- データベース同期でソースクラスターが大量のタブレットを持つ場合、結果として生成されるCCRジョブが非常に大きくなる可能性があり、いくつかのFE設定の変更が必要です：
    - `max_backup_tablets_per_job`：
        単一バックアップジョブに関与するタブレット数の上限。タブレット数に基づいて調整が必要（デフォルト値は300,000。タブレットが多すぎるとFE OOMのリスクがあり、優先的にタブレット数を削減）。
    - `thrift_max_message_size`：
        FE thriftサーバーが許可する単一RPCパケットの最大サイズ。デフォルトは100MB。タブレット数が多すぎてスナップショット情報サイズが100MBを超える場合、この制限を調整する必要があり、最大2GBまで可能。
        - スナップショット情報サイズはccr syncerログで確認でき、キーワードは：`snapshot response meta size: %d, job info size: %d`。スナップショット情報サイズは約meta size + job info size。
    - `fe_thrift_max_pkg_bytes`：
        上記と同じで、バージョン2.0で調整が必要な追加パラメーター。デフォルト値は20MB。
    - `restore_download_job_num_per_be`：
        各BEに送信されるダウンロードジョブの上限。デフォルトは3で、restoreジョブには小さすぎるため0に調整が必要（つまり、この制限を無効にする）。この設定はバージョン2.1.8と3.0.4以降は不要。
    - `backup_upload_job_num_per_be`：
        各BEに送信されるアップロードジョブの上限。デフォルトは3で、backupジョブには小さすぎるため0に調整が必要（つまり、この制限を無効にする）。この設定はバージョン2.1.8と3.0.4以降は不要。
    - 上記のFE設定に加えて、CCRジョブのdbタイプがMySQLの場合、いくつかのMySQL設定も調整が必要です：
        - MySQLサーバーは単一のselect/insertで返される/挿入されるデータパケットのサイズを制限します。この制限を緩和するために以下の設定を増やし、例えば上限1GBに調整します：

        ```
        [mysqld]
        max_allowed_packet = 1024MB
        ```
- MySQLクライアントもこの制限があります。ccr syncerバージョン2.1.6/2.0.15以前では、上限は128MBです。それ以降のバージョンでは、パラメータ`--mysql_max_allowed_packet`（バイト単位）を通じて調整でき、デフォルト値は1024MBです。
        > 注意：バージョン2.1.8および3.0.4以降では、ccr syncerはデータベースにスナップショット情報を保存しなくなったため、デフォルトのデータパケットサイズで十分です。
- 同様に、BE側でもいくつかの設定を変更する必要があります：
    - `thrift_max_message_size`：BE thriftサーバーが許可する最大単一RPCパケットサイズ。デフォルトは100MBです。タブレット数が多すぎて、エージェントジョブサイズが100MBを超える場合、この制限を調整する必要があり、最大2GBまで設定できます。
    - `be_thrift_max_pkg_bytes`：上記と同様で、バージョン2.0でのみ調整が必要です。デフォルト値は20MBです。
- 上記の設定を変更しても、タブレット数が増え続けると、結果として生成されるスナップショットサイズが2GBを超える可能性があり、これはDoris FE edit logおよびRPCメッセージサイズの閾値であるため、同期が失敗します。バージョン2.1.8および3.0.4以降、Dorisはスナップショットを圧縮することで、バックアップとリカバリでサポートするタブレット数をさらに増やすことができます。これは以下のパラメータで有効にできます：
    - `restore_job_compressed_serialization`：リストアジョブの圧縮を有効にします（メタデータ互換性に影響し、デフォルトはオフ）。
    - `backup_job_compressed_serialization`：バックアップジョブの圧縮を有効にします（メタデータ互換性に影響し、デフォルトはオフ）。
    - `enable_restore_snapshot_rpc_compression`：スナップショット情報の圧縮を有効にし、主にRPCに影響します（デフォルトはオン）。
    > 注意：バックアップ/リストアジョブが圧縮されているかどうかを識別するには追加のコードが必要で、バージョン2.1.8および3.0.4以前のコードには関連コードが含まれていないため、バックアップ/リストアジョブが生成されると、以前のDorisバージョンに戻すことはできません。2つの例外があります：すでにキャンセルまたは完了したバックアップ/リストアジョブは圧縮されないため、バックアップ/リストアジョブの完了を待つか、戻す前にジョブを積極的にキャンセルすることで、安全なロールバックを確保できます。
- CCRは内部的にdb/table名をいくつかの内部ジョブのラベルとして使用するため、CCRジョブで制限を超えるラベルに遭遇した場合、FEパラメータ`label_regex_length`を調整してこの制限を緩和できます（デフォルト値は128）。
- バックアップは現在cooldownタブレットがあるテーブルのバックアップをサポートしていないため、これに遭遇すると同期が終了するため、CCRジョブを作成する前に、いずれかのテーブルに`storage_policy`プロパティが設定されているかどうかを確認する必要があります。
### パフォーマンス関連パラメータ
- ユーザーのデータ量が非常に大きい場合、バックアップとリカバリの完了に必要な時間が1日（デフォルト値）を超える可能性があるため、以下のパラメータを必要に応じて調整する必要があります：
    - `backup_job_default_timeout_ms`：バックアップ/リストアジョブのタイムアウト期間。ソースクラスターとターゲットクラスターの両方のFEでこれを設定する必要があります。
    - アップストリームでbinlog保持時間を変更します：`ALTER DATABASE $db SET PROPERTIES ("binlog.ttl_seconds" = "xxxx")`。
- ダウンストリームBEダウンロード速度が遅い：
    - `max_download_speed_kbps`：単一のダウンストリームBEにおける単一ダウンロードスレッドのダウンロード速度制限。デフォルトは50MB/sです。
    - `download_worker_count`：ダウンストリームでダウンロードジョブを実行するスレッド数。お客様のマシンタイプに基づいて調整し、通常の読み書き操作に影響を与えない範囲で最大化する必要があります。このパラメータを調整する場合、`max_download_speed_kbps`を調整する必要はありません。
        - 例えば、お客様のマシンのネットワークカードが最大1GBの帯域幅を提供し、最大許可ダウンロードスレッドが200MBの帯域幅を使用する場合、`max_download_speed_kbps`を変更せずに、`download_worker_count`を4に設定する必要があります。
- ダウンストリームBEからのbinlogダウンロード速度を制限する：
    BE側設定パラメータ：

    ```shell
    download_binlog_rate_limit_kbs=1024 # Limit the speed of a single BE node pulling Binlog (including Local Snapshot) from the source cluster to 1 MB/s.
    ```
詳細なパラメータと説明：
    1. `download_binlog_rate_limit_kbs`パラメータはソースクラスタのBEノードで設定され、このパラメータを設定することで、データ取得速度を効果的に制限できます。
    2. `download_binlog_rate_limit_kbs`パラメータは主に単一のBEノードの速度を設定するために使用されます。クラスタ全体の速度を計算するには、パラメータ値にクラスタ内のノード数を乗算する必要があります。
