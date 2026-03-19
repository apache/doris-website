---
{
  "title": "リードライト分離",
  "language": "ja",
  "description": "クロス・アベイラビリティーゾーン（AZ）高可用性クラスター・アーキテクチャおよび読み書き分離アーキテクチャをサポートするために、"
}
---
# File Cache Active Incremental Warm-Up

## 背景

クロスアベイラビリティーゾーン（AZ）高可用性クラスタアーキテクチャと読み書き分離アーキテクチャをサポートするため、Dorisは**File Cache Active Incremental Warm-Upメカニズム**を導入しています。このメカニズムにより、ターゲットクラスタのキャッシュデータがソースクラスタと高い一貫性を保ち、クエリパフォーマンスの向上、ジッタの削減、およびフェイルオーバー時の応答時間の短縮を実現します。

アプリケーションシナリオには以下が含まれます：

- **プライマリ-スタンバイクラスタアーキテクチャ**: プライマリクラスタが障害時にスタンバイクラスタが迅速に負荷を引き継げることを保証します。
- **読み書き分離アーキテクチャ**: 新しく書き込まれたデータが読み込みクラスタで迅速にキャッシュされることを保証します。

---

## 機能概要

File Cacheアクティブウォームアップは主に以下の2種類のキャッシュの同期をサポートします：

1. **Import Data Cache Synchronization**  
   - Load、Compaction、Schema Changeなどの書き込み操作後に生成されるデータをカバーします。
   - **イベントトリガー同期**をサポートしてクエリジッタを削減します。

2. **Query Data Cache Synchronization**  
   - **定期同期**をサポートして、ホットクエリデータをターゲットクラスタで準備完了状態に保ちます。
   - プライマリ-スタンバイ切り替え時にスタンバイクラスタのパフォーマンスが安定していることを保証します。

---

## 主要機能

### 同期モード

| モード            | 説明 |
|-----------------|-------------|
| One-Time Sync (`ONCE`)     | 手動トリガーに適しています。例：新しく起動したクラスタのプリヒーティング |
| Periodic Sync (`PERIODIC`) | クエリデータの定期同期に適しています |
| Event-Driven Sync (`EVENT_DRIVEN`) | Load、Compaction、またはSchema Change操作後の自動トリガーに適しています |

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
2. FEが定期的にトリガー時間に達したかどうかを確認します（最後の開始時間に基づいて）。
3. 同期ジョブを開始します（実行の重複を回避）。
4. 完了後にステータスを記録し、次のサイクルを待機します。

### イベントトリガー同期プロセス

1. ユーザーがイベントトリガージョブを作成し、FEがジョブを登録してソースクラスターBEに送信します。
2. ソースBEがLoad、Compaction、または類似のイベント後に自動的にウォームアップをトリガーします。
3. ターゲットBEに同期リクエストを送信します（Rowset粒度で）。
4. 完了後、BEがステータスをFEに報告します。

---

## ストレージとスケジューリングメカニズム

- 同期関係はFEによって`CloudWarmUpJob`として保存され、マルチジョブ管理をサポートします。
- 同じターゲットクラスターに対して複数の**Pending Jobs**が許可されますが、**Running Job**は同時に1つのみ許可され、他はキューに入ります。
- CLUSTER NAMEを使用した同期関係の管理をサポートし、クラスターのリネーム/移行が含まれます。

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

### 定期ジョブ - FEサイド

| メトリクス名 | 説明 |
|-------------|-------------|
| file_cache_warm_up_job_exec_count | スケジュール実行回数 |
| file_cache_warm_up_job_requested_tablets | 送信されたタブレット数 |
| file_cache_warm_up_job_finished_tablets | 完了したタブレット数 |
| file_cache_warm_up_job_latest_start_time | 最新の開始時刻 |
| file_cache_warm_up_job_last_finish_time | 最新の終了時刻 |

### 定期ジョブ - BEサイド

| メトリクス名 | 説明 |
|-------------|-------------|
| file_cache_once_or_periodic_warm_up_submitted_segment_size | 送信されたセグメントのサイズ |
| file_cache_once_or_periodic_warm_up_finished_segment_size | 完了したセグメントのサイズ |
| file_cache_once_or_periodic_warm_up_submitted_index_num | 送信されたインデックス数 |
| file_cache_once_or_periodic_warm_up_finished_index_num | 完了したインデックス数 |

### イベント駆動ジョブ - 送信元BE

| メトリクス名 | 説明 |
|-------------|-------------|
| file_cache_event_driven_warm_up_requested_segment_size | 要求されたセグメントのサイズ |
| file_cache_event_driven_warm_up_requested_index_num | 要求されたインデックス数 |
| file_cache_warm_up_rowset_last_call_unix_ts | 最新のリクエストタイムスタンプ |

### イベント駆動ジョブ - 送信先BE

| メトリクス名 | 説明 |
|-------------|-------------|
| file_cache_event_driven_warm_up_submitted_segment_num | 受信したセグメント数 |
| file_cache_event_driven_warm_up_finished_segment_num | 完了したセグメント数 |
| file_cache_warm_up_rowset_last_handle_unix_ts | 最新の処理タイムスタンプ |

---

## FAQ

1. **ジョブが失敗した場合、完全にキャンセルされますか？**  
   いいえ、現在の同期のみがスキップされ、次のサイクルは継続されます。

2. **定期ジョブはタイムアウトによるキャンセルをサポートしていますか？**  
   はい、タイムアウト後は現在のラウンドはスキップされますが、ジョブ自体は残ります。

3. **複数のクラスターが同一のクラスターに同期できますか？**  
   はい、例えばA -> BとC -> Bが同時に存在できます。

---

## バージョン情報

この機能はApache Dorisバージョン3.1.0で導入されました。
