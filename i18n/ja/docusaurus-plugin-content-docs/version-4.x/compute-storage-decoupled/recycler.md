---
title: コンピュートとストレージを分離した構成におけるデータ回収（Recycler）— 原理、設定、チューニング
sidebar_label: データ回収（Recycler）
description: Doris のコンピュートとストレージを分離した構成における Recycler のデータ回収の仕組みについて、削除マークの原理、保持期間による保護、監視メトリクス、一般的なチューニングの場面を説明します。
keywords: [Doris, コンピュートとストレージの分離, データ回収, Recycler, 削除マーク, ガベージコレクション, ストレージ容量, チューニング]
language: ja
---

<!-- Knowledge type: Architecture principles + Operational configuration -->
<!-- Applicable scenarios: Compute-storage decoupled deployment / Storage space management / Troubleshooting -->

Doris のコンピュートとストレージを分離した構成では、データ回収に**削除マーク（Mark-for-Deletion）**方式を使用します。専用コンポーネントの Recycler が削除マークの付いたメタデータエントリを定期的に走査し、対応するオブジェクトファイルを一括で削除します。これにより、性能、安全性、リソース使用率のバランスを取ります。

## データ回収方式の比較

<!-- Knowledge type: Architecture selection decision -->

一般的な三つのデータ回収方式には、それぞれ長所と短所があります。Doris のコンピュートとストレージを分離した構成では、削除マーク方式を採用しています。

| 方式 | トリガー | 長所 | 短所 |
|----------|---------|------------|---------------|
| **同期削除** | 削除コマンドの実行時にメタデータとファイルを直ちに削除する | 実装が簡単 | 応答が遅く、リスクが高く、猶予期間がない |
| **照合による削除（逆方向）** | すべてのファイルを定期的に走査し、参照されていないファイルを特定して一括で削除する | 孤立したファイルを削除できる | すべてのファイルを走査する必要があり、I/O の負荷が高い |
| **削除マーク（順方向）** | 削除時にはメタデータにマークを付けるだけで、バックグラウンド処理が定期的にマークを走査してファイルを削除する | 応答が速く、猶予期間があり、効率が高い | 一時的に余分なストレージ容量を使用する |

### 削除マーク方式の利点

削除マーク方式には、ほかの方式と比べて次の利点があります。

- **応答が速い**: `DROP TABLE` はファイル I/O の完了を待たずにメタデータ KV に削除マークを付けるだけです。そのため、ユーザーへの応答が速く、大きなテーブルの削除でも処理がブロックされません。
- **効率的な一括処理**: バックグラウンド処理がファイルの削除を定期的に一括実行するため、システムコールの回数が減り、I/O 全体の効率が向上します。
- **誤操作からの保護**: ファイルが実際に削除されるまで猶予期間があります。誤って削除したテーブルはこの期間内に復元できるため、人的ミスによるリスクを大幅に低減できます。
- **トランザクションの安全性**: 削除マークの付与は軽量なメタデータ変更です。原子性を保証しやすく、システム障害によるデータの不整合を減らせます。
- **負荷の分散**: システムがアイドル状態のときにファイルを削除できるため、業務のピーク時に I/O リソースを大量に消費することを避けられます。

## Recycler の動作

<!-- Knowledge type: Architecture principles -->

Recycler は独立してデプロイされるコンポーネントで、期限切れの不要なファイルを定期的に回収します。一つの Recycler で複数のインスタンスを同時に回収できますが、同じインスタンスを同時に処理できる Recycler は一つだけです。

### 削除マーク方式の処理フロー

`DROP` コマンドが実行されたとき、またはコンパクションでマージされた rowset などの不要なデータがシステムで生成されたとき、対応するメタデータ KV は `recycled` 状態としてマークされます。Recycler はインスタンス内の回収対象 KV を定期的に走査し、次の順序で処理します。

1. 対応するオブジェクトファイル（セグメントファイルなど）を削除する
2. 回収対象の KV を削除する

メタデータを削除した後にファイルが残ることを防ぐため、メタデータより先にファイルを削除し、安全な削除順序を確保します。

### 階層的な回収構造

<!-- Knowledge type: Operational steps -->

