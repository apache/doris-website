---
{
  "title": "リサイクラー",
  "language": "ja",
  "description": "ビッグデータの時代において、データライフサイクル管理は分散データベースシステムにとって中核的な課題の一つとなっています。"
}
---
# Doris ストレージ・コンピュート分離データリサイクル

## はじめに

ビッグデータ時代において、データライフサイクル管理は分散データベースシステムの中核的な課題の一つとなっています。ビジネスデータ量の爆発的な増加に伴い、データセキュリティを確保しながら効率的なストレージ領域の回収を実現する方法は、あらゆるデータベース製品が対処すべき重要な問題となっています。

Apache Dorisは、次世代リアルタイム分析データベースとして、ストレージ・コンピュート分離アーキテクチャの下でMark-for-Deletionデータリサイクル戦略を採用し、この基盤の上で深い最適化と機能強化を構築しています。細かい粒度の階層リサイクルメカニズム、柔軟で設定可能な有効期限保護、複数のデータ整合性チェック、包括的な可観測性システムを導入し、分散環境の複雑さを十分に考慮して、Dorisは独立したRecyclerコンポーネント、インテリジェントな並行制御、完全な監視メトリックを設計しました。これにより、効率的かつ制御可能なエンタープライズグレードのデータライフサイクル管理ソリューションをユーザーに提供し、パフォーマンス、セキュリティ、制御可能性の最適なバランスを実現しています。

本記事では、Dorisのストレージ・コンピュート分離アーキテクチャにおけるデータリサイクルメカニズムについて、設計哲学から技術実装まで、中核原理から実用的なチューニングまで、この成熟したソリューションの技術詳細とアプリケーション価値を包括的に紹介し、詳細に分析します。

## 1. 一般的なデータリサイクル戦略の比較

### 1.1 同期削除

最も直接的な削除方法。データが削除される際（例：drop table）、関連するメタデータと対応するファイルが即座に削除されます。データが削除されると復旧できません。操作はシンプルで直接的ですが、削除速度は遅く、リスクが高いです。

### 1.2 照合削除（Reverse）

このアプローチは、定期的な照合メカニズムによってどのデータを削除できるかを決定します。データが削除される際（例：drop table）、メタデータのみが削除されます。システムは定期的にデータ照合を実行し、ファイルデータをスキャンして、メタデータによって参照されなくなったデータや有効期限が切れたデータを特定し、バッチ削除を実行します。

### 1.3 削除マーキング（Forward）

このアプローチは、削除されたメタデータを定期的にスキャンすることによってどのデータを削除できるかを決定します。データが削除される際（例：drop table）、データを直接削除する代わりに、削除されるメタデータに削除マークを付けます。システムは定期的にマークされたメタデータをスキャンし、対応するファイルを見つけてバッチ削除を行います。

## 2. Dorisストレージ・コンピュート分離Mark-for-Deletionの利点

Dorisのストレージ・コンピュート分離アーキテクチャはmark-for-deletion方式を選択し、データ整合性を効果的に確保しながら、パフォーマンス、セキュリティ、リソース使用率の最適なバランスを実現しています。

drop tableを例に取ると、mark-for-deletionは他の2つのアプローチと比較して以下の顕著な利点があります：

### 2.1 パフォーマンス上の利点

- **高速レスポンス時間**: drop table操作はメタデータKVデータに削除マークを付けるだけで、ファイルI/O操作の完了を待つ必要がなく、ユーザーは即座にレスポンスを受け取れます。これは大きなテーブル削除シナリオにおいて特に重要で、長時間のブロッキング期間を回避します。
- **高いバッチ処理効率**: 削除マークされたメタデータKVを定期的にスキャンすることで、ファイル削除操作のバッチ処理が可能になり、システムコール頻度を削減し、全体的なI/O効率を向上させます。

### 2.2 セキュリティ上の利点

- **誤操作保護**: mark-for-deletionは、実際のファイル削除前にバッファ期間を提供し、その間に誤って削除されたテーブルを復旧できるため、人的操作リスクを大幅に削減します。
- **トランザクションセキュリティ**: マーキング操作は軽量なメタデータ変更であり、原子性をより容易に確保できるため、削除中のシステム障害によるデータ不整合の問題を削減します。

### 2.3 リソース管理上の利点

- **システム負荷バランス**: ファイル削除操作はシステムのアイドル時間中に実行でき、ビジネスピーク時間中の大量I/Oリソース消費による通常業務への影響を回避します。
- **制御可能な削除ペース**: システム負荷に基づいて削除速度を動的に調整でき、大量削除操作によるシステム影響を回避します。

