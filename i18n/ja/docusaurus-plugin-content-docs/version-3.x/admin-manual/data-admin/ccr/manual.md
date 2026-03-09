---
{
  "title": "操作マニュアル",
  "language": "ja",
  "description": "Syncerが同期を行う際、ユーザーはupstreamとdownstream両方のアカウントを提供する必要があり、これらは以下の権限を持つ必要があります："
}
---
## 使用要件

### ネットワーク要件

- Syncerは上流と下流の両方のFEおよびBEと通信できる必要があります。
- 下流のBEは、Doris BEプロセスで使用されるIPに直接アクセスできる必要があります（`show frontends/backends`で確認できます）。

### 権限要件

Syncerが同期する際、ユーザーは上流と下流の両方のアカウントを提供する必要があり、これらは以下の権限を持つ必要があります：

- Select_priv: データベースとテーブルの読み取り専用権限。
- Load_priv: データベースとテーブルの書き込み権限（Load、Insert、Deleteなどを含む）。
- Alter_priv: データベースとテーブルの変更権限（データベース/テーブルの名前変更、列の追加/削除/変更、パーティションの追加/削除などを含む）。
- Create_priv: データベース、テーブル、ビューの作成権限。
- Drop_priv: データベース、テーブル、ビューの削除権限。
- Admin権限（後に削除を検討）、enable binlog configの確認に使用されます。

### バージョン要件

- Syncerバージョン >= 下流Dorisバージョン >= 上流Dorisバージョン。そのため、まずSyncerをアップグレードし、次に下流のDoris、最後に上流のDorisをアップグレードしてください。
- Doris 2.0の最小バージョンは2.0.15、Doris 2.1の最小バージョンは2.1.6です。
- Syncerバージョン2.1.8および3.0.4以降、SyncerはDoris 2.0をサポートしなくなりました。

### 設定とプロパティ要件

**プロパティ要件**
- `light_schema_change`: Syncerでは上流と下流の両方のテーブルで`light_schema_table`プロパティを設定する必要があります。そうでない場合、データ同期エラーが発生する可能性があります。注意：最新バージョンのDorisでは、テーブル作成時にデフォルトで`light_schema_change`プロパティが設定されます。Dorisバージョン1.1以前を使用している場合、またはそこからアップグレードした場合は、Syncer同期を有効にする前に、既存のOLAPテーブルに`light_schema_change`プロパティを設定する必要があります。

**設定要件**
- `restore_reset_index_id`: 同期対象のテーブルに転置インデックスがある場合、ターゲットクラスタで`false`として設定する必要があります。
- `ignore_backup_tmp_partitions`: 上流がtmpパーティションを作成した場合、Dorisはバックアップを禁止し、Syncer同期が中断される原因となります。FEで`ignore_backup_tmp_partitions=true`を設定することで、この問題を回避できます。

## データベース内のすべてのテーブルでbinlogを有効化

```shell
bash bin/enable_db_binlog.sh -h host -p port -u user -P password -d db
```
## Syncerを開始する

環境変数${SYNCER_HOME}がSyncerの作業ディレクトリに設定されていることを前提として、`bin/start_syncer.sh`を使用してSyncerを開始できます。

