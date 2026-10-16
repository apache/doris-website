---
{
    "title": "BE ログの管理",
    "language": "ja",
    "description": "Apache Doris Backend（BE）プロセスのログ管理ガイド。ログの種類、保存先とローテーションポリシーの設定、DEBUG ログの有効化、コンテナ環境でのログ出力設定を説明します。",
    "keywords": [
        "Doris BE ログ",
        "Backend ログ",
        "be.INFO",
        "be.WARNING",
        "be.out",
        "jni.log",
        "be.gc.log",
        "sys_log_level",
        "sys_log_roll_mode",
        "sys_log_verbose_modules",
        "DEBUG ログ",
        "ログレベルの動的変更",
        "glog adjust",
        "コンテナログ",
        "Kubernetes BE ログ",
        "enable_file_logger",
        "Doris ログの保存先",
        "BE ログの設定"
    ]
}
---

このドキュメントでは、Apache Doris Backend（BE）プロセスのログシステムについて説明します。ログファイルの種類、保存先とローテーションポリシーの設定、DEBUG ログの有効化、Kubernetes などのコンテナ環境で標準出力へログを送る方法を扱います。

このドキュメントは Apache Doris 2.1.4 以降に適用されます。

<!-- Knowledge type: Configuration parameters / Procedures -->
<!-- Use cases: Daily operations / Troubleshooting / Containerized deployment -->

## ユースケース {#use-cases}

