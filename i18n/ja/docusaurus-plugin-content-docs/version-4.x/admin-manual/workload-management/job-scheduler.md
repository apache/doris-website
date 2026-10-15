---
{
    "title": "ジョブスケジューラ",
    "sidebar_label": "ジョブスケジューラ",
    "language": "ja",
    "description": "Apache Doris のジョブスケジューラは、外部のスケジューリングシステムを使わずに、秒単位の精度でタスクをスケジュールできます。定期的なデータ取り込み、ETL、複数のデータソース間の同期などを自動化できます。",
    "keywords": ["ジョブスケジューラ", "定期タスク", "タスクスケジューリング", "定期実行", "データ同期", "ETL", "Doris 定期タスク"]
}
---

<!-- Knowledge type: Feature overview + Procedure -->

## 概要

Apache Doris に組み込まれた**ジョブスケジューラ**は、あらかじめ定義した計画に従って動作するタスク管理システムです。外部のスケジューリングツールに依存せず、指定した時刻または一定の間隔で SQL 操作を自動的に実行します。バージョン 2.1 以降、ジョブスケジューラは秒単位のスケジューリング精度を備えています。

**主なユースケース：**

- データの定期的な取り込みと ETL 処理による手作業の削減
- Multi-Catalog と組み合わせた、複数のデータソース間での定期的な同期
- 期限切れまたは無効なデータの定期的な削除によるストレージ容量の確保
- 非同期マテリアライズドビューの定期的な更新

**主な機能：**

| 機能 | 説明 |
|------|------|
| 秒単位の精度 | TimingWheel アルゴリズムを使用し、秒単位の精度でイベントをトリガーします |
| 柔軟なスケジューリング | 一度きりの実行と繰り返し実行の両方に対応し、繰り返しジョブには開始時刻と終了時刻を任意で指定できます |
| 高性能なキュー | Disruptor を基盤とする高性能なプロデューサー・コンシューマーモデルにより、実行の過負荷を防ぎます |
| 追跡可能な実行記録 | 最近の Task 実行記録を保持し（保持件数は設定可能）、コマンドで照会できます |
| 高可用性 | Doris 自体の高可用性機構を利用し、障害からの自動復旧に対応します |

**関連ドキュメント：** [CREATE JOB](../../sql-manual/sql-statements/job/CREATE-JOB)

---

## 構文

<!-- Knowledge type: Reference -->

ジョブを作成するステートメントは、次の三つの部分で構成されます。

```sql
CREATE JOB job_name
    ON SCHEDULE schedule
    [COMMENT 'string']
    DO execute_sql;

schedule: {
    AT timestamp
    | EVERY interval
      [STARTS timestamp]
      [ENDS timestamp]
}

interval:
    quantity { WEEK | DAY | HOUR | MINUTE }
```

**構文の構成要素：**

| 句 | 説明 |
|------|------|
| `CREATE JOB job_name` | データベース内でタスクを一意に識別するジョブ名を指定します |
| `ON SCHEDULE AT timestamp` | 一度きりのスケジュールです。指定した時刻に一度実行します。すぐに実行するには `CURRENT_TIMESTAMP` を使用します |
| `ON SCHEDULE EVERY interval` | 繰り返し実行するスケジュールです。指定した間隔で実行を繰り返します |
| `STARTS timestamp` | （任意）繰り返し実行の開始時刻です。すぐに開始するには `CURRENT_TIMESTAMP` を使用します |
| `ENDS timestamp` | （任意）繰り返し実行の終了時刻です |
| `DO execute_sql` | トリガー時に実行する SQL ステートメントです（現在サポートされているのは INSERT ステートメントのみです） |

**指定できる間隔の単位：** `WEEK`、`DAY`、`HOUR`、`MINUTE`

---

## 例

<!-- Knowledge type: Procedure -->

### 一度きりのタスク

2025-01-01 00:00:00 に一度実行し、`db2.tbl2` のデータを `db1.tbl1` に取り込みます。

```sql
CREATE JOB my_job
    ON SCHEDULE AT '2025-01-01 00:00:00'
    DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

### 繰り返し実行するタスク（終了時刻なし）

2025-01-01 00:00:00 から、増分データを毎日一度取り込みます。

```sql
CREATE JOB my_job
    ON SCHEDULE EVERY 1 DAY
    STARTS '2025-01-01 00:00:00'
    DO INSERT INTO db1.tbl1
       SELECT * FROM db2.tbl2
       WHERE create_time >= days_add(now(), -1);
