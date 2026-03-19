---
{
  "title": "Load Best Practices の最適な手法",
  "description": "重複キーモデルの使用を優先することを推奨します。",
  "language": "ja"
}
---
## table Model Selection

Duplicate Key モデルの使用を優先することを推奨します。これは、他のモデルと比較してデータロードとクエリパフォーマンスの両方で利点を提供します。詳細については、以下を参照してください：[Data Model](../../table-design/data-model/overview)

## パーティション and バケット 構成

タブレットのサイズは1-10GBの間に保つことを推奨します。タブレットが小さすぎると集約パフォーマンスが低下し、メタデータ管理のオーバーヘッドが増加する可能性があります。タブレットが大きすぎるとレプリカの移行と修復が妨げられる可能性があります。詳細については、以下を参照してください：[Data Distribution](../../table-design/data-partitioning/data-distribution)。

## Random Bucketing

Random bucketingを使用する場合、load_to_single_tabletをtrueに設定することでシングルタブレットローディングモードを有効にできます。このモードは、大規模データロード時にデータロードの並行性とスループットを向上させ、書き込み増幅を削減できます。詳細については、以下を参照してください：Random Bucketing

## Batch Loading

クライアント側バッチング：ロード前にクライアント側でデータをバッチ化する（数MBからGBサイズ）ことを推奨します。高頻度の小規模ロードは頻繁なcompactionを引き起こし、深刻な書き込み増幅問題を招きます。
サーバー側バッチング：高並行性の小データ量ロードでは、サーバー側でバッチングを実装するために[Group Commit](group-commit-manual.md)を有効にすることを推奨します。

## パーティション Loading

一度に少数のパーティションからのみデータをロードすることを推奨します。同時に多くのパーティションからロードするとメモリ使用量が増加し、パフォーマンス問題を引き起こす可能性があります。DorisのタブレットはそれぞれメモリにアクティブなMemtableを持ち、これは一定のサイズに達するとディスクにフラッシュされます。プロセスOOMを防ぐため、アクティブなMemtableのメモリ使用量が高すぎる場合、早期フラッシュがトリガーされ、多くの小さなファイルが生成されてロードパフォーマンスに影響します。

## Large-scale Data Batch Loading

大量のファイルや大量のデータを扱う場合、ロード失敗時の高い再試行コストを避け、システムリソースへの影響を削減するために、バッチでロードすることを推奨します。Broker Loadでは、バッチあたり100GBを超えないことを推奨します。大きなローカルデータファイルの場合、Dorisのstreamloaderツールを使用でき、これは自動的にバッチロードを実行します。

## Broker Load Concurrency

圧縮ファイル/Parquet/ORCファイル：より高い並行性を実現するために、ファイルを複数の小さなファイルに分割してロードすることを推奨します。

非圧縮CSVとJSONファイル：Dorisは自動的にファイルを分割し、並行してロードします。

並行性戦略については、以下を参照してください：Broker Load 構成 パラメータ

## Stream Load Concurrency

BE あたりのStream load並行性を128未満に保つことを推奨します（BEのwebserver_num_workersパラメータで制御）。高並行性はwebserverスレッドの枯渇を引き起こし、ロードパフォーマンスに影響する可能性があります。特に単一BEの並行性が512を超える場合（doris_max_remote_scanner_thread_pool_thread_numパラメータ）、BEプロセスがハングする可能性があります。
