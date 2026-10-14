---
{
    "title": "継続ロードの概要",
    "language": "ja",
    "sidebar_label": "概要",
    "description": "Doris の Streaming Job で利用できる MySQL、PostgreSQL、OceanBase、S3 のデータソース、同期方式、一貫性の保証、ジョブの状態、共通パラメータ、運用コマンドについて説明します。",
    "keywords": [
        "Doris 継続ロード",
        "Streaming Job",
        "MySQL リアルタイム同期",
        "PostgreSQL リアルタイム同期",
        "OceanBase リアルタイム同期",
        "S3 継続ロード",
        "SQL マッピング同期",
        "テーブル自動作成同期",
        "exactly-once",
        "at-least-once",
        "autoResume"
    ]
}
---

<!-- Knowledge type: Feature overview + architecture selection decision -->
<!-- Applicable scenarios: Real-time data ingestion selection / continuous load operations -->

Doris は **Streaming Job** を使用して、複数のデータソースから Doris テーブルへデータを継続的にロードできます。ジョブを送信すると、Doris はロードジョブを実行し続け、ソースからリアルタイムでデータを読み取って Doris テーブルに書き込みます。

:::tip
この機能はバージョン 4.1.0 以降でサポートされます。
:::

このドキュメントでは、次の疑問に答えます。

- 継続ロードがサポートするデータソースと同期方式は何ですか？
- SQL マッピング同期とテーブル自動作成同期は、どのように選べばよいですか？
- ジョブの状態はどのように遷移し、自動復旧はどのように動作しますか？
- 日常の運用でロードジョブを表示、一時停止、再開、削除するにはどうすればよいですか？
- FE とジョブの共通設定パラメータには何がありますか？

## 対応データソースと同期方式 {#supported-data-sources-and-sync-modes}

継続ロードは、次のデータソースと同期方式をサポートします。

| データソース | 対応バージョン | SQL マッピング同期 | テーブル自動作成同期 | 設定ガイド |
| :---------- | :----------------- | :---------------------------------------------------------------- | :---------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| MySQL       | 5.6, 5.7, 8.0.x    | [SQL マッピングによる MySQL CDC](./continuous-load-mysql-table.md)    | [テーブル自動作成による MySQL CDC](./continuous-load-mysql-database.md) | [Amazon RDS MySQL](./prerequisites/amazon-rds-mysql.md) · [Amazon Aurora MySQL](./prerequisites/amazon-aurora-mysql.md)                   |
| PostgreSQL  | 14, 15, 16, 17     | [SQL マッピングによる PostgreSQL CDC](./continuous-load-postgresql-table.md) | [テーブル自動作成による PostgreSQL CDC](./continuous-load-postgresql-database.md) | [Amazon RDS PostgreSQL](./prerequisites/amazon-rds-postgresql.md) · [Amazon Aurora PostgreSQL](./prerequisites/amazon-aurora-postgresql.md) |
| OceanBase   | MySQL 互換モード | -                                                           | [テーブル自動作成による OceanBase CDC](./continuous-load-oceanbase-database.md)（バージョン 4.1.4 以降） | -                                                                                                                                         |
| S3          | -                  | [S3 継続ロード](./continuous-load-s3.md)                     | -                                                                       | -                                                                                                                                         |

ソースの列型と Doris の型との対応については、[MySQL](./data-type-mapping-mysql.md)、[PostgreSQL](./data-type-mapping-postgresql.md)、[OceanBase](./data-type-mapping-oceanbase.md) のデータ型マッピングを参照してください。

## 同期方式の選び方 {#how-to-choose-a-sync-method}

<!-- Knowledge type: Architecture selection decision -->

SQL マッピング同期とテーブル自動作成同期は、基盤となる仕組みが**まったく異なる**二つの継続ロード方式です。「テーブル数」の違いではありません。**テーブル自動作成同期でも、`include_tables` を使って一つのテーブルだけを同期できます。** 必要な機能に基づいて選択してください。

### 機能比較 {#capability-comparison}