```

### 繰り返し実行するタスク（終了時刻あり）

2025-01-01 から毎日データを取り込み、2026-01-01 00:10:00 に自動的に停止します。

```sql
CREATE JOB my_job
    ON SCHEDULE EVERY 1 DAY
    STARTS '2025-01-01 00:00:00'
    ENDS '2026-01-01 00:10:00'
    DO INSERT INTO db1.tbl1
       SELECT * FROM db2.tbl2
       WHERE create_time >= days_add(now(), -1);
```

### 非同期実行

ジョブの作成は Doris 内で同期的に行われますが、実際の実行は非同期です。このため、実行に時間のかかる `INSERT INTO SELECT` 操作などの非同期タスクに適しています。

開始時刻を `CURRENT_TIMESTAMP` に設定すると、ジョブは作成直後に非同期で実行されます。

```sql
CREATE JOB my_job
    ON SCHEDULE AT CURRENT_TIMESTAMP
    DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

---

## Catalog とジョブスケジューラによるデータの自動同期

<!-- Knowledge type: Procedure -->

EC サイトを例に、MySQL から業務データを定期的に抽出し、精緻なマーケティングのための分析に使えるよう Doris に同期する場合を考えます。ジョブスケジューラと Multi-Catalog を組み合わせると、データソース間の定期的な同期を効率よく実行できます。

**ステップ 1：MySQL のソースデータを準備する**

MySQL に次のユーザーアクティビティテーブルがあるとします。

```sql
CREATE TABLE IF NOT EXISTS user.activity (
    `user_id`        INT      NOT NULL,
    `date`           DATE     NOT NULL,
    `city`           VARCHAR(20),
    `age`            SMALLINT,
    `sex`            TINYINT,
    `last_visit_date` DATETIME DEFAULT '1970-01-01 00:00:00',
    `cost`           BIGINT   DEFAULT '0',
    `max_dwell_time` INT      DEFAULT '0',
    `min_dwell_time` INT      DEFAULT '99999'
);

INSERT INTO user.activity VALUES
    (10000, '2017-10-01', 'Beijing',   20, 0, '2017-10-01 06:00:00', 20,  10, 10),
    (10000, '2017-10-01', 'Beijing',   20, 0, '2017-10-01 07:00:00', 15,  2,  2),
    (10001, '2017-10-01', 'Beijing',   30, 1, '2017-10-01 17:05:00', 2,   22, 22),
    (10002, '2017-10-02', 'Shanghai',  20, 1, '2017-10-02 12:59:00', 200, 5,  5),
    (10003, '2017-10-02', 'Guangzhou', 32, 0, '2017-10-02 11:20:00', 30,  11, 11),
    (10004, '2017-10-01', 'Shenzhen',  35, 0, '2017-10-01 10:00:00', 100, 3,  3),
    (10004, '2017-10-03', 'Shenzhen',  35, 0, '2017-10-03 10:20:00', 11,  6,  6);
```

| user_id | date       | city      | age | sex | last_visit_date     | cost | max_dwell_time | min_dwell_time |
|---------|------------|-----------|-----|-----|---------------------|------|----------------|----------------|
| 10000   | 2017-10-01 | Beijing   | 20  | 0   | 2017-10-01 06:00:00 | 20   | 10             | 10             |
| 10000   | 2017-10-01 | Beijing   | 20  | 0   | 2017-10-01 07:00:00 | 15   | 2              | 2              |
| 10001   | 2017-10-01 | Beijing   | 30  | 1   | 2017-10-01 17:05:00 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | Shanghai  | 20  | 1   | 2017-10-02 12:59:00 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | Guangzhou | 32  | 0   | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | Shenzhen  | 35  | 0   | 2017-10-01 10:00:00 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | Shenzhen  | 35  | 0   | 2017-10-03 10:20:00 | 11   | 6              | 6              |

目的は、支出額、訪問時間、性別、都市の条件に合うユーザーを抽出し、後続のパーソナライズされたレコメンデーションに使用できるよう Doris に取り込むことです。

**ステップ 2：Doris にターゲットテーブルを作成する**

