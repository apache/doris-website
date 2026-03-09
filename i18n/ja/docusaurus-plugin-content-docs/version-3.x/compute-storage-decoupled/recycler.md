---
{
  "title": "リサイクラー",
  "language": "ja",
  "description": "ビッグデータの時代において、データライフサイクル管理は分散データベースシステムにとって中核的な課題の一つとなっている。"
}
---
# Doris ストレージ・コンピュート分離データリサイクル

## 概要

ビッグデータ時代において、データライフサイクル管理は分散データベースシステムの中核的課題の一つとなっています。ビジネスデータ量の爆発的成長に伴い、データセキュリティを確保しながら効率的なストレージ容量回収を実現する方法は、あらゆるデータベース製品が対処しなければならない重要な問題となっています。

次世代リアルタイム分析データベースである Apache Doris は、ストレージ・コンピュート分離アーキテクチャの下で Mark-for-Deletion データリサイクル戦略を採用し、この基盤に基づいて深い最適化と強化を構築しています。きめ細かい階層リサイクルメカニズム、柔軟で構成可能な有効期限保護、複数のデータ整合性チェック、包括的な可観測性システムの導入により、分散環境の複雑性を十分に考慮しながら、Doris は独立した Recycler コンポーネント、インテリジェントな並行制御、完全な監視メトリクスを設計しました。これにより、ユーザーに効率的かつ制御可能なエンタープライズグレードのデータライフサイクル管理ソリューションを提供し、パフォーマンス、セキュリティ、制御性の最適なバランスを実現しています。

本記事では、設計思想から技術実装まで、中核原理から実用的なチューニングまで、Doris のストレージ・コンピュート分離アーキテクチャにおけるデータリサイクルメカニズムについて詳細に分析し、この成熟したソリューションの技術詳細と応用価値を包括的に紹介します。

## 1. 一般的なデータリサイクル戦略の比較

### 1.1 同期削除

最も直接的な削除方法です。データが削除された時（例：drop table）、関連するメタデータと対応するファイルが即座に削除されます。データが削除されると回復することはできません。操作はシンプルで直接的ですが、削除速度は遅く、リスクは高いです。

### 1.2 整合性削除（Reverse）

このアプローチは、定期的な整合性メカニズムによってどのデータが削除可能かを決定します。データが削除された時（例：drop table）、メタデータのみが削除されます。システムは定期的にデータ整合性を実行し、ファイルデータをスキャンし、メタデータによって参照されなくなった、または有効期限が切れたデータを識別してから一括削除を実行します。

### 1.3 削除マーク（Mark-for-Deletion）（Forward）

このアプローチは、削除されたメタデータを定期的にスキャンすることによってどのデータが削除可能かを決定します。データが削除された時（例：drop table）、データを直接削除するのではなく、削除対象のメタデータを削除済みとしてマークします。システムは定期的にマークされたメタデータをスキャンし、対応するファイルを見つけて一括削除を行います。

## 2. Doris ストレージ・コンピュート分離 Mark-for-Deletion の利点

Doris のストレージ・コンピュート分離アーキテクチャは mark-for-deletion 方式を選択し、データ整合性を効果的に確保しながら、パフォーマンス、セキュリティ、リソース利用の最適なバランスを実現しています。

drop table を例にとると、mark-for-deletion は他の2つのアプローチと比較して以下の顕著な利点があります：

### 2.1 パフォーマンス上の利点

- **高速な応答時間**：Drop table 操作は、メタデータ KV データを削除済みとしてマークするだけで済み、ファイル I/O 操作の完了を待つ必要がないため、ユーザーは即座に応答を受け取ることができます。これは大規模なテーブル削除シナリオで特に重要であり、長時間のブロック期間を回避します。
- **高いバッチ処理効率**：削除マークが付けられたメタデータ KV を定期的にスキャンすることで、ファイル削除操作をバッチ処理でき、システムコール頻度を削減し、全体的な I/O 効率を向上させます。

### 2.2 セキュリティ上の利点

