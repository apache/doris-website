---
{
  "title": "FEログ管理",
  "language": "ja",
  "description": "この文書は主にフロントエンド（FE）プロセスのログ管理について紹介します。"
}
---
このドキュメントでは主にFrontend（FE）プロセスのログ管理について紹介します。

このドキュメントはDorisバージョン2.1.4以降に適用されます。

## ログカテゴリ

`sh bin/start_fe.sh --daemon`を使用してFEプロセスを開始すると、FEログディレクトリに以下のタイプのログファイルが生成されます：

- fe.log

  FEプロセス実行ログ。FEのメインログファイルです。FEプロセスのすべてのレベルのログ（DEBUG、INFO、WARN、ERRORなど）がこのログファイルに出力されます。

- fe.warn.log

  FEプロセス実行ログ。WARNレベル以上のログのみを出力します。fe.warn.logの内容はfe.logログ内容のサブセットです。主に警告やエラーレベルのログを迅速に確認するために使用されます。

- fe.audit.log

  監査ログ。このFEノードを通じて実行されたすべてのデータベース操作記録を記録するために使用されます。これにはSQL、DDL、DMLステートメントなどが含まれます。

- fe.out

  標準出力ストリームとエラーデータストリームのログを受信するために使用されます。例えば、起動スクリプト内の`echo`コマンドの出力や、log4jフレームワークによってキャプチャされない他のログ情報などです。通常、実行ログの補完として機能します。稀なケースでは、詳細情報を得るためにfe.outの内容を確認する必要がある場合があります。

- fe.gc.log

  FE JVMのGCログ。このログの動作はfe.conf内のJVM起動オプション`JAVA_OPTS`によって制御されます。

## ログ設定

ログの保存パス、保持時間、保持数、サイズなどの設定が含まれます。

以下の設定項目は`fe.conf`ファイルで設定されます。

