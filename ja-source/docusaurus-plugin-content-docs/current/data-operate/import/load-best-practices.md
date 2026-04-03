---
{
  "title": "ロードのベストプラクティス",
  "language": "ja",
  "description": "Duplicate Keyモデルの使用を優先することが推奨されます。"
}
---
## table Model Selection

Duplicate Key モデルの使用を優先することを推奨します。このモデルは、他のモデルと比較して、データロードとクエリパフォーマンスの両方で優位性を提供します。詳細については、以下を参照してください：[Data Model](../../table-design/data-model/overview)

## パーティション and バケット 設定

tabletのサイズを1-10GBの間に保つことを推奨します。tabletが小さすぎると集約パフォーマンスが低下し、メタデータ管理のオーバーヘッドが増加する可能性があります。tabletが大きすぎると、レプリカの移行と修復が阻害される可能性があります。詳細については、以下を参照してください：[Data Distribution](../../table-design/data-partitioning/data-distribution)。

## Random Bucketing

Random bucketingを使用する場合、load_to_single_tabletをtrueに設定することで、単一tablet読み込みモードを有効にできます。このモードは、データロードの並行性とスループットを向上させ、大規模データロード時の書き込み増幅を削減できます。詳細については、以下を参照してください：[Random Bucketing](../../table-design/data-partitioning/data-bucketing#random-bucketing)

## Batch Loading

クライアント側バッチ処理：ロード前に、クライアント側で数MBからGBサイズのデータをバッチ処理することを推奨します。高頻度の小容量ロードは頻繁なcompactionを引き起こし、深刻な書き込み増幅問題を引き起こします。
サーバー側バッチ処理：高並行小データ量ロードの場合、[Group Commit](group-commit-manual.md)を有効にしてサーバー側でバッチ処理を実装することを推奨します。

## パーティション Loading

一度に少数のパーティションからのみデータをロードすることを推奨します。多くのパーティションから同時にロードすると、メモリ使用量が増加し、パフォーマンスの問題を引き起こす可能性があります。Dorisの各tabletは、メモリ内にアクティブなMemtableを持ち、一定のサイズに達するとディスクにフラッシュされます。プロセスのOOMを防ぐため、アクティブなMemtableのメモリ使用量が高すぎる場合、早期フラッシュがトリガーされ、多くの小さなファイルが生成されてロードパフォーマンスに影響します。

## Large-scale Data Batch Loading

大量のファイルや大容量データを扱う場合、ロード失敗時の高い再試行コストを回避し、システムリソースへの影響を軽減するため、バッチでロードすることを推奨します。Broker Loadの場合、バッチあたり100GBを超えないことを推奨します。大容量のローカルデータファイルの場合、Dorisのstreamloaderツールを使用でき、これは自動的にバッチロードを実行します。

## Broker Load Concurrency

圧縮ファイル/Parquet/ORCファイル：より高い並行性を実現するため、ファイルを複数の小さなファイルに分割してロードすることを推奨します。

非圧縮CSVおよびJSONファイル：Dorisは自動的にファイルを分割し、並行してロードします。

並行性戦略については、以下を参照してください：[Broker Load 設定 Parameters](./import-way/broker-load-manual#Related-Configurations)

## Stream Load Concurrency

BEあたりのStream load並行性を128未満に保つことを推奨します（BEのwebserver_num_workersパラメータで制御）。高い並行性はwebserverスレッドの枯渇を引き起こし、ロードパフォーマンスに影響する可能性があります。特に単一BEの並行性が512を超える場合（doris_max_remote_scanner_thread_pool_thread_numパラメータ）、BEプロセスのハングを引き起こす可能性があります。