| 用途 | 参照先 |
| --- | --- |
| BE プロセスが生成するログファイルを確認する | [ログの種類](#log-categories) |
| ログの保存先、ローテーションポリシー、保持数を変更する | [ログの設定](#log-configuration) |
| 問題の調査に必要な DEBUG レベルのログを有効にする | [DEBUG ログの有効化](#enable-debug-logs) |
| BE をコンテナ環境（Kubernetes など）にデプロイし、ログを標準出力へ送る | [コンテナ環境でのログ設定](#container-environment-log-configuration) |
| BE クラッシュ後のスタックトレースを確認する | `be.out` を確認します（[ログの種類](#log-categories)を参照）。 |

## ログの種類 {#log-categories}

`sh bin/start_be.sh --daemon` で BE プロセスを起動すると、BE のログディレクトリに次のログファイルが生成されます。

| ファイル名 | 内容 | 備考 |
| --- | --- | --- |
| `be.INFO` | BE プロセスの主な実行時ログ。DEBUG、INFO、WARN、ERROR の全レベルを含みます。 | 最新の BE 実行時ログファイルを指すシンボリックリンクです。 |
| `be.WARNING` | WARN 以上のレベルの実行時ログのみ。`be.INFO` の一部です。 | 最新の BE 警告ログファイルを指すシンボリックリンクです。警告やエラーをすばやく確認できます。 |
| `be.out` | 標準出力（stdout）と標準エラー出力（stderr）からのログ。起動スクリプトの `echo` 出力や、glog フレームワークが取得しないログなどが含まれます。 | BE がクラッシュした場合、通常はこのファイルにクラッシュ時のスタックトレースが記録されます。 |
| `jni.log` | BE が JNI 経由で呼び出す Java プログラムのログです。 | TODO: 将来のリリースで、このログは `be.INFO` に統合される予定です。 |
| `be.gc.log` | BE の JVM の GC ログです。 | JVM 起動オプション `JAVA_OPTS` を `be.conf` で設定して制御します。 |

## ログの設定 {#log-configuration}

<!-- Knowledge type: Configuration parameters -->
<!-- Use cases: Log path adjustment / Rolling policy tuning / Log retention policy management -->

以下の設定項目はすべて `be.conf` ファイルにあります。ログの保存先、保持期間、保持数、ファイルごとのサイズ、ローテーションポリシーなどを制御します。

| 設定項目 | デフォルト値 | 選択肢 | 説明 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` | — | すべてのログの保存先です。デフォルトは BE のデプロイ先にある `log/` ディレクトリです。環境変数のため、設定名は大文字で指定する必要があります。 |
| `sys_log_level` | `INFO` | `INFO`、`WARNING`、`ERROR`、`FATAL` | `be.INFO` のログレベルです。デフォルトは `INFO` です。`INFO` レベルには重要なログメッセージが多数含まれるため、変更は推奨しません。 |
| `sys_log_roll_num` | `10` | — | `be.INFO` と `be.WARNING` のファイル数の上限です。デフォルトは 10 です。ローテーションや分割によってファイル数がこの上限を超えると、古いログが削除されます。 |
| `sys_log_verbose_modules` | 空 | — | DEBUG レベルのログを有効にするソースコードファイルを指定します。詳しくは[DEBUG ログの有効化](#enable-debug-logs)を参照してください。 |
| `sys_log_verbose_level` | 空 | — | DEBUG ログの詳細度です。詳しくは[DEBUG ログの有効化](#enable-debug-logs)を参照してください。 |
| `sys_log_verbose_flags_v` | 空 | — | glog の `FLAGS_v` に対応し、DEBUG ログの詳細度を全体的に制御します。詳しくは[DEBUG ログの有効化](#enable-debug-logs)を参照してください。 |
| `sys_log_roll_mode` | `SIZE-MB-1024` | `TIME-DAY`、`TIME-HOUR`、`SIZE-MB-nnn` | `be.INFO` と `be.WARNING` のローテーションポリシーです。デフォルトの `SIZE-MB-1024` では、ログが 1024 MB に達するたびに新しいファイルが生成されます。日単位または時間単位のローテーションにも変更できます。 |
| `log_buffer_level` | 空 | 空または `-1` | BE ログの出力方式です。デフォルトでは非同期でディスクへ書き出します。`-1` に設定するとリアルタイムで書き出すため、一部の性能が犠牲になりますが、BE のクラッシュ時に最新のログをできるだけ残せます。 |
| `disable_compaction_trace_log` | `true` | `true`、`false` | Compaction 操作のトレースログを無効にするかどうかを指定します。デフォルトの `true` では無効です。`false` に設定すると、Compaction に関する問題の調査に役立つトレースログが出力されます。 |
| `aws_log_level` | `0` | `0`～`6` | AWS SDK のログレベルを制御します。デフォルトの `0` は無効を意味します。glog はデフォルトで AWS SDK のログを取得して出力するため、取得されていないログを確認する必要がある場合にのみ有効にしてください。レベルの対応関係は `Off=0`、`Fatal=1`、`Error=2`、`Warn=3`、`Info=4`、`Debug=5`、`Trace=6` です。 |
| `s3_file_writer_log_interval_second` | `60` | — | S3 アップロード中に進捗を出力する間隔です。単位は秒です。 |
| `enable_debug_log_timeout_secs` | `0` | — | `0` より大きい値にすると、問題の調査に役立つ Pipeline 実行エンジンの詳細な実行ログが出力されます。デフォルトでは無効です。 |
| `sys_log_enable_custom_date_time_format` | `false` | `true`、`false` | ログの日付形式のカスタマイズを許可するかどうかを指定します（バージョン 2.1.7 以降でサポート）。 |
| `sys_log_custom_date_time_format` | `%Y-%m-%d %H:%M:%S` | — | ログの日付形式を指定します。`sys_log_enable_custom_date_time_format` が `true` の場合のみ有効です（バージョン 2.1.7 以降でサポート）。 |
| `sys_log_custom_date_time_ms_format` | `,{:03d}` | — | ログの日付のミリ秒精度の形式を指定します。`sys_log_enable_custom_date_time_format` が `true` の場合のみ有効です（バージョン 2.1.7 以降でサポート）。 |

## DEBUG ログの有効化 {#enable-debug-logs}

<!-- Knowledge type: Procedures -->
<!-- Use cases: Troubleshooting / Performance issue diagnosis -->

BE で DEBUG ログを有効にする方法は二つあります。

- **静的設定**: `be.conf` で設定し、BE を再起動して変更を反映します。設定は永続化されます。
- **動的変更**: RESTful API を使って、再起動せずに変更します。設定は永続化されず、BE の再起動後に失われます。

### 静的設定 {#static-configuration}

`sys_log_verbose_modules` と `sys_log_verbose_level` を `be.conf` で設定します。

```text
sys_log_verbose_modules=plan_fragment_executor,olap_scan_node
sys_log_verbose_level=3
```

各パラメータの説明は次のとおりです。

| パラメータ | 用途 |
| --- | --- |
| `sys_log_verbose_modules` | DEBUG ログを有効にするソースファイル名を指定します。複数のファイルはカンマで区切ります。ワイルドカード `*` を使用できます。たとえば、`sys_log_verbose_modules=*` を指定すると、すべてのモジュールの DEBUG ログが有効になります。 |
| `sys_log_verbose_level` | DEBUG ログの詳細度です。有効な範囲は `1`～`10` です。値が大きいほど詳細なログが出力されます。 |
| `sys_log_verbose_flags_v` | glog の `FLAGS_v` に対応し、ログの詳細度を全体的に制御します。`VLOG(n)` のログは `n <= FLAGS_v` の場合にのみ出力されるため、出力をより細かく制御できます。この設定の適用範囲は **`sys_log_verbose_modules` に限定されません**。 |

通常は `sys_log_verbose_modules` と `sys_log_verbose_level` の設定で十分です。想定したデバッグログが出力されない場合にのみ、`sys_log_verbose_flags_v` を設定してください。

### 動的変更 {#dynamic-adjustment}

Doris 2.1 以降では、RESTful API を使って BE の DEBUG ログを動的に変更できます。

```bash
curl -X POST "http://<be_host>:<webport>/api/glog/adjust?module=<module_name>&level=<level_number>"
```

パラメータは次のとおりです。

- `<be_host>`: BE ノードのホストアドレス。
- `<webport>`: BE の HTTP ポート。デフォルトは `8040` です。
- `<module_name>`: 変更するモジュール名（ソースファイル名）。ワイルドカード `*` を使用できます。
- `<level_number>`: DEBUG ログの詳細度。`-1` を指定すると無効になります。

使用上の注意:

- **設定は永続化されません**: 動的な変更は BE の再起動後に失われます。再起動後は再設定が必要です。
- **ワイルドカードと個別のモジュールは独立しています**: たとえば、先に `moduleA` の vlog レベルを `10` に設定した後で `module=*&level=-1` を実行しても、`moduleA` の vlog は**無効になりません**。
- **モジュール名は検証されません**: どちらの方法でも、指定したモジュールが存在しない場合、glog は対応するログモジュールを作成しますが、実際の効果はなく、エラーも返しません。

## コンテナ環境でのログ設定 {#container-environment-log-configuration}

<!-- Knowledge type: Configuration parameters / Procedures -->
<!-- Use cases: Kubernetes / Containerized deployment / stdout log collection -->

Kubernetes などのコンテナ環境に BE をデプロイする場合、通常はコンテナオーケストレーションプラットフォームでログを一元的に収集できるよう、すべてのログをファイルではなく標準出力へ送る必要があります。

### 起動 {#startup}

`--console` パラメータを使うと、BE プロセスがフォアグラウンドで起動し、すべてのログが標準出力へ送られます。

```shell
sh bin/start_be.sh --console
```

### ログのプレフィックス {#log-prefix-description}

複数の種類のログが同じ標準出力へ送られるため、BE はログを区別できるよう各エントリにプレフィックスを付けます。出力例:

```text
RuntimeLogger W20240624 00:36:46.325274 1460943 olap_server.cpp:710] Have not get FE Master heartbeat yet
RuntimeLogger I20240624 00:36:46.325999 1459644 olap_server.cpp:208] tablet checkpoint tasks producer thread started
RuntimeLogger I20240624 00:36:46.326066 1460954 olap_server.cpp:448] begin to produce tablet meta checkpoint tasks.
RuntimeLogger I20240624 00:36:46.326093 1459644 olap_server.cpp:213] tablet path check thread started
RuntimeLogger I20240624 00:36:46.326190 1459644 olap_server.cpp:219] cache clean thread started
RuntimeLogger I20240624 00:36:46.326336 1459644 olap_server.cpp:231] path gc threads started. number:1
RuntimeLogger I20240624 00:36:46.326643 1460958 olap_server.cpp:424] try to start path gc thread!
```

各プレフィックスの意味は次のとおりです。

| プレフィックス | 対応するログ |
| --- | --- |
| `RuntimeLogger` | `be.INFO` のログ |

> `jni.log` のプレフィックスには、将来のリリースで対応する予定です。

### コンテナ固有の設定 {#container-specific-configuration}

| 設定項目 | デフォルト値 | 選択肢 | 説明 |
| --- | --- | --- | --- |
| `enable_file_logger` | `true` | `true`、`false` | ファイルへのログ出力も有効にするかどうかを指定します。デフォルトは `true` で、`--console` を指定して BE を起動した場合、ログは標準出力とログファイルの両方に書き込まれます。`false` に設定すると、ログは標準出力にのみ書き込まれ、ログファイルは生成されません。 |

## よくある質問 {#faq}

### Q: BE がクラッシュしたが、`be.INFO` に明確なスタックトレースがない

`be.out` を確認してください。BE が異常終了した際のスタックトレースは、通常このファイルに書き込まれます。

### Q: `be.conf` を編集してもログ設定が反映されない

静的設定を反映するには BE の再起動が必要です。すぐに変更する場合は、[動的変更](#dynamic-adjustment)の RESTful API を使用してください。

### Q: 動的に変更した vlog レベルが再起動後に失われる

動的な変更は永続化されません。再起動後に再設定するか、`be.conf` に設定を記述してください。

### Q: DEBUG ログを有効にした後、ログの量が増えすぎてディスク容量が不足する

`sys_log_verbose_level` を下げるか、`sys_log_verbose_modules` の対象を絞るか、`sys_log_roll_num` を調整して保持数を制御してください。

### Q: コンテナ環境で標準出力にログが出力されない

`sh bin/start_be.sh --console` で BE を起動していることを確認してください。ファイルへのログ出力を無効にするには、`enable_file_logger` を `false` に設定します。

### Q: AWS SDK の問題を調査したい

調査中は一時的に `aws_log_level` を上げ（たとえば `4` または `5`）、ログの出力量が増えすぎないよう、調査後は `0` に戻してください。