| 設定項目 | デフォルト値 | オプション | 説明 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` |  | すべてのログの保存パス。デフォルトでは、FEデプロイメントパス下の`log/`ディレクトリです。これは環境変数であることに注意し、設定名は大文字である必要があります。 |
| `sys_log_level` | `INFO` | `INFO`, `WARN`, `ERROR`, `FATAL` | `fe.log`のログレベル。デフォルトはINFOです。INFOレベルには多くの重要なログ情報が含まれているため、変更は推奨されません。 |
| `sys_log_roll_num` | 10 |  | 1日の`fe.log`と`fe.warn.log`の最大ファイル数を制御します。デフォルトは10です。ログローリングや分割によりログファイル数がこの閾値を超える場合、古いログファイルが削除されます。 |
| `sys_log_verbose_modules` |  |  | 特定のJavaパッケージファイルにDEBUGレベルログを有効にするよう設定できます。詳細は「DEBUGログの有効化」セクションを参照してください。 |
| `sys_log_enable_compress` | false | true, false | 履歴`fe.log`と`fe.warn.log`ログの圧縮を有効にするかどうか。デフォルトはオフです。有効にすると、履歴監査ログがgzip圧縮を使用してアーカイブされます。 |
| `log_rollover_strategy` | `age` | `age`, `size` | ログ保持戦略。デフォルトは`age`で、時間に基づいて履歴ログを保持します。`size`はログサイズに基づいて履歴ログを保持します。 |
| `sys_log_delete_age` | 7d | 7d、10h、60m、120sなどの形式をサポート | `log_rollover_strategy`が`age`の場合のみ有効。`fe.log`と`fe.warn.log`ファイルの保持日数を制御します。デフォルトは7日です。7日を超えたログは自動的に削除されます。 |
| `audit_log_delete_age` | 30d | 7d、10h、60m、120sなどの形式をサポート | `log_rollover_strategy`が`age`の場合のみ有効。`fe.audit.log`ファイルの保持日数を制御します。デフォルトは30日です。30日を超えたログは自動的に削除されます。 |
| `info_sys_accumulated_file_size` | 4 |  | `log_rollover_strategy`が`size`の場合のみ有効。`fe.log`ファイルの累積サイズを制御します。デフォルトは4GBです。累積ログサイズがこの閾値を超えると、履歴ログファイルが削除されます。 |
| `warn_sys_accumulated_file_size` | 2 |  | `log_rollover_strategy`が`size`の場合のみ有効。`fe.warn.log`ファイルの累積サイズを制御します。デフォルトは2GBです。累積ログサイズがこの閾値を超えると、履歴ログファイルが削除されます。 |
| `audit_sys_accumulated_file_size` | 4 |  | `log_rollover_strategy`が`size`の場合のみ有効。`fe.audit.log`ファイルの累積サイズを制御します。デフォルトは4GBです。累積ログサイズがこの閾値を超えると、履歴ログファイルが削除されます。 |
| `log_roll_size_mb` | 1024 |  | `fe.log`、`fe.warn.log`、`fe.audit.log`の個別ファイルの最大サイズを制御します。デフォルトは1024MBです。単一のログファイルがこの閾値を超えると、新しいファイルが自動的に作成されます。 |
| `sys_log_roll_interval` | `DAY` | `DAY`, `HOUR` | `fe.log`と`fe.warn.log`のローリング間隔を制御します。デフォルトは1日で、毎日新しいログファイルを生成します。 |
| `audit_log_roll_num` | 90 |  | `fe.audit.log`の最大ファイル数を制御します。デフォルトは90です。ログローリングや分割によりログファイル数がこの閾値を超える場合、古いログファイルが削除されます。 |
| `audit_log_roll_interval` | `DAY` | `DAY`, `HOUR` | `fe.audit.log`のローリング間隔を制御します。デフォルトは1日で、毎日新しいログファイルを生成します。 |
| `audit_log_dir` | `ENV(DORIS_HOME)/log` |  | `fe.audit.log`の個別の保存パスを指定できます。デフォルトはFEデプロイメントパス下の`log/`ディレクトリです。 |
| `audit_log_modules` | `{"slow_query", "query", "load", "stream_load"}` |  | `fe.audit.log`のモジュールタイプ。デフォルトでは低速クエリ、クエリ、ロード、ストリームロードが含まれます。"Query"にはすべてのDDL、DML、SQL操作が含まれます。"Slow query"は`qe_slow_log_ms`閾値を超える操作を指します。"Load"はBroker Loadを指します。"Stream load"はstream load操作を指します。 |
| `qe_slow_log_ms` | 5000 |  | DDL、DML、SQLステートメントの実行時間がこの閾値を超えると、`fe.audit.log`の`slow_query`モジュールに個別に記録されます。デフォルトは5000ミリ秒です。 |
| `sql_digest_generation_threshold_ms` | 5000 |  | sql_digest生成の閾値（ミリ秒）。クエリの応答時間がこの閾値を超えると、`fe.audit.log`にsql_digestが生成されます。デフォルトは5000ミリ秒です。 |
| `audit_log_enable_compress` | false | true, false | 履歴`fe.audit.log`ログの圧縮を有効にするかどうか。デフォルトはオフです。有効にすると、履歴監査ログがgzip圧縮を使用してアーカイブされます。 |
| `sys_log_mode` | `NORMAL` | `NORMAL`, `BRIEF`, `ASYNC` | FEログ出力モード。`NORMAL`はデフォルトの出力モードで、ログ出力は同期的で位置情報を含みます。`ASYNC`はデフォルトのログ出力が非同期で位置情報を含みます。`BRIEF`モードはログを非同期出力しますが位置情報は含みません。3つのログ出力モードのパフォーマンスは順番に向上します。 |

::: note
バージョン3.0.2以降、`sys_log_mode`設定のデフォルト値は`ASYNC`に変更されます。
:::

:::tip
`sys_log_roll_num`は1日の保持ログ数を制御するものであり、総数ではありません。`sys_log_delete_age`と組み合わせて総保持ログ数を決定する必要があります。
`sys_log_roll_num` controls the number of retained logs per day, not the total number. It needs to be combined with `sys_log_delete_age` to determine the total number of retained logs.
:::

## DEBUGログの有効化

FEのDebugレベルログは、設定ファイルの変更またはランタイム中のインターフェースやAPIを通じて有効にできます。

- 設定ファイルによる有効化

   fe.confに設定項目`sys_log_verbose_modules`を追加します。例：

   ```text
   # Only open DEBUG log for "org.apache.doris.catalog.Catalog"
   sys_log_verbose_modules=org.apache.doris.catalog.Catalog
   
   # Open DEBUG log for all classes in "org.apache.doris.catalog"
   sys_log_verbose_modules=org.apache.doris.catalog
   
   # Open DEBUG log for all classes in "org"
   sys_log_verbose_modules=org
   ```
設定項目を追加し、FE ノードを再起動して有効にします。

- FE UI インターフェースを通じて有効化

   UI インターフェースを通じて実行時にログレベルを変更できます。FE ノードの再起動は不要です。ブラウザで FE ノードの http ポート（デフォルトは 8030）を開き、UI インターフェースにログインします。その後、上部ナビゲーションバーの `Log` タブをクリックします。

   ![Enable through FE UI interface](/images/log_manage/fe_web_log1.png)

   Add 入力ボックスで、パッケージ名または特定のクラス名を入力して、対応する Debug ログを開くことができます。例えば、`org.apache.doris.catalog.Catalog` を入力すると、Catalog クラスの Debug ログが開きます：

   ![Enable through FE UI interface](/images/log_manage/fe_web_log2.png)

   Delete 入力ボックスにパッケージ名または特定のクラス名を入力して、対応する Debug ログを閉じることもできます。

   :::note
   ここでの変更は、対応する FE ノードのログレベルにのみ影響します。他の FE ノードのログレベルには影響しません。
   :::

- API を通じた変更

   以下の API を通じて実行時にログレベルを変更することもできます。FE ノードの再起動は不要です。

   ```shell
   curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?add_verbose=org.apache.doris.catalog.Catalog
   ```
usernameとpasswordは、Dorisにログインしたrootまたはadminユーザーです。`add_verbose`パラメータは、Debugログを有効にするパッケージ名またはクラス名を指定します。成功すると、以下を返します：

   ```json
   {
       "msg": "success", 
       "code": 0, 
       "data": {
           "LogConfiguration": {
               "VerboseNames": "org,org.apache.doris.catalog.Catalog", 
               "AuditNames": "slow_query,query,load", 
               "Level": "INFO"
           }
       }, 
       "count": 0
   }
   ```
以下のAPIを使用してDebug logを閉じることもできます：

   ```shell
   curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?del_verbose=org.apache.doris.catalog.Catalog
   ```
`del_verbose`パラメータは、Debugログを無効にするためのパッケージ名またはクラス名を指定します。

## k8s用のログ設定

場合によっては、FEプロセスがコンテナ環境（k8sなど）を通じてデプロイされます。すべてのログは、ファイルではなく標準出力ストリームを通じて出力される必要があります。

この場合、`sh bin/start_fe.sh --console`コマンドを使用してFEプロセスをフォアグラウンドで開始し、すべてのログを標準出力ストリームに出力できます。

同じ標準出力ストリーム内で異なるタイプのログを区別するために、各ログの前に異なるプレフィックスが追加されます。例：

```
RuntimeLogger 2024-06-24 00:05:21,522 INFO (main|1) [DorisFE.start():158] Doris FE starting...
RuntimeLogger 2024-06-24 00:05:21,530 INFO (main|1) [FrontendOptions.analyzePriorityCidrs():194] configured prior_cidrs value: 172.20.32.136/24
RuntimeLogger 2024-06-24 00:05:21,535 INFO (main|1) [FrontendOptions.initAddrUseIp():101] local address: /172.20.32.136.
RuntimeLogger 2024-06-24 00:05:21,740 INFO (main|1) [ConsistencyChecker.initWorkTime():106] consistency checker will work from 23:00 to 23:00
RuntimeLogger 2024-06-24 00:05:21,889 ERROR (main|1) [Util.report():128] SLF4J: Class path contains multiple SLF4J bindings.
```
各プレフィックスの意味は以下の通りです：

- `StdoutLogger`: 標準出力ストリームにログを出力し、`fe.out`の内容に対応します。
- `StderrLogger`: 標準エラーストリームにログを出力し、`fe.out`の内容に対応します。
- `RuntimeLogger`: `fe.log`にログを出力します。
- `AuditLogger`: `fe.audit.log`にログを出力します。
- プレフィックスなし: `fe.gc.log`にログを出力します。

さらに、コンテナ環境用の追加設定パラメータがあります：

| 設定項目 | デフォルト値 | オプション | 説明 |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false  | ファイルログを有効にするかどうか。デフォルトは`true`です。`--console`コマンドでFEプロセスを開始すると、ログは標準出力ストリームと通常のログファイルの両方に出力されます。`false`に設定すると、ログは標準出力ストリームのみに出力され、ログファイルは生成されません。 |
