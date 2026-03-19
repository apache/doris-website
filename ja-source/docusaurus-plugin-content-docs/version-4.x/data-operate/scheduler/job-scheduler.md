---
{
  "title": "Job Scheduler | Scheduler",
  "sidebar_label": "Job Scheduler",
  "description": "データ管理のニーズがますます洗練されている状況において、スケジュールされたタスクは重要な役割を果たします。",
  "language": "ja"
}
---
# Job Scheduler

## 背景

データ管理のニーズがますます精密化する中で、スケジュールされたタスクは重要な役割を果たします。これらは通常、以下のシナリオで適用されます：

- **定期的なデータ更新:** 定期的なデータインポートとETL操作により、手動による介入を削減し、データ処理の効率性と正確性を向上させます。
- **カタログ統合:** 外部データソースの定期的な同期により、マルチソースデータのターゲットシステムへの効率的で正確な統合を確保し、複雑なビジネス分析要件を満たします。
- **データクリーンアップ:** 期限切れ/無効なデータの定期的なクリーニングにより、ストレージスペースを解放し、過度な古いデータによるパフォーマンス問題を防ぎます。

Apache Dorisの以前のバージョンでは、上記の要件を満たすことは、多くの場合、ビジネスコードベースのスケジューリングやサードパーティのスケジューリングツール、分散スケジューリングプラットフォームなどの外部スケジューリングシステムに依存していました。しかし、これらの外部システムは、Dorisの柔軟なスケジューリング戦略とリソース管理ニーズを満たさない可能性があります。さらに、外部スケジューリングシステムの障害は、ビジネスリスクを増大させ、追加のメンテナンス時間と労力を必要とする場合があります。

## Job Scheduler

これらの問題に対処するため、Apache Dorisはバージョン2.1でJob Scheduler機能を導入し、秒レベルの精度での自律的なタスクスケジューリングを可能にしました。

この機能は、データインポートの完全性と一貫性を確保しつつ、ユーザーが柔軟かつ便利にスケジューリング戦略を調整できるようにします。外部システムへの依存を減らすことで、システム障害リスクとメンテナンスコストも削減し、より統一された信頼性の高いユーザーエクスペリエンスを提供します。

## Doris Job Schedulerの機能

Doris Job Schedulerは、事前設定されたスケジュールに基づいて実行されるタスク管理システムで、特定の時間や間隔で事前定義された操作をトリガーし、自動化されたタスク実行を行います。主な機能には以下があります：

- **効率的なスケジューリング:** 指定された間隔内でタスクとイベントをスケジュールでき、効率的なデータ処理を確保します。タイムホイールアルゴリズムにより、正確な秒レベルのトリガーを保証します。
- **柔軟なスケジューリング:** 分、時間、日、週単位でのスケジューリングなど、複数のスケジューリングオプションが利用可能です。1回限りのスケジューリングと繰り返し（循環）イベントスケジューリングをサポートし、循環スケジュールの開始時間と終了時間をカスタマイズできます。
- **イベントプールと高性能処理キュー:** Disruptorを使用して実装され、高性能なプロデューサー・コンシューマーモデルを実現し、タスク実行のオーバーヘッドを最小化します。
- **追跡可能なスケジューリング記録:** 最新のタスク実行記録を保存し（設定可能）、シンプルなコマンドで表示できるため、追跡可能性を確保します。
- **高可用性:** Dorisの高可用性メカニズムを活用し、Job Schedulerは自己回復と高可用性を容易に実現できます。

**関連ドキュメント:** [CREATE-JOB](../../sql-manual/sql-statements/job/CREATE-JOB)

## 構文概要

有効なJob文には、以下のコンポーネントが含まれている必要があります：

- **CREATE JOB:** ジョブ名が必要で、データベース内でイベントを一意に識別します。
- **ON SCHEDULE句:** ジョブタイプ、トリガー時間、頻度を指定します。
    - **AT timestamp:** 1回限りのイベント用です。指定された日時にジョブを1回実行します。**AT current_timestamp**は現在の日時を指定します。ジョブは作成時に即座に実行され、非同期タスク作成に使用できます。
    - **EVERY interval:** 定期的なジョブ用で、実行頻度を指定します。キーワードには**WEEK**、**DAY**、**HOUR**、**MINUTE**があります。
        - **Interval:** 実行頻度を定義します。例：**1 DAY**で毎日、**1 HOUR**で毎時、**1 MINUTE**で毎分、**1 WEEK**で毎週。
        - **STARTS句（オプション）:** 繰り返し間隔の開始時間を指定します。**CURRENT_TIMESTAMP**は現在の日時を設定します。ジョブは作成時に即座に実行されます。
        - **ENDS句（オプション）:** ジョブイベントの終了時間を指定します。
