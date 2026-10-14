---
{
    "title": "Routine Load の仕組みとベストプラクティス",
    "language": "ja",
    "description": "Apache Doris の Routine Load が Kafka からデータを取り込む仕組み、Exactly Once セマンティクス、チューニングパラメータ、一般的なトラブルシューティング方法を詳しく解説します。",
    "keywords": [
        "Routine Load",
        "Apache Doris の Kafka データ取り込み",
        "Doris のストリーミングデータ取り込み",
        "Exactly Once",
        "Kafka トピックの消費",
        "データ滞留のトラブルシューティング",
        "max_batch_interval",
        "desired_concurrent_number",
        "out of range"
    ]
}
---

<!-- Knowledge type: Architecture principles + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: Understanding streaming load principles / Performance tuning / Troubleshooting -->

## 1. 概要 {#1-overview}

Routine Load は Kafka から継続的にデータを取り込み、Apache Doris に書き込みます。Routine Load ジョブを作成すると、指定した Kafka トピックを自動的に購読できます。主な特徴は次のとおりです。

- **高可用性:** Kafka データを 7x24 で継続して取り込むことができ、障害後には自動的に処理を再開できます。
- **低レイテンシ:** Kafka メッセージを数秒以内に参照可能にできます。
- **Exactly Once セマンティクス:** Kafka データを欠損や重複なく取り込み、各データをちょうど一度だけ処理します。

このドキュメントでは、実装の仕組みを詳しく解説し、典型的なシナリオでのベストプラクティスと、よくある問題の調査方法を紹介します。Routine Load をすばやく使い始め、効率的に運用するために役立ててください。

目的別の推奨閲覧順序は次のとおりです。