データ回収は階層に沿って上から下へ実行されます。`DROP TABLE` を例に示します。

```
Table
 └─ Partition (delete recycle partition KV)
     └─ Tablet (delete recycle tablet KV)
         └─ Rowset (delete recycle rowset KV)
             └─ Segment files (actual object files, the final deletion unit)
```

回収中は、`recycle_indexes`、`recycle_partition`、`recycle_compacted_rowsets`、`recycle_txn` など、複数の種類のタスクが並行して実行されます。各階層の回収対象 KV は、その階層に属するすべての子項目が正常に削除された後にのみ削除されます。

### 保持期間による保護の仕組み

回収対象となる各オブジェクトの KV には保持期間が記録されています。Recycler は走査時に保持期間を計算し、**まだ期限が切れていないオブジェクトは削除しません**。

この仕組みは誤操作からデータを保護します。ユーザーが誤ってテーブルを削除しても、保持期間が過ぎるまでは Recycler がそのデータを削除しないため、その間にデータを復元する機会があります。

### 信頼性の保証

<!-- Knowledge type: Architecture principles -->

**段階的な削除**: データファイル、メタデータ、インデックスまたはパーティションの KV の順に削除し、安全な削除順序を確保します。

**リースによる保護**: 各 Recycler は回収を開始する前にリースを取得する必要があり、バックグラウンドスレッドがリースを定期的に更新します。リースの期限が切れるか、状態が IDLE になった場合にのみ、別の Recycler が処理を引き継げます。これにより、特定のインスタンスを一度に回収する Recycler を一つに限定し、並行回収によるデータの不整合を防ぎます。

### 多層チェックの仕組み（Checker）

<!-- Knowledge type: Architecture principles -->

Recycler は、FE メタデータ、MS KV、オブジェクトファイルの間で多層の相互チェックを行う仕組み（checker）を実装しています。checker は、すべての Recycler KV、オブジェクトファイル、FE のメモリ内メタデータをバックグラウンドで双方向にチェックします。

セグメントファイルの KV とオブジェクトファイルのチェックを例に示します。

| チェック方向 | チェック内容 |
|-----------------|---------------|
| **順方向チェック** | すべての KV を走査し、対応するセグメントファイルが存在するか、対応するセグメント情報が FE のメモリ内にあるかを確認する |
| **逆方向チェック** | すべてのセグメントファイルを走査し、それぞれに対応する KV があるか、対応するセグメント情報が FE のメモリ内にあるかを確認する |

回収不足または過剰回収が発生した場合、checker は関連情報を取得します。運用担当者は checker のレポートに基づいて余分な不要ファイルを手動で削除するか、オブジェクトのバージョニングを使用して誤って削除されたファイルを復元できます。

現在はセグメントファイル、idx ファイル、delete bitmap メタデータの順方向および逆方向のチェックに対応しており、今後はすべてのメタデータに対象を広げる予定です。

## 監視メトリクス

<!-- Knowledge type: Observability -->
<!-- Applicable scenarios: Performance monitoring / Troubleshooting -->

すべての監視メトリクスは、**MS ダッシュボード**でリアルタイムに確認できます。

### 監視時の主な確認事項

| 確認事項 | 対応するメトリクス |
|----------|---------------------|
| オブジェクトの種類ごとの秒あたりの回収バイト数と回収数 | `recycler_instance_recycle_bytes_per_ms`、`recycler_instance_recycle_time_per_resource` |
| 回収ラウンドごとのデータ量と経過時間 | `recycler_instance_last_round_recycled_bytes`、`recycler_instance_last_round_recycle_elpased_ts` |
| 回収済み／回収待ちのデータ量 | `recycler_instance_last_round_recycled_num`、`recycler_instance_last_round_to_recycle_num` |
| ストレージバックエンドごとの回収状態 | `recycler_vault_recycle_status` |
| 最後に成功／失敗した時刻 | `recycler_instance_recycle_last_success_ts`、`recycler_instance_recycle_end_ts` |
| 次回の推定回収時刻 | `recycler_instance_next_ts` |

### メトリクス一覧

