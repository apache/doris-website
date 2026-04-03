---
{
  "title": "リサイクラー",
  "language": "ja",
  "description": "ビッグデータの時代において、データライフサイクル管理は分散データベースシステムにとって中核的な課題の一つとなっている。"
}
---
# Doris ストレージ・コンピュート分離データリサイクリング

## はじめに

ビッグデータの時代において、データライフサイクル管理は分散データベースシステムの中核的な課題の一つとなっています。ビジネスデータ量の爆発的な増加に伴い、データセキュリティを確保しながら効率的なストレージ領域の回収を実現する方法は、すべてのデータベース製品が対処しなければならない重要な問題となっています。

Apache Dorisは、次世代リアルタイム分析データベースとして、ストレージ・コンピュート分離アーキテクチャの下でMark-for-Deletionデータリサイクリング戦略を採用し、この基盤の上に深い最適化と強化を構築しています。きめ細かい階層リサイクリングメカニズム、柔軟で設定可能な有効期限保護、複数のデータ整合性チェック、包括的な可観測性システムを導入し、分散環境の複雑さを十分に考慮して、Dorisは独立したRecyclerコンポーネント、インテリジェント並行制御、完全な監視メトリクスを設計しました。これにより、効率的で制御可能なエンタープライズグレードのデータライフサイクル管理ソリューションをユーザーに提供し、パフォーマンス、セキュリティ、制御可能性の間の最適なバランスを実現しています。

本記事では、Dorisのストレージ・コンピュート分離アーキテクチャにおけるデータリサイクリングメカニズムを、設計思想から技術実装まで、中核原理から実践的なチューニングまで詳細に分析し、この成熟したソリューションの技術詳細と応用価値を包括的に紹介します。

## 1. 一般的なデータリサイクリング戦略の比較

### 1.1 同期削除

最も直接的な削除方法です。データが削除される際（例：drop table）、関連するメタデータと対応するファイルが即座に削除されます。データが削除されると復旧できません。操作は単純で直接的ですが、削除速度が遅く、リスクが高いです。

### 1.2 照合削除（Reverse）

この方法は、定期的な照合メカニズムを通じて削除可能なデータを決定します。データが削除される際（例：drop table）、メタデータのみが削除されます。システムは定期的にデータ照合を実行し、ファイルデータをスキャンして、メタデータから参照されなくなったか有効期限切れのデータを特定し、バッチ削除を実行します。

### 1.3 Mark-for-Deletion（Forward）

この方法は、削除されたメタデータを定期的にスキャンすることで削除可能なデータを決定します。データが削除される際（例：drop table）、データを直接削除するのではなく、削除対象のメタデータに削除マークを付けます。システムは定期的にマークされたメタデータをスキャンし、対応するファイルを見つけてバッチ削除を実行します。

## 2. Dorisストレージ・コンピュート分離Mark-for-Deletionの利点

Dorisのストレージ・コンピュート分離アーキテクチャはmark-for-deletion方法を選択し、データ整合性を効果的に確保しながら、パフォーマンス、セキュリティ、リソース利用の間の最適なバランスを実現しています。

drop tableを例にとると、mark-for-deletionは他の2つの方法に比べて以下の顕著な利点があります：

### 2.1 パフォーマンス上の利点

- **高速応答時間**：Drop table操作はメタデータKVデータに削除マークを付けるだけで、ファイルI/O操作の完了を待つ必要がなく、ユーザーは即座に応答を受け取れます。これは大容量テーブル削除シナリオにおいて特に重要で、長時間のブロッキング期間を回避できます。
- **高いバッチ処理効率**：削除マーク付きメタデータKVを定期的にスキャンすることで、ファイル削除操作をバッチ処理でき、システムコール頻度を減らし、全体的なI/O効率を向上させます。

### 2.2 セキュリティ上の利点

- **誤操作保護**：Mark-for-deletionは実際のファイル削除前にバッファ期間を提供し、この期間中に誤って削除されたテーブルを復旧できるため、人的操作リスクを大幅に軽減します。
- **トランザクションセキュリティ**：マーク操作は軽量なメタデータ変更であり、原子性をより容易に確保でき、削除中のシステム障害によるデータ不整合問題を軽減します。

### 2.3 リソース管理上の利点

- **システム負荷の均衡**：ファイル削除操作をシステムのアイドル時間に実行でき、ビジネスピーク時間中の大量I/Oリソース消費による通常の操作への影響を回避できます。
- **制御可能な削除ペース**：システム負荷に基づいて削除速度を動的に調整でき、大量削除操作によるシステムへの影響を回避できます。

