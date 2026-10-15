---
{
    "title": "FE ログ管理",
    "language": "ja",
    "description": "Apache Doris FE のログ管理ガイド。ログの種類（fe.log/fe.warn.log/fe.audit.log/fe.out/fe.gc.log）、ログの保持とローテーションの設定、実行時の DEBUG ログの有効化、コンテナ環境での標準出力へのログ出力を説明します。",
    "keywords": [
        "Doris FE ログ",
        "fe.log",
        "fe.warn.log",
        "fe.audit.log",
        "fe.out",
        "fe.gc.log",
        "監査ログ",
        "GC ログ",
        "ログレベル",
        "DEBUG ログ",
        "sys_log_verbose_modules",
        "sys_log_mode",
        "log_rollover_strategy",
        "ログローテーション",
        "ログの保持",
        "ログの圧縮",
        "Kubernetes FE ログ",
        "コンテナログ",
        "標準出力ログ",
        "enable_file_logger",
        "実行時のログレベル変更",
        "Doris ログのトラブルシューティング"
    ]
}
---

このドキュメントは、Doris クラスターを運用・開発するエンジニア向けです。FE（Frontend）プロセスのロギングシステムについて、ログファイルの種類、ログの保持とローテーションの方針、実行時に DEBUG ログを有効にする方法、コンテナ環境でログを収集する方法を説明します。

> このドキュメントは Doris 2.1.4 以降に適用されます。

<!-- Knowledge type: Operations guide + Configuration parameters -->
<!-- Use cases: Daily operations / Troubleshooting / Performance tuning / Containerized deployment -->

## ユースケース

