---
{
  "title": "操作マニュアル",
  "language": "ja",
  "description": "Syncerが同期を行う際、ユーザーはupstreamとdownstream両方のアカウントを提供する必要があり、これらのアカウントは以下の権限を持つ必要があります："
}
---
## 使用要件

### ネットワーク要件

- Syncerは上流と下流の両方のFEとBEと通信できる必要があります。
- 下流のBEは、Doris BEプロセスで使用されるIPに直接アクセスできる必要があります（`show frontends/backends`で確認）。

### 権限要件

Syncerが同期する際、ユーザーは上流と下流の両方のアカウントを提供する必要があり、これらは以下の権限を持つ必要があります：

- Select_priv: データベースとテーブルの読み取り専用権限。
- Load_priv: Load、Insert、Deleteなどを含む、データベースとテーブルの書き込み権限。
- Alter_priv: データベース/テーブルの名前変更、カラムの追加/削除/変更、パーティションの追加/削除などを含む、データベースとテーブルの変更権限。
- Create_priv: データベース、テーブル、ビューの作成権限。
- Drop_priv: データベース、テーブル、ビューの削除権限。
- Admin権限（後で削除が検討されている）、enable binlog configの確認に使用。

### バージョン要件

- Syncerバージョン >= 下流Dorisバージョン >= 上流Dorisバージョン。そのため、まずSyncerをアップグレードし、次に下流Dorisをアップグレードし、最後に上流Dorisをアップグレードしてください。
- Doris 2.0の最小バージョンは2.0.15、Doris 2.1の最小バージョンは2.1.6です。
- Syncerバージョン2.1.8と3.0.4以降、SyncerはDoris 2.0をサポートしなくなりました。

### 設定とプロパティ要件

**プロパティ要件**
- `light_schema_change`: Syncerでは上流と下流の両方のテーブルで`light_schema_table`プロパティを設定する必要があります。そうしない場合、データ同期エラーが発生する可能性があります。注意：最新バージョンのDorisでは、テーブル作成時にデフォルトで`light_schema_change`プロパティが設定されます。Dorisバージョン1.1以前を使用している場合、またはそれからアップグレードした場合、Syncer同期を有効にする前に既存のOLAPテーブルに`light_schema_change`プロパティを設定する必要があります。

**設定要件**
- `restore_reset_index_id`: 同期対象のテーブルに転置インデックスがある場合、ターゲットクラスタで`false`として設定する必要があります。
- `ignore_backup_tmp_partitions`: 上流で一時パーティションを作成する場合、Dorisはバックアップを禁止し、Syncer同期が中断される原因となります。FEで`ignore_backup_tmp_partitions=true`を設定することで、この問題を回避できます。

## データベース内のすべてのテーブルでbinlogを有効にする

```shell
bash bin/enable_db_binlog.sh -h host -p port -u user -P password -d db
```
## Syncerの開始

環境変数 ${SYNCER_HOME} がSyncerの作業ディレクトリに設定されていることを前提とします。`bin/start_syncer.sh`を使用してSyncerを開始できます。