### 2.4 他のソリューションとの比較

- **同期削除との比較**：大容量テーブル削除時の長時間待機を回避し、ユーザーエクスペリエンスを向上させます。さらに、削除バッファ期間を提供してセキュリティを確保し、ある程度人的操作事故を防止します。
- **照合削除との比較**：削除マーク付きメタデータのみをスキャンするため、スキャンデータがより的確で、不要なI/O操作を削減し、効率が高く、すべてのファイルを横断して参照されているかどうかを判断する必要がなく、より高速で効率的な削除を実現します。

## 3. Dorisデータリサイクリングの原理

recyclerは独立してデプロイされるコンポーネントで、期限切れのガベージファイルを定期的にリサイクリングします。1つのrecyclerは複数のインスタンスを同時にリサイクリングでき、1つのインスタンスは同時に1つのrecyclerによってのみリサイクリングできます。

### 3.1 Mark-for-Deletion

dropコマンドが実行されるか、システムがガベージデータを生成する際（例：compacted rowset）、対応するメタデータKVにリサイクルマークが付けられます。recyclerは定期的にインスタンス内のrecycle KVをスキャンし、対応するオブジェクトファイルを削除してからrecycle KVを削除し、削除順序の安全性を確保します。

### 3.2 階層構造

recyclerがインスタンスデータをリサイクリングする際、recycle_indexes、recycle_partition、recycle_compacted_rowsets、recycle_txnなど、複数のタスクが並行実行されます。

リサイクリング時のデータは階層構造に従って削除されます：テーブルを削除すると対応するパーティションが削除され、パーティションを削除すると対応するtabletが削除され、tabletを削除すると対応するrowsetが削除され、rowsetを削除すると対応するsegmentファイルが削除されます。最終実行対象はDorisの最小ファイル単位であるsegmentファイルです。

drop tableを例にとると、リサイクリングプロセス中、システムはまずsegmentオブジェクトファイルを削除し、成功後にrecycle rowset KVを削除し、すべてのtablet rowsetが正常に削除された後にrecycle tablet KVを削除し、以下同様に、最終的にテーブル内のすべてのオブジェクトファイルとrecycle KVを削除します。

### 3.3 有効期限メカニズム

リサイクル対象の各オブジェクトは、そのKV内に対応する有効期限時間を記録します。システムは各種recycle KVをスキャンして有効期限時間を計算することで、削除対象オブジェクトを特定します。ユーザーが誤ってテーブルをdropした場合、有効期限メカニズムにより、recyclerは即座にそのデータを削除せず、保持時間を待機し、データ復旧の可能性を提供します。

### 3.4 信頼性保証

1. **段階的削除**：まずデータファイルを削除し、次にメタデータを削除し、最後にインデックスまたはパーティションキーを削除し、削除順序の安全性を確保します。

2. **リース保護メカニズム**：各recyclerはリサイクリング開始前にリースを取得し、バックグラウンドスレッドを開始してリースを定期的に更新します。リースが期限切れになるかステータスがIDLEの場合のみ、新しいrecyclerが引き継ぎ可能で、1つのインスタンスが同時に1つのrecyclerによってのみリサイクリングされることを確保し、並行リサイクリングによるデータ不整合問題を回避します。

### 3.5 複数チェックメカニズム

RecyclerはFEメタデータ、MS KV、オブジェクトファイル間の複数の相互チェックメカニズム（checker）を実装します。checkerはバックグラウンドですべてのRecycler KV、オブジェクトファイル、FEインメモリメタデータに対して順方向と逆方向のチェックを実行します。

segmentファイルKVとオブジェクトファイルのチェックを例にとると：
- 順方向チェック：すべてのKVをスキャンして対応するsegmentファイルが存在するか、FEメモリ内に対応するsegment情報が存在するかをチェックします。
- 逆方向チェック：すべてのsegmentファイルをスキャンして対応するKVが存在するか、FEメモリ内に対応するsegment情報が存在するかを検証します。

複数のチェックメカニズムにより、recyclerのデータ削除の正確性を確保します。特定の状況下でリサイクル不足や過剰リサイクルが発生した場合、checkerは関連情報をキャプチャします。運用担当者はchecker情報に基づいて余剰のガベージファイルを手動削除したり、オブジェクトマルチバージョニングに依存して誤って削除されたファイルを復旧したりでき、効果的な安全ネットを提供します。

現在、segmentファイル、idxファイル、delete bitmapメタデータなどの順方向および逆方向チェックが実装されています。将来的には、すべてのメタデータのチェックを実装して、recyclerの正確性と信頼性をさらに確保します。