### 2.4 他のソリューションとの比較

- **同期削除との比較**: 大きなテーブル削除時の長時間待機を回避し、ユーザー体験を向上させます。さらに、削除バッファ期間を提供してセキュリティを確保し、ある程度の人的操作事故を防止します。
- **照合削除との比較**: 削除マークされたメタデータのみをスキャンするため、スキャンデータがより対象を絞れ、不要なI/O操作を削減し、効率が高く、すべてのファイルを巡回して参照されているかどうかを判断する必要がなく、より高速で効率的な削除を実現します。

## 3. Dorisデータリサイクルの原理

recyclerは独立してデプロイされるコンポーネントで、期限切れのガベージファイルを定期的にリサイクルする責任があります。1つのrecyclerは同時に複数のインスタンスをリサイクルでき、1つのインスタンスは同時に1つのrecyclerによってのみリサイクルされます。

### 3.1 削除マーキング

dropコマンドが実行されるか、システムがガベージデータ（例：compactedされたrowset）を生成するたびに、対応するメタデータKVがリサイクル対象としてマークされます。recyclerは定期的にインスタンス内のrecycle KVをスキャンし、対応するオブジェクトファイルを削除し、その後recycle KVを削除して、削除順序の安全性を確保します。

### 3.2 階層構造

recyclerがインスタンスデータをリサイクルする際、recycle_indexes、recycle_partition、recycle_compacted_rowsets、recycle_txnなどの複数のタスクが並行して実行されます。

リサイクル中、データは階層構造に従って削除されます：テーブルを削除すると対応するパーティションを削除し、パーティションを削除すると対応するtabletを削除し、tabletを削除すると対応するrowsetを削除し、rowsetを削除すると対応するsegmentファイルを削除します。最終実行オブジェクトはDorisの最小ファイル単位であるsegmentファイルです。

drop tableを例に取ると、リサイクルプロセス中、システムは最初にsegmentオブジェクトファイルを削除し、成功後にrecycle rowset KVを削除し、すべてのtablet rowsetが正常に削除された後にrecycle tablet KVを削除し、以下同様に、最終的にテーブル内のすべてのオブジェクトファイルとrecycle KVを削除します。

### 3.3 有効期限メカニズム

リサイクル対象の各オブジェクトは、そのKVに対応する有効期限時刻を記録します。システムは様々なrecycle KVをスキャンし、有効期限時刻を計算することで削除するオブジェクトを特定します。ユーザーが誤ってテーブルをdropした場合、有効期限メカニズムにより、recyclerは即座にそのデータを削除せず、保持時間を待機し、データ復旧の可能性を提供します。

### 3.4 信頼性保証

1. **段階的削除**: 最初にデータファイルを削除し、次にメタデータを削除し、最後にインデックスまたはパーティションキーを削除して、削除順序の安全性を確保します。

2. **リース保護メカニズム**: 各recyclerはリサイクルを開始する前にリースを取得する必要があり、バックグラウンドスレッドを開始してリースを定期的に更新します。リースが期限切れになるかステータスがIDLEの場合のみ、新しいrecyclerが引き継ぐことができ、1つのインスタンスが同時に1つのrecyclerによってのみリサイクルされることを確保し、並行リサイクルによるデータ不整合の問題を回避します。

### 3.5 複数チェックメカニズム

RecyclerはFEメタデータ、MS KV、オブジェクトファイル間の複数の相互チェックメカニズム（checker）を実装しています。checkerはバックグラウンドですべてのRecycler KV、オブジェクトファイル、FEインメモリメタデータに対して順方向および逆方向チェックを実行します。

segmentファイルKVとオブジェクトファイルのチェックを例に取ると：
- 順方向チェック: すべてのKVをスキャンして対応するsegmentファイルが存在するか、対応するsegment情報がFEメモリに存在するかをチェック。
- 逆方向チェック: すべてのsegmentファイルをスキャンして対応するKVが存在するか、対応するsegment情報がFEメモリに存在するかを確認。

複数のチェックメカニズムにより、recyclerのデータ削除の正確性を確保します。特定の状況下でリサイクルされていない、または過度にリサイクルされた状況が発生した場合、checkerは関連情報をキャプチャします。運用担当者はchecker情報に基づいて余剰のガベージファイルを手動で削除したり、オブジェクトマルチバージョニングに依存して誤って削除されたファイルを復旧したりでき、効果的な安全ネットを提供します。