- **誤操作保護**：Mark-for-deletion は実際のファイル削除前にバッファ期間を提供し、その間に誤って削除されたテーブルを回復できるため、人的操作リスクを大幅に削減します。
- **トランザクションセキュリティ**：マーキング操作は軽量なメタデータ変更であり、原子性をより容易に確保し、削除中のシステム障害によるデータ不整合問題を削減します。

### 2.3 リソース管理上の利点

- **システム負荷バランシング**：ファイル削除操作はシステムのアイドル時間に実行でき、ビジネスピーク時の大量の I/O リソース消費による通常操作への影響を回避します。
- **制御可能な削除ペース**：削除速度はシステム負荷に基づいて動的に調整でき、大規模削除操作によるシステム影響を回避します。

### 2.4 他のソリューションとの比較

- **同期削除と比較**：大規模テーブル削除時の長時間待機を回避し、ユーザー体験を向上させます。さらに、削除バッファ期間を提供してセキュリティを確保し、ある程度人的操作ミスを防止します。
- **整合性削除と比較**：削除マークが付けられたメタデータのみをスキャンするため、スキャンデータがより的確になり、不要な I/O 操作を削減し、効率が高く、すべてのファイルを走査して参照されているかを判断する必要がなく、より高速で効率的な削除を実現します。

## 3. Doris データリサイクルの原理

recycler は独立してデプロイされるコンポーネントで、期限切れのガベージファイルを定期的にリサイクルする責任を負います。1つの recycler は複数のインスタンスを同時にリサイクルでき、1つのインスタンスは同時に1つの recycler によってのみリサイクルされます。

### 3.1 削除マーク（Mark-for-Deletion）

drop コマンドが実行されるか、システムがガベージデータを生成する時（例：compacted rowset）、対応するメタデータ KV がリサイクル対象としてマークされます。recycler は定期的にインスタンス内のリサイクル KV をスキャンし、対応するオブジェクトファイルを削除してから、リサイクル KV を削除し、削除順序の安全性を確保します。

### 3.2 階層構造

recycler がインスタンスデータをリサイクルする際、複数のタスクが並行して実行されます。例：recycle_indexes、recycle_partition、recycle_compacted_rowsets、recycle_txn など。

リサイクル中のデータは階層構造に従って削除されます：テーブルを削除すると対応するパーティションが削除され、パーティションを削除すると対応するタブレットが削除され、タブレットを削除すると対応する rowset が削除され、rowset を削除すると対応する segment ファイルが削除されます。最終実行オブジェクトは Doris の最小ファイル単位である segment ファイルです。

drop table を例にとると、リサイクルプロセス中に、システムは最初に segment オブジェクトファイルを削除し、成功後に recycle rowset KV を削除し、すべてのタブレット rowset が正常に削除された後に recycle tablet KV を削除し、以下同様に、最終的にテーブル内のすべてのオブジェクトファイルと recycle KV を削除します。

### 3.3 有効期限メカニズム

リサイクル対象の各オブジェクトは、その KV 内に対応する有効期限時間を記録します。システムは様々なリサイクル KV をスキャンして有効期限時間を計算することによって削除するオブジェクトを識別します。ユーザーが誤ってテーブルを drop した場合、有効期限メカニズムにより、recycler は即座にそのデータを削除せず、保持時間を待機し、データ回復の可能性を提供します。

### 3.4 信頼性保証

1. **段階的削除**：最初にデータファイルを削除し、次にメタデータを削除し、最後にインデックスまたはパーティションキーを削除し、削除順序の安全性を確保します。

2. **リース保護メカニズム**：各 recycler はリサイクルを開始する前にリースを取得する必要があり、定期的にリースを更新するバックグラウンドスレッドを開始します。リースが期限切れまたはステータスが IDLE の場合にのみ新しい recycler が引き継ぎ可能で、1つのインスタンスが同時に1つの recycler によってのみリサイクルされることを確保し、並行リサイクルによるデータ不整合問題を回避します。

### 3.5 複数チェックメカニズム

Recycler は FE メタデータ、MS KV、オブジェクトファイル間の複数の相互チェックメカニズム（checker）を実装します。checker はバックグラウンドですべての Recycler KV、オブジェクトファイル、FE インメモリメタデータに対して順方向および逆方向チェックを実行します。

