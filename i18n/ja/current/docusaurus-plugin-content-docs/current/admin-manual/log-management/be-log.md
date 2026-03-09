---
{
  "title": "BEログ管理",
  "language": "ja",
  "description": "この文書では、主にBackend（BE）プロセスのログ管理について紹介します。"
}
---
このドキュメントでは、主にBackend (BE)プロセスのログ管理について説明します。

このドキュメントはDorisバージョン2.1.4以降に適用されます。

## ログカテゴリ

`sh bin/start_be.sh --daemon`を使用してBEプロセスを開始すると、BEログディレクトリに以下の種類のログファイルが生成されます：

- be.INFO

  BEプロセス実行ログ。BEのメインログファイルです。すべてのレベルのBEプロセス実行ログ（DEBUG、INFO、WARN、ERRORなど）がこのログファイルに出力されます。

  このファイルは現在の最新BE実行ログファイルを指すシンボリックリンクであることに注意してください。

- be.WARNING

  BEプロセス実行ログ。ただし、WARNレベル以上の実行ログのみが出力されます。be.WARNINGの内容はbe.INFOログ内容のサブセットです。主に警告またはエラーレベルのログを素早く確認するために使用されます。

  このファイルは現在の最新BE警告ログファイルを指すシンボリックリンクであることに注意してください。

- be.out

  標準出力ストリームとエラーデータストリームを受信するために使用されます。例えば、開始スクリプトの`echo`コマンドからの出力、またはglogフレームワークでキャプチャされない他のログ情報です。通常、実行ログの補完として使用されます。

  通常、BEクラッシュが発生した場合、例外のスタックトレースを取得するためにこのログを確認する必要があります。

- jni.log

  BEプロセスがJNIを介してJavaプログラムを呼び出す際にJavaプログラムによって出力されるログ。

  TODO：将来のバージョンでは、このログ部分はbe.INFOログに統合される予定です。

- be.gc.log

  BE JVMのGCログ。このログの動作は、be.confの`JAVA_OPTS`JVM起動オプションによって制御されます。

## ログ設定

ログの保存パス、保持時間、保持数、サイズなどの設定が含まれます。

以下の設定項目は`be.conf`ファイルで設定されます。

