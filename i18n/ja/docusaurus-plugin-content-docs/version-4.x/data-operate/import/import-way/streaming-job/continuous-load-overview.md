---
{
    "title": "継続的なロードの概要",
    "language": "ja",
    "sidebar_label": "概要",
    "description": "MySQL、PostgreSQL、OceanBase、S3 に対応する Doris Streaming Job の継続的なロードについて、同期方式の選択、ジョブの状態、一般的な操作を説明します。",
    "keywords": [
        "Doris の継続的なロード",
        "Streaming Job",
        "MySQL のリアルタイム同期",
        "PostgreSQL のリアルタイム同期",
        "OceanBase のリアルタイム同期",
        "S3 の継続的なロード",
        "SQL Mapping Sync",
        "Auto Table Creation Sync",
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

- 継続的なロードでサポートされるデータソースと同期モードは何ですか？
- SQL Mapping Sync と Auto Table Creation Sync はどのように選択しますか？
- ジョブの状態はどのように遷移し、自動復旧はどのように動作しますか？
- 日常の運用でロードジョブを表示、一時停止、再開、削除するにはどうしますか？
- 一般的な FE とジョブの設定パラメータは何ですか？

## サポートされるデータソースと同期モード

継続的なロードでは、次のデータソースと同期モードがサポートされます。

| データソース | サポート対象バージョン | SQL Mapping Sync | Auto Table Creation Sync | 設定ガイド |
| :---------- | :--------------------- | :--------------- | :----------------------- | :--------- |
| MySQL       | 5.6, 5.7, 8.0.x        | [SQL Mapping を使用した MySQL CDC](./continuous-load-mysql-table.md) | [テーブルの自動作成を使用した MySQL CDC](./continuous-load-mysql-database.md) | [Amazon RDS MySQL](./prerequisites/amazon-rds-mysql.md) · [Amazon Aurora MySQL](./prerequisites/amazon-aurora-mysql.md) |
| PostgreSQL  | 14, 15, 16, 17         | [SQL Mapping を使用した PostgreSQL CDC](./continuous-load-postgresql-table.md) | [テーブルの自動作成を使用した PostgreSQL CDC](./continuous-load-postgresql-database.md) | [Amazon RDS PostgreSQL](./prerequisites/amazon-rds-postgresql.md) · [Amazon Aurora PostgreSQL](./prerequisites/amazon-aurora-postgresql.md) |
| OceanBase   | MySQL 互換モード        | - | [テーブルの自動作成を使用した OceanBase CDC](./continuous-load-oceanbase-database.md)（バージョン 4.1.4 以降） | - |
| S3          | -                      | [S3 の継続的なロード](./continuous-load-s3.md) | - | - |

上流のカラム型と Doris の型との対応については、[MySQL](./data-type-mapping-mysql.md)、[PostgreSQL](./data-type-mapping-postgresql.md)、[OceanBase](./data-type-mapping-oceanbase.md) のデータ型マッピングを参照してください。

## 同期方式の選択方法

<!-- Knowledge type: Architecture selection decision -->

SQL Mapping Sync と Auto Table Creation Sync は、**基盤となる仕組みがまったく異なる** 二つの継続的なロード方式です。「テーブル数」の違いではありません。**Auto Table Creation Sync でも `include_tables` を使用して単一テーブルだけを同期できます**。そのため、必要な機能に基づいて選択してください。

### 機能比較 {#capability-comparison}

| 項目 | SQL Mapping Sync | Auto Table Creation Sync |
| :--- | :--------------- | :----------------------- |
| 基盤となる仕組み | Job + TVF（`INSERT INTO tbl SELECT * FROM tvf()`） | Job + データベース全体を対象とするネイティブ DDL（`FROM src TO DATABASE db`） |
| 同期先の単位 | 既存の Doris テーブル | Doris データベースのコンテナ |
| 同期範囲 | 単一テーブル | 単一テーブルからデータベース全体までの複数テーブル（`include_tables` で制御） |
| テーブルの自動作成 | テーブルを事前に作成する必要がある | 初回同期時にプライマリキーテーブルを自動作成する |
| SQL の柔軟性 | カラムのマッピング、フィルタリング、変換（SELECT 句）をサポートする | データをそのままコピーし、ETL はサポートしない |
| セマンティクスの保証 | exactly-once | at-least-once |
| 必要な権限 | Load | Load + Create（テーブルを自動作成する場合） |
| 主な用途 | カラムの削減、フィールド名の変更、型変換、条件付きフィルタリングを必要とするリアルタイム同期 | 下流のテーブルスキーマを上流に自動追従させる、データベース全体または複数テーブルのミラー複製 |

### 選択の指針

- **データに SQL による処理を適用する必要がある、または exactly-once セマンティクスが厳密に必要な場合** → **SQL Mapping Sync** を選択します。
- **Doris にテーブルを自動作成させ、一つの設定で複数のテーブルを同期したい場合** → **Auto Table Creation Sync** を選択します。
- **データソースが OceanBase の場合** → 現在は MySQL 互換モードの Auto Table Creation Sync のみがサポートされます。
- **データソースが S3 オブジェクトストレージの場合** → SQL Mapping Sync のみがサポートされます（S3 TVF を使用）。

## ジョブの状態遷移

<!-- Knowledge type: Runtime mechanism -->

Streaming Job は実行中に次の状態間を遷移します。**SQL Mapping Sync と Auto Table Creation Sync は同じ状態遷移に従います**。

![ジョブの状態遷移](/images/next/data-operate/streaming-job/job-state-flow.jpg)

### 状態の説明

| 状態 | 意味 |
| :--- | :--- |
| **PENDING** | ジョブは作成されましたが、まだサブタスクはスケジュールされていません。次のスケジューリング周期で `StreamingTask` が作成されるのを待っています。 |
| **RUNNING** | サブタスクが生成され、実行中です。ソースから増分データを読み取り、Doris に書き込みます。 |
| **FINISHED** | ソースのデータをすべて読み取り、ジョブが終了した状態です。S3 TVF ジョブは、すべてのファイルをロードするとこの状態になります。 |
| **PAUSED** | サブタスクが失敗し、ジョブが自動的に一時停止されて `failReason` が記録された状態です。`ErrorMsg` フィールドを `select * from jobs(...)` で確認すると、原因が分かります。 |

### 自動復旧（autoResume）

ジョブが `PAUSED` 状態になると、スケジューラは **指数バックオフ方式** で定期的に復旧を試みます。復旧すると、ジョブは `PENDING` に戻り、サブタスクの作成を続けます。**手動操作は不要です。ネットワークの一時的な不安定さや上流の短時間の停止など、一過性の障害から自動的に復旧します。**

状況に応じて、次のコマンドを使用します。

- **すぐに再開する場合、または問題を調査した後に手動で開始する場合**：[`RESUME JOB`](#resume-a-load-job) を使用します。
- **完全に停止し、以降スケジュールしない場合**：[`PAUSE JOB`](#pause-a-load-job)（手動で一時停止したジョブは autoResume によって再開されません）または [`DROP JOB`](#delete-a-load-job) を使用します。

## 一般的な操作

<!-- Knowledge type: Operational steps -->

### ロードの状態を表示する

Streaming タイプのすべての Insert Job を照会します。

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

結果のカラムは次のとおりです。

| カラム | 説明 |
| ------ | ---- |
| ID | ジョブ ID |
| NAME | ジョブ名 |
| Definer | ジョブの定義者 |
| ExecuteType | ジョブのスケジューリング種別：*ONE_TIME/RECURRING/STREAMING/MANUAL* |
| RecurringStrategy | 繰り返し実行の方式。通常の Insert で使用します。ExecuteType=Streaming の場合は空です。 |
| Status | ジョブの状態 |
| ExecuteSql | ジョブの Insert SQL 文 |
| CreateTime | ジョブの作成時刻 |
| SucceedTaskCount | 成功したタスクの数 |
| FailedTaskCount | 失敗したタスクの数 |
| CanceledTaskCount | キャンセルされたタスクの数 |
| Comment | ジョブのコメント |
| Properties | ジョブのプロパティ |
| CurrentOffset | ジョブが処理を完了したオフセット。ExecuteType=Streaming の場合にのみ設定されます。 |
| EndOffset | データソースから取得した最大の EndOffset。ExecuteType=Streaming の場合にのみ設定されます。 |
| LoadStatistic | ジョブの統計情報 |
| ErrorMsg | ジョブのエラーメッセージ |
| JobRuntimeMsg | ジョブ実行時のヒント |
| LagBytes | ソースログ（MySQL / OceanBase の binlog または PostgreSQL の WAL）に残っている未処理データのバイト数。`-1` は、S3 データソースの場合やフルスナップショットのフェーズ中など、現在値を取得できないことを示します。**バージョン 4.1.4 以降**、このカラムは従来の `Lag` カラム（秒単位）に代わり、バイト単位で報告されます。 |
| LastSourceEventTimestamp | コミット済みオフセットに記録された最新のソースイベントのタイムスタンプ（Unix 秒）。取得できない場合は空です。**バージョン 4.1.4 で追加されました。** |
| LastTaskSuccessTime | 直近のタスクが正常に完了した時刻 |

### タスクの状態を表示する

ジョブ ID を使用して、ジョブに属するすべてのサブタスクを照会します。

```sql
select * from tasks("type"="insert") where jobId='<job_id>';
```

結果のカラムは次のとおりです。

| カラム | 説明 |
| ------ | ---- |
| TaskId | タスク ID |
| JobID | ジョブ ID |
| JobName | ジョブ名 |
| Label | タスクがロードに使用するラベル |
| Status | タスクの状態 |
| ErrorMsg | タスクの失敗を示すメッセージ |
| CreateTime | タスクの作成時刻 |
| StartTime | タスクの開始時刻 |
| FinishTime | タスクの終了時刻 |
| LoadStatistic | タスクの統計情報 |
| User | タスクの実行ユーザー |
| RunningOffset | タスクが現在同期しているオフセット情報。Job.ExecuteType=Streaming の場合にのみ設定されます。 |

### ロードジョブを一時停止する {#pause-a-load-job}

指定したジョブを手動で一時停止します（一時停止したジョブは autoResume によって再開されません）。

```sql
PAUSE JOB WHERE jobname = <job_name>;
```

### ロードジョブを再開する {#resume-a-load-job}

`PAUSED` 状態のジョブを再開します。

```sql
RESUME JOB WHERE jobName = <job_name>;
```

### ロードジョブを削除する {#delete-a-load-job}

指定したジョブを完全に削除します。削除後、そのジョブはスケジュールされなくなります。

```sql
DROP JOB WHERE jobName = <job_name>;
```

## 一般的なパラメータ

<!-- Knowledge type: Configuration parameters -->

### FE の設定パラメータ

| パラメータ | デフォルト値 | 説明 |
| ---------- | ------------ | ---- |
| max_streaming_job_num | 1024 | Streaming Job の最大数 |
| job_streaming_task_exec_thread_num | 10 | StreamingTask の実行に使用するスレッド数 |
| max_streaming_task_show_count | 100 | メモリに保持する StreamingTask の実行記録の最大数 |

### ジョブに共通するロード設定パラメータ

| パラメータ | デフォルト値 | 説明 |
| ---------- | ------------ | ---- |
| max_interval | 10 | 上流に新しいデータがない場合の、アイドル時のスケジューリング間隔（秒）。秒数を表す整数のみを指定できます（例：`10`）。`10s` のような単位の接尾辞はサポートされません。1 以上である必要があります。 |

## 制限事項

<!-- Knowledge type: Limitations / unsupported boundaries -->

同期範囲、テーブルの自動作成、セマンティクスの保証（exactly-once / at-least-once）については、[機能比較](#capability-comparison)で説明しています。このセクションでは、**サポートされない** 制約と動作のみを示します。

### プライマリキーテーブル

同期できるのは、**プライマリキーを持つ** 上流テーブルのみです（どちらの同期方式でも同じです）。対応する Doris テーブルは **Unique Key** テーブルです。Auto Table Creation Sync では自動作成され、SQL Mapping Sync ではユーザーが作成します。プライマリキーのないテーブルはサポートされません。

### スキーマ変更（DDL）

DDL の同期は **Auto Table Creation Sync にのみ** 適用されます。SQL Mapping（TVF）では DDL は同期されません。`cdc_stream()` テーブル関数は常に `schema_change_enabled` を `false` に設定します。

- **PostgreSQL**（4.1 以降でサポート）：同期されるのは `ADD COLUMN` と `DROP COLUMN` のみです。**カラム型の変更、`RENAME COLUMN`、制約・インデックス・パーティションの変更は同期されません**。Doris 側で手動で適用してください。
- **MySQL**（4.1.4 以降でサポート）：同期されるのは `ADD COLUMN` と `DROP COLUMN` のみです。**カラム型の変更、`RENAME COLUMN`、制約・インデックス・パーティションの変更は同期されません**。Doris 側で手動で適用してください。
- **OceanBase**（4.1.4 以降でサポート）：同期されるのは `ADD COLUMN` と `DROP COLUMN` のみです。**カラム型の変更、`RENAME COLUMN`、プライマリキー・制約・インデックス・パーティションの変更は同期されません**。Doris 側で手動で適用してください。

Auto Table Creation Sync では、スキーマ変更の同期がデフォルトで有効です。現在の Doris 4.1 には、これを無効にする SQL プロパティはありません。

:::caution 動作の変更（4.1.4）

- バージョン 4.1.4 以降、追加されたカラムには上流カラムの `DEFAULT` 値が**引き継がれません**（MySQL、PostgreSQL、OceanBase）。Doris の新しいカラムにはデフォルト値がなく、過去の行に値は補完されません。
- PostgreSQL のスキーマ変更検出は Relation イベントに基づいて行われるようになりました。認識されるのは `ADD COLUMN` と `DROP COLUMN` のみです。カラムの追加と削除を同時に行う変更（`RENAME` の可能性がある変更）およびカラム型の変更はスキップされます。この機能は Auto Table Creation Sync（at-least-once）経路にのみ適用され、TVF / exactly-once 経路ではサポートされません。

:::

## FAQ

<!-- Knowledge type: FAQ / troubleshooting -->

### MySQL 接続エラー：Public Key Retrieval is not allowed

**原因：** 設定された MySQL ユーザーは SHA256 パスワード認証を使用しており、パスワードを TLS などのプロトコルで送信する必要があります。

**解決方法 1：** JDBC URL に `allowPublicKeyRetrieval=true` パラメータを追加します。

```
jdbc:mysql://127.0.0.1:3306?allowPublicKeyRetrieval=true
```

**解決方法 2：** MySQL ユーザーの認証方式を `mysql_native_password` に変更します。

```sql
ALTER USER 'username'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```