segment ファイル KV とオブジェクトファイルのチェックを例にとると：
- 順方向チェック：すべての KV をスキャンして対応する segment ファイルが存在するか、対応する segment 情報が FE メモリに存在するかをチェックします。
- 逆方向チェック：すべての segment ファイルをスキャンして対応する KV が存在するか、対応する segment 情報が FE メモリに存在するかを検証します。

複数チェックメカニズムは recycler データ削除の正確性を確保します。特定の状況下でリサイクル未実施または過剰リサイクルが発生した場合、checker は関連情報を捕捉します。運用担当者は checker 情報に基づいて余分なガベージファイルを手動削除するか、オブジェクトマルチバージョニングに依存して誤って削除されたファイルを回復でき、効果的な安全網を提供します。

現在、segment ファイル、idx ファイル、delete bitmap メタデータなどの順方向および逆方向チェックが実装されています。将来的には、すべてのメタデータのチェックを実装して、recycler の正確性と信頼性をさらに確保します。

## 4. 可観測性メカニズム

Recycler のリサイクル効率と進捗はユーザーにとって非常に重要です。そのため、多数の視覚的監視メトリクスと必要なログを追加することで、recycler の可観測性を大幅に改善しました。視覚的メトリクスにより、ユーザーはリサイクル進捗、効率、例外、その他の基本情報を直感的に確認できます。また、リサイクル時間の推定など、より詳細な情報をユーザーが確認できるように、より多くのメトリクスを提供しています。追加されたログにより、運用および開発チームがより迅速に問題を特定できます。

### 4.1 ユーザーの懸念への対応

**基本的な質問：**
- リポジトリレベルのリサイクル速度：1秒あたりのリサイクル済みバイト数、1秒あたりの各種オブジェクトリサイクル数量
- リポジトリレベルの各リサイクルでのデータ量と消費時間
- リポジトリレベルのリサイクル進捗：リサイクル済みデータ量、リサイクル待ちデータ量

**高度な質問：**
- 各ストレージバックエンドのリサイクル状況
- Recycler の成功時刻、失敗時刻
- 次回 Recycler 実行の推定時刻

これらの情報はすべて MS パネルを通じてリアルタイムで観測できます。

### 4.2 観測メトリクス