| **オプション** | **説明** | **コマンド例** | **デフォルト値** |
|------------|-----------------|---------------------|--------------------|
| `--daemon` | Syncerをバックグラウンドで実行する | `bin/start_syncer.sh --daemon` | `false` |
| `--db_type` | Syncerはメタデータを格納するために2種類のデータベースを使用できます：`sqlite3`（ローカルストレージ）と`mysql`（ローカルまたはリモートストレージ）。メタデータの格納に`mysql`を使用する場合、Syncerは`CREATE IF NOT EXISTS`を使用して`ccr`という名前のデータベースを作成し、メタデータテーブルはそこに格納されます。 | `bin/start_syncer.sh --db_type mysql` | `sqlite3` |
| `--db_dir` | **`sqlite3`使用時のみ有効**；SQLite3で生成されるデータベースファイルのファイル名とパスを指定します。 | `bin/start_syncer.sh --db_dir /path/to/ccr.db` | `SYNCER_HOME/db/ccr.db` |
| `--db_host`<br>`--db_port`<br>`--db_user`<br>`--db_password` | **`mysql`使用時のみ有効**；MySQLのホスト、ポート、ユーザー、パスワードを設定するために使用します。 | `bin/start_syncer.sh --db_host 127.0.0.1 --db_port 3306 --db_user root --db_password "qwe123456"` | `db_host`と`db_port`はサンプル値がデフォルト；`db_user`と`db_password`は空がデフォルト。 |
| `--log_dir` | ログ出力パスを指定する | `bin/start_syncer.sh --log_dir /path/to/ccr_syncer.log` | `SYNCER_HOME/log/ccr_syncer.log` |
| `--log_level` | ログ出力レベルを指定する；ログ形式は次のとおりです：`time level msg hooks`。バックグラウンドで実行する場合のデフォルト値は`info`；フォアグラウンドで実行する場合、デフォルト値は`trace`で、ログは`tee`を使用して`log_dir`に保存されます。 | `bin/start_syncer.sh --log_level info` | `info`（バックグラウンド）<br>`trace`（フォアグラウンド） |
| `--host`<br>`--port` | Syncerの`host`と`port`を指定する。`host`はクラスタ内のSyncerインスタンスを区別するために使用され、Syncerの名前として理解できます；クラスタ内のSyncerの命名形式は`host:port`です。 | `bin/start_syncer.sh --host 127.0.0.1 --port 9190` | `host`は`127.0.0.1`がデフォルト<br>`port`は`9190`がデフォルト |
| `--pid_dir` | PIDファイルを保存するパスを指定する。PIDファイルは`stop_syncer.sh`スクリプトがSyncerを停止するための認証情報で、対応するSyncerのプロセス番号を保存します。クラスタ管理を容易にするため、パスをカスタマイズできます。 | `bin/start_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |

## Syncerを停止する

`bin/stop_syncer.sh`を使用して3つの方法でSyncerを停止できます：

| **方法/オプション** | **説明** | **コマンド例** | **デフォルト値** |
|-------------------|-----------------|---------------------|--------------------|
| **方法1** 単一のSyncerを停止 | 停止するSyncerの`host`と`port`を指定する；開始時に使用した`host`と一致する必要があることに注意してください。 | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | なし |
| **方法2** Syncerをバッチ停止 | 停止するPIDファイル名をスペースで区切って指定し、`"`で囲みます。 | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | なし |
| **方法3** すべてのSyncerを停止 | デフォルトでは、`pid_dir`パス内のPIDファイルに対応するすべてのSyncerを停止します。 | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | なし |

方法3のオプション：

| **オプション** | **説明** | **コマンド例** | **デフォルト値** |
|------------|-----------------|---------------------|--------------------|
| `--pid_dir` | PIDファイルが配置されているディレクトリを指定する；3つのすべての停止方法は、実行するためにこのオプションに依存します。 | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |
| `--host`<br>`--port` | `pid_dir`パス内の`host:port`に対応するSyncerを停止する。`host`のみが指定されている場合、**方法3**に格下げされます；`host`と`port`の両方が空でない場合、**方法1**として有効になります。 | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | `host`: 127.0.0.1<br>`port`: 空 |
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
- name: CCR同期ジョブの名前。一意である必要があります。

- host、port: クラスターマスターのhostとMySQL（jdbc）のportに対応します。

- thrift_port: FEのrpc_portに対応します。

- user、password: Syncerがトランザクションを開始し、データをプルする際の認証情報。

- database、table:

  - データベースレベルの同期の場合、dbNameを入力し、tableNameは空のままにします。

  - テーブルレベルの同期の場合、dbNameとtableNameの両方を入力します。

### 同期進捗の確認

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/get_lag
```
job_nameはcreate_ccr実行時に作成される名前です。

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
### ジョブリストを取得

```shell
curl http://ccr_syncer_host:ccr_syncer_port/list_jobs

