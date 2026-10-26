---
{
    "title": "継続的なデータロードの概要",
    "language": "ja",
    "sidebar_label": "概要",
    "description": "MySQL、PostgreSQL、OceanBase、S3 に対応する Doris Streaming Job の継続的なデータロードについて、同期方式の選択、ジョブの状態、一般的な操作を説明します。",
    "keywords": [
        "Doris continuous load",
        "Streaming Job",
        "MySQL real-time sync",
        "PostgreSQL real-time sync",
        "OceanBase real-time sync",
        "S3 continuous load",
        "SQL Mapping Sync",
        "Auto Table Creation Sync",
        "exactly-once",
        "at-least-once",
        "autoResume"
    ]
}
---

<!-- ナレッジの種類: 機能の概要とアーキテクチャの選択 -->
<!-- 適用シナリオ: リアルタイムのデータ取り込み方式の選択 / 継続的なデータロードの運用 -->

Doris は **Streaming Job** を使用して、複数のデータソースから Doris テーブルへデータを継続的にロードできます。ジョブを送信すると、Doris はデータロードジョブを実行し続け、ソースからリアルタイムでデータを読み取って Doris テーブルに書き込みます。

:::tip
この機能はバージョン 4.1.0 以降でサポートされています。
:::

このドキュメントでは、次の疑問に答えます。

- 継続的なデータロードは、どのデータソースと同期モードに対応していますか？
- SQL Mapping Sync と Auto Table Creation Sync はどのように選べばよいですか？
- ジョブの状態はどのように遷移し、自動復旧はどのように機能しますか？
- 日常の運用で、データロードジョブの確認、一時停止、再開、削除はどのように行いますか？
- FE とジョブでよく使う設定パラメータは何ですか？

## 対応するデータソースと同期モード {#supported-data-sources-and-sync-modes}

継続的なデータロードは、次のデータソースと同期モードに対応しています。

| データソース | 対応バージョン | SQL Mapping Sync | Auto Table Creation Sync | 設定ガイド |
| :---------- | :----------------- | :---------------------------------------------------------------- | :---------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| MySQL | 5.6, 5.7, 8.0.x | [SQL Mapping を使用した MySQL CDC](./continuous-load-mysql-table.md) | [Auto Table Creation を使用した MySQL CDC](./continuous-load-mysql-database.md) | [Amazon RDS MySQL](./prerequisites/amazon-rds-mysql.md) · [Amazon Aurora MySQL](./prerequisites/amazon-aurora-mysql.md) |
| PostgreSQL | 14, 15, 16, 17 | [SQL Mapping を使用した PostgreSQL CDC](./continuous-load-postgresql-table.md) | [Auto Table Creation を使用した PostgreSQL CDC](./continuous-load-postgresql-database.md) | [Amazon RDS PostgreSQL](./prerequisites/amazon-rds-postgresql.md) · [Amazon Aurora PostgreSQL](./prerequisites/amazon-aurora-postgresql.md) |
| OceanBase | MySQL 互換モード | - | [Auto Table Creation を使用した OceanBase CDC](./continuous-load-oceanbase-database.md)（バージョン 4.1.4 以降） | - |
| S3 | - | [S3 の継続的なデータロード](./continuous-load-s3.md) | - | - |

ソース側のカラム型から Doris の型への対応については、[MySQL](./data-type-mapping-mysql.md)、[PostgreSQL](./data-type-mapping-postgresql.md)、[OceanBase](./data-type-mapping-oceanbase.md) のデータ型マッピングを参照してください。

## 同期方式の選び方 {#how-to-choose-a-sync-method}

<!-- ナレッジの種類: アーキテクチャの選択 -->

SQL Mapping Sync と Auto Table Creation Sync は、**基盤となる仕組みがまったく異なる**継続的なデータロード方式です。違いは「テーブル数」だけではありません。**Auto Table Creation Sync でも `include_tables` を使用して単一のテーブルだけを同期できます**。必要な機能に基づいて選択してください。

### 機能の比較 {#capability-comparison}