| 変数名 | メトリクス名 | ディメンション/ラベル | 説明 | 例 |
|--------|------------|---------------------|------|-----|
| g_bvar_recycler_vault_recycle_status | recycler_vault_recycle_status | instance_id, resource_id, status | インスタンス ID、リソース ID、ステータス別の vault リサイクル操作ステータス数を記録 | recycler_vault_recycle_status{instance_id="default_instance_id",resource_id="1",status="normal"} 8 |
| g_bvar_recycler_vault_recycle_task_concurrency | recycler_vault_recycle_task_concurrency | instance_id, resource_id | インスタンス ID とリソース ID 別の vault リサイクルファイルタスク並行数をカウント | recycler_vault_recycle_task_concurrency{instance_id="default_instance_id",resource_id="1"} 2 |
| g_bvar_recycler_instance_last_round_recycled_num | recycler_instance_last_round_recycled_num | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別の前回ラウンドでリサイクルされたオブジェクト数をカウント | recycler_instance_last_round_recycled_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_to_recycle_num | recycler_instance_last_round_to_recycle_num | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別の前回ラウンドでリサイクル対象のオブジェクト数をカウント | recycler_instance_last_round_to_recycle_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_recycled_bytes | recycler_instance_last_round_recycled_bytes | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別の前回ラウンドでリサイクルされたデータサイズ（バイト）をカウント | recycler_instance_last_round_recycled_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_to_recycle_bytes | recycler_instance_last_round_to_recycle_bytes | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別の前回ラウンドでリサイクル対象のデータサイズ（バイト）をカウント | recycler_instance_last_round_to_recycle_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_recycle_elpased_ts | recycler_instance_last_round_recycle_elpased_ts | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別の前回リサイクル操作の経過時間（ms）を記録 | recycler_instance_last_round_recycle_elpased_ts{instance_id="default_instance_id",resource_type="recycle_rowsets"} 62 |
| g_bvar_recycler_instance_recycle_round | recycler_instance_recycle_round | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別のリサイクル操作ラウンド数をカウント | recycler_instance_recycle_round{instance_id="default_instance_id_2",object_type="recycle_rowsets"} 2 |
| g_bvar_recycler_instance_recycle_time_per_resource | recycler_instance_recycle_time_per_resource | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別のリサイクル速度を記録（リソースあたりの必要時間（ms）、-1はリサイクルなしを意味） | recycler_instance_recycle_time_per_resource{instance_id="default_instance_id",resource_type="recycle_rowsets"} 4.76923 |
| g_bvar_recycler_instance_recycle_bytes_per_ms | recycler_instance_recycle_bytes_per_ms | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別のリサイクル速度を記録（1ミリ秒あたりのリサイクル済みバイト数、-1はリサイクルなしを意味） | recycler_instance_recycle_bytes_per_ms{instance_id="default_instance_id",resource_type="recycle_rowsets"} 217.887 |
| g_bvar_recycler_instance_recycle_total_num_since_started | recycler_instance_recycle_total_num_since_started | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別の recycler 開始以降の総リサイクル数をカウント | recycler_instance_recycle_total_num_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 49 |
| g_bvar_recycler_instance_recycle_total_bytes_since_started | recycler_instance_recycle_total_bytes_since_started | instance_id, resource_type | インスタンス ID とオブジェクトタイプ別の recycler 開始以降の総リサイクルサイズ（バイト）をカウント | recycler_instance_recycle_total_bytes_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 40785 |
| g_bvar_recycler_instance_running_counter | recycler_instance_running_counter | - | 現在リサイクル中のインスタンス数をカウント | recycler_instance_running_counter 0 |
| g_bvar_recycler_instance_last_recycle_duration | recycler_instance_last_round_recycle_duration | instance_id | インスタンス ID 別の前回リサイクルラウンドの総所要時間を記録 | recycler_instance_last_recycle_duration{instance_id="default_instance_id"} 64 |
| g_bvar_recycler_instance_next_ts | recycler_instance_next_ts | instance_id | インスタンス ID 別に config の recycle_interval_seconds に基づいて次回リサイクル時刻を推定 | recycler_instance_next_ts{instance_id="default_instance_id"} 1750400266781 |
| g_bvar_recycler_instance_recycle_st_ts | recycler_instance_recycle_start_ts | instance_id | インスタンス ID 別の総リサイクルプロセスの開始時刻を記録 | recycler_instance_recycle_st_ts{instance_id="default_instance_id"} 1750400236717 |
| g_bvar_recycler_instance_recycle_ed_ts | recycler_instance_recycle_end_ts | instance_id | インスタンス ID 別の総リサイクルプロセスの終了時刻を記録 | recycler_instance_recycle_ed_ts{instance_id="default_instance_id"} 1750400236781 |
| g_bvar_recycler_instance_recycle_last_success_ts | recycler_instance_recycle_last_success_ts | instance_id | インスタンス ID 別の前回成功したリサイクル時刻を記録 | recycler_instance_recycle_last_success_ts{instance_id="default_instance_id"} 1750400236781 |

## 5. パラメータチューニング

一般的な recycler パラメータとその説明：

