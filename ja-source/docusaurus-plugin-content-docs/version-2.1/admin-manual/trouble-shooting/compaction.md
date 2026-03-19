---
{
  "title": "圧縮",
  "language": "ja",
  "description": "DorisはLSM-Treeに似た構造を通してデータを書き込みます。"
}
---
# Compaction

DorisはLSM-Treeに似た構造でデータを書き込み、バックグラウンドでcompactionを通じて小さなファイルを大きな順序付きファイルに継続的にマージします。Compactionは削除や更新などの操作を処理します。

Compaction戦略を適切に調整することで、負荷とクエリ効率を大幅に向上させることができます。Dorisはチューニング用に以下のcompaction戦略を提供しています：


## Vertical compaction

Vertical compactionはDoris 1.2.2で実装された新しいcompactionアルゴリズムで、大規模で幅の広いテーブルシナリオにおけるcompaction実行効率とリソースオーバーヘッドを最適化するために使用されます。Compactionのメモリオーバーヘッドを効果的に削減し、compactionの実行速度を向上させることができます。テスト結果では、vertical compactionのメモリ消費量は従来のcompactionアルゴリズムのわずか1/10であり、compaction率は15%向上しています。

Vertical compactionでは、行によるマージが列グループによるマージに変更されます。各マージの粒度が列グループに変更され、単一のcompactionに関与するデータ量が削減され、compaction中のメモリ使用量が削減されます。

BE設定：
- `enable_vertical_compaction = true`でvertical compactionが有効になります
- `vertical_compaction_num_columns_per_group = 5` 各列グループに含まれる列数。テストにより、デフォルトで5列のグループの効率とメモリ使用量がより適切です
- `vertical_compaction_max_segment_size`はvertical compaction後のディスクファイルのサイズを設定するために使用され、デフォルト値は268435456（バイト）です


## Segment compaction

Segment compactionは主に大規模データ負荷を処理します。Segment compactionは負荷プロセス中に動作し、ジョブ内のセグメントをcompactします。これは通常のcompactionやvertical compactionとは異なります。このメカニズムは生成されるセグメント数を効果的に削減し、-238（OLAP_ERR_TOO_MANY_SEGMENTS）エラーを回避できます。

Segment compactionは以下の機能を提供します：
- 負荷によって生成されるセグメント数を削減
- compactionプロセスは負荷プロセスと並行して実行されるため、負荷時間は増加しません
- 負荷中にメモリ消費量と計算リソースは増加しますが、長い負荷プロセス全体に均等に分散されるため、増加量は比較的少ないです
- segment compaction後のデータは、後続のクエリと通常のcompactionにおいてリソースとパフォーマンスの利点を持ちます。

BE設定：
- `enable_segcompaction=true`で有効にします。
- `segcompaction_batch_size`はマージの間隔を設定するために使用されます。デフォルト値10は、10個のセグメントファイルごとにsegment compactionがトリガーされることを意味します。10-30の間で設定することを推奨します。値が大きいほど、segment compactionのメモリ使用量が増加します。

Segment compactionが推奨される状況：

- 大量のデータの負荷がOLAP_ERR_TOO_MANY_SEGMENTS（エラーコード-238）エラーで失敗する場合。この場合、segment compactionを有効にして負荷プロセス中のセグメント数を削減することを推奨します。
- 負荷プロセス中に多数の小さなファイルが生成される場合：負荷データ量は適切であっても、低いカーディナリティやメモリ制約によりmemtableが事前にフラッシュされることで大量の小さなセグメントファイルが生成され、負荷ジョブが失敗する可能性があります。この場合、この機能を有効にすることを推奨します。
- 負荷直後のクエリ。負荷が完了したばかりで標準compactionが完了していない場合、大量のセグメントファイルが後続のクエリ効率に影響します。ユーザーが負荷直後にクエリする必要がある場合、この機能を有効にすることを推奨します。
- 負荷後の通常のcompactionの負荷が高い場合：segment compactionは通常のcompactionの負荷の一部を負荷プロセスに均等に配分します。この場合、この機能を有効にすることを推奨します。

Segment compactionが推奨されない状況：
- 負荷操作自体がメモリリソースを使い果たしている場合、さらにメモリ負荷を増加させて負荷ジョブの失敗を引き起こすことを避けるため、segment compactionの使用は推奨されません。

実装とテスト結果の詳細については、この[リンク](https://github.com/apache/doris/pull/12866)を参照してください。

## Single replica compaction

デフォルトでは、複数レプリカのcompactionは独立して実行され、各レプリカがCPUとIOリソースを消費します。Single replica compactionが有効になると、1つのレプリカのみがcompactionを実行します。その後、他のレプリカはこのレプリカからcompactされたファイルを取得するため、CPUリソースは1回だけ消費され、N-1回分のCPU使用量を節約できます（Nはレプリカ数）。

Single replica compactionは、テーブルのPROPERTIESでパラメータ`enable_single_replica_compaction`を通じて指定され、デフォルトではfalse（無効）です。有効にするには、パラメータをtrueに設定します。

このパラメータはテーブル作成時に指定するか、後で以下を使用して変更できます：

```sql
ALTER TABLE table_name SET("enable_single_replica_compaction" = "true");
```
## Compaction戦略

Compaction戦略は、小さなファイルがより大きなファイルにマージされるタイミングと対象を決定します。Dorisは現在2つのcompaction戦略を提供しており、テーブルプロパティの`compaction_policy`パラメータで指定します。

### サイズベースcompaction戦略

サイズベースcompaction戦略はデフォルト戦略であり、ほとんどのシナリオに適しています。

```
"compaction_policy" = "size_based"
```
### 時系列圧縮戦略

時系列圧縮戦略は、ログや時系列データのようなシナリオに最適化されています。時系列データの時間局所性を活用し、隣接する時間に書き込まれた小さなファイルをより大きなファイルにマージします。各ファイルは一度だけ圧縮に参加するため、繰り返し圧縮による書き込み増幅を削減します。

```
"compaction_policy" = "time_series"
```
時系列圧縮戦略は、以下の条件のいずれかが満たされた場合にトリガーされます：
- 未マージファイルのサイズが`time_series_compaction_goal_size_mbytes`を超える場合（デフォルト1 GB）。
- 未マージファイルの数が`time_series_compaction_file_count_threshold`を超える場合（デフォルト2000）。
- 前回の圧縮からの経過時間が`time_series_compaction_time_threshold_seconds`を超える場合（デフォルト1時間）。

これらのパラメータはテーブルのPROPERTIESに設定され、テーブル作成時に指定するか、後から以下を使用して変更できます：

```
ALTER TABLE table_name SET("name" = "value");
```
## Compaction並行制御

Compactionはバックグラウンドで実行され、CPUとIOリソースを消費します。リソース消費量は、並行compactionスレッド数を調整することで制御できます。

並行compactionスレッド数は、BEコンフィグレーションファイルで設定され、以下のパラメータが含まれます：
- `max_base_compaction_threads`：base compactionスレッド数、デフォルトは4です。
- `max_cumu_compaction_threads`：cumulative compactionスレッド数、デフォルトは-1で、これはディスクあたり1スレッドを意味します。
- `max_single_replica_compaction_threads`：single replica compaction時にデータファイルを取得するスレッド数、デフォルトは10です。