| 機能 | SQL Mapping Sync | Auto Table Creation Sync |
| :----------------- | :-------------------------------------------------------------- | :------------------------------------------------- |
| 基盤となる仕組み | Job + TVF（`INSERT INTO tbl SELECT * FROM tvf()`） | Job + データベース全体を対象とするネイティブ DDL（`FROM src TO DATABASE db`） |
| 同期先の単位 | 既存の Doris テーブル | Doris のデータベースコンテナ |
| 同期範囲 | 単一のテーブル | 単一のテーブルからデータベース内の複数のテーブルまで（`include_tables` で制御） |
| テーブルの自動作成 | テーブルを事前に作成する必要がある | 初回同期時に主キーテーブルを自動作成する |
| SQL の柔軟性 | カラムのマッピング、フィルタリング、変換（SELECT 句）に対応 | データをそのままコピーし、ETL には対応しない |
| セマンティクスの保証 | exactly-once | at-least-once |
| 必要な権限 | Load | Load + Create（テーブルを自動作成する場合） |
| 代表的な用途 | カラムの選択、フィールド名の変更、型変換、条件によるフィルタリングが必要なリアルタイム同期 | 同期先のテーブルスキーマをソース側に自動追従させたい場合の、データベース全体またはテーブル群のミラーリング |

### 選択の目安 {#selection-recommendations}

- **データに SQL による処理を適用する必要がある、または exactly-once セマンティクスが厳密に必要** → **SQL Mapping Sync** を選択
- **Doris にテーブルを自動作成させ、単一の設定でテーブル群を同期したい** → **Auto Table Creation Sync** を選択
- **データソースが OceanBase** → 現時点では MySQL 互換モードの Auto Table Creation Sync のみ対応
- **データソースが S3 オブジェクトストレージ** → S3 TVF を使用する SQL Mapping Sync のみ対応

## ジョブの状態遷移 {#job-state-transitions}

<!-- ナレッジの種類: 実行時の仕組み -->

Streaming Job は実行中に次の状態を遷移します。**SQL Mapping Sync と Auto Table Creation Sync は同じ状態遷移に従います**。

![ジョブの状態遷移](/images/next/data-operate/streaming-job/job-state-flow.jpg)

### 状態の説明 {#state-descriptions}

| 状態 | 意味 |
| :----------- | :----------------------------------------------------------------------------------------------------------------------- |
| **PENDING** | ジョブは作成済みですが、まだサブタスクはスケジュールされていません。次のスケジューリング周期で `StreamingTask` が作成されるのを待っています。 |
| **RUNNING** | サブタスクが作成されて実行中です。ソースから増分データを読み取り、Doris に書き込んでいます。 |
| **FINISHED** | ソースのデータをすべて処理し、ジョブが終了しました。S3 TVF ジョブは、すべてのファイルのデータロードが完了するとこの状態になります。 |
| **PAUSED** | サブタスクが失敗し、ジョブが自動的に一時停止され、`failReason` が記録されています。原因は、`ErrorMsg` フィールド（`select * from jobs(...)` の結果）で確認できます。 |

### 自動復旧（autoResume） {#automatic-recovery-autoresume}

ジョブが `PAUSED` になると、スケジューラは**指数バックオフ方式**で定期的に復旧を試みます。復旧すると、ジョブは `PENDING` に戻り、サブタスクの作成を続けます。**手動操作は不要です。ネットワークの一時的な不安定さやソース側の短時間の停止などは、自動的に吸収されます。**

状況に応じて、次のコマンドを使用します。