1. 動作の仕組みを理解するには、[実装の仕組み](#2-implementation-principles)を参照してください。
2. パフォーマンスを最適化するには、[ベストプラクティス](#3-best-practices)を参照してください。
3. 問題を調査するには、[よくある問題の調査](#4-common-troubleshooting)を参照してください。

## 2. 実装の仕組み {#2-implementation-principles}

<!-- Knowledge type: Architecture principles -->

Kafka のデータはストリームとして存在し、Doris はそのストリームデータを「マイクロバッチ」方式で取り込みます。Routine Load ジョブを作成すると、システムは設定された同時実行数に基づいてジョブを複数のタスクに分割し、並列に実行します。各タスクは、Kafka トピックの特定のパーティションからデータを取り込みます。各タスクは一つのトランザクションに対応し、実行が完了すると、次のデータを取り込むための新しいタスクが生成されます。

以下では、次の三つの側面を説明します。

- ジョブとタスクのスケジューリングの仕組み
- Exactly Once セマンティクスの実装方法
- 単一ストリームから複数テーブルへの書き込みの実行フロー

### 2.1 ジョブとタスクのスケジューリング {#21-job-and-task-scheduling}

Routine Load は、次の二段階のスケジューリングモデルを採用しています。

| スケジューリング階層 | 役割 |
| -------------------- | ---- |
| **ジョブのスケジューリング** | タスクの分割、障害からの復旧、ライフサイクル管理を担当します |
| **タスクのスケジューリング** | データの取得、変換、書き込みを実行するタスクを BE ノードに割り当てます |

#### 2.1.1 ジョブのスケジューリング {#211-job-scheduling}

**ジョブの状態遷移**

| 状態 | 意味 |
| ---- | ---- |
| NEED_SCHEDULE | 初回のスケジューリング待ち、または再スケジューリングが必要な状態 |
| RUNNING | 正常にデータを取り込んでいる状態 |
| PAUSED | 手動操作または例外によって一時停止した状態。条件によっては自動再開が可能 |
| CANCELLED | データベースやテーブルの削除など、復旧できないエラーによって終了した状態 |
| STOPPED | 手動で停止した状態。再開できません |

**スケジューリング時の動作**

スケジューリングスレッドは、各スケジューリングサイクル（10s）で、ジョブの状態に応じて次の処理を行います。

- **NEED_SCHEDULE:** トピックのメタデータ（パーティション数と開始オフセット）を取得し、次の式に従ってタスクを分割します。その後、タスクのスケジューリングスレッドが処理を開始するまで、タスクを `needScheduleTasksQueue` に入れて待機させます。

    ```Plain
    taskNum = min(topic_partition_num,
                  desired_concurrent_number,
                  max_routine_load_task_concurrent_num)
    ```

- **RUNNING:** トピックのメタデータを定期的に取得し、パーティション数が変わった場合は直ちに再スケジューリングします。

- **PAUSED:** ジョブの高可用性を確保するため、自動再開の仕組みがあります。予期せず一時停止した場合、Routine Load Scheduler スレッドはジョブの自動再開を試みます。Kafka の予期しない停止など、Kafka が利用できない状況でも、Kafka の復旧後に手動操作なしで取り込みジョブを正常に継続できます。ただし、次の三つの場合、ジョブは**自動再開しません**。

    1. ユーザーが `PAUSE ROUTINE LOAD` コマンドを手動で実行した場合。
    2. データ品質に問題がある場合。
    3. データベースやテーブルの削除など、自動復旧できない場合。

    これら三つ以外の理由で一時停止したジョブは、すべて自動再開を試みます。

- **CANCELLED / STOPPED:** リソースは遅延して回収されます。

#### 2.1.2 タスクのスケジューリング {#212-task-scheduling}

**スケジューリング条件**

タスクをスケジューリングするには、次のいずれかの条件を満たす必要があります。

- タスクがまだパーティションの末尾まで読み込んでおらず、取り込むデータが残っている場合。これにより、リソースの浪費を防ぎます。
- 前回の実行で既に EOF まで読み込んだ場合は、その実行の開始から `max_batch_interval` を超える時間が経過してから、次のスケジューリングを開始します。取り込み速度がデータの生成速度を上回るときに適度な量のデータを蓄積し、小さなトランザクションが大量に発生するのを防ぐためです。

**負荷分散方式**

スケジューラは、次の優先順位でタスクの実行先 BE ノードを選択します。

1. 現在実行中のタスク数が最も少ない BE を優先します。
2. 実行中のタスク数が同じ BE が複数ある場合は、初期化のオーバーヘッドを減らすため、Kafka Consumer がキャッシュされているノードを優先します。

**バッチの終了条件**

次のいずれかの条件を満たすと、現在のタスクは終了します。

- `max_batch_interval` で定義された時間に達した場合。
- `max_batch_rows` で定義された行数に達した場合。
- `max_batch_size` で定義されたバイト数に達した場合。
- Kafka の EOF まで読み込み、ストリームの末尾に達した場合。

タスクの終了後にトランザクションがコミットされ、新しいタスクが直ちに生成されてキューに入り、次のスケジューリングを待ちます。これにより、継続的なデータ取り込みを実現します。

### 2.2 Exactly Once セマンティクス {#22-exactly-once-semantics}

<!-- Knowledge type: Architecture principles -->

Routine Load は、「取り込み進捗の永続化」と「コミット時の検証」という二つの仕組みによって、Kafka データを欠損や重複なく取り込みます。

#### 2.2.1 取り込み進捗の永続化 {#221-persisting-consumption-progress}

各タスクはトランザクションをコミットするときに、取り込み進捗をトランザクション情報とともに FE edit log に書き込みます。また、Berkeley DB JE を使用して、これをすべての FE Follower に同期します。Master の切り替えや再起動後も、進捗情報は正確に保持されます。

#### 2.2.2 コミット時の検証 {#222-commit-verification}

手動での一時停止、Master の切り替え、トピックのメタデータ変更によってジョブが再スケジューリングされると、二つのタスクが一時的に同じパーティションから並行してデータを取り込む可能性があります。書き込みの重複を防ぐため、次の仕組みがあります。

- 各ジョブは、メモリ上に `routineLoadTaskInfoList` を保持します。
- タスクはコミット前に、自身がまだ `routineLoadTaskInfoList` に含まれていることを確認します。含まれていない場合、コミットは拒否されます。

### 2.3 単一ストリームから複数テーブルへの書き込み {#23-one-stream-multi-table-writing}

単一ストリームから複数テーブルへの書き込みでは、一つの Routine Load ジョブから複数の対象テーブルに同時にデータを書き込みます。主な処理の流れは次のとおりです。

1. **プランニング段階:** ジョブの作成時点では対象テーブルをすべて特定できないため、実行プランの作成は実行時まで遅延されます。実行時に BE が FE Master に動的に実行プランを要求します。
2. **データのキャッシュ:** BE は、まずローカルのマルチテーブルパイプにデータをキャッシュします。200 件のレコードがキャッシュされるか、実行プランをまだ要求していない新しいテーブルが 5 つに達すると、BE は実行プランを要求して実行し、データの滞留を防ぎます。
3. **実行プランの再利用:** 同じトランザクション内ではキャッシュ済みの実行プランを再利用します。トランザクション間では新しいプランを要求し、メタデータの最新性を確保します。

## 3. ベストプラクティス {#3-best-practices}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Performance tuning -->

Routine Load のデフォルトパラメータは、ほとんどのシナリオに対応しています。手動でのチューニングが必要になるのは、主に次の三つのシナリオです。

| シナリオ | 推奨するパラメータの変更 |
| -------- | ------------------------ |
| 低レイテンシが必要な場合 | `max_batch_interval` をデフォルトの 60s より短くする |
| データ量が少なく、リソースを節約したい場合 | `desired_concurrent_number` を小さくする |
| 高スループットが必要な場合 | `max_batch_interval` をデフォルトの 60s から 120-180s に延ばす |

## 4. よくある問題の調査 {#4-common-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Routine Load exception troubleshooting -->

### 4.1 データの滞留 {#41-data-backlog}

次の三つの手順で、データの滞留原因を特定し、最適化します。

**手順 1: タスクの状態を確認する**

`SHOW ROUTINE LOAD\G` でタスクの状態を確認し、次の点に注目します。

- `State` が `RUNNING` かどうか。別の状態の場合は、`ReasonOfStateChanged` フィールドで理由を確認します。
- `OtherMsg` にエラーメッセージがないか。

**手順 2: スループットの上限に達しているか確認する**

BE のログで、スループットの上限に達しているか確認します。`consumer group done` というログを検索してください。`left_time / left_rows / left_bytes` の値から最初に到達したしきい値を特定し、それに応じて `max_batch_size` または `max_batch_rows` を増やせます。

```C++
consumer group done: 894fc32d5b9d3e93-7387a02da6dafd88. consume time(ms)=34004, received rows=2679540, received bytes=2147484043, eos: 0, left_time: 25996, left_rows: 17320460, left_bytes: -395, blocking get time(us): 949236, blocking put time(us): 28730419, id=69616a41fc064f1e-a93ff0ddd217f0a0, job_id=48121487, txn_id=61763720, label=ods_hq_market_unique_jobs_0-48121487-69616a41fc064f1e-a93ff0ddd217f0a0-61763720, elapse(s)=34
```

上の例では、`left_bytes: -395` は、`max_batch_size` が上限に達したため、バッチが 34 秒以内に終了したことを示します。この場合、`max_batch_size` を適切に増やすと、`max_batch_interval` の範囲内で一回のバッチにできるだけ多くのデータを取り込み、スループットを向上できます。

**手順 3: 同時実行数とスループットを増やす**

- `desired_concurrent_number` を増やし、トピックのパーティション数に合わせます。
- `max_batch_interval`（たとえば 120s から 180s）、`max_batch_size`、または `max_batch_rows` を適度に増やします。これにより、トランザクションあたりのデータ量とバッチあたりのデータ量を増やし、トランザクションのオーバーヘッドを減らせます。

### 4.2 タスクの予期しない一時停止 {#42-task-unexpectedly-paused}

Routine Load には自動再開の仕組みが組み込まれており、予期しない一時停止の多くは再試行されます。タスクが `PAUSED` のままで自動再開できない場合は、`SHOW ROUTINE LOAD` を実行し、次の点を調査してください。

- `PAUSE ROUTINE LOAD` が手動で実行されていないか。
- フォーマットエラーやフィールドの欠落など、データ品質に問題がないか。
- Kafka のデータが期限切れになり、`out of range` エラーが発生していないか。

## 5. よくある質問 {#5-faq}

<!-- Knowledge type: FAQ -->

**Q1: Routine Load はどのように Exactly Once セマンティクスを保証しますか？**

次の二つの仕組みによります。(1) 各タスクはトランザクションをコミットするときに、取り込み進捗を FE edit log に書き込み、Berkeley DB JE を介してすべての FE Follower に同期します。(2) タスクはコミット前に、自身がまだ `routineLoadTaskInfoList` に含まれていることを確認します。含まれていない場合はコミットを拒否し、並行実行による書き込みの重複を防ぎます。

**Q2: PAUSED 状態のジョブは自動再開しますか？**

予期しない一時停止の多くは自動再開します。ただし、`PAUSE ROUTINE LOAD` の手動実行、データ品質の問題、データベースやテーブルの削除など復旧できないエラーという三つの場合は**自動再開しません**。

**Q3: タスク数は何によって決まりますか？**

次の式で決まります: `taskNum = min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)`。

**Q4: `max_batch_interval` を増やすべきなのはどのような場合ですか？**

高スループットが必要な場合、デフォルトの 60s から 120s-180s に増やすと、トランザクションあたりのデータ量が増え、トランザクションのオーバーヘッドを減らして全体のスループットを向上できます。

**Q5: ログの `out of range` エラーは何を意味しますか？**

Kafka から取り込もうとしているデータが期限切れになり（Kafka の保持ポリシーによって削除され）、取り込みオフセットが無効になったことを意味します。Kafka トピックの保持期間を確認するか、Routine Load が取り込みを開始するオフセットをリセットする必要があります。