| **オプション** | **説明** | **コマンド例** | **デフォルト値** |
|------------|-----------------|---------------------|--------------------|
| `--daemon` | Syncerをバックグラウンドで実行する | `bin/start_syncer.sh --daemon` | `false` |
| `--db_type` | Syncerはメタデータを保存するために2種類のデータベースを使用できます：`sqlite3`（ローカルストレージ）と`mysql`（ローカルまたはリモートストレージ）。メタデータ保存に`mysql`を使用する場合、Syncerは`CREATE IF NOT EXISTS`を使用して`ccr`という名前のデータベースを作成し、メタデータテーブルがそこに保存されます。 | `bin/start_syncer.sh --db_type mysql` | `sqlite3` |
| `--db_dir` | **`sqlite3`使用時のみ有効**；SQLite3で生成されるデータベースファイルのファイル名とパスを指定します。 | `bin/start_syncer.sh --db_dir /path/to/ccr.db` | `SYNCER_HOME/db/ccr.db` |
| `--db_host`<br>`--db_port`<br>`--db_user`<br>`--db_password` | **`mysql`使用時のみ有効**；MySQLのホスト、ポート、ユーザー、パスワードの設定に使用されます。 | `bin/start_syncer.sh --db_host 127.0.0.1 --db_port 3306 --db_user root --db_password "qwe123456"` | `db_host`と`db_port`はサンプル値がデフォルト；`db_user`と`db_password`は空がデフォルト。 |
| `--log_dir` | ログ出力パスを指定する | `bin/start_syncer.sh --log_dir /path/to/ccr_syncer.log` | `SYNCER_HOME/log/ccr_syncer.log` |
| `--log_level` | ログ出力レベルを指定する；ログフォーマットは次の通りです：`time level msg hooks`。バックグラウンド実行時のデフォルト値は`info`；フォアグラウンド実行時のデフォルト値は`trace`で、ログは`tee`を使用して`log_dir`に保存されます。 | `bin/start_syncer.sh --log_level info` | `info`（バックグラウンド）<br>`trace`（フォアグラウンド） |
| `--host`<br>`--port` | Syncerの`host`と`port`を指定します。`host`はクラスター内のSyncerインスタンスを区別するために使用され、Syncerの名前として理解できます；クラスター内のSyncerの命名形式は`host:port`です。 | `bin/start_syncer.sh --host 127.0.0.1 --port 9190` | `host`のデフォルトは`127.0.0.1`<br>`port`のデフォルトは`9190` |
| `--pid_dir` | PIDファイルを保存するパスを指定します。PIDファイルは`stop_syncer.sh`スクリプトがSyncerを停止するための認証情報で、対応するSyncerのプロセス番号を保存します。クラスター管理を簡単にするため、パスをカスタマイズできます。 | `bin/start_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |

## Syncerの停止

`bin/stop_syncer.sh`を使用して3つの方法でSyncerを停止できます：

| **方法/オプション** | **説明** | **コマンド例** | **デフォルト値** |
|-------------------|-----------------|---------------------|--------------------|
| **方法1** 単一のSyncerを停止 | 停止するSyncerの`host`と`port`を指定します；開始時に使用した`host`と一致する必要があることに注意してください。 | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | なし |
| **方法2** Syncerの一括停止 | 停止するPIDファイル名を指定し、スペースで区切って`"`で囲みます。 | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | なし |
| **方法3** すべてのSyncerを停止 | デフォルトでは、`pid_dir`パス内のPIDファイルに対応するすべてのSyncerを停止します。 | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | なし |

方法3のオプション：

| **オプション** | **説明** | **コマンド例** | **デフォルト値** |
|------------|-----------------|---------------------|--------------------|
| `--pid_dir` | PIDファイルが配置されているディレクトリを指定します；3つの停止方法すべてがこのオプションに依存して実行されます。 | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |
| `--host`<br>`--port` | `pid_dir`パス内の`host:port`に対応するSyncerを停止します。`host`のみが指定された場合、**方法3**に退化します；`host`と`port`の両方が空でない場合、**方法1**として有効になります。 | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | `host`: 127.0.0.1<br>`port`: 空 |
| `--files` | `pid_dir`パス内の指定されたPIDファイル名に対応するSyncerを停止し、スペースで区切って`"`で囲みます。 | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | なし |

## Syncer操作一覧

**リクエストの一般テンプレート**

```shell
curl -X POST -H "Content-Type: application/json" -d {json_body} http://ccr_syncer_host:ccr_syncer_port/operator
```
json_body: 操作に必要な情報をJSON形式で送信します。

operator: Syncerの異なる操作に対応します。

したがって、インターフェースの戻り値はすべてJSONです。成功した場合、`success`フィールドはtrueになり、エラーがある場合はfalseになり、エラーメッセージは`ErrMsgs`フィールドに含まれます。

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
- name: CCR同期ジョブの名前、一意である必要があります。

- host, port: クラスタmasterのhostとMySQL（jdbc）のportに対応します。

- thrift_port: FEのrpc_portに対応します。

- user, password: Syncerがトランザクションを開く、データをプルするなどの際のアイデンティティです。

- database, table:

  - データベースレベルの同期の場合、dbNameを記入し、tableNameは空のままにします。

  - テーブルレベルの同期の場合、dbNameとtableNameの両方を記入します。

### 同期進捗の確認

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/get_lag
```
job_nameは、create_ccr実行時に作成される名前です。

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
### ジョブを削除

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
### ジョブ一覧を取得

```shell
curl http://ccr_syncer_host:ccr_syncer_port/list_jobs