```sql
CREATE TABLE IF NOT EXISTS user_activity (
    `user_id`        LARGEINT NOT NULL COMMENT "User id",
    `date`           DATE     NOT NULL COMMENT "Data ingestion date",
    `city`           VARCHAR(20)      COMMENT "User city",
    `age`            SMALLINT         COMMENT "User age",
    `sex`            TINYINT          COMMENT "User gender",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "Last visit time",
    `cost`           BIGINT SUM DEFAULT "0"     COMMENT "Total spending",
    `max_dwell_time` INT    MAX DEFAULT "0"     COMMENT "Maximum dwell time",
    `min_dwell_time` INT    MIN DEFAULT "99999" COMMENT "Minimum dwell time"
)
AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**ステップ 3：MySQL Catalog を作成する**

```sql
CREATE CATALOG activity PROPERTIES (
    "type"       = "jdbc",
    "user"       = "root",
    "password"   = "123456",
    "jdbc_url"   = "jdbc:mysql://127.0.0.1:3306/user?useSSL=false",
    "driver_url" = "mysql-connector-java-5.1.49.jar",
    "driver_class" = "com.mysql.jdbc.Driver"
);
```

**ステップ 4：データ同期を行うスケジュールジョブを作成する**

全量取り込みはシステムの負荷を変動させる可能性があるため、通常は早朝などの負荷が低い時間帯にスケジュールします。

- **一度きりのスケジュール**（全量取り込み、午前 3:00 に一度実行）：

    ```sql
    CREATE JOB one_time_load_job
        ON SCHEDULE AT '2024-08-10 03:00:00'
        DO INSERT INTO user_activity
           SELECT * FROM activity.user.activity;
    ```

- **繰り返し実行するスケジュール**（最新データを毎日増分同期）：

    ```sql
    CREATE JOB schedule_load
        ON SCHEDULE EVERY 1 DAY
        DO INSERT INTO user_activity
           SELECT * FROM activity.user.activity
           WHERE last_visit_date >= days_add(now(), -1);
    ```

---

## 設計と実装

<!-- Knowledge type: Concept -->

高精度なスケジューリングには、リソース消費が増えるという課題があります。従来の Java のスケジュールスレッドを使う方法では、スケジューリング精度とメモリ使用量の両面で限界があります。ジョブスケジューラは、**TimingWheel アルゴリズムと Disruptor** を組み合わせ、リソース消費を抑えながら高い性能を実現します。

**主な仕組み：**

1. **タイミングホイールによるトリガー**：タイミングホイールアルゴリズムは、Netty の `HashedWheelTimer` で実装されています。Job Manager は、今後のイベントを十分ごと（デフォルト）にタイミングホイールへ事前に読み込み、スケジュールします。
2. **Disruptor による振り分け**：タイミングホイールはイベントをトリガーするだけで、タスクを直接実行しません。実行時刻になったタスクはまず Dispatch スレッドに入り、対応する実行スレッドプールに転送されます。即時実行が必要なタスクは、実行スレッドプールに直接渡されます。
3. **イベントのライフサイクル管理**：一度きりのタスクでは、スケジューリングが完了するとイベント定義が自動的に削除されます。繰り返し実行するタスクでは、タイミングホイールが次のサイクルの実行計画を定期的に取得します。これにより、同じバケットに多数のタスクが集中するのを防ぎ、処理効率を高めます。
4. **トランザクションの整合性**：トランザクションを伴うタスクに対して、ジョブスケジューラはトランザクションとの強い関連付けとコールバック機構を使用します。これにより、タスクの実行結果が期待どおりになり、データの整合性が維持されます。

---

## ロードマップ

<!-- Knowledge type: Roadmap -->

ジョブスケジューラは、非同期マテリアライズドビューの利用にも重要な役割を果たします。ソーステーブルのデータが頻繁に変わる場合、ジョブスケジューラがマテリアライズドビューの更新を定期的にトリガーし、ビューとソースの整合性を保ちます。

今後のリリースでは、次の機能が計画されています。

- **タスク実行状況の可視化**：時間帯ごとのタスク実行状況を確認できる UI。
- **DAG ワークフローのオーケストレーション**：Doris 内でデータウェアハウスのタスク間の依存関係を調整できる JOB ワークフローオーケストレーション（DAG JOB）。Catalog と組み合わせることで、データの処理と分析をより効率的に行えます。
- **対応する操作の拡大**：UPDATE や DELETE などの操作をスケジュールして実行できるようにします。
