---
{
  "title": "FEログ管理",
  "language": "ja",
  "description": "この文書は主にフロントエンド（FE）プロセスのログ管理について紹介します。"
}
---
この文書では主にFrontend（FE）プロセスのログ管理について説明します。

この文書はDorisバージョン2.1.4以降に適用されます。

## ログカテゴリ

`sh bin/start_fe.sh --daemon`を使用してFEプロセスを開始すると、FEログディレクトリに以下のタイプのログファイルが生成されます：

- fe.log

  FEプロセス実行ログ。FEのメインログファイルです。FEプロセスのすべてのレベルのログ（DEBUG、INFO、WARN、ERRORなど）がこのログファイルに出力されます。

- fe.warn.log

  FEプロセス実行ログ。WARNレベル以上のログのみを出力します。fe.warn.logの内容はfe.logログ内容のサブセットです。主に警告またはエラーレベルのログを素早く確認するために使用されます。

- fe.audit.log

  監査ログ。このFEノードを通じて実行されたすべてのデータベース操作記録を記録するために使用されます。これにはSQL、DDL、DMLステートメントなどが含まれます。

- fe.out

  標準出力ストリームとエラーデータストリームログを受信するために使用されます。たとえば、開始スクリプト内の`echo`コマンドの出力や、log4jフレームワークによってキャプチャされないその他のログ情報などです。通常、実行ログの補完として機能します。まれに、より多くの情報を得るためにfe.outの内容を確認する必要がある場合があります。

- fe.gc.log

  FE JVMのGCログ。このログの動作はfe.confの`JAVA_OPTS`によるJVM起動オプションで制御されます。

## ログ設定

ログの保存パス、保持時間、保持数、サイズなどの設定が含まれます。

以下の設定項目は`fe.conf`ファイルで設定されます。