{"success":true,"jobs":["ccr_db_table_alias"]}
```
## Syncer高可用性

Syncerの高可用性はMySQLに依存します。MySQLがバックエンドストレージとして使用されている場合、Syncerは他のSyncerを発見でき、1つがクラッシュした場合、他のSyncerがそのジョブを引き継ぎます。

## アップグレード

### 1. Syncerのアップグレード
以下の環境変数が設定されていることを前提とします：
- ${SYNCER_HOME}：Syncerの作業ディレクトリ
- ${SYNCER_PACKAGE_DIR}：新しいSyncerを含むディレクトリ

以下の手順に従って、すべてのSyncerをアップグレードします。

1.1. 起動コマンドの保存

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
1.4. 新しいpackageをデプロイする

```shell
cp ${SYNCER_PACKAGE_DIR}/bin ${SYNCER_HOME}/bin
```
1.5. 新しいSyncerを開始する

1.1で保存したコマンドを使用して新しいSyncerを開始します。

### 2. 下流のDorisをアップグレードする（必要に応じて）

[Upgrade Doris](../../../admin-manual/cluster-management/upgrade.md)ガイドの手順に従って、上流システムをアップグレードします。

### 3. 上流のDorisをアップグレードする（必要に応じて）

[Upgrade Doris](../../../admin-manual/cluster-management/upgrade.md)ガイドの手順に従って、上流システムをアップグレードします。

## 使用上の注意事項

:::caution

`is_being_synced`属性は、通常の状況下ではSyncerによって完全に制御され、オンまたはオフにされるべきです。ユーザーは自分でこの属性を変更すべきではありません。

:::

### 重要な注意事項

- CCR同期中、backup/restoreジョブとbinlogはすべてFEメモリ内にあるため、FE（ソースとターゲットの両方のクラスタ）で各CCRジョブに対して最低4GB以上のヒープメモリを割り当てることを推奨し、また関連のないジョブのメモリ消費を削減するために以下の設定を変更することも推奨します：
    - FE設定`max_backup_restore_job_num_per_db`を変更：
        メモリ内の各DBのbackup/restoreジョブ数を記録します。デフォルト値は10ですが、2に設定すれば十分です。
    - ソースクラスタのdb/tableプロパティを変更してbinlog保持制限を設定：
        - `binlog.max_bytes`：binlogが占有する最大メモリ。最低4GB保持することを推奨（デフォルトは無制限）。
        - `binlog.ttl_seconds`：binlog保持時間。バージョン2.0.5より前はデフォルトで無制限でしたが、それ以降のデフォルト値は1日（86400）です。
        例えば、binlog ttl secondsを1時間保持するように変更する場合：`ALTER TABLE table SET ("binlog.ttl_seconds"="3600")`。
- CCRの正確性はターゲットクラスタのトランザクション状態にも依存するため、同期中にトランザクションが早期に回収されないように以下の設定を増やす必要があります：
    - `label_num_threshold`：TXN Labelの数を制御するために使用。
    - `stream_load_default_timeout_second`：TXNタイムアウト期間を制御するために使用。
    - `label_keep_max_second`：TXN終了後の保持時間を制御するために使用。
    - `streaming_label_keep_max_second`：上記と同様。
- データベース同期で、ソースクラスタが大量のタブレットを持つ場合、結果として生成されるCCRジョブが非常に大きくなる可能性があり、いくつかのFE設定の変更が必要です：
    - `max_backup_tablets_per_job`：
        単一のbackupジョブに関与するタブレットの上限。タブレット数に基づいて調整する必要があります（デフォルト値は300,000。タブレットが多すぎるとFE OOMのリスクがあるため、優先的にタブレット数を削減）。
    - `thrift_max_message_size`：
        FE thriftサーバーが許可する最大単一RPCパケットサイズ。デフォルトは100MBです。タブレット数が多すぎてスナップショット情報サイズが100MBを超える場合、この制限を調整する必要があり、最大2GBまで可能です。
        - スナップショット情報サイズは、ccr syncerログで確認でき、キーワードは：`snapshot response meta size: %d, job info size: %d`。スナップショット情報サイズは約meta size + job info sizeです。
    - `fe_thrift_max_pkg_bytes`：
        上記と同様、バージョン2.0で調整が必要な追加パラメータで、デフォルト値は20MBです。
    - `restore_download_job_num_per_be`：
        各BEに送信されるダウンロードジョブの上限。デフォルトは3で、restoreジョブには小さすぎるため、0に調整（つまりこの制限を無効化）する必要があります。この設定はバージョン2.1.8と3.0.4以降では不要になりました。
    - `backup_upload_job_num_per_be`：
        各BEに送信されるアップロードジョブの上限。デフォルトは3で、backupジョブには小さすぎるため、0に調整（つまりこの制限を無効化）する必要があります。この設定はバージョン2.1.8と3.0.4以降では不要になりました。
    - 上記のFE設定に加えて、CCRジョブのdbタイプがMySQLの場合、いくつかのMySQL設定も調整が必要です：
        - MySQLサーバーは単一のselect/insertで返される/挿入されるデータパケットのサイズを制限します。この制限を緩和するために以下の設定を増やし、例えば上限1GBに調整します：

        ```
        [mysqld]
        max_allowed_packet = 1024MB
        ```
- MySQL クライアントも同様の制限があります。ccr syncer バージョン 2.1.6/2.0.15 以前では、上限は 128MB です。それ以降のバージョンでは、パラメータ `--mysql_max_allowed_packet`（バイト単位）を通じてこれを調整でき、デフォルト値は 1024MB です。
        > 注意：バージョン 2.1.8 および 3.0.4 以降では、ccr syncer はデータベースにスナップショット情報を保存しなくなったため、デフォルトのデータパケットサイズで十分です。
- 同様に、BE 側でもいくつかの設定を変更する必要があります：
    - `thrift_max_message_size`：BE thrift サーバーで許可される単一 RPC パケットの最大サイズ。デフォルトは 100MB です。tablet の数が多すぎて agent job のサイズが 100MB を超える場合、この制限を調整する必要があり、最大は 2GB です。
    - `be_thrift_max_pkg_bytes`：上記と同様で、バージョン 2.0 でのみ調整が必要です。デフォルト値は 20MB です。
- 上記の設定を変更しても、tablet の数がさらに増加し続けると、結果として生成されるスナップショットサイズが 2GB を超える可能性があります。これは Doris FE edit log および RPC メッセージサイズの閾値であり、同期が失敗する原因となります。バージョン 2.1.8 および 3.0.4 以降、Doris はスナップショットを圧縮することで、バックアップと復旧でサポートされる tablet 数をさらに増やすことができます。これは以下のパラメータを通じて有効化できます：
    - `restore_job_compressed_serialization`：復元ジョブの圧縮を有効化します（メタデータ互換性に影響、デフォルトはオフ）。
    - `backup_job_compressed_serialization`：バックアップジョブの圧縮を有効化します（メタデータ互換性に影響、デフォルトはオフ）。
    - `enable_restore_snapshot_rpc_compression`：スナップショット情報の圧縮を有効化し、主に RPC に影響します（デフォルトはオン）。
    > 注意：バックアップ/復元ジョブが圧縮されているかどうかを識別するには追加のコードが必要で、バージョン 2.1.8 および 3.0.4 以前のコードには関連コードが含まれていないため、バックアップ/復元ジョブが生成されると、以前の Doris バージョンに戻すことはできません。2つの例外があります：すでにキャンセルまたは完了したバックアップ/復元ジョブは圧縮されないため、バックアップ/復元ジョブの完了を待つか、戻す前にジョブを積極的にキャンセルすることで安全なロールバックを保証できます。
- CCR は内部的に一部の内部ジョブのラベルとして db/table 名を使用するため、CCR ジョブが制限を超えるラベルに遭遇した場合、FE パラメータ `label_regex_length` を調整してこの制限を緩和できます（デフォルト値は 128）。
- バックアップは現在 cooldown tablet を持つテーブルのバックアップをサポートしていないため、これに遭遇すると同期が停止します。そのため、CCR ジョブを作成する前に、`storage_policy` プロパティが設定されたテーブルがないかどうかを確認する必要があります。
### パフォーマンス関連パラメータ
- ユーザーのデータ量が非常に大きい場合、バックアップと復旧の完了に必要な時間が1日（デフォルト値）を超える可能性があるため、以下のパラメータを必要に応じて調整する必要があります：
    - `backup_job_default_timeout_ms`：バックアップ/復元ジョブのタイムアウト時間。ソースクラスターとターゲットクラスターの両方の FE でこれを設定する必要があります。
    - 上流で binlog 保持時間を変更する：`ALTER DATABASE $db SET PROPERTIES ("binlog.ttl_seconds" = "xxxx")`。
- 下流 BE のダウンロード速度が遅い場合：
    - `max_download_speed_kbps`：単一下流 BE における単一ダウンロードスレッドのダウンロード速度制限、デフォルトは 50MB/s です。
    - `download_worker_count`：下流でダウンロードジョブを実行するスレッド数。顧客のマシンタイプに基づいて調整し、通常の読み書き操作に影響を与えずに最大化する必要があります。このパラメータを調整した場合、`max_download_speed_kbps` を調整する必要はありません。
        - 例えば、顧客のマシンのネットワークカードが最大 1GB の帯域幅を提供し、許可される最大ダウンロードスレッドが 200MB の帯域幅を使用する場合、`max_download_speed_kbps` を変更せずに、`download_worker_count` を 4 に設定する必要があります。
- 下流 BE からの binlog のダウンロード速度を制限する：
    BE 側設定パラメータ：

    ```shell
    download_binlog_rate_limit_kbs=1024 # Limit the speed of a single BE node pulling Binlog (including Local Snapshot) from the source cluster to 1 MB/s.
    ```
詳細なパラメータと説明:
    1. `download_binlog_rate_limit_kbs`パラメータはソースクラスターのBEノードで設定され、このパラメータを設定することで、データ取得速度を効果的に制限できます。
    2. `download_binlog_rate_limit_kbs`パラメータは主に単一のBEノードの速度を設定するために使用されます。クラスター全体の速度を計算するには、パラメータ値にクラスター内のノード数を掛ける必要があります。