| 項目         | SQL マッピング同期                                                | テーブル自動作成同期                           |
| :----------------- | :-------------------------------------------------------------- | :------------------------------------------------- |
| 基盤となる仕組み | ジョブ + TVF（`INSERT INTO tbl SELECT * FROM tvf()`）             | ジョブ + データベース全体を対象とするネイティブ DDL（`FROM src TO DATABASE db`） |
| 同期先       | 既存の Doris テーブル                                         | Doris のデータベース                         |
| 同期範囲         | 単一テーブル                                                  | 一つのテーブルからデータベース全体までの複数テーブル（`include_tables` で制御） |
| テーブルの自動作成 | テーブルを事前に作成する必要がある                                | 初回の同期時に主キーテーブルが自動作成される |
| SQL の柔軟性    | 列のマッピング、フィルタリング、変換をサポート（SELECT 句） | 同期先テーブルの名前変更と非キー列の除外をサポート。SQL 式、行のフィルタリング、データ変換はサポートしない |
| 一貫性の保証 | exactly-once                                                    | at-least-once                                      |
| 必要な権限 | Load                                                           | Load + Create（テーブルを自動作成する場合） |
| 主な用途  | SQL 式、型変換、条件によるフィルタリングが必要なリアルタイム同期 | データベース全体またはテーブル群のミラーリング。同期先テーブルの簡単な名前変更や列の除外が可能 |

### 選択の目安 {#selection-recommendations}

- **データに SQL 処理を適用する必要がある、または exactly-once セマンティクスが厳密に必要な場合** → **SQL マッピング同期**を選択します。
- **Doris にテーブルを自動作成させ、一つの設定でテーブル群を同期したい場合** → **テーブル自動作成同期**を選択します。
- **データソースが OceanBase の場合** → 現在は MySQL 互換モードでのテーブル自動作成同期のみサポートされます。
- **データソースが S3 オブジェクトストレージの場合** → SQL マッピング同期のみサポートされます（S3 TVF を使用）。

## ジョブの状態遷移 {#job-state-transitions}

<!-- Knowledge type: Runtime mechanism -->

Streaming Job は実行中に次の状態を遷移します。**SQL マッピング同期とテーブル自動作成同期は同じ状態遷移に従います。**

![ジョブの状態遷移](/images/next/data-operate/streaming-job/job-state-flow.jpg)

### 状態の説明 {#state-descriptions}

| 状態        | 意味                                                                                                                  |
| :----------- | :----------------------------------------------------------------------------------------------------------------------- |
| **PENDING**  | ジョブは作成されていますが、サブタスクはまだスケジュールされていません。次のスケジューリングで `StreamingTask` が作成されるのを待っています。 |
| **RUNNING**  | サブタスクが生成されて実行中です。ソースから増分データを読み取り、Doris に書き込んでいます。         |
| **FINISHED** | ソースのデータをすべて読み取り、ジョブが終了した状態です。S3 TVF ジョブは、すべてのファイルのロードが完了するとこの状態になります。 |
| **PAUSED**   | サブタスクが失敗したためジョブが自動的に一時停止され、`failReason` が記録された状態です。原因は `ErrorMsg` フィールド（`select * from jobs(...)` で照会）で確認できます。 |

### 自動復旧（autoResume） {#automatic-recovery-autoresume}

ジョブが `PAUSED` になると、スケジューラは**指数バックオフ方式**で定期的に復旧を試みます。復旧するとジョブは `PENDING` に戻り、サブタスクの作成を続けます。**手動操作は不要です。ネットワークの一時的な不安定さやソースの短時間の停止などは、自動的に吸収されます。**

状況に応じて、次のコマンドを使用してください。

