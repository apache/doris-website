---
{
  "title": "圧縮",
  "language": "ja",
  "description": "DorisはLSM-Treeに似た構造を通じてデータを書き込みます。"
}
---
# Compaction

DorisはLSM-Treeに似た構造でデータを書き込み、バックグラウンドでcompactionを通じて小さなファイルを大きな順序付きファイルに継続的にマージします。Compactionは削除や更新などの操作を処理します。

compaction戦略を適切に調整することで、ロードとクエリの効率を大幅に向上させることができます。Dorisはチューニング用に以下のcompaction戦略を提供しています：


## Vertical compaction

Vertical compactionはDoris 1.2.2で実装された新しいcompactionアルゴリズムで、大規模・幅広テーブルシナリオでのcompaction実行効率とリソースオーバーヘッドを最適化するために使用されます。compactionのメモリオーバーヘッドを効果的に削減し、compactionの実行速度を向上させることができます。テスト結果によると、vertical compactionによるメモリ消費量は元のcompactionアルゴリズムの1/10のみで、compaction率は15%向上しています。

Vertical compactionでは、行単位のマージが列グループ単位のマージに変更されます。各マージの粒度が列グループに変更されることで、単一compactionに関わるデータ量が削減され、compaction中のメモリ使用量が削減されます。

BE設定：
- `enable_vertical_compaction = true`でvertical compactionが有効になります
- `vertical_compaction_num_columns_per_group = 5` 各列グループに含まれる列数。テストにより、デフォルトで5列のグループの効率とメモリ使用量がより良好です
- `vertical_compaction_max_segment_size`はvertical compaction後のディスクファイルのサイズを設定するために使用され、デフォルト値は268435456（bytes）です


## Segment compaction

Segment compactionは主に大規模データロードを処理します。Segment compactionはロードプロセス中に動作し、ジョブ内のsegmentをcompactします。これは通常のcompactionやvertical compactionとは異なります。このメカニズムは生成されるsegmentの数を効果的に削減し、-238（OLAP_ERR_TOO_MANY_SEGMENTS）エラーを回避できます。

Segment compactionによって提供される機能は以下の通りです：
- ロードによって生成されるsegmentの数を削減
- compactingプロセスはロードプロセスと並行して実行されるため、ロード時間は増加しません
- ロード中にメモリ消費量と計算リソースは増加しますが、長いロードプロセス全体に均等に分散されるため、増加は比較的少なくなります
- segment compaction後のデータは、後続のクエリや通常のcompactionにおいてリソースとパフォーマンスの利点があります

BE設定：
- `enable_segcompaction=true`で有効にします
- `segcompaction_batch_size`はマージの間隔を設定するために使用されます。デフォルト値10は、10個のsegmentファイルごとにsegment compactionがトリガーされることを意味します。10-30の間に設定することを推奨します。値が大きいほどsegment compactionのメモリ使用量が増加します

Segment compactionが推奨される状況：

- 大量のデータのロードがOLAP_ERR_TOO_MANY_SEGMENTS（エラーコード-238）エラーで失敗する場合。この場合、segment compactionを有効にしてロードプロセス中のsegmentの数を削減することを推奨します。
- ロードプロセス中に小さなファイルが多数生成される場合：ロードデータ量は適切であっても、低いcardinality やメモリ制約によってmemtableが早期にflushされることで大量の小さなsegmentファイルの生成によりロードジョブが失敗する場合があります。この場合、この機能を有効にすることを推奨します。
- ロード直後のクエリ。ロードが完了したばかりで標準compactionが完了していない場合、大量のsegmentファイルが後続クエリの効率に影響を与えます。ユーザーがロード直後にクエリする必要がある場合、この機能を有効にすることを推奨します。
- ロード後の通常compactionの負荷が高い場合：segment compactionは通常compactionの負荷の一部をロードプロセスに均等に配分します。この場合、この機能を有効にすることを推奨します。

Segment compactionが推奨されない状況：
- ロード操作自体でメモリリソースが枯渇している場合、メモリ負荷をさらに増加させてロードジョブの失敗を引き起こすことを避けるため、segment compactionの使用は推奨されません。

実装とテスト結果の詳細については、この[link](https://github.com/apache/doris/pull/12866)を参照してください。

## Single replica compaction

デフォルトでは、複数レプリカのcompactionは独立して実行され、各レプリカがCPUとIOリソースを消費します。Single replica compactionが有効な場合、1つのレプリカのみがcompactionを実行します。その後、他のレプリカがこのレプリカからcompactionされたファイルを取得するため、CPUリソースが一度だけ消費され、N-1倍のCPU使用量を節約できます（Nはレプリカ数）。

Single replica compactionは、パラメータ`enable_single_replica_compaction`を介してテーブルのPROPERTIESで指定され、デフォルトではfalse（無効）です。有効にするには、パラメータをtrueに設定します。

このパラメータはテーブル作成時に指定するか、後で以下を使用して変更できます：

```sql
ALTER TABLE table_name SET("enable_single_replica_compaction" = "true");
```
## Compaction戦略

Compaction戦略は、小さなファイルをより大きなファイルにマージするタイミングと対象を決定します。Dorisは現在2つのcompaction戦略を提供しており、テーブルプロパティの`compaction_policy`パラメータで指定します。

### サイズベースcompaction戦略

サイズベースcompaction戦略はデフォルト戦略であり、ほとんどのシナリオに適しています。

```
"compaction_policy" = "size_based"
```
### Time series compaction戦略

Time series compaction戦略は、ログやtime-seriesデータのようなシナリオに最適化されています。time-seriesデータの時間的局所性を活用し、隣接する時間に書き込まれた小さなファイルをより大きなファイルにマージします。各ファイルはcompactionに一度だけ参加するため、繰り返されるcompactionによる書き込み増幅を削減します。

```
"compaction_policy" = "time_series"
```
時系列コンパクション戦略は、以下のいずれかの条件が満たされた場合にトリガーされます：
- マージされていないファイルのサイズが`time_series_compaction_goal_size_mbytes`（デフォルト1 GB）を超えた場合。
- マージされていないファイルの数が`time_series_compaction_file_count_threshold`（デフォルト2000）を超えた場合。
- 最後のコンパクションからの時間が`time_series_compaction_time_threshold_seconds`（デフォルト1時間）を超えた場合。

これらのパラメータはテーブルのPROPERTIESに設定され、テーブル作成時に指定するか、後から以下を使用して変更できます：

```
ALTER TABLE table_name SET("name" = "value");
```
## Compaction並行制御

Compactionはバックグラウンドで実行され、CPUとIOリソースを消費します。リソース消費は、並行compactionスレッド数を調整することで制御できます。

並行compactionスレッド数は、BEコンフィギュレーションファイルで設定され、以下のパラメータが含まれます：
- `max_base_compaction_threads`: base compactionスレッド数、デフォルトは4です。
- `max_cumu_compaction_threads`: cumulative compactionスレッド数、デフォルトは-1で、これはディスクあたり1スレッドを意味します。
- `max_single_replica_compaction_threads`: single replica compaction中にデータファイルを取得するためのスレッド数、デフォルトは10です。