| シナリオ | 参照するセクション |
| --- | --- |
| FE が生成するログファイルと、それぞれの用途を確認する | [ログの種類](#log-categories) |
| ログの保持日数、ファイルごとのサイズ、ローテーション方針を調整する | [ログ設定](#log-configuration) |
| トラブルシューティング中に特定のクラスやパッケージの DEBUG ログを有効にする | [DEBUG ログを有効にする](#enable-debug-logs) |
| Kubernetes などのコンテナ環境でデプロイし、ログを標準出力に送る | [コンテナ環境でのログ設定](#container-environment-log-configuration) |
| 監査ログの場所と記録内容を確認する | `fe.audit.log` については [ログの種類](#log-categories)、監査ログ関連のパラメーターについては [ログ設定](#log-configuration) を参照してください。 |

## ログの種類 {#log-categories}

<!-- Knowledge type: Concept overview -->
<!-- Use cases: Quickly confirm which log to look at before troubleshooting -->

`sh bin/start_fe.sh --daemon` で FE プロセスを起動すると、FE のログディレクトリ（`LOG_DIR` 設定で指定。デフォルトは FE のデプロイ先にある `log/` ディレクトリ）に、次のログファイルが生成されます。

| ログファイル | 種類 | 説明 |
| --- | --- | --- |
| `fe.log` | 実行時ログ（メイン） | FE プロセスのメインログです。DEBUG、INFO、WARN、ERROR など、すべてのレベルの実行時ログが含まれます。 |
| `fe.warn.log` | 実行時ログ（警告） | WARN 以上のレベルのログのみを記録します。`fe.log` の一部に相当し、警告やエラーをすばやく確認する際に役立ちます。 |
| `fe.audit.log` | 監査ログ | この FE ノードを経由して実行されたデータベース操作（SQL、DDL、DML など）をすべて記録します。 |
| `fe.out` | 標準出力／標準エラー出力 | 起動スクリプトの `echo` 出力や、log4j フレームワークで捕捉されなかったログメッセージを記録します。実行時ログを補完するもので、まれに追加情報を確認する必要があります。 |
| `fe.gc.log` | JVM GC ログ | FE JVM のガベージコレクションログです。その動作は `JAVA_OPTS` で制御します。この設定は `fe.conf` にあります。 |

## ログ設定 {#log-configuration}

<!-- Knowledge type: Configuration parameters -->
<!-- Use cases: Adjust log retention policy, rolling mode, and compressed archiving -->

次の設定項目はすべて `fe.conf` ファイルにあります。ログの保存先、保持期間、保持ファイル数、ファイルごとのサイズ、および関連する動作を制御します。

### 一般設定

| 設定項目 | デフォルト値 | 選択肢 | 説明 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` | | すべてのログの保存先です。デフォルトは FE のデプロイ先にある `log/` ディレクトリです。これは環境変数であり、設定名は大文字で指定する必要があります。 |
| `sys_log_level` | `INFO` | `INFO`, `WARN`, `ERROR`, `FATAL` | `fe.log` のログレベルです。デフォルトは INFO です。INFO レベルには重要なログメッセージが多数含まれるため、変更は推奨されません。 |
| `sys_log_mode` | `NORMAL` | `NORMAL`, `BRIEF`, `ASYNC` | FE ログの出力モードです。デフォルトの `NORMAL` では、位置情報を含むログを同期的に書き込みます。`ASYNC` では、位置情報を含むログを非同期に書き込みます。`BRIEF` では、位置情報を省略したログを非同期に書き込みます。パフォーマンスは `NORMAL`、`ASYNC`、`BRIEF` の順に向上します。 |

:::note
バージョン 3.0.2 以降、`sys_log_mode` のデフォルト値は `ASYNC` に変更されています。
:::

### 実行時ログ（fe.log / fe.warn.log）

| 設定項目 | デフォルト値 | 選択肢 | 説明 |
| --- | --- | --- | --- |
| `log_roll_size_mb` | 1024 | | `fe.log`、`fe.warn.log`、`fe.audit.log` の各ファイルの最大サイズです。デフォルトは 1024 MB です。個々のログファイルがこのしきい値を超えると、新しいファイルが自動的に作成されます。 |
| `sys_log_roll_interval` | `DAY` | `DAY`, `HOUR` | `fe.log` と `fe.warn.log` のローテーション間隔です。デフォルトは 1 日で、毎日新しいログファイルが生成されます。 |
| `sys_log_roll_num` | 10 | | 日あたりの `fe.log` と `fe.warn.log` の最大ファイル数です。デフォルトは 10 です。ローテーションや分割によってファイル数がこの上限を超えると、古いログファイルが削除されます。 |
| `sys_log_enable_compress` | false | true, false | 過去の `fe.log` と `fe.warn.log` の圧縮を有効にするかどうかを指定します。デフォルトでは無効です。有効にすると、過去のログは gzip で圧縮して保存されます。 |
| `sys_log_verbose_modules` | | | 指定した Java パッケージまたはクラスの DEBUG レベルのログを有効にします。[DEBUG ログを有効にする](#enable-debug-logs)を参照してください。 |

:::tip
`sys_log_roll_num` は保持するログの総数ではなく、日あたりの数を制御します。保持するログの総数を判断するには、`sys_log_delete_age` と組み合わせて考える必要があります。
:::

### 監査ログ（fe.audit.log）

| 設定項目 | デフォルト値 | 選択肢 | 説明 |
| --- | --- | --- | --- |
| `audit_log_dir` | `ENV(DORIS_HOME)/log` | | `fe.audit.log` 専用の保存先です。デフォルトは FE のデプロイ先にある `log/` ディレクトリです。 |
| `audit_log_roll_interval` | `DAY` | `DAY`, `HOUR` | `fe.audit.log` のローテーション間隔です。デフォルトは 1 日で、毎日新しいログファイルが生成されます。 |
| `audit_log_roll_num` | 90 | | `fe.audit.log` の最大ファイル数です。デフォルトは 90 です。ローテーションや分割によってファイル数がこの上限を超えると、古いログファイルが削除されます。 |
| `audit_log_enable_compress` | false | true, false | 過去の `fe.audit.log` の圧縮を有効にするかどうかを指定します。デフォルトでは無効です。有効にすると、過去の監査ログは gzip で圧縮して保存されます。 |
| `audit_log_modules` | `{"slow_query", "query", "load", "stream_load"}` | | `fe.audit.log` に記録するモジュールの種類です。デフォルトは slow query、query、load、stream load です。「query」にはすべての DDL、DML、SQL 操作が含まれます。「slow query」は、実行時間が `qe_slow_log_ms` のしきい値を超えたこれらの操作を指します。「load」は Broker Load、「stream load」は Stream Load 操作を指します。 |
| `qe_slow_log_ms` | 5000 | | DDL、DML、SQL ステートメントの実行時間がこのしきい値を超えると、`slow_query` モジュールに別途記録されます。このモジュールは `fe.audit.log` にあります。デフォルトは 5000 ms です。 |
| `sql_digest_generation_threshold_ms` | 5000 | | `sql_digest` を生成する時間のしきい値です。単位はミリ秒です。クエリの応答時間がこのしきい値を超えると、`sql_digest` が `fe.audit.log` に生成されます。デフォルトは 5000 ms です。 |

### 時間による保持（log_rollover_strategy = age）

| 設定項目 | デフォルト値 | 選択肢 | 説明 |
| --- | --- | --- | --- |
| `log_rollover_strategy` | `age` | `age`, `size` | ログの保持方針です。デフォルトの `age` は過去のログを期間に基づいて保持し、`size` は合計サイズに基づいて保持します。 |
| `sys_log_delete_age` | 7d | 7d、10h、60m、120s などの形式をサポート | `log_rollover_strategy` が `age` の場合にのみ有効です。`fe.log` と `fe.warn.log` の保持期間を制御します。デフォルトは 7 日です。7 日を超えたログは自動的に削除されます。 |
| `audit_log_delete_age` | 30d | 7d、10h、60m、120s などの形式をサポート | `log_rollover_strategy` が `age` の場合にのみ有効です。`fe.audit.log` の保持期間を制御します。デフォルトは 30 日です。30 日を超えたログは自動的に削除されます。 |

### サイズによる保持（log_rollover_strategy = size）

| 設定項目 | デフォルト値 | 選択肢 | 説明 |
| --- | --- | --- | --- |
| `info_sys_accumulated_file_size` | 4 | | `log_rollover_strategy` が `size` の場合にのみ有効です。`fe.log` の累積サイズを制御します。デフォルトは 4 GB です。累積ログサイズがこのしきい値を超えると、過去のログファイルが削除されます。 |
| `warn_sys_accumulated_file_size` | 2 | | `log_rollover_strategy` が `size` の場合にのみ有効です。`fe.warn.log` の累積サイズを制御します。デフォルトは 2 GB です。累積ログサイズがこのしきい値を超えると、過去のログファイルが削除されます。 |
| `audit_sys_accumulated_file_size` | 4 | | `log_rollover_strategy` が `size` の場合にのみ有効です。`fe.audit.log` の累積サイズを制御します。デフォルトは 4 GB です。累積ログサイズがこのしきい値を超えると、過去のログファイルが削除されます。 |

## DEBUG ログを有効にする {#enable-debug-logs}

<!-- Knowledge type: Procedures -->
<!-- Use cases: Troubleshooting / temporarily inspecting runtime details of a specific class or package -->

FE の DEBUG レベルのログは、設定ファイルを変更するか、UI または REST API を使用して実行時に有効にできます。各方法の違いは次のとおりです。

| 方法 | 再起動 | 適用範囲 | 用途 |
| --- | --- | --- | --- |
| `fe.conf` を変更 | FE の再起動が必要 | 各ノードが再起動後に自身の設定を適用 | 特定の DEBUG ログを長期的に有効にする |
| FE UI | 不要 | 現在の FE ノードのみ | 一時的な調査、UI 上での操作 |
| REST API | 不要 | 対象の FE ノードのみ | 一時的な調査、スクリプトによる一括操作 |

### 方法 1：設定ファイルから

`sys_log_verbose_modules` を `fe.conf` に追加します。例：

```text
# Enable DEBUG log only for the class org.apache.doris.catalog.Catalog
sys_log_verbose_modules=org.apache.doris.catalog.Catalog

# Enable DEBUG log for all classes under the package org.apache.doris.catalog
sys_log_verbose_modules=org.apache.doris.catalog

# Enable DEBUG log for all classes under the package org
sys_log_verbose_modules=org
```

設定項目を追加したら、変更を反映するために FE ノードを再起動します。

### 方法 2：FE UI から

UI では、FE ノードを再起動せずに実行時のログレベルを変更できます。手順は次のとおりです。

1. ブラウザーで FE ノードの HTTP ポート（デフォルトは 8030）にアクセスし、UI にサインインします。
2. 上部ナビゲーションバーの `Log` タブをクリックします。

    ![FE UI でのログ設定画面](/images/log_manage/fe_web_log1.png)

3. Add 入力欄にパッケージ名または特定のクラス名を入力し、対応する DEBUG ログを有効にします。たとえば、`org.apache.doris.catalog.Catalog` を入力すると、Catalog クラスの DEBUG ログが有効になります。

    ![FE UI での DEBUG ログの追加画面](/images/log_manage/fe_web_log2.png)

4. Delete 入力欄にパッケージ名または特定のクラス名を入力し、対応する DEBUG ログを無効にします。

:::note
ここで行った変更は、対象の FE ノードのログレベルにのみ影響し、ほかの FE ノードには影響しません。
:::

### 方法 3：REST API から

REST API でも、FE ノードを再起動せずに実行時のログレベルを変更できます。

- **DEBUG ログを有効にする**

    ```shell
    curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?add_verbose=org.apache.doris.catalog.Catalog
    ```

    ユーザー名とパスワードには、Doris にサインインする root または admin ユーザーのものを使用します。`add_verbose` パラメーターには、DEBUG ログを有効にするパッケージ名またはクラス名を指定します。成功した場合の応答は次のとおりです。

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

- **DEBUG ログを無効にする**

    ```shell
    curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?del_verbose=org.apache.doris.catalog.Catalog
    ```

    `del_verbose` パラメーターには、DEBUG ログを無効にするパッケージ名またはクラス名を指定します。

## コンテナ環境でのログ設定 {#container-environment-log-configuration}

<!-- Knowledge type: Procedures + Configuration parameters -->
<!-- Use cases: Containerized deployment (Kubernetes) / sending logs to stdout for collection -->

Kubernetes を使用して FE プロセスをデプロイする場合など、コンテナのログ収集ツールで一元的に収集できるよう、すべてのログをファイルではなく標準出力に送る必要がある場合があります。

### 起動方法

次のコマンドで FE プロセスをフォアグラウンドで起動します。これにより、すべてのログが標準出力に送られます。

```shell
sh bin/start_fe.sh --console
```

### ログプレフィックスによる識別

同じ標準出力に流れるログの種類を区別するため、各ログ行には種類に応じたプレフィックスが付けられます。出力例：

```text
RuntimeLogger 2024-06-24 00:05:21,522 INFO (main|1) [DorisFE.start():158] Doris FE starting...
RuntimeLogger 2024-06-24 00:05:21,530 INFO (main|1) [FrontendOptions.analyzePriorityCidrs():194] configured prior_cidrs value: 172.20.32.136/24
RuntimeLogger 2024-06-24 00:05:21,535 INFO (main|1) [FrontendOptions.initAddrUseIp():101] local address: /172.20.32.136.
RuntimeLogger 2024-06-24 00:05:21,740 INFO (main|1) [ConsistencyChecker.initWorkTime():106] consistency checker will work from 23:00 to 23:00
RuntimeLogger 2024-06-24 00:05:21,889 ERROR (main|1) [Util.report():128] SLF4J: Class path contains multiple SLF4J bindings.
```

各プレフィックスに対応するログの種類は次のとおりです。

| プレフィックス | 対応するログファイル | 説明 |
| --- | --- | --- |
| `StdoutLogger` | `fe.out` | 標準出力からのログです。 |
| `StderrLogger` | `fe.out` | 標準エラー出力からのログです。 |
| `RuntimeLogger` | `fe.log` | FE のメイン実行時ログです。 |
| `AuditLogger` | `fe.audit.log` | 監査ログです。 |
| プレフィックスなし | `fe.gc.log` | GC ログです。 |

### コンテナ環境向けの追加設定

| 設定項目 | デフォルト値 | 選択肢 | 説明 |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false | ファイルへのログ出力を有効にするかどうかを指定します。デフォルトは `true` です。`--console` コマンドで FE プロセスを起動すると、ログは標準出力と通常のログファイルの両方に書き込まれます。`false` に設定すると、ログは標準出力にのみ書き込まれ、ログファイルは生成されません。 |
