---
{
  "title": "圧縮",
  "language": "ja",
  "description": "Dorisは、LSM-Treeに類似した構造を通してデータを書き込みます。"
}
---
# Compaction

DorisはLSM-Treeに類似した構造でデータを書き込み、バックグラウンドでcompactionを通じて小さなファイルを大きな順序付きファイルに継続的にマージします。Compactionは削除や更新などの操作を処理します。

compaction戦略を適切に調整することで、負荷とクエリの効率を大幅に向上させることができます。Dorisはチューニング用に以下のcompaction戦略を提供しています：


## Vertical compaction

Vertical compactionは、Doris 1.2.2で実装された新しいcompactionアルゴリズムで、大規模かつ幅広いテーブルシナリオでのcompaction実行効率とリソースオーバーヘッドを最適化するために使用されます。これはcompactionのメモリオーバーヘッドを効果的に削減し、compactionの実行速度を向上させることができます。テスト結果では、vertical compactionによるメモリ消費は元のcompactionアルゴリズムの1/10のみで、compaction率は15%向上しています。

Vertical compactionでは、行単位でのマージが列グループ単位でのマージに変更されます。各マージの粒度が列グループに変更され、単一のcompactionに関与するデータ量が削減され、compaction中のメモリ使用量が減少します。

BE設定：
- `enable_vertical_compaction = true` でvertical compactionをオンにします
- `vertical_compaction_num_columns_per_group = 5` 各列グループに含まれる列数で、テストにより、デフォルトで5列のグループの効率とメモリ使用量がよりフレンドリーです
- `vertical_compaction_max_segment_size` はvertical compaction後のディスクファイルのサイズを設定するために使用され、デフォルト値は268435456（bytes）です


## Segment compaction

Segment compactionは主に大規模データロードを処理します。Segment compactionはロードプロセス中に動作し、ジョブ内のセグメントをcompactします。これは通常のcompactionやvertical compactionとは異なります。このメカニズムは生成されるセグメント数を効果的に削減し、-238（OLAP_ERR_TOO_MANY_SEGMENTS）エラーを回避できます。

Segment compactionでは以下の機能が提供されます：
- ロードによって生成されるセグメント数の削減
- compactingプロセスはロードプロセスと並行して実行されるため、ロード時間が増加しません
- ロード中にメモリ消費と計算リソースが増加しますが、長いロードプロセス全体に均等に分散されるため、増加は比較的少ないです。
- segment compaction後のデータは、後続のクエリや通常のcompactionでリソースとパフォーマンスの利点があります。

BE設定：
- `enable_segcompaction=true` でオンにします。
- `segcompaction_batch_size` はマージの間隔を設定するために使用されます。デフォルト値10は、10個のセグメントファイルごとにsegment compactionがトリガーされることを意味します。10～30の間で設定することを推奨します。値が大きいほど、segment compactionのメモリ使用量が増加します。

Segment compactionが推奨される状況：

- 大量のデータのロードがOLAP_ERR_TOO_MANY_SEGMENTS（errcode -238）エラーで失敗する場合。この場合、segment compactionをオンにしてロードプロセス中のセグメント数を削減することを推奨します。
- ロードプロセス中に小さなファイルが大量に生成される場合：ロードデータ量は妥当であっても、低いカーディナリティやメモリ制約によってmemtableが事前にフラッシュされることで大量の小さなセグメントファイルが生成され、ロードジョブが失敗する可能性があります。この場合、この機能をオンにすることを推奨します。
- ロード直後のクエリ。ロードが完了したばかりで標準compactionが完了していない場合、大量のセグメントファイルが後続のクエリの効率に影響を与えます。ユーザーがロード直後にクエリを実行する必要がある場合、この機能をオンにすることを推奨します。
- ロード後の通常のcompactionの負荷が高い場合：segment compactionは通常のcompactionの負荷の一部をロードプロセスに均等に分散します。この場合、この機能を有効にすることを推奨します。

Segment compactionが推奨されない状況：
- ロード操作自体がメモリリソースを枯渇させている場合、segment compactionの使用は推奨されません。メモリ負荷をさらに増加させ、ロードジョブの失敗を引き起こす可能性があります。

実装とテスト結果の詳細については、この[link](https://github.com/apache/doris/pull/12866)を参照してください。

## Single replica compaction

デフォルトでは、複数のレプリカのcompactionは独立して実行され、各レプリカがCPUとIOリソースを消費します。Single replica compactionが有効になると、1つのレプリカのみがcompactionを実行します。その後、他のレプリカはこのレプリカからcompactされたファイルを取得するため、CPUリソースが1回のみ消費され、N - 1倍のCPU使用量を節約できます（Nはレプリカ数）。

Single replica compactionは、テーブルのPROPERTIESで`enable_single_replica_compaction`パラメータによって指定され、デフォルトではfalse（無効）です。有効にするには、パラメータをtrueに設定します。

このパラメータは、テーブル作成時に指定するか、後で以下を使用して変更できます：

```sql
ALTER TABLE table_name SET("enable_single_replica_compaction" = "true");
```
## コンパクション戦略

コンパクション戦略は、小さなファイルをより大きなファイルにマージするタイミングと対象を決定します。Dorisは現在、テーブルプロパティの`compaction_policy`パラメータで指定する2つのコンパクション戦略を提供しています。

### サイズベースコンパクション戦略

サイズベースコンパクション戦略はデフォルト戦略であり、ほとんどのシナリオに適しています。

```
"compaction_policy" = "size_based"
```
### 時系列圧縮戦略

時系列圧縮戦略は、ログや時系列データなどのシナリオに最適化されています。時系列データの時間的局所性を活用し、隣接する時間に書き込まれた小さなファイルをより大きなファイルにマージします。各ファイルは圧縮に一度だけ参加するため、繰り返し圧縮による書き込み増幅が削減されます。

```
"compaction_policy" = "time_series"
```
時系列コンパクション戦略は、以下の条件のいずれかが満たされた場合にトリガーされます：
- マージされていないファイルのサイズが`time_series_compaction_goal_size_mbytes`（デフォルト1 GB）を超えた場合。
- マージされていないファイルの数が`time_series_compaction_file_count_threshold`（デフォルト2000）を超えた場合。
- 前回のコンパクションからの時間が`time_series_compaction_time_threshold_seconds`（デフォルト1時間）を超えた場合。

これらのパラメータはテーブルのPROPERTIESで設定され、テーブル作成時に指定するか、後で以下を使用して変更することができます：

```
ALTER TABLE table_name SET("name" = "value");
```
## Compaction並行性制御

Compactionはバックグラウンドで実行され、CPUとIOリソースを消費します。リソース消費量は、並行compactionスレッド数を調整することで制御できます。

並行compactionスレッド数は、BEコンフィグファイルで設定され、以下のパラメータが含まれます：
- `max_base_compaction_threads`：base compactionスレッド数、デフォルトは4です。
- `max_cumu_compaction_threads`：cumulative compactionスレッド数、デフォルトは-1で、これはディスクあたり1スレッドを意味します。
- `max_single_replica_compaction_threads`：single replica compaction中にデータファイルを取得するためのスレッド数、デフォルトは10です。