```
// Recycler interval in seconds
CONF_mInt64(recycle_interval_seconds, "3600");

// Common retention time, applies to all objects without their own retention time
CONF_mInt64(retention_seconds, "259200");

// Maximum number of instances a recycler can recycle simultaneously
CONF_Int32(recycle_concurrency, "16");

// Retention time for compacted rowsets in seconds
CONF_mInt64(compacted_rowset_retention_seconds, "1800");

// Retention time for dropped indexes in seconds
CONF_mInt64(dropped_index_retention_seconds, "10800");

// Retention time for dropped partitions in seconds
CONF_mInt64(dropped_partition_retention_seconds, "10800");

// Recycle whitelist, specify instance IDs separated by commas, defaults to recycling all instances if empty
CONF_Strings(recycle_whitelist, "");

// Recycle blacklist, specify instance IDs separated by commas, defaults to recycling all instances if empty
CONF_Strings(recycle_blacklist, "");

// Object IO worker concurrency: e.g., object list, delete
CONF_mInt32(instance_recycler_worker_pool_size, "32");

// Recycle object concurrency: e.g., recycle_tablet, recycle_rowset
CONF_Int32(recycle_pool_parallelism, "40");

// Whether to enable checker
CONF_Bool(enable_checker, "false");

// Whether to enable reverse checker
CONF_Bool(enable_inverted_check, "false");

// Checker interval
CONF_mInt32(check_object_interval_seconds, "43200");

// Whether to enable recycler observation metrics
CONF_Bool(enable_recycler_stats_metrics, "false");

// Recycle storage backend whitelist, specify vault names separated by commas, defaults to recycling all vaults if empty
CONF_Strings(recycler_storage_vault_white_list, "");
```
### 一般的なチューニングシナリオ Q&A

#### 1. リサイクルパフォーマンスチューニング

**Q1: リサイクル速度が遅すぎる場合はどうすればよいですか？**

A1: 以下の観点からチューニングできます：
- 並行性を増加：
  - recycle_concurrency（デフォルト16）を増加：同時にリサイクルされるインスタンス数を増加
  - instance_recycler_worker_pool_size（デフォルト32）を増加：オブジェクトIO操作の並行性を増加
  - recycle_pool_parallelism（デフォルト40）を増加：リサイクルオブジェクトの並行性を増加
- リサイクル間隔を短縮：recycle_interval_secondsをデフォルト3600秒から削減、例：1800秒に
- ホワイトリストメカニズムを使用：recycle_whitelistを通じて重要なインスタンスを優先的にリサイクル

**Q2: リサイクル圧力が高すぎてビジネスに影響する場合はどう調整すればよいですか？**

A2: 以下の戦略を採用してリサイクル圧力を軽減できます：
- 並行性を削減：
  - recycle_concurrencyを適切に削減して、同時に多すぎるインスタンスのリサイクルを避ける
  - instance_recycler_worker_pool_sizeとrecycle_pool_parallelismを削減
- リサイクル間隔を延長：recycle_interval_secondsを増加、例：7200秒に調整
- ブラックリストを使用：recycle_blacklistを通じて高負荷インスタンスを一時的に除外
- オフピークリサイクル：ビジネスのオフピーク時間にリサイクル操作を実行

#### 2. ストレージ容量チューニング

**Q3: ストレージ容量が不足し、ガベージクリーンアップを加速する必要がある場合はどうすればよいですか？**

A3: 各種オブジェクトの保持時間を調整できます：
- 一般的な保持時間を短縮：retention_secondsをデフォルト259200秒（3日）から削減
- 特定オブジェクトの対象調整：
  - compacted_rowset_retention_seconds（デフォルト1800秒）は適切に短縮可能
  - dropped_index_retention_secondsとdropped_partition_retention_seconds（デフォルト10800秒）は必要に応じて調整可能
- 選択的ストレージバックエンドリサイクル：recycler_storage_vault_white_listを通じて特定ストレージを優先的にクリーンアップ

**Q4: 誤削除を防ぐためにより長いデータ保持が必要な場合はどうすればよいですか？**

A4: 対応する保持時間を延長：
- retention_secondsをより長い期間に増加、例：604800秒
- オブジェクトの重要度に応じて対応する保持パラメータを調整
- 重要なパーティションはdropped_partition_retention_secondsを通じてより長い保持時間を設定可能

#### 3. モニタリングとトラブルシューティングチューニング

**Q5: より良いモニタリングとトラブルシューティング機能を有効にするにはどうすればよいですか？**

A5: 以下のモニタリング機能を有効にすることをお勧めします：
- 観測メトリクスを有効化：enable_recycler_stats_metrics = trueを設定
- チェックメカニズムを有効化：
  - enable_checker = trueを設定してフォワードチェックを有効化
  - enable_inverted_check = trueを設定してリバースチェックを有効化
  - check_object_interval_seconds（デフォルト43200秒/12時間）を適切なチェック頻度に調整