現在、segmentファイル、idxファイル、delete bitmapメタデータなどの順方向および逆方向チェックが実装されています。将来的には、すべてのメタデータのチェックを実装し、recyclerの正確性と信頼性をさらに確保します。

## 4. 可観測性メカニズム

Recyclerのリサイクル効率と進捗はユーザーにとって大きな関心事です。そのため、多数の視覚的監視メトリックと必要なログを追加することで、recyclerの可観測性を大幅に向上させました。視覚的メトリックにより、ユーザーはリサイクルの進捗、効率、例外、その他の基本情報を直感的に確認できます。また、特定のインスタンスの次回リサイクル時間の推定など、より詳細な情報をユーザーが確認できるメトリックも提供しています。追加されたログにより、運用チームと開発チームがより迅速に問題を特定することも可能になりました。

### 4.1 ユーザーの懸念への対応

**基本的な質問:**
- リポジトリレベルのリサイクル速度：毎秒リサイクルされるバイト数、毎秒リサイクルされる各種オブジェクトの数量
- リポジトリレベルのリサイクル毎のデータ量と時間消費
- リポジトリレベルのリサイクル進捗：リサイクル済みデータ量、リサイクル待ちデータ量

**高度な質問:**
- 各ストレージバックエンドのリサイクル状況
- Recyclerの成功時刻、失敗時刻
- 次回Recycler実行の推定時刻

これらすべての情報は、MSパネルを通じてリアルタイムで観測できます。

### 4.2 観測メトリック

| 変数名 | メトリック名 | 次元/ラベル | 説明 | 例 |
|-------|-------------|-----------|-----|---|
| g_bvar_recycler_vault_recycle_status | recycler_vault_recycle_status | instance_id, resource_id, status | インスタンスID、リソースID、ステータス別のvaultリサイクル操作のステータス数を記録 | recycler_vault_recycle_status{instance_id="default_instance_id",resource_id="1",status="normal"} 8 |
| g_bvar_recycler_vault_recycle_task_concurrency | recycler_vault_recycle_task_concurrency | instance_id, resource_id | インスタンスIDとリソースID別のvaultリサイクルファイルタスクの並行数をカウント | recycler_vault_recycle_task_concurrency{instance_id="default_instance_id",resource_id="1"} 2 |
| g_bvar_recycler_instance_last_round_recycled_num | recycler_instance_last_round_recycled_num | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最終ラウンドでリサイクルされたオブジェクト数をカウント | recycler_instance_last_round_recycled_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_to_recycle_num | recycler_instance_last_round_to_recycle_num | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最終ラウンドでリサイクル予定のオブジェクト数をカウント | recycler_instance_last_round_to_recycle_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_recycled_bytes | recycler_instance_last_round_recycled_bytes | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最終ラウンドでリサイクルされたデータサイズ（バイト）をカウント | recycler_instance_last_round_recycled_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_to_recycle_bytes | recycler_instance_last_round_to_recycle_bytes | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最終ラウンドでリサイクル予定のデータサイズ（バイト）をカウント | recycler_instance_last_round_to_recycle_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_recycle_elpased_ts | recycler_instance_last_round_recycle_elpased_ts | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最後のリサイクル操作の経過時間（ms）を記録 | recycler_instance_last_round_recycle_elpased_ts{instance_id="default_instance_id",resource_type="recycle_rowsets"} 62 |
| g_bvar_recycler_instance_recycle_round | recycler_instance_recycle_round | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別のリサイクル操作ラウンド数をカウント | recycler_instance_recycle_round{instance_id="default_instance_id_2",object_type="recycle_rowsets"} 2 |
| g_bvar_recycler_instance_recycle_time_per_resource | recycler_instance_recycle_time_per_resource | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別のリサイクル速度を記録（リソース1つあたりの必要時間（ms）、-1はリサイクルなしを意味） | recycler_instance_recycle_time_per_resource{instance_id="default_instance_id",resource_type="recycle_rowsets"} 4.76923 |
| g_bvar_recycler_instance_recycle_bytes_per_ms | recycler_instance_recycle_bytes_per_ms | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別のリサイクル速度を記録（ミリ秒あたりのリサイクルバイト数、-1はリサイクルなしを意味） | recycler_instance_recycle_bytes_per_ms{instance_id="default_instance_id",resource_type="recycle_rowsets"} 217.887 |
| g_bvar_recycler_instance_recycle_total_num_since_started | recycler_instance_recycle_total_num_since_started | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別のrecycler開始以降の総リサイクル数量をカウント | recycler_instance_recycle_total_num_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 49 |
| g_bvar_recycler_instance_recycle_total_bytes_since_started | recycler_instance_recycle_total_bytes_since_started | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別のrecycler開始以降の総リサイクルサイズ（バイト）をカウント | recycler_instance_recycle_total_bytes_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 40785 |
| g_bvar_recycler_instance_running_counter | recycler_instance_running_counter | - | 現在リサイクル中のインスタンス数をカウント | recycler_instance_running_counter 0 |
| g_bvar_recycler_instance_last_recycle_duration | recycler_instance_last_round_recycle_duration | instance_id | インスタンスID別の最後のリサイクルラウンドの総継続時間を記録 | recycler_instance_last_recycle_duration{instance_id="default_instance_id"} 64 |
| g_bvar_recycler_instance_next_ts | recycler_instance_next_ts | instance_id | インスタンスID別にconfigのrecycle_interval_secondsに基づいて次回リサイクル時刻を推定 | recycler_instance_next_ts{instance_id="default_instance_id"} 1750400266781 |
| g_bvar_recycler_instance_recycle_st_ts | recycler_instance_recycle_start_ts | instance_id | インスタンスID別の総リサイクルプロセスの開始時刻を記録 | recycler_instance_recycle_st_ts{instance_id="default_instance_id"} 1750400236717 |
| g_bvar_recycler_instance_recycle_ed_ts | recycler_instance_recycle_end_ts | instance_id | インスタンスID別の総リサイクルプロセスの終了時刻を記録 | recycler_instance_recycle_ed_ts{instance_id="default_instance_id"} 1750400236781 |
| g_bvar_recycler_instance_recycle_last_success_ts | recycler_instance_recycle_last_success_ts | instance_id | インスタンスID別の最後の成功したリサイクル時刻を記録 | recycler_instance_recycle_last_success_ts{instance_id="default_instance_id"} 1750400236781 |