{"success":true,"jobs":["ccr_db_table_alias"]}
```
## Syncer 高可用性

Syncer 高可用性は MySQL に依存しています。MySQL をバックエンドストレージとして使用する場合、Syncer は他の Syncer を発見できます。1つがクラッシュした場合、他の Syncer がそのジョブを引き継ぎます。

## アップグレード

### 1. Syncer のアップグレード
以下の環境変数が設定されていることを前提とします：
- ${SYNCER_HOME}: Syncer の作業ディレクトリ。
- ${SYNCER_PACKAGE_DIR}: 新しい Syncer を含むディレクトリ。

以下の手順に従って、すべての Syncer をアップグレードします。

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
1.4. 新しいpackageをデプロイする

```shell
cp ${SYNCER_PACKAGE_DIR}/bin ${SYNCER_HOME}/bin
```
1.5. 新しいSyncerを起動する

1.1で保存されたコマンドを使用して新しいSyncerを起動します。

### 2. ダウンストリームDorisのアップグレード（必要な場合）

[Upgrade Doris](../../../admin-manual/cluster-management/upgrade.md)ガイドの手順に従って、アップストリームシステムをアップグレードします。

### 3. アップストリームDorisのアップグレード（必要な場合）

[Upgrade Doris](../../../admin-manual/cluster-management/upgrade.md)ガイドの手順に従って、アップストリームシステムをアップグレードします。

## 使用上の注意

:::caution

`is_being_synced`属性は通常の状況ではSyncerによって完全に制御され、オン/オフが切り替えられるべきです。ユーザーはこの属性を自分で変更してはいけません。

:::

### 重要な注意事項

- CCR同期中、backup/restoreジョブとbinlogはすべてFEメモリ内にあるため、FEの各CCRジョブに対して少なくとも4GB以上のヒープメモリを割り当てることを推奨します（ソースクラスタとターゲットクラスタの両方）。また、無関係なジョブのメモリ消費を削減するために以下の設定を変更してください：
    - FE設定`max_backup_restore_job_num_per_db`を変更する：
        メモリ内の各DBのbackup/restoreジョブ数を記録します。デフォルト値は10ですが、2に設定すれば十分です。
    - ソースクラスタのdb/tableプロパティを変更してbinlog保持制限を設定する：
        - `binlog.max_bytes`：binlogが占有する最大メモリ。少なくとも4GBを保持することを推奨します（デフォルトは無制限）。
        - `binlog.ttl_seconds`：binlog保持時間。バージョン2.0.5以前はデフォルトが無制限、それ以降はデフォルト値が1日（86400）です。
        例えば、binlog ttl secondsを1時間保持するように変更するには：`ALTER TABLE table SET ("binlog.ttl_seconds"="3600")`。
- CCRの正確性はターゲットクラスタのトランザクション状態にも依存するため、同期中にトランザクションが早期に回収されないようにする必要があります。以下の設定を増加させる必要があります：
    - `label_num_threshold`：TXN Labelの数を制御するために使用されます。
    - `stream_load_default_timeout_second`：TXNタイムアウト時間を制御するために使用されます。
    - `label_keep_max_second`：TXN終了後の保持時間を制御するために使用されます。
    - `streaming_label_keep_max_second`：上記と同じ。
- データベース同期で、ソースクラスタに大量のtabletがある場合、結果として生じるCCRジョブが非常に大きくなる可能性があり、いくつかのFE設定を変更する必要があります：
    - `max_backup_tablets_per_job`：
        単一のbackupジョブに関与するtabletの上限。tabletの数に基づいて調整する必要があります（デフォルト値は300,000。tabletが多すぎるとFE OOMのリスクがあるため、tabletの数を減らすことを優先してください）。
    - `thrift_max_message_size`：
        FE thriftサーバーが許可する単一RPCパケットの最大サイズ。デフォルトは100MBです。tabletの数が多すぎてsnapshot infoサイズが100MBを超える場合、この制限を調整する必要があり、最大2GBまで設定できます。
        - snapshot infoサイズはccr syncerログで確認でき、キーワードは：`snapshot response meta size: %d, job info size: %d`。snapshot infoサイズはおおよそmeta size + job info sizeです。
    - `fe_thrift_max_pkg_bytes`：
        上記と同じく、バージョン2.0で調整が必要な追加パラメータ。デフォルト値は20MBです。
    - `restore_download_job_num_per_be`：
        各BEに送信されるdownloadジョブの上限。デフォルトは3で、restoreジョブには小さすぎるため、0に調整する必要があります（つまり、この制限を無効にする）。この設定はバージョン2.1.8および3.0.4以降では不要です。
    - `backup_upload_job_num_per_be`：
        各BEに送信されるuploadジョブの上限。デフォルトは3で、backupジョブには小さすぎるため、0に調整する必要があります（つまり、この制限を無効にする）。この設定はバージョン2.1.8および3.0.4以降では不要です。
    - 上記のFE設定に加えて、CCRジョブのdbタイプがMySQLの場合、一部のMySQL設定も調整する必要があります：
        - MySQLサーバーは、単一のselect/insertで返される/挿入されるデータパケットのサイズを制限します。この制限を緩和するために以下の設定を増加させてください。例えば、上限を1GBに調整する：

        ```
        [mysqld]
        max_allowed_packet = 1024MB
        ```
- MySQLクライアントも同様にこの制限を受けます。ccr syncerバージョン2.1.6/2.0.15以前では、上限は128MBです。それ以降のバージョンでは、パラメータ`--mysql_max_allowed_packet`（バイト単位）でこれを調整でき、デフォルト値は1024MBです。
        > 注意: バージョン2.1.8および3.0.4以降では、ccr syncerはデータベースにsnapshot infoを保存しなくなったため、デフォルトのデータパケットサイズで十分です。
- 同様に、BE側でも複数の設定を変更する必要があります：
    - `thrift_max_message_size`: BE thriftサーバーが許可する最大単一RPCパケットサイズ。デフォルトは100MBです。tabletの数が多すぎてagent jobのサイズが100MBを超える場合、この制限を調整する必要があり、最大2GBまで設定できます。
    - `be_thrift_max_pkg_bytes`: 上記と同様で、バージョン2.0でのみ調整が必要です。デフォルト値は20MBです。
- 上記の設定を変更しても、tabletの数が増加し続けると、生成されるsnapshotサイズが2GBを超える可能性があります。これはDoris FEのedit logとRPCメッセージサイズの閾値であり、同期が失敗する原因となります。バージョン2.1.8および3.0.4以降では、Dorisはsnapshotを圧縮することで、バックアップとリカバリでサポートするtabletの数をさらに増やすことができます。これは以下のパラメータで有効にできます：
    - `restore_job_compressed_serialization`: restore jobの圧縮を有効にします（メタデータの互換性に影響し、デフォルトはオフです）。
    - `backup_job_compressed_serialization`: backup jobの圧縮を有効にします（メタデータの互換性に影響し、デフォルトはオフです）。
    - `enable_restore_snapshot_rpc_compression`: snapshot infoの圧縮を有効にし、主にRPCに影響します（デフォルトはオンです）。
    > 注意: backup/restore jobが圧縮されているかどうかを識別するには追加のコードが必要で、バージョン2.1.8および3.0.4以前のコードには関連するコードが含まれていないため、一度backup/restore jobが生成されると、以前のDorisバージョンに戻すことはできません。2つの例外があります：すでにキャンセルまたは完了したbackup/restore jobは圧縮されないため、バージョンを戻す前にbackup/restore jobの完了を待つか、積極的にjobをキャンセルすることで安全なロールバックを保証できます。
- CCRは内部で一部の内部jobのラベルとしてdb/table名を使用するため、CCR jobがlabelの制限を超えた場合は、FEパラメータ`label_regex_length`を調整してこの制限を緩和できます（デフォルト値は128です）。
- backupは現在cooldown tabletを持つテーブルのバックアップをサポートしていないため、これに遭遇すると同期が終了します。そのため、CCR jobを作成する前に、どのテーブルにも`storage_policy`プロパティが設定されていないかを確認する必要があります。
### パフォーマンス関連パラメータ
- ユーザーのデータ量が非常に大きい場合、バックアップとリカバリの完了に要する時間が1日（デフォルト値）を超える可能性があるため、必要に応じて以下のパラメータを調整する必要があります：
    - `backup_job_default_timeout_ms`: backup/restore jobのタイムアウト時間。ソースとターゲット両方のクラスターのFEでこれを設定する必要があります。
    - 上流でbinlog保持時間を変更：`ALTER DATABASE $db SET PROPERTIES ("binlog.ttl_seconds" = "xxxx")`。
- 下流BEのダウンロード速度が遅い場合：
    - `max_download_speed_kbps`: 単一の下流BE内の単一ダウンロードスレッドのダウンロード速度制限、デフォルトは50MB/sです。
    - `download_worker_count`: 下流でダウンロードjobを実行するスレッド数。顧客のマシンタイプに基づいて調整し、通常の読み書き操作に影響を与えない範囲で最大化する必要があります。このパラメータを調整する場合、`max_download_speed_kbps`を調整する必要はありません。
        - 例えば、顧客のマシンのネットワークカードが最大1GBの帯域幅を提供し、最大許可ダウンロードスレッドが200MBの帯域幅を利用する場合、`max_download_speed_kbps`を変更せずに、`download_worker_count`を4に設定する必要があります。
- 下流BEからのbinlogダウンロード速度を制限：
    BE側設定パラメータ：

    ```shell
    download_binlog_rate_limit_kbs=1024 # Limit the speed of a single BE node pulling Binlog (including Local Snapshot) from the source cluster to 1 MB/s.
    ```
詳細なパラメータと説明:
    1. `download_binlog_rate_limit_kbs`パラメータはソースクラスターのBEノードで設定され、このパラメータを設定することで、データの取得速度を効果的に制限することができます。
    2. `download_binlog_rate_limit_kbs`パラメータは主に単一のBEノードの速度を設定するために使用されます。クラスター全体の速度を計算するには、パラメータ値にクラスター内のノード数を掛ける必要があります。