| 変数名 | メトリクス名 | ディメンション／ラベル | 説明 |
|---------------|--------------|---------------------|-------------|
| `g_bvar_recycler_vault_recycle_status` | `recycler_vault_recycle_status` | instance_id, resource_id, status | インスタンス ID、リソース ID、状態ごとの vault 回収処理の状態を計測する |
| `g_bvar_recycler_vault_recycle_task_concurrency` | `recycler_vault_recycle_task_concurrency` | instance_id, resource_id | インスタンス ID、リソース ID ごとの vault ファイル回収タスクの並行数を計測する |
| `g_bvar_recycler_instance_last_round_recycled_num` | `recycler_instance_last_round_recycled_num` | instance_id, resource_type | 直近のラウンドで回収されたオブジェクト数 |
| `g_bvar_recycler_instance_last_round_to_recycle_num` | `recycler_instance_last_round_to_recycle_num` | instance_id, resource_type | 直近のラウンドで回収対象となったオブジェクト数 |
| `g_bvar_recycler_instance_last_round_recycled_bytes` | `recycler_instance_last_round_recycled_bytes` | instance_id, resource_type | 直近のラウンドで回収されたデータ量（バイト） |
| `g_bvar_recycler_instance_last_round_to_recycle_bytes` | `recycler_instance_last_round_to_recycle_bytes` | instance_id, resource_type | 直近のラウンドで回収対象となったデータ量（バイト） |
| `g_bvar_recycler_instance_last_round_recycle_elpased_ts` | `recycler_instance_last_round_recycle_elpased_ts` | instance_id, resource_type | 直近の回収処理の経過時間（ms） |
| `g_bvar_recycler_instance_recycle_round` | `recycler_instance_recycle_round` | instance_id, resource_type | 回収処理のラウンド番号 |
| `g_bvar_recycler_instance_recycle_time_per_resource` | `recycler_instance_recycle_time_per_resource` | instance_id, resource_type | リソースごとの回収所要時間（ms）。`-1` は未回収を示す |
| `g_bvar_recycler_instance_recycle_bytes_per_ms` | `recycler_instance_recycle_bytes_per_ms` | instance_id, resource_type | ミリ秒あたりの回収バイト数。`-1` は未回収を示す |
| `g_bvar_recycler_instance_recycle_total_num_since_started` | `recycler_instance_recycle_total_num_since_started` | instance_id, resource_type | Recycler の起動後に回収されたオブジェクトの総数 |
| `g_bvar_recycler_instance_recycle_total_bytes_since_started` | `recycler_instance_recycle_total_bytes_since_started` | instance_id, resource_type | Recycler の起動後に回収されたデータの総量（バイト） |
| `g_bvar_recycler_instance_running_counter` | `recycler_instance_running_counter` | — | 現在回収中のインスタンス数 |
| `g_bvar_recycler_instance_last_round_recycle_duration` | `recycler_instance_last_round_recycle_duration` | instance_id | 直近の回収ラウンド全体の所要時間 |
| `g_bvar_recycler_instance_next_ts` | `recycler_instance_next_ts` | instance_id | `recycle_interval_seconds` に基づく次回の推定回収時刻 |
| `g_bvar_recycler_instance_recycle_st_ts` | `recycler_instance_recycle_start_ts` | instance_id | 回収処理全体の開始時刻 |
| `g_bvar_recycler_instance_recycle_ed_ts` | `recycler_instance_recycle_end_ts` | instance_id | 回収処理全体の終了時刻 |
| `g_bvar_recycler_instance_recycle_last_success_ts` | `recycler_instance_recycle_last_success_ts` | instance_id | 最後に回収が成功した時刻 |

## 設定パラメータ

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Deployment tuning / Performance optimization -->

Recycler で一般的に使用する設定パラメータを次に示します。