## 5. パラメータチューニング

一般的なrecyclerパラメータとその説明：

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

#### 1. リサイクル性能チューニング

**Q1: リサイクル速度が遅すぎる場合はどうすれば良いですか？**

A1: 以下の観点からチューニングできます：
- 同時実行数を増加：
  - recycle_concurrency（デフォルト16）を増加：同時にリサイクルするインスタンス数を増加
  - instance_recycler_worker_pool_size（デフォルト32）を増加：オブジェクトIO操作の同時実行数を増加
  - recycle_pool_parallelism（デフォルト40）を増加：リサイクルオブジェクトの同時実行数を増加
- リサイクル間隔を短縮：recycle_interval_secondsをデフォルトの3600秒から、例えば1800秒に削減
- ホワイトリスト機能を使用：recycle_whitelistを通じて重要なインスタンスを優先的にリサイクル

**Q2: リサイクル負荷が高すぎてビジネスに影響する場合はどう調整しますか？**

A2: 以下の戦略を採用してリサイクル負荷を削減できます：
- 同時実行数を削減：
  - recycle_concurrencyを適切に削減し、同時に過多のインスタンスをリサイクルすることを回避
  - instance_recycler_worker_pool_sizeとrecycle_pool_parallelismを削減
- リサイクル間隔を延長：recycle_interval_secondsを増加、例えば7200秒に調整
- ブラックリストを使用：recycle_blacklistを通じて高負荷インスタンスを一時的に除外
- オフピーク時リサイクル：ビジネスのオフピーク時間にリサイクル操作を実行

#### 2. ストレージ容量チューニング

**Q3: ストレージ容量が不足し、ガベージクリーンアップを加速する必要がある場合はどうすれば良いですか？**

A3: 各種オブジェクトの保持時間を調整できます：
- 一般的な保持時間を短縮：retention_secondsをデフォルトの259200秒（3日）から削減
- 特定オブジェクトの対象調整：
  - compacted_rowset_retention_seconds（デフォルト1800秒）を適切に短縮
  - dropped_index_retention_secondsとdropped_partition_retention_seconds（デフォルト10800秒）を必要に応じて調整
- 選択的ストレージバックエンドリサイクル：recycler_storage_vault_white_listを通じて特定ストレージを優先的にクリーンアップ

**Q4: 誤削除を防ぐためにより長いデータ保持が必要な場合はどうすれば良いですか？**

A4: 対応する保持時間を延長：
- retention_secondsをより長い期間に増加、例えば604800秒
- 異なるオブジェクトの重要度に基づいて対応する保持パラメータを調整
- 重要なパーティションはdropped_partition_retention_secondsを通じてより長い保持時間を設定可能