| 設定項目 | デフォルト値 | オプション | 説明 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` |  | すべてのログの保存パス。デフォルトではFEデプロイメントパス下の`log/`ディレクトリです。これは環境変数であることに注意してください。設定名は大文字で記述する必要があります。 |
| `sys_log_level` | `INFO` | `INFO`, `WARN`, `ERROR`, `FATAL` | `fe.log`のログレベル。デフォルトはINFOです。INFOレベルには多くの重要なログ情報が含まれているため、変更は推奨されません。 |
| `sys_log_roll_num` | 10 |  | 1日における`fe.log`と`fe.warn.log`の最大ファイル数を制御します。デフォルトは10です。ログのローリングまたは分割によりログファイル数がこの閾値を超えた場合、古いログファイルが削除されます。 |
| `sys_log_verbose_modules` |  |  | 特定のJavaパッケージファイルにDEBUGレベルのログを有効にするために設定できます。詳細は「DEBUGログの有効化」セクションを参照してください。 |
| `sys_log_enable_compress` | false | true, false | 履歴の`fe.log`と`fe.warn.log`ログの圧縮を有効にするかどうか。デフォルトはオフです。有効にすると、履歴監査ログがgzip圧縮を使用してアーカイブされます。 |
| `log_rollover_strategy` | `age` | `age`, `size` | ログ保持戦略。デフォルトは`age`で、時間に基づいて履歴ログを保持します。`size`はログサイズに基づいて履歴ログを保持します。 |
| `sys_log_delete_age` | 7d | 7d、10h、60m、120sなどの形式をサポート | `log_rollover_strategy`が`age`の場合のみ有効です。`fe.log`と`fe.warn.log`ファイルの保持日数を制御します。デフォルトは7日です。7日を超える古いログは自動的に削除されます。 |
| `audit_log_delete_age` | 30d | 7d、10h、60m、120sなどの形式をサポート | `log_rollover_strategy`が`age`の場合のみ有効です。`fe.audit.log`ファイルの保持日数を制御します。デフォルトは30日です。30日を超える古いログは自動的に削除されます。 |
| `info_sys_accumulated_file_size` | 4 |  | `log_rollover_strategy`が`size`の場合のみ有効です。`fe.log`ファイルの累積サイズを制御します。デフォルトは4GBです。累積ログサイズがこの閾値を超えると、履歴ログファイルが削除されます。 |
| `warn_sys_accumulated_file_size` | 2 |  | `log_rollover_strategy`が`size`の場合のみ有効です。`fe.warn.log`ファイルの累積サイズを制御します。デフォルトは2GBです。累積ログサイズがこの閾値を超えると、履歴ログファイルが削除されます。 |
| `audit_sys_accumulated_file_size` | 4 |  | `log_rollover_strategy`が`size`の場合のみ有効です。`fe.audit.log`ファイルの累積サイズを制御します。デフォルトは4GBです。累積ログサイズがこの閾値を超えると、履歴ログファイルが削除されます。 |
| `log_roll_size_mb` | 1024 |  | `fe.log`、`fe.warn.log`、`fe.audit.log`の個別ファイルの最大サイズを制御します。デフォルトは1024MBです。単一のログファイルがこの閾値を超えると、新しいファイルが自動的に作成されます。 |
| `sys_log_roll_interval` | `DAY` | `DAY`, `HOUR` | `fe.log`と`fe.warn.log`のローリング間隔を制御します。デフォルトは1日で、毎日新しいログファイルが生成されます。 |
| `audit_log_roll_num` | 90 |  | `fe.audit.log`の最大ファイル数を制御します。デフォルトは90です。ログのローリングまたは分割によりログファイル数がこの閾値を超えた場合、古いログファイルが削除されます。 |
| `audit_log_roll_interval` | `DAY` | `DAY`, `HOUR` | `fe.audit.log`のローリング間隔を制御します。デフォルトは1日で、毎日新しいログファイルが生成されます。 |
| `audit_log_dir` | `ENV(DORIS_HOME)/log` |  | `fe.audit.log`の個別の保存パスを指定できます。デフォルトはFEデプロイメントパス下の`log/`ディレクトリです。 |
| `audit_log_modules` | `{"slow_query", "query", "load", "stream_load"}` |  | `fe.audit.log`のモジュールタイプ。デフォルトには低速クエリ、クエリ、ロード、ストリームロードが含まれます。「Query」にはすべてのDDL、DML、SQL操作が含まれます。「Slow query」は`qe_slow_log_ms`閾値を超える操作を指します。「Load」はBroker Loadを指します。「Stream load」はstream load操作を指します。 |
| `qe_slow_log_ms` | 5000 |  | DDL、DML、SQLステートメントの実行時間がこの閾値を超えると、`fe.audit.log`の`slow_query`モジュールに個別に記録されます。デフォルトは5000msです。 |
| `audit_log_enable_compress` | false | true, false | 履歴の`fe.audit.log`ログの圧縮を有効にするかどうか。デフォルトはオフです。有効にすると、履歴監査ログがgzip圧縮を使用してアーカイブされます。 |
| `sys_log_mode` | `NORMAL` | `NORMAL`, `BRIEF`, `ASYNC` | FEログ出力モード。`NORMAL`はデフォルトの出力モードで、ログ出力は同期的で位置情報が含まれます。`ASYNC`はデフォルトのログ出力が非同期で位置情報が含まれます。`BRIEF`モードはログ出力が非同期ですが位置情報は含まれません。3つのログ出力モードの性能は順に向上します。 |

::: note
バージョン3.0.2以降、`sys_log_mode`設定のデフォルト値は`AYSNC`に変更されています。
:::

:::tip
`sys_log_roll_num`が制御するのは1日の保持ログ数であり、総数ではありません。`sys_log_delete_age`と組み合わせて総保持ログ数を決定する必要があります。
:::

## DEBUGログの有効化

FEのDebugレベルログは、設定ファイルの修正またはランタイム時のインターフェースやAPIを通じて有効にできます。

- 設定ファイルを通じて有効にする

   fe.confに設定項目`sys_log_verbose_modules`を追加します。例：

   ```text
   # Only open DEBUG log for "org.apache.doris.catalog.Catalog"
   sys_log_verbose_modules=org.apache.doris.catalog.Catalog
   
   # Open DEBUG log for all classes in "org.apache.doris.catalog"
   sys_log_verbose_modules=org.apache.doris.catalog
   
   # Open DEBUG log for all classes in "org"
   sys_log_verbose_modules=org
   ```
設定項目を追加してFEノードを再起動すると有効になります。

- FE UIインターフェース経由で有効化

   UIインターフェース経由でランタイム時にログレベルを変更できます。FEノードの再起動は不要です。ブラウザでFEノードのhttpポート（デフォルトは8030）を開き、UIインターフェースにログインします。その後、上部ナビゲーションバーの`Log`タブをクリックします。

   ![Enable through FE UI interface](/images/log_manage/fe_web_log1.png)

   Add入力ボックスでは、パッケージ名または特定のクラス名を入力して、対応するDebugログを開くことができます。例えば、`org.apache.doris.catalog.Catalog`を入力すると、CatalogクラスのDebugログが開かれます：

   ![Enable through FE UI interface](/images/log_manage/fe_web_log2.png)

   Delete入力ボックスでパッケージ名または特定のクラス名を入力して、対応するDebugログを閉じることもできます。

   :::note
   ここでの変更は、対応するFEノードのログレベルにのみ影響します。他のFEノードのログレベルには影響しません。
   :::

- API経由での変更

   以下のAPI経由でランタイム時にログレベルを変更することもできます。FEノードの再起動は不要です。

   ```shell
   curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?add_verbose=org.apache.doris.catalog.Catalog
   ```
ここで、usernameとpasswordはDorisにログインしているrootまたはadminユーザーです。`add_verbose`パラメータは、Debugログを有効にするパッケージ名またはクラス名を指定します。成功した場合、以下が返されます：

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
次のAPIを通じてDebug logを閉じることもできます:

   ```shell
   curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?del_verbose=org.apache.doris.catalog.Catalog
   ```
`del_verbose` パラメータは、Debug ログを閉じるためのパッケージ名またはクラス名を指定します。

## k8s のログ設定

場合によっては、FE プロセスがコンテナ環境（k8s など）を通じてデプロイされます。すべてのログはファイルではなく標準出力ストリームを通じて出力する必要があります。

この場合、`sh bin/start_fe.sh --console` コマンドを使用してFE プロセスをフォアグラウンドで起動し、すべてのログを標準出力ストリームに出力できます。

同じ標準出力ストリーム内で異なるタイプのログを区別するために、各ログの前に異なるプレフィックスが追加されます。例：

```
RuntimeLogger 2024-06-24 00:05:21,522 INFO (main|1) [DorisFE.start():158] Doris FE starting...
RuntimeLogger 2024-06-24 00:05:21,530 INFO (main|1) [FrontendOptions.analyzePriorityCidrs():194] configured prior_cidrs value: 172.20.32.136/24
RuntimeLogger 2024-06-24 00:05:21,535 INFO (main|1) [FrontendOptions.initAddrUseIp():101] local address: /172.20.32.136.
RuntimeLogger 2024-06-24 00:05:21,740 INFO (main|1) [ConsistencyChecker.initWorkTime():106] consistency checker will work from 23:00 to 23:00
RuntimeLogger 2024-06-24 00:05:21,889 ERROR (main|1) [Util.report():128] SLF4J: Class path contains multiple SLF4J bindings.
```
異なるプレフィックスの意味は以下の通りです：

- `StdoutLogger`：標準出力ストリームにログを出力し、`fe.out`の内容に対応します。
- `StderrLogger`：標準エラーストリームにログを出力し、`fe.out`の内容に対応します。
- `RuntimeLogger`：`fe.log`にログを出力します。
- `AuditLogger`：`fe.audit.log`にログを出力します。
- プレフィックスなし：`fe.gc.log`にログを出力します。

さらに、コンテナ環境用の追加設定パラメータがあります：

| 設定項目 | デフォルト値 | オプション | 説明 |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false  | ファイルログを有効にするかどうか。デフォルトは`true`です。`--console`コマンドでFEプロセスを開始すると、標準出力ストリームと通常のログファイルの両方にログが出力されます。`false`に設定すると、ログは標準出力ストリームにのみ出力され、ログファイルは生成されません。|