- **すぐに再開する、または問題を解決した後に手動で開始する**: [`RESUME JOB`](#resume-a-load-job) を使用
- **完全に停止し、以後スケジュールしない**: [`PAUSE JOB`](#pause-a-load-job)（手動で一時停止したジョブは autoResume によって再開されません）または [`DROP JOB`](#delete-a-load-job) を使用

### CDC タスクの実行ユーザーと失敗時の処理 {#cdc-task-identity-and-failure-handling}

4.1.5 以降、Streaming CDC は、固定の管理者ユーザーではなく、ジョブ作成者の Doris ユーザーとして書き込み、テーブルメタデータのクエリ、スキーマ変更を行います。作成者には、対象テーブルに対する `LOAD`、テーブルの自動作成に必要な `CREATE`、およびスキーマ同期に必要な `ALTER` とテーブルの参照権限が必要です。実行中に権限を取り消すと、後続のタスクにも影響します。ジョブに記録された作成者の権限を確認してください。

`cdc_stream()` に基づく Streaming INSERT タスクが失敗しても、通常のタスク再試行処理には入りません。`jobs()` と `tasks()` でエラーを確認し、ソースまたは権限の問題を解決したうえで、ジョブの状態に応じて再開してください。失敗したタスクが自動的に再実行されると想定しないでください。

## 一般的な操作 {#common-operations}

<!-- ナレッジの種類: 運用手順 -->

### データロードの状態を確認する {#view-load-status}

Streaming タイプの Insert Job をすべてクエリします。

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

結果のカラムは次のとおりです。

| カラム | 説明 |
| ----------------- | ------------------------------------------------------------------------ |
| ID | ジョブ ID |
| NAME | ジョブ名 |
| Definer | ジョブの定義者 |
| ExecuteType | ジョブのスケジューリング種別: *ONE_TIME/RECURRING/STREAMING/MANUAL* |
| RecurringStrategy | 繰り返し実行の戦略。通常の Insert で使用されます。ExecuteType=Streaming の場合は空です |
| Status | ジョブの状態 |
| ExecuteSql | ジョブの Insert SQL 文 |
| CreateTime | ジョブの作成時刻 |
| SucceedTaskCount | 成功したタスクの数 |
| FailedTaskCount | 失敗したタスクの数 |
| CanceledTaskCount | キャンセルされたタスクの数 |
| Comment | ジョブのコメント |
| Properties | ジョブのプロパティ |
| CurrentOffset | ジョブが処理を完了したオフセット。ExecuteType=Streaming の場合のみ設定されます |
| EndOffset | データソースから取得した最大の EndOffset。ExecuteType=Streaming の場合のみ設定されます |
| LoadStatistic | ジョブの統計情報 |
| ErrorMsg | ジョブのエラーメッセージ |
| JobRuntimeMsg | ジョブの実行時のヒント |
| LagBytes | ソースログ（MySQL / OceanBase の binlog または PostgreSQL の WAL）に残っている未処理データのバイト数。`-1` は、S3 データソースの場合やフルスナップショットの段階など、現在値を取得できないことを意味します。**バージョン 4.1.4 以降**、このカラムは従来の `Lag` カラム（単位: 秒）に代わり、バイト単位で報告されます |
| LastSourceEventTimestamp | コミット済みオフセットに記録された最新のソースイベントのタイムスタンプ（Unix 秒）。取得できない場合は空です。**バージョン 4.1.4 で追加** |
| LastTaskSuccessTime | 直近のタスクが正常に完了した時刻 |

### タスクの状態を確認する {#view-task-status}

ジョブ ID を指定して、そのジョブに属するすべてのサブタスクをクエリします。

```sql
select * from tasks("type"="insert") where jobId='<job_id>';
```

結果のカラムは次のとおりです。

| カラム | 説明 |
| ------------- | -------------------------------------------------------------------- |
| TaskId | タスク ID |
| JobID | ジョブ ID |
| JobName | ジョブ名 |
| Label | タスクがデータロードに使用するラベル |
| Status | タスクの状態 |
| ErrorMsg | タスクの失敗メッセージ |
| CreateTime | タスクの作成時刻 |
| StartTime | タスクの開始時刻 |
| FinishTime | タスクの終了時刻 |
| LoadStatistic | タスクの統計情報 |
| User | タスクの実行ユーザー |
| RunningOffset | タスクが現在同期しているオフセット情報。Job.ExecuteType=Streaming の場合のみ設定されます |

### データロードジョブを一時停止する {#pause-a-load-job}

指定したジョブを手動で一時停止します（一時停止したジョブは autoResume によって再開されません）。

```sql
PAUSE JOB WHERE jobname = <job_name>;
```

### データロードジョブを再開する {#resume-a-load-job}

`PAUSED` 状態のジョブを再開します。

```sql
RESUME JOB WHERE jobName = <job_name>;
```

### データロードジョブを削除する {#delete-a-load-job}

指定したジョブを完全に削除します。削除後、そのジョブはスケジュールされなくなります。

```sql
DROP JOB WHERE jobName = <job_name>;
```

## 共通パラメータ {#common-parameters}

<!-- ナレッジの種類: 設定パラメータ -->

### FE の設定パラメータ {#fe-configuration-parameters}

| パラメータ | デフォルト値 | 説明 |
| ------------------------------------ | ------- | ------------------------------------------------- |
| max_streaming_job_num | 1024 | Streaming ジョブの最大数 |
| job_streaming_task_exec_thread_num | 10 | StreamingTask の実行に使用するスレッド数 |
| max_streaming_task_show_count | 100 | メモリに保持する StreamingTask の実行記録の最大数 |

### ジョブの共通データロード設定パラメータ {#job-common-load-configuration-parameters}

| パラメータ | デフォルト値 | 説明 |
| ------------ | ------- | ------------------------------------------------------ |
| max_interval | 10 | ソース側に新しいデータがない場合の、アイドル時のスケジューリング間隔（秒）。指定できるのは秒数を表す整数（例: `10`）のみで、`10s` のような単位の接尾辞は使用できません。1 以上を指定する必要があります。 |

## 制限事項 {#limitations}

<!-- ナレッジの種類: 制限事項 / 非対応の範囲 -->

同期範囲、テーブルの自動作成、セマンティクスの保証（exactly-once / at-least-once）については、[機能の比較](#capability-comparison)を参照してください。このセクションでは、**対応していない**制約や動作のみを説明します。

### 主キーテーブル {#primary-key-tables}

どちらの同期方式でも、同期できるのは**主キーを持つ**ソース側のテーブルだけです。対応する Doris テーブルは **Unique Key** テーブルである必要があります。Auto Table Creation Sync では自動作成され、SQL Mapping Sync ではユーザーが作成します。主キーのないテーブルには対応していません。

### スキーマ変更（DDL） {#schema-change-ddl}

DDL 同期が適用されるのは **Auto Table Creation Sync のみ**です。SQL Mapping（TVF）では DDL は同期されません。`cdc_stream()` テーブル関数は常に `schema_change_enabled` を `false` に設定します。

- **PostgreSQL**（4.1 以降で対応）: 同期されるのは `ADD COLUMN` と `DROP COLUMN` のみです。**カラム型の変更、`RENAME COLUMN`、制約 / インデックス / パーティションの変更は同期されません**。Doris で手動で適用してください。
- **MySQL**（4.1.4 以降で対応）: 同期されるのは `ADD COLUMN` と `DROP COLUMN` のみです。**カラム型の変更、`RENAME COLUMN`、制約 / インデックス / パーティションの変更は同期されません**。Doris で手動で適用してください。
- **OceanBase**（4.1.4 以降で対応）: 同期されるのは `ADD COLUMN` と `DROP COLUMN` のみです。**カラム型の変更、`RENAME COLUMN`、主キー / 制約 / インデックス / パーティションの変更は同期されません**。Doris で手動で適用してください。

Auto Table Creation Sync では、スキーマ変更の同期がデフォルトで有効です。現在、Doris 4.1 にはこれを無効にする SQL プロパティはありません。

:::caution 動作の変更（4.1.4）

- バージョン 4.1.4 以降、追加されたカラムには、ソース側のカラムの `DEFAULT` 値が**引き継がれません**（MySQL、PostgreSQL、OceanBase）。Doris では新しいカラムにデフォルト値が設定されず、過去の行も補完されません。
- PostgreSQL のスキーマ変更検出は、Relation イベントに基づくようになりました。認識されるのは `ADD COLUMN` と `DROP COLUMN` のみです。カラムの追加と削除を同時に行う変更（`RENAME` の可能性があるもの）や、カラム型の変更はスキップされます。この機能が適用されるのは Auto Table Creation Sync（at-least-once）の経路のみで、TVF / exactly-once の経路には対応していません。

:::

## よくある質問 {#faq}

<!-- ナレッジの種類: FAQ / トラブルシューティング -->

### MySQL 接続エラー: Public Key Retrieval is not allowed {#mysql-connection-error-public-key-retrieval-is-not-allowed}

**原因:** 設定された MySQL ユーザーは SHA256 パスワード認証を使用しています。この認証方式では、TLS などのプロトコルでパスワードを送信する必要があります。

**解決方法 1:** JDBC URL に `allowPublicKeyRetrieval=true` パラメータを追加します。

```
jdbc:mysql://127.0.0.1:3306?allowPublicKeyRetrieval=true
```

**解決方法 2:** MySQL ユーザーの認証方式を `mysql_native_password` に変更します。

```sql
ALTER USER 'username'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```