## 4. 可観測性メカニズム

Recyclerのリサイクリング効率と進捗は、ユーザーにとって非常に重要な関心事です。そのため、多数の視覚的監視メトリクスと必要なログを追加して、recyclerの可観測性を大幅に向上させました。視覚的メトリクスにより、ユーザーはリサイクリング進捗、効率、例外、その他の基本情報を直感的に確認できます。また、特定のインスタンスの次回リサイクル時間の推定など、より詳細な情報をユーザーが確認できるよう、より多くのメトリクスも提供しています。追加されたログにより、運用チームと開発チームがより迅速に問題を特定できるようになりました。

### 4.1 ユーザーの関心事への対応

**基本的な質問：**
- リポジトリレベルのリサイクリング速度：1秒あたりのリサイクルバイト数、各種オブジェクトの1秒あたりのリサイクル数
- リポジトリレベルのリサイクリングごとのデータ量と時間消費
- リポジトリレベルのリサイクリング進捗：リサイクル済みデータ量、リサイクリング待機データ量

**高度な質問：**
- 各ストレージバックエンドのリサイクリングステータス
- Recyclerの成功時間、失敗時間
- 次回Recycler実行の推定時間

この情報はすべて、MSパネルを通じてリアルタイムで観測できます。

### 4.2 観測メトリクス

| 変数名 | メトリクス名 | ディメンション/ラベル | 説明 | 例 |
|--------|--------------|----------------------|------|-----|
| g_bvar_recycler_vault_recycle_status | recycler_vault_recycle_status | instance_id, resource_id, status | インスタンスID、リソースID、ステータス別のvaultリサイクリング操作のステータス数を記録 | recycler_vault_recycle_status{instance_id="default_instance_id",resource_id="1",status="normal"} 8 |
| g_bvar_recycler_vault_recycle_task_concurrency | recycler_vault_recycle_task_concurrency | instance_id, resource_id | インスタンスIDとリソースID別のvaultリサイクルファイルタスクの並行性をカウント | recycler_vault_recycle_task_concurrency{instance_id="default_instance_id",resource_id="1"} 2 |
| g_bvar_recycler_instance_last_round_recycled_num | recycler_instance_last_round_recycled_num | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最後のラウンドでリサイクルされたオブジェクト数をカウント | recycler_instance_last_round_recycled_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_to_recycle_num | recycler_instance_last_round_to_recycle_num | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最後のラウンドでリサイクル対象のオブジェクト数をカウント | recycler_instance_last_round_to_recycle_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_recycled_bytes | recycler_instance_last_round_recycled_bytes | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最後のラウンドでリサイクルされたデータサイズ（バイト）をカウント | recycler_instance_last_round_recycled_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_to_recycle_bytes | recycler_instance_last_round_to_recycle_bytes | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最後のラウンドでリサイクル対象のデータサイズ（バイト）をカウント | recycler_instance_last_round_to_recycle_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_recycle_elpased_ts | recycler_instance_last_round_recycle_elpased_ts | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別の最後のリサイクリング操作の経過時間（ms）を記録 | recycler_instance_last_round_recycle_elpased_ts{instance_id="default_instance_id",resource_type="recycle_rowsets"} 62 |
| g_bvar_recycler_instance_recycle_round | recycler_instance_recycle_round | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別のリサイクリング操作ラウンド数をカウント | recycler_instance_recycle_round{instance_id="default_instance_id_2",object_type="recycle_rowsets"} 2 |
| g_bvar_recycler_instance_recycle_time_per_resource | recycler_instance_recycle_time_per_resource | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別のリサイクリング速度を記録（リソース1つあたりの所要時間（ms）、-1はリサイクリングなしを意味） | recycler_instance_recycle_time_per_resource{instance_id="default_instance_id",resource_type="recycle_rowsets"} 4.76923 |
| g_bvar_recycler_instance_recycle_bytes_per_ms | recycler_instance_recycle_bytes_per_ms | instance_id, resource_type | インスタンスIDとオブジェクトタイプ別のリサイクリング速度を記録（ミリ秒あたりのリサイクルバイト数、-1はリサイクリングなしを意味） | recycler_instance_recycle_bytes_per_ms{instance_id="default_instance_id",resource_type="recycle_rowsets"} 217.887 |
| g_bvar_recycler_instance_recycle_total_num_since_started | recycler_instance_recycle_total_num_since_started | instance_id, resource_type | recycler開始以降のインスタンスIDとオブジェクトタイプ別の総リサイクル数をカウント | recycler_instance_recycle_total_num_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 49 |
| g_bvar_recycler_instance_recycle_total_bytes_since_started | recycler_instance_recycle_total_bytes_since_started | instance_id, resource_type | recycler開始以降のインスタンスIDとオブジェクトタイプ別の総リサイクルサイズ（バイト）をカウント | recycler_instance_recycle_total_bytes_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 40785 |
| g_bvar_recycler_instance_running_counter | recycler_instance_running_counter | - | 現在リサイクリング中のインスタンス数をカウント | recycler_instance_running_counter 0 |
| g_bvar_recycler_instance_last_recycle_duration | recycler_instance_last_round_recycle_duration | instance_id | インスタンスID別の最後のリサイクリングラウンドの総継続時間を記録 | recycler_instance_last_recycle_duration{instance_id="default_instance_id"} 64 |
| g_bvar_recycler_instance_next_ts | recycler_instance_next_ts | instance_id | インスタンスID別にconfigのrecycle_interval_secondsに基づく次回リサイクル時間を推定 | recycler_instance_next_ts{instance_id="default_instance_id"} 1750400266781 |
| g_bvar_recycler_instance_recycle_st_ts | recycler_instance_recycle_start_ts | instance_id | インスタンスID別の総リサイクリングプロセスの開始時間を記録 | recycler_instance_recycle_st_ts{instance_id="default_instance_id"} 1750400236717 |
| g_bvar_recycler_instance_recycle_ed_ts | recycler_instance_recycle_end_ts | instance_id | インスタンスID別の総リサイクリングプロセスの終了時間を記録 | recycler_instance_recycle_ed_ts{instance_id="default_instance_id"} 1750400236781 |
| g_bvar_recycler_instance_recycle_last_success_ts | recycler_instance_recycle_last_success_ts | instance_id | インスタンスID別の最後の成功したリサイクリング時間を記録 | recycler_instance_recycle_last_success_ts{instance_id="default_instance_id"} 1750400236781 |

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