#### 3. 監視とトラブルシューティングチューニング

**Q5: より良い監視とトラブルシューティング機能を有効にするにはどうすれば良いですか？**

A5: 以下の監視機能を有効にすることを推奨：
- 観測メトリクスを有効化：enable_recycler_stats_metrics = trueに設定
- チェック機能を有効化：
  - enable_checker = trueに設定してフォワードチェックを有効化
  - enable_inverted_check = trueに設定してリバースチェックを有効化
  - check_object_interval_seconds（デフォルト43200秒/12時間）を適切なチェック頻度に調整

**Q6: データ整合性問題の疑いがある場合はどうトラブルシューティングしますか？**

A6: checker機能を利用して検査：
- enable_checkerとenable_inverted_checkの両方がtrueであることを確認
- check_object_interval_secondsを適切に短縮してチェック頻度を増加
- MSパネルを通じてcheckerが発見した異常を観察
- checkerレポートに基づいて余剰ガベージファイルを手動処理または誤削除されたファイルを補完

#### 4. 特別シナリオチューニング

**Q7: 異常なインスタンスリサイクルを一時的に処理するにはどうすれば良いですか？**

A7: ホワイトリストとブラックリスト機能を使用：
- 問題のあるインスタンスを一時的にスキップ：異常なインスタンスIDをrecycle_blacklistに追加
- 特定インスタンスを優先化：優先処理が必要なインスタンスIDをrecycle_whitelistに追加
- ストレージバックエンド選択：recycler_storage_vault_white_listを通じて特定のストレージバックエンドを選択的にリサイクル

**Q8: 大きなテーブル削除によりリサイクルタスクのバックログが発生した場合はどうすれば良いですか？**

A8: 総合的なチューニング戦略：
- 一時的に同時実行パラメータを増加してバックログを処理
- 大きなオブジェクトの保持時間を適切に短縮
- ホワイトリストを使用して深刻なバックログのあるインスタンスを優先化
- 必要に応じて複数のリサイクラーを配置して負荷を分散

**Q9: 長時間クエリ中にオブジェクトストレージで「404 file not found」エラーに遭遇した場合はどうすれば良いですか？**

A9: クエリ実行時間が非常に長く、クエリ中にtabletがcompactionを実行した場合、オブジェクトストレージ上のマージされたrowsetがリサイクルされ、「404 file not found」エラーでクエリが失敗する可能性があります。解決策：
- compacted rowsetの保持時間を増加：compacted_rowset_retention_secondsをデフォルトの1800秒から増加、例えば：
  - 長時間クエリのシナリオでは、7200秒（またはそれ以上）に調整することを推奨
  - 最大クエリ時間に基づいて適切な保持時間を設定

これにより、長時間クエリ実行中に必要なrowsetが早期にリサイクルされることを防ぎ、クエリ失敗を回避できます。

---

**注意**：上記のチューニング提案は、実際のクラスタ規模、ストレージ容量、ビジネス特性、その他の要因に基づいて具体的に調整する必要があります。チューニング過程でシステム負荷とビジネスへの影響を注意深く監視し、パラメータを段階的に調整して最適な設定を見つけることを推奨します。

## 結論

Apache Dorisのストレージ・コンピュート分離アーキテクチャ下でのmark-for-deletion機能は、性能、セキュリティ、リソース使用率を巧妙にバランスさせることにより、従来のデータリサイクル方法の固有の欠陥を解決するだけでなく、ユーザーに完全で信頼性が高く、観測可能なデータ管理ソリューションを提供します。

細かい階層化リサイクル設計からインテリジェントな期限切れ保護機能まで、包括的な複数チェックシステムから豊富な観測メトリクスまで、Dorisのデータリサイクル機能は、細部に至るまでユーザーニーズの深い理解と技術品質への絶え間ない追求を反映しています。特に、その柔軟なパラメータチューニング機能により、異なる規模とシナリオのユーザーが最も適切な設定ソリューションを見つけることができます。

今後も、この機能の最適化と改善を続け、既存の利点を維持しながら、リサイクル効率のさらなる向上、インテリジェンスレベルの強化、監視次元の充実を図り、ユーザーのためにより効率的で信頼性の高いリアルタイムデータ分析プラットフォームを構築します。ユーザーが実践でより多くの可能性を探求し、私たちと共にApache Dorisを継続的に前進させることを歓迎します。