- **DO句:** ジョブがトリガーされたときに実行する操作を指定します。現在**INSERT**文をサポートしています。

```sql 
CREATE
JOB
  job_name
  ON SCHEDULE schedule
  [COMMENT 'string']
  DO execute_sql;

schedule: {
    AT timestamp
    | EVERY interval
    [STARTS timestamp ]
    [ENDS timestamp ]
}
interval:
    quantity { WEEK |DAY | HOUR | MINUTE}
```
## 使用例

```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 MINUTE DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```
これにより、「my_job」という名前のジョブが作成され、毎分実行されてdb2.tbl2からdb1.tbl1にデータをインポートします。

ワンタイムジョブの作成：

```sql
CREATE JOB my_job ON SCHEDULE AT '2025-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```
これにより、2025-01-01 00:00:00に一度実行され、db2.tbl2からdb1.tbl1にデータをインポートする"my_job"という名前のジョブが作成されます。

終了時間を設定しない定期ジョブの作成：

```sql

CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE create_time >= days_add(now(), -1);
```
これにより、2025-01-01 00:00:00に開始し、毎日実行される "my_job" という名前のジョブが作成され、db2.tbl2からdb1.tbl1にデータをインポートします。

終了時刻を指定した定期ジョブの作成：

```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 00:00:00' ENDS '2026-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE create_time >= days_add(now(), -1);
```
これにより、2025-01-01 00:00:00に開始し、毎日実行され、2026-01-01 00:10:00に終了する"my_job"という名前のジョブが作成され、db2.tbl2からdb1.tbl1にデータをインポートします。

非同期実行でのJobの使用:

```sql
CREATE JOB my_job ON SCHEDULE AT current_timestamp DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```
Dorisでのジョブは同期タスクとして作成されますが非同期で実行されるため、この例では開始時間を現在時刻とする一回限りのタスクとしてジョブを設定しており、insert into selectのような非同期タスクに適しています。
## Job SchedulerとCatalogによる自動データ同期
例えば、eコマースのシナリオでは、ユーザーはMySQLからビジネスデータを抽出し、データ分析のためにDorisに同期することが多く、これによって精密なマーケティング活動をサポートします。Job SchedulerをMulti Catalog機能と組み合わせることで、データソース間での定期的なデータ同期を効率的に実現できます。

```sql
CREATE TABLE IF NOT EXISTS user.activity (
    `user_id` INT NOT NULL,
    `date` DATE NOT NULL,
    `city` VARCHAR(20),
    `age` SMALLINT,
    `sex` TINYINT,
    `last_visit_date` DATETIME DEFAULT '1970-01-01 00:00:00',
    `cost` BIGINT DEFAULT '0',
    `max_dwell_time` INT DEFAULT '0',
    `min_dwell_time` INT DEFAULT '99999'
);
INSERT INTO user.activity VALUES
    (10000, '2017-10-01', 'Beijing', 20, 0, '2017-10-01 06:00:00', 20, 10, 10),
    (10000, '2017-10-01', 'Beijing', 20, 0, '2017-10-01 07:00:00', 15, 2, 2),
    (10001, '2017-10-01', 'Beijing', 30, 1, '2017-10-01 17:05:00', 2, 22, 22),
    (10002, '2017-10-02', 'Shanghai', 20, 1, '2017-10-02 12:59:00', 200, 5, 5),
    (10003, '2017-10-02', 'Guangzhou', 32, 0, '2017-10-02 11:20:00', 30, 11, 11),
    (10004, '2017-10-01', 'Shenzhen', 35, 0, '2017-10-01 10:00:00', 100, 3, 3),
    (10004, '2017-10-03', 'Shenzhen', 35, 0, '2017-10-03 10:20:00', 11, 6, 6);
```
| user\_id | date       | city      | age  | sex  | last\_visit\_date   | cost | max\_dwell\_time | min\_dwell\_time |
| -------- | ---------- | --------- | ---- | ---- | ------------------- | ---- | ---------------- | ---------------- |
| 10000    | 2017-10-01 | Beijing   | 20   | 0    | 2017-10-01 06:00    | 20   | 10               | 10               |
| 10000    | 2017-10-01 | Beijing   | 20   | 0    | 2017-10-01 07:00    | 15   | 2                | 2                |
| 10001    | 2017-10-01 | Beijing   | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22               | 22               |
| 10002    | 2017-10-02 | Shanghai  | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5                | 5                |
| 10003    | 2017-10-02 | Guangzhou | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11               | 11               |
| 10004    | 2017-10-01 | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3                | 3                |
| 10004    | 2017-10-03 | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22 | 11   | 6                | 6                |