**Q6: データ整合性の問題が疑われる場合はどうトラブルシューティングすればよいですか？**

A6: checkerメカニズムを利用して検査：
- enable_checkerとenable_inverted_checkの両方がtrueであることを確認
- check_object_interval_secondsを適切に短縮してチェック頻度を増加
- MSパネルを通じてcheckerが発見した異常を観測
- checkerレポートに基づいて過剰なガベージファイルを手動で処理または誤削除されたファイルを補完

#### 4. 特殊シナリオチューニング

**Q7: インスタンスリサイクルの異常を一時的に処理するにはどうすればよいですか？**

A7: ホワイトリストとブラックリストメカニズムを使用：
- 問題のあるインスタンスを一時的にスキップ：異常なインスタンスIDをrecycle_blacklistに追加
- 特定インスタンスを優先処理：優先処理が必要なインスタンスIDをrecycle_whitelistに追加
- ストレージバックエンド選択：recycler_storage_vault_white_listを通じて特定ストレージバックエンドを選択的にリサイクル

**Q8: 大きなテーブルの削除によりリサイクルタスクのバックログが発生した場合はどうすればよいですか？**

A8: 包括的チューニング戦略：
- バックログを処理するために一時的に並行性パラメータを増加
- 大きなオブジェクトの保持時間を適切に短縮
- ホワイトリストを使用して深刻なバックログのあるインスタンスを優先処理
- 必要に応じて複数のリサイクラーを配置して負荷を分散

**Q9: 長時間クエリ中にオブジェクトストレージで「404 file not found」エラーが発生した場合はどうすればよいですか？**

A9: クエリ実行時間が非常に長く、クエリ中にタブレットがcompactionを受けると、オブジェクトストレージ上のマージされたrowsetがリサイクルされ、「404 file not found」エラーでクエリが失敗する可能性があります。解決策：
- compacted rowsetの保持時間を増加：compacted_rowset_retention_secondsをデフォルト1800秒から増加、例：
  - 長時間クエリのあるシナリオでは、7200秒（またはより長い）への調整を推奨
  - 最大クエリ時間に基づいて適切な保持時間を設定

これにより、長時間クエリ実行中に必要なrowsetが早期にリサイクルされることを防ぎ、クエリの失敗を回避します。

---

**注意**: 上記のチューニング提案は、実際のクラスタ規模、ストレージ容量、ビジネス特性、その他の要因に基づいて具体的に調整する必要があります。チューニングプロセス中は、システム負荷とビジネスへの影響を注意深くモニタリングし、パラメータを段階的に調整して最適な構成を見つけることをお勧めします。

## まとめ

Apache Dorisのストレージ・コンピュート分離アーキテクチャ下でのmark-for-deletionメカニズムは、パフォーマンス、セキュリティ、リソース利用を巧妙にバランスさせることにより、従来のデータリサイクル方法の固有の欠陥を解決するだけでなく、ユーザーに完全で信頼性があり、観測可能なデータ管理ソリューションも提供します。

きめ細かい階層リサイクル設計からインテリジェントな有効期限保護メカニズムまで、包括的な複数チェックシステムから豊富な観測可能性メトリクスまで、Dorisのデータリサイクルメカニズムは、すべての詳細においてユーザーニーズの深い理解と技術品質への飽くなき追求を反映しています。特に、その柔軟なパラメータチューニング機能により、異なる規模とシナリオのユーザーが最も適した構成ソリューションを見つけることができます。

今後も、このメカニズムの最適化と改善を継続し、既存の利点を維持しながら、さらなるリサイクル効率の向上、インテリジェンスレベルの向上、モニタリング次元の充実を図り、ユーザーにとってより効率的で信頼性の高いリアルタイムデータ分析プラットフォームを構築していきます。ユーザーの皆様には実践においてより多くの可能性を探求し、私たちと共にApache Dorisを継続的に前進させていただけることを歓迎いたします。