#### 1. リサイクルパフォーマンスチューニング

**Q1: リサイクル速度が遅すぎる場合はどうすればよいですか？**

A1: 以下の観点からチューニングできます：
- 並行性を増やす：
  - recycle_concurrency（デフォルト16）を増やす：同時にリサイクルされるインスタンス数を増やす
  - instance_recycler_worker_pool_size（デフォルト32）を増やす：オブジェクトIO操作の並行性を増やす
  - recycle_pool_parallelism（デフォルト40）を増やす：リサイクルオブジェクトの並行性を増やす
- リサイクル間隔を短縮する：recycle_interval_secondsをデフォルトの3600秒から、例えば1800秒に短縮する
- ホワイトリストメカニズムを使用する：recycle_whitelistを通じて重要なインスタンスを優先的にリサイクルする

**Q2: リサイクル負荷が高すぎてビジネスに影響する場合はどう調整しますか？**

A2: リサイクル負荷を軽減するために以下の戦略を採用できます：
- 並行性を削減する：
  - recycle_concurrencyを適切に削減し、同時に多数のインスタンスがリサイクルされることを避ける
  - instance_recycler_worker_pool_sizeとrecycle_pool_parallelismを削減する
- リサイクル間隔を延長する：recycle_interval_secondsを増やす、例えば7200秒に調整する
- ブラックリストを使用する：recycle_blacklistを通じて高負荷インスタンスを一時的に除外する
- オフピークリサイクル：ビジネスのオフピーク時間にリサイクル操作を実行する

#### 2. ストレージ容量チューニング

**Q3: ストレージ容量が不足し、ガベージクリーンアップを加速する必要がある場合はどうすればよいですか？**

A3: 各種オブジェクトの保持時間を調整できます：
- 一般的な保持時間を短縮する：retention_secondsをデフォルトの259200秒（3日）から削減する
- 特定のオブジェクトを対象とした調整：
  - compacted_rowset_retention_seconds（デフォルト1800秒）を適切に短縮できる
  - dropped_index_retention_secondsとdropped_partition_retention_seconds（デフォルト10800秒）を必要に応じて調整できる
- 選択的ストレージバックエンドリサイクル：recycler_storage_vault_white_listを通じて特定のストレージを優先的にクリーニングする

**Q4: 誤削除を防ぐためにより長いデータ保持が必要な場合はどうすればよいですか？**

A4: 対応する保持時間を延長します：
- retention_secondsをより長い期間、例えば604800秒に増やす
- 異なるオブジェクトの重要度に基づいて対応する保持パラメータを調整する
- 重要なパーティションはdropped_partition_retention_secondsを通じてより長い保持時間を設定できる