ワークフロー例
1. DorisTableの作成：

```sql
CREATE TABLE IF NOT EXISTS user_activity (
  `user_id` LARGEINT NOT NULL COMMENT "User ID",
  `date` DATE NOT NULL COMMENT "Data import date",
  `city` VARCHAR(20) COMMENT "User city",
  `age` SMALLINT COMMENT "User age",
  `sex` TINYINT COMMENT "User gender",
  `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "Last visit date",
  `cost` BIGINT SUM DEFAULT "0" COMMENT "Total spending",
  `max_dwell_time` INT MAX DEFAULT "0" COMMENT "Max dwell time",
  `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "Min dwell time"
) AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);
```
2. MySQL データベース用のカタログの作成:

```sql
CREATE CATALOG activity PROPERTIES (
  "type"="jdbc",
  "user"="root",
  "password"="123456",
  "jdbc_url" = "jdbc:mysql://127.0.0.1:3306/user?useSSL=false",
  "driver_url" = "mysql-connector-java-5.1.49.jar",
  "driver_class" = "com.mysql.jdbc.Driver"
);
```
3. MySQLからDorisへのデータインポート：

- 一度限りのスケジューリング：

```sql

CREATE JOB one_time_load_job ON SCHEDULE AT '2024-08-10 03:00:00' DO INSERT INTO user_activity SELECT * FROM activity.user_activity;
```
- 定期スケジューリング:

```sql
CREATE JOB schedule_load ON SCHEDULE EVERY 1 DAY DO INSERT INTO user_activity SELECT * FROM activity.user_activity WHERE last_visit_date >= days_add(now(), -1);
```
## 設計と実装
効率的なスケジューリングは、特に高精度スケジューリングにおいて、大量のリソース消費を伴うことが多くあります。Javaのビルトインスケジューリング機能やその他のライブラリを使用する従来の実装では、精度とメモリ使用量に関して大きな問題が発生する場合があります。リソース使用量を最小化しながらパフォーマンスを確保するため、TimingWheelアルゴリズムとDisruptorを組み合わせて秒レベルのタスクスケジューリングを実現しています。
技術詳細

NettyのHashedWheelTimerを使用してtime wheelアルゴリズムを実装し、Job Managerは定期的に（デフォルトでは10分毎に）将来のイベントをtime wheelにスケジュールします。Disruptorは単一プロデューサー、マルチコンシューマーモデルを構築し、過度なリソース使用なしに効率的なタスクトリガーを保証します。time wheelはタスクのトリガーのみを行い、直接実行することはありません。即座に実行するタスクについては、それぞれの実行スレッドプールに送信されます。

単一実行イベントの場合、スケジューリング後にイベント定義が削除されます。定期実行イベントの場合、time wheelのシステムイベントが定期的に次のサイクルの実行タスクを取得します。これにより、1つのバケットにタスクが集中することを避け、無意味な走査を減らし、処理効率を向上させます。トランザクショナルタスクについては、Job Schedulerが強い関連付けとコールバック機構を通じてタスク実行結果が期待と一致することを保証し、データの整合性と一貫性を維持します。
結論

## 将来の計画
Doris Job Schedulerは、データ処理に不可欠な強力で柔軟なタスクスケジューリングツールです。データレイク分析や内部ETLなどの一般的なシナリオを超えて、非同期マテリアライズドビューの実装において重要な役割を果たします。非同期マテリアライズドビューは事前計算された結果セットを保存し、その更新頻度はソースTableの変更と密接に関連しています。ソースTableデータの頻繁な更新により