| パラメータ | デフォルト値 | 説明 |
|-----------|---------|-------------|
| `recycle_interval_seconds` | `3600` | 回収の間隔（秒） |
| `retention_seconds` | `259200`（3 日） | 個別の保持期間が設定されていないすべてのオブジェクトに適用される、一般的な保持期間 |
| `recycle_concurrency` | `16` | 一つの Recycler が同時に回収できるインスタンスの最大数 |
| `compacted_rowset_retention_seconds` | `1800` | コンパクションでマージされた rowset の保持期間（秒） |
| `dropped_index_retention_seconds` | `10800` | 削除されたインデックスの保持期間（秒） |
| `dropped_partition_retention_seconds` | `10800` | 削除されたパーティションの保持期間（秒） |
| `recycle_whitelist` | `""` | 回収対象のホワイトリスト。インスタンス ID をカンマ区切りで指定する。空の場合はすべてのインスタンスを回収する |
| `recycle_blacklist` | `""` | 回収対象のブラックリスト。インスタンス ID をカンマ区切りで指定する。空の場合はすべてのインスタンスを回収する |
| `instance_recycler_worker_pool_size` | `32` | オブジェクト I/O 操作（一覧取得、削除など）の並行数 |
| `recycle_pool_parallelism` | `40` | 回収タスク（`recycle_tablet`、`recycle_rowset` など）の並行数 |
| `enable_checker` | `false` | 順方向 checker を有効にするかどうか |
| `enable_inverted_check` | `false` | 逆方向 checker を有効にするかどうか |
| `check_object_interval_seconds` | `43200`（12 時間） | checker の実行間隔（秒） |
| `enable_recycler_stats_metrics` | `false` | Recycler の可観測性メトリクスを有効にするかどうか |
| `recycler_storage_vault_white_list` | `""` | ストレージバックエンドのホワイトリスト。vault 名をカンマ区切りで指定する。空の場合はすべての vault を回収する |
| `enable_mark_delete_rowset_before_recycle` | `false` | rowset のデータを実際に削除する前に、そのメタデータを回収対象としてマークし、次の走査ラウンドでデータと KV を削除するかどうか。動的な変更に対応。**バージョン 4.0.8 以降、デフォルト値が `true` から `false` に変更された** |
| `enable_abort_txn_and_job_for_delete_rowset_before_recycle` | `false` | rowset を削除する前に、それに関連するトランザクションとジョブを中止するかどうか。動的な変更に対応。**バージョン 4.0.8 以降、デフォルト値が `true` から `false` に変更された** |

:::caution 動作変更（4.0.8）

`enable_mark_delete_rowset_before_recycle` と `enable_abort_txn_and_job_for_delete_rowset_before_recycle` のデフォルト値は、4.0.8 で `true` から `false` に変更されました。

どちらも rowset を削除する前の追加の保護手順ですが、現在の実装では性能上の負荷が目立ち、回収が遅くなるため、デフォルトでは有効になっていません。この保護を維持するには、両方を明示的に `true` に設定してください。

:::

## 一般的なチューニングの場面

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

### 回収が遅すぎる場合

**目的**: 不要なデータの削除を速め、ストレージ容量を解放します。

**調整方法**:

1. 並行数を増やします。
    - `recycle_concurrency`（デフォルト値 16）: 同時に回収するインスタンス数を増やします。
    - `instance_recycler_worker_pool_size`（デフォルト値 32）: オブジェクト I/O 操作の並行数を増やします。
    - `recycle_pool_parallelism`（デフォルト値 40）: 回収タスクの並行数を増やします。
2. 回収間隔を短くします。たとえば、`recycle_interval_seconds` をデフォルトの 3600 秒から 1800 秒に減らします。
3. ホワイトリストを使用します。`recycle_whitelist` を使って、重要なインスタンスを優先的に回収します。

### 回収の負荷が業務に影響する場合

**目的**: Recycler が業務処理に与える影響を抑えます。

**調整方法**:

1. 並行数を減らします。`recycle_concurrency`、`instance_recycler_worker_pool_size`、`recycle_pool_parallelism` を適切に下げます。
2. 回収間隔を長くします。たとえば、`recycle_interval_seconds` を 7200 秒に増やします。
3. ブラックリストを使用します。`recycle_blacklist` を使って、負荷の高いインスタンスを一時的に除外します。

### ストレージ容量が不足し、削除を速める必要がある場合

**目的**: できるだけ速くストレージ容量を解放します。

**調整方法**:

1. 一般的な保持期間を短くします。`retention_seconds` をデフォルトの 259200 秒（3 日）から減らします。
2. 特定の種類のオブジェクトの保持期間を短くします。
    - `compacted_rowset_retention_seconds`（デフォルト値 1800 秒）を適切に減らします。
    - `dropped_index_retention_seconds` と `dropped_partition_retention_seconds`（デフォルト値 10800 秒）を必要に応じて調整します。
3. ストレージバックエンドを選択して回収します。`recycler_storage_vault_white_list` を使って、特定の vault の削除を優先します。

### 誤削除を防ぐために保持期間を延長する必要がある場合

**目的**: 誤操作からの復元に使える猶予期間を長く確保します。

**調整方法**:

1. `retention_seconds` を、たとえば 604800 秒（7 日）に増やします。
2. オブジェクトの種類ごとの重要度に応じて、`dropped_partition_retention_seconds` などのパラメータを個別に調整します。

### 監視と整合性チェックを有効にする場合

**目的**: 可観測性を高め、データの整合性に関する潜在的な問題を調査します。

**調整方法**:

1. 可観測性メトリクスを有効にします。`enable_recycler_stats_metrics = true` に設定します。
2. チェック機能を有効にします。
    - `enable_checker = true`（順方向チェック）
    - `enable_inverted_check = true`（逆方向チェック）
3. `check_object_interval_seconds`（デフォルト値 43200 秒）を適切なチェック頻度に調整します。

### 特定のインスタンスで回収に異常がある場合

**目的**: 問題のあるインスタンスを一時的に隔離し、ほかのインスタンスの回収への影響を防ぎます。

**調整方法**:

1. 異常のあるインスタンス ID を `recycle_blacklist` に追加し、一時的に回収をスキップします。
2. 優先的に処理する必要があるインスタンス ID を `recycle_whitelist` に追加します。
3. `recycler_storage_vault_white_list` を使って、特定のストレージバックエンドを選択して回収します。

### 大きなテーブルの削除によって回収タスクが滞留する場合

**目的**: 滞留した回収タスクを速やかに処理します。

**調整方法**:

1. 並行数のパラメータ（`recycle_concurrency`、`recycle_pool_parallelism`）を一時的に増やし、滞留を解消します。
2. ホワイトリストを使用し、タスクが大きく滞留しているインスタンスを優先します。
3. 必要に応じて複数の Recycler インスタンスをデプロイし、負荷を分担します。

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting / Common errors -->

### 長時間実行されるクエリで「404 File Not Found」エラーが発生する

**症状**: クエリの実行に長い時間がかかっています。その間に tablet のコンパクションが行われ、マージされた rowset が Recycler によって回収されます。クエリがその rowset にアクセスすると、`404 file not found` が報告されます。

**原因**: `compacted_rowset_retention_seconds` のデフォルト値は 1800 秒（30 分）です。クエリの実行時間がこれを超えると、必要な rowset ファイルがすでに削除されている場合があります。

**対処方法**: クラスターで最も実行時間の長いクエリに合わせて、`compacted_rowset_retention_seconds` を増やします。長時間実行されるクエリがある場合は、7200 秒以上に設定することを推奨します。

### データ回収が正常に進んでいることを確認する方法

**確認方法**:

1. `enable_recycler_stats_metrics = true` に設定し、MS ダッシュボードで `recycler_instance_last_round_recycle_duration` と `recycler_instance_recycle_last_success_ts` のメトリクスを確認します。
2. `recycler_instance_recycle_last_success_ts` が長時間更新されていない場合は、回収が停止している可能性があります。ログを調査してください。

### データの整合性に問題があると疑われる場合の調査方法

**確認方法**:

1. `enable_checker = true` と `enable_inverted_check = true` に設定されていることを確認します。
2. `check_object_interval_seconds` を適切に短くし、チェック頻度を上げます。
3. checker が検出した異常を MS ダッシュボードで確認します。
4. checker のレポートに基づいて余分な不要ファイルを手動で処理するか、オブジェクトのバージョニングを使用して誤って削除されたファイルを復元します。

---

> **注**: 上記のチューニングの推奨事項は、実際のクラスターの規模、ストレージ容量、業務の特性を踏まえて評価する必要があります。チューニング中はシステムの負荷と業務への影響を注意深く監視し、パラメータを徐々に調整して最適な設定を見つけることを推奨します。