#### 3. モニタリングとトラブルシューティングチューニング

**Q5: より良いモニタリングとトラブルシューティング機能を有効にするにはどうすればよいですか？**

A5: 以下のモニタリング機能を有効にすることを推奨します：
- 観測メトリクスを有効にする：enable_recycler_stats_metrics = trueに設定する
- チェックメカニズムを有効にする：
  - enable_checker = trueに設定してフォワードチェックを有効にする
  - enable_inverted_check = trueに設定してリバースチェックを有効にする
  - check_object_interval_seconds（デフォルト43200秒/12時間）を適切なチェック頻度に調整する

**Q6: データ整合性に問題があると疑われる場合はどうトラブルシューティングしますか？**

A6: checkerメカニズムを利用して検査します：
- enable_checkerとenable_inverted_checkの両方がtrueであることを確認する
- check_object_interval_secondsを適切に短縮してチェック頻度を増やす
- MSパネルを通じてcheckerが発見した異常を観察する
- checkerレポートに基づいて過剰なガベージファイルを手動で処理するか、誤って削除されたファイルを補完する

#### 4. 特殊シナリオチューニング

**Q7: 異常なインスタンスリサイクルを一時的に処理するにはどうすればよいですか？**

A7: ホワイトリストとブラックリストメカニズムを使用します：
- 問題のあるインスタンスを一時的にスキップする：異常なインスタンスIDをrecycle_blacklistに追加する
- 特定のインスタンスを優先する：優先処理が必要なインスタンスIDをrecycle_whitelistに追加する
- ストレージバックエンド選択：recycler_storage_vault_white_listを通じて特定のストレージバックエンドを選択的にリサイクルする

**Q8: 大きなテーブルの削除によりリサイクルタスクのバックログが発生した場合はどうすればよいですか？**

A8: 包括的なチューニング戦略：
- バックログを処理するために並行性パラメータを一時的に増やす
- 大きなオブジェクトの保持時間を適切に短縮する
- ホワイトリストを使用して深刻なバックログを持つインスタンスを優先する
- 必要に応じて複数のリサイクラーを展開して負荷を分散する

**Q9: 長いクエリ中にオブジェクトストレージで「404 file not found」エラーが発生した場合はどうすればよいですか？**

A9: クエリ実行時間が非常に長く、クエリ中にタブレットがコンパクションを受ける場合、オブジェクトストレージ上のマージされたrowsetがリサイクルされ、「404 file not found」エラーでクエリが失敗する可能性があります。解決策：
- コンパクトされたrowsetの保持時間を増やす：compacted_rowset_retention_secondsをデフォルトの1800秒から増やす、例えば：
  - 長いクエリのシナリオでは、7200秒（またはそれ以上）に調整することを推奨
  - 最大クエリ時間に基づいて適切な保持時間を設定する

これにより、長いクエリ実行中に必要なrowsetが早期にリサイクルされることがなくなり、クエリの失敗を回避できます。

---

**注意**: 上記のチューニング提案は、実際のクラスター規模、ストレージ容量、ビジネス特性、その他の要因に基づいて具体的に調整する必要があります。チューニングプロセス中は、システム負荷とビジネスへの影響を密接にモニタリングし、パラメータを段階的に調整して最適な構成を見つけることを推奨します。

## 結論

Apache Dorisのストレージ・コンピュート分離アーキテクチャにおけるmark-for-deletionメカニズムは、パフォーマンス、セキュリティ、リソース利用の巧妙なバランスを通じて、従来のデータリサイクル方法の固有の欠陥を解決するだけでなく、ユーザーに完全で信頼性が高く、観測可能なデータ管理ソリューションを提供します。

きめ細かい階層リサイクル設計から智的な有効期限保護メカニズムまで、包括的な複数チェックシステムから豊富な観測可能性メトリクスまで、Dorisのデータリサイクルメカニズムは、すべての詳細においてユーザーニーズの深い理解と技術品質への絶え間ない追求を反映しています。特に、その柔軟なパラメータチューニング機能により、異なる規模とシナリオのユーザーが最も適した構成ソリューションを見つけることができます。

将来的には、このメカニズムの最適化と改善を継続し、既存の利点を維持しながら、リサイクル効率をさらに向上させ、智能レベルを高め、モニタリング次元を豊富にし、ユーザーにとってより効率的で信頼性の高いリアルタイムデータ分析プラットフォームを構築していきます。ユーザーが実践でより多くの可能性を探求し、私たちと共にApache Dorisを継続的に前進させることを歓迎します。