- **すぐに再開する、または問題の調査後に手動で開始する場合**: [`RESUME JOB`](#resume-a-load-job) を使用します。
- **完全に停止し、スケジュールされないようにする場合**: [`PAUSE JOB`](#pause-a-load-job)（手動で一時停止したジョブは autoResume によって再開されません）または [`DROP JOB`](#delete-a-load-job) を使用します。

## 共通操作 {#common-operations}

<!-- Knowledge type: Operational steps -->

### ロード状態の表示 {#view-load-status}

Streaming タイプの Insert Job をすべて照会します。

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

結果の列は次のとおりです。

| 列            | 説明                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| ID                | ジョブ ID                                                                   |
| NAME              | ジョブ名                                                                 |
| Definer           | ジョブを定義したユーザー                                                              |
| ExecuteType       | ジョブのスケジューリング種別: *ONE_TIME/RECURRING/STREAMING/MANUAL*               |
| RecurringStrategy | 定期実行の方式。通常の Insert で使用され、ExecuteType=Streaming の場合は空欄 |
| Status            | ジョブの状態                                                               |
| ExecuteSql        | ジョブの Insert SQL 文                                      |
| CreateTime        | ジョブの作成日時                                                        |
| SucceedTaskCount  | 成功したタスクの数                                               |
| FailedTaskCount   | 失敗したタスクの数                                                   |
| CanceledTaskCount | キャンセルされたタスクの数                                                 |
| Comment           | ジョブのコメント                                                              |
| Properties        | ジョブのプロパティ                                                           |
| CurrentOffset     | ジョブが処理を完了したオフセット。ExecuteType=Streaming の場合のみ設定される |
| EndOffset         | データソースから取得した最大 EndOffset。ExecuteType=Streaming の場合のみ設定される |
| LoadStatistic     | ジョブの統計情報                                                           |
| ErrorMsg          | ジョブのエラーメッセージ                                                 |
| JobRuntimeMsg     | ジョブ実行時のヒント                                                 |
| LagBytes          | ソースログに残っている未処理データのバイト数（MySQL / OceanBase の binlog または PostgreSQL の WAL）。`-1` は、S3 データソースや全量スナップショット段階などで値を取得できないことを示します。**バージョン 4.1.4 以降**、この列は従来の秒単位の `Lag` 列に代わり、バイト単位で報告されます |
| LastSourceEventTimestamp | コミット済みオフセットに記録された最新のソースイベントのタイムスタンプ（Unix 秒）。取得できない場合は空欄。**バージョン 4.1.4 で追加** |
| LastTaskSuccessTime | 直近のタスクが正常に完了した日時                  |

### タスク状態の表示 {#view-task-status}

ジョブ ID を指定して、そのジョブのすべてのサブタスクを照会します。

```sql
select * from tasks("type"="insert") where jobId='<job_id>';
```

結果の列は次のとおりです。

| 列        | 説明                                                          |
| ------------- | -------------------------------------------------------------------- |
| TaskId        | タスク ID                                                              |
| JobID         | ジョブ ID                                                                |
| JobName       | ジョブ名                                                             |
| Label         | タスクがロードに使用するラベル                               |
| Status        | タスクの状態                                                          |
| ErrorMsg      | タスクの失敗を示すメッセージ                                                 |
| CreateTime    | タスクの作成日時                                                   |
| StartTime     | タスクの開始日時                                                      |
| FinishTime    | タスクの終了日時                                                     |
| LoadStatistic | タスクの統計情報                                                      |
| User          | タスクの実行ユーザー                                                        |
| RunningOffset | タスクが現在同期しているオフセット情報。Job.ExecuteType=Streaming の場合のみ設定される |

### ロードジョブの一時停止 {#pause-a-load-job}

指定したジョブを手動で一時停止します（一時停止したジョブは autoResume によって再開されません）。

```sql
PAUSE JOB WHERE jobname = <job_name>;
```

### ロードジョブの再開 {#resume-a-load-job}

`PAUSED` 状態のジョブを再開します。

```sql
RESUME JOB WHERE jobName = <job_name>;
```

### ロードジョブの削除 {#delete-a-load-job}

指定したジョブを完全に削除します。削除後、ジョブはスケジュールされません。

```sql
DROP JOB WHERE jobName = <job_name>;
```

## 共通パラメータ {#common-parameters}

<!-- Knowledge type: Configuration parameters -->

### FE の設定パラメータ {#fe-configuration-parameters}

| パラメータ                            | デフォルト値 | 説明                                       |
| ------------------------------------ | ------- | ------------------------------------------------- |
| max_streaming_job_num                | 1024    | Streaming ジョブの最大数                  |
| job_streaming_task_exec_thread_num   | 10      | StreamingTask の実行に使用するスレッド数   |
| max_streaming_task_show_count        | 100    | メモリに保持する StreamingTask の実行履歴の最大数 |

### ジョブの共通ロード設定パラメータ {#job-common-load-configuration-parameters}

次のパラメータは `CREATE JOB ... PROPERTIES (...)` で設定します。特記がない限り、MySQL、PostgreSQL、OceanBase の継続ロードジョブで使用できます。

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| `max_interval` | `10` | ソースに新しいデータがない場合の待機中のスケジューリング間隔（秒）。1 以上の整数のみ指定できます。`10s` のような単位の接尾辞は使用できません。 |
| `compute_group` | 現在のセッションまたはユーザーのデフォルトのコンピュートグループ | コンピュートとストレージを分離したモードでのみサポートされます。ジョブを実行するコンピュートグループを指定します。明示的に指定する場合、値を空にすることはできず、ユーザーにはそのコンピュートグループに対する USAGE 権限が必要です。このパラメータを設定せず、現在のセッションにもユーザーにも利用可能なデフォルトのコンピュートグループがない場合、ジョブの作成は失敗します。 |
| `session.<variable_name>` | 対応するセッション変数のデフォルト値 | TVF モードでのみサポートされます。`session.insert_max_filter_ratio` など、ジョブの INSERT タスクに使用するセッション変数を設定します。変数名と値は Doris の有効なセッション変数として指定する必要があります。 |

ジョブプロパティとして指定する `offset` は、CDC ジョブの初期位置を設定しません。ジョブ作成時は、`FROM MYSQL`、`FROM POSTGRES`、`FROM OCEANBASE`、または `cdc_stream(...)` のソースパラメータで初期位置を設定してください。CDC ジョブを一時停止した後は、`ALTER JOB ... PROPERTIES ("offset" = '<json_offset>')` で位置をリセットできます。MySQL と OceanBase では `{"file":"binlog.000001","pos":"154"}`、PostgreSQL では `{"lsn":"12345678"}` を使用します。`ALTER JOB` が受け付けるのは、厳密な JSON オフセットのみです。

## 制限事項 {#limitations}

<!-- Knowledge type: Limitations / unsupported boundaries -->

同期範囲、テーブルの自動作成、一貫性の保証（exactly-once / at-least-once）については、[機能比較](#capability-comparison)を参照してください。この節では、**サポートされない**制約と動作のみを示します。

### 主キーテーブル {#primary-key-tables}

同期できるのは、**主キーを持つ**ソーステーブルのみです（両方の同期方式に共通）。対応する Doris テーブルは **Unique Key** テーブルです。テーブル自動作成同期では自動的に作成され、SQL マッピング同期ではユーザーが作成します。主キーのないテーブルはサポートされません。

### スキーマ変更（DDL） {#schema-change-ddl}

DDL の同期が適用されるのは、**[テーブル自動作成同期方式](#capability-comparison)のみ**です。[SQL マッピング同期方式](#capability-comparison)では DDL は同期されません。`cdc_stream()` テーブル関数は常に `schema_change_enabled` を `false` に設定します。

- **MySQL、PostgreSQL、OceanBase**: 同期されるのは `ADD COLUMN` と `DROP COLUMN` のみです。**列の型変更、`RENAME COLUMN`、主キー / 制約 / インデックス / パーティションの変更は同期されません。** Doris 側で手動で適用してください。データソースごとの動作と制限については、[MySQL](./schema-change-mysql.md)、[PostgreSQL](./schema-change-postgresql.md)、[OceanBase](./schema-change-oceanbase.md) のスキーマ変更の同期に関するドキュメントを参照してください。

テーブル自動作成同期では、スキーマ変更の同期がデフォルトで有効です。現在、Doris にはこれを無効にする SQL プロパティはありません。

## FAQ {#faq}

<!-- Knowledge type: FAQ / troubleshooting -->

### MySQL 接続エラー: Public Key Retrieval is not allowed {#mysql-connection-error-public-key-retrieval-is-not-allowed}

**原因:** 設定した MySQL ユーザーが SHA256 パスワード認証を使用しており、TLS などのプロトコルでパスワードを送信する必要があります。

**解決方法 1:** JDBC URL に `allowPublicKeyRetrieval=true` パラメータを追加します。

```text
jdbc:mysql://127.0.0.1:3306?allowPublicKeyRetrieval=true
```

**解決方法 2:** MySQL ユーザーの認証方式を `mysql_native_password` に変更します。

```sql
ALTER USER 'username'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```