| 設定項目 | デフォルト値 | オプション | 説明 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` |  | すべてのログの保存パス。デフォルトでは、BE配置パス下の`log/`ディレクトリです。これは環境変数であり、設定名は大文字である必要があることに注意してください。 |
| `sys_log_level` | `INFO` | `INFO`, `WARNING`, `ERROR`, `FATAL` | `be.INFO`のログレベル。デフォルトはINFOです。INFOレベルには多くの重要なログ情報が含まれているため、変更は推奨されません。 |
| `sys_log_roll_num` | 10 |  | `be.INFO`と`be.WARNING`の最大ファイル数を制御します。デフォルトは10です。ログローテーションまたは分割によりログファイル数がこのしきい値を超えた場合、古いログファイルが削除されます。 |
| `sys_log_verbose_modules`| | | 特定のコードディレクトリでDEBUGレベルログを有効にするように設定できます。詳細は「DEBUGログを有効にする」セクションを参照してください。 |
| `sys_log_verbose_level`| | | 詳細は「DEBUGログを有効にする」セクションを参照してください。 |
| `sys_log_verbose_flags_v`| | | 詳細は「DEBUGログを有効にする」セクションを参照してください。 |
| `sys_log_roll_mode` | `SIZE-MB-1024` | `TIME-DAY`, `TIME-HOUR`, `SIZE-MB-nnn` | `be.INFO`と`be.WARNING`ログのローテーション戦略。デフォルトは`SIZE-MB-1024`で、各ログが1024MBのサイズに達した後に新しいログファイルが生成されることを意味します。日単位や時間単位でローテーションするよう設定することもできます。 |
| `log_buffer_level` | 空 | 空または`-1` | BEログ出力モード。デフォルトでは、BEログは非同期でディスクログファイルにフラッシュされます。-1に設定すると、ログ内容がリアルタイムでフラッシュされます。リアルタイムフラッシュはログパフォーマンスに影響しますが、可能な限り最新のログを保持できます。これにより、BEクラッシュが発生した場合に最後のログ情報を確認することができます。 |
| `disable_compaction_trace_log` | true | true, false | デフォルトはtrueで、compaction操作のトレースログが無効になっています。falseに設定すると、トラブルシューティングのためにCompaction操作関連のトレースログが出力されます。 |
| `aws_log_level` | 0 | | AWS SDKのログレベルを制御します。デフォルトは0で、AWS SDKログがオフになっていることを示します。デフォルトでは、AWS SDKログはglogによって積極的にキャプチャされ、通常通り出力されます。場合によっては、キャプチャされないログをより多く確認するためにAWS SDKログを有効にする必要があります。異なる数字は異なるログレベルを表します：Off = 0、Fatal = 1、Error = 2、Warn = 3、Info = 4、Debug = 5、Trace = 6。 |
| `s3_file_writer_log_interval_second` | 60 | | S3アップロード操作を実行する際、デフォルトで60秒ごとに操作の進捗が出力されます。 |
| `enable_debug_log_timeout_secs` | 0 | | 値が0より大きい場合、パイプライン実行エンジンの詳細な実行ログが出力されます。主にトラブルシューティングに使用されます。デフォルトでは、これはオフになっています。 |
| `sys_log_enable_custom_date_time_format` | false | | ログでカスタム日付形式を許可するかどうか（バージョン2.1.7以降でサポート） |
| `sys_log_custom_date_time_format` | `%Y-%m-%d %H:%M:%S` | | ログ日付のデフォルトカスタム形式で、`sys_log_enable_custom_date_time_forma`が`true`の場合のみ有効（バージョン2.1.7以降でサポート） |
| `sys_log_custom_date_time_ms_format` | `,{:03d}` | | ログ日付のデフォルト時刻精度。これは`sys_log_enable_custom_date_time_format`が`true`の場合のみ有効（バージョン2.1.7以降でサポート） |


## DEBUGログを有効にする

### 静的設定

`be.conf`で`sys_log_verbose_modules`と`sys_log_verbose_level`を設定します：

```text
sys_log_verbose_modules=plan_fragment_executor,olap_scan_node
sys_log_verbose_level=3
```
`sys_log_verbose_modules` は開くファイル名を指定し、ワイルドカード `*` で指定できます。例：

```text
sys_log_verbose_modules=*
```
全てのBEの詳細ログを有効にします。

`sys_log_verbose_level` DEBUGのレベルを示します。数値が大きいほど、より詳細なDEBUGログが出力されます。値の範囲は1から10です。

ほとんどの状況では、`be.conf`で`sys_log_verbose_modules`と`sys_log_verbose_level`を設定するだけで十分です。
デバッグログが期待通りに表示されない場合など、まれなケースでのみ、モジュールスコープに制限されない`sys_log_verbose_flags_v`も設定する必要があります。

`sys_log_verbose_flags_v`はglogの`FLAGS_v`であり、`VLOG(n)`ログの全体的な詳細レベルを制御します。`n <= FLAGS_v`のメッセージが出力され、ログ出力の詳細度をきめ細かく制御できます。

### 動的変更

2.1以降、BEのDEBUGログは以下のRESTful APIを使用して動的変更をサポートしています：

```bash
curl -X POST "http://<be_host>:<webport>/api/glog/adjust?module=<module_name>&level=<level_number>"
```
動的調整方法はワイルドカードもサポートします。例えば、`module=*&level=10`を使用すると、すべてのBE vlogが有効になりますが、ワイルドカードは個々のモジュール名に関連付けられません。例えば、`moduleA`のvlogレベルを`10`に調整した後、`module=*&level=-1`を使用しても、`moduleA`のvlogは**オフになりません**。

注意: 動的に調整された設定は永続化されず、BEの再起動後に期限切れになります。

さらに、GLOGは、方法に関係なく、モジュールが存在しない場合（実際の効果はなし）に対応するログモジュールを作成し、エラーを返しません。

## コンテナ環境ログ設定

場合によっては、FEプロセスがコンテナ環境（k8sなど）を通じてデプロイされます。すべてのログは、ファイルではなく標準出力ストリームを通じて出力する必要があります。

この場合、`sh bin/start_be.sh --console`コマンドを使用してBEプロセスをフォアグラウンドで開始し、すべてのログを標準出力ストリームに出力できます。

同じ標準出力ストリーム内で異なるタイプのログを区別するために、各ログの前に異なるプレフィックスが追加されます。例えば:

```
RuntimeLogger W20240624 00:36:46.325274 1460943 olap_server.cpp:710] Have not get FE Master heartbeat yet
RuntimeLogger I20240624 00:36:46.325999 1459644 olap_server.cpp:208] tablet checkpoint tasks producer thread started
RuntimeLogger I20240624 00:36:46.326066 1460954 olap_server.cpp:448] begin to produce tablet meta checkpoint tasks.
RuntimeLogger I20240624 00:36:46.326093 1459644 olap_server.cpp:213] tablet path check thread started
RuntimeLogger I20240624 00:36:46.326190 1459644 olap_server.cpp:219] cache clean thread started
RuntimeLogger I20240624 00:36:46.326336 1459644 olap_server.cpp:231] path gc threads started. number:1
RuntimeLogger I20240624 00:36:46.326643 1460958 olap_server.cpp:424] try to start path gc thread!
```
異なるプレフィックスの意味は以下の通りです：

- `RuntimeLogger`: `be.log`内のログに対応します。

> `jni.log`のサポートは将来のバージョンで追加される予定です。

さらに、コンテナ環境用の追加設定パラメータがあります：

| 設定項目 | デフォルト値 | オプション | 説明 |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false | ファイルログを有効にするかどうか。デフォルトは`true`です。`--console`コマンドでBEプロセスを開始すると、ログは標準出力ストリームと通常のログファイルの両方に出力されます。`false`に設定すると、ログは標準出力ストリームのみに出力され、ログファイルは生成されません。 |
