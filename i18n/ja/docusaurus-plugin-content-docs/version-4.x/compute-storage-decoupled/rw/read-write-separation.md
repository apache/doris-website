---
{
  "title": "リードライト分離",
  "language": "ja",
  "description": "クロスアベイラビリティーゾーン（AZ）高可用性クラスタアーキテクチャおよび読み書き分離アーキテクチャをサポートするため、"
}
---
# File Cache Active Incremental Warm-Up

## 背景

クロスアベイラビリティゾーン（AZ）高可用性クラスタアーキテクチャと読み書き分離アーキテクチャをサポートするため、Dorisは**File Cache Active Incremental Warm-Up Mechanism**を導入します。このメカニズムにより、ターゲットクラスタのキャッシュデータがソースクラスタと高い一貫性を保ち、クエリパフォーマンスの向上、ジッターの削減、フェイルオーバー時の応答時間の短縮を実現します。

適用シナリオには以下が含まれます：

- **プライマリ-スタンバイクラスタアーキテクチャ**: プライマリクラスタが障害時にスタンバイクラスタが迅速に負荷を引き継げることを保証します。
- **読み書き分離アーキテクチャ**: 新しく書き込まれたデータが読み込みクラスタで迅速にキャッシュされることを保証します。

---

## 機能概要

File Cacheアクティブウォームアップは主に以下の2種類のキャッシュの同期をサポートします：

1. **Import Data Cache Synchronization**  
   - Load、Compaction、Schema Changeなどの書き込み操作後に生成されるデータをカバーします。
   - クエリジッターを削減するため**イベントトリガー同期**をサポートします。

2. **Query Data Cache Synchronization**  
   - ホットクエリデータをターゲットクラスタで準備状態に保つため**定期同期**をサポートします。
   - プライマリ-スタンバイ切り替え時にスタンバイクラスタのパフォーマンスを安定に保ちます。

---

## 主な機能

### 同期モード

| モード            | 説明 |
|-----------------|-------------|
| One-Time Sync (`ONCE`)     | 手動トリガーに適用、例：新しく起動したクラスタの事前ヒート |
| Periodic Sync (`PERIODIC`) | クエリデータの定期同期に適用 |
| Event-Driven Sync (`EVENT_DRIVEN`) | Load、Compaction、Schema Change操作後の自動トリガーに適用 |

### WARM UP構文拡張

```sql
-- One-time synchronization
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>;

-- Periodic synchronization
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "periodic",
    "sync_interval_sec" = "600"
);

-- Event-triggered synchronization
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```
---

## Warm-Up Job管理

### Jobの表示

```sql
SHOW WARM UP JOB;
SHOW WARM UP JOB WHERE ID = 12345;
```
| カラム名        | 説明 |
|-----------------|-------------|
| JobId           | 一意のジョブID |
| ComputeGroup    | ターゲットCompute Group |
| SrcComputeGroup | ソースCompute Group |
| Type            | タイプ: CLUSTER / TABLE |
| SyncMode        | ONCE / PERIODIC(x) / EVENT_DRIVEN(x) |
| Status          | PENDING / RUNNING / FINISHED / CANCELLED / DELETED |
| CreateTime      | 作成時刻 |
| StartTime       | 最後の開始時刻 |
| FinishTime      | 最後の終了時刻 |
| FinishBatch     | 完了したバッチ数 |
| AllBatch        | 同期する総バッチ数 |
| ErrMsg          | エラーメッセージ（ある場合） |

### ジョブのキャンセル

```sql
CANCEL WARM UP JOB WHERE id = 12345;
```
> **注意:** 現在のバージョンではALTERをサポートしていません。設定を変更するには、ジョブをキャンセルして再作成してください。

---

## 動作原理

### 定期同期プロセス

1. FEがジョブを登録し、`sync_interval`を設定します。
2. FEが定期的にトリガー時刻に到達したかを確認します（最後の開始時刻に基づく）。
3. 同期ジョブを開始します（実行の重複を回避）。
4. 完了後にステータスを記録し、次のサイクルを待機します。

### イベントトリガー同期プロセス

1. ユーザーがイベントトリガージョブを作成し、FEがジョブを登録してソースクラスターのBEに送信します。
2. ソースBEがLoad、Compaction、または類似のイベントの後に自動的にウォームアップをトリガーします。
3. ターゲットBEに同期リクエストを送信します（Rowset単位で）。
4. 完了後、BEがステータスをFEに報告します。

---

## ストレージとスケジューリングメカニズム

- 同期関係はFEによって`CloudWarmUpJob`として保存され、マルチジョブ管理をサポートします。
- 同じターゲットクラスターに対して複数の**Pending Jobs**が許可されますが、**Running Job**は一度に1つのみ許可され、他はキューに入ります。
- CLUSTER NAMEを使用した同期関係の管理をサポートし、クラスターのリネーム/マイグレーションにも対応します。

---

## 内部API設計

```java
CacheHotspotManager {
    long createJob(WarmUpClusterStmt stmt);
    void cancel(long jobId);
}

WarmUpClusterStmt(String dstClusterName, String srcClusterName, boolean isForce,
                  Map<String, String> properties);
```
---

## メトリクス監視

### 定期ジョブ - FE側

| メトリクス名 | 説明 |
|-------------|-------------|
| file_cache_warm_up_job_exec_count | スケジュール実行回数 |
| file_cache_warm_up_job_requested_tablets | 投入されたtablet数 |
| file_cache_warm_up_job_finished_tablets | 完了したtablet数 |
| file_cache_warm_up_job_latest_start_time | 最新の開始時刻 |
| file_cache_warm_up_job_last_finish_time | 最新の終了時刻 |

### 定期ジョブ - BE側

| メトリクス名 | 説明 |
|-------------|-------------|
| file_cache_once_or_periodic_warm_up_submitted_segment_size | 投入されたsegmentのサイズ |
| file_cache_once_or_periodic_warm_up_finished_segment_size | 完了したsegmentのサイズ |
| file_cache_once_or_periodic_warm_up_submitted_index_num | 投入されたindex数 |
| file_cache_once_or_periodic_warm_up_finished_index_num | 完了したindex数 |

### イベント駆動ジョブ - ソースBE

| メトリクス名 | 説明 |
|-------------|-------------|
| file_cache_event_driven_warm_up_requested_segment_size | 要求されたsegmentのサイズ |
| file_cache_event_driven_warm_up_requested_index_num | 要求されたindex数 |
| file_cache_warm_up_rowset_last_call_unix_ts | 最後の要求タイムスタンプ |

### イベント駆動ジョブ - ターゲットBE

| メトリクス名 | 説明 |
|-------------|-------------|
| file_cache_event_driven_warm_up_submitted_segment_num | 受信したsegment数 |
| file_cache_event_driven_warm_up_finished_segment_num | 完了したsegment数 |
| file_cache_warm_up_rowset_last_handle_unix_ts | 最後の処理タイムスタンプ |

---

## FAQ

1. **ジョブが失敗した場合、完全にキャンセルされますか？**  
   いいえ、現在の同期のみスキップされ、次のサイクルは継続されます。

2. **定期ジョブはタイムアウトキャンセルをサポートしていますか？**  
   はい、タイムアウト後、現在のラウンドはスキップされますが、ジョブ自体は残ります。

3. **複数のクラスターが同じクラスターに同期できますか？**  
   はい、例えば、A -> BとC -> Bを同時に存在させることができます。

---

## バージョン情報

この機能はApache Dorisバージョン3.1.0で導入されました。
