---
{
  "title": "コンパクション",
  "language": "ja",
  "description": "DorisはLSM-Treeに類似した構造を通じてデータを書き込む、"
}
---
# Compaction

Dorisはデータを LSM-Tree に類似した構造で書き込み、バックグラウンドで compaction を通じて小さなファイルを大きな順序付きファイルに継続的にマージします。Compaction は削除や更新などの操作を処理します。

compaction 戦略を適切に調整することで、ロードとクエリの効率を大幅に向上させることができます。Doris はチューニング用に以下の compaction 戦略を提供しています。


## Vertical compaction

Vertical compaction は Doris 1.2.2 で実装された新しい compaction アルゴリズムで、大規模で幅の広いテーブルシナリオにおける compaction 実行効率とリソースオーバーヘッドを最適化するために使用されます。compaction のメモリオーバーヘッドを効果的に削減し、compaction の実行速度を向上させることができます。テスト結果によると、vertical compaction によるメモリ消費は元の compaction アルゴリズムの1/10のみで、compaction 率は15%向上しています。

Vertical compaction では、行による マージが列グループによるマージに変更されます。各マージの粒度が列グループに変更され、単一の compaction に関わるデータ量を削減し、compaction 中のメモリ使用量を削減します。

BE 設定:
- `enable_vertical_compaction = true` で vertical compaction をオンにします
- `vertical_compaction_num_columns_per_group = 5` 各列グループに含まれる列数。テストにより、デフォルトで5列のグループの効率とメモリ使用量がより良好です
- `vertical_compaction_max_segment_size` は vertical compaction 後のディスクファイルのサイズを設定するために使用され、デフォルト値は 268435456 (bytes) です


## Segment compaction

Segment compaction は主に大規模データロードを扱います。Segment compaction はロードプロセス中に動作し、ジョブ内のセグメントを compact します。これは通常の compaction や vertical compaction とは異なります。このメカニズムは生成されるセグメント数を効果的に削減し、-238 (OLAP_ERR_TOO_MANY_SEGMENTS) エラーを回避できます。

Segment compaction により以下の機能が提供されます:
- ロードによって生成されるセグメント数の削減
- compacting プロセスはロードプロセスと並行して実行され、ロード時間を増加させません
- ロード中のメモリ消費と計算リソースは増加しますが、長いロードプロセス全体に均等に分散されるため、増加は比較的少なくなります。
- segment compaction 後のデータは、その後のクエリと通常の compaction においてリソースとパフォーマンスの利点を持ちます。

BE 設定:
- `enable_segcompaction=true` でオンにします。
- `segcompaction_batch_size` はマージ間隔の設定に使用されます。デフォルト値10は、10個のセグメントファイルごとに segment compaction がトリガーされることを意味します。10 - 30 の間で設定することを推奨します。値が大きいほど segment compaction のメモリ使用量が増加します。

Segment compaction が推奨される状況:

- 大量のデータのロードが OLAP_ ERR_ TOO_ MANY_ SEGMENTS (errcode - 238) エラーで失敗する場合。この場合、segment compaction をオンにしてロードプロセス中のセグメント数を削減することを推奨します。
- ロードプロセス中に多数の小さなファイルが生成される場合: ロードデータ量は適切であっても、低カーディナリティやメモリ制約により memtable が事前にフラッシュされることで大量の小さなセグメントファイルが生成され、ロードジョブが失敗する可能性があります。この場合、この機能をオンにすることを推奨します。
- ロード直後にクエリを実行する場合。ロードが完了したばかりで標準的な compaction が完了していない場合、多数のセグメントファイルが後続のクエリの効率に影響します。ユーザーがロード直後にクエリを実行する必要がある場合、この機能をオンにすることを推奨します。
- ロード後の通常の compaction の負荷が高い場合: segment compaction は通常の compaction の負荷の一部をロードプロセスに均等に分散します。この場合、この機能を有効にすることを推奨します。

Segment compaction が推奨されない状況:
- ロード操作自体がメモリリソースを使い果たしている場合、メモリ負荷をさらに増加させてロードジョブの失敗を引き起こすことを避けるため、segment compaction の使用は推奨されません。

実装とテスト結果の詳細については、この [link](https://github.com/apache/doris/pull/12866) を参照してください。

## Single replica compaction

デフォルトでは、複数レプリカの compaction は独立して実行され、各レプリカが CPU と IO リソースを消費します。Single replica compaction が有効化されると、1つのレプリカのみが compaction を実行します。その後、他のレプリカはこのレプリカから compaction されたファイルを取得し、CPU リソースが一度だけ消費され、N - 1 回分の CPU 使用量を節約します（N はレプリカ数）。

Single replica compaction はテーブルの PROPERTIES でパラメータ `enable_single_replica_compaction` により指定され、デフォルトでは false（無効）です。有効化するには、パラメータを true に設定します。

このパラメータはテーブル作成時に指定するか、後で以下を使用して変更できます:

```sql
ALTER TABLE table_name SET("enable_single_replica_compaction" = "true");
```
## Compaction戦略

Compaction戦略は、小さなファイルがより大きなファイルにマージされるタイミングと対象を決定します。Dorisは現在2つのcompaction戦略を提供しており、テーブルプロパティの`compaction_policy`パラメータで指定します。

### サイズベースのcompaction戦略

サイズベースのcompaction戦略はデフォルト戦略であり、ほとんどのシナリオに適しています。

```
"compaction_policy" = "size_based"
```
### Time series compaction戦略

Time series compaction戦略は、ログや時系列データなどのシナリオに最適化されています。時系列データの時間局所性を活用し、隣接する時間に書き込まれた小さなファイルをより大きなファイルにマージします。各ファイルはcompactionに一度だけ参加するため、繰り返しcompactionによる書き込み増幅を削減します。

```
"compaction_policy" = "time_series"
```
時系列コンパクション戦略は、以下のいずれかの条件が満たされた場合にトリガーされます：
- 未マージファイルのサイズが`time_series_compaction_goal_size_mbytes`を超えた場合（デフォルト1 GB）。
- 未マージファイルの数が`time_series_compaction_file_count_threshold`を超えた場合（デフォルト2000）。
- 最後のコンパクションからの時間が`time_series_compaction_time_threshold_seconds`を超えた場合（デフォルト1時間）。

これらのパラメータはテーブルのPROPERTIESで設定され、テーブル作成時に指定するか、後で以下を使用して変更できます：

```
ALTER TABLE table_name SET("name" = "value");
```
## Compaction の並行性制御

Compaction はバックグラウンドで実行され、CPUとIOリソースを消費します。リソース消費量は、並行compactionスレッド数を調整することで制御できます。

並行compactionスレッド数は、BE設定ファイルで設定され、以下のパラメータが含まれます：
- `max_base_compaction_threads`：base compactionスレッド数、デフォルトは4です。
- `max_cumu_compaction_threads`：cumulative compactionスレッド数、デフォルトは-1で、これはディスクあたり1スレッドを意味します。
- `max_single_replica_compaction_threads`：single replica compaction中にデータファイルを取得するためのスレッド数、デフォルトは10です。
